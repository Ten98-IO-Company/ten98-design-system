'use client';

import { useEffect, useRef, type ComponentProps, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { Alert, Button } from './primitives.js';
import { FormActions, Heading, Link, Stack, Text, type LinkProps } from './structure.js';
import { ConfirmDialog } from './workspace.js';
import type { AuthAction, PasswordPolicy } from './auth-flows.js';
import type { FlowState } from './settings-base.js';

/* Internal building blocks shared by the authentication, account and workspace flows: one frame, one single-submit
 * guard, one date formatter and one action control. Not exported from the package entry point. */

/** Deterministic across servers and browsers: English, UTC, medium date. Unparseable values are shown as given. */
const flowDateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' });
export const formatFlowDate = (value: string | Date) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : flowDateFormat.format(date);
};

/** Runs the handler once at a time so a double activation cannot send two requests. */
export function useSingleSubmit() {
  const pending = useRef(false);
  return async (action: () => void | Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    try { await action(); } finally { pending.current = false; }
  };
}

/** A string form value, or '' when the field is absent or a file. */
export const formText = (data: FormData, name: string) => {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
};

export const passwordHint = (policy: PasswordPolicy) => policy.hint ?? `Use at least ${policy.minLength} characters.`;

/** Table settings shared by every flow list: a short, static, stacked-on-narrow table. */
export const staticTable = { searchable: false, sortable: false, pagination: false, responsive: 'stack' } as const;

export function HiddenInputs({ fields }: { fields?: Record<string, string> }) {
  return <>{Object.entries(fields ?? {}).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}</>;
}

export type LabelledAction = AuthAction & { label?: string };
const emailOf = (button: HTMLElement) => {
  const form = (button as HTMLButtonElement).form;
  const value = form ? new FormData(form).get('email') : null;
  return typeof value === 'string' ? value : '';
};
/** A link or button for a secondary action. A callback receives the email typed so far, or '' when the form has none. */
export function FlowActionControl({ action, label, linkComponent, variant, size = 'sm' }: { action: AuthAction; label: string; linkComponent?: LinkProps['component']; variant: 'ghost' | 'secondary'; size?: ComponentProps<typeof Button>['size'] }) {
  if (action.href !== undefined) return <Link href={action.href} variant="standalone" component={linkComponent}>{label}</Link>;
  const { onClick } = action;
  return <Button type="button" variant={variant} size={size} onClick={(event: MouseEvent<HTMLButtonElement>) => onClick(emailOf(event.currentTarget))}>{label}</Button>;
}

export interface FlowFrameProps extends Pick<FlowState, 'busy' | 'error' | 'unconfirmed' | 'notice' | 'disabled' | 'fieldErrors'> {
  /** Wraps the content in a form. The frame records the attempt so a failure moves focus to the error or first invalid field. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /** Native post targets; omit them when `onSubmit` handles the request. */
  action?: string;
  method?: 'get' | 'post';
  /** Posted with the form. */
  hiddenFields?: Record<string, string>;
  children: ReactNode;
}
/** The form part of every flow: outcome messages, a fieldset that locks busy or read-only flows, and focus on a new failure. */
export function FlowFrame({ busy = false, error, unconfirmed, notice, disabled = false, fieldErrors, onSubmit, action, method, hiddenFields, children }: FlowFrameProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const submitted = useRef(false);
  const previousError = useRef(error);
  const fieldKey = JSON.stringify(fieldErrors ?? {});

  useEffect(() => {
    const changed = error !== previousError.current;
    previousError.current = error;
    if (busy) return;
    const root = rootRef.current;
    // An error that arrives without a submit (for example after a row action) takes focus, but never from a field
    // the person is typing in: that would move focus unexpectedly mid-edit.
    const active = typeof document === 'undefined' ? null : document.activeElement;
    const editing = active instanceof HTMLElement && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName));
    const target = error
      ? (submitted.current || (changed && !editing)) ? root?.querySelector<HTMLElement>('.t98-flow-error') : null
      : submitted.current ? root?.querySelector<HTMLElement>('[aria-invalid=true]') : null;
    target?.focus();
  }, [error, fieldKey, busy]);

  const body = <>
    {notice && <Alert className="t98-flow-feedback" tone={notice.tone} title={notice.text} />}
    {unconfirmed && <Alert className="t98-flow-feedback" tone="warning" role="alert" title={unconfirmed} />}
    {error && <Alert className="t98-flow-feedback t98-flow-error" tone="danger" title={error} tabIndex={-1} />}
    <fieldset className="t98-flow-fieldset" disabled={busy || disabled}>{children}</fieldset>
  </>;
  return <div ref={rootRef}>{onSubmit
    ? <form aria-busy={busy || undefined} action={action} method={method} onSubmit={event => { submitted.current = true; onSubmit(event); }}><HiddenInputs fields={hiddenFields} />{body}</form>
    : <div aria-busy={busy || undefined}>{body}</div>}</div>;
}

export interface SettingsFlowProps extends FlowState {
  title: string;
  description?: string;
  children: ReactNode;
  /** Wraps the content in a form; omit for read-mostly flows. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /** Native post targets for a form handled by `onSubmit` without `preventDefault`. */
  action?: string;
  method?: 'get' | 'post';
  /** Submit label; omit when the flow has its own action buttons. */
  submitLabel?: string;
  submitDisabled?: boolean;
  extraActions?: ReactNode;
}
/** A labelled settings section: heading and description above the shared frame, with an optional submit row.
 * The public `SettingsPanel` delegates here, so applications and the library's own flows share this one implementation. */
export function SettingsFlow({ title, description, busyLabel, onSubmit, action, method, submitLabel, submitDisabled, extraActions, children, hideTitle = false, ...state }: SettingsFlowProps) {
  return <section className="t98-settings-flow" aria-label={title}>
    <Stack gap={4}>
      {(!hideTitle || description) && <Stack gap={1}>
        {!hideTitle && <Heading level={2} size="md">{title}</Heading>}
        {description && <Text tone="muted" size="sm">{description}</Text>}
      </Stack>}
      <FlowFrame {...state} onSubmit={onSubmit} action={action} method={method}>
        <Stack gap={4}>
          {children}
          {(submitLabel || extraActions) && <FormActions>
            {submitLabel && <Button type="submit" loading={state.busy} disabled={submitDisabled}>{state.busy && busyLabel ? busyLabel : submitLabel}</Button>}
            {extraActions}
          </FormActions>}
        </Stack>
      </FlowFrame>
    </Stack>
  </section>;
}

/** A confirmation for a row the person picked; the row's name leads the description. */
export function TargetConfirm<T>({ target, onClose, title, description, subject, confirmLabel, onConfirm }: {
  target: T | undefined; onClose: () => void; title: string; description: string; subject: (target: T) => string; confirmLabel: string; onConfirm: (target: T) => void | Promise<void>;
}) {
  return <ConfirmDialog open={target !== undefined} onOpenChange={open => { if (!open) onClose(); }} title={title} description={target ? `${subject(target)}. ${description}` : description} confirmLabel={confirmLabel} danger
    onConfirm={() => target ? onConfirm(target) : undefined} />;
}
