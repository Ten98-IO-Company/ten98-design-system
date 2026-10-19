'use client';

import { useId, useState } from 'react';
import { Alert, Button, DataTable, FlowSection, Field, Progress, Select } from '../../lib';

const issues = [
  { id: 'title', issue: 'Missing document title', type: 'Issue', priority: 'High', count: 1, url: '/guides/start', remedy: 'Provide a descriptive title for this document.' },
  { id: 'description', issue: 'Missing meta description', type: 'Opportunity', priority: 'Low', count: 2, url: '/pricing', remedy: 'Review whether a useful unique description is appropriate. This is not a failed audit.' },
  { id: 'canonical', issue: 'Canonical points outside origin', type: 'Warning', priority: 'Medium', count: 1, url: '/archive', remedy: 'Confirm the canonical is intentional before changing it.' },
];

export default function TechnicalAudit() {
  const id = useId();
  const [state, setState] = useState('Not run');
  const [selected, setSelected] = useState('title');
  const [detail, setDetail] = useState(false);
  const [snapshot, setSnapshot] = useState('');
  const current = issues.find(issue => issue.id === selected)!;
  const hasEvidence = ['Partial crawl', 'Budget exhausted', 'Stale snapshot'].includes(state);
  function exportSnapshot() {
    const payload = JSON.stringify({ synthetic: true, target: 'https://atlas.example', mode: 'static', budget: 25, visited: 12, status: state, asOf: '2026-10-18T23:00:00Z', selectedIssue: current, coverage: 'Bounded subset; no healthy-site conclusion' }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'synthetic-audit-snapshot.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0); setSnapshot('Downloaded the selected synthetic issue with its bounded coverage.');
  }
  return <FlowSection title="Investigate a bounded site audit" description="Synthetic static audit · Atlas · authorized origin https://atlas.example" scope={<p>Allowed static mode only · 25-page budget · public origin policy enforced by the application. No crawl occurs here.</p>}>
    <div className="t98-control-stack">{<Field label="Demo audit state" htmlFor={`${id}-state`}><Select value={state} onChange={e => { setState(e.target.value); setSnapshot(''); }}>{['Not run', 'Blocked target', 'Running', 'Partial crawl', 'Budget exhausted', 'Stale snapshot', 'Zero eligible pages', 'Cancelled'].map(s => <option key={s}>{s}</option>)}</Select></Field>}</div>
    <div className="t98-form-actions"><Button disabled={state === 'Running' || state === 'Blocked target'} onClick={() => { setState('Running'); setDetail(false); setSnapshot(''); }}>Start local bounded audit preview</Button></div>
    {state === 'Running' && <><Progress value={48} label="Synthetic pages visited · 12 of budget 25" /><div className="t98-form-actions"><Button variant="secondary" onClick={() => setState('Partial crawl')}>Read partial local result</Button><Button variant="secondary" onClick={() => setState('Cancelled')}>Cancel local preview</Button></div></>}
    {state === 'Blocked target' && <Alert title="Target blocked by policy">Choose an authorized public origin in the app. No authenticated or JavaScript crawl is enabled.</Alert>}
    {state === 'Zero eligible pages' && <Alert title="No eligible pages">Robots or policy exclusions can prevent observation. No eligible pages is not a healthy-site result.</Alert>}
    {state === 'Cancelled' && <Alert title="Audit cancelled">No complete coverage was established. Selected issue context is retained for another snapshot.</Alert>}
    {hasEvidence && <><Alert tone="warning" title={state}>12 observed pages · 1 parsing failure · 4 policy exclusions · snapshot as of 18 October 2026, 23:00 UTC. Unsupported checks and unvisited pages have no inferred result. {state === 'Budget exhausted' && 'The admitted budget is exhausted; no continuation is automatic.'}</Alert>
      {detail ? <section className="t98-control-stack" aria-label="Selected audit issue"><div className="t98-form-actions"><Button variant="secondary" onClick={() => setDetail(false)}>Back to issue list</Button></div><h3>{current.issue}</h3><p>{current.type} · {current.priority} priority · {current.count} affected observed URLs</p><p dir="ltr">https://atlas.example{current.url}</p><p>{current.remedy}</p><p>Evidence: synthetic static document observation. Inlinks, outlinks and live validation are unavailable in this bounded example.</p></section> : <DataTable caption="Bounded audit issue groups · type and priority are separate" rows={issues} rowKey={r => r.id} columns={[{ key: 'issue', header: 'Issue group' }, { key: 'type', header: 'Type' }, { key: 'priority', header: 'Priority' }, { key: 'count', header: 'Affected observed URLs' }, { key: 'detail', header: 'Inspect', render: r => <Button variant="ghost" aria-label={`Inspect ${r.issue}`} onClick={() => { setSelected(r.id); setDetail(true); }}>Open issue</Button> }]} />}
      <p>Retained selected group: {current.issue}. List/detail uses the same selection on narrow screens.</p><div className="t98-form-actions"><Button variant="secondary" onClick={exportSnapshot}>Download selected local issue snapshot</Button></div>{snapshot && <p role="status">{snapshot}</p>}
    </>}

  </FlowSection>;
}
