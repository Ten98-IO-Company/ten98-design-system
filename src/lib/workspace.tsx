'use client';

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Alert, Button, Dialog, Field, Icon, Input, Select, type Tone } from './primitives.js';

export interface ProductOption { id: string; name: string; description?: string }
/** Native scope selection; the consumer handles navigation and data changes. */
export function ProductSwitcher({ products, value, onValueChange, label = 'Product', disabled }: { products: readonly ProductOption[]; value: string; onValueChange: (value: string) => void; label?: string; disabled?: boolean }) {
  const id = useId();
  return <Field label={label} htmlFor={id}><Select value={value} disabled={disabled} onChange={event => onValueChange(event.target.value)}>{products.map(product => <option key={product.id} value={product.id}>{product.name}{product.description ? ` — ${product.description}` : ''}</option>)}</Select></Field>;
}

export interface DateRange { start: string; end: string }
/** ISO date-only values; no timezone conversion or invented presets. */
export function DateRangeField({ label, start, end, onChange, disabled }: DateRange & { label: string; onChange: (range: DateRange) => void; disabled?: boolean }) {
  const id = useId();
  const [error, setError] = useState('');
  function update(range: DateRange) {
    if (range.start && range.end && range.start > range.end) { setError('End date must be on or after the start date.'); return; }
    setError(''); onChange(range);
  }
  return <fieldset className="t98-date-range"><legend>{label}</legend><div className="t98-date-range-fields"><Field label="Start date" htmlFor={`${id}-start`}><Input type="date" value={start} max={end || undefined} disabled={disabled} aria-describedby={error ? `${id}-error` : undefined} onChange={event => update({ start: event.target.value, end })}/></Field><Field label="End date" htmlFor={`${id}-end`}><Input type="date" value={end} min={start || undefined} disabled={disabled} aria-describedby={error ? `${id}-error` : undefined} onChange={event => update({ start, end: event.target.value })}/></Field></div>{error && <p className="t98-field-error" id={`${id}-error`} role="alert">{error}</p>}</fieldset>;
}

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [status, setStatus] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setStatus('Copied'); } catch { setStatus('Copy failed'); }
    clearTimeout(timer.current); timer.current = setTimeout(() => setStatus(''), 2500);
  }
  return <span className="t98-copy-control"><Button variant="secondary" size="sm" onClick={copy}><Icon name={status === 'Copied' ? 'check' : 'copy'} size={14}/>{label}</Button><span role="status">{status}</span></span>;
}

/** Presentation only: this does not encrypt a value already sent to the browser. */
export function SecretField({ label, value }: { label: string; value: string }) {
  const id = useId(); const [visible, setVisible] = useState(false);
  return <div className="t98-secret-control"><Field label={label} htmlFor={id}><Input id={id} type={visible ? 'text' : 'password'} value={value} readOnly autoComplete="off"/></Field><Button variant="secondary" aria-label={`${visible ? 'Hide' : 'Show'} ${label}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</Button></div>;
}

export interface ConfirmDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string;
  onConfirm: () => void | Promise<void>; confirmLabel?: string; danger?: boolean; confirmationText?: string;
}
/** Blocks closing while a mutation is pending; rejected mutations stay open for retry. */
export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, confirmLabel = 'Confirm', danger = false, confirmationText }: ConfirmDialogProps) {
  const id = useId(); const [input, setInput] = useState(''); const [pending, setPending] = useState(false); const [error, setError] = useState(''); const busy = useRef(false);
  useEffect(() => { if (open) { setInput(''); setError(''); } }, [open]);
  async function confirm() {
    if (busy.current || (confirmationText && input !== confirmationText)) return;
    busy.current = true; setPending(true); setError('');
    try { await onConfirm(); onOpenChange(false); } catch { setError('The action could not be completed. Try again.'); } finally { busy.current = false; setPending(false); }
  }
  return <Dialog open={open} onOpenChange={next => { if (!busy.current) onOpenChange(next); }} closeDisabled={pending} title={title} description={description} footer={<><Button variant="secondary" disabled={pending} onClick={() => onOpenChange(false)}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} loading={pending} disabled={!!confirmationText && input !== confirmationText} onClick={confirm}>{confirmLabel}</Button></>}>
    {confirmationText ? <Field label={`Type ${confirmationText} to confirm`} htmlFor={id}><Input value={input} autoComplete="off" disabled={pending} onChange={event => setInput(event.target.value)}/></Field> : <p className="t98-confirm-hint">Review this action before continuing.</p>}
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
export function AuthLayout({ brand, title, description, aside, children, footer, label }: { brand: ReactNode; title?: string; description?: string; aside?: ReactNode; children: ReactNode; footer?: ReactNode; label?: string }) {
  // A labelled layout is the page's main landmark; unlabelled keeps the 0.3.x div for apps that supply their own <main>.
  const Root = label ? 'main' : 'div';
  return <Root className={`t98-auth-layout auth-shell ${aside ? 'auth-split' : ''}`} aria-label={label}>{aside && <aside className="auth-story t98-auth-aside">{brand}{aside}<div className="auth-orbit" aria-hidden="true"/></aside>}<section className="auth-form"><div className="auth-form-inner">{!aside && <div className="t98-auth-brand">{brand}</div>}{title !== undefined && <h1 className="t98-auth-title">{title}</h1>}{description && <p>{description}</p>}<div className="t98-auth-fields">{children}</div>{footer && <footer className="auth-footnote">{footer}</footer>}</div></section></Root>;
}

export interface Permission { id: string; label: string; description?: string }
/** Controlled presentation. Every privileged operation still needs server authorization. */
export function PermissionMatrix({ roles, permissions, value, onChange, disabled = false }: { roles: readonly string[]; permissions: readonly Permission[]; value: Readonly<Record<string, readonly string[]>>; onChange: (role: string, permissionId: string, allowed: boolean) => void; disabled?: boolean }) {
  return <div className="t98-permission-scroll" role="region" aria-label="Roles and permissions" tabIndex={0}><table className="t98-permission-table"><caption>Roles and permissions</caption><thead><tr><th scope="col">Permission</th>{roles.map(role => <th key={role} scope="col">{role}</th>)}</tr></thead><tbody>{permissions.map(permission => <tr key={permission.id}><th scope="row"><strong>{permission.label}</strong>{permission.description && <small>{permission.description}</small>}</th>{roles.map(role => <td key={role}><label className="t98-permission-target"><input type="checkbox" checked={Array.isArray(value[role]) && value[role].includes(permission.id)} disabled={disabled} aria-label={`${permission.label} — ${role}`} onChange={event => onChange(role, permission.id, event.target.checked)}/></label></td>)}</tr>)}</tbody></table></div>;
}
