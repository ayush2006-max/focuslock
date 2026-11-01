// Bridge between the FocusLock dashboard (localhost:5173) and the extension.
// Relays window.postMessage <-> chrome.runtime messages. No page data is read.

const WEB_SOURCE = 'focuslock-web';
const EXT_SOURCE = 'focuslock-ext';

/**
 * Only the dashboard's documented message types are relayed. Anything else
 * (including messages from other scripts running on the page) is ignored.
 */
const ALLOWED_TYPES = new Set([
  'PING',
  'GET_STATE',
  'START_SESSION',
  'END_EARLY',
  'EMERGENCY_EXIT',
  'SESSION_COMPLETE',
  'UPDATE_SETTINGS',
]);

// The connector only runs on the FocusLock dashboard origin (localhost:5173).
const TRUSTED_ORIGIN = window.location.origin;

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window || event.origin !== TRUSTED_ORIGIN) return;
  const data = event.data as { source?: string; requestId?: string; type?: string; payload?: unknown } | null;
  if (!data || data.source !== WEB_SOURCE || typeof data.requestId !== 'string') return;
  if (typeof data.type !== 'string' || !ALLOWED_TYPES.has(data.type)) return;

  void chrome.runtime
    .sendMessage({ type: data.type, payload: data.payload })
    .then((response) => {
      window.postMessage(
        {
          source: EXT_SOURCE,
          requestId: data.requestId,
          ok: response?.ok ?? false,
          data: response?.data,
          error: response?.error,
        },
        window.location.origin,
      );
    })
    .catch((err: unknown) => {
      window.postMessage(
        {
          source: EXT_SOURCE,
          requestId: data.requestId,
          ok: false,
          error: err instanceof Error && /Extension context/i.test(err.message) ? 'extension-missing' : 'bridge-error',
        },
        window.location.origin,
      );
    });
});
