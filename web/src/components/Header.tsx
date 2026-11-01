import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { InstallGuide } from './InstallGuide';

type View = 'landing' | 'setup' | 'active' | 'complete' | 'stats' | 'settings';

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center rounded-xl border border-zinc-200 bg-white/70 p-0.5 dark:border-white/10 dark:bg-white/5">
      {(
        [
          ['light', 'Light'],
          ['dark', 'Dark'],
          ['system', 'Auto'],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            theme === value
              ? 'bg-accent-600 text-white shadow'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Header({ view, onNavigate, activeSession, extensionAvailable, extensionVersion }: {
  view: View;
  onNavigate: (view: View) => void;
  activeSession: boolean;
  extensionAvailable: boolean | null;
  extensionVersion?: string | null;
}) {
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-surface-50/80 backdrop-blur-md dark:border-white/5 dark:bg-surface-950/75">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3.5">
        <button onClick={() => onNavigate('landing')} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-lg shadow-accent-600/30">
            <LockIcon className="h-5 w-5" />
          </span>
          <span className="text-[15px] font-bold tracking-tight">FocusLock</span>
        </button>

        <nav className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => onNavigate('stats')}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition hover:bg-zinc-900/5 dark:hover:bg-white/5 ${
              view === 'stats' ? 'text-accent-600 dark:text-accent-300' : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition hover:bg-zinc-900/5 dark:hover:bg-white/5 ${
              view === 'settings' ? 'text-accent-600 dark:text-accent-300' : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            Settings
          </button>
          <div className="mx-1.5 hidden h-6 w-px bg-zinc-200 sm:block dark:bg-white/10" />
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </nav>

        {activeSession && (
          <button
            onClick={() => onNavigate('active')}
            className="ml-2 flex items-center gap-2 rounded-full bg-accent-600/10 px-3 py-1.5 text-xs font-semibold text-accent-600 ring-1 ring-accent-600/30 dark:text-accent-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-500" />
            </span>
            Focus Mode
          </button>
        )}
        {extensionAvailable === true && (
          <span
            className="ml-2 hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 sm:flex dark:text-emerald-400"
            title={extensionVersion ? `FocusLock extension v${extensionVersion}` : 'FocusLock extension connected'}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Connected
            {extensionVersion ? <span className="font-normal opacity-70">v{extensionVersion}</span> : null}
          </span>
        )}
      </div>

      {extensionAvailable === false && (
        <div className="flex flex-col items-center justify-center gap-2 border-t border-amber-200/70 bg-amber-50 px-6 py-2.5 text-center text-xs text-amber-800 sm:flex-row dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <span>
            The FocusLock browser extension is not connected — website blocking is unavailable until it is installed and enabled.
          </span>
          <button
            onClick={() => setInstallGuideOpen(true)}
            className="shrink-0 rounded-lg bg-amber-500/15 px-2.5 py-1 font-semibold text-amber-800 underline-offset-2 transition hover:bg-amber-500/25 dark:text-amber-200"
          >
            How to install
          </button>
        </div>
      )}
      <InstallGuide open={installGuideOpen} onClose={() => setInstallGuideOpen(false)} />
    </header>
  );
}
