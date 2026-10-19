'use client';

import { useId, useState } from 'react';
import { Alert, Button, DataTable, EditorTemplate, Field, Input, Select } from '../../lib';

const initialQuery = { dimension: 'Page', path: '/pricing' };

export default function QueryExplorerExample() {
  const id = useId();
  const [draft, setDraft] = useState(initialQuery);
  const [applied, setApplied] = useState(initialQuery);
  const [requested, setRequested] = useState<typeof initialQuery | null>(null);
  const [scenario, setScenario] = useState('ready');
  const [resultState, setResultState] = useState('ready');
  const [detail, setDetail] = useState('');
  const invalid = !draft.path || draft.path[0] !== '/' || draft.path.includes('?') || draft.path.includes('#');
  const unavailableDimension = draft.dimension === 'Unsupported dimension';
  const [failure, setFailure] = useState('');
  const [denied, setDenied] = useState(false);
  const failed = failure === 'deadline' || failure === 'error';

  function complete() {
    if (!requested) return;
    if (scenario === 'permission-lost') { setDenied(true); setDetail(''); }
    else if (scenario === 'deadline' || scenario === 'error') setFailure(scenario);
    else { setApplied(requested); setResultState(scenario); setFailure(''); setDetail(''); }
    setRequested(null);
  }
  return <EditorTemplate title="Explore a traffic breakdown" description="Choose supported fields, review the draft, then run a local fixture." scope="Workspace North · demo-store · 12–18 October 2026 · UTC · observed pageviews" actions={<Button disabled={invalid || unavailableDimension || requested !== null || denied} onClick={() => setRequested({ ...draft })}>Run query</Button>} preview={<section aria-label="Last successful query"><h3>Applied query</h3><p>Group by {applied.dimension} · page exactly {applied.path}</p><p>As of 19 October 2026, 09:12 UTC. Draft edits do not change this result.</p>{requested && <p role="status">Running {requested.dimension} / {requested.path}. Previous result is retained.</p>}{failed && <Alert title="Requested query failed" tone="danger">{failure === 'deadline' ? 'The query reached its deadline.' : 'The local query fixture failed.'} Your draft and previous successful result remain available.</Alert>}{denied ? <Alert title="Permission lost">Result rows are hidden. Request analytics read access; the local draft is retained.</Alert> : <DataTable caption={`Observed pageviews grouped by ${applied.dimension}`} rows={resultState === 'no-matches' ? [] : [{ id: 'first', label: applied.dimension === 'Browser' ? 'Firefox' : applied.path, count: 42 }, ...(applied.dimension === 'Browser' ? [{ id: 'second', label: 'Safari', count: 0 }] : [])]} rowKey={row => row.id} columns={[{ key: 'label', header: applied.dimension, render: row => <Button variant="ghost" onClick={() => setDetail(`${row.label}: ${row.count} observed pageviews under ${applied.path}.`)}>{row.label}</Button> }, { key: 'count', header: 'Observed pageviews', render: row => row.count }]} emptyTitle="No query matches" />}{resultState === 'partial' && <Alert title="Partial result">Only retained observations are present. Missing rows cannot be inferred.</Alert>}{!denied && detail && <p role="status">{detail}</p>}</section>}>
    <Field label="Source" htmlFor={`${id}-source`}><Select value="native" disabled><option value="native">Retained native analytics</option></Select></Field>
    <Field label="Metric" htmlFor={`${id}-metric`}><Select value="pageviews" disabled><option value="pageviews">Observed pageviews</option></Select></Field>
    <Field label="Group by dimension" htmlFor={`${id}-dimension`} description={unavailableDimension ? 'This dimension is unavailable for the selected source.' : undefined}><Select value={draft.dimension} onChange={event => setDraft({ ...draft, dimension: event.target.value })}><option>Page</option><option>Browser</option><option>Unsupported dimension</option></Select></Field>
    <Field label="Page equals (literal path)" htmlFor={`${id}-path`} error={invalid ? 'Enter a path starting with /, without query or fragment.' : undefined}><Input value={draft.path} onChange={event => setDraft({ ...draft, path: event.target.value })} /></Field>
    <p>Draft: native observations · group by {draft.dimension} · page equals {draft.path || '(missing)'}. No paid request is made.</p>
    <Field label="Next local query outcome" htmlFor={`${id}-scenario`}><Select value={scenario} onChange={event => setScenario(event.target.value)}>{['ready', 'no-matches', 'partial', 'deadline', 'error', 'permission-lost'].map(value => <option key={value}>{value}</option>)}</Select></Field>
    {requested && <><Button variant="secondary" onClick={complete}>Complete local query</Button><Button variant="ghost" onClick={() => setRequested(null)}>Cancel query</Button></>}
    {denied && <Button variant="secondary" onClick={() => setDenied(false)}>Restore local read access</Button>}
  </EditorTemplate>;
}
