'use client';

import { useId, useState } from 'react';
import { AppliedFilters, Button, DataTable, DescriptionList, Field, Heading, MetricTabs, ReportToolbar, Select, Stack, Text, TimeSeriesChart, saveFile } from '../lib/index.js';

type Observation = { date: string; device: 'Mobile' | 'Desktop'; pageViews: number; customEvents: number | null };
const syntheticObservations: Observation[] = [
  { date: '2026-11-01', device: 'Mobile', pageViews: 140, customEvents: 0 },
  { date: '2026-11-01', device: 'Desktop', pageViews: 260, customEvents: 2 },
  { date: '2026-11-02', device: 'Mobile', pageViews: 150, customEvents: 0 },
  { date: '2026-11-02', device: 'Desktop', pageViews: 270, customEvents: null },
  { date: '2026-11-03', device: 'Mobile', pageViews: 144, customEvents: 0 },
  { date: '2026-11-03', device: 'Desktop', pageViews: 270, customEvents: 1 },
];
type Scope = { device: 'all' | 'Mobile' | 'Desktop'; period: 'all' | 'latest' };

/** A local report composed from one synthetic dataset; the application owns all calculations and actions. */
export default function ReportComposition() {
  const id = useId();
  const [draft, setDraft] = useState<Scope>({ device: 'all', period: 'all' });
  const [applied, setApplied] = useState(draft);
  const [metric, setMetric] = useState('pageViews');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const allDates = [...new Set(syntheticObservations.map(row => row.date))].sort();
  const rows = syntheticObservations.filter(row => (applied.device === 'all' || row.device === applied.device) && (applied.period === 'all' || row.date === allDates.at(-1)));
  const dates = [...new Set(rows.map(row => row.date))].sort();
  const pageViews = rows.reduce((total, row) => total + row.pageViews, 0);
  const knownEvents = rows.reduce((total, row) => total + (row.customEvents ?? 0), 0);
  const unavailableEvents = rows.filter(row => row.customEvents === null).length;
  const deviceLabel = applied.device === 'all' ? 'All devices' : applied.device;
  const periodLabel = dates.length === 1 ? dates[0] : `${dates[0]} to ${dates.at(-1)}`;
  const pending = draft.device !== applied.device || draft.period !== applied.period;
  const eventTotal = unavailableEvents ? `${knownEvents} known` : String(knownEvents);
  const series = (kind: 'pageViews' | 'customEvents') => [{
    id: kind,
    label: kind === 'pageViews' ? 'Page views' : 'Custom events',
    points: dates.map((date, x) => {
      const daily = rows.filter(row => row.date === date);
      return { x, xLabel: date, y: kind === 'customEvents' && daily.some(row => row.customEvents === null) ? null : daily.reduce((total, row) => total + (row[kind] ?? 0), 0) };
    }),
  }];
  async function exportSample() {
    if (exporting) return;
    setExporting(true);
    setExportError('');
    try {
      const csv = ['date,device,page_views,custom_events,custom_event_state', ...rows.map(row => [row.date, row.device, row.pageViews, row.customEvents ?? '', row.customEvents === null ? 'unavailable' : 'measured'].join(','))].join('\r\n');
      await Promise.resolve(saveFile(`synthetic-traffic-${applied.device}-${applied.period}.csv`, `${csv}\r\n`, 'text/csv;charset=utf-8'));
    } catch {
      setExportError('The sample CSV could not be saved. Try exporting again.');
    } finally {
      setExporting(false);
    }
  }
  return <Stack as="section" aria-label="Synthetic traffic report" gap={5}>
    <Stack gap={1}>
      <Heading level={3}>Traffic report</Heading>
      <Text size="sm" tone="muted">Synthetic daily observations. Mobile events are measured zero; one desktop event observation is unavailable.</Text>
    </Stack>
    <form onSubmit={event => { event.preventDefault(); setApplied({ ...draft }); setExportError(''); }}>
      <ReportToolbar label="Traffic report controls"
        controls={<>
          <Field label="Reporting period" htmlFor={`${id}-period`}><Select id={`${id}-period`} value={draft.period} onChange={event => setDraft(current => ({ ...current, period: event.target.value === 'latest' ? 'latest' : 'all' }))}><option value="all">All recorded days</option><option value="latest">Latest day</option></Select></Field>
          <Field label="Device scope" htmlFor={`${id}-device`}><Select id={`${id}-device`} value={draft.device} onChange={event => setDraft(current => ({ ...current, device: event.target.value === 'Mobile' ? 'Mobile' : event.target.value === 'Desktop' ? 'Desktop' : 'all' }))}><option value="all">All devices</option><option value="Mobile">Mobile</option><option value="Desktop">Desktop</option></Select></Field>
          <Button type="submit">Apply report</Button>
        </>}
        summary={<AppliedFilters label="Applied report scope" filters={[{ id: 'period', label: 'Period (UTC)', value: periodLabel }, { id: 'device', label: 'Device', value: deviceLabel }]} pendingDraft={pending ? 'Filter edits are not applied to the results or export yet.' : undefined} />}
        actions={<Button type="button" variant="secondary" disabled={exporting} aria-busy={exporting || undefined} onClick={() => void exportSample()}>{exporting ? 'Preparing CSV…' : 'Export sample CSV'}</Button>} />
    </form>
    {exportError && <Text role="alert">{exportError}</Text>}
    <MetricTabs label="Traffic report metric" value={metric} onValueChange={setMetric} items={[
      { value: 'pageViews', label: 'Page views', metric: pageViews.toLocaleString('en'), content: <TimeSeriesChart label="Applied daily page views" summary={`${pageViews} page views across ${dates.length} recorded days for ${deviceLabel}.`} kind="line" height={200} bare fit="compress" series={series('pageViews')} /> },
      { value: 'customEvents', label: 'Custom events', metric: eventTotal, change: { label: unavailableEvents ? `${unavailableEvents} event observation unavailable` : 'All event observations supplied', tone: 'neutral' }, content: <TimeSeriesChart label="Applied daily custom events" summary={`${knownEvents} known custom events; ${unavailableEvents} unavailable observations. Zero is measured; an unavailable daily aggregate stays missing.`} kind="bars" height={200} bare fit="compress" series={series('customEvents')} /> },
      { value: 'visitors', label: 'Unique visitors', metric: null, unavailableReason: 'Visitor history is not supplied by this sample.' },
    ]} />
    <DescriptionList aria-label="Applied report summary" columns={3} items={[
      { term: 'Page views', description: pageViews.toLocaleString('en') },
      { term: 'Custom events', description: unavailableEvents ? `${knownEvents} known; ${unavailableEvents} observation unavailable` : String(knownEvents) },
      { term: 'Observed rows', description: `${rows.length} synthetic device/day observations` },
    ]} />
    <DataTable<Observation> ariaLabel="Applied daily observations" rows={rows} rowKey={row => `${row.date}-${row.device}`} searchable={false} sortable={false} pagination={false} responsive="stack" columns={[
      { key: 'date', header: 'Date (UTC)', rowHeader: true, wrap: true, render: row => row.date },
      { key: 'device', header: 'Device', render: row => row.device },
      { key: 'pageViews', header: 'Page views', numeric: true, render: row => row.pageViews },
      { key: 'customEvents', header: 'Custom events', numeric: true, render: row => row.customEvents === null ? 'Unavailable' : row.customEvents },
    ]} />
  </Stack>;
}
