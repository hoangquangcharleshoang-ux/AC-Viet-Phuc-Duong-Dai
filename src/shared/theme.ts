/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Theme Management Module (Light / Dark / System)
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'ac_theme';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY);
    if (val === 'light' || val === 'dark' || val === 'system') {
      return val;
    }
  } catch (_) {}
  return 'light';
}

export function applyTheme(mode: ThemeMode): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (_) {}

  const isDark =
    mode === 'dark' ||
    (mode === 'system' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  return isDark;
}
