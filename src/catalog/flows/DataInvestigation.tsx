'use client';

import { useEffect, useId, useState } from 'react';
import { Alert, Badge, Button, Card, DataTable, DateRangeField, EmptyState, Field, Input, MetricCard, FlowSection, Select, Skeleton, type DataColumn, type DateRange } from '../../lib';

const initialRange: DateRange = { start: '2026-10-12', end: '2026-10-18' };
const scenarios = ['Ready', 'Loading', 'Empty', 'Filtered empty', 'Measured zero', 'Unavailable', 'Partial', 'Stale', 'Error', 'Read only'] as const;
type Scenario = typeof scenarios[number];
type Observation = { id: string; page: string; day: string; views: number | null };
const observations: Observation[] = [
  { id: 'home', page: '/', day: '2026-10-12', views: 418 },
  { id: 'pricing', page: '/pricing', day: '2026-10-14', views: 182 },
  { id: 'guide', page: '/guides/getting-started', day: '2026-10-16', views: 96 },
  { id: 'contact', page: '/contact', day: '2026-10-18', views: 32 },
];

/** Bounded local recipe. Applications supply their own querying and authorization. */
export default function DataInvestigation() {
  const id = useId();
  const [draft, setDraft] = useState(initialRange);
  const [applied, setApplied] = useState(initialRange);
  const [scenario, setScenario] = useState<Scenario>('Ready');
  const [resultScenario, setResultScenario] = useState<Scenario>('Ready');
  const [query, setQuery] = useState('');
  const [inspected, setInspected] = useState('');
  const [request, setRequest] = useState<{ range: DateRange; scenario: Scenario } | null>(null);
  const [updated, setUpdated] = useState('2026-10-19T09:00:00Z');
  const [message, setMessage] = useState('');
  const loading = request !== null || scenario === 'Loading';
  const valid = !!draft.start && !!draft.end && draft.start <= draft.end;
  const dirty = draft.start !== applied.start || draft.end !== applied.end;

  useEffect(() => {
    if (!request) return;
    const timer = setTimeout(() => {
      if (request.scenario === 'Error' || request.scenario === 'Stale') {
        setMessage('Refresh failed. The previous result and applied dates are retained; your draft is unchanged.');
      } else {
        setApplied(request.range);
        setResultScenario(request.scenario === 'Loading' ? 'Ready' : request.scenario);
        setUpdated(new Date().toISOString());
        setInspected('');
        setMessage('Local preview refreshed. No data was requested from a server.');
      }
      setRequest(null);
      if (request.scenario === 'Loading') setScenario('Ready');
    }, 900);
    return () => clearTimeout(timer);
  }, [request]);

  // A finite loading specimen settles without requiring a second interaction.
  useEffect(() => {
    if (scenario !== 'Loading') return;
    const timer = setTimeout(() => setScenario('Ready'), 1800);
    return () => clearTimeout(timer);
  }, [scenario]);

  const scoped = resultScenario === 'Empty' ? [] : observations.filter(row => row.day >= applied.start && row.day <= applied.end).map((row, index) => ({
    ...row, views: resultScenario === 'Unavailable' || (resultScenario === 'Partial' && index === 0) ? null : resultScenario === 'Measured zero' ? 0 : row.views,
  }));
  const visible = scoped.filter(row => row.page.toLowerCase().includes(query.trim().toLowerCase()));
  const known = scoped.filter(row => row.views !== null);
  const total = known.reduce((sum, row) => sum + row.views!, 0);
  const selection = visible.find(row => row.id === inspected);
  const columns: DataColumn<Observation>[] = [
    { key: 'page', header: 'Page' },
    { key: 'day', header: 'Observation date (UTC)' },
    { key: 'views', header: 'Page views', render: row => row.views === null ? 'Unavailable' : row.views.toLocaleString('en-US') },
    { key: 'inspect', header: 'Details', render: row => <Button variant="ghost" size="sm" aria-label={`Inspect ${row.page}`} onClick={() => setInspected(row.id)}>Inspect</Button> },
  ];

  function changeScenario(next: Scenario) {
    setScenario(next);
    if (next !== 'Error' && next !== 'Stale' && next !== 'Loading') setResultScenario(next);
    setQuery(next === 'Filtered empty' ? '/no-matching-page' : '');
    setInspected('');
    setMessage('');
  }

  return <FlowSection aria-label="Data investigation recipe" title="Investigate website traffic" description="Synthetic example · demo.ten98.example · UTC. Four local observations; no live collection or query execution." scope={<>
      <p>Applied dates: <strong>{applied.start} to {applied.end}</strong> · UTC</p>
      <p>Synthetic result as of <time dateTime={updated}>{new Date(updated).toLocaleString('en-GB', { timeZone: 'UTC' })} UTC</time></p>
    </>}>
    <div className="t98-feature-controls">{<>
      <Field label="Demo scenario" htmlFor={`${id}-scenario`}>
        <Select value={scenario} disabled={request !== null} onChange={event => changeScenario(event.target.value as Scenario)}>
          {scenarios.map(item => <option key={item}>{item}</option>)}
        </Select>
      </Field>
      <DateRangeField label="Draft reporting dates (UTC)" {...draft} onChange={setDraft} disabled={request !== null} />
      {!valid && <p role="status">Choose both dates, with the end on or after the start.</p>}
      <p>{dirty ? 'Draft dates have not been applied.' : 'Draft dates match the applied result.'}</p>
      <div className="t98-form-actions"><Button disabled={!valid || request !== null} loading={request !== null} onClick={() => {
        setMessage(''); setRequest({ range: { ...draft }, scenario });
      }}>{scenario === 'Error' || scenario === 'Stale' ? 'Retry local refresh' : 'Refresh local preview'}</Button></div>
    </>}</div>
    <Badge tone={scenario === 'Partial' || scenario === 'Stale' ? 'warning' : 'neutral'}>{loading ? 'Loading' : scenario}</Badge>
    {scenario === 'Read only' && <Alert title="Read-only access">You can investigate this report. Editing collection settings requires an administrator. This preview demonstrates access presentation only.</Alert>}
    {scenario === 'Error' && <Alert tone="danger" title="Refresh failed">The last successful result remains below under its original dates. Retry the local refresh or keep inspecting the previous result.</Alert>}
    {scenario === 'Stale' && <Alert tone="warning" title="Previous result is stale">The latest refresh failed. These observations retain their earlier timestamp; retry the local refresh.</Alert>}
    {resultScenario === 'Partial' && <Alert tone="warning" title="Partial measurement">One page count is missing. The metric sums known counts only; it is not the total traffic.</Alert>}
    {resultScenario === 'Unavailable' && <Alert title="Page-view counts unavailable">No reliable counts were returned. Listed page/date observations do not establish a measured zero.</Alert>}
    {message && <Alert tone={scenario === 'Error' || scenario === 'Stale' ? 'danger' : 'success'} title={message} />}
    {loading && <div role="status"><p>Refreshing the page breakdown. The applied result below remains the previous result until completion.</p><Skeleton /><Skeleton /></div>}

    <div className="t98-control-stack" aria-busy={loading || undefined}>
      <h3>Page breakdown</h3>
      <MetricCard label={resultScenario === 'Partial' ? 'Known page views (partial)' : 'Page views across applied dates'}
        value={!scoped.length ? '—' : !known.length ? 'Unavailable' : total.toLocaleString('en-US')}
        change={!scoped.length ? 'No observations in this result' : resultScenario === 'Measured zero' ? 'Confirmed zero in the synthetic measurement' : 'Page-view events; search below affects rows only'} />
      <Field label="Search page breakdown" htmlFor={`${id}-search`} description="Search the four local observations within the applied dates.">
        <Input type="search" value={query} disabled={loading} onChange={event => { setQuery(event.target.value); setInspected(''); }} />
      </Field>
      {!scoped.length ? <EmptyState title={resultScenario === 'Empty' ? 'No observations collected yet' : 'No observations in this date range'} description={resultScenario === 'Empty' ? 'Check collection setup in your app, then return when an event is accepted.' : 'Adjust the draft dates and refresh. The sample covers 12–18 October 2026.'} />
        : !visible.length ? <EmptyState title="No pages match this search" description="Observations exist in the applied range. Clear the search to inspect them." action={<Button variant="secondary" onClick={() => { setQuery(''); if (scenario === 'Filtered empty') setScenario('Ready'); }}>Clear search</Button>} />
        : <DataTable columns={columns} rows={visible} rowKey={row => row.id} caption="Synthetic page breakdown · applied reporting dates · UTC" searchable={false} pageSize={4} />}
      {selection && <Card title={`Observation: ${selection.page}`} description={`${selection.day} · UTC · Synthetic page-view events`} actions={<Button variant="ghost" onClick={() => setInspected('')}>Close details</Button>}>
        <p>Page views: {selection.views === null ? 'Unavailable — collection returned no reliable count.' : selection.views.toLocaleString('en-US')}</p>
      </Card>}
    </div>

  </FlowSection>;
}
