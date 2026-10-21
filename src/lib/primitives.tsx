'use client';

import {
  Children, cloneElement, forwardRef, isValidElement, useEffect, useId, useRef, useState,
  type ButtonHTMLAttributes, type ComponentType, type HTMLAttributes, type InputHTMLAttributes,
  type OptgroupHTMLAttributes, type OptionHTMLAttributes, type ReactElement, type ReactNode, type SelectHTMLAttributes,
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
  /* The seven icons below are path data from Lucide 0.468.0 (ISC, https://lucide.dev), with rect/circle elements
   * converted to path commands. billboard = Lucide "presentation" (a sign board on a post), chart = "chart-column". */
  send: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zM21.854 2.147l-10.94 10.939',
  calendar: 'M8 2v4M16 2v4M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 10h18',
  target: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0zM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  billboard: 'M2 3h20M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3M7 21l5-5 5 5',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21',
  chart: 'M3 3v16a2 2 0 0 0 2 2h16M18 17V9M13 17V5M8 17v-3',
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
  /** Renders a styled anchor. Disabled or loading anchors drop `href` and set `aria-disabled`. */
  href?: string;
  /** A router link component (same contract as `Link.component`) used when `href` is set. */
  component?: ComponentType<{ href: string; className?: string; children?: ReactNode }>;
  /** Sets `aria-pressed` for a toggle button and applies the pressed style. */
  pressed?: boolean;
  fullWidth?: boolean;
}
let warnedIconOnly = false;
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'primary', size = 'md', loading = false, icon, href, component: Component, pressed, fullWidth = false, className, children, disabled, type = 'button', ...props }, ref) {
  const iconOnly = icon != null && icon !== false && Children.toArray(children).length === 0;
  if (iconOnly && !warnedIconOnly && !props['aria-label'] && !props['aria-labelledby'] && (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== 'production') {
    warnedIconOnly = true;
    console.warn('@ten98/ui Button: an icon-only Button needs an aria-label.');
  }
  const classes = cx('t98-button', `t98-button--${variant}`, `t98-button--${size}`, iconOnly && 't98-button--icon', fullWidth && 't98-button--full', className);
  const content = <>{loading ? <span className="t98-spinner" aria-hidden="true" /> : icon}{children}</>;
  if (href !== undefined) {
    const inactive = disabled || loading;
    const anchor = { ...props, 'aria-pressed': pressed, 'aria-busy': loading || undefined, 'aria-disabled': inactive || undefined } as Record<string, unknown>;
    // React 19 passes ref as a prop, so focus management reaches the router link's anchor.
    if (!inactive && Component) return <Component {...anchor} {...{ ref }} href={href} className={classes}>{content}</Component>;
    return <a {...anchor} ref={ref as never} href={inactive ? undefined : href} className={classes}>{content}</a>;
  }
  return <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-pressed={pressed} aria-busy={loading || undefined} {...props}>{content}</button>;
});

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
export const badgePalettes = ['rose', 'amber', 'lime', 'emerald', 'sky', 'violet', 'fuchsia'] as const;
export type BadgePalette = typeof badgePalettes[number];
/** `tone` carries status meaning; `palette` is a decorative colour for user tags and replaces the tone colours. */
export function Badge({ tone = 'neutral', palette, dot = false, className, children, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; palette?: BadgePalette; dot?: boolean }) {
  return <span className={cx('t98-badge', palette ? `t98-palette--${palette}` : `t98-tone--${tone}`, className)} {...props}>{dot && <span className="t98-badge-dot" aria-hidden="true" />}{children}</span>;
}

export function Avatar({ name, size = 'md', className, ...props }: HTMLAttributes<HTMLSpanElement> & { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.trim().split(/\s+/u).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join('').toLocaleUpperCase() || '?';
  return <span className={cx('t98-avatar', `t98-avatar--${size}`, className)} role="img" aria-label={name || 'Unknown user'} {...props}>{initials}</span>;
}

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode; description?: ReactNode; actions?: ReactNode;
  /** Landmark-capable element; a titled `section` or `article` is named by its title. */
  as?: 'div' | 'section' | 'article';
  /** Outline level of the title. */
  headingLevel?: 2 | 3 | 4;
}
export function Card({ title, description, actions, as: Tag = 'div', headingLevel = 3, className, children, ...props }: CardProps) {
  const titleId = useId();
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const named = Tag !== 'div' && title && !props['aria-label'] && !props['aria-labelledby'];
  return <Tag className={cx('t98-card', className)} aria-labelledby={named ? titleId : undefined} {...props}>
    {(title || description || actions) && <div className="t98-card-header"><div>{title && <Heading id={named ? titleId : undefined} className="t98-card-title">{title}</Heading>}{description && <p className="t98-card-description">{description}</p>}</div>{actions && <div className="t98-card-actions">{actions}</div>}</div>}
    {children && <div className="t98-card-content">{children}</div>}
  </Tag>;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cx('t98-input', className)} {...props} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} className={cx('t98-input', 't98-textarea', className)} rows={rows} {...props} />;
});
/** Choice inside `Select`. */
export function Option(props: Omit<OptionHTMLAttributes<HTMLOptionElement>, 'className' | 'style'>) {
  return <option {...props} />;
}
export function OptionGroup(props: Omit<OptgroupHTMLAttributes<HTMLOptGroupElement>, 'className' | 'style'> & { label: string }) {
  return <optgroup {...props} />;
}

