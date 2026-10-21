import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Badge, Button, DataTable, Heading, MetricCard, MetricGrid, Stack, Text, type DataColumn, type TablePageChange, type TableSort } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';

type Campaign = { id: string; name: string; status: string; spend?: number; clicks: number; owner: string; region: string; note: string };
const campaigns: Campaign[] = Array.from({ length: 30 }, (_, index) => ({
  id: `c${index + 1}`,
  name: `Campaign ${index + 1} with a deliberately long destination name`,
  status: index % 3 === 0 ? 'Active' : 'Draft',
  spend: index % 5 === 0 ? undefined : 1200 + index * 37,
  clicks: 300 + index * 11,
  owner: `owner${index + 1}@example.com`,
  region: ['Dubai', 'Doha', 'Riyadh'][index % 3],
  note: 'Reviewed against the quarterly budget and the regional launch calendar before publishing.',
}));
const wideColumns: DataColumn<Campaign>[] = [
  { key: 'name', header: 'Campaign', rowHeader: true, minWidth: 'lg' },
  { key: 'status', header: 'Status', render: row => <Badge tone={row.status === 'Active' ? 'success' : 'neutral'}>{row.status}</Badge> },
  { key: 'spend', header: 'Spend', numeric: true, render: row => row.spend?.toLocaleString() },
  { key: 'clicks', header: 'Clicks', numeric: true },
  { key: 'owner', header: 'Owner', minWidth: 'lg' },
  { key: 'region', header: 'Region', minWidth: 'md' },
  { key: 'note', header: 'Note', minWidth: 'lg' },
];
const stackColumns = wideColumns.slice(0, 4);
const serverColumns = [wideColumns[0], wideColumns[2], wideColumns[3]];
const wrapColumns: DataColumn<Campaign>[] = [{ ...wideColumns[0], wrap: true }, { ...wideColumns[6], wrap: true }];

function Screen() {
  const [sort, setSort] = useState<TableSort>();
  const [index, setIndex] = useState(0);
  const [selection, setSelection] = useState<string[]>([]);
  const [log, setLog] = useState('No callbacks yet');
  const sorted = [...campaigns.slice(0, 6)];
  if (sort) sorted.sort((a, b) => (a[sort.key as 'clicks'] > b[sort.key as 'clicks'] ? 1 : -1) * (sort.direction === 'asc' ? 1 : -1));
  const pageRows = sorted.slice(index * 2, index * 2 + 2);
  const changePage = (change: TablePageChange) => { setIndex(change.index ?? 0); setLog(`page ${change.direction} ${change.index}`); };
  return <Stack as="main" gap={6} id="data-table">
    <Heading level={1}>Data tables</Heading>
    <MetricGrid list label="Summary" minItemWidth="sm">
      <MetricCard label="Clicks" value="12,480" change="12% vs previous period" trend="up" />
      <MetricCard label="Conversion rate" unavailable="Unavailable" hint="Tracking was not connected." />
      <MetricCard label="New events" value={0} />
    </MetricGrid>
    <DataTable columns={wideColumns} rows={campaigns.slice(0, 4)} rowKey={row => row.id} ariaLabel="Wide table" searchable={false} sortable={false} pagination={false}
      footerCells={['Total', '', '4,000', '1,320']} rowActions={() => <Button variant="ghost" size="sm">Open</Button>} />
    <DataTable columns={stackColumns} rows={campaigns.slice(0, 3)} rowKey={row => row.id} caption="Stacked table" captionHidden={false} searchable={false} pagination={false} responsive="stack" />
    <DataTable columns={wideColumns} rows={campaigns} rowKey={row => row.id} ariaLabel="Sticky table" searchable={false} sortable={false} pagination={false} stickyHeader density="compact" />
    <DataTable columns={serverColumns} rows={pageRows} rowKey={row => row.id} caption="Server table" searchable={false} selectable onSelectionChange={setSelection}
      sort={sort} onSortChange={next => { setSort(next); setLog(`sort ${next.key} ${next.direction}`); }}
      page={{ index, size: 2, total: 6 }} onPageChange={changePage} />
    <Text role="status">Last callback: {log}</Text>
    <Text id="server-selection">Selected: {selection.join(',') || 'none'}</Text>
    <DataTable columns={wrapColumns} rows={campaigns.slice(0, 2)} rowKey={row => row.id} ariaLabel="Wrapped table" searchable={false} sortable={false} pagination={false} />
    <DataTable columns={serverColumns} rows={[]} rowKey={row => row.id} caption="Loading table" searchable={false} loading />
    <DataTable columns={serverColumns} rows={[]} rowKey={row => row.id} caption="Unavailable table" searchable={false}
      unavailable={<Stack gap={2}><Text>Campaigns could not be loaded.</Text><Button variant="secondary" size="sm">Retry</Button></Stack>} />
  </Stack>;
}

createRoot(document.getElementById('data-table-fixture')!).render(<Screen />);
