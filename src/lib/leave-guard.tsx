'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog, type ConfirmRequest } from './workspace.js';

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
  /** Wording and behaviour of the question, merged over the default "Discard unsaved changes?" prompt. Every ConfirmRequest
   * field passes through, so `{ danger: false, initialFocus: 'confirm' }` makes Enter answer "leave". */
  prompt?: Partial<ConfirmRequest>;
  /** The screen's existing `useConfirmDialog` confirm, so one dialog serves every question; `dialog` is then always null and
   * `cancel()` does nothing, since that dialog is not the guard's to close. */
  confirm?: (request: ConfirmRequest) => Promise<boolean>;
}

export interface LeaveGuard {
  /** Resolves true to stay: asks while dirty, and lets one exit started by `pass` or `leave` through unasked. For router adapters. */
  shouldBlock: () => Promise<boolean>;
  /** Asks while dirty, then runs `exit` on a yes; resolves whether it left. For the screen's own exits (Cancel, Escape, a nav item).
   * `prompt` overrides the wording for this exit, for example `{ confirmLabel: 'Discard and switch' }`. */
  leave: (exit: () => void, prompt?: Partial<ConfirmRequest>) => Promise<boolean>;
  /** Runs an exit the screen has already settled (after a save or a delete) without asking, including the navigation it starts. */
  pass: (exit: () => void) => void;
  /** Whether a question is open, including one asked through `confirm`. */
  pending: boolean;
  /** Closes an open question as "Keep editing": the waiting `leave` or `shouldBlock` resolves as staying and no exit runs.
   * For sign-out or a reload that replaces the screen. Does nothing without an open question, or when `confirm` is supplied. */
  cancel: () => void;
  /** The prompt. Render it once in the screen; null while closed or when `confirm` is supplied. */
  dialog: ReactNode;
}

/** The same question and answers as Dialog's in-dialog discard, so leaving a screen and closing an editor read alike. */
const leavePrompt: ConfirmRequest = { title: 'Discard unsaved changes?', description: 'Your changes have not been saved.', confirmLabel: 'Discard changes', cancelLabel: 'Keep editing', danger: true };
// A settled exit may land asynchronously: history.back() after a save fires its navigation after pass() has returned, while the
// screen is still dirty. So the pass lasts a moment, and the first shouldBlock consumes it, so exactly one navigation goes
// through. It also expires: an exit that starts no router navigation (local state, an app's own navigate) would otherwise
// leave the pass in place, and a later, unrelated navigation or unload would go through without asking. A transition that
// reaches shouldBlock more than 2 s after pass() asks again, so in that rare case the user is asked twice rather than losing
// work unasked.
const passWindow = 2000;
const noBlocker: LeaveGuardBlocker = () => {};

/**
 * Keeps typed work from being lost. While `dirty`, the router adapter holds in-app navigation until the user answers the shared
 * confirm prompt, `leave` asks before the screen's own exits, and reloading or closing the tab gets the browser's own warning
 * (the `beforeunload` listener exists only while dirty). Clean screens never prompt. `dirty`, `prompt` and `confirm` are read
 * when a navigation asks, not when the screen rendered. One question is open at a time: an exit or navigation attempted while
 * it is open waits for the same answer instead of opening a second dialog. Routing stays in the app: the package imports no
 * router, and the app plugs its own in through `useBlocker` or by calling `leave` from its navigation.
 */
export function useLeaveGuard(dirty: boolean, { useBlocker = noBlocker, prompt, confirm }: LeaveGuardOptions = {}): LeaveGuard {
  const latest = useRef({ dirty, prompt, confirm });
  latest.current = { dirty, prompt, confirm };
  const passUntil = useRef(0);
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [pending, setPending] = useState(false);
  const question = useRef<Promise<boolean> | null>(null);
  const answer = useRef<((leave: boolean) => void) | null>(null);
  const settle = useCallback((leave: boolean) => {
    const resolve = answer.current;
    answer.current = null;
    setRequest(null);
    resolve?.(leave);
  }, []);
  // An unmounted screen must not leave a navigation waiting: answer an open question with "stay".
  useEffect(() => () => settle(false), [settle]);
  const ask = useCallback((override?: Partial<ConfirmRequest>): Promise<boolean> => {
    const current = latest.current;
    if (!current.dirty) return Promise.resolve(true);
    if (question.current) return question.current;
    const next = { ...leavePrompt, ...current.prompt, ...override };
    const asked = current.confirm ? current.confirm(next) : new Promise<boolean>(resolve => { answer.current = resolve; setRequest(next); });
    setPending(true);
    const shared = asked.finally(() => { if (question.current === shared) { question.current = null; setPending(false); } });
    question.current = shared;
    return shared;
  }, []);
  const cancel = useCallback(() => settle(false), [settle]);
  const pass = useCallback((exit: () => void) => { passUntil.current = Date.now() + passWindow; exit(); }, []);
  const shouldBlock = useCallback(async () => {
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
  const dialog = request && <ConfirmDialog open title={request.title} description={request.description} confirmLabel={request.confirmLabel}
    cancelLabel={request.cancelLabel} danger={request.danger} confirmationText={request.confirmationText} acknowledgement={request.acknowledgement}
    initialFocus={request.initialFocus} onConfirm={() => settle(true)} onOpenChange={open => { if (!open) settle(false); }} />;
  return { shouldBlock, leave, pass, pending, cancel, dialog };
}
