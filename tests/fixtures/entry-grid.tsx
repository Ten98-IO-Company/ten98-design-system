import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button, EntryGrid, Field, Heading, Input, ShortcutProvider, ShortcutScope, Stack, Text, normalizeDecimal, useCommand, useEntryGrid,
  type ComboboxOption, type EntryGridApi, type EntryGridColumn, type EntryGridRow, type EntryParseResult,
} from '@ten98/ui';
import '@ten98/ui/styles.css';

// Composed the way an application screen must be: library components only. The app owns rows, accounts, money and totals.
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
if (params.get('dir') === 'rtl') document.documentElement.dir = 'rtl';
const currency = params.get('currency');

declare global { interface Window { log: string[] } }
window.log = [];
let next = 1;
const blank = (): EntryGridRow => ({ key: `row-${next++}`, values: { side: 'debit', ...(currency && { currency }) } });
// The app's money module: it parses by each row's currency exponent, and totals decimal strings as integer minor units.
const exponent = (row: EntryGridRow) => row.values.currency === 'KWD' ? 3 : 2;
function parseMoney(text: string, row: EntryGridRow): EntryParseResult {
  const places = exponent(row), result = normalizeDecimal(text, places, true);
  return 'error' in result ? { error: result.error === 'scale' ? `Use up to ${places} decimal places.` : 'Enter a number.' } : result;
}
const hundredths = (value = '') => value ? BigInt(value.replace('.', '')) : 0n;
const money = (value: bigint) => `${value / 100n}.${String(value % 100n).padStart(2, '0')}`;
const strip = (rows: EntryGridRow[]) => rows.map(row => { const { line: _line, ...values } = row.values; return { ...row, values }; });

function GridCommands({ onReplace }: { onReplace: () => void }) {
  const grid = useEntryGrid();
  useCommand({ id: 'entry.remove-row', label: 'Remove row', run: () => grid.removeRow() });
  useCommand({ id: 'entry.insert-above', label: 'Insert row above', run: () => grid.insertRow('above') });
  useCommand({ id: 'entry.insert-below', label: 'Insert row below', run: () => grid.insertRow('below') });
  useCommand({ id: 'entry.allocate', label: 'Allocate', run: () => grid.openPanel() });
  useCommand({ id: 'entry.replace', label: 'Reload lines', run: onReplace });
  return null;
}
function ScreenCommands({ onBack, onSave }: { onBack: () => void; onSave: () => void }) {
  useCommand({ id: 'voucher.back', label: 'Back', run: onBack });
  useCommand({ id: 'voucher.save', label: 'Save', run: onSave });
  return null;
}

function Screen() {
  const [accounts, setAccounts] = useState<ComboboxOption[]>([{ value: 'cash', label: 'Cash', description: '1000' }, { value: 'bank', label: 'Bank', description: '1010' }, { value: 'rent', label: 'Rent expense', description: '5100' }]);
  const [rows, setRows] = useState<EntryGridRow[]>(() => [blank()]);
  // Commands read the rows the grid last reported, which commit() has already delivered by the time it returns.
  const saved = useRef(rows);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const grid = useRef<EntryGridApi>(null);
  const columns: EntryGridColumn[] = [
    { id: 'date', label: 'Date', type: 'date' },
    { id: 'account', label: 'Account', type: 'lookup', required: true, options: accounts,
      onCreate: text => { const value = text.toLowerCase().replace(/\s+/g, '-'); setAccounts(list => [...list, { value, label: text }]); window.log.push(`create:${text}`); return value; } },
    { id: 'side', label: 'Side', type: 'side', required: true, sides: [{ value: 'debit', label: 'Debit' }, { value: 'credit', label: 'Credit' }] },
    { id: 'amount', label: 'Amount', type: 'amount', required: true, parse: parseMoney, validate: value => /^0\.0+$/.test(value) ? 'Enter an amount above zero.' : undefined },
    { id: 'quantity', label: 'Quantity', type: 'quantity' },
    { id: 'memo', label: 'Memo', type: 'text' },
    { id: 'line', label: 'Line', type: 'text', readOnly: true },
  ];
  const change = (next: EntryGridRow[]) => { saved.current = strip(next); setRows(saved.current); setErrors({}); };
  const shown = rows.map((row, index) => ({ ...row, values: { ...row.values, line: String(index + 1) } }));
  const total = (side: string) => money(rows.filter(row => row.values.side === side).reduce((sum, row) => sum + hundredths(row.values.amount), 0n));
  const save = () => { if (grid.current?.commit()) window.log.push(`save:${saved.current.map(row => row.values.amount ?? '').join(',')}`); };
  function post() {
    if (!grid.current?.commit()) return;
    const sum = (side: string) => saved.current.filter(row => row.values.side === side).reduce((all, row) => all + hundredths(row.values.amount), 0n);
    const last = saved.current[saved.current.length - 1];
    if (sum('debit') === sum('credit')) { window.log.push('post'); return; }
    // A server-style error on a cell the user has left: shown in the grid, announced, and focused.
    setErrors({ [last.key]: { amount: 'Debits and credits differ.' } });
    grid.current.focusCell(last.key, 'amount');
  }
  // Reloads the lines with new keys, or loads one when the grid is empty.
  const replace = () => change(saved.current.length ? saved.current.map(row => ({ ...row, key: `${row.key}-reloaded` })) : [blank()]);
  return <ShortcutProvider keymaps={{ classic: {
    'entry.remove-row': 'Ctrl+Delete', 'entry.insert-above': 'Ctrl+Shift+Enter', 'entry.insert-below': 'Ctrl+Enter', 'entry.allocate': 'Alt+L', 'entry.replace': 'Alt+R',
    'voucher.back': 'Escape', 'voucher.save': 'Ctrl+S',
  } }}>
    <ShortcutScope name="Voucher">
      <ScreenCommands onBack={() => { window.log.push('back'); document.getElementById('post')?.focus(); }} onSave={save} />
      <Stack as="main" gap={4}>
        <Heading level={1}>Journal entry</Heading>
        <Field label="Reference"><Input name="reference" /></Field>
        <EntryGrid label="Journal lines" columns={columns} rows={shown} createRow={params.get('create') === '0' ? undefined : blank} apiRef={grid}
          onRowsChange={change} errors={errors} footer={{ amount: `${total('debit')} / ${total('credit')}` }} footerLabel="Debit / credit"
          panel={{ title: row => `Allocate line ${row.values.line}`, render: (row, close) => <Stack gap={3}>
            <Field label="Cost centre"><Input defaultValue={allocations[row.key] ?? ''} onChange={event => setAllocations(all => ({ ...all, [row.key]: event.target.value }))} /></Field>
            <Button onClick={close}>Done</Button>
          </Stack> }}>
          <GridCommands onReplace={replace} />
        </EntryGrid>
        <Button id="post" onClick={post}>Post voucher</Button>
        <Text id="rows">{JSON.stringify(rows.map(row => row.values))}</Text>
        <Text id="allocations">{JSON.stringify(allocations)}</Text>
      </Stack>
    </ShortcutScope>
  </ShortcutProvider>;
}

createRoot(document.getElementById('entry-grid-fixture')!).render(<Screen />);
