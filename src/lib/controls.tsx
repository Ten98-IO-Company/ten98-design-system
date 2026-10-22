'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type FormHTMLAttributes, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { Badge, Button, Checkbox, Field, Icon, Input, Progress, cx, type IconName } from './primitives.js';
import { Link, Stack, VisuallyHidden, type Space } from './structure.js';
import { CopyButton } from './workspace.js';
import { formatFileSize } from './format.js';
import { useSingleSubmit } from './flow-frame.js';

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

export type FieldsetProps = Pick<FieldsetBaseProps, 'legend' | 'description' | 'error' | 'disabled' | 'hideLegend' | 'layout' | 'children'>;
/** Native fieldset/legend grouping for related fields. */
export function Fieldset(props: FieldsetProps) {
  // An error is linked to the group and marks it invalid, so composed controls need no error paragraph of their own.
  return <FieldsetBase {...props} invalid={Boolean(props.error)} />;
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
  /** Native required: a choice must be made before a form submits. */
  required?: boolean;
}
/** Single choice from a native radio list; arrow keys move the selection. */
export function RadioGroup({ legend, description, options, disabled, orientation = 'vertical', error, name, value, defaultValue, onValueChange, required }: RadioGroupProps) {
  const [inner, setInner] = useState(defaultValue ?? '');
  const current = value ?? inner;
  return <FieldsetBase legend={legend} description={description} error={error} disabled={disabled} role="radiogroup" invalid={!!error}>
    <div className={orientation === 'horizontal' ? 't98-choice-row' : 't98-choice-column'}>
      {options.map(option => <label key={option.value} className={cx('t98-checkbox-label', 't98-choice', option.disabled && 't98-disabled')}>
        <input type="radio" required={required} className="t98-checkbox" name={name} value={option.value} checked={current === option.value} disabled={option.disabled}
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

export interface LoadMoreProps {
  onLoadMore: () => void;
  /** More items exist after the ones shown. */
  hasMore: boolean;
  /** A page is loading; the button stays focusable and shows progress. */
  busy?: boolean;
  /** Items shown so far, and the total when known (null when unknown). */
  shown?: number;
  total?: number | null;
  /** Noun for the count, for example "messages". */
  itemLabel?: string;
  /** More exist but cannot be loaded (for example no cursor or no permission): shown instead of the button. */
  unavailableReason?: ReactNode;
  label?: string;
  endMessage?: ReactNode;
}
/** Cursor-based "load more" with a count status. Previous/next page navigation is Pager. While busy the button is
 * aria-disabled rather than disabled, so focus stays on it through the load. */
export function LoadMore({ onLoadMore, hasMore, busy = false, shown, total, itemLabel = 'items', unavailableReason, label = 'Load more', endMessage = 'Everything is shown.' }: LoadMoreProps) {
  const count = shown === undefined ? null : total != null && Number.isFinite(total) ? `Showing ${shown} of ${total} ${itemLabel}` : `Showing ${shown} ${itemLabel}`;
  return <div className="t98-load-more">
    <span className="t98-load-more-status" role="status">{busy ? `Loading more ${itemLabel}…` : count}</span>
    {hasMore ? unavailableReason != null ? <p className="t98-load-more-reason">{unavailableReason}</p>
      : <Button variant="secondary" aria-disabled={busy || undefined} aria-busy={busy || undefined} onClick={() => { if (!busy) onLoadMore(); }}>{busy ? 'Loading…' : label}</Button>
      : <p className="t98-load-more-end">{endMessage}</p>}
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

export interface MediaTrack { src: string; srcLang: string; label: string; kind?: 'captions' | 'subtitles' | 'descriptions' | 'chapters'; default?: boolean }
export interface MediaPlayerProps {
  kind: 'audio' | 'video';
  /** Visible caption and accessible name, for example "Voice note from Lina, 0:42". */
  label: string;
  src?: string;
  /** MIME type, so the browser can skip a format it cannot play. */
  type?: string;
  poster?: string;
  /** Intrinsic video size, so the frame reserves its aspect ratio before loading. */
  width?: number;
  height?: number;
  /** Caption, subtitle or description tracks (WebVTT). Video with speech needs captions. */
  tracks?: readonly MediaTrack[];
  /** Text equivalent in a collapsed Transcript disclosure; audio-only content needs one. */
  transcript?: ReactNode;
  /** Offered when the browser cannot play the file. */
  downloadHref?: string;
  /** `none` fetches nothing until play, for long lists of voice notes; defaults to `metadata`. */
  preload?: 'none' | 'metadata';
  /** Replaces the player when the media is unavailable, expired, processing or not authorized. */
  unavailable?: ReactNode;
  className?: string;
}
/** Native audio or video controls with captions, a transcript and a visible fallback when the file cannot be played. Nothing autoplays; only metadata is preloaded. */
export function MediaPlayer({ kind, label, src, type, poster, width, height, tracks = [], transcript, downloadHref, unavailable, preload = 'metadata', className }: MediaPlayerProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = src !== undefined && failedSrc === src;
  const fail = () => { if (src !== undefined) setFailedSrc(src); };
  const download = downloadHref ? <Link href={downloadHref} download>Download {label}</Link> : null;
  // A failing <source> reports the error on itself, not on the media element, so both listen.
  const children = <>
    <source src={src} type={type} onError={fail} />
    {tracks.map(track => <track key={track.src} kind={track.kind ?? 'captions'} src={track.src} srcLang={track.srcLang} label={track.label} default={track.default} />)}
    {download}
  </>;
  const shared = { className: 't98-media-player-element', controls: true, preload, 'aria-label': label, onError: fail } as const;
  return <figure className={cx('t98-media-player', `t98-media-player--${kind}`, className)}>
    <figcaption className="t98-media-player-label">{label}</figcaption>
    {unavailable != null ? <p className="t98-media-player-reason">{unavailable}</p>
      : src === undefined ? <p className="t98-media-player-reason">No {kind} supplied.</p>
      : failed ? <p className="t98-media-player-reason">This {kind} cannot be played in this browser.{download && <> {download}</>}</p>
      : kind === 'audio' ? <audio key={src} {...shared}>{children}</audio>
      : <video key={src} {...shared} poster={poster} width={width} height={height} playsInline>{children}</video>}
    {transcript != null && <Disclosure summary="Transcript" variant="plain">{transcript}</Disclosure>}
  </figure>;
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

export interface ComboboxOption {
  value: string;
  label: string;
  /** Secondary text under the label, for example a category path or an audience size. Part of the option's description. */
  description?: string;
  /** Listed but not pickable; `disabledReason` is shown under the label and stated with the option. */
  disabled?: boolean;
  disabledReason?: string;
}

interface ComboboxAsyncProps {
  /** Called with the typed text, and with an empty string when the field closes after typing, so the app can search. */
  onInputChange?: (text: string) => void;
  /** False when the app already filtered `options` (for example on the server); they are then shown as supplied. */
  filter?: boolean;
  /** Results are being fetched. Supplied options stay visible and "Loading results" is shown and announced. */
  loading?: boolean;
  /** Shown in the popup, and announced, when results could not be fetched. */
  loadError?: string;
}

export interface ComboboxProps extends ComboboxAsyncProps {
  label: ReactNode;
  options: string[] | ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Label for `value` when it is not among the current `options`, for example after async results change. */
  valueLabel?: string;
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
 * ArrowUp moves to the previous option and wraps, and Enter on an open list with no highlighted option only closes it.
 * Async loading (onInputChange, filter=false, loading) follows react-aria useComboBox (Apache-2.0); multiple selection
 * follows Downshift useMultipleSelection (MIT): picks keep the list open, Backspace in an empty input removes the last pick,
 * and aria-selected marks picked options in an aria-multiselectable listbox. Behaviour only; no code is copied. */
interface ComboboxControlProps extends ComboboxAsyncProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  options: ComboboxOption[];
  /** Input text while the user is not typing. */
  text: string;
  onType: (typed: string) => void;
  onPick: (option: ComboboxOption) => void;
  /** Escape on a closed list. */
  onClear: () => void;
  onLeave: () => void;
  label: ReactNode;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  emptyMessage: string;
  /** Multiple selection: picked values, shown as selected options; the list stays open after a pick. */
  picked?: ReadonlySet<string>;
  /** Backspace in an empty input (multiple selection). */
  onRemoveLast?: () => void;
  /** Announced in place of the result count, for example after a pick; the owner clears it when the user types. */
  notice?: string;
  inputRef?: Ref<HTMLInputElement>;
  /** Controlled typed text: the control reports changes through onInputValueChange and never clears it itself. */
  inputValue?: string;
  onInputValueChange?: (text: string) => void;
  /** Options that cannot be picked right now (for example a selection limit), with the reason stated. */
  blockReason?: (option: ComboboxOption) => string | undefined;
  /** Rendered before the input, such as picked tags. */
  before?: ReactNode;
  /** Rendered after the input, such as hidden form inputs. */
  children?: ReactNode;
}
function ComboboxControl({ id, options, text, onType, onPick, onClear, onLeave, label, placeholder, required, disabled, emptyMessage, picked, onRemoveLast, notice, inputRef, inputValue, onInputValueChange, blockReason, before, children, onInputChange, filter = true, loading = false, loadError, ...described }: ComboboxControlProps) {
  const generated = useId();
  const listId = `${generated}-list`;
  const optionId = (index: number) => `${generated}-option-${index}`;
  const multiple = picked !== undefined;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // The text typed since the field was last closed. It filters the options and is shown as typed, because a
  // typed value that happens to equal another option's value must not be rewritten to that option's label. Null shows every option.
  const [ownQuery, setQuery] = useState<string | null>(null);
  // A controlled query belongs to the app: picks and closing never reset it, so its search results stay in step.
  const query = inputValue !== undefined ? (inputValue === '' ? null : inputValue) : ownQuery;
  const list = useRef<HTMLUListElement>(null);
  const needle = filter ? query?.toLowerCase() : undefined;
  const shown = needle ? options.filter(option => option.label.toLowerCase().includes(needle)) : options;
  const count = shown.length;
  const activeOption = open && active >= 0 && active < count ? active : -1;

  useEffect(() => {
    if (activeOption >= 0) list.current?.children[activeOption]?.scrollIntoView({ block: 'nearest' });
  }, [activeOption]);

  function type(typed: string | null) {
    if (inputValue !== undefined) { if (typed !== null) onInputValueChange?.(typed); return; }
    setQuery(typed); onInputChange?.(typed ?? '');
  }
  function close() { setOpen(false); setActive(-1); if (query !== null) type(null); }
  const reasonFor = (option: ComboboxOption) => option.disabled ? option.disabledReason ?? 'Unavailable' : blockReason?.(option);
  function accept(option: ComboboxOption) {
    if (reasonFor(option) !== undefined) return;
    onPick(option);
    if (!multiple) close();
    else if (query) { type(null); setActive(-1); }
  }
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
        if (open) { event.preventDefault(); event.stopPropagation(); close(); } else if (text !== '') { event.preventDefault(); onClear(); }
        return;
      case 'Backspace':
        if (onRemoveLast && event.currentTarget.value === '') onRemoveLast();
        return;
      case 'Tab':
        close();
        return;
    }
  }
  const status = notice ? notice : !open ? '' : loading ? 'Loading results' : loadError ? loadError : count === 0 ? emptyMessage : `${count} ${count === 1 ? 'result' : 'results'} available`;

  return <div className="t98-combobox">
    {before}
    <Input id={id} ref={inputRef} {...described} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={activeOption >= 0 ? optionId(activeOption) : undefined}
      value={query ?? text} placeholder={placeholder} required={required} disabled={disabled} autoComplete="off" spellCheck={false}
      onChange={event => { onType(event.target.value); type(event.target.value); setActive(-1); setOpen(true); }}
      onKeyDown={onKeyDown}
      onBlur={() => { close(); onLeave(); }} />
    {children}
    <div className="t98-combobox-popup" hidden={!open} aria-busy={loading || undefined}>
      <ul className="t98-combobox-list" id={listId} role="listbox" aria-label={typeof label === 'string' ? label : 'Options'} aria-multiselectable={multiple || undefined} ref={list} hidden={count === 0}>
        {shown.map((option, index) => <li key={option.value} id={optionId(index)} role="option"
          // Single selection marks the highlighted option (APG); multiple selection marks picks and highlights with data-active.
          aria-selected={picked ? picked.has(option.value) : index === activeOption} className="t98-combobox-option" data-active={index === activeOption || undefined}
          aria-disabled={reasonFor(option) !== undefined || undefined}
          // Keep focus in the input so the list does not close before the click is handled.
          onMouseDown={event => event.preventDefault()} onClick={() => accept(option)}>
          {multiple && <Icon name="check" size={16} className="t98-combobox-check" />}
          {option.description || reasonFor(option) !== undefined ? <span className="t98-combobox-option-text"><span>{option.label}</span>{option.description && <span className="t98-combobox-option-description">{option.description}</span>}{reasonFor(option) !== undefined && <span className="t98-combobox-option-description">{reasonFor(option)}</span>}</span> : option.label}</li>)}
      </ul>
      {loading ? <p className="t98-combobox-empty" aria-hidden="true">Loading results…</p>
        : loadError ? <p className="t98-combobox-empty" aria-hidden="true">{loadError}</p>
        : count === 0 && <p className="t98-combobox-empty" aria-hidden="true">{emptyMessage}</p>}
    </div>
    <span role="status" className="t98-visually-hidden">{status}</span>
  </div>;
}

/** An editable combobox with list autocomplete, optionally fed by app-fetched results. The message for a value outside the list is the caller's. */
export function Combobox({ label, options, value, onValueChange, valueLabel, description, error, allowCustom = true, name, placeholder, required, disabled, emptyMessage = 'No matches', ...async }: ComboboxProps) {
  const id = useId();
  const [left, setLeft] = useState(false);
  const normalized: ComboboxOption[] = options.map(option => typeof option === 'string' ? { value: option, label: option } : option);
  const listed = normalized.some(option => option.value === value) || (valueLabel !== undefined && value !== '');
  const outside = !allowCustom && left && value !== '' && !listed;
  // Field passes its id, description and invalid state to the first child, which hands them to the input.
  return <Field label={label} htmlFor={id} description={description} error={allowCustom || outside ? error : undefined} required={required}>
    <ComboboxControl {...async} options={normalized} text={normalized.find(option => option.value === value)?.label ?? valueLabel ?? value}
      onType={typed => onValueChange(normalized.find(option => option.label === typed && !option.disabled)?.value ?? typed)} onPick={option => onValueChange(option.value)} onClear={() => onValueChange('')}
      onLeave={() => setLeft(true)} label={label} placeholder={placeholder} required={required} disabled={disabled} emptyMessage={emptyMessage}>
      {/* A list-only field never posts text that is not one of its options. */}
      {name && <input type="hidden" name={name} value={allowCustom || listed ? value : ''} />}
    </ComboboxControl>
  </Field>;
}

export interface MultiComboboxProps extends ComboboxAsyncProps {
  label: ReactNode;
  options: ComboboxOption[];
  /** Picked options, in pick order. Options keep their labels, so picks survive async result changes. */
  values: readonly ComboboxOption[];
  onValuesChange: (values: ComboboxOption[]) => void;
  description?: ReactNode;
  error?: ReactNode;
  /** One hidden input per picked value, so native forms receive every value under this name. */
  name?: string;
  placeholder?: string;
  /** At least one value is needed; the input is only marked required while nothing is picked. */
  required?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  /** Most picks allowed; at the limit the other options are listed but not pickable, with the reason. */
  max?: number;
  /** Controlled typed text for app-run searches; the field never clears it on pick or blur. */
  inputValue?: string;
  onInputValueChange?: (text: string) => void;
}

/** Pick several listed options: the list stays open after each pick, picks are removable tags, and Backspace in the empty input removes the last one. */
export function MultiCombobox({ label, options, values, onValuesChange, description, error, name, placeholder, required, disabled, emptyMessage = 'No matches', max, inputValue, onInputValueChange, ...async }: MultiComboboxProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [announcement, setAnnouncement] = useState('');
  const picked = new Set(values.map(option => option.value));
  const full = max !== undefined && values.length >= max;
  // Announce what the app actually committed, so a pick it rejects (values unchanged) is never announced as added.
  const previous = useRef(values);
  useEffect(() => {
    const before = new Set(previous.current.map(option => option.value));
    const after = new Set(values.map(option => option.value));
    const added = values.filter(option => !before.has(option.value)).map(option => `${option.label} added`);
    const removed = previous.current.filter(option => !after.has(option.value)).map(option => `${option.label} removed`);
    previous.current = values;
    if (added.length || removed.length) setAnnouncement([...removed, ...added].join(', '));
  }, [values]);
  function remove(option: ComboboxOption) {
    onValuesChange(values.filter(current => current.value !== option.value));
    input.current?.focus();
  }
  function toggle(option: ComboboxOption) {
    if (picked.has(option.value)) { remove(option); return; }
    if (full) return;
    onValuesChange([...values, option]);
  }
  const labelText = typeof label === 'string' ? label : 'values';
  return <Field label={label} htmlFor={id} description={description} error={error} required={required}>
    <ComboboxControl {...async} options={options} text="" picked={picked} notice={announcement} onType={() => setAnnouncement('')} onPick={toggle} onClear={() => {}} onLeave={() => {}}
      inputValue={inputValue} onInputValueChange={onInputValueChange} blockReason={option => full && !picked.has(option.value) ? `You can pick up to ${max}.` : undefined}
      onRemoveLast={() => { const last = values.at(-1); if (last) remove(last); }} inputRef={input}
      label={label} placeholder={placeholder} required={required && values.length === 0} disabled={disabled} emptyMessage={emptyMessage}
      before={values.length > 0 && <ul className="t98-combobox-tags" aria-label={`Selected ${labelText}`}>
        {values.map(option => <li key={option.value} className="t98-combobox-tag">
          <span className="t98-combobox-tag-label">{option.label}</span>
          <Button variant="ghost" className="t98-combobox-tag-remove" aria-label={`Remove ${option.label}`} disabled={disabled} onClick={() => remove(option)}><Icon name="x" size={16} /></Button>
        </li>)}
      </ul>}>
      {name && values.map(option => <input key={option.value} type="hidden" name={name} value={option.value} />)}
    </ComboboxControl>
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
export interface FileItem {
  id: string;
  name: string;
  size?: number;
  status?: FileStatus;
  /** Upload progress from 0 to 100 while `status` is uploading; omit it when the transfer size is unknown. */
  progress?: number;
  error?: string;
}
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
          {file.status === 'uploading' ? <Progress value={file.progress} label={`Uploading ${file.name}`} className="t98-file-progress" /> : file.status && <Badge tone={statusBadge[file.status].tone}>{statusBadge[file.status].text}</Badge>}
          {onRemove && <Button variant="ghost" className="t98-file-remove" aria-label={`Remove ${file.name}`} aria-describedby={file.error ? errorId : undefined} icon={<Icon name="x" size={16} />} onClick={() => onRemove(file.id)} />}
          {file.error && <p className="t98-field-error t98-file-error" id={errorId}>{file.error}</p>}
        </li>;
      })}
    </ul>}
  </Field>;
}

