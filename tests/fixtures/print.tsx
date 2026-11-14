import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, Button, DataTable, KeyHint, PageHeader, PrintRegion, ReportPanel, Stack, Text, type DataColumn } from '@ten98/ui';
import '@ten98/ui/styles.css';

// Composed the way an application screen must be: library components only. A report page inside the app shell.
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';

interface Line { id: string; account: string; balance: number }
const lines: Line[] = Array.from({ length: 25 }, (_, index) => ({ id: `a${index + 1}`, account: `Account ${index + 1}`, balance: (index + 1) * 100 }));
const columns: DataColumn<Line>[] = [{ key: 'account', header: 'Account', rowHeader: true }, { key: 'balance', header: 'Balance', numeric: true }];

function Screen() {
  const [opened, setOpened] = useState('');
  const report = <ReportPanel title="Trial balance" scope="All accounts" source="Ledger" asOf="31 October" status="ready" actions={<Button variant="secondary">Export</Button>}>
    <DataTable columns={columns} rows={lines.slice(0, 12)} rowKey={line => line.id} caption="Balances" pageSize={5} />
  </ReportPanel>;
  return <AppShell sidebar={<Text>Ledger navigation</Text>} header={<Text>Workspace header</Text>}>
    <Stack gap={4}>
      <PageHeader title="Reports" description="Period ending 31 October" actions={<Button>Print <KeyHint chord="Ctrl+P" /></Button>} />
      <PrintRegion print="never"><Text id="tips">Tips for this screen.</Text></PrintRegion>
      {params.get('only') ? <PrintRegion>{report}</PrintRegion> : report}
      <Text id="other">Notes outside the report.</Text>
      <DataTable columns={columns} rows={lines} rowKey={line => line.id} caption="Accounts" pagination={false} searchable={false} onRowActivate={(_line, key) => setOpened(key)} />
      <Text id="opened">{opened}</Text>
    </Stack>
  </AppShell>;
}

createRoot(document.getElementById('print-fixture')!).render(<Screen />);
