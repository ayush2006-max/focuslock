import type { FocusStore } from '../hooks/useFocusStore';

type View = 'landing' | 'setup' | 'active' | 'complete' | 'stats' | 'settings';

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M12 2l1.9 5.6L19.5 9.5 13.9 11.4 12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2Zm6.5 10.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z" />
    </svg>
  );
}

export function Landing({ store, onNavigate }: { store: FocusStore; onNavigate: (v: View) => void }) {
  const summary = store.summaryFor(store.stats);
  const busy = store.session != null;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl flex-col px-6 pb-16">
      {/* Hero */}
      <section className="mt-14 flex flex-col items-center text-center animate-fade-up sm:mt-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-500/25 bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-600 dark:text-accent-300">
          <SparkIcon />
          Local-first · Nothing leaves your device
        </span>
        <h1 className="mt-5 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Focus on{' '}
          <span className="bg-gradient-to-r from-accent-500 to-fuchsia-500 bg-clip-text text-transparent">
            what matters.
          </span>
        </h1>
        <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">Block distractions. Start focusing.</p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <button onClick={() => onNavigate(busy ? 'active' : 'setup')} className="btn-primary px-8 text-base">
            {busy ? 'Return to Focus Session' : 'Start Focus Session'}
          </button>
          <button onClick={() => onNavigate('stats')} className="btn-secondary px-5">
            View Statistics
          </button>
        </div>

        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
          Blocking is handled by the FocusLock browser extension — nothing else gets touched.
        </p>
      </section>

      {/* Today summary */}
      <section className="mt-14 grid animate-fade-up-slow gap-4 sm:grid-cols-3" style={{ animationDelay: '120ms' }}>
        {[
          { label: 'Focus Time', value: summary.focusTime },
          { label: 'Sessions Completed', value: String(summary.sessions) },
          { label: 'Current Streak', value: `${summary.streak} day${summary.streak === 1 ? '' : 's'}` },
        ].map((item) => (
          <div key={item.label} className="card card-hover p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{item.label}</p>
            <p className="tabular mt-2 text-3xl font-extrabold">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 animate-fade-up-slow" style={{ animationDelay: '260ms' }}>
        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h3 className="font-semibold">How FocusLock works</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Pick exactly which websites distract you, choose a duration, and start. The extension blocks those
              sites until your timer runs out.
            </p>
          </div>
          <ol className="grid gap-2 text-sm text-zinc-500 dark:text-zinc-400 sm:grid-cols-3">
            {['Choose sites + duration', 'Block + focus', 'Countdown → done'].map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-600/10 text-xs font-bold text-accent-600 dark:text-accent-300">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
