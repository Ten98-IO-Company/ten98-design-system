'use client';

import { useId, useState } from 'react';
import { Alert, AppliedFilters, Button, ComparisonMetric, DataTable, Field, Input, OverviewTemplate, Select } from '../../lib';

const initialScope = { start: '2026-10-12', end: '2026-10-18', page: '/pricing' };

export default function OverviewComparisonExample() {
  const id = useId();
  const [draft, setDraft] = useState(initialScope);
  const [applied, setApplied] = useState(initialScope);
  const [requested, setRequested] = useState<typeof initialScope | null>(null);
  const [baseline, setBaseline] = useState('normal');
  const [state, setState] = useState('ready');
  const [lastReportState, setLastReportState] = useState('ready');
  const shownState = state === 'error' || state === 'read-only' ? lastReportState : state;
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied);
  const invalid = !draft.start || !draft.end || draft.start > draft.end;
  const empty = shownState === 'filtered-empty';
  const unavailable = shownState === 'unavailable';
  const range = `${applied.start} through ${applied.end} · UTC`;
  function apply() { setRequested({ ...draft }); }
  return <OverviewTemplate title="Website overview and comparison" description="Synthetic observations · dates are inclusive calendar dates" scope={`Workspace North · project demo-store · ${range}`} actions={<Button disabled={invalid || requested !== null || state === 'read-only'} onClick={apply}>Apply report scope</Button>} filters={<>
    <Field label="Start date draft" htmlFor={`${id}-start`}><Input type="date" value={draft.start} onChange={event => setDraft({ ...draft, start: event.target.value })} /></Field>
    <Field label="End date draft" htmlFor={`${id}-end`} error={invalid ? 'Choose a complete range with start before end.' : undefined}><Input type="date" value={draft.end} onChange={event => setDraft({ ...draft, end: event.target.value })} /></Field>
    <Field label="Page filter draft" htmlFor={`${id}-page`}><Select value={draft.page} onChange={event => setDraft({ ...draft, page: event.target.value })}><option value="">All pages</option><option value="/pricing">/pricing</option><option value="/contact">/contact</option></Select></Field>
    <AppliedFilters filters={applied.page ? [{ id: 'page', label: 'Page', operator: 'equals', value: applied.page }] : []} pendingDraft={dirty ? 'Unapplied date or page edits.' : undefined} onRemove={() => setDraft({ ...draft, page: '' })} onClear={() => setDraft({ ...draft, page: '' })} />
    {dirty && <p>Removing a chip stages a draft; use Apply report scope to request its replacement.</p>}
    <Field label="Baseline evidence scenario" htmlFor={`${id}-baseline`}><Select value={baseline} onChange={event => setBaseline(event.target.value)}><option value="normal">Fixed baseline · 5–11 October · observed 800</option><option value="zero">Fixed baseline · 5–11 October · measured zero</option><option value="unavailable">Fixed baseline · 5–11 October · unavailable</option></Select></Field>
    <Field label="Local report state" htmlFor={`${id}-state`}><Select value={state} onChange={event => { const next = event.target.value; setState(next); if (next !== 'error' && next !== 'read-only') setLastReportState(next); if (next === 'read-only') setRequested(null); }}>{['ready', 'measured-zero', 'unavailable', 'filtered-empty', 'partial', 'stale', 'error', 'read-only'].map(value => <option key={value}>{value}</option>)}</Select></Field>
  </>} metrics={<ComparisonMetric label="Estimated visitors" current={{ label: 'Applied report', range, value: unavailable ? null : shownState === 'measured-zero' || empty ? 0 : 1200, unavailableReason: 'Retained visitor-key evidence is unavailable.', partial: shownState === 'partial', stale: shownState === 'stale' || state === 'error', updating: requested !== null, asOf: '19 October 2026, 09:10 UTC', source: 'Synthetic retained native observations' }} baseline={{ label: 'Fixed baseline · 5–11 October', range: '5–11 October 2026 · UTC', value: baseline === 'unavailable' ? null : baseline === 'zero' ? 0 : 800, unavailableReason: 'The baseline interval is outside retained evidence.' }} change={{ label: 'Supplied comparison', value: baseline === 'normal' && !unavailable && shownState !== 'measured-zero' && shownState !== 'partial' && !empty ? '+50%' : null, reason: baseline === 'zero' ? 'A zero baseline has no finite percentage comparison.' : 'No compatible supplied change is available for this fixture.' }} />}>
    {requested && <Alert title="Updating requested scope">Requested {requested.start} through {requested.end}, {requested.page || 'all pages'}. Previous results retain their applied scope.<Button variant="secondary" onClick={() => { setApplied(requested); setRequested(null); if (state === 'error') setState(lastReportState); }}>Complete local refresh</Button><Button variant="ghost" onClick={() => setRequested(null)}>Cancel refresh</Button></Alert>}
    {state === 'error' && <Alert title="Refresh failed" tone="danger">Previous successful values remain under their original scope. Edit your draft and retry Apply report scope.</Alert>}
    {state === 'read-only' && <Alert title="Report access is read only">Saved report changes require editor access; existing scoped values remain readable.</Alert>}
    {state === 'partial' && <Alert title="Partial observation">Some retained key evidence is missing. These are estimates, not a known fraction of all traffic.</Alert>}
    <DataTable caption={`Page breakdown · ${range} · ${applied.page || 'all pages'}`} rows={empty || unavailable ? [] : [{ id: 'row', page: applied.page || '/pricing', views: shownState === 'measured-zero' ? 0 : 1680 }]} rowKey={row => row.id} columns={[{ key: 'page', header: 'Page', render: row => row.page }, { key: 'views', header: 'Observed pageviews', render: row => row.views }]} emptyTitle={unavailable ? 'Breakdown unavailable' : 'No filter matches'} />
  </OverviewTemplate>;
}
