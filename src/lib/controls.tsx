'use client';

import { useId, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Badge, Button, Checkbox, Field, Icon, Input, Progress, cx } from './primitives.js';
import { Stack, VisuallyHidden } from './structure.js';
import { CopyButton } from './workspace.js';

/* Controls replace the raw details, fieldset, radio/checkbox list, pager, pre/code, status-line,
 * datalist and overflow wrappers that applications may not write themselves. Presentation only:
 * state and data stay with the caller. */

export type ScrollHeight = 'sm' | 'md' | 'lg';

export interface DisclosureProps {
  summary: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  variant?: 'boxed' | 'plain';
  /** Rendered beside the summary, outside the summary element so controls are never nested in it. */
  actions?: ReactNode;
}
/** Native details/summary. Controlled when `open` is set, otherwise it keeps its own state. */
export function Disclosure({ summary, children, open, onOpenChange, defaultOpen = false, variant = 'boxed', actions }: DisclosureProps) {
  const [inner, setInner] = useState(defaultOpen);
  const expanded = open ?? inner;
  return <div className={cx('t98-disclosure', `t98-disclosure--${variant}`)}>
    <details className="t98-disclosure-details" open={expanded}>
      <summary className="t98-disclosure-summary" onClick={event => { event.preventDefault(); if (open === undefined) setInner(!expanded); onOpenChange?.(!expanded); }}>
        <span className="t98-disclosure-title">{summary}</span><Icon name="chevron-down" size={16} />
      </summary>
      <div className="t98-disclosure-body">{children}</div>
    </details>
    {actions && <div className="t98-disclosure-actions">{actions}</div>}
  </div>;
}

interface FieldsetBaseProps {
  legend: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  hideLegend?: boolean;
  layout?: 'stack' | 'grid' | 'inline';
  role?: 'radiogroup';
  invalid?: boolean;
  children: ReactNode;
}
function FieldsetBase({ legend, description, error, disabled, hideLegend, layout = 'stack', role, invalid, children }: FieldsetBaseProps) {
  const id = useId();
  const describedBy = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return <fieldset className="t98-fieldset" disabled={disabled} role={role} aria-describedby={describedBy} aria-invalid={invalid || undefined}>
    <legend className="t98-fieldset-legend">{hideLegend ? <VisuallyHidden>{legend}</VisuallyHidden> : legend}</legend>
    {description && <p className="t98-field-description" id={`${id}-description`}>{description}</p>}
    <div className={cx('t98-fieldset-body', layout !== 'stack' && `t98-fieldset-body--${layout}`)}>{children}</div>
    {error && <p className="t98-field-error" id={`${id}-error`} role="alert">{error}</p>}
  </fieldset>;
}

export type FieldsetProps = Pick<FieldsetBaseProps, 'legend' | 'description' | 'disabled' | 'hideLegend' | 'layout' | 'children'>;
/** Native fieldset/legend grouping for related fields. */
export function Fieldset(props: FieldsetProps) {
  return <FieldsetBase {...props} />;
}

export interface ChoiceOption { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean }
interface ChoiceGroupProps {
  legend: ReactNode;
  description?: ReactNode;
  options: ChoiceOption[];
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  error?: ReactNode;
}
const choiceText = (option: ChoiceOption) => <span className="t98-choice-text"><span className="t98-choice-label">{option.label}</span>{option.description && <span className="t98-choice-description">{option.description}</span>}</span>;

export interface RadioGroupProps extends ChoiceGroupProps {
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}
/** Single choice from a native radio list; arrow keys move the selection. */
export function RadioGroup({ legend, description, options, disabled, orientation = 'vertical', error, name, value, defaultValue, onValueChange }: RadioGroupProps) {
  const [inner, setInner] = useState(defaultValue ?? '');
  const current = value ?? inner;
  return <FieldsetBase legend={legend} description={description} error={error} disabled={disabled} role="radiogroup" invalid={!!error}>
    <div className={orientation === 'horizontal' ? 't98-choice-row' : 't98-choice-column'}>
      {options.map(option => <label key={option.value} className={cx('t98-checkbox-label', 't98-choice', option.disabled && 't98-disabled')}>
        <input type="radio" className="t98-checkbox" name={name} value={option.value} checked={current === option.value} disabled={option.disabled}
          onChange={() => { if (value === undefined) setInner(option.value); onValueChange?.(option.value); }} />
        {choiceText(option)}
      </label>)}
    </div>
  </FieldsetBase>;
}