export interface SelectOption { value: string; label: string; disabled?: boolean; group?: string }
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Rendered before `children`; options sharing a `group` form one optgroup, placed where the group first appears. */
  options?: SelectOption[];
  /** A disabled empty first option, selected while the value is empty. */
  placeholder?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, children, options, placeholder, ...props }, ref) {
  const items: (SelectOption | { group: string; members: SelectOption[] })[] = [];
  const groups = new Map<string, SelectOption[]>();
  for (const option of options ?? []) {
    if (option.group === undefined) { items.push(option); continue; }
    let members = groups.get(option.group);
    if (!members) { members = []; groups.set(option.group, members); items.push({ group: option.group, members }); }
    members.push(option);
  }
  const renderOption = (option: SelectOption) => <Option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</Option>;
  const selection = placeholder && props.value === undefined && props.defaultValue === undefined ? { defaultValue: '' } : undefined;
  return <select ref={ref} className={cx('t98-input', 't98-select', className)} {...selection} {...props}>
    {placeholder && <Option value="" disabled>{placeholder}</Option>}
    {items.map(item => 'members' in item ? <OptionGroup key={`group:${item.group}`} label={item.group}>{item.members.map(renderOption)}</OptionGroup> : renderOption(item))}
    {children}
  </select>;
});

