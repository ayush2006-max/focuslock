"use strict";
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
// The connector only runs on origins whitelisted in manifest.json. The
// dashboard origin is whatever page this script was injected into.
const TRUSTED_ORIGIN = window.location.origin;
/** Broadcast a lightweight hello so an already-open dashboard flips to
 * "Connected" immediately after the extension is installed/reloaded.
 * Handshake only — carries no session data. */
function announce() {
    window.postMessage({ source: EXT_SOURCE, kind: 'HELLO', version: chrome.runtime.getManifest().version }, window.location.origin);
}
// Retry a few times to beat script-eval ordering (web bundle may load late).
[0, 150, 500, 1500, 4000].forEach((delay) => {
    if (delay === 0) {
        announce();
    }
    else {
        window.setTimeout(announce, delay);
    }
});
window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== TRUSTED_ORIGIN)
        return;
    const data = event.data;
    if (!data || data.source !== WEB_SOURCE || typeof data.requestId !== 'string')
        return;
    if (typeof data.type !== 'string' || !ALLOWED_TYPES.has(data.type))
        return;
    void chrome.runtime
        .sendMessage({ type: data.type, payload: data.payload })
        .then((response) => {
        window.postMessage({
            source: EXT_SOURCE,
            requestId: data.requestId,
            ok: response?.ok ?? false,
            data: response?.data,
            error: response?.error,
        }, window.location.origin);
    })
        .catch((err) => {
        window.postMessage({
            source: EXT_SOURCE,
            requestId: data.requestId,
            ok: false,
            error: err instanceof Error && /Extension context/i.test(err.message) ? 'extension-missing' : 'bridge-error',
        }, window.location.origin);
    });
});
