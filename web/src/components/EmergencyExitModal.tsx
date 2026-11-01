import { Modal } from './Modal';

/** Global fail-safe. Never possible to permanently lock the user out. */
export function EmergencyExitModal({ open, onCancel, onConfirm }: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} labelledBy="emergency-title">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M12 9v4m0 4h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 id="emergency-title" className="mt-4 text-xl font-bold">
        Emergency Exit
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        This will immediately stop your current Focus Session. All blocked websites become accessible again.
        Use this only if you genuinely need it — it does not count toward your statistics.
      </p>
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
        <button onClick={onConfirm} className="btn-danger flex-1">
          Stop Focus Session
        </button>
        <button onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </Modal>
  );
}
