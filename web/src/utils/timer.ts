import { useEffect, useState } from 'react';
import { formatClock } from '@shared/utils';

const TICK_MS = 250;

/**
 * Compute remaining seconds from an end timestamp, re-syncing whenever the tab
 * becomes visible again (timers are throttled in background tabs).
 */
export function useRemainingSeconds(endTime: number): number {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
    update();
    const interval = window.setInterval(update, TICK_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') update();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', update);
    };
  }, [endTime]);

  return remaining;
}

export function remainingClock(endTime: number): string {
  return formatClock(Math.ceil(Math.max(0, (endTime - Date.now()) / 1000)));
}
