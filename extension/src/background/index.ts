import {
  DEFAULT_SETTINGS,
  SESSION_KEY,
  SETTINGS_KEY,
  STATS_KEY,
  dayKey,
  getStorage,
  normalizeDomain,
  setStorage,
  type FocusSession,
  type Settings,
  type StatsMap,
} from '../lib/core';

const RULE_ID_BASE = 1000;
const MAX_RULES = 200;
const END_ALARM = 'focuslock-session-end';
const COMPLETE_FALLBACK_ALARM = 'focuslock-complete-check';

// ---------------------------------------------------------------------------
// Session storage
// ---------------------------------------------------------------------------

async function getSession(): Promise<FocusSession | null> {
  return getStorage<FocusSession | null>(SESSION_KEY, null);
}

async function saveSession(session: FocusSession | null): Promise<void> {
  await setStorage(SESSION_KEY, session);
}

async function getSettings(): Promise<Settings> {
  return getStorage<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}

// ---------------------------------------------------------------------------
// Statistics (day-keyed local record; never any browsing data)
// ---------------------------------------------------------------------------

async function recordStat(minutes: number): Promise<void> {
  if (minutes <= 0) return;
  const stats = await getStorage<StatsMap>(STATS_KEY, {});
  const key = dayKey();
  const day = stats[key] ?? { date: key, focusMinutes: 0, sessions: 0 };
  day.focusMinutes += minutes;
  day.sessions += 1;
  stats[key] = day;
  await setStorage(STATS_KEY, stats);
}

// ---------------------------------------------------------------------------
// Blocking rules (declarativeNetRequest dynamic rules)
// ---------------------------------------------------------------------------

function buildBlockRules(session: FocusSession, extensionUrlBase: string) {
  const blockedUrl = `${extensionUrlBase}/blocked/blocked.html`;
  return session.blockedDomains.slice(0, MAX_RULES).map((domain, index) => ({
    id: RULE_ID_BASE + index,
    priority: 1,
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ['main_frame' as chrome.declarativeNetRequest.ResourceType],
    },
    action: {
      type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
      redirect: {
        url: `${blockedUrl}?domain=${encodeURIComponent(domain)}&end=${session.sessionEndTime}`,
      },
    },
  }));
}

async function applyBlockRules(session: FocusSession): Promise<void> {
  const urlBase = chrome.runtime.getURL('');
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rangeIds(),
    addRules: buildBlockRules(session, urlBase),
  });
}

async function clearBlockRules(): Promise<void> {
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: rangeIds() });
}

function rangeIds(): number[] {
  return Array.from({ length: MAX_RULES }, (_, i) => RULE_ID_BASE + i);
}

// ---------------------------------------------------------------------------
// Alarms
// ---------------------------------------------------------------------------

async function scheduleCompletionAlarm(endTime: number): Promise<void> {
  await chrome.alarms.create(END_ALARM, { when: endTime });
  // Backup check a bit after the end, in case the main alarm misfires.
  await chrome.alarms.create(COMPLETE_FALLBACK_ALARM, { when: endTime + 30_000 });
}

async function cancelCompletionAlarms(): Promise<void> {
  await chrome.alarms.clear(END_ALARM);
  await chrome.alarms.clear(COMPLETE_FALLBACK_ALARM);
}

/** End the session: clear blocking, persist the outcome, optionally notify. */
async function finishSession(
  status: 'completed' | 'ended-early' | 'emergency',
  session: FocusSession,
): Promise<FocusSession> {
  await clearBlockRules();
  await cancelCompletionAlarms();

  const elapsedMs = Date.now() - session.sessionStartTime;
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60_000));

  if (status === 'completed') {
    const finished: FocusSession = { ...session, sessionStatus: 'completed' };
    await setStorage(SESSION_KEY, finished);
    await recordStat(
      Math.min(session.durationMinutes, Math.max(1, Math.round((session.sessionEndTime - session.sessionStartTime) / 60_000))),
    );
    const settings = await getSettings();
    if (settings.notificationsEnabled) {
      chrome.notifications.create(`focuslock-complete-${session.id}`, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: 'FocusLock',
        message: `Focus session complete — ${session.durationMinutes} min. Great work!`,
      });
    }
    return finished;
  }

  if (status === 'ended-early') {
    const finished: FocusSession = { ...session, sessionStatus: 'ended-early' };
    await setStorage(SESSION_KEY, finished);
    await recordStat(Math.min(elapsedMinutes, session.durationMinutes));
    return finished;
  }

  // Emergency exit: stop everything, do not count toward statistics.
  await saveSession(null);
  return { ...session, sessionStatus: 'emergency' };
}

