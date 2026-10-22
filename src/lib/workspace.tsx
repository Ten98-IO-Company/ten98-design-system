'use client';

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Alert, Button, Checkbox, Dialog, Field, Icon, Input, Select, cx, type Tone } from './primitives.js';
import { addDays, inclusiveDays } from './dates.js';

export interface ProductOption { id: string; name: string; description?: string }
/** Native scope selection; the consumer handles navigation and data changes. */
export function ProductSwitcher({ products, value, onValueChange, label = 'Product', disabled }: { products: readonly ProductOption[]; value: string; onValueChange: (value: string) => void; label?: string; disabled?: boolean }) {
  const id = useId();
  return <Field label={label} htmlFor={id}><Select value={value} disabled={disabled} onChange={event => onValueChange(event.target.value)}>{products.map(product => <option key={product.id} value={product.id}>{product.name}{product.description ? ` — ${product.description}` : ''}</option>)}</Select></Field>;
}

export interface DateRange { start: string; end: string }
export interface DateRangeFieldProps extends DateRange {
  label: string;
  /** Called on every edit, even with an invalid range; `problem` is the message the field shows, or null when the range is valid. */
  onChange: (range: DateRange, problem: string | null) => void;
  disabled?: boolean;
  /** Earliest and latest selectable dates (ISO). */
  min?: string;
  max?: string;
  /** Longest allowed range in days, counting both the first and last day. */
  maxDays?: number;
  /** `end` is the day after the last included day, as in half-open [start, end) APIs. The field shows and edits the last included day. */
  endExclusive?: boolean;
  /** App message shown in place of the built-in checks, for example from server validation. */
  error?: ReactNode;
}
type RangeLimits = Pick<DateRangeFieldProps, 'min' | 'max' | 'maxDays'>;
/** Why a range with an inclusive end is invalid, or null. */
function rangeProblem(start: string, lastDay: string, { min, max, maxDays }: RangeLimits) {
  const days = start && lastDay ? inclusiveDays(start, lastDay) : NaN;
  if (start && lastDay && start > lastDay) return 'End date must be on or after the start date.';
  if (min && start && start < min) return `Start on or after ${min}.`;
  if (max && lastDay && lastDay > max) return `End on or before ${max}.`;
  if (maxDays !== undefined && Number.isFinite(days) && days > maxDays) return `Choose at most ${maxDays} ${maxDays === 1 ? 'day' : 'days'}; this range has ${days}.`;
  return null;
}
/** ISO date-only values; no timezone conversion or invented presets. Every edit is reported, even an invalid range: the
 * field then shows why it is invalid and marks the inputs, and the app decides whether to accept it. */
export function DateRangeField({ label, start, end, onChange, disabled, min, max, maxDays, endExclusive = false, error }: DateRangeFieldProps) {
  const id = useId();
  const limits = { min, max, maxDays };
  // The visible end is always the last included day.
  const lastDayOf = (value: string) => endExclusive && value ? addDays(value, -1) : value;
  const shownEnd = lastDayOf(end);
  const problem = error ?? rangeProblem(start, shownEnd, limits);
  function report(range: DateRange) { onChange(range, rangeProblem(range.start, lastDayOf(range.end), limits)); }
  const errorId = `${id}-error`;
  const invalid = problem != null || undefined;
  return <fieldset className="t98-date-range" aria-describedby={problem != null ? errorId : undefined}><legend>{label}</legend><div className="t98-date-range-fields">
    <Field label="Start date" htmlFor={`${id}-start`}><Input type="date" value={start} min={min} max={shownEnd || max} disabled={disabled} aria-invalid={invalid} aria-describedby={problem != null ? errorId : undefined} onChange={event => report({ start: event.target.value, end })}/></Field>
    <Field label={endExclusive ? 'Last day included' : 'End date'} htmlFor={`${id}-end`}><Input type="date" value={shownEnd} min={start || min} max={max} disabled={disabled} aria-invalid={invalid} aria-describedby={problem != null ? errorId : undefined}
      onChange={event => { const value = event.target.value; report({ start, end: endExclusive && value ? addDays(value, 1) : value }); }}/></Field>
  </div>{problem != null && <p className="t98-field-error" id={errorId} role="alert">{problem}</p>}</fieldset>;
}

