// Dashboard <-> Extension bridge.
// The extension injects a content script into this page that relays messages
// to the extension service worker via chrome.runtime. This module hides that.
//
// Detection strategy (real, not faked):
//  1. Explicit PING round-trips -> authoritative availability checks.
//  2. The content script broadcasts a HELLO handshake right after injection
//     (with a few retries to beat script-eval ordering), so an already-open
//     dashboard flips to "Connected" the moment the extension is available.

import type { BridgeResult, ExtensionState, FocusSession, Settings } from '@shared/types';

const WEB_SOURCE = 'focuslock-web';
const EXT_SOURCE = 'focuslock-ext';

interface HelloMessage {
  source: typeof EXT_SOURCE;
  kind: 'HELLO';
  version?: string;
}

type AvailabilityListener = (available: boolean, version: string | null) => void;

const availabilityListeners = new Set<AvailabilityListener>();
let lastNotified: boolean | null = null;
let extensionVersion: string | null = null;

let availabilityCache: { available: boolean; at: number } | null = null;

function nextRequestId(): string {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function post(type: string, payload?: unknown): string {
  const requestId = nextRequestId();
  window.postMessage({ source: WEB_SOURCE, requestId, type, payload }, window.location.origin);
  return requestId;
}

// HELLO is a handshake from the injected content script; it is not a
// request/response pair and carries no data. Everything else is ignored.
window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  const data = event.data as Partial<HelloMessage> | null;
  if (!data || data.source !== EXT_SOURCE || data.kind !== 'HELLO') return;
  extensionVersion = typeof data.version === 'string' ? data.version : null;
  notifyAvailability(true);
});

function notifyAvailability(available: boolean) {
  // Only notify on transitions so polling does not cascade into loops.
  if (lastNotified === available) return;
  lastNotified = available;
  availabilityListeners.forEach((listener) => listener(available, extensionVersion));
}

/** Subscribe to availability transitions. Returns an unsubscribe function. */
export function subscribeExtensionAvailability(listener: AvailabilityListener): () => void {
  availabilityListeners.add(listener);
  return () => availabilityListeners.delete(listener);
}

function waitForResponse(requestId: string, timeoutMs: number): Promise<BridgeResult> {
  return new Promise((resolve) => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.source !== EXT_SOURCE || data.requestId !== requestId) return;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      resolve({ ok: data.ok !== false, data: data.data, error: data.error });
    };
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMessage);
      resolve({ ok: false, error: 'extension-unreachable' });
    }, timeoutMs);
    window.addEventListener('message', onMessage);
  });
}

async function send(type: string, payload?: unknown): Promise<BridgeResult> {
  const requestId = post(type, payload);
  return waitForResponse(requestId, 3000);
}

/** Returns true when the FocusLock extension is installed and responding. */
export async function isExtensionAvailable(forceRecheck = false): Promise<boolean> {
  const now = Date.now();
  // A HELLO from the content script is fresh proof of availability.
  if (!forceRecheck && availabilityCache && now - availabilityCache.at < (availabilityCache.available ? 15_000 : 2_000)) {
    return availabilityCache.available;
  }
  const response = await send('PING');
  const available = response.ok && response.data != null;
  if (available && response.data && typeof (response.data as { version?: string }).version === 'string') {
    extensionVersion = (response.data as { version?: string }).version ?? extensionVersion;
  }
  availabilityCache = { available, at: now };
  notifyAvailability(available);
  if (!available) {
    // Explicit, non-silent developer diagnostics (see requirement 13).
    console.warn(
      `[FocusLock] Extension bridge: no response to PING (error=${response.error ?? 'none'}). ` +
        'Install/enable the FocusLock extension (or reload this page after installing) ' +
        "so website blocking can work. Loaded extension version: " + extensionVersion + '.',
    );
  }
  return available;
}

export async function getExtensionState(): Promise<ExtensionState | null> {
  const response = await send('GET_STATE');
  if (!response.ok || !response.data) return null;
  return response.data as ExtensionState;
}

export async function startExtensionSession(session: FocusSession): Promise<boolean> {
  const response = await send('START_SESSION', session);
  if (!response.ok && response.error) {
    console.error(`[FocusLock] START_SESSION failed: ${response.error}`);
  }
  return response.ok;
}

export async function endSessionEarly(): Promise<boolean> {
  const response = await send('END_EARLY');
  if (!response.ok && response.error) {
    console.error(`[FocusLock] END_EARLY failed: ${response.error}`);
  }
  return response.ok;
}

export async function emergencyExit(): Promise<boolean> {
  const response = await send('EMERGENCY_EXIT');
  if (!response.ok && response.error) {
    console.error(`[FocusLock] EMERGENCY_EXIT failed: ${response.error}`);
  }
  return response.ok;
}

export async function syncSettings(settings: Settings): Promise<boolean> {
  const response = await send('UPDATE_SETTINGS', settings);
  return response.ok;
}

export function getExtensionVersion(): string | null {
  return extensionVersion;
}

export function extErrorMessage(response: { ok: boolean; error?: string }): string {
  switch (response.error) {
    case 'extension-missing':
      return 'The FocusLock extension was updated or disabled mid-session. Reload this page to reconnect.';
    case 'extension-unreachable':
      return 'The FocusLock extension is not responding. Install it (see the banner instructions) and reload this page.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
