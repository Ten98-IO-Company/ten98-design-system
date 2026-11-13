'use client';

import { createContext, useContext, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode, type Ref } from 'react';
import { Dialog, cx } from './primitives.js';
import { ComboboxControl } from './combobox-control.js';
import type { ComboboxOption } from './controls.js';
import { ShortcutScope } from './shortcuts.js';

/* A keyboard-first grid for transactional entry, following the WAI-ARIA APG grid pattern: one tab stop (roving
 * tabindex), arrows move between cells, and Enter, F2 or typing edits. While editing, Enter and Tab commit and advance to
 * the next editable cell and then the next row; Escape cancels the edit, and a second Escape is left to the app's own
 * command (for example "go back"). Values are strings and the grid never does arithmetic: the app parses amounts (its
 * money module knows each row's decimal places) and computes totals, shown as footer values. Commands such as removing
 * or inserting a row are registered by the app through useEntryGrid and the shortcut registry, active only while focus is
 * in the grid; app code outside the grid reaches the same API through apiRef. */

export type EntryColumnType = 'text' | 'lookup' | 'amount' | 'quantity' | 'date' | 'side';
export interface EntrySideOption { value: string; label: string }
export interface EntryGridRow { key: string; values: Readonly<Record<string, string>> }
/** The stored value for typed text, or a message saying why it is invalid. */
export type EntryParseResult = { value: string } | { error: string };
export interface EntryGridColumn {
  id: string;
  label: string;
  type: EntryColumnType;
  /** An empty value is an error when Enter commits it, and the row is not complete. Tab and arrows move past it. */
  required?: boolean;
  /** Shown, never edited, and skipped by Enter and Tab. */
  readOnly?: boolean;
  /** lookup: the choices; the cell's value is the option value. Typing matches the label or the description, for example a code. */
  options?: readonly ComboboxOption[];
  /**
   * lookup: offers "Create …" when the typed text matches no option. Return the new option's value to fill the cell and
   * advance (the app adds the option), or nothing to stay in the cell, for example while the app opens its own form.
   */
  onCreate?: (text: string, rowKey: string) => string | void | Promise<string | void>;
  /** side: the two choices, for example debit and credit. */
  sides?: readonly [EntrySideOption, EntrySideOption];
  /**
   * text, amount, quantity and date: turns non-empty typed text into the stored value or an error, for example with the
   * app's money module and the row's currency. Without it, quantities use normalizeDecimal with `scale`, and amounts
   * accept any non-negative decimal.
   */
  parse?: (text: string, row: EntryGridRow) => EntryParseResult;
  /** amount and quantity without parse: most decimal places. Quantities default to 3; amounts have no default and are padded to it when set. */
  scale?: number;
  /** A message for an invalid, non-empty value, checked when this cell commits. Cross-cell and server rules go in the grid's errors. */
  validate?: (value: string, row: EntryGridRow) => string | undefined;
}
export interface EntryGridLabels {
  required: string;
  number: string;
  scale: (scale: number) => string;
  notListed: string;
  noMatches: string;
  create: (text: string) => string;
  rowAdded: (row: number) => string;
  rowRemoved: (row: number) => string;
  /** The focusable cell shown when there are no rows. */
  empty: string;
  /** Accessible name of a cell editor, for example "Amount, row 2". */
  cell: (column: string, row: number) => string;
}
const defaultLabels: EntryGridLabels = {
  required: 'Required.', number: 'Enter a number.', scale: scale => `Use up to ${scale} decimal places.`, notListed: 'Choose from the list.', noMatches: 'No matches',
  create: text => `Create “${text}”`, rowAdded: row => `Row ${row} added.`, rowRemoved: row => `Row ${row} removed.`, empty: 'No rows.', cell: (column, row) => `${column}, row ${row}`,
};
export interface EntryGridPanel {
  title: (row: EntryGridRow) => ReactNode;
  render: (row: EntryGridRow, close: () => void) => ReactNode;
}
export interface EntryGridProps {
  /** Accessible name of the grid, also its shortcut context name. */
  label: string;
  columns: readonly EntryGridColumn[];
  /** The lines; use createRow to start from a blank one. Without rows the grid shows one focusable empty cell. */
  rows: readonly EntryGridRow[];
  onRowsChange: (rows: EntryGridRow[]) => void;
  /** Lets Enter and Tab append a row after the last row is complete, and insertRow add one. */
  createRow?: () => EntryGridRow;
  /** App errors by row key and column id, such as server validation or cross-cell rules; shown and announced like the grid's own. */
  errors?: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** App-computed values by column id, for example totals. Changes are announced. */
  footer?: Readonly<Record<string, string>>;
  footerLabel?: string;
  /** A sub-panel a row opens (for example allocations) through useEntryGrid().openPanel; focus returns to the originating cell. */
  panel?: EntryGridPanel;
  labels?: Partial<EntryGridLabels>;
  /** The useEntryGrid API for app code outside the grid, such as a save button or a server response. */
  apiRef?: Ref<EntryGridApi>;
  /** Command components that call useEntryGrid and useCommand. */
  children?: ReactNode;
}

