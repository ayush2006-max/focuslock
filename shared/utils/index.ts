// Shared utilities. Small enough to be duplicated by the extension build.

const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;

/**
 * Normalize a user-entered website into a bare registrable-ish domain.
 * Accepts "https://www.youtube.com/watch?v=x", "m.reddit.com", "YouTube.COM/"
 * and returns "youtube.com" / "reddit.com".
 */
export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;

  value = value
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '') // strip protocol
    .split(/[/?#]/)[0] // strip path/query/fragment
    .replace(/:\d+$/, ''); // strip port

  // Strip common subdomain prefixes the user copies while browsing.
  value = value.replace(/^(www|m|mobile)\./, '');

  if (!value || value.length > 253 || !DOMAIN_PATTERN.test(value)) return null;
  return value;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const hours = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
}

export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Consecutive days with at least one session, ending today (or yesterday if today is empty yet). */
export function computeStreak(stats: Record<string, { sessions: number }>): number {
  const hasSessions = (key: string) => (stats[key]?.sessions ?? 0) > 0;
  const cursor = new Date();
  if (!hasSessions(dayKey(cursor))) {
    // today not started yet: streak can still be counted up to yesterday
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (hasSessions(dayKey(cursor)) && streak < 366) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
