'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
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
    <details className="t98-disclosure-details" open={expanded} onToggle={event => {
      // Summary clicks are handled below; this syncs opens the browser makes itself, such as find-in-page.
      const now = event.currentTarget.open;
      if (now === expanded) return;
      if (open === undefined) setInner(now);
      onOpenChange?.(now);
    }}>
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
    // Horizontal arrows follow the writing direction, so in RTL ArrowLeft moves to the next option.
    const rtl = group.current ? getComputedStyle(group.current).direction === 'rtl' : false;
    const forward = event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    const backward = event.key === 'ArrowUp' || event.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
    if (forward) next = (position + 1) % enabled.length;
    else if (backward) next = (position - 1 + enabled.length) % enabled.length;
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

export interface ComboboxOption { value: string; label: string }
export interface ComboboxProps {
  label: ReactNode;
  options: string[] | ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  description?: ReactNode;
  /** Shown when `allowCustom` is true, or when it is false and the field was left with a value that is not an option. */
  error?: ReactNode;
  /** When false, leaving the field with text that is not an option shows `error` and keeps the text. */
  allowCustom?: boolean;
  /** Carried by a hidden input so native forms receive the value. */
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Shown in the popup, and announced, when nothing matches the typed text. */
  emptyMessage?: string;
}

/* Behaviour ported from the W3C WAI-ARIA Authoring Practices Guide, "Editable Combobox With List Autocomplete":
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/
 * (W3C Software and Document License; see THIRD_PARTY_NOTICES.md). Adapted to React 19 and t98 tokens.
 * DOM focus stays on the input; the highlighted option is exposed with aria-activedescendant.
 * Deviations from the example: filtering matches anywhere in the label (case-insensitive) rather than as a prefix,
 * ArrowUp moves to the previous option and wraps, and Enter on an open list with no highlighted option only closes it. */
interface ComboboxControlProps {
  id?: string;
  /** The value the hidden input posts; empty when a list-only field holds unlisted text. */
  submitValue: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  onLeave: () => void;
  label: ReactNode;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  emptyMessage: string;
}
function ComboboxControl({ id, options, value, submitValue, onValueChange, onLeave, label, name, placeholder, required, disabled, emptyMessage, ...described }: ComboboxControlProps) {
  const generated = useId();
  const listId = `${generated}-list`;
  const optionId = (index: number) => `${generated}-option-${index}`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // The text typed since the field was last closed. It filters the options and is shown as typed, because a
  // typed value that happens to equal another option's value must not be rewritten to that option's label. Null shows every option.
  const [query, setQuery] = useState<string | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const text = options.find(option => option.value === value)?.label ?? value;
  const needle = query?.toLowerCase();
  const shown = needle ? options.filter(option => option.label.toLowerCase().includes(needle)) : options;
  const count = shown.length;
  const activeOption = open && active >= 0 && active < count ? active : -1;

  useEffect(() => {
    if (activeOption >= 0) list.current?.children[activeOption]?.scrollIntoView({ block: 'nearest' });
  }, [activeOption]);

  function close() { setOpen(false); setActive(-1); setQuery(null); }
  function accept(option: ComboboxOption) { onValueChange(option.value); close(); }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (event.altKey) { setOpen(true); return; }
        setOpen(true);
        if (count) setActive(activeOption < 0 ? 0 : (activeOption + 1) % count);
        return;
      case 'ArrowUp':
        event.preventDefault();
        setOpen(true);
        if (count) setActive(activeOption < 0 ? count - 1 : (activeOption - 1 + count) % count);
        return;
      case 'Enter':
        if (!open) return;
        event.preventDefault();
        if (activeOption >= 0) accept(shown[activeOption]); else close();
        return;
      case 'Escape':
        if (open) { event.preventDefault(); event.stopPropagation(); close(); } else if (value !== '') { event.preventDefault(); onValueChange(''); }
        return;
      case 'Tab':
        close();
        return;
    }
  }

  return <div className="t98-combobox">
    <Input id={id} {...described} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={activeOption >= 0 ? optionId(activeOption) : undefined}
      value={query ?? text} placeholder={placeholder} required={required} disabled={disabled} autoComplete="off" spellCheck={false}
      onChange={event => {
        const typed = event.target.value;
        onValueChange(options.find(option => option.label === typed)?.value ?? typed);
        setQuery(typed); setActive(-1); setOpen(true);
      }}
      onKeyDown={onKeyDown}
      onBlur={() => { close(); onLeave(); }} />
    {name && <input type="hidden" name={name} value={submitValue} />}
    <div className="t98-combobox-popup" hidden={!open}>
      <ul className="t98-combobox-list" id={listId} role="listbox" aria-label={typeof label === 'string' ? label : 'Options'} ref={list} hidden={count === 0}>
        {shown.map((option, index) => <li key={option.value} id={optionId(index)} role="option" aria-selected={index === activeOption} className="t98-combobox-option"
          // Keep focus in the input so the list does not close before the click is handled.
          onMouseDown={event => event.preventDefault()} onClick={() => accept(option)}>{option.label}</li>)}
      </ul>
      {count === 0 && <p className="t98-combobox-empty" aria-hidden="true">{emptyMessage}</p>}
    </div>
    <span role="status" className="t98-visually-hidden">{open ? (count === 0 ? emptyMessage : `${count} ${count === 1 ? 'result' : 'results'} available`) : ''}</span>
  </div>;
}

/** An editable combobox with list autocomplete. The message for a value outside the list is the caller's. */
export function Combobox({ label, options, value, onValueChange, description, error, allowCustom = true, name, placeholder, required, disabled, emptyMessage = 'No matches' }: ComboboxProps) {
  const id = useId();
  const [left, setLeft] = useState(false);
  const normalized: ComboboxOption[] = options.map(option => typeof option === 'string' ? { value: option, label: option } : option);
  const outside = !allowCustom && left && value !== '' && !normalized.some(option => option.value === value);
  // Field passes its id, description and invalid state to the first child, which hands them to the input.
  return <Field label={label} htmlFor={id} description={description} error={allowCustom || outside ? error : undefined} required={required}>
    <ComboboxControl options={normalized} value={value} onValueChange={onValueChange} onLeave={() => setLeft(true)} label={label} name={name}
      // A list-only field never posts text that is not one of its options.
      submitValue={allowCustom || normalized.some(option => option.value === value) ? value : ''} placeholder={placeholder} required={required} disabled={disabled} emptyMessage={emptyMessage} />
  </Field>;
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