export interface CopyButtonMessages {
  /** Shown in the status region after a successful copy. */
  copied: string;
  /** Shown when neither clipboard route worked; the text is then selected in a visible field. */
  copyFailed: string;
  /** Accessible name of that field. */
  select: string;
}
const copyMessages: CopyButtonMessages = { copied: 'Copied', copyFailed: 'Copy failed. The text is selected: copy it manually.', select: 'Select and copy' };

/* The legacy route for pages without the async clipboard (the approach of clipboard-copy, MIT): select a hidden textarea
 * and run the copy command, then restore focus to the control that was used. */
function legacyCopy(text: string) {
  const previous = document.activeElement as HTMLElement | null;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.insetBlockStart = '0';
  document.body.appendChild(area);
  area.select();
  try { return document.execCommand('copy'); } catch { return false; } finally { area.remove(); previous?.focus(); }
}

/** Copies with the async Clipboard API, then the legacy command; if both fail the value is selected in a visible field. */
export function CopyButton({ value, label = 'Copy', messages }: { value: string; label?: string; messages?: Partial<CopyButtonMessages> }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const manual = useRef<HTMLInputElement>(null);
  const text = { ...copyMessages, ...messages };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (status === 'manual') { manual.current?.focus(); manual.current?.select(); } }, [status]);
  async function copy() {
    clearTimeout(timer.current);
    let copied: boolean;
    try { await navigator.clipboard.writeText(value); copied = true; } catch { copied = legacyCopy(value); }
    setStatus(copied ? 'copied' : 'manual');
    // The manual notice stays until the next attempt so the person can finish copying.
    if (copied) timer.current = setTimeout(() => setStatus('idle'), 2500);
  }
  return <span className="t98-copy-control"><Button variant="secondary" size="sm" onClick={copy}><Icon name={status === 'copied' ? 'check' : 'copy'} size={14}/>{label}</Button><span role="status">{status === 'copied' ? text.copied : status === 'manual' ? text.copyFailed : ''}</span>
    {status === 'manual' && <Input ref={manual} className="t98-copy-manual" aria-label={text.select} value={value} readOnly autoComplete="off" onFocus={event => event.currentTarget.select()}/>}</span>;
}

