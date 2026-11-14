import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, Button, DataTable, KeyHint, PageHeader, PrintRegion, ReportPanel, ReportToolbar, Stack, Text, type DataColumn, type DataTableApi } from '@ten98/ui';
import '@ten98/ui/styles.css';

// Composed the way an application screen must be: library components only. A report page inside the app shell.
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';

interface Line { id: string; account: string; balance: number }
const line = (prefix: string, index: number): Line => ({ id: `${prefix}${index + 1}`, account: `Account ${index + 1}`, balance: (index + 1) * 100 });
const lines: Line[] = Array.from({ length: 25 }, (_, index) => line('a', index));
// ?rows= sets the statement's size for stress and print-limit checks.
const statement: Line[] = Array.from({ length: Number(params.get('rows')) || 3000 }, (_, index) => line('s', index));
const ledger: Line[] = Array.from({ length: 30 }, (_, index) => line('p', index));
const columns: DataColumn<Line>[] = [{ key: 'account', header: 'Account', rowHeader: true }, { key: 'balance', header: 'Balance', numeric: true }];
// One taller row: virtualize cannot window rows of different heights, so it renders them all.
const unevenColumns: DataColumn<Line>[] = [{ key: 'account', header: 'Account', rowHeader: true, render: entry => entry.id === 'u4' ? <Stack gap={1}><Text>{entry.account}</Text><Text>Second line</Text></Stack> : entry.account }, columns[1]];
declare global { interface Window { edges: string[] } }
window.edges = [];

// A long sortable table alone on the page, for checking printed pages.
function PrintedLedger() {
  return <DataTable columns={columns} rows={statement.slice(0, 300)} rowKey={entry => entry.id} caption="Printed ledger" pagination={false} searchable={false} />;
}

function Screen() {
  const [opened, setOpened] = useState('');
  const balancesApi = useRef<DataTableApi>(null);
  const statementApi = useRef<DataTableApi>(null);
  const ledgerApi = useRef<DataTableApi>(null);
  // A server-paged ledger: the app holds the page, and moving past either end loads the next one and restores focus.
  const [ledgerPage, setLedgerPage] = useState(0);
  const [focusAfterLoad, setFocusAfterLoad] = useState<'first' | 'last'>();
  const ledgerRows = ledger.slice(ledgerPage * 10, ledgerPage * 10 + 10);
  useEffect(() => {
    if (!focusAfterLoad) return;
    ledgerApi.current?.focusRow(ledgerRows[focusAfterLoad === 'first' ? 0 : ledgerRows.length - 1].id);
    setFocusAfterLoad(undefined);
  }, [focusAfterLoad, ledgerRows]);
  const report = <ReportPanel title="Trial balance" scope="All accounts" source="Ledger" asOf="31 October" status="ready" actions={<Button variant="secondary">Export</Button>}>
    <ReportToolbar controls={<Button variant="secondary">Change period</Button>} summary={<Text>Applied: all accounts, October</Text>} actions={<Button variant="secondary">Reset</Button>} />
    <DataTable columns={columns} rows={lines.slice(0, 12)} rowKey={entry => entry.id} caption="Balances" pageSize={5} apiRef={balancesApi} onRowActivate={(_entry, key) => setOpened(key)} />
  </ReportPanel>;
  return <AppShell sidebar={<Text>Ledger navigation</Text>} header={<Text>Workspace header</Text>}>
    <Stack gap={4}>
      <PageHeader title="Reports" description="Period ending 31 October" actions={<Button>Print <KeyHint chord="Ctrl+P" /></Button>} />
      <PrintRegion print="never"><Text id="tips">Tips for this screen.</Text></PrintRegion>
      {params.get('only') ? <PrintRegion>{report}</PrintRegion> : report}
      <Text id="other">Notes outside the report.</Text>
      <DataTable columns={columns} rows={lines} rowKey={entry => entry.id} caption="Accounts" pagination={false} searchable={false} stickyHeader
        activeKey="a2" onRowActivate={(_entry, key) => setOpened(key)} />
      <Button onClick={() => balancesApi.current?.focusRow('a12')}>Find a12</Button>
      <Button onClick={() => statementApi.current?.focusRow('s2500')}>Find s2500</Button>
      <DataTable columns={columns} rows={statement} rowKey={entry => entry.id} caption="Statement" pagination={false} searchable={false} sortable={false} virtualize
        apiRef={statementApi} onRowActivate={(_entry, key) => setOpened(key)} footerCells={['Total', '450150000']}
        printLimitNotice={params.get('notice') ? (count, limit) => `Statement of ${count} lines: export it, printing stops at ${limit}.` : undefined} />
      <DataTable columns={unevenColumns} rows={statement.slice(0, 200).map(entry => ({ ...entry, id: entry.id.replace('s', 'u') }))} rowKey={entry => entry.id} caption="Uneven" pagination={false} searchable={false} sortable={false} virtualize />
      <DataTable columns={columns} rows={ledgerRows} rowKey={entry => entry.id} caption="Ledger" searchable={false} sortable={false} apiRef={ledgerApi}
        page={{ index: ledgerPage, size: 10, total: ledger.length }} onPageChange={change => setLedgerPage(change.index ?? 0)}
        loading={params.get('ledgerLoading') === '1'}
        onPageEdge={direction => {
          window.edges.push(direction);
          const next = ledgerPage + (direction === 'next' ? 1 : -1);
          if (next < 0 || next * 10 >= ledger.length) return;
          setLedgerPage(next);
          setFocusAfterLoad(direction === 'next' ? 'first' : 'last');
        }} onRowActivate={(_entry, key) => setOpened(key)} />
      <Text id="opened">{opened}</Text>
    </Stack>
  </AppShell>;
}

createRoot(document.getElementById('print-fixture')!).render(params.get('pdf') ? <PrintedLedger /> : <Screen />);
