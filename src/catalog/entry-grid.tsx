import { useState } from 'react';
import { EntryGrid, type EntryGridColumn, type EntryGridRow } from '../lib';
import { tsx, type ComponentEntry, type ComponentProp } from './model';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, ...(required && { required }), ...(defaultValue && { defaultValue }) });

const columns: EntryGridColumn[] = [
  { id: 'account', label: 'Account', type: 'lookup', required: true, options: [{ value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank' }, { value: 'rent', label: 'Rent expense' }] },
  { id: 'side', label: 'Side', type: 'side', required: true, sides: [{ value: 'debit', label: 'Debit' }, { value: 'credit', label: 'Credit' }] },
  { id: 'amount', label: 'Amount', type: 'amount', required: true },
  { id: 'memo', label: 'Memo', type: 'text' },
];
let demoKey = 0;
const blankRow = (): EntryGridRow => ({ key: `line-${++demoKey}`, values: { side: 'debit' } });
function EntryGridDemo({ invalid = false }: { invalid?: boolean }) {
  const [rows, setRows] = useState<EntryGridRow[]>((): EntryGridRow[] => [{ key: 'line-a', values: { account: 'rent', side: 'debit', amount: '1250.00', memo: 'November rent' } }, { key: 'line-b', values: { account: 'bank', side: 'credit', amount: invalid ? '' : '1250.00' } }]);
  return <EntryGrid label="Journal lines" columns={columns} rows={rows} onRowsChange={setRows} createRow={blankRow} footer={{ amount: '1250.00 / 1250.00' }} footerLabel="Debit / credit" />;
}
const code = tsx(['EntryGrid', 'type EntryGridColumn', 'type EntryGridRow'], `<EntryGrid label="Journal lines" columns={columns} rows={rows} onRowsChange={setRows}
  createRow={() => ({ key: crypto.randomUUID(), values: { side: 'debit' } })}
  footer={{ amount: totals }} footerLabel="Debit / credit" />`, `const columns: EntryGridColumn[] = [
  { id: 'account', label: 'Account', type: 'lookup', required: true, options: accounts, onCreate: text => createAccount(text) },
  { id: 'side', label: 'Side', type: 'side', required: true, sides: [{ value: 'debit', label: 'Debit' }, { value: 'credit', label: 'Credit' }] },
  { id: 'amount', label: 'Amount', type: 'amount', required: true },
  { id: 'memo', label: 'Memo', type: 'text' },
];
const [rows, setRows] = useState<EntryGridRow[]>([{ key: 'line-1', values: { side: 'debit' } }]);
// The app adds up amounts as decimal strings; the grid only shows the result.
const totals = '0.00 / 0.00';`, ['useState']).replace("export default function", `const accounts = [{ value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank' }];
function createAccount(text: string) { return text.toLowerCase(); }

export default function`);

export const entryGridEntries: ComponentEntry[] = [{
  name: 'EntryGrid', category: 'Controls', description: 'A dense, keyboard-first grid of typed cells for fast transactional entry, such as journal or invoice lines.',
  usage: 'The app owns rows (key plus string values by column id), options, totals and every command. Column types: text, lookup (the shared combobox, with an optional onCreate for "Create …" that returns the new value), amount and quantity (decimal strings in and out; Arabic-Indic digits and grouping are normalised; the grid never does arithmetic), date (ISO) and side (two choices, for example debit and credit). While editing, Enter or Tab commits and advances to the next editable cell and then the next row; createRow appends a row after a complete last row. Shift+Tab and Backspace in an empty cell go back. Escape cancels the edit; a second Escape goes to the app’s own command. Arrow keys, Home, End, PageUp and PageDown move between cells when not editing, mirrored in RTL. An invalid value keeps its text and shows its message. Render command components as children: useEntryGrid() gives activeRow, removeRow and openPanel for commands registered with useCommand, active only while focus is in the grid. panel renders an app sub-panel (for example allocations) in a Dialog; its first control takes focus and focus returns to the originating cell.',
  props: [
    prop('label', 'string', 'Accessible name of the grid and its shortcut context.', true),
    prop('columns', 'EntryGridColumn[]', 'id, label, type, required?, readOnly?, options? and onCreate? (lookup), sides? (side), scale? (amount 2, quantity 3), validate?(value, row).', true),
    prop('rows', 'EntryGridRow[]', 'At least one row: { key, values }.', true),
    prop('onRowsChange', '(rows: EntryGridRow[]) => void', 'Called with the next rows after a commit, an appended row or a removal.', true),
    prop('createRow', '() => EntryGridRow', 'Lets Enter and Tab append a row after the last row is complete; also refills a grid whose last row was removed.'),
    prop('footer', 'Record<string, string>', 'App-computed values by column id, for example totals. Changes are announced.'),
    prop('footerLabel', 'string', 'Label for the footer row.', false, "'Total'"),
    prop('panel', '{ title(row); render(row, close) }', 'A sub-panel opened with useEntryGrid().openPanel().'),
    prop('labels', 'Partial<EntryGridLabels>', 'Localised messages and announcements.'),
    prop('children', 'ReactNode', 'Command components that call useEntryGrid and useCommand.'),
  ],
  tokens: ['--t98-border', '--t98-surface', '--t98-text', '--t98-muted', '--t98-cell-padding', '--t98-control-height', '--t98-accent-soft', '--t98-focus', '--t98-focus-width', '--t98-danger', '--t98-text-sm', '--t98-text-xs', '--t98-font', '--t98-radius'],
  accessibility: [
    'A WAI-ARIA grid with one tab stop (roving tabindex): Tab enters at the active cell and leaves the grid, so the keyboard is never trapped.',
    'Every editor is named "Column, row N"; required cells set aria-required, and an invalid cell sets aria-invalid with its message as the editor’s description.',
    'A polite status region announces validation errors, added and removed rows, and footer changes.',
    'Cells follow the density tokens; narrow screens scroll the grid inside its own box, and amounts read left to right in RTL.',
  ],
  related: ['Combobox', 'DataTable', 'ShortcutProvider', 'Dialog'], example: code,
  states: [
    { name: 'Journal lines', description: 'Focus a cell and type, or press Enter to edit; Enter advances, and a complete last row adds the next.', preview: <EntryGridDemo />, code },
    { name: 'Required cell', description: 'Press Enter on the last line’s amount to see the required message.', preview: <EntryGridDemo invalid />, code },
  ],
}];
