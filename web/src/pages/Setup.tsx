import { useEffect, useState } from 'react';
import { PRESET_GROUPS } from '@shared/presets';
import { formatDuration } from '@shared/utils';
import type { FocusSession, SiteEntry } from '@shared/types';
import type { FocusStore } from '../hooks/useFocusStore';
import { SiteListEditor } from '../components/SiteListEditor';
import { isExtensionAvailable } from '../utils/bridge';
import { Toast, type ToastMessage } from '../components/Toast';

type View = 'landing' | 'setup' | 'active' | 'complete' | 'stats' | 'settings';

const DURATIONS = [15, 30, 45, 60];
const MIN_MINUTES = 5;
const MAX_MINUTES = 480;

function newId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function Setup({ store, onNavigate }: { store: FocusStore; onNavigate: (v: View) => void }) {
  const [selected, setSelected] = useState<SiteEntry[]>([]);
  const [durationChoice, setDurationChoice] = useState<number | 'custom'>(store.settings.defaultDurationMinutes);
  const [customMinutes, setCustomMinutes] = useState(Math.max(MIN_MINUTES, store.settings.defaultDurationMinutes));
  const [extensionOk, setExtensionOk] = useState<boolean | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    void isExtensionAvailable().then(setExtensionOk);
  }, []);

  const minutes =
    durationChoice === 'custom' ? customMinutes : durationChoice;
  const validDuration = Number.isFinite(minutes) && minutes >= MIN_MINUTES && minutes <= MAX_MINUTES;
  const enabledDomains = [...new Set(selected.filter((s) => s.enabled).map((s) => s.domain))];

  const togglePresetDomain = (domain: string) => {
    setSelected((prev) =>
      prev.some((s) => s.domain === domain)
        ? prev.filter((s) => s.domain !== domain)
        : [...prev, { id: newId(), domain, enabled: true }],
    );
  };

  const start = async () => {
    if (!extensionOk || !validDuration || enabledDomains.length === 0) return;
    setStarting(true);
    const session: FocusSession = {
      id: newId(),
      sessionStartTime: Date.now(),
      sessionEndTime: Date.now() + minutes * 60_000,
      durationMinutes: minutes,
      blockedDomains: enabledDomains,
      sessionStatus: 'active',
    };
    const ok = await store.start(session);
    if (ok) {
      onNavigate('active');
    } else {
      setStarting(false);
      setToast({
        id: Date.now(),
        kind: 'error',
        text: 'Could not start: the FocusLock extension is not connected. Install it or reload this page.',
      });
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 pb-20 pt-10">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <button onClick={() => onNavigate('landing')} className="text-sm font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100">
        ‹ Back
      </button>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Start Focus Session</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: duration + sites */}
        <div className="space-y-6">
          <section className="card p-6 animate-fade-up">
            <h2 className="font-semibold">How long do you want to focus?</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDurationChoice(d)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    durationChoice === d
                      ? 'border-accent-600 bg-accent-600/10 text-accent-600 dark:border-accent-400 dark:bg-accent-400/10 dark:text-accent-300'
                      : 'border-zinc-200 hover:border-accent-400 dark:border-white/10 dark:hover:border-accent-400/50'
                  }`}
                >
                  {d === 60 ? '1 hour' : `${d} min`}
                </button>
              ))}
              <button
                onClick={() => setDurationChoice('custom')}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                  durationChoice === 'custom'
                    ? 'border-accent-600 bg-accent-600/10 text-accent-600 dark:border-accent-400 dark:bg-accent-400/10 dark:text-accent-300'
                    : 'border-zinc-200 hover:border-accent-400 dark:border-white/10 dark:hover:border-accent-400/50'
                }`}
              >
                Custom
              </button>
            </div>
            {durationChoice === 'custom' && (
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="number"
                  min={MIN_MINUTES}
                  max={MAX_MINUTES}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="input tabular w-32 text-center text-lg font-bold"
                />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  minutes (5 min – 8 h)
                </span>
              </div>
            )}
            {!validDuration && durationChoice === 'custom' && (
              <p className="mt-2 text-xs font-medium text-rose-500">Choose between {MIN_MINUTES} and {MAX_MINUTES} minutes.</p>
            )}
          </section>

          <section className="card p-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
            <h2 className="font-semibold">Choose what to block</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Nothing is blocked unless you select it. Pick a preset or add your own websites.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {PRESET_GROUPS.map((group) => (
                <div key={group.id}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.domains.map((domain) => {
                      const active = selected.some((s) => s.domain === domain);
                      return (
                        <button
                          key={domain}
                          onClick={() => togglePresetDomain(domain)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            active
                              ? 'border-accent-600 bg-accent-600 text-white shadow shadow-accent-600/30'
                              : 'border-zinc-200 text-zinc-600 hover:border-accent-400 hover:text-accent-600 dark:border-white/10 dark:text-zinc-300'
                          }`}
                          aria-pressed={active}
                        >
                          {active && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
                              <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {domain}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-zinc-200/70 pt-5 dark:border-white/10">
              <SiteListEditor sites={selected} onChange={setSelected} />
            </div>
          </section>
        </div>

        {/* Right: preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card animate-fade-up border-accent-500/25 p-6" style={{ animationDelay: '140ms' }}>
            <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-accent-600/10 to-fuchsia-500/10 py-6 text-center">
              <div>
                <div className="tabular text-4xl font-extrabold text-accent-600 dark:text-accent-300">
                  {formatDuration(minutes)}
                </div>
                <p className="mt-1 text-xs uppercase tracking-widest text-zinc-400">ready to be protected</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
              You are about to start a <span className="font-semibold">{formatDuration(minutes)}</span> Focus Session.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Websites blocked</span>
                <span className="font-semibold tabular">{enabledDomains.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Duration</span>
                <span className="font-semibold">{formatDuration(minutes)}</span>
              </div>
            </div>

            <button
              onClick={start}
              disabled={!extensionOk || !validDuration || enabledDomains.length === 0 || starting}
              className="btn-primary mt-5 w-full"
            >
              {starting ? 'Starting…' : 'Start Focus'}
            </button>

            {extensionOk === false ? (
              <p className="mt-3 text-xs font-medium text-rose-500">
                The FocusLock extension is not connected. Install it (see README) or reload — website blocking will not work otherwise.
              </p>
            ) : enabledDomains.length === 0 ? (
              <p className="mt-3 text-xs text-zinc-400">Select at least one website to block.</p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