export interface EntryCell { row: number; column: number }
/** The next editable cell after `from` in reading order (direction 1) or before it (-1), or undefined past either end. */
export function nextEntryCell(columns: readonly Pick<EntryGridColumn, 'readOnly'>[], rowCount: number, from: EntryCell, direction: 1 | -1): EntryCell | undefined {
  let { row, column } = from;
  if (!columns.some(entry => !entry.readOnly)) return undefined;
  for (;;) {
    column += direction;
    if (column >= columns.length) { column = 0; row++; }
    if (column < 0) { column = columns.length - 1; row--; }
    if (row < 0 || row >= rowCount) return undefined;
    if (!columns[column].readOnly) return { row, column };
  }
}

const DIGITS: Record<string, string> = Object.fromEntries([...'٠١٢٣٤٥٦٧٨٩', ...'۰۱۲۳۴۵۶۷۸۹'].map((digit, index) => [digit, String(index % 10)]));
/**
 * Normalises typed decimal text without arithmetic: Arabic-Indic digits become ASCII, the Arabic decimal separator
 * becomes ".", grouping separators (comma, Arabic thousands separator or a space) are dropped when they split the whole
 * part into groups of three, leading and trailing zeros are trimmed, and `pad` fills the fraction to `scale` places.
 * Text that is not a non-negative decimal, or has more places than `scale` (Infinity for no limit), is an error.
 */
export function normalizeDecimal(text: string, scale: number, pad: boolean): { value: string } | { error: 'number' | 'scale' } {
  const cleaned = [...text.trim()].map(char => DIGITS[char] ?? (char === '٫' ? '.' : char)).join('');
  if (cleaned === '') return { value: '' };
  const [typedWhole, typedFraction = '', extra] = cleaned.split('.');
  if (extra !== undefined || !/^\d*$/.test(typedFraction)) return { error: 'number' };
  let digits = typedWhole;
  if (!/^\d*$/.test(digits)) {
    const grouped = /^\d{1,3}([,٬\s])\d{3}(?:\1\d{3})*$/.exec(digits);
    if (!grouped) return { error: 'number' };
    digits = digits.split(grouped[1]).join('');
  }
  if (digits === '' && typedFraction === '') return { error: 'number' };
  const whole = digits.replace(/^0+(?=\d)/, '') || '0';
  const fraction = typedFraction.replace(/0+$/, '');
  if (fraction.length > scale) return { error: 'scale' };
  const shown = pad && Number.isFinite(scale) ? fraction.padEnd(scale, '0') : fraction;
  return { value: shown ? `${whole}.${shown}` : whole };
}