export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'style' | 'onSubmit'> {
  /** Called once per submit with the form data (including the submit button's own name and value). Repeat submits are
   * ignored until it settles. Omit it for a native form that posts and navigates. Native validation runs first. */
  onSubmit?: (data: FormData, event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  /** Busy state owned by the app, for example while a store mutation is pending; it locks the form like a pending submit. */
  busy?: boolean;
  /** Vertical gap between direct children. */
  gap?: Space;
}

/** A native form that locks its controls while a submit is pending (or `busy`) and ignores repeat submits. Focus returns
 * to the control that submitted when the lock lifts, so keyboard users keep their place. */
export function Form({ onSubmit, busy = false, gap = 4, className, children, ...props }: FormProps) {
  const single = useSingleSubmit();
  const [pending, setPending] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const locked = busy || pending;
  useEffect(() => {
    if (locked || !returnFocus.current) return;
    if (document.activeElement === document.body || document.activeElement === null) returnFocus.current.focus();
    returnFocus.current = null;
  }, [locked]);
  return <form {...props} className={cx('t98-form', 't98-stack', `t98-gap-${gap}`, className)} aria-busy={locked || undefined}
    onSubmit={event => {
      if (!onSubmit) { if (locked) event.preventDefault(); return; }
      event.preventDefault();
      if (locked) return;
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
      returnFocus.current = submitter ?? (document.activeElement as HTMLElement | null);
      const data = new FormData(event.currentTarget, submitter);
      void single(async () => { setPending(true); try { await onSubmit(data, event); } finally { setPending(false); } });
    }}>
    <fieldset className="t98-form-body" disabled={locked}>{children}</fieldset>
  </form>;
}

export interface PopoverProps {
  /** Accessible name of the popover panel, for example "Emoji". */
  label: string;
  /** Visible text of the trigger button. */
  triggerLabel: ReactNode;
  /** Accessible name of the trigger when it shows an icon only. */
  triggerAriaLabel?: string;
  triggerIcon?: IconName;
  triggerVariant?: 'primary' | 'secondary' | 'ghost';
  /** Preferred side; the panel flips and stays inside the viewport. */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  /** Controlled open state; omit to let the trigger toggle it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

const GAP = 6;
/** Where the panel goes: the preferred side if it fits, else the other side; always clamped inside the viewport. */
function placePopover(anchor: DOMRect, panel: { width: number; height: number }, viewport: { width: number; height: number }, placement: NonNullable<PopoverProps['placement']>, rtl = false) {
  const wantsTop = placement.startsWith('top');
  const below = anchor.bottom + GAP, above = anchor.top - GAP - panel.height;
  const fitsBelow = below + panel.height <= viewport.height, fitsAbove = above >= 0;
  const top = wantsTop ? (fitsAbove || !fitsBelow ? above : below) : (fitsBelow || !fitsAbove ? below : above);
  // "start" means the inline start: the left edge in LTR, the right edge in RTL.
  const alignEnd = placement.endsWith('end') !== rtl;
  const left = alignEnd ? anchor.right - panel.width : anchor.left;
  const clamp = (value: number, size: number, max: number) => Math.max(GAP, Math.min(value, max - size - GAP));
  return { top: clamp(top, panel.height, viewport.height), left: clamp(left, panel.width, viewport.width) };
}

/**
 * A non-modal panel anchored to its trigger, such as an emoji or filter picker. Uses the native popover attribute: it opens in
 * the top layer, Escape and a click outside close it, and focus moves into it and back to the trigger. The panel is a labelled
 * non-modal dialog; placement flips above or below and stays inside the viewport, mirrored in right-to-left layouts.
 */
export function Popover({ label, triggerLabel, triggerAriaLabel, triggerIcon, triggerVariant = 'secondary', placement = 'bottom-start', open, onOpenChange, disabled = false, children, className }: PopoverProps) {
  const id = useId().replace(/:/g, '');
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const place = () => {
    const anchor = trigger.current?.getBoundingClientRect(), node = panel.current;
    if (!anchor || !node) return;
    setPosition(placePopover(anchor, { width: node.offsetWidth, height: node.offsetHeight }, { width: window.innerWidth, height: window.innerHeight }, placement, getComputedStyle(node).direction === 'rtl'));
  };
  useEffect(() => {
    const node = panel.current;
    if (!node) return;
    const onToggle = (event: Event) => {
      const now = (event as ToggleEvent).newState === 'open';
      setIsOpen(now);
      onOpenChange?.(now);
      if (now) {
        place();
        // Focus the first control in the panel, or the panel itself.
        (node.querySelector<HTMLElement>('[autofocus], button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex]:not([tabindex="-1"])') ?? node).focus();
      } else if (node.contains(document.activeElement) || document.activeElement === document.body) trigger.current?.focus();
    };
    node.addEventListener('toggle', onToggle);
    return () => node.removeEventListener('toggle', onToggle);
  }, [placement, onOpenChange]);
  // Controlled mode: follow the open prop.
  useEffect(() => {
    const node = panel.current;
    if (!node || open === undefined || typeof node.showPopover !== 'function') return;
    const shown = node.matches(':popover-open');
    if (open && !shown) node.showPopover(); else if (!open && shown) node.hidePopover();
  }, [open]);
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [isOpen]);
  return <span className={cx('t98-popover', className)}>
    <Button ref={trigger} variant={triggerVariant} disabled={disabled} popoverTarget={`${id}-panel`} aria-controls={`${id}-panel`} aria-expanded={isOpen} aria-haspopup="dialog" aria-label={triggerAriaLabel}
      icon={triggerIcon ? <Icon name={triggerIcon} size={16} /> : undefined}
      onClick={open !== undefined ? event => { event.preventDefault(); onOpenChange?.(!open); } : undefined}>{triggerLabel}</Button>
    <div ref={panel} id={`${id}-panel`} popover="auto" role="dialog" aria-label={label} tabIndex={-1} className="t98-popover-panel"
      style={position ? { top: position.top, left: position.left } : undefined}>{children}</div>
  </span>;
}

