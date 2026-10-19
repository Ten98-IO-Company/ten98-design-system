'use client';

import {
  Children, cloneElement, forwardRef, isValidElement, useEffect, useId, useRef, useState,
  type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes,
  type ReactElement, type ReactNode, type SelectHTMLAttributes,
  type SVGProps, type TextareaHTMLAttributes,
} from 'react';

export function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(' ');
}

const iconPaths = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  layers: 'm12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
  palette: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-.5a1.5 1.5 0 0 1 0-3H16a5 5 0 0 0 5-5c0-3.3-4-6-9-6ZM7 8h.01M12 6h.01M17 8h.01M6 13h.01',
  type: 'M4 5V3h16v2M12 3v18M8 21h8',
  spacing: 'M4 3v18M20 3v18M7 12h10M10 9l-3 3 3 3M14 9l3 3-3 3',
  icons: 'M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8',
  components: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17.5 13l5 5-5 5-5-5 5-5Z',
  patterns: 'M3 3h18v18H3zM3 9h18M9 9v12M15 9v12',
  book: 'M12 5C8 2 4 3 2 4v16c3-2 7-1 10 1 3-2 7-3 10-1V4c-2-1-6-2-10 1ZM12 5v16',
  code: 'm8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18',
  'arrow-right': 'M4 12h16M14 6l6 6-6 6',
  'arrow-up-right': 'M6 18 18 6M6 6h12v12',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-left': 'm15 6-6 6 6 6',
  'chevron-right': 'm9 6 6 6-6 6',
  'chevrons-up-down': 'm8 8 4-4 4 4M8 16l4 4 4-4',
  'trending-up': 'M3 17l6-6 4 4L21 6M15 6h6v6',
  'trending-down': 'M3 7l6 6 4-4 8 9M15 18h6v-6',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  inbox: 'M5 3h14l3 12v6H2v-6L5 3ZM2 15h6l2 3h4l2-3h6',
  box: 'm12 2 10 5v10l-10 5-10-5V7l10-5Zm0 10 10-5M12 12v10M12 12 2 7M7 4.5l10 5',
  check: 'm5 12 4 4L19 6',
  x: 'm6 6 12 12M18 6 6 18',
  copy: 'M9 9h12v12H9zM5 15H3V3h12v2',
  external: 'M14 3h7v7M21 3l-9 9M10 3H3v18h18v-7',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5',
  moon: 'M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z',
  monitor: 'M3 3h18v14H3zM12 17v4M8 21h8',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4',
  settings: 'm9 3-.5 3-2 1-3-.5-2 3 2 2v2l-2 2 2 3 3-.5 2 1 .5 3h4l.5-3 2-1 3 .5 2-3-2-2v-2l2-2-2-3-3 .5-2-1L13 3H9ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  mail: 'M3 5h18v14H3zM3 5l9 8 9-8',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  users: 'M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM2 21v-2a8 8 0 0 1 16 0v2M17 3a4 4 0 0 1 0 8M22 21v-2a7 7 0 0 0-4-6',
  shield: 'm12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4Zm-4 10 3 3 5-6',
  activity: 'M2 12h5l3-9 4 18 3-9h5',
  server: 'M3 3h18v7H3zM3 14h18v7H3zM7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6',
  phone: 'M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4c0 2-2 3-4 2A23 23 0 0 1 3 7C2 5 3 3 5 3Z',
  workflow: 'M9 2h6v6H9zM2 16h6v6H2zM16 16h6v6h-6zM12 8v4M5 16v-4h14v4',
  building: 'M5 21V3h14v18M2 21h20M9 7h1M14 7h1M9 11h1M14 11h1M10 21v-5h4v5',
  home: 'm3 10 9-8 9 8v11H3V10Zm6 11v-8h6v8',
  megaphone: 'M3 9h5l12-6v18L8 15H3V9ZM8 15l2 6H6l-2-6M8 9v6',
  compass: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 8l-3 5-5 3 3-5 5-3Z',
  filter: 'M3 4h18l-7 8v8l-4-2v-6L3 4Z',
  download: 'M12 3v12M7 10l5 5 5-5M3 16v5h18v-5',
  refresh: 'M20 8a8 8 0 0 0-14-3L3 8M3 3v5h5M4 16a8 8 0 0 0 14 3l3-3M21 21v-5h-5',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z',
  menu: 'M3 6h18M3 12h18M3 18h18',
  terminal: 'M3 3h18v18H3zM6 8l4 4-4 4M13 16h5',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  file: 'M14 2H4v20h16V8l-6-6Zm0 0v6h6M8 13h8M8 17h6',
  folder: 'M2 5h8l2 3h10v12H2V5Z',
  'arrow-up': 'M12 20V4M6 10l6-6 6 6',
  'arrow-down': 'M12 4v16M6 14l6 6 6-6',
  github: 'M9 19c-5 1.5-5-2.5-7-3M16 22v-4c0-1-.3-2-1-2.5 3-.3 6-1.5 6-6A5 5 0 0 0 19.5 6a4.6 4.6 0 0 0-.1-3.5S18 2 15 4a13 13 0 0 0-6 0C6 2 4.6 2.5 4.6 2.5A4.6 4.6 0 0 0 4.5 6 5 5 0 0 0 3 9.5c0 4.5 3 5.7 6 6-.7.5-1 1.5-1 2.5v4',
} as const;