type DescribedProps = { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling' };
export interface FieldCount {
  /** The control's current value. */
  value: string;
  /** The limit. The control is not hard-capped, so pasted text stays visible and can be edited down. */
  max: number;
  /** Custom length, for example grapheme or weighted (SMS, social) counting. Defaults to code points. */
  measure?: (value: string) => number;
}
const fieldCount = ({ value, max, measure }: FieldCount) => {
  const used = measure ? measure(value) : [...value].length;
  const remaining = max - used;
  // The live region changes only when the state changes, never on every keystroke; the visible counter has the numbers.
  const state = remaining < 0 ? 'over' : remaining <= Math.max(10, Math.ceil(max * 0.1)) ? 'near' : 'ok';
  return { used, remaining, state };
};
export function Field({ label, description, error, htmlFor, required, count, children, className, ...props }: HTMLAttributes<HTMLDivElement> & { label: ReactNode; description?: ReactNode; error?: ReactNode; /** Optional; generated and applied to the control when omitted. */ htmlFor?: string; /** Shows a visual marker only; set `required` on the control itself. */ required?: boolean; /** Shows "used / max" linked to the control, marks it invalid when over, and announces only near and over the limit. */ count?: FieldCount }) {
  const generated = useId();
  // Only the first element child is the labelled control; later children (units, hints) keep their own ids.
  const firstId = Children.toArray(children).find(isValidElement<DescribedProps>)?.props.id;
  let labelled = 0;
  const id = htmlFor ?? firstId ?? generated;
  const counted = count && Number.isFinite(count.max) && count.max > 0 ? fieldCount(count) : null;
  const over = counted?.state === 'over';
  const describedBy = [description && `${id}-description`, counted && `${id}-count`, error && `${id}-error`].filter(Boolean).join(' ');
  return <div className={cx('t98-field', className)} {...props}>
    <label className="t98-label" htmlFor={id}>{label}{required && <span className="t98-label-required" aria-hidden="true"> *</span>}</label>
    {Children.map(children, child => isValidElement<DescribedProps>(child) && !(labelled++) ? cloneElement(child, { id: child.props.id ?? id, 'aria-describedby': cx(child.props['aria-describedby'], describedBy) || undefined, 'aria-invalid': error || over ? true : child.props['aria-invalid'] }) : child)}
    {description && <p className="t98-field-description" id={`${id}-description`}>{description}</p>}
    {counted && count && <p className={cx('t98-field-count', counted.state !== 'ok' && `t98-field-count--${counted.state}`)} id={`${id}-count`}>
      {counted.used} / {count.max} characters{over ? `, ${-counted.remaining} over the limit` : ''}
    </p>}
    {counted && <span className="t98-visually-hidden" role="status">{counted.state === 'over' ? 'Over the character limit' : counted.state === 'near' ? 'Approaching the character limit' : ''}</span>}
    {error && <p className="t98-field-error" id={`${id}-error`} role="alert">{error}</p>}
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

export interface TabItem { value: string; label: ReactNode; content?: ReactNode; /** Announced as unavailable, skipped by arrow keys and not activatable. */ disabled?: boolean }
/* Keyboard model from the WAI-ARIA Authoring Practices Guide Tabs pattern (W3C, W3C Software and Document licence):
 * automatic activation, ArrowLeft/ArrowRight wrap, Home/End. Disabled tabs stay in the accessibility tree (aria-disabled) but are skipped. */
export function Tabs({ items, value, onValueChange, label = 'Sections', className, keepMounted = true }: { items: TabItem[]; value: string; onValueChange: (value: string) => void; label?: string; className?: string;
  /** Keep inactive panels mounted but hidden (default, preserves their state). False renders only the active panel. */
  keepMounted?: boolean }) {
  const id = useId();
  const tabList = useRef<HTMLDivElement>(null);
  const active = items.some(item => item.value === value) ? value : (items.find(item => !item.disabled) ?? items[0])?.value;
  const enabled = items.flatMap((item, index) => item.disabled ? [] : [index]);
  // The roving tab stop: the active tab, or the first enabled one when the active tab is disabled, so the list stays reachable.
  const activeIndex = items.findIndex(item => item.value === active);
  const stop = activeIndex >= 0 && !items[activeIndex].disabled ? activeIndex : enabled[0];
  return <div className={cx('t98-tabs', className)}><div className="t98-tab-list" role="tablist" aria-label={label} ref={tabList}>
    {items.map((item, index) => <button key={item.value} type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={keepMounted || active === item.value ? `${id}-panel-${index}` : undefined} aria-selected={active === item.value} aria-disabled={item.disabled || undefined} tabIndex={index === stop ? 0 : -1} className="t98-tab" onClick={() => { if (!item.disabled) onValueChange(item.value); }} onKeyDown={event => {
      const at = enabled.indexOf(index);
      let next: number | undefined;
      if (!enabled.length) return;
      // Arrows follow the writing direction (APG): in RTL, ArrowLeft moves to the next tab.
      const rtl = tabList.current ? getComputedStyle(tabList.current).direction === 'rtl' : false;
      if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = enabled[(at + 1) % enabled.length];
      else if (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = enabled[(at - 1 + enabled.length) % enabled.length];
      else if (event.key === 'Home') next = enabled[0];
      else if (event.key === 'End') next = enabled[enabled.length - 1];
      if (next === undefined) return;
      event.preventDefault();
      onValueChange(items[next].value);
      tabList.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    }}>{item.label}</button>)}
  </div>{items.map((item, index) => (keepMounted || active === item.value) && <div key={item.value} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={active !== item.value} tabIndex={0} className="t98-tab-panel">{item.content}</div>)}</div>;
}

export interface DialogProps { open: boolean; onOpenChange: (open: boolean) => void; title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode; className?: string; closeDisabled?: boolean;
  /** Called before Escape, backdrop and close-button closes; return false to keep the dialog open (for example to show a discard prompt). */
  onBeforeClose?: (reason: DialogCloseReason) => boolean | void }
export type DialogCloseReason = 'escape' | 'backdrop' | 'close-button';
/* Behaviour follows the WAI-ARIA APG Modal Dialog pattern and react-aria's useOverlay close interception (Apache-2.0); no code is copied. */
export function Dialog({ open, onOpenChange, title, description, children, footer, className, closeDisabled = false, onBeforeClose }: DialogProps) {
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
  function requestClose(reason: DialogCloseReason) {
    if (closeDisabled) return;
    if (onBeforeClose?.(reason) === false) {
      const dialog = ref.current;
      if (dialog && !dialog.contains(document.activeElement)) dialog.querySelector<HTMLElement>('[autofocus], input, select, textarea, button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')?.focus();
      return;
    }
    onOpenChange(false);
  }
  return <dialog ref={ref} className={cx('t98-dialog', className)} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined} onCancel={event => { event.preventDefault(); requestClose('escape'); }} onClose={() => {
    // Chrome's close watcher closes the dialog without a cancelable cancel event when Escape is pressed twice without
    // other interaction. If the app still wants it open and guards closing, reopen it and ask the guard first.
    const dialog = ref.current;
    if (open && onBeforeClose && dialog && !closeDisabled) {
      dialog.showModal();
      requestClose('escape');
      return;
    }
    if (open) onOpenChange(false); trigger.current?.focus(); trigger.current = null;
  }} onClick={event => { if (!closeDisabled && event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) requestClose('backdrop'); } }}>
    <div className="t98-dialog-header"><div><h2 id={`${id}-title`} className="t98-dialog-title">{title}</h2>{description && <p id={`${id}-description`} className="t98-dialog-description">{description}</p>}</div><Button variant="ghost" aria-label="Close dialog" disabled={closeDisabled} className="t98-icon-button" onClick={() => requestClose('close-button')} icon={<Icon name="x" />} /></div>
    <div className="t98-dialog-body">{children}</div>{footer && <div className="t98-dialog-footer">{footer}</div>}
  </dialog>;
}

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode; tone?: Tone; actions?: ReactNode;
  variant?: 'default' | 'inline' | 'banner';
  /** Adds a labelled dismiss button; the application removes the alert. */
  onDismiss?: () => void;
  dismissLabel?: string;
}
/** Danger announces as `alert`, other tones as `status`; pass `role` to override. */
export function Alert({ title, tone = 'info', variant = 'default', onDismiss, dismissLabel = 'Dismiss', children, actions, className, ...props }: AlertProps) {
  return <div className={cx('t98-alert', `t98-tone--${tone}`, variant !== 'default' && `t98-alert--${variant}`, className)} role={tone === 'danger' ? 'alert' : 'status'} {...props}><Icon name={tone === 'success' ? 'check' : tone === 'danger' ? 'shield' : 'bell'} /><div className="t98-alert-content">{title && <p className="t98-alert-title">{title}</p>}{children && <div className="t98-alert-description">{children}</div>}{actions != null && <div className="t98-form-actions t98-alert-actions">{actions}</div>}</div>{onDismiss && <Button variant="ghost" size="sm" className="t98-alert-dismiss" aria-label={dismissLabel} icon={<Icon name="x" />} onClick={onDismiss} />}</div>;
}

