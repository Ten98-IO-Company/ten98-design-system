// No 'use client': server layouts and build configs read these values as plain strings.
import type { AccountTheme } from './account-flows.js';

/** localStorage key under which useTheme caches the theme for the pre-paint script. */
export const themeStorageKey = 'ten98-theme';

export const isAccountTheme = (value: unknown): value is AccountTheme => value === 'system' || value === 'light' || value === 'dark';

/**
 * The classic inline script that sets `<html data-theme>` from the cached theme before the first paint, so a dark
 * theme never flashes light while the app and account load. Put it first in `<head>`. Under a nonce CSP it needs
 * the response's nonce: TanStack Start adds `ssr.nonce` to `head().scripts`, and a server that rewrites `<script`
 * tags covers an index.html. Without a nonce policy (a client-only page, dev mode) it needs none. It falls back to
 * 'system' when nothing valid is cached or storage is blocked. Pass the same storageKey as useTheme; with
 * `storageKey: null` there is no cache and no script.
 *
 * It acts once per document. Routers may re-insert head scripts on client navigation (TanStack Start does); a re-run
 * after first paint must not overwrite the theme useTheme has applied since, so later runs do nothing. It marks the
 * document with `document.__ten98Theme`, so an element named `__ten98Theme` (`<img name>`, `<form name>`) already in
 * the document when it first runs would make it do nothing; that cannot happen when it is first in `<head>`, as above.
 *
 * With the default key the script text is 228 characters. An app that allows it by CSP hash rather than nonce must
 * recompute the hash whenever an upgrade changes the text, as the run-once guard above did.
 */
export function createThemeScript(storageKey = themeStorageKey) {
  // Escaping the less-than sign keeps a key from closing the inline script element.
  const key = JSON.stringify(storageKey).replaceAll('<', '\\u003c');
  return `(function(){if(document.__ten98Theme)return;document.__ten98Theme=1;var t='system';try{var s=localStorage.getItem(${key});if(s==='light'||s==='dark'||s==='system')t=s}catch(e){}document.documentElement.dataset.theme=t})()`;
}