export interface EntryGridApi {
  /** Key of the row holding the active cell. */
  activeRow?: string;
  /** Id of the active cell's column. */
  activeColumn?: string;
  /**
   * Commits the active cell's typed text; save and post commands call it first. Returns false, keeping the text, its
   * error and focus, when the text is invalid. onRowsChange has already run when it returns true, so read the rows the
   * app received there (for example from a ref), not from state captured before the call. Empty required cells pass.
   */
  commit: () => boolean;
  /** Removes a row (default: the active one); focus stays in the grid. */
  removeRow: (key?: string) => void;
  /** Inserts createRow() above or below a row (default: the active one) and edits its first cell. Returns the new key. */
  insertRow: (position: 'above' | 'below', key?: string) => string | undefined;
  /** Focuses a cell (default column: the active one), for example an inserted row or a server error. False when it cannot. */
  focusCell: (rowKey: string, columnId?: string) => boolean;
  /** Opens the grid's panel for a row (default: the active one). */
  openPanel: (key?: string) => void;
}
const EntryGridContext = createContext<EntryGridApi | null>(null);
/** The grid's active cell and actions, for app commands rendered as EntryGrid children. */
export function useEntryGrid(): EntryGridApi {
  const api = useContext(EntryGridContext);
  if (!api) throw new Error('useEntryGrid must be used inside an EntryGrid.');
  return api;
}

const CREATE = '\u0000create';
const EDITOR = 'input:not([type=hidden]), select';
// Focus moves before paint; useLayoutEffect is client-only, so server rendering uses useEffect.
const useClientLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;
const lineEditor = (type: EntryColumnType) => type === 'text' || type === 'amount' || type === 'quantity';

