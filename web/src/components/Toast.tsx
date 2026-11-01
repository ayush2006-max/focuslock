import { useEffect } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  kind: 'info' | 'error' | 'success';
}

export function Toast({ toast, onClose }: { toast: ToastMessage | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-6">
      <div
        role="status"
        className={`pointer-events-auto animate-pop rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${
          toast.kind === 'error'
            ? 'border-rose-300 bg-rose-50/95 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/90 dark:text-rose-200'
            : toast.kind === 'success'
              ? 'border-emerald-300 bg-emerald-50/95 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/90 dark:text-emerald-200'
              : 'border-accent-300 bg-white/95 text-zinc-800 dark:border-accent-500/30 dark:bg-surface-850/95 dark:text-zinc-100'
        }`}
      >
        {toast.text}
      </div>
    </div>
  );
}
