import type { FocusSession } from '@shared/types';
import { formatDuration } from '@shared/utils';

type View = 'landing' | 'setup' | 'active' | 'complete' | 'stats' | 'settings';

export function Completion({ session, onNavigate, onDismiss }: {
  session: FocusSession | null;
  onNavigate: (v: View) => void;
  onDismiss: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-3xl flex-col items-center justify-center px-6 pb-16">
      <div className="card w-full max-w-xl p-10 text-center animate-pop">
        <div className="mx-auto flex h-16 w-16 animate-pulse-ring items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/40 to-accent-500/40 blur-[1px]" aria-hidden>
          <span className="text-3xl">🎉</span>
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Focus Session Complete</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Amazing work. You focused for:</p>
        <p className="tabular mt-3 bg-gradient-to-r from-accent-500 to-fuchsia-500 bg-clip-text text-5xl font-extrabold text-transparent">
          {session ? formatDuration(session.durationMinutes) : '—'}
        </p>

        <div className="mt-8 rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Websites blocked</span>
            <span className="tabular font-semibold">{session?.blockedDomains.length ?? 0}</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-400">
            {session?.blockedDomains.join(' · ') || 'No websites were selected.'}
          </p>
          <p className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            You completed your session. Every site is unblocked again.
          </p>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => {
              onDismiss();
              onNavigate('setup');
            }}
            className="btn-primary"
          >
            Start Another Session
          </button>
          <button
            onClick={() => {
              onDismiss();
              onNavigate('stats');
            }}
            className="btn-secondary"
          >
            View Statistics
          </button>
        </div>
      </div>
    </main>
  );
}
