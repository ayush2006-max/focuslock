import { useCallback, useEffect, useState } from 'react';
import type { ThemePreference } from '@shared/types';

const STORAGE_KEY = 'focuslock:theme';

function applyTheme(pref: ThemePreference) {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = pref === 'dark' || (pref === 'system' && systemDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  });

  const setTheme = useCallback((pref: ThemePreference) => {
    setThemeState(pref);
    localStorage.setItem(STORAGE_KEY, pref);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyTheme('system');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  return { theme, setTheme };
}
