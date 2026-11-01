// Shared types between the FocusLock dashboard and the extension.

export type SessionStatus = 'active' | 'completed' | 'ended-early' | 'emergency';

export interface FocusSession {
  id: string;
  sessionStartTime: number;
  sessionEndTime: number;
  durationMinutes: number;
  blockedDomains: string[];
  sessionStatus: SessionStatus;
}

export interface SiteEntry {
  id: string;
  domain: string;
  enabled: boolean;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface Settings {
  theme: ThemePreference;
  defaultDurationMinutes: number;
  /** Domains checked/added by the user that persist between sessions. */
  defaultBlockList: string[];
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface DayStat {
  /** Local date key: YYYY-MM-DD */
  date: string;
  focusMinutes: number;
  sessions: number;
}

export type StatsMap = Record<string, DayStat>;

/** Messages sent dashboard -> extension (relayed by the content script). */
export type BridgeRequest =
  | { type: 'PING' }
  | { type: 'GET_STATE' }
  | { type: 'START_SESSION'; session: FocusSession }
  | { type: 'END_EARLY' } // after a successful Escape Challenge
  | { type: 'EMERGENCY_EXIT' }
  | { type: 'SESSION_COMPLETE' } // backup completion trigger
  | { type: 'UPDATE_SETTINGS'; settings: Settings };

export interface BridgeResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

export interface ExtensionState {
  session: FocusSession | null;
  stats: StatsMap;
  settings: Settings;
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
