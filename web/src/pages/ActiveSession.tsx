import { useEffect, useState } from 'react';
import type { FocusStore } from '../hooks/useFocusStore';
import { useRemainingSeconds } from '../utils/timer';
import { EndSessionModal } from '../components/EscapeChallenge';
import { EmergencyExitModal } from '../components/EmergencyExitModal';

type View = 'landing' | 'setup' | 'active' | 'complete' | 'stats' | 'settings';

function ProgressRing({ fraction, children }: { fraction: number; children: React.ReactNode }) {
  const radius = 118;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative mx-auto h-64 w-64">
      <svg viewBox="0 0 264 264" className="h-full w-full -rotate-90">
        <circle cx="132" cy="132" r={radius} fill="none" strokeWidth="10"
          className="stroke-zinc-200 dark:stroke-white/10" />
        <circle
          cx="132" cy="132" r={radius} fill="none" strokeWidth="10" strokeLinecap="round"
          className="stroke-accent-500 transition-[stroke-dashoffset] duration-500 ease-linear"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, fraction)))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function ActiveSession({ store, onNavigate }: { store: FocusStore; onNavigate: (v: View) => void }) {
  const session = store.session;
  // The extension popup's "End Session" opens the dashboard pre-wired to the end flow.
  const [endModalOpen, setEndModalOpen] = useState(
    () => new URLSearchParams(window.location.search).has('endSession'),
  );
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // Consume the deep-link so back/forward does not reopen the end flow.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('endSession')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  const [ending, setEnding] = useState(false);

  const hasSession = session != null;
  const remainingSeconds = useRemainingSeconds(session ? session.sessionEndTime : 0);

  // While the escape challenge is open the timer keeps running underneath.
  useEffect(() => {
    if (remainingSeconds <= 0 && hasSession) void store.refresh();
  }, [remainingSeconds, hasSession, store]);

  if (!hasSession) return null;

  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  const fraction = session.sessionEndTime > session.sessionStartTime
    ? (remainingSeconds * 1000) / (session.sessionEndTime - session.sessionStartTime)
    : 0;

  const finishEarly = async () => {
    setEnding(true);
    const ok = await store.endEarly();
    if (ok) {
      setEndModalOpen(false);
      setEnding(false);
      onNavigate('landing');
    } else {
      setEnding(false);
    }
  };

  const doEmergency = async () => {
    await store.emergency();
    setEmergencyOpen(false);
    onNavigate('landing');
  };

  return (
    <main className="mx-auto min-h-[calc(100vh-64px)] max-w-3xl px-6 pb-16 pt-10">
      <section className="card relative overflow-hidden p-8 animate-pop sm:p-10">
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-48 animate-pulse-ring rounded-full bg-accent-500/40 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-accent-500">Focus Mode</p>

          <div className="mt-6">
            <ProgressRing fraction={fraction}>
              <span className="tabular text-5xl font-extrabold tracking-tight sm:text-6xl">
                {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
              </span>
              <span className="mt-1 text-xs uppercase tracking-widest text-zinc-400">Remaining</span>
            </ProgressRing>
          </div>

          <div className="mx-auto mt-8 max-w-sm space-y-3 text-center">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Websites blocked</span>
              <span className="tabular font-semibold">{session.blockedDomains.length}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {session.blockedDomains.map((domain) => (
                <span
                  key={domain}
                  className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
                    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {domain}
                </span>
              ))}
            </div>
            <p className="pt-2 text-sm font-medium italic text-zinc-500 dark:text-zinc-400">Stay focused.</p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button onClick={() => setEndModalOpen(true)} className="btn-secondary !border-rose-300 !text-rose-600 dark:!border-rose-500/40 dark:!text-rose-400" disabled={ending}>
              End Session
            </button>
            <button
              onClick={() => setEmergencyOpen(true)}
              className="text-xs font-medium text-zinc-400 underline-offset-4 transition hover:text-rose-500 hover:underline"
            >
              Emergency Exit
            </button>
          </div>
        </div>
      </section>

      <EndSessionModal
        open={endModalOpen}
        remainingMinutes={remainingMinutes}
        onContinue={() => setEndModalOpen(false)}
        onPassed={() => void finishEarly()}
      />
      <EmergencyExitModal
        open={emergencyOpen}
        onCancel={() => setEmergencyOpen(false)}
        onConfirm={() => void doEmergency()}
      />
    </main>
  );
}
