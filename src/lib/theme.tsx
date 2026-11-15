'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { AccountTheme } from './account-flows.js';
import { isAccountTheme, themeStorageKey } from './theme-script.js';

export type ResolvedTheme = 'light' | 'dark';
export interface ThemeOptions {
  /** The theme saved on the account. null or undefined while it is unknown: loading, signed out or unavailable. */
  value?: AccountTheme | null;
  /** Saves a choice made with setTheme, for example to the account. A rejection restores the previous theme. */
  onChange?: (theme: AccountTheme) => unknown;
  /** localStorage key; pass the same key to createThemeScript. null turns the cache off: nothing is read or written. */
  storageKey?: string | null;
}
export interface ThemeState {
  /** The theme applied to `<html data-theme>`. */
  theme: AccountTheme;
  /** What the page shows: 'system' follows prefers-color-scheme. */
  resolvedTheme: ResolvedTheme;
  /** Applies and caches a theme, then awaits onChange. Resolves whether this browser remembered it (false without a cache). */
  setTheme: (theme: AccountTheme) => Promise<boolean>;
}

// One cache per key for every hook in the tab. It also holds a choice when storage is blocked, for this tab only.
const memory = new Map<string, AccountTheme>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
function readStored(key: string): AccountTheme | null {
  const cached = memory.get(key);
  if (cached) return cached;
  try {
    const value = window.localStorage.getItem(key);
    return isAccountTheme(value) ? value : null;
  } catch { return null; }
}
function writeStored(key: string, theme: AccountTheme) {
  memory.set(key, theme);
  let remembered = true;
  try { window.localStorage.setItem(key, theme); } catch { remembered = false; }
  notify();
  return remembered;
}
// Another tab changed the cache: drop this tab's copy so the next read sees it.
function onStorage(event: StorageEvent) {
  if (event.key === null) memory.clear(); else memory.delete(event.key);
  notify();
}
function subscribeStored(listener: () => void) {
  if (!listeners.size) window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener('storage', onStorage);
  };
}

const subscribeNothing = () => () => undefined;
const nothingStored = () => null;

const darkQuery = '(prefers-color-scheme: dark)';
const prefersDark = () => typeof window.matchMedia === 'function' && window.matchMedia(darkQuery).matches;
function subscribeDark(listener: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const media = window.matchMedia(darkQuery);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
// React 18 warns about layout effects during server rendering.
const useClientLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Reads, applies and caches the light/dark/system theme on `<html data-theme>`. The account's value wins once it
 * is known; until then the cached choice applies, so pair it with createThemeScript in `<head>`. Call it once, in
 * the shell. The app keeps loading and saving the account: pass the saved value, and save in onChange.
 * With `storageKey: null` nothing is cached: an unknown value is 'system', and unmounting resets to 'system'.
 */
export function useTheme({ value, onChange, storageKey = themeStorageKey }: ThemeOptions = {}): ThemeState {
  const cached = storageKey !== null;
  const stored = useSyncExternalStore(cached ? subscribeStored : subscribeNothing, cached ? () => readStored(storageKey) : nothingStored, nothingStored);
  const dark = useSyncExternalStore(subscribeDark, prefersDark, () => false);
  // False only while hydrating server HTML: that render uses the server snapshots, not the cache the pre-paint
  // script already applied, so writing its theme would flash. React re-renders with the client snapshots next.
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const saved = isAccountTheme(value) ? value : null;
  // A choice awaiting onChange shows until the saved value changes, then the saved value applies.
  const [pending, setPending] = useState<AccountTheme>();
  const [base, setBase] = useState(saved);
  if (base !== saved) { setBase(saved); setPending(undefined); }
  const theme = (base === saved ? pending : undefined) ?? saved ?? stored ?? 'system';
  const current = useRef({ theme, onChange, storageKey });
  const calls = useRef(0);
  useClientLayoutEffect(() => {
    current.current = { theme, onChange, storageKey };
    const root = document.documentElement;
    if (hydrated && root.dataset.theme !== theme) root.dataset.theme = theme;
  });
  // Without a cache nothing paints the theme before the next load, so leave the page on the device setting.
  useClientLayoutEffect(() => () => { if (current.current.storageKey === null) document.documentElement.dataset.theme = 'system'; }, []);
  // Cache the account's value so the next load paints it before the account arrives.
  useEffect(() => { if (storageKey !== null && saved && readStored(storageKey) !== saved) writeStored(storageKey, saved); }, [saved, storageKey]);

  const setTheme = useCallback(async (next: AccountTheme) => {
    if (!isAccountTheme(next)) throw new TypeError(`Unknown theme: ${String(next)}`);
    const { theme: previous, onChange: save, storageKey: key } = current.current;
    const call = ++calls.current;
    setPending(next);
    const remembered = key !== null && writeStored(key, next);
    try {
      await save?.(next);
    } catch (error) {
      // Only the latest choice may restore; an older failure must not undo a newer one.
      if (call === calls.current) { setPending(undefined); if (key !== null) writeStored(key, previous); }
      throw error;
    }
    return remembered;
  }, []);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? (dark ? 'dark' : 'light') : theme;
  return { theme, resolvedTheme, setTheme };
}
