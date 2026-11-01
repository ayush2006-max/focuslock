import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExtensionState, FocusSession, Settings } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/types';
import { computeStreak, dayKey, formatDuration } from '@shared/utils';
import {
  endSessionEarly,
  emergencyExit,
  getExtensionState,
  isExtensionAvailable,
  startExtensionSession,
  syncSettings,
} from '../utils/bridge';

const SETTINGS_LOCAL_KEY = 'focuslock:settings';
const COMPLETED_SEEN_KEY = 'focuslock:completedSeen';

export interface TodaySummary {
  focusTime: string;
  sessions: number;
  streak: number;
}

function loadLocalSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_LOCAL_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

export function useFocusStore() {
  const [extensionAvailable, setExtensionAvailable] = useState<boolean | null>(null);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [stats, setStats] = useState<Record<string, { focusMinutes: number; sessions: number }>>({});
  const [settings, setSettings] = useState<Settings>(loadLocalSettings);
  const [completedSession, setCompletedSession] = useState<FocusSession | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const refresh = useCallback(async () => {
    const available = await isExtensionAvailable(true);
    setExtensionAvailable(available);
    if (!available) {
      setSession(null);
      setStats({});
      return;
    }
    const state: ExtensionState | null = await getExtensionState();
    if (state) {
      setStats(state.stats);
      const prevSession = sessionRef.current;
      // Detect an automatic completion performed by the extension.
      if (state.session && state.session.sessionStatus !== 'active') {
        setSession(null);
        const seen = localStorage.getItem(COMPLETED_SEEN_KEY);
        if (seen !== state.session.id && state.session.sessionStatus === 'completed') {
          localStorage.setItem(COMPLETED_SEEN_KEY, state.session.id);
          setCompletedSession(state.session);
        }
      } else if (state.session && state.session.sessionStatus === 'active') {
        // Session was started outside this tab (e.g. another dashboard tab).
        if (!prevSession || prevSession.id !== state.session.id) setSession(state.session);
      } else if (!state.session) {
        setSession(null);
      }
      // Merge remote settings (extension may hold newer preference values).
      if (state.settings) {
        const merged = { ...loadLocalSettings(), ...state.settings, theme: loadLocalSettings().theme };
        setSettings(merged);
      }
    }
  }, []);

  const sessionRef = useRef<FocusSession | null>(null);
  sessionRef.current = session;

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Keep in sync while a session runs, and when the tab regains focus.
  useEffect(() => {
    if (!session) return;
    const interval = window.setInterval(refresh, 5000);
    return () => window.clearInterval(interval);
  }, [session, refresh]);

  const persistLocalSettings = useCallback((next: Settings) => {
    localStorage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(next));
    void syncSettings(next);
  }, []);

  const start = useCallback(
    async (candidate: FocusSession): Promise<boolean> => {
      const available = await isExtensionAvailable(true);
      setExtensionAvailable(available);
      if (!available) return false;
      if (candidate.blockedDomains.length === 0) return false;
      const ok = await startExtensionSession(candidate);
      if (ok) {
        setSession(candidate);
        localStorage.removeItem(COMPLETED_SEEN_KEY);
        setCompletedSession(null);
      }
      return ok;
    },
    [],
  );

  const endEarly = useCallback(async () => {
    const ok = await endSessionEarly();
    if (ok) {
      setSession(null);
      await refresh();
    }
    return ok;
  }, [refresh]);

  const emergency = useCallback(async () => {
    const ok = await emergencyExit();
    if (ok) {
      setSession(null);
      await refresh();
    }
    return ok;
  }, [refresh]);

  const dismissCompletion = useCallback(() => setCompletedSession(null), []);

  const summaryFor = useCallback(
    (statsMap: typeof stats): TodaySummary => {
      const today = statsMap[dayKey()] ?? { focusMinutes: 0, sessions: 0 };
      return {
        focusTime: formatDuration(today.focusMinutes),
        sessions: today.sessions,
        streak: computeStreak(statsMap),
      };
    },
    [],
  );

  return {
    extensionAvailable,
    session,
    stats,
    settings,
    completedSession,
    setSettings: persistLocalSettings,
    start,
    endEarly,
    emergency,
    refresh,
    dismissCompletion,
    summaryFor,
  };
}

export type FocusStore = ReturnType<typeof useFocusStore>;