/** Presentation only: this does not encrypt a value already sent to the browser. */
export function SecretField({ label, value }: { label: string; value: string }) {
  const id = useId(); const [visible, setVisible] = useState(false);
  return <div className="t98-secret-control"><Field label={label} htmlFor={id}><Input id={id} type={visible ? 'text' : 'password'} value={value} readOnly autoComplete="off"/></Field><Button variant="secondary" aria-label={`${visible ? 'Hide' : 'Show'} ${label}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</Button></div>;
}

export interface ReviewAcknowledgement { id: string; label: ReactNode }
export interface ReviewConfirmProps {
  title: string;
  /** What will happen: counts, targets, cost or a preview. */
  children?: ReactNode;
  /** Each must be checked before confirming. Checks reset whenever `reviewKey` changes. */
  acknowledgements: readonly ReviewAcknowledgement[];
  /** Identifies what is being reviewed, for example the audience id plus the message revision. A new key clears every check. */
  reviewKey: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  /** App-owned pending state; confirming is ignored while busy. */
  busy?: boolean;
  /** Why confirming is unavailable regardless of the checks, for example missing permission. */
  disabledReason?: ReactNode;
  /** Outcome of a failed confirm, shown in the panel. */
  error?: ReactNode;
  /** Moves focus to the panel's heading when it mounts, for a review step that replaces the control that opened it. */
  autoFocus?: boolean;
  className?: string;
}

/** An inline, non-modal review step before a consequential action. Confirm stays focusable (aria-disabled) and always
 * says why it is unavailable; checks are bound to `reviewKey`, so changing the target forces a fresh review. */
export function ReviewConfirm({ title, children, acknowledgements, reviewKey, confirmLabel, onConfirm, onCancel, cancelLabel = 'Cancel', tone = 'default', busy = false, disabledReason, error, autoFocus = false, className }: ReviewConfirmProps) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (autoFocus) heading.current?.focus(); }, [autoFocus]);
  const [review, setReview] = useState<{ key: string; checked: ReadonlySet<string> }>({ key: reviewKey, checked: new Set() });
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  // Derived reset: a new target invalidates every earlier acknowledgement, during render rather than after a paint.
  const stale = review.key !== reviewKey;
  if (stale) setReview({ key: reviewKey, checked: new Set() });
  const checked = stale ? new Set<string>() : review.checked;
  const [changed, setChanged] = useState(false);
  const firstKey = useRef(reviewKey);
  useEffect(() => { if (reviewKey !== firstKey.current) setChanged(true); }, [reviewKey]);
  const missing = acknowledgements.filter(item => !checked.has(item.id)).length;
  const locked = busy || pending;
  const reason = disabledReason ?? (locked ? 'Working…' : missing ? (acknowledgements.length === 1 ? 'Check the item above to continue.' : missing === acknowledgements.length ? `Check all ${acknowledgements.length} items above to continue.` : `Check the remaining ${missing === 1 ? 'item' : `${missing} items`} above to continue.`) : null);
  async function confirm() {
    if (reason != null || running.current) return;
    running.current = true; setPending(true);
    try { await onConfirm(); } finally { running.current = false; setPending(false); }
  }
  return <section className={cx('t98-review-confirm', tone === 'danger' && 't98-review-confirm--danger', className)} aria-labelledby={`${id}-title`} aria-busy={locked || undefined}>
    <h3 className="t98-review-confirm-title" id={`${id}-title`} ref={heading} tabIndex={autoFocus ? -1 : undefined}>{title}</h3>
    {children != null && <div className="t98-review-confirm-summary">{children}</div>}
    {acknowledgements.length > 0 && <fieldset className="t98-review-confirm-checks" disabled={locked}>
      <legend className="t98-visually-hidden">Confirm before continuing</legend>
      {acknowledgements.map(item => <Checkbox key={`${reviewKey}:${item.id}`} label={item.label} checked={checked.has(item.id)} onChange={event => {
        const next = new Set(checked);
        if (event.target.checked) next.add(item.id); else next.delete(item.id);
        setReview({ key: reviewKey, checked: next }); setChanged(false);
      }} />)}
    </fieldset>}
    <p className="t98-visually-hidden" role="status">{changed ? 'What you are reviewing changed. Check each item again.' : ''}</p>
    {error != null && <Alert tone="danger" title={`${confirmLabel} did not complete`}>{error}</Alert>}
    <div className="t98-review-confirm-actions">
      <Button variant={tone === 'danger' ? 'danger' : 'primary'} aria-disabled={reason != null || undefined} aria-describedby={reason != null ? `${id}-reason` : undefined} aria-busy={locked || undefined} onClick={() => { void confirm(); }}>{confirmLabel}</Button>
      {onCancel && <Button variant="secondary" disabled={locked} onClick={onCancel}>{cancelLabel}</Button>}
      {reason != null && <p className="t98-review-confirm-reason" id={`${id}-reason`}>{reason}</p>}
    </div>
  </section>;
}

export interface ConfirmRequest {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Text the user must type to confirm, for example the resource name. */
  confirmationText?: string;
  /** A required checkbox label. */
  acknowledgement?: string;
}

/**
 * Promise-style confirmation over ConfirmDialog: `const [confirm, dialog] = useConfirmDialog()`, render `dialog`, then
 * `if (await confirm({ title, description })) …`. The dialog only collects the decision; callers keep their own request,
 * retry and error handling after it closes. The promise resolves `true` on confirm and `false` on cancel, on Escape, when a
 * newer request replaces it, and when the component unmounts. Focus returns to the control that was focused when the
 * dialog opened (the Dialog's own focus return). `defaults` apply to every request, for example `{ danger: true }`.
 */
export function useConfirmDialog(defaults: Partial<ConfirmRequest> = {}): [(request: ConfirmRequest) => Promise<boolean>, ReactNode] {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const answer = useRef<((confirmed: boolean) => void) | null>(null);
  const settle = useCallback((confirmed: boolean) => { const resolve = answer.current; answer.current = null; resolve?.(confirmed); }, []);
  // An unmounted caller must not wait forever: answer any open request with false.
  useEffect(() => () => settle(false), [settle]);
  const confirm = useCallback((next: ConfirmRequest) => new Promise<boolean>(resolve => { settle(false); answer.current = resolve; setRequest(next); }), [settle]);
  const merged = request && { ...defaults, ...request };
  const dialog = merged && <ConfirmDialog open title={merged.title} description={merged.description} confirmLabel={merged.confirmLabel} cancelLabel={merged.cancelLabel}
    danger={merged.danger} confirmationText={merged.confirmationText} acknowledgement={merged.acknowledgement}
    onConfirm={() => settle(true)} onOpenChange={open => { if (!open) { settle(false); setRequest(null); } }} />;
  return [confirm, dialog];
}

export interface ConfirmDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string;
  onConfirm: () => void | Promise<void>; confirmLabel?: string; danger?: boolean; confirmationText?: string;
  /** Body content shown above the actions. */
  children?: ReactNode;
  /** Adds a required checkbox with this label; confirm stays disabled until it is checked. */
  acknowledgement?: string;
  /** Label of the button that closes without confirming, for example "Keep editing". */
  cancelLabel?: string;
}
/** Blocks closing while a mutation is pending; rejected mutations stay open for retry. */
export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, confirmLabel = 'Confirm', danger = false, confirmationText, children, acknowledgement, cancelLabel = 'Cancel' }: ConfirmDialogProps) {
  const id = useId(); const [input, setInput] = useState(''); const [acknowledged, setAcknowledged] = useState(false); const [pending, setPending] = useState(false); const [error, setError] = useState(''); const busy = useRef(false);
  useEffect(() => { if (open) { setInput(''); setAcknowledged(false); setError(''); } }, [open]);
  const blocked = (!!confirmationText && input !== confirmationText) || (!!acknowledgement && !acknowledged);
  async function confirm() {
    if (busy.current || blocked) return;
    busy.current = true; setPending(true); setError('');
    try { await onConfirm(); onOpenChange(false); } catch { setError('The action could not be completed. Try again.'); } finally { busy.current = false; setPending(false); }
  }
  return <Dialog open={open} onOpenChange={next => { if (!busy.current) onOpenChange(next); }} closeDisabled={pending} title={title} description={description} footer={<><Button variant="secondary" disabled={pending} onClick={() => onOpenChange(false)}>{cancelLabel}</Button><Button variant={danger ? 'danger' : 'primary'} loading={pending} disabled={blocked} onClick={confirm}>{confirmLabel}</Button></>}>
    {children}
    {acknowledgement && <Checkbox label={acknowledgement} required checked={acknowledged} disabled={pending} onChange={event => setAcknowledged(event.target.checked)}/>}
    {confirmationText ? <Field label={`Type ${confirmationText} to confirm`} htmlFor={id}><Input value={input} autoComplete="off" disabled={pending} onChange={event => setInput(event.target.value)}/></Field> : !children && !acknowledgement && <p className="t98-confirm-hint">Review this action before continuing.</p>}
    {error && <Alert tone="danger" title={error}/>}
  </Dialog>;
}

type ToastApi = { toast: (message: string, tone?: Tone) => void };
const ToastContext = createContext<ToastApi | null>(null);
/** One latest message; application-owned histories belong in ActivityFeed. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ id: number; text: string; tone: Tone } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined); const sequence = useRef(0);
  const toast = useCallback((text: string, tone: Tone = 'success') => { clearTimeout(timer.current); setMessage({ id: ++sequence.current, text, tone }); timer.current = setTimeout(() => setMessage(null), 5000); }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return <ToastContext.Provider value={{ toast }}>{children}<div className="t98-toast-region" aria-live="polite" aria-atomic="true">{message && <div key={message.id} className={`t98-toast t98-tone--${message.tone}`}><Icon name={message.tone === 'success' ? 'check' : 'bell'} size={17}/><span>{message.text}</span><Button variant="ghost" size="sm" aria-label="Dismiss notification" onClick={() => { clearTimeout(timer.current); setMessage(null); }}><Icon name="x" size={15}/></Button></div>}</div></ToastContext.Provider>;
}
export function useToast(): ToastApi { const context = useContext(ToastContext); if (!context) throw new Error('useToast must be used within ToastProvider'); return context; }

/** Branded authentication presentation; authentication and recovery remain application-owned. */
export type AuthSurface = 'plain' | 'card';
/** Without an `aside` the form is a centred bordered card on the canvas (`surface="card"`, the default); `plain` keeps the open form column. */
export function AuthLayout({ brand, title, description, aside, children, footer, label, surface = 'card' }: { brand: ReactNode; title?: string; description?: string; aside?: ReactNode; children: ReactNode; footer?: ReactNode; surface?: AuthSurface; label?: string }) {
  // A labelled layout is the page's main landmark; unlabelled keeps the 0.3.x div for apps that supply their own <main>.
  const Root = label ? 'main' : 'div';
  return <Root className={`t98-auth-layout auth-shell ${aside ? 'auth-split' : surface === 'card' ? 't98-auth-layout--card' : ''}`} aria-label={label}>{aside && <aside className="auth-story t98-auth-aside">{brand}{aside}<div className="auth-orbit" aria-hidden="true"/></aside>}<section className="auth-form"><div className="auth-form-inner">{!aside && <div className="t98-auth-brand">{brand}</div>}{title !== undefined && <h1 className="t98-auth-title">{title}</h1>}{description && <p>{description}</p>}<div className="t98-auth-fields">{children}</div>{footer && <footer className="auth-footnote">{footer}</footer>}</div></section></Root>;
}

export interface Permission { id: string; label: string; description?: string }
/** Controlled presentation. Every privileged operation still needs server authorization. */
export function PermissionMatrix({ roles, permissions, value, onChange, disabled = false }: { roles: readonly string[]; permissions: readonly Permission[]; value: Readonly<Record<string, readonly string[]>>; onChange: (role: string, permissionId: string, allowed: boolean) => void; disabled?: boolean }) {
  return <div className="t98-permission-scroll" role="region" aria-label="Roles and permissions" tabIndex={0}><table className="t98-permission-table"><caption>Roles and permissions</caption><thead><tr><th scope="col">Permission</th>{roles.map(role => <th key={role} scope="col">{role}</th>)}</tr></thead><tbody>{permissions.map(permission => <tr key={permission.id}><th scope="row"><strong>{permission.label}</strong>{permission.description && <small>{permission.description}</small>}</th>{roles.map(role => <td key={role}><label className="t98-permission-target"><input type="checkbox" checked={Array.isArray(value[role]) && value[role].includes(permission.id)} disabled={disabled} aria-label={`${permission.label} — ${role}`} onChange={event => onChange(role, permission.id, event.target.checked)}/></label></td>)}</tr>)}</tbody></table></div>;
}
