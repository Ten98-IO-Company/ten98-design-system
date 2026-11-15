'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useConfirmDialog, type ConfirmRequest } from './workspace.js';

/**
 * A router adapter: a hook that holds the app's in-app navigation while `shouldBlock()` resolves true. useLeaveGuard calls it
 * as a hook on every render of the guarded screen, so it must never change between renders: define it once at module level,
 * and never switch it on, off or to another adapter while the screen is mounted, since that changes the hook order. With TanStack Router:
 * `const useRouterBlocker: LeaveGuardBlocker = shouldBlock => { useBlocker({ shouldBlockFn: shouldBlock, enableBeforeUnload: false }); };`
 */
export type LeaveGuardBlocker = (shouldBlock: () => Promise<boolean>) => void;

export interface LeaveGuardOptions {
  /** The router adapter, the same module-level hook on every render. Without one, only the screen's own exits (`leave`) and the browser's unload are guarded. */
  useBlocker?: LeaveGuardBlocker;
  /** Wording of the question, merged over the default "Discard unsaved changes?" prompt. */
  prompt?: Partial<ConfirmRequest>;
  /** The screen's existing `useConfirmDialog` confirm, so one dialog serves every question; `dialog` is then always null. */
  confirm?: (request: ConfirmRequest) => Promise<boolean>;
}

export interface LeaveGuard {
  /** Resolves true to stay: asks while dirty, and lets one exit started by `pass` or `leave` through unasked. For router adapters. */
  shouldBlock: () => Promise<boolean>;
  /** Asks while dirty, then runs `exit` on a yes; resolves whether it left. For the screen's own exits (Cancel, Escape, a nav item). */
  leave: (exit: () => void, prompt?: Partial<ConfirmRequest>) => Promise<boolean>;
  /** Runs an exit the screen has already settled (after a save or a delete) without asking, including the navigation it starts. */
  pass: (exit: () => void) => void;
  /** The prompt. Render it once in the screen; null while closed or when `confirm` is supplied. */
  dialog: ReactNode;
}

/** The same question and answers as Dialog's in-dialog discard, so leaving a screen and closing an editor read alike. */
const leavePrompt: ConfirmRequest = { title: 'Discard unsaved changes?', description: 'Your changes have not been saved.', confirmLabel: 'Discard changes', cancelLabel: 'Keep editing', danger: true };
// A settled exit may land asynchronously (a history step, a router transition), so the pass lasts a moment, not just one
// synchronous call. It also expires: an exit that starts no router navigation (local state, an app's own navigate) would
// otherwise leave the pass in place, and a later, unrelated navigation or unload would go through without asking. A
// transition that reaches shouldBlock more than 2 s after pass() asks again, so in that rare case the user is asked
// twice rather than losing work unasked.
const passWindow = 2000;
const noBlocker: LeaveGuardBlocker = () => {};

/**
 * Keeps typed work from being lost. While `dirty`, the router adapter holds in-app navigation until the user answers the shared
 * confirm prompt, `leave` asks before the screen's own exits, and reloading or closing the tab gets the browser's own warning
 * (the `beforeunload` listener exists only while dirty). Clean screens never prompt. Routing stays in the app: the package
 * imports no router, and the app plugs its own in through `useBlocker` or by calling `leave` from its navigation.
 */
export function useLeaveGuard(dirty: boolean, { useBlocker = noBlocker, prompt, confirm }: LeaveGuardOptions = {}): LeaveGuard {
  const [ownConfirm, dialog] = useConfirmDialog();
  const latest = useRef({ dirty, prompt, confirm: confirm ?? ownConfirm });
  latest.current = { dirty, prompt, confirm: confirm ?? ownConfirm };
  const passUntil = useRef(0);
  const ask = useCallback(async (override?: Partial<ConfirmRequest>) => {
    const current = latest.current;
    return !current.dirty || current.confirm({ ...leavePrompt, ...current.prompt, ...override });
  }, []);
  const pass = useCallback((exit: () => void) => { passUntil.current = Date.now() + passWindow; exit(); }, []);
  const shouldBlock = useCallback(async () => {
    // One passed exit goes through; a later, unrelated navigation is asked about again.
    if (passUntil.current > Date.now()) { passUntil.current = 0; return false; }
    return !await ask();
  }, [ask]);
  const leave = useCallback(async (exit: () => void, override?: Partial<ConfirmRequest>) => {
    if (!await ask(override)) return false;
    pass(exit);
    return true;
  }, [ask, pass]);
  useBlocker(shouldBlock);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (passUntil.current > Date.now()) return;
      event.preventDefault();
      // Older Chromium and Safari show the warning only when returnValue is set.
      event.returnValue = true;
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return { shouldBlock, leave, pass, dialog: confirm ? null : dialog };
}
