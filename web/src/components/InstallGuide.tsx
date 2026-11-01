import { Modal } from './Modal';

/**
 * Clear installation flow for the Chrome extension. Shown whenever the
 * dashboard cannot reach the extension — the warning disappears only when the
 * extension is genuinely reachable (never hidden just for looks).
 */
export function InstallGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="install-guide-title">
      <h2 id="install-guide-title" className="text-xl font-bold">
        Install the FocusLock Extension
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Website blocking is performed by a browser extension — the web app alone cannot block
        other sites. It takes about a minute in Chrome, Edge, Brave, or another Chromium browser.
      </p>

      <ol className="mt-5 space-y-3">
        {[
          <>
            Download the source and find the <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[13px] dark:bg-white/10">extension/dist</code> folder
            (already built): <a className="font-medium text-accent-600 hover:underline dark:text-accent-300" href="https://github.com/ayush2006-max/focuslock" target="_blank" rel="noreferrer">github.com/ayush2006-max/focuslock</a>
          </>,
          <>
            Open <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[13px] dark:bg-white/10">chrome://extensions</code> in your browser.
          </>,
          <>
            Enable <span className="font-medium">Developer mode</span> (top-right toggle).
          </>,
          <>
            Click <span className="font-medium">Load unpacked</span> and select the <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[13px] dark:bg-white/10">extension/dist</code> folder.
          </>,
          <>
            Return to this page and <span className="font-medium">refresh</span> — the warning must turn into the connected state.
          </>,
        ].map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-600/10 text-xs font-bold text-accent-600 dark:text-accent-300">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
        Troubleshooting: if the warning persists, make sure the extension is enabled in
        <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5 dark:bg-white/10">chrome://extensions</code>
        (FocusLock 1.0.0), then refresh this page. The dashboard never fakes a connection —
        blocking only works through the real extension.
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="btn-primary">
          Got it
        </button>
      </div>
    </Modal>
  );
}