export interface CheckboxGroupProps extends ChoiceGroupProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  name?: string;
  /** Scrolls long lists inside a labelled, keyboard-focusable region. */
  maxHeight?: ScrollHeight;
}
/** Multiple choice from a native checkbox list. */
export function CheckboxGroup({ legend, description, options, disabled, orientation = 'vertical', error, value, onValueChange, name, maxHeight }: CheckboxGroupProps) {
  const layout = orientation === 'horizontal' ? 't98-choice-row' : 't98-choice-column';
  const list = options.map(option => <Checkbox key={option.value} className="t98-choice" name={name} value={option.value} checked={value.includes(option.value)} disabled={option.disabled}
    onChange={event => onValueChange(event.target.checked ? [...value, option.value] : value.filter(item => item !== option.value))} label={choiceText(option)} />);
  return <FieldsetBase legend={legend} description={description} error={error} disabled={disabled} invalid={!!error}>
    {maxHeight
      ? <div className={cx('t98-scroll-region', `t98-scroll-region--${maxHeight}`, layout)} role="region" tabIndex={0} aria-label={`${typeof legend === 'string' ? legend : 'Available'} options`}>{list}</div>
      : <div className={layout}>{list}</div>}
  </FieldsetBase>;
}

export interface SegmentedOption { value: string; label: ReactNode; disabled?: boolean }
export interface SegmentedControlProps { label: string; options: SegmentedOption[]; value: string; onValueChange: (value: string) => void }
/** Single-choice toggle buttons with a roving tab stop; arrow keys move and select. */
export function SegmentedControl({ label, options, value, onValueChange }: SegmentedControlProps) {
  const group = useRef<HTMLDivElement>(null);
  const enabled = options.map((option, index) => ({ option, index })).filter(({ option }) => !option.disabled);
  const stop = options.some(option => option.value === value && !option.disabled) ? value : enabled[0]?.option.value;
  function move(event: KeyboardEvent, index: number) {
    const position = enabled.findIndex(item => item.index === index);
    let next: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (position + 1) % enabled.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (position - 1 + enabled.length) % enabled.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = enabled.length - 1;
    else return;
    event.preventDefault();
    onValueChange(enabled[next].option.value);
    group.current?.querySelectorAll<HTMLButtonElement>('button')[enabled[next].index]?.focus();
  }
  return <div className="t98-segmented" role="group" aria-label={label} ref={group}>
    {options.map((option, index) => <button key={option.value} type="button" className="t98-segmented-option" aria-pressed={option.value === value} disabled={option.disabled}
      tabIndex={option.value === stop ? 0 : -1} onClick={() => onValueChange(option.value)} onKeyDown={event => move(event, index)}>{option.label}</button>)}
  </div>;
}

export interface PagerProps { onPrevious?: () => void; onNext?: () => void; label?: string; status?: ReactNode; previousLabel?: string; nextLabel?: string }
/** Previous/next navigation; an absent handler disables that end. */
export function Pager({ onPrevious, onNext, label = 'Pagination', status, previousLabel = 'Previous', nextLabel = 'Next' }: PagerProps) {
  return <nav className="t98-pager" aria-label={label}>
    <Button variant="secondary" className="t98-pager-button" disabled={!onPrevious} onClick={onPrevious}><Icon name="chevron-left" size={16} />{previousLabel}</Button>
    {status !== undefined && <span className="t98-pager-status" role="status">{status}</span>}
    <Button variant="secondary" className="t98-pager-button" disabled={!onNext} onClick={onNext}>{nextLabel}<Icon name="chevron-right" size={16} /></Button>
  </nav>;
}