/** Called on startup / alarm when the timer may have reached zero. */
async function checkCompletion(): Promise<void> {
  const session = await getSession();
  if (!session || session.sessionStatus !== 'active') return;
  if (Date.now() >= session.sessionEndTime) {
    await finishSession('completed', session);
  } else {
    // Service worker restarted: single dynamic rules survive, but re-apply to be safe.
    await applyBlockRules(session);
    await scheduleCompletionAlarm(session.sessionEndTime);
  }
}

// ---------------------------------------------------------------------------
// Message handler (requests validated + relayed from the dashboard bridge)
// ---------------------------------------------------------------------------

function makeSessionFromCandidate(candidate: FocusSession): FocusSession | null {
  // Prefer the extension's own clock as the single source of truth.
  if (
    !candidate ||
    typeof candidate.id !== 'string' ||
    typeof candidate.sessionStartTime !== 'number' ||
    typeof candidate.sessionEndTime !== 'number' ||
    !Array.isArray(candidate.blockedDomains)
  ) {
    return null;
  }
  const now = Date.now();
  const intendedDurationMs = candidate.sessionEndTime - Math.max(candidate.sessionStartTime, now);
  if (intendedDurationMs <= 0) return null;
  // Anchor the session clock to the extension's own time so the countdown
  // cannot drift between dashboard and extension.
  const sessionStartTime = now;
  const sessionEndTime = now + intendedDurationMs;
  const durationMinutes = Math.max(1, Math.round(intendedDurationMs / 60_000));

  const domains = [
    ...new Set(
      candidate.blockedDomains
        .filter((d): d is string => typeof d === 'string')
        .map((d) => normalizeDomain(d))
        .filter((d): d is string => d !== null),
    ),
  ];
  if (domains.length === 0) return null;

  return {
    id: candidate.id,
    sessionStartTime,
    sessionEndTime,
    durationMinutes,
    blockedDomains: domains,
    sessionStatus: 'active',
  };
}

interface BridgeEnvelope {
  type: string;
  payload?: unknown;
}

async function handleMessage(env: BridgeEnvelope): Promise<Record<string, unknown>> {
  switch (env.type) {
    case 'PING':
      return { ok: true, data: { version: chrome.runtime.getManifest().version, at: Date.now() } };

    case 'GET_STATE': {
      const [session, stats, settings] = await Promise.all([
        getSession(),
        getStorage<StatsMap>(STATS_KEY, {}),
        getSettings(),
      ]);
      return { ok: true, data: { session, stats, settings } };
    }

    case 'START_SESSION': {
      const existing = await getSession();
      if (existing && existing.sessionStatus === 'active' && existing.sessionEndTime > Date.now()) {
        return { ok: false, error: 'A Focus Session is already active. Finish it before starting a new one.' };
      }
      const session = makeSessionFromCandidate(env.payload as FocusSession);
      if (!session) return { ok: false, error: 'The focus session details are invalid.' };
      await saveSession(session);
      await applyBlockRules(session);
      await scheduleCompletionAlarm(session.sessionEndTime);
      return { ok: true, data: session };
    }

    case 'END_EARLY': {
      const session = await getSession();
      if (!session || session.sessionStatus !== 'active') return { ok: true, data: null };
      // Only allow ending early once the Escape Challenge has passed (time sanity check not sent here;
      // the dashboard flow performs it, and the timer keeps running during the challenge).
      await finishSession('ended-early', session);
      return { ok: true, data: null };
    }

    case 'EMERGENCY_EXIT': {
      const session = await getSession();
      if (session && session.sessionStatus === 'active') {
        await finishSession('emergency', session);
      } else {
        await clearBlockRules();
        await cancelCompletionAlarms();
      }
      return { ok: true, data: null };
    }

    case 'SESSION_COMPLETE': {
      await checkCompletion();
      return { ok: true, data: null };
    }

    case 'UPDATE_SETTINGS': {
      const incoming = env.payload as Partial<Settings> | undefined;
      if (!incoming || typeof incoming !== 'object') return { ok: false, error: 'Invalid settings.' };
      const current = await getSettings();
      const merged: Settings = {
        ...current,
        ...incoming,
        theme: current.theme, // theme preference lives with the dashboard
      };
      await setStorage(SETTINGS_KEY, merged);
      return { ok: true, data: merged };
    }

    default:
      return { ok: false, error: 'Unknown message type.' };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void handleMessage(message as BridgeEnvelope).then(sendResponse);
  return true; // keep the channel open for the async response
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === END_ALARM || alarm.name === COMPLETE_FALLBACK_ALARM) {
    void checkCompletion();
  }
});

chrome.runtime.onStartup.addListener(() => void checkCompletion());

chrome.runtime.onInstalled.addListener(() => {
  void (async () => {
    const settings = await getStorage<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
    if (!(SETTINGS_KEY in (await chrome.storage.local.get(SETTINGS_KEY)))) {
      await setStorage(SETTINGS_KEY, settings);
    }
    await checkCompletion();
  })();
});
