// No 'use client': server layouts and build configs read these values as plain strings.
import type { AccountTheme } from './account-flows.js';

/** localStorage key under which useTheme caches the theme for the pre-paint script. */
export const themeStorageKey = 'ten98-theme';

export const isAccountTheme = (value: unknown): value is AccountTheme => value === 'system' || value === 'light' || value === 'dark';

/**
 * The classic inline script that sets `<html data-theme>` from the cached theme before the first paint, so a dark
 * theme never flashes light while the app and account load. Put it first in `<head>` with the page's CSP nonce; it
 * falls back to 'system' when nothing is cached or storage is blocked. Pass the same storageKey as useTheme.
 */
export function createThemeScript(storageKey = themeStorageKey) {
  // < keeps a key from closing the inline script element.
  const key = JSON.stringify(storageKey).replaceAll('<', '\\u003c');
  return `(function(){var t='system';try{var s=localStorage.getItem(${key});if(s==='light'||s==='dark'||s==='system')t=s}catch(e){}document.documentElement.dataset.theme=t})()`;
}
