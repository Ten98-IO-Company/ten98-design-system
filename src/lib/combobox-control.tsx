'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { Icon, Input } from './primitives.js';
import type { ComboboxAsyncProps, ComboboxOption } from './controls.js';

// Internal: the combobox behaviour shared by Combobox, MultiCombobox and EntryGrid lookup cells. Not exported from the package.
/* Behaviour ported from the W3C WAI-ARIA Authoring Practices Guide, "Editable Combobox With List Autocomplete":
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/
 * (W3C Software and Document License; see THIRD_PARTY_NOTICES.md). Adapted to React 19 and t98 tokens.
 * DOM focus stays on the input; the highlighted option is exposed with aria-activedescendant.
 * Deviations from the example: filtering matches anywhere in the label (case-insensitive) rather than as a prefix,
 * ArrowUp moves to the previous option and wraps, and Enter on an open list with no highlighted option only closes it.
 * With autoHighlight (grid cells) the first match is highlighted as the user types, as in the APG "automatic selection"
 * variant, and Tab also picks it.
 * Async loading (onInputChange, filter=false, loading) follows react-aria useComboBox (Apache-2.0); multiple selection
 * follows Downshift useMultipleSelection (MIT): picks keep the list open, Backspace in an empty input removes the last pick,
 * and aria-selected marks picked options in an aria-multiselectable listbox. Behaviour only; no code is copied. */
export interface ComboboxControlProps extends ComboboxAsyncProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  /** Names the input when no visible label points at it, as in a grid cell. */
  'aria-label'?: string;
  tabIndex?: number;
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
  /** Highlight the first match while typing, so Enter or Tab picks it. */
  autoHighlight?: boolean;
  /** Tab that picks the highlighted option keeps focus, because the owner moves it (an entry grid cell). */
  keepFocusOnTabPick?: boolean;
  /** Match typed text against option descriptions (for example a code) as well as labels. */
  matchDescription?: boolean;
  /** The typed text was dropped: the list closed without a pick, so the input shows `text` again. */
  onQueryReset?: () => void;
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
export function ComboboxControl({ id, options, text, onType, onPick, onClear, onLeave, label, placeholder, required, disabled, emptyMessage, picked, onRemoveLast, autoHighlight = false, keepFocusOnTabPick = false, matchDescription = false, onQueryReset, notice, inputRef, inputValue, onInputValueChange, blockReason, before, children, onInputChange, filter = true, loading = false, loadError, ...described }: ComboboxControlProps) {
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
  const shown = needle ? options.filter(option => option.label.toLowerCase().includes(needle) || (matchDescription && option.description?.toLowerCase().includes(needle))) : options;
  const count = shown.length;
  const activeOption = open && active >= 0 && active < count ? active : -1;

  useEffect(() => {
    if (activeOption >= 0) list.current?.children[activeOption]?.scrollIntoView({ block: 'nearest' });
  }, [activeOption]);

  function type(typed: string | null) {
    if (inputValue !== undefined) { if (typed !== null) onInputValueChange?.(typed); return; }
    setQuery(typed); onInputChange?.(typed ?? '');
  }
  function close() { setOpen(false); setActive(-1); if (query !== null && inputValue === undefined) { type(null); onQueryReset?.(); } }
  const reasonFor = (option: ComboboxOption) => option.disabled ? option.disabledReason ?? 'Unavailable' : blockReason?.(option);
  function accept(option: ComboboxOption) {
    if (reasonFor(option) !== undefined) return;
    onPick(option);
    if (!multiple) close();
    else if (query) { type(null); setActive(-1); }
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Keys during IME composition belong to the input method: Enter commits the composition, never an option.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
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
        if (autoHighlight && activeOption >= 0 && !event.shiftKey) {
          // Tab picks the highlighted option and, unless the owner moves focus itself, still moves to the next field.
          if (keepFocusOnTabPick) event.preventDefault();
          accept(shown[activeOption]);
          return;
        }
        // The owner sees the typed text before it is reset, as on blur.
        onLeave();
        close();
        return;
    }
  }
  const status = notice ? notice : !open ? '' : loading ? 'Loading results' : loadError ? loadError : count === 0 ? emptyMessage : `${count} ${count === 1 ? 'result' : 'results'} available`;

  return <div className="t98-combobox">
    {before}
    <Input id={id} ref={inputRef} {...described} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={activeOption >= 0 ? optionId(activeOption) : undefined}
      value={query ?? text} placeholder={placeholder} required={required} disabled={disabled} autoComplete="off" spellCheck={false}
      onChange={event => { onType(event.target.value); type(event.target.value); setActive(autoHighlight ? 0 : -1); setOpen(true); }}
      onKeyDown={onKeyDown}
      onBlur={() => { onLeave(); close(); }} />
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