export type IconName = keyof typeof iconPaths;
export function Icon({ name, size = 18, title, className, ...props }: Omit<SVGProps<SVGSVGElement>, 'name'> & { name: IconName | (string & {}); size?: number; title?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={cx('t98-icon', className)} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} {...props}>
    {title && <title>{title}</title>}<path d={iconPaths[name as IconName] ?? iconPaths.components} />
  </svg>;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'primary', size = 'md', loading = false, icon, className, children, disabled, type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={cx('t98-button', `t98-button--${variant}`, `t98-button--${size}`, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading ? <span className="t98-spinner" aria-hidden="true" /> : icon}{children}
  </button>;
});

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
export function Badge({ tone = 'neutral', dot = false, className, children, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return <span className={cx('t98-badge', `t98-tone--${tone}`, className)} {...props}>{dot && <span className="t98-badge-dot" aria-hidden="true" />}{children}</span>;
}

export function Avatar({ name, size = 'md', className, ...props }: HTMLAttributes<HTMLSpanElement> & { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.trim().split(/\s+/u).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join('').toLocaleUpperCase() || '?';
  return <span className={cx('t98-avatar', `t98-avatar--${size}`, className)} role="img" aria-label={name || 'Unknown user'} {...props}>{initials}</span>;
}

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> { title?: ReactNode; description?: ReactNode; actions?: ReactNode }
export function Card({ title, description, actions, className, children, ...props }: CardProps) {
  return <div className={cx('t98-card', className)} {...props}>
    {(title || description || actions) && <div className="t98-card-header"><div>{title && <h3 className="t98-card-title">{title}</h3>}{description && <p className="t98-card-description">{description}</p>}</div>{actions && <div className="t98-card-actions">{actions}</div>}</div>}
    {children && <div className="t98-card-content">{children}</div>}
  </div>;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cx('t98-input', className)} {...props} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} className={cx('t98-input', 't98-textarea', className)} rows={rows} {...props} />;
});
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return <select ref={ref} className={cx('t98-input', 't98-select', className)} {...props}>{children}</select>;
});

