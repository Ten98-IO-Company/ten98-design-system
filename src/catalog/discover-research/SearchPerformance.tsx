'use client';

import { useId, useState } from 'react';
import { Alert, Button, DataTable, EvidenceSummary, Field, FlowSection, Select } from '../../lib';

type SearchRow = { id: string; date: string; query: string; page: string; clicks: number | null; impressions: number | null; ctr: string | null; position: string | null };
const observations: SearchRow[] = [
  { id: 'one', date: '2026-10-17', query: 'privacy analytics', page: 'https://atlas.example/', clicks: 12, impressions: 240, ctr: '0.05', position: '8.25' },
  { id: 'two', date: '2026-10-18', query: 'analytics guide', page: 'https://atlas.example/guides', clicks: 0, impressions: 18, ctr: '0', position: '12.5' },
  { id: 'three', date: '2026-10-18', query: 'private metrics', page: 'https://atlas.example/pricing', clicks: null, impressions: null, ctr: null, position: null },
];

export default function SearchPerformance() {
  const id = useId();
  const [state, setState] = useState('Ready');
  const [dimension, setDimension] = useState('Query');
  const [filter, setFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchRow | null>(null);
  const permitted = state !== 'Authorization missing' && state !== 'Access revoked';
  const visible = state === 'No observations' || state === 'Filtered empty' ? [] : observations.filter(row => !filter || row.query === filter);
  return <FlowSection title="Read owned-property search performance" description="Synthetic retained Search Console daily rows · Atlas · Web search" scope={<p>Property: sc-domain:atlas.example · 17–18 October 2026 · imported daily query/page observations. Scope is owned property, not competitor research.</p>}>
    <div className="t98-feature-controls">{<>
      <Field label="Demo snapshot state" htmlFor={`${id}-state`}><Select value={state} onChange={e => { setState(e.target.value); setSelected(null); }}>{['Ready', 'Preliminary data', 'Stale sync', 'No observations', 'Filtered empty', 'Authorization missing', 'Access revoked'].map(s => <option key={s}>{s}</option>)}</Select></Field><Field label="Available retained dimension" htmlFor={`${id}-dimension`}><Select value={dimension} onChange={e => { setDimension(e.target.value); setSelected(null); }}><option>Query</option><option>Page</option></Select></Field>
    </>}</div>
    {!permitted ? <Alert title={state}>An authorized property connection is required. Stored row payload is hidden until the app establishes current access.</Alert> : <>
      <EvidenceSummary variant="compact" source="Google Search Console · synthetic import gsc-18" observedAt={{ label: 'Imported 18 October 2026, 23:00 UTC' }} basis="Daily native clicks, impressions, CTR fraction and average position; values are supplied, never recomputed from rows." freshness={{ status: state === 'Stale sync' ? 'stale' : 'unknown', reason: state === 'Stale sync' ? 'The latest sync failed; the earlier retained snapshot is shown.' : 'No source freshness classification was supplied.' }} coverage={{ status: 'partial', reason: 'Bounded query/page rows; omitted or anonymized queries are not filled with zeros.' }} reason={state === 'Preliminary data' ? 'Provider marked this interval preliminary. Later data may differ.' : 'Source quality is retained with the snapshot.'} details={<p>These profiles provide daily/query/page rows. Country/device breakdown controls and a live aggregate chart require a separately supported contract. Row sums need not equal Search Console aggregate totals.</p>} />
      {filter && <p>Applied query: {filter} <Button variant="ghost" onClick={() => { setFilter(null); setSelected(null); }}>Clear query filter</Button></p>}
      <DataTable caption={`Synthetic daily Search Console ${dimension.toLowerCase()} observations · native values`} rows={visible} rowKey={r => r.id} emptyTitle={state === 'Filtered empty' ? 'No rows match the selected local scope' : 'No measured observations'} columns={[
        { key: 'date', header: 'Date (source reporting day)' }, { key: dimension === 'Query' ? 'query' : 'page', header: dimension },
        { key: 'clicks', header: 'Clicks', render: r => r.clicks === null ? 'Unavailable' : r.clicks }, { key: 'impressions', header: 'Impressions', render: r => r.impressions === null ? 'Unavailable' : r.impressions }, { key: 'ctr', header: 'CTR (native fraction)', render: r => r.ctr === null ? 'Unavailable' : r.ctr }, { key: 'position', header: 'Average position', render: r => r.position === null ? 'Unavailable' : r.position },
        { key: 'detail', header: 'Detail', render: r => <Button variant="ghost" onClick={() => setSelected(r)} aria-label={`Inspect ${r.query}`}>Inspect row</Button> },
      ]} />
      {selected && <section className="t98-control-stack" aria-label="Search row detail"><div className="t98-form-actions"><Button variant="secondary" onClick={() => setSelected(null)}>Back to daily rows</Button></div><h3>{selected.query}</h3><p dir="ltr">{selected.page}</p><p>{selected.date} · clicks: {selected.clicks === null ? 'Unavailable' : selected.clicks} · native CTR: {selected.ctr === null ? 'Unavailable' : selected.ctr}</p><div className="t98-form-actions"><Button variant="secondary" onClick={() => { setFilter(selected.query); setSelected(null); }}>Apply this query to retained rows</Button></div></section>}
      <p>No imported-report CSV capability is assumed. Any future export must preserve null, measured zero, native units, source quality and exact loaded scope.</p>
    </>}

  </FlowSection>;
}