export interface CodeBlockProps { code: string; language?: string; label?: string; wrap?: boolean; maxHeight?: ScrollHeight; copy?: boolean }
/** Preformatted code. `language` is a label only; there is no syntax highlighting. */
export function CodeBlock({ code, language, label, wrap = false, maxHeight, copy = false }: CodeBlockProps) {
  return <div className="t98-code-block">
    {(language || copy) && <div className="t98-code-header"><span className="t98-code-language">{language}</span>{copy && <CopyButton value={code} label="Copy code" />}</div>}
    <pre className={cx('t98-code-pre', wrap && 't98-code-pre--wrap', maxHeight && `t98-scroll-region--${maxHeight}`)} role="region" tabIndex={0} aria-label={label ?? (language ? `${language} code` : 'Code')}><code>{code}</code></pre>
  </div>;
}

/** Short code within running text. */
export function InlineCode({ children }: { children: ReactNode }) {
  return <code className="t98-inline-code">{children}</code>;
}

export interface StatusLineProps { tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'; busy?: boolean; live?: 'polite' | 'assertive'; children: ReactNode }
/** A status message, optionally with a spinner while work is in progress. */
export function StatusLine({ tone = 'neutral', busy = false, live = 'polite', children }: StatusLineProps) {
  return <p className={cx('t98-status-line', tone !== 'neutral' && `t98-status-line--${tone}`)} role={live === 'assertive' ? 'alert' : 'status'} aria-live={live} aria-busy={busy || undefined}>
    {busy && <span className="t98-spinner" aria-hidden="true" />}<span>{children}</span>
  </p>;
}

export interface ComboboxProps {
  label: ReactNode;
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  description?: ReactNode;
  /** Shown when `allowCustom` is true, or when it is false and the value is not an option. */
  error?: ReactNode;
  allowCustom?: boolean;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}
/** A text input with native suggestions. The message for a value outside the list is the caller's. */
export function Combobox({ label, options, value, onValueChange, description, error, allowCustom = true, name, placeholder, required, disabled }: ComboboxProps) {
  const id = useId();
  const outside = !allowCustom && value !== '' && !options.includes(value);
  // The datalist sits outside Field, which would otherwise pass its id and description to every child.
  return <>
    <Field label={label} htmlFor={id} description={description} error={allowCustom || outside ? error : undefined}>
      <Input name={name} list={`${id}-options`} value={value} placeholder={placeholder} required={required} disabled={disabled} autoComplete="off" onChange={event => onValueChange(event.target.value)} />
    </Field>
    <datalist id={`${id}-options`}>{options.map(option => <option key={option} value={option} />)}</datalist>
  </>;
}

export interface ScrollerProps { label: string; children: ReactNode }
/** A labelled, keyboard-scrollable region for wide tables and charts. */
export function Scroller({ label, children }: ScrollerProps) {
  return <div className="t98-scroller" role="region" tabIndex={0} aria-label={label}>{children}</div>;
}

export interface DateTimeFieldProps {
  label: ReactNode;
  type?: 'date' | 'time' | 'datetime-local';
  /** The native string for `type` (for example 2026-10-20T09:30), or an empty string. */
  value: string;
  onValueChange: (value: string) => void;
  min?: string;
  max?: string;
  step?: number | string;
  required?: boolean;
  name?: string;
  description?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  /** Visible zone the entered value is meant in, such as "Asia/Dubai (GST)". Text only: the library never converts zones. */
  timeZoneLabel?: string;
}
/** A native date, time or date-and-time input. Conversion, ranges and validation messages stay with the caller. */
export function DateTimeField({ label, type = 'datetime-local', value, onValueChange, min, max, step, required, name, description, error, disabled, timeZoneLabel }: DateTimeFieldProps) {
  const id = useId();
  const zoneId = `${id}-zone`;
  // The zone note sits outside Field, which would otherwise pass its id and description to every child.
  return <Stack gap={1}>
    <Field label={label} htmlFor={id} description={description} error={error} required={required}>
      <Input type={type} name={name} value={value} min={min} max={max} step={step} required={required} disabled={disabled} aria-describedby={timeZoneLabel ? zoneId : undefined} onChange={event => onValueChange(event.target.value)} />
    </Field>
    {timeZoneLabel && <p className="t98-field-description t98-datetime-zone" id={zoneId}>{timeZoneLabel}</p>}
  </Stack>;
}

export type FileStatus = 'pending' | 'uploading' | 'done' | 'error';
export interface FileItem { id: string; name: string; size?: number; status?: FileStatus; error?: string }
export interface FileFieldProps {
  label: ReactNode;
  accept?: string;
  multiple?: boolean;
  name?: string;
  /** Called with the chosen or dropped files. Type, size and count checks stay with the caller. */
  onFiles: (files: File[]) => void;
  description?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  busy?: boolean;
  files?: FileItem[];
  onRemove?: (id: string) => void;
}
const statusBadge: Record<Exclude<FileStatus, 'uploading'>, { tone: 'neutral' | 'success' | 'danger'; text: string }> = {
  pending: { tone: 'neutral', text: 'Pending' }, done: { tone: 'success', text: 'Uploaded' }, error: { tone: 'danger', text: 'Failed' },
};
function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const [value, unit] = bytes < 1024 * 1024 ? [bytes / 1024, 'KB'] : [bytes / (1024 * 1024), 'MB'];
  return `${value.toFixed(1).replace(/\.0$/, '')} ${unit}`;
}
/** A file chooser button with a drop zone and a list of the caller's files. Drag and drop is only an extra: the button works alone. */
export function FileField({ label, accept, multiple, name, onFiles, description, error, disabled, busy, files, onRemove }: FileFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const inactive = disabled || busy;
  const describedBy = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  function addFiles(list: File[]) {
    const chosen = multiple ? list : list.slice(0, 1);
    if (chosen.length === 0) return;
    setAnnouncement(chosen.length === 1 ? '1 file added' : `${chosen.length} files added`);
    onFiles(chosen);
  }
  function choose(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = ''; // Lets the same file be chosen again after it is removed.
  }
  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!inactive) addFiles(Array.from(event.dataTransfer.files));
  }
  return <Field label={label} htmlFor={id} description={description} error={error}>
    <div id={`${id}-zone`} className={cx('t98-file-zone', dragging && 't98-file-zone--active', inactive && 't98-file-zone--disabled')} role="group" aria-label={typeof label === 'string' ? label : 'Files'}
      onDragOver={event => { event.preventDefault(); if (!inactive) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
      <Icon name="arrow-up" size={20} />
      <span className="t98-file-hint">Drop files here or</span>
      <Button variant="secondary" disabled={disabled} loading={busy} onClick={() => input.current?.click()}>Choose files</Button>
      <Input ref={input} id={id} className="t98-file-input" type="file" name={name} accept={accept} multiple={multiple} disabled={inactive} tabIndex={-1} aria-describedby={describedBy} aria-invalid={error ? true : undefined} onChange={choose} />
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </div>
    {files && files.length > 0 && <ul id={`${id}-list`} className="t98-file-list" aria-label="Selected files">
      {files.map(file => {
        const errorId = `${id}-${file.id}-error`;
        return <li key={file.id} className="t98-file-item">
          <Icon name="file" size={18} />
          <span className="t98-file-name">{file.name}</span>
          {file.size !== undefined && <span className="t98-file-size">{formatFileSize(file.size)}</span>}
          {file.status === 'uploading' ? <Progress label={`Uploading ${file.name}`} className="t98-file-progress" /> : file.status && <Badge tone={statusBadge[file.status].tone}>{statusBadge[file.status].text}</Badge>}
          {onRemove && <Button variant="ghost" className="t98-file-remove" aria-label={`Remove ${file.name}`} aria-describedby={file.error ? errorId : undefined} icon={<Icon name="x" size={16} />} onClick={() => onRemove(file.id)} />}
          {file.error && <p className="t98-field-error t98-file-error" id={errorId}>{file.error}</p>}
        </li>;
      })}
    </ul>}
  </Field>;
}