type DescribedProps = { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling' };
export function Field({ label, description, error, htmlFor, children, className, ...props }: HTMLAttributes<HTMLDivElement> & { label: ReactNode; description?: ReactNode; error?: ReactNode; htmlFor: string }) {
  const describedBy = [description && `${htmlFor}-description`, error && `${htmlFor}-error`].filter(Boolean).join(' ');
  return <div className={cx('t98-field', className)} {...props}>
    <label className="t98-label" htmlFor={htmlFor}>{label}</label>
    {Children.map(children, child => isValidElement<DescribedProps>(child) ? cloneElement(child, { id: child.props.id ?? htmlFor, 'aria-describedby': [child.props['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined, 'aria-invalid': error ? true : child.props['aria-invalid'] }) : child)}
    {description && <p className="t98-field-description" id={`${htmlFor}-description`}>{description}</p>}
    {error && <p className="t98-field-error" id={`${htmlFor}-error`} role="alert">{error}</p>}
  </div>;
}

export const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode }>(function Checkbox({ label, className, disabled, ...props }, ref) {
  return <label className={cx('t98-checkbox-label', disabled && 't98-disabled', className)}><input ref={ref} type="checkbox" disabled={disabled} className="t98-checkbox" {...props} /><span>{label}</span></label>;
});

export function Switch({ label, checked, onCheckedChange, disabled = false, className, ...props }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'children' | 'type'> & { label: ReactNode; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} disabled={disabled} className={cx('t98-switch-label', className)} {...props} onClick={event => { props.onClick?.(event); if (!event.defaultPrevented) onCheckedChange(!checked); }}>
    <span className="t98-switch-track" aria-hidden="true"><span className="t98-switch-thumb" /></span><span>{label}</span>
  </button>;
}

export interface TabItem { value: string; label: ReactNode; content?: ReactNode }
export function Tabs({ items, value, onValueChange, label = 'Sections', className }: { items: TabItem[]; value: string; onValueChange: (value: string) => void; label?: string; className?: string }) {
  const id = useId();
  const tabList = useRef<HTMLDivElement>(null);
  const active = items.some(item => item.value === value) ? value : items[0]?.value;
  return <div className={cx('t98-tabs', className)}><div className="t98-tab-list" role="tablist" aria-label={label} ref={tabList}>
    {items.map((item, index) => <button key={item.value} type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} aria-selected={active === item.value} tabIndex={active === item.value ? 0 : -1} className="t98-tab" onClick={() => onValueChange(item.value)} onKeyDown={event => {
      let next: number;
      if (event.key === 'ArrowRight') next = (index + 1) % items.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = items.length - 1;
      else return;
      event.preventDefault();
      onValueChange(items[next].value);
      tabList.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    }}>{item.label}</button>)}
  </div>{items.map((item, index) => <div key={item.value} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={active !== item.value} tabIndex={0} className="t98-tab-panel">{item.content}</div>)}</div>;
}

export interface DialogProps { open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode; className?: string; closeDisabled?: boolean }
export function Dialog({ open, onOpenChange, title, description, children, footer, className, closeDisabled = false }: DialogProps) {
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => () => { trigger.current?.focus(); }, []);
  return <dialog ref={ref} className={cx('t98-dialog', className)} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined} onCancel={event => { event.preventDefault(); if (!closeDisabled) onOpenChange(false); }} onClose={() => { if (open) onOpenChange(false); trigger.current?.focus(); trigger.current = null; }} onClick={event => { if (!closeDisabled && event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onOpenChange(false); } }}>
    <div className="t98-dialog-header"><div><h2 id={`${id}-title`} className="t98-dialog-title">{title}</h2>{description && <p id={`${id}-description`} className="t98-dialog-description">{description}</p>}</div><Button variant="ghost" aria-label="Close dialog" disabled={closeDisabled} className="t98-icon-button" onClick={() => onOpenChange(false)} icon={<Icon name="x" />} /></div>
    <div className="t98-dialog-body">{children}</div>{footer && <div className="t98-dialog-footer">{footer}</div>}
  </dialog>;
}

export function Alert({ title, tone = 'info', children, className, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & { title: ReactNode; tone?: Tone }) {
  return <div className={cx('t98-alert', `t98-tone--${tone}`, className)} role={tone === 'danger' ? 'alert' : 'status'} {...props}><Icon name={tone === 'success' ? 'check' : tone === 'danger' ? 'shield' : 'bell'} /><div><p className="t98-alert-title">{title}</p>{children && <div className="t98-alert-description">{children}</div>}</div></div>;
}

export function Progress({ value, label = 'Progress', className }: { value: number; label?: string; className?: string }) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return <div className={cx('t98-progress-group', className)}><div className="t98-progress-label"><span>{label}</span><span>{Math.round(safeValue)}%</span></div><progress className="t98-progress" value={safeValue} max={100} aria-label={label}>{Math.round(safeValue)}%</progress></div>;
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('t98-skeleton', className)} aria-hidden="true" {...props} />;
}
export function Separator({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cx('t98-separator', className)} {...props} />;
}
export function Tooltip({ content, children, className }: { content: ReactNode; children: ReactElement<{ 'aria-describedby'?: string }>; className?: string }) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  return <span className={cx('t98-tooltip', className)} data-dismissed={dismissed || undefined} onMouseEnter={() => setDismissed(false)} onFocus={() => setDismissed(false)} onKeyDown={event => { if (event.key === 'Escape') { setDismissed(true); event.preventDefault(); } }}>{cloneElement(children, { 'aria-describedby': [children.props['aria-describedby'], id].filter(Boolean).join(' ') })}<span role="tooltip" id={id} className="t98-tooltip-content">{content}</span></span>;
}

export function Breadcrumb({ items, className }: { items: { label: ReactNode; href?: string }[]; className?: string }) {
  return <nav aria-label="Breadcrumb" className={cx('t98-breadcrumb', className)}><ol>{items.map((item, index) => <li key={index}>{index > 0 && <Icon name="chevron-right" size={13} />}{item.href && index < items.length - 1 ? <a href={item.href}>{item.label}</a> : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>}</li>)}</ol></nav>;
}
export function Accordion({ items, className }: { items: { title: ReactNode; content: ReactNode }[]; className?: string }) {
  return <div className={cx('t98-accordion', className)}>{items.map((item, index) => <details className="t98-accordion-item" key={index}><summary>{item.title}<Icon name="chevron-down" size={16} /></summary><div className="t98-accordion-content">{item.content}</div></details>)}</div>;
}
