// Dashboard <-> Extension bridge.
// The extension injects a content script into this page that relays messages
// to the extension service worker via chrome.runtime. This module hides that.

import type { BridgeResult, ExtensionState, FocusSession, Settings } from '@shared/types';

const WEB_SOURCE = 'focuslock-web';
const EXT_SOURCE = 'focuslock-ext';

let availabilityCache: { available: boolean; at: number } | null = null;

function nextRequestId(): string {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function post(type: string, payload?: unknown): string {
  const requestId = nextRequestId();
  window.postMessage({ source: WEB_SOURCE, requestId, type, payload }, window.location.origin);
  return requestId;
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
  if (!forceRecheck && availabilityCache && now - availabilityCache.at < 15_000) {
    return availabilityCache.available;
  }
  const response = await send('PING');
  const available = response.ok && response.data != null;
  availabilityCache = { available, at: now };
  return available;
}

export async function getExtensionState(): Promise<ExtensionState | null> {
  const response = await send('GET_STATE');
  if (!response.ok || !response.data) return null;
  return response.data as ExtensionState;
}

export async function startExtensionSession(session: FocusSession): Promise<boolean> {
  const response = await send('START_SESSION', session);
  return response.ok;
}

export async function endSessionEarly(): Promise<boolean> {
  const response = await send('END_EARLY');
  return response.ok;
}

export async function emergencyExit(): Promise<boolean> {
  const response = await send('EMERGENCY_EXIT');
  return response.ok;
}

export async function syncSettings(settings: Settings): Promise<boolean> {
  const response = await send('UPDATE_SETTINGS', settings);
  return response.ok;
}

/** Fallback stats storage for when the extension is not installed. */
export async function getErrorMessage(response: { ok: boolean; error?: string }): Promise<string> {
  switch (response.error) {
    case 'extension-unreachable':
      return 'The FocusLock extension is not responding. Reload this page and make sure it is installed and enabled.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
