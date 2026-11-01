// Small self-contained copies of shared logic so the extension builds standalone.

export interface FocusSession {
  id: string;
  sessionStartTime: number;
  sessionEndTime: number;
  durationMinutes: number;
  blockedDomains: string[];
  sessionStatus: 'active' | 'completed' | 'ended-early' | 'emergency';
}

export interface DayStat {
  date: string;
  focusMinutes: number;
  sessions: number;
}

export type StatsMap = Record<string, DayStat>;

export interface Settings {
  theme: string;
  defaultDurationMinutes: number;
  defaultBlockList: string[];
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export const SETTINGS_KEY = 'focuslock:settings';
export const SESSION_KEY = 'focuslock:session';
export const STATS_KEY = 'focuslock:stats';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  defaultDurationMinutes: 25,
  defaultBlockList: [],
  soundEnabled: true,
  notificationsEnabled: true,
};

const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;

export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;
  value = value
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .split(/[/?#]/)[0]
    .replace(/:\d+$/, '')
    .replace(/^(www|m|mobile)\./, '');
  if (!value || value.length > 253 || !DOMAIN_PATTERN.test(value)) return null;
  return value;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function getStorage<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T | undefined) ?? fallback;
}

export async function setStorage(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}
