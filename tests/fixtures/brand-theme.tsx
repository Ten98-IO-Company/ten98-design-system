import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, Badge, Banner, Button, DataTable, EmptyState, Field, Heading, Inline, Input, KeyHint, Link, SegmentedControl, Stack, Text, type DataColumn } from '@ten98/ui';
import '@ten98/ui/styles.css';

// A keyboard-first ledger as Books composes it: Arabic and Latin party names in one list, amounts in Latin and
// Arabic-Indic digits, a current row, and the controls whose boxes the brand theme must not resize.
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
const density = params.get('density') === 'compact' ? 'compact' : 'comfortable';
document.documentElement.dataset.density = density;

type Entry = { id: string; party: string; reference: string; amount: string };
const entries: Entry[] = [
  { id: 'r1', party: 'Southwind Partners', reference: 'INV-2041', amount: '18,450.00' },
  { id: 'r2', party: 'شركة النور للتجارة', reference: 'INV-2047', amount: '6,212.50' },
  { id: 'r3', party: 'Gulf Print House', reference: 'CRN-0112', amount: '−940.00' },
  { id: 'r4', party: 'مؤسسة الخليج للخدمات', reference: 'INV-2055', amount: '١٢٣٬٤٥٦٫٧٨' },
  { id: 'r5', party: 'Harbour Foods', reference: 'INV-2058', amount: '27,300.75' },
];
const columns: DataColumn<Entry>[] = [
  { key: 'party', header: 'Party', rowHeader: true },
  { key: 'reference', header: 'Reference', render: row => <Text as="span" mono>{row.reference}</Text> },
  { key: 'amount', header: 'Amount (AED)', numeric: true },
];

function Ledger() {
  const [current, setCurrent] = useState(params.get('current') ?? 'r2');
  const [view, setView] = useState('open');
  return <Stack gap={6}>
    <Heading level={1}>Receivables</Heading>
    <Inline gap={2}>
      <Button variant="primary">New invoice <KeyHint chord="Ctrl+N" /></Button>
      <Button variant="secondary" data-probe="button">Export</Button>
      <Button variant="secondary" size="sm" data-probe="button-sm">Small</Button>
      <Button variant="ghost" size="lg" data-probe="button-lg">Large</Button>
      <Badge tone="success">Paid</Badge>
    </Inline>
    <SegmentedControl label="View" value={view} onValueChange={setView} options={[{ value: 'open', label: 'Open' }, { value: 'paid', label: 'Paid' }, { value: 'all', label: 'All' }]} />
    <Field label="Search parties"><Input data-probe="input" defaultValue="Al Noor" /></Field>
    <DataTable caption="Open invoices" columns={columns} rows={entries} rowKey={row => row.id} density={density}
      searchable={false} sortable={false} pagination={false} activeKey={current} onRowActivate={(_row, key) => setCurrent(key)} />
    <Text>Amounts are formatted by the app. <Link href="#terms">Payment terms</Link> apply to every invoice.</Text>
    {/* Link-style actions in an alert and a banner: ink links must underline (WCAG 1.4.1). */}
    <Alert tone="warning" title="3 invoices are overdue" actions={<Link href="#overdue" variant="standalone">Review overdue</Link>}>
      Reminders go out on Monday. <a href="#reminders">Change the schedule</a>.
    </Alert>
    <Banner tone="info" title="Statements are ready" action={{ label: 'Download statements', href: '#statements' }}>October closes on Friday. <Link href="#close" variant="quiet">Closing checklist</Link></Banner>
    <EmptyState title="No credit notes" description="Credit notes you raise appear here." />
  </Stack>;
}

createRoot(document.getElementById('brand-theme-fixture')!).render(<Ledger />);
