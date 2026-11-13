import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button, EntryGrid, Field, Heading, Input, ShortcutProvider, ShortcutScope, Stack, Text, useCommand, useEntryGrid,
  type ComboboxOption, type EntryGridColumn, type EntryGridRow,
} from '@ten98/ui';
import '@ten98/ui/styles.css';

// Composed the way an application screen must be: library components only. The app owns rows, accounts and totals.
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
if (params.get('dir') === 'rtl') document.documentElement.dir = 'rtl';

declare global { interface Window { log: string[] } }
window.log = [];
let next = 1;
const blank = (): EntryGridRow => ({ key: `row-${next++}`, values: { side: 'debit' } });
// Totals in the app, from decimal strings as integer hundredths: the grid itself never adds money.
const hundredths = (value = '') => value ? BigInt(value.replace('.', '')) : 0n;
const money = (value: bigint) => `${value / 100n}.${String(value % 100n).padStart(2, '0')}`;

function GridCommands() {
  const grid = useEntryGrid();
  useCommand({ id: 'entry.remove-row', label: 'Remove row', run: () => grid.removeRow() });
  useCommand({ id: 'entry.allocate', label: 'Allocate', run: () => grid.openPanel() });
  return null;
}
function ScreenCommands({ onBack }: { onBack: () => void }) {
  useCommand({ id: 'voucher.back', label: 'Back', run: onBack });
  return null;
}

function Screen() {
  const [accounts, setAccounts] = useState<ComboboxOption[]>([{ value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank' }, { value: 'rent', label: 'Rent expense' }]);
  const [rows, setRows] = useState<EntryGridRow[]>(() => [blank()]);
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const columns: EntryGridColumn[] = [
    { id: 'date', label: 'Date', type: 'date' },
    { id: 'account', label: 'Account', type: 'lookup', required: true, options: accounts,
      onCreate: text => { const value = text.toLowerCase().replace(/\s+/g, '-'); setAccounts(list => [...list, { value, label: text }]); window.log.push(`create:${text}`); return value; } },
    { id: 'side', label: 'Side', type: 'side', required: true, sides: [{ value: 'debit', label: 'Debit' }, { value: 'credit', label: 'Credit' }] },
    { id: 'amount', label: 'Amount', type: 'amount', required: true, validate: value => value === '0.00' ? 'Enter an amount above zero.' : undefined },
    { id: 'quantity', label: 'Quantity', type: 'quantity' },
    { id: 'memo', label: 'Memo', type: 'text' },
    { id: 'line', label: 'Line', type: 'text', readOnly: true },
  ];
  const shown = rows.map((row, index) => ({ ...row, values: { ...row.values, line: String(index + 1) } }));
  const total = (side: string) => money(rows.filter(row => row.values.side === side).reduce((sum, row) => sum + hundredths(row.values.amount), 0n));
  return <ShortcutProvider keymaps={{ classic: { 'entry.remove-row': 'Ctrl+Delete', 'entry.allocate': 'Alt+L', 'voucher.back': 'Escape' } }}>
    <ShortcutScope name="Voucher">
      <ScreenCommands onBack={() => { window.log.push('back'); document.getElementById('post')?.focus(); }} />
      <Stack as="main" gap={4}>
        <Heading level={1}>Journal entry</Heading>
        <Field label="Reference"><Input name="reference" /></Field>
        <EntryGrid label="Journal lines" columns={columns} rows={shown} createRow={blank}
          onRowsChange={next => setRows(next.map(row => { const { line: _line, ...values } = row.values; return { ...row, values }; }))}
          footer={{ amount: `${total('debit')} / ${total('credit')}` }} footerLabel="Debit / credit"
          panel={{ title: row => `Allocate line ${row.values.line}`, render: (row, close) => <Stack gap={3}>
            <Field label="Cost centre"><Input defaultValue={allocations[row.key] ?? ''} onChange={event => setAllocations(all => ({ ...all, [row.key]: event.target.value }))} /></Field>
            <Button onClick={close}>Done</Button>
          </Stack> }}>
          <GridCommands />
        </EntryGrid>
        <Button id="post">Post voucher</Button>
        <Text id="rows">{JSON.stringify(rows.map(row => row.values))}</Text>
        <Text id="allocations">{JSON.stringify(allocations)}</Text>
      </Stack>
    </ShortcutScope>
  </ShortcutProvider>;
}

createRoot(document.getElementById('entry-grid-fixture')!).render(<Screen />);
