import { computeStreak, dayKey, formatDuration } from '@shared/utils';
import type { FocusStore } from '../hooks/useFocusStore';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function lastSevenDays(): { key: string; label: string; isToday: boolean }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: dayKey(d), label: WEEKDAYS[d.getDay()], isToday: i === 6 };
  });
}

export function StatsPage({ store }: { store: FocusStore }) {
  const stats = store.stats;
  const today = stats[dayKey()] ?? { focusMinutes: 0, sessions: 0 };
  const days = lastSevenDays();
  const weekMinutes = days.reduce((sum, d) => sum + (stats[d.key]?.focusMinutes ?? 0), 0);
  const totalMinutes = Object.values(stats).reduce((sum, d) => sum + d.focusMinutes, 0);
  const totalSessions = Object.values(stats).reduce((sum, d) => sum + d.sessions, 0);
  const streak = computeStreak(stats);
  const maxMinutes = Math.max(60, ...days.map((d) => stats[d.key]?.focusMinutes ?? 0));

  const cards = [
    { label: 'Today', value: formatDuration(today.focusMinutes) },
    { label: 'This Week', value: formatDuration(weekMinutes) },
    { label: 'Sessions', value: String(totalSessions) },
    { label: 'Current Streak', value: `${streak} day${streak === 1 ? '' : 's'}` },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 pb-20 pt-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Your Focus</h1>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card card-hover p-6 animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{c.label}</p>
            <p className="tabular mt-2 text-3xl font-extrabold">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="card mt-6 p-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Last 7 days</h2>
          <span className="text-xs text-zinc-400">total focus per day</span>
        </div>
        <div className="mt-6 flex h-44 items-end gap-3 sm:gap-5">
          {days.map((d) => {
            const minutes = stats[d.key]?.focusMinutes ?? 0;
            const height = minutes === 0 ? 4 : Math.max(8, Math.round((minutes / maxMinutes) * 100));
            return (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
                <span className="tabular text-[10px] font-medium text-zinc-400">
                  {minutes > 0 ? formatDuration(minutes) : ''}
                </span>
                <div
                  className={`w-full max-w-12 rounded-t-lg transition-all duration-500 ${
                    d.isToday
                      ? 'bg-gradient-to-t from-accent-600 to-accent-400'
                      : 'bg-accent-600/30 dark:bg-accent-400/30'
                  }`}
                  style={{ height: `${height}%` }}
                  role="img"
                  aria-label={`${d.label}: ${minutes} minutes`}
                />
                <span className={`text-xs font-medium ${d.isToday ? 'text-accent-600 dark:text-accent-300' : 'text-zinc-400'}`}>
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card mt-6 p-6 animate-fade-up" style={{ animationDelay: '160ms' }}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Total Focus Time</h2>
          <span className="tabular text-lg font-bold">{formatDuration(totalMinutes)}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Collected locally on this device. FocusLock never records your browsing history.
        </p>
      </section>
    </main>
  );
}