/** A dense, keyboard-first entry grid of typed cells. The app owns the rows, options, totals and every command. */
export function EntryGrid({ label, columns, rows, onRowsChange, createRow, errors, footer, footerLabel = 'Total', panel, labels: custom, apiRef, children }: EntryGridProps) {
  const labels = { ...defaultLabels, ...custom };
  const id = useId().replace(/:/g, '');
  const emptyId = `${id}-empty`;
  const latest = useRef(rows);
  latest.current = rows;
  const firstEditable = Math.max(0, columns.findIndex(column => !column.readOnly));
  const [active, setActive] = useState<{ row: string; column: string }>();
  // The typed text of the active cell; null when nothing is typed. The ref lets handlers in the same event see changes.
  const [draft, setDraftState] = useState<string | null>(null);
  const draftRef = useRef<string | null>(null);
  const setDraft = (text: string | null) => { draftRef.current = text; setDraftState(text); };
  const [editing, setEditing] = useState(false);
  const [ownErrors, setOwnErrors] = useState<Readonly<Record<string, string>>>({});
  const [panelRow, setPanelRow] = useState<string>();
  const pendingFocus = useRef<'cell' | 'editor' | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const lastIndex = useRef(0);
  const focusLost = useRef(false);

  const found = rows.findIndex(row => row.key === active?.row);
  const current: EntryCell = {
    row: found >= 0 ? found : Math.max(0, Math.min(lastIndex.current, rows.length - 1)),
    column: active ? Math.max(0, columns.findIndex(column => column.id === active.column)) : firstEditable,
  };
  // The active row is gone (removed or replaced by the app): note whether focus was in the grid before React removes it.
  if (active && found < 0 && typeof document !== 'undefined' && box.current?.contains(document.activeElement)) focusLost.current = true;
  const errorKey = (row: string, column: string) => `${row}\u0000${column}`;
  const cellId = (cell: EntryCell) => `${id}-r${cell.row}-c${cell.column}`;
  const editorOf = (cell: EntryCell) => document.getElementById(cellId(cell))?.querySelector<HTMLInputElement | HTMLSelectElement>(EDITOR);
  const setOwnError = (row: string, column: string, error: string | undefined) => setOwnErrors(previous => {
    const key = errorKey(row, column);
    if (previous[key] === error) return previous;
    const next = { ...previous };
    if (error) next[key] = error; else delete next[key];
    return next;
  });

  const status = useRef<HTMLSpanElement>(null);
  const sayTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  /** Announces through the polite status region, cleared first so the same message said twice is announced again. */
  function say(text: string) {
    const node = status.current;
    if (!node) return;
    node.textContent = '';
    clearTimeout(sayTimer.current);
    sayTimer.current = setTimeout(() => { node.textContent = text; }, 100);
  }
  useEffect(() => () => clearTimeout(sayTimer.current), []);
  const sayError = (column: EntryGridColumn, row: number, error: string) => say(`${labels.cell(column.label, row + 1)}: ${error}`);

  function moveTo(cell: EntryCell, focus: 'cell' | 'editor') {
    const row = latest.current[cell.row];
    if (!row) return;
    pendingFocus.current = focus;
    setActive({ row: row.key, column: columns[cell.column].id });
    setDraft(null);
  }
  useClientLayoutEffect(() => {
    if (active && found < 0) {
      // Keep the position, and keep focus in the grid when it was there.
      const row = rows[current.row];
      setActive(row && { row: row.key, column: active.column });
      setEditing(false);
      setDraft(null);
      if (focusLost.current) pendingFocus.current = 'cell';
      focusLost.current = false;
      return;
    }
    lastIndex.current = current.row;
    const focus = pendingFocus.current;
    if (!focus) return;
    pendingFocus.current = null;
    const editor = focus === 'editor' ? editorOf(current) : undefined;
    if (editor) {
      editor.focus();
      if (editor instanceof HTMLInputElement && editor.type !== 'date') editor.select();
    } else (document.getElementById(cellId(current)) ?? document.getElementById(emptyId))?.focus();
  });

  const footerText = footer ? columns.flatMap(column => footer[column.id] !== undefined ? [`${column.label} ${footer[column.id]}`] : []).join(', ') : '';
  const lastFooter = useRef(footerText);
  useEffect(() => {
    if (footerText !== lastFooter.current && footerText) say(`${footerLabel}: ${footerText}`);
    lastFooter.current = footerText;
  }, [footerText, footerLabel]);
  // App errors are announced when they appear; each line is "row, column, message" then the spoken text.
  const appErrors = errors ? rows.flatMap((row, r) => columns.flatMap(column => {
    const message = errors[row.key]?.[column.id];
    return message ? [`${errorKey(row.key, column.id)}\u0000${message}\u0001${labels.cell(column.label, r + 1)}: ${message}`] : [];
  })).join('\n') : '';
  const announcedErrors = useRef(new Set<string>());
  useEffect(() => {
    const lines = appErrors ? appErrors.split('\n').map(line => line.split('\u0001')) : [];
    const fresh = lines.filter(([key]) => !announcedErrors.current.has(key)).map(([, text]) => text);
    announcedErrors.current = new Set(lines.map(([key]) => key));
    if (fresh.length) say(fresh.join(' '));
  }, [appErrors]);

  function defaultParse(column: EntryGridColumn, text: string): EntryParseResult {
    if (column.type !== 'amount' && column.type !== 'quantity') return { value: text };
    const scale = column.scale ?? (column.type === 'quantity' ? 3 : Infinity);
    const result = normalizeDecimal(text, scale, column.type === 'amount');
    return 'error' in result ? { error: result.error === 'scale' ? labels.scale(scale) : labels.number } : result;
  }
  /** The stored form of typed text, and its error. */
  function check(column: EntryGridColumn, text: string, row: EntryGridRow, required: boolean): { value: string; error?: string } {
    let value: string;
    if (text.trim() === '') value = '';
    else if (column.type === 'lookup') {
      const needle = text.trim().toLocaleLowerCase();
      const option = column.options?.find(option => option.value === text || option.label.toLocaleLowerCase() === needle || option.description?.toLocaleLowerCase() === needle);
      if (!option) return { value: text, error: labels.notListed };
      value = option.value;
    } else if (column.type === 'side') value = text;
    else {
      const parsed = column.parse ? column.parse(text, row) : defaultParse(column, text);
      if ('error' in parsed) return { value: text, error: parsed.error };
      value = parsed.value;
    }
    if (value === '') return { value, error: required && column.required ? labels.required : undefined };
    return { value, error: column.validate?.(value, { ...row, values: { ...row.values, [column.id]: value } }) };
  }
  /** Why a stored value keeps its row from being complete. */
  function problem(column: EntryGridColumn, row: EntryGridRow) {
    const value = row.values[column.id] ?? '';
    return value === '' ? (column.required ? labels.required : undefined) : column.validate?.(value, row);
  }
  const problemIn = (row: EntryGridRow) => columns.findIndex(column => !column.readOnly && problem(column, row));

  /**
   * Commits the active cell. An invalid value stays in the editor with its error, so nothing typed is lost. Only Enter
   * (`required`) stops at an empty required cell; Tab, arrows, blur and app commands move past it.
   */
  function commit(text: string | null = draftRef.current, required = false): boolean {
    const row = latest.current[current.row], column = columns[current.column];
    if (!row || !column || column.readOnly || (text === null && !required)) return true;
    const stored = row.values[column.id] ?? '';
    const { value, error } = text === null ? { value: stored, error: problem(column, row) } : check(column, text, row, required);
    setOwnError(row.key, column.id, error);
    if (error) { sayError(column, current.row, error); return false; }
    if (value !== stored) {
      const all = [...latest.current];
      all[current.row] = { ...row, values: { ...row.values, [column.id]: value } };
      latest.current = all;
      onRowsChange(all);
    }
    setDraft(null);
    return true;
  }

  /** Commits and moves. Returns false when focus should leave the grid (Tab past either end). */
  function advance(direction: 1 | -1, key: 'Enter' | 'Tab', text: string | null = draftRef.current): boolean {
    if (!commit(text, key === 'Enter')) return true;
    const all = latest.current;
    const next = nextEntryCell(columns, all.length, current, direction);
    if (next) { moveTo(next, 'editor'); return true; }
    if (direction === 1) {
      const row = all[current.row];
      const blocked = problemIn(row);
      if (blocked < 0 && createRow) {
        const added = [...all, createRow()];
        latest.current = added;
        onRowsChange(added);
        say(labels.rowAdded(added.length));
        moveTo({ row: added.length - 1, column: firstEditable }, 'editor');
        return true;
      }
      if (blocked >= 0 && key === 'Enter') {
        // An incomplete last row: Enter goes to its first problem rather than past it.
        const column = columns[blocked];
        const error = problem(column, row)!;
        setOwnError(row.key, column.id, error);
        sayError(column, current.row, error);
        moveTo({ row: current.row, column: blocked }, 'editor');
        return true;
      }
      if (key === 'Enter') return true;
    }
    setEditing(false);
    return false;
  }

  function cancel() {
    const row = latest.current[current.row];
    if (row) setOwnError(row.key, columns[current.column].id, undefined);
    setDraft(null);
    setEditing(false);
    pendingFocus.current = 'cell';
    setActive(active && { ...active });
  }

  function removeRow(key = latest.current[current.row]?.key) {
    const index = latest.current.findIndex(row => row.key === key);
    if (index < 0) return;
    // Typed text in another row is committed first; in the removed row it goes with the row.
    if (index === current.row) setDraft(null); else if (!commit()) return;
    let next = latest.current.filter(row => row.key !== key);
    if (!next.length && createRow) next = [createRow()];
    latest.current = next;
    onRowsChange(next);
    setOwnErrors(previous => Object.fromEntries(Object.entries(previous).filter(([entry]) => !entry.startsWith(`${key}\u0000`))));
    say(labels.rowRemoved(index + 1));
    setEditing(false);
    const stay = index === current.row ? Math.min(index, next.length - 1) : current.row - (index < current.row ? 1 : 0);
    if (next.length) moveTo({ row: stay, column: current.column }, 'cell');
    else { pendingFocus.current = 'cell'; setActive(undefined); }
  }
  function insertRow(position: 'above' | 'below', key = latest.current[current.row]?.key) {
    const index = latest.current.findIndex(row => row.key === key);
    if (!createRow || (index < 0 && latest.current.length) || !commit()) return undefined;
    const at = index < 0 ? 0 : index + (position === 'below' ? 1 : 0);
    const row = createRow();
    const next = [...latest.current];
    next.splice(at, 0, row);
    latest.current = next;
    onRowsChange(next);
    say(labels.rowAdded(at + 1));
    moveTo({ row: at, column: firstEditable }, 'editor');
    return row.key;
  }
  function focusCell(rowKey: string, columnId = columns[current.column]?.id) {
    const row = latest.current.findIndex(entry => entry.key === rowKey), column = columns.findIndex(entry => entry.id === columnId);
    if (row < 0 || column < 0 || !commit()) return false;
    setEditing(false);
    moveTo({ row, column }, 'cell');
    return true;
  }
  const api: EntryGridApi = {
    activeRow: rows[current.row]?.key, activeColumn: columns[current.column]?.id, commit: () => commit(), removeRow, insertRow, focusCell,
    openPanel: key => { if (panel && commit()) setPanelRow(key ?? latest.current[current.row]?.key); },
  };
  useImperativeHandle(apiRef, () => api);

  function onKeyDownCapture(event: KeyboardEvent<HTMLTableSectionElement>) {
    // Escape in a lookup whose list is closed cancels the edit instead of clearing the text.
    const target = event.target as HTMLElement;
    if (event.key === 'Escape' && editing && target.getAttribute('role') === 'combobox' && target.getAttribute('aria-expanded') !== 'true') {
      event.preventDefault();
      event.stopPropagation();
      cancel();
    }
  }
  function onKeyDown(event: KeyboardEvent<HTMLTableSectionElement>) {
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    const target = event.target as HTMLElement;
    const column = columns[current.column];
    if (editing) {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === 'Enter') { event.preventDefault(); advance(1, 'Enter'); }
      else if (event.key === 'Tab') { if (advance(event.shiftKey ? -1 : 1, 'Tab')) event.preventDefault(); }
      else if (event.key === 'Escape') { event.preventDefault(); cancel(); }
      else if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !event.shiftKey && column && lineEditor(column.type)) {
        // Single-line cells have no use for vertical arrows: they commit and edit the same column in the next row.
        const row = current.row + (event.key === 'ArrowDown' ? 1 : -1);
        if (row < 0 || row >= latest.current.length) return;
        event.preventDefault();
        if (commit()) moveTo({ row, column: current.column }, 'editor');
      } else if (event.key === 'Backspace' && target instanceof HTMLInputElement && target.type !== 'date' && target.value === '') {
        // Backspace in an empty cell clears it and goes back to the previous one.
        const previous = nextEntryCell(columns, latest.current.length, current, -1);
        if (!previous) return;
        event.preventDefault();
        if (commit('')) moveTo(previous, 'editor');
      }
      return;
    }
    // Typing starts editing: focusing the editor during keydown lets the browser put the character there, over the
    // selected value. That includes AltGr characters (reported with Ctrl and Alt) and the key that starts an IME composition.
    const altGraph = event.ctrlKey && event.altKey && event.nativeEvent.getModifierState?.('AltGraph') === true;
    const typing = event.key === 'Process' || event.keyCode === 229 || ([...event.key].length === 1 && !event.metaKey && ((!event.ctrlKey && !event.altKey) || altGraph));
    if (typing) {
      if (column && !column.readOnly) {
        const editor = editorOf(current);
        editor?.focus();
        if (editor instanceof HTMLInputElement && editor.type !== 'date') editor.select();
      }
      return;
    }
    if (event.altKey || event.metaKey) return;
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const last = { row: rows.length - 1, column: columns.length - 1 };
    const moves: Record<string, EntryCell> = {
      ArrowDown: { row: Math.min(current.row + 1, last.row), column: current.column },
      ArrowUp: { row: Math.max(current.row - 1, 0), column: current.column },
      [rtl ? 'ArrowLeft' : 'ArrowRight']: { row: current.row, column: Math.min(current.column + 1, last.column) },
      [rtl ? 'ArrowRight' : 'ArrowLeft']: { row: current.row, column: Math.max(current.column - 1, 0) },
      Home: event.ctrlKey ? { row: 0, column: 0 } : { row: current.row, column: 0 },
      End: event.ctrlKey ? last : { row: current.row, column: last.column },
      PageDown: { row: Math.min(current.row + 5, last.row), column: current.column },
      PageUp: { row: Math.max(current.row - 5, 0), column: current.column },
    };
    const move = moves[event.key];
    if (move && (!event.ctrlKey || event.key === 'Home' || event.key === 'End')) { event.preventDefault(); moveTo(move, 'cell'); return; }
    if (event.ctrlKey || !column || column.readOnly) return;
    if (event.key === 'Enter' || event.key === 'F2') { event.preventDefault(); moveTo(current, 'editor'); }
  }

  function onCellFocus(event: FocusEvent<HTMLTableCellElement>, cell: EntryCell) {
    const row = rows[cell.row];
    if (row && (row.key !== active?.row || columns[cell.column].id !== active?.column)) setActive({ row: row.key, column: columns[cell.column].id });
    if (event.target !== event.currentTarget && !editing) { setEditing(true); setDraft(null); }
  }
  function onCellBlur(event: FocusEvent<HTMLTableCellElement>) {
    // Leaving the editor for its own cell (Escape) or within it keeps editing state as set; leaving the cell commits.
    if (event.target === event.currentTarget || event.currentTarget.contains(event.relatedTarget)) return;
    if (editing) commit();
    setEditing(false);
  }
  function onCellClick(event: MouseEvent<HTMLTableCellElement>, cell: EntryCell) {
    if (!columns[cell.column].readOnly && !(event.target as Element).closest(`${EDITOR}, [role=listbox]`)) moveTo(cell, 'editor');
  }

  function display(column: EntryGridColumn, value: string) {
    if (column.type === 'lookup') return column.options?.find(option => option.value === value)?.label ?? value;
    if (column.type === 'side') return column.sides?.find(side => side.value === value)?.label ?? value;
    return value;
  }
  function editor(column: EntryGridColumn, row: EntryGridRow, cell: EntryCell, describedBy?: string) {
    const value = draft ?? row.values[column.id] ?? '';
    const common = { 'aria-label': labels.cell(column.label, cell.row + 1), 'aria-describedby': describedBy, 'aria-invalid': describedBy ? true : undefined, tabIndex: -1 };
    if (column.type === 'side') {
      return <select {...common} className="t98-entry-grid__editor" value={value} onChange={event => setDraft(event.target.value)}>
        {!value && <option value="" />}
        {column.sides?.map(side => <option key={side.value} value={side.value}>{side.label}</option>)}
      </select>;
    }
    if (column.type === 'lookup') {
      const typed = (draft ?? '').trim(), needle = typed.toLocaleLowerCase();
      const options = [...(column.options ?? [])];
      if (column.onCreate && typed && !options.some(option => option.label.toLocaleLowerCase() === needle || option.description?.toLocaleLowerCase() === needle)) options.push({ value: CREATE, label: labels.create(typed) });
      // The first match is highlighted, so Enter or Tab picks it; closing the list without a pick drops the typed text.
      return <ComboboxControl {...common} options={options} text={display(column, row.values[column.id] ?? '')} label={column.label} emptyMessage={labels.noMatches}
        autoHighlight matchDescription onType={setDraft} onQueryReset={() => setDraft(null)} onClear={() => setDraft('')} onLeave={() => {}}
        onPick={async option => {
          if (option.value !== CREATE) { advance(1, 'Enter', option.value); return; }
          const created = await column.onCreate?.(typed, row.key);
          if (typeof created !== 'string' || !created) return;
          const all = [...latest.current];
          const index = all.findIndex(entry => entry.key === row.key);
          if (index < 0) return;
          all[index] = { ...all[index], values: { ...all[index].values, [column.id]: created } };
          latest.current = all;
          onRowsChange(all);
          setOwnError(row.key, column.id, undefined);
          const next = nextEntryCell(columns, all.length, { row: index, column: cell.column }, 1);
          if (next) moveTo(next, 'editor');
        }} />;
    }
    const numeric = column.type === 'amount' || column.type === 'quantity';
    return <input {...common} className="t98-entry-grid__editor" type={column.type === 'date' ? 'date' : 'text'} inputMode={numeric ? 'decimal' : undefined}
      autoComplete="off" spellCheck={column.type === 'text' ? undefined : false} value={value} onChange={event => setDraft(event.target.value)} />;
  }

  const closePanel = () => setPanelRow(undefined);
  const panelEntry = rows.find(row => row.key === panelRow);
  const panelOpen = panelEntry !== undefined;
  // Entry continues in the panel: its first control takes focus once the dialog has opened.
  useEffect(() => {
    if (panelOpen) document.getElementById(`${id}-panel`)?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea, button, [tabindex]:not([tabindex="-1"])')?.focus();
  }, [panelOpen, id]);
  const bodyRows = Math.max(rows.length, 1);
  return <EntryGridContext.Provider value={api}>
    <ShortcutScope name={label} activation="focus">
      {children}
      <div ref={box} className="t98-entry-grid">
        <table role="grid" aria-label={label} aria-rowcount={bodyRows + 1 + (footer ? 1 : 0)} className="t98-entry-grid__table">
          <thead>
            <tr role="row" aria-rowindex={1}>
              {columns.map(column => <th key={column.id} role="columnheader" scope="col" className={`t98-entry-grid__head t98-entry-grid--${column.type}`}>
                {column.label}{column.required && <span aria-hidden="true" className="t98-entry-grid__required"> *</span>}
              </th>)}
            </tr>
          </thead>
          <tbody onKeyDownCapture={onKeyDownCapture} onKeyDown={onKeyDown}>
            {rows.map((row, r) => <tr key={row.key} role="row" aria-rowindex={r + 2}>
              {columns.map((column, c) => {
                const cell = { row: r, column: c };
                const isActive = r === current.row && c === current.column;
                const error = ownErrors[errorKey(row.key, column.id)] ?? errors?.[row.key]?.[column.id];
                const errorId = error ? `${cellId(cell)}-error` : undefined;
                return <td key={column.id} id={cellId(cell)} role="gridcell" tabIndex={isActive && !editing ? 0 : -1}
                  aria-readonly={column.readOnly || undefined} aria-required={column.required || undefined} aria-invalid={error ? true : undefined} aria-describedby={errorId}
                  className={cx('t98-entry-grid__cell', `t98-entry-grid--${column.type}`, isActive && 't98-entry-grid__cell--active')}
                  onFocus={event => onCellFocus(event, cell)} onBlur={onCellBlur} onClick={event => onCellClick(event, cell)}>
                  {isActive && !column.readOnly ? editor(column, row, cell, errorId) : <span className="t98-entry-grid__value">{display(column, row.values[column.id] ?? '')}</span>}
                  {error && <span id={errorId} className="t98-entry-grid__error">{error}</span>}
                </td>;
              })}
            </tr>)}
            {/* Without rows, one cell keeps the grid's tab stop, so focus is never lost and insert commands still run. */}
            {!rows.length && <tr role="row" aria-rowindex={2}>
              <td id={emptyId} role="gridcell" tabIndex={0} colSpan={columns.length} className="t98-entry-grid__cell t98-entry-grid__empty">{labels.empty}</td>
            </tr>}
          </tbody>
          {footer && <tfoot>
            <tr role="row" aria-rowindex={bodyRows + 2}>
              {columns.map((column, c) => <td key={column.id} role="gridcell" aria-readonly="true" className={`t98-entry-grid__total t98-entry-grid--${column.type}`}>
                {footer[column.id] ?? (c === 0 ? footerLabel : '')}
              </td>)}
            </tr>
          </tfoot>}
        </table>
      </div>
      {/* Written by say(), not by React, so a repeated message can be cleared and announced again. */}
      <span ref={status} role="status" className="t98-visually-hidden" />
    </ShortcutScope>
    {panel && <ShortcutScope name={`${label} panel`} modal>
      <Dialog open={panelEntry !== undefined} onOpenChange={open => { if (!open) closePanel(); }} title={panelEntry ? panel.title(panelEntry) : ''}
        restoreFocus={() => document.getElementById(cellId(current))}>
        <div id={`${id}-panel`}>{panelEntry && panel.render(panelEntry, closePanel)}</div>
      </Dialog>
    </ShortcutScope>}
  </EntryGridContext.Provider>;
}