/** Omit `value` for an indeterminate operation of unknown length. */
/** Task progress from 0 to 100. Without a finite value it is indeterminate, never 0%. */
export function Progress({ value, label = 'Progress', className }: { value?: number; label?: string; className?: string }) {
  if (value === undefined || !Number.isFinite(value)) return <div className={cx('t98-progress-group', className)}><div className="t98-progress-label"><span>{label}</span></div><progress className="t98-progress" aria-label={label} aria-busy="true" /></div>;
  const safeValue = Math.max(0, Math.min(100, value));
  return <div className={cx('t98-progress-group', className)}><div className="t98-progress-label"><span>{label}</span><span>{Math.round(safeValue)}%</span></div><progress className="t98-progress" value={safeValue} max={100} aria-label={label}>{Math.round(safeValue)}%</progress></div>;
}

export interface MeterProps { value: number; min?: number; max?: number; low?: number; high?: number; optimum?: number; label?: string; /** Visible reading; defaults to the numeric value. */ valueLabel?: ReactNode; className?: string }
/** A scalar measurement within a known range (for example quota used), not task progress. */
export function Meter({ value, min = 0, max = 100, low, high, optimum, label = 'Meter', valueLabel, className }: MeterProps) {
  return <div className={cx('t98-progress-group', className)}><div className="t98-progress-label"><span>{label}</span><span>{valueLabel ?? value}</span></div><meter className="t98-meter" value={value} min={min} max={max} low={low} high={high} optimum={optimum} aria-label={label}>{valueLabel ?? value}</meter></div>;
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
  return <span className={cx('t98-tooltip', className)} data-dismissed={dismissed || undefined} onMouseEnter={() => setDismissed(false)} onFocus={() => setDismissed(false)} onKeyDown={event => { if (event.key === 'Escape') { setDismissed(true); event.preventDefault(); } }}>{cloneElement(children, { 'aria-describedby': cx(children.props['aria-describedby'], id) })}<span role="tooltip" id={id} className="t98-tooltip-content">{content}</span></span>;
}

export function Breadcrumb({ items, className }: { items: { label: ReactNode; href?: string }[]; className?: string }) {
  return <nav aria-label="Breadcrumb" className={cx('t98-breadcrumb', className)}><ol>{items.map((item, index) => <li key={index}>{index > 0 && <Icon name="chevron-right" size={13} />}{item.href && index < items.length - 1 ? <a href={item.href}>{item.label}</a> : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>}</li>)}</ol></nav>;
}
export function Accordion({ items, className }: { items: { title: ReactNode; content: ReactNode }[]; className?: string }) {
  return <div className={cx('t98-accordion', className)}>{items.map((item, index) => <details className="t98-accordion-item" key={index}><summary>{item.title}<Icon name="chevron-down" size={16} /></summary><div className="t98-accordion-content">{item.content}</div></details>)}</div>;
}
