'use client';

import { createContext, useContext, useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { Dialog, cx } from './primitives.js';
import { ComboboxControl } from './combobox-control.js';
import type { ComboboxOption } from './controls.js';
import { ShortcutScope } from './shortcuts.js';

/* A keyboard-first grid for transactional entry, following the WAI-ARIA APG grid pattern: one tab stop (roving
 * tabindex), arrows move between cells, and Enter, F2 or typing edits. While editing, Enter and Tab commit and advance to
 * the next editable cell and then the next row; Escape cancels the edit, and a second Escape is left to the app's own
 * command (for example "go back"). Values are strings: amounts and quantities are decimal strings in and out, and the grid
 * never does arithmetic. Totals are the app's, shown as footer values. Commands such as removing a row or opening a panel
 * are registered by the app through useEntryGrid and the shortcut registry, active only while focus is in the grid. */

export type EntryColumnType = 'text' | 'lookup' | 'amount' | 'quantity' | 'date' | 'side';
export interface EntrySideOption { value: string; label: string }
export interface EntryGridRow { key: string; values: Readonly<Record<string, string>> }
export interface EntryGridColumn {
  id: string;
  label: string;
  type: EntryColumnType;
  /** An empty value is an error, and the row is not complete. */
  required?: boolean;
  /** Shown, never edited, and skipped by Enter and Tab. */
  readOnly?: boolean;
  /** lookup: the choices; the cell's value is the option value. */
  options?: readonly ComboboxOption[];
  /**
   * lookup: offers "Create …" when the typed text matches no option. Return the new option's value to fill the cell and
   * advance (the app adds the option), or nothing to stay in the cell, for example while the app opens its own form.
   */
  onCreate?: (text: string, rowKey: string) => string | void | Promise<string | void>;
  /** side: the two choices, for example debit and credit. */
  sides?: readonly [EntrySideOption, EntrySideOption];
  /** amount and quantity: most decimal places; amounts are padded to it. Defaults to 2 for amounts and 3 for quantities. */
  scale?: number;
  /** A message for an invalid, non-empty committed value. */
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
  /** Accessible name of a cell editor, for example "Amount, row 2". */
  cell: (column: string, row: number) => string;
}
const defaultLabels: EntryGridLabels = {
  required: 'Required.', number: 'Enter a number.', scale: scale => `Use up to ${scale} decimal places.`, notListed: 'Choose from the list.', noMatches: 'No matches',
  create: text => `Create “${text}”`, rowAdded: row => `Row ${row} added.`, rowRemoved: row => `Row ${row} removed.`, cell: (column, row) => `${column}, row ${row}`,
};
export interface EntryGridPanel {
  title: (row: EntryGridRow) => ReactNode;
  render: (row: EntryGridRow, close: () => void) => ReactNode;
}
export interface EntryGridProps {
  /** Accessible name of the grid, also its shortcut context name. */
  label: string;
  columns: readonly EntryGridColumn[];
  /** At least one row; use createRow to start from a blank one. */
  rows: readonly EntryGridRow[];
  onRowsChange: (rows: EntryGridRow[]) => void;
  /** Lets Enter and Tab append a row after the last row is complete. */
  createRow?: () => EntryGridRow;
  /** App-computed values by column id, for example totals. Changes are announced. */
  footer?: Readonly<Record<string, string>>;
  footerLabel?: string;
  /** A sub-panel a row opens (for example allocations) through useEntryGrid().openPanel; focus returns to the originating cell. */
  panel?: EntryGridPanel;
  labels?: Partial<EntryGridLabels>;
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
 * becomes ".", grouping commas and spaces are dropped, leading and trailing zeros are trimmed, and `pad` fills the
 * fraction to `scale` places. Text that is not a non-negative decimal, or has more places than `scale`, is an error.
 */
export function normalizeDecimal(text: string, scale: number, pad: boolean): { value: string } | { error: 'number' | 'scale' } {
  const cleaned = [...text.trim()].map(char => DIGITS[char] ?? (char === '٫' ? '.' : char)).join('').replace(/[,\s٬]/g, '');
  if (cleaned === '') return { value: '' };
  const match = /^(\d*)(?:\.(\d*))?$/.exec(cleaned);
  if (!match || (match[1] === '' && !match[2])) return { error: 'number' };
  const whole = match[1].replace(/^0+(?=\d)/, '') || '0';
  const fraction = (match[2] ?? '').replace(/0+$/, '');
  if (fraction.length > scale) return { error: 'scale' };
  const shown = pad ? fraction.padEnd(scale, '0') : fraction;
  return { value: shown ? `${whole}.${shown}` : whole };
}

export interface EntryGridApi {
  /** Key of the row holding the active cell. */
  activeRow?: string;
  /** Id of the active cell's column. */
  activeColumn?: string;
  /** Removes a row (default: the active one); focus stays in the grid. */
  removeRow: (key?: string) => void;
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

/** A dense, keyboard-first entry grid of typed cells. The app owns the rows, options, totals and every command. */
export function EntryGrid({ label, columns, rows, onRowsChange, createRow, footer, footerLabel = 'Total', panel, labels: custom, children }: EntryGridProps) {
  const labels = { ...defaultLabels, ...custom };
  const id = useId().replace(/:/g, '');
  const latest = useRef(rows);
  latest.current = rows;
  const firstEditable = Math.max(0, columns.findIndex(column => !column.readOnly));
  const [active, setActive] = useState<{ row: string; column: string }>();
  const [draft, setDraft] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  const [announcement, setAnnouncement] = useState('');
  const [panelRow, setPanelRow] = useState<string>();
  const pendingFocus = useRef<'cell' | 'editor' | null>(null);

  const found = rows.findIndex(row => row.key === active?.row);
  const current: EntryCell = { row: found >= 0 ? found : 0, column: active ? Math.max(0, columns.findIndex(column => column.id === active.column)) : firstEditable };
  const errorKey = (row: string, column: string) => `${row}\u0000${column}`;
  const cellId = (cell: EntryCell) => `${id}-r${cell.row}-c${cell.column}`;
  const editorOf = (cell: EntryCell) => document.getElementById(cellId(cell))?.querySelector<HTMLInputElement | HTMLSelectElement>(EDITOR);
  const announce = (column: EntryGridColumn, row: number, error: string) => setAnnouncement(`${labels.cell(column.label, row + 1)}: ${error}`);
  const setError = (row: string, column: string, error: string | undefined) => setErrors(previous => {
    const key = errorKey(row, column);
    if (previous[key] === error) return previous;
    const next = { ...previous };
    if (error) next[key] = error; else delete next[key];
    return next;
  });

  function moveTo(cell: EntryCell, focus: 'cell' | 'editor') {
    const row = latest.current[cell.row];
    if (!row) return;
    pendingFocus.current = focus;
    setActive({ row: row.key, column: columns[cell.column].id });
    setDraft(null);
  }
  useEffect(() => {
    const focus = pendingFocus.current;
    if (!focus) return;
    pendingFocus.current = null;
    const editor = focus === 'editor' ? editorOf(current) : undefined;
    if (editor) {
      editor.focus();
      if (editor instanceof HTMLInputElement && editor.type !== 'date') editor.select();
    } else document.getElementById(cellId(current))?.focus();
  });

  const footerText = footer ? columns.flatMap(column => footer[column.id] !== undefined ? [`${column.label} ${footer[column.id]}`] : []).join(', ') : '';
  const lastFooter = useRef(footerText);
  useEffect(() => {
    if (footerText !== lastFooter.current && footerText) setAnnouncement(`${footerLabel}: ${footerText}`);
    lastFooter.current = footerText;
  }, [footerText, footerLabel]);

  /** The committed form of a typed value, and its error. */
  function check(column: EntryGridColumn, text: string, row: EntryGridRow): { value: string; error?: string } {
    let value = text;
    if (column.type === 'amount' || column.type === 'quantity') {
      const scale = column.scale ?? (column.type === 'amount' ? 2 : 3);
      const result = normalizeDecimal(text, scale, column.type === 'amount');
      if ('error' in result) return { value: text, error: result.error === 'scale' ? labels.scale(scale) : labels.number };
      value = result.value;
    } else if (column.type === 'lookup' && text !== '') {
      const needle = text.trim().toLocaleLowerCase();
      const option = column.options?.find(option => option.value === text || option.label.toLocaleLowerCase() === needle);
      if (!option) return { value: text, error: labels.notListed };
      value = option.value;
    }
    if (value === '') return { value, error: column.required ? labels.required : undefined };
    return { value, error: column.validate?.(value, { ...row, values: { ...row.values, [column.id]: value } }) };
  }
  const problemIn = (row: EntryGridRow) => columns.findIndex(column => !column.readOnly && check(column, row.values[column.id] ?? '', row).error);

  /** Commits the active cell. An invalid value stays in the editor with its error, so nothing typed is lost. */
  function commit(text: string | null = draft): boolean {
    const row = latest.current[current.row], column = columns[current.column];
    if (!row || column.readOnly) return true;
    const { value, error } = check(column, text ?? row.values[column.id] ?? '', row);
    setError(row.key, column.id, error);
    if (error) { announce(column, current.row, error); return false; }
    if (value !== (row.values[column.id] ?? '')) {
      const all = [...latest.current];
      all[current.row] = { ...row, values: { ...row.values, [column.id]: value } };
      latest.current = all;
      onRowsChange(all);
    }
    setDraft(null);
    return true;
  }

  /** Commits and moves. Returns false when focus should leave the grid (Tab past either end). */
  function advance(direction: 1 | -1, key: 'Enter' | 'Tab', text: string | null = draft): boolean {
    if (!commit(text)) return true;
    const all = latest.current;
    const next = nextEntryCell(columns, all.length, current, direction);
    if (next) { moveTo(next, 'editor'); return true; }
    if (direction === 1) {
      const row = all[current.row];
      const problem = problemIn(row);
      if (problem < 0 && createRow) {
        const added = [...all, createRow()];
        latest.current = added;
        onRowsChange(added);
        setAnnouncement(labels.rowAdded(added.length));
        moveTo({ row: added.length - 1, column: firstEditable }, 'editor');
        return true;
      }
      if (problem >= 0 && key === 'Enter') {
        // An incomplete last row: Enter goes to its first problem rather than past it.
        const column = columns[problem];
        const error = check(column, row.values[column.id] ?? '', row).error!;
        setError(row.key, column.id, error);
        announce(column, current.row, error);
        moveTo({ row: current.row, column: problem }, 'editor');
        return true;
      }
      if (key === 'Enter') return true;
    }
    setEditing(false);
    return false;
  }

  function cancel() {
    setDraft(null);
    setEditing(false);
    pendingFocus.current = 'cell';
    setActive(active && { ...active });
  }

  function removeRow(key = latest.current[current.row]?.key) {
    const index = latest.current.findIndex(row => row.key === key);
    if (index < 0) return;
    let next = latest.current.filter(row => row.key !== key);
    if (!next.length && createRow) next = [createRow()];
    latest.current = next;
    onRowsChange(next);
    setErrors(previous => Object.fromEntries(Object.entries(previous).filter(([entry]) => !entry.startsWith(`${key}\u0000`))));
    setAnnouncement(labels.rowRemoved(index + 1));
    setEditing(false);
    if (next.length) moveTo({ row: Math.min(index, next.length - 1), column: current.column }, 'cell');
  }
  const api: EntryGridApi = {
    activeRow: rows[current.row]?.key, activeColumn: columns[current.column]?.id, removeRow,
    openPanel: key => { if (panel) { if (editing) commit(); setPanelRow(key ?? rows[current.row]?.key); } },
  };

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
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.altKey || event.metaKey) return;
    const target = event.target as HTMLElement;
    if (editing) {
      if (event.ctrlKey) return;
      if (event.key === 'Enter') { event.preventDefault(); advance(1, 'Enter'); }
      else if (event.key === 'Tab') { if (advance(event.shiftKey ? -1 : 1, 'Tab')) event.preventDefault(); }
      else if (event.key === 'Escape') { event.preventDefault(); cancel(); }
      else if (event.key === 'Backspace' && target instanceof HTMLInputElement && target.type !== 'date' && target.value === '') {
        // Backspace in an empty cell goes back to the previous one.
        const previous = nextEntryCell(columns, latest.current.length, current, -1);
        if (!previous) return;
        event.preventDefault();
        const row = latest.current[current.row], column = columns[current.column];
        if ((row.values[column.id] ?? '') !== '') commit('');
        else setError(row.key, column.id, undefined);
        moveTo(previous, 'editor');
      }
      return;
    }
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
    if (event.ctrlKey || columns[current.column].readOnly) return;
    if (event.key === 'Enter' || event.key === 'F2') { event.preventDefault(); moveTo(current, 'editor'); return; }
    // Typing starts editing: focusing the editor during keydown lets the browser put the character there, over the selected value.
    if ([...event.key].length === 1) {
      const editor = editorOf(current);
      editor?.focus();
      if (editor instanceof HTMLInputElement && editor.type !== 'date') editor.select();
    }
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
      const typed = (draft ?? '').trim();
      const options = [...(column.options ?? [])];
      if (column.onCreate && typed && !options.some(option => option.label.toLocaleLowerCase() === typed.toLocaleLowerCase())) options.push({ value: CREATE, label: labels.create(typed) });
      return <ComboboxControl {...common} options={options} text={display(column, row.values[column.id] ?? '')} label={column.label} emptyMessage={labels.noMatches}
        onType={setDraft} onClear={() => setDraft('')} onLeave={() => {}}
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
          setError(row.key, column.id, undefined);
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
  return <EntryGridContext.Provider value={api}>
    <ShortcutScope name={label} activation="focus">
      {children}
      <div className="t98-entry-grid">
        <table role="grid" aria-label={label} aria-rowcount={rows.length + 1 + (footer ? 1 : 0)} className="t98-entry-grid__table">
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
                const error = errors[errorKey(row.key, column.id)];
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
          </tbody>
          {footer && <tfoot>
            <tr role="row" aria-rowindex={rows.length + 2}>
              {columns.map((column, c) => <td key={column.id} role="gridcell" aria-readonly="true" className={`t98-entry-grid__total t98-entry-grid--${column.type}`}>
                {footer[column.id] ?? (c === 0 ? footerLabel : '')}
              </td>)}
            </tr>
          </tfoot>}
        </table>
      </div>
      <span role="status" className="t98-visually-hidden">{announcement}</span>
    </ShortcutScope>
    {panel && <ShortcutScope name={`${label} panel`} modal>
      <Dialog open={panelEntry !== undefined} onOpenChange={open => { if (!open) closePanel(); }} title={panelEntry ? panel.title(panelEntry) : ''}
        restoreFocus={() => document.getElementById(cellId(current))}>
        <div id={`${id}-panel`}>{panelEntry && panel.render(panelEntry, closePanel)}</div>
      </Dialog>
    </ShortcutScope>}
  </EntryGridContext.Provider>;
}
