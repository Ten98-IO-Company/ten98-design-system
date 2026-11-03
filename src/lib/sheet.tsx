'use client';

import type { ReactNode } from 'react';
import { Alert, Dialog, cx, type DialogProps } from './primitives.js';
import { Fieldset, StatusLine } from './controls.js';

export interface SheetProps extends Omit<DialogProps, 'onOpenChange' | 'size'> {
  onClose: () => void;
  width?: 'sm' | 'md' | 'lg';
  busy?: boolean;
  /** An unknown save locks edits and closing; null, undefined and false mean absent. */
  unconfirmed?: ReactNode;
  error?: ReactNode;
  /** Header recovery controls stay outside pending form/editor fieldsets. */
  recovery?: ReactNode;
}

/** Dialog owns closing, focus and submission; the app owns save outcomes and recovery. */
export function Sheet({ onClose, width = 'md', busy = false, unconfirmed, error, recovery, onSubmit, closeDisabled = false, actions, children, className, ...props }: SheetProps) {
  const unknown = unconfirmed != null && unconfirmed !== false;
  const closeLocked = closeDisabled || busy || unknown;
  const unknownMessage = typeof unconfirmed === 'boolean' || unconfirmed === '' ? 'The save outcome is not confirmed. Check its status before making more changes.' : unconfirmed;
  return <Dialog {...props} className={cx('t98-sheet', `t98-sheet--${width}`, className)} closeDisabled={closeLocked}
    actions={actions != null || recovery != null ? <>{actions}{recovery != null && <div className="t98-sheet-recovery">{recovery}</div>}</> : undefined}
    onOpenChange={next => { if (!next && !closeLocked) onClose(); }}
    onSubmit={onSubmit ? (data, event) => { if (busy || unknown) return; return onSubmit(data, event); } : undefined}>
    {busy && <StatusLine busy>Saving changes…</StatusLine>}
    {unknown && <Alert tone="warning" title="Save status unknown" role="alert">{unknownMessage}</Alert>}
    {error != null && <Alert tone="danger" title="Changes could not be saved">{error}</Alert>}
    <Fieldset legend="Details" hideLegend disabled={busy || unknown}>{children}</Fieldset>
  </Dialog>;
}
