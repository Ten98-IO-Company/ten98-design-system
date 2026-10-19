'use client';

import { useId, useState } from 'react';
import { Alert, Button, Field, Input, JourneyPath, FlowSection, RetentionTable, Select, Tabs, type RetentionCohort } from '../../lib';

const paths = [
  { id: 'checkout', label: '/pricing → signup_started → signup_completed', count: 18, nodes: ['/pricing', 'signup_started', 'signup_completed'] },
  { id: 'docs', label: '/pricing → /docs → /pricing', count: 7, nodes: ['/pricing', '/docs', '/pricing'] },
];

export default function RetentionJourneysExample() {
  const id = useId();
  const [view, setView] = useState('retention');
  const [start, setStart] = useState('2026-10-17');
  const [appliedStart, setAppliedStart] = useState('2026-10-17');
  const [state, setState] = useState('ready');
  const [scenario, setScenario] = useState('ready');
  const [pending, setPending] = useState<string | null>(null);
  const [pathId, setPathId] = useState('checkout');
  const [node, setNode] = useState('');
  const [cell, setCell] = useState('');
  const path = paths.find(item => item.id === pathId)!;
  const missing = state === 'expired' || state === 'unavailable';
  const cohorts: RetentionCohort[] = missing || state === 'empty' ? [] : [{ id: 'cohort', label: `Week of ${appliedStart}`, size: 80, cells: { day0: { status: 'observed', value: '100% (80)', detail: <Button variant="ghost" onClick={() => setCell('Day 0: 80 observed cohort keys. This does not count unique people.')}>Inspect day 0</Button> }, day1: { status: 'observed', value: '0% (0)', detail: <Button variant="ghost" onClick={() => setCell('Day 1: confirmed zero returning keys among the 80-key cohort.')}>Inspect measured zero</Button> }, day2: { status: 'unavailable', reason: 'Retained identity evidence is missing.', detail: <Button variant="ghost" onClick={() => setCell('Day 2 is unavailable. Do not treat missing identity evidence as zero.')}>Inspect missing evidence</Button> }, day3: { status: 'future', reason: 'This cohort has not reached the completed observation interval.' } } }];
  return <FlowSection title="Retention and observed journeys" description="Two distinct reports under an explicitly applied cohort scope." scope={`Workspace North · demo-store · cohort week ${appliedStart} · UTC`}>
    <div className="t98-feature-controls">{<>
    <Field label="Cohort week start draft" htmlFor={`${id}-start`}><Input type="date" value={start} onChange={event => setStart(event.target.value)} /></Field><p>Cohort: first retained native observation in the selected week. Returning activity uses retained native keys, not persistent people.</p>
    <Field label="Next local report outcome" htmlFor={`${id}-scenario`}><Select value={scenario} onChange={event => setScenario(event.target.value)}>{['ready', 'empty', 'partial', 'stale', 'expired', 'unavailable'].map(value => <option key={value}>{value}</option>)}</Select></Field>
    {start !== appliedStart && <p role="status">Draft dates differ. Existing reports retain week {appliedStart}.</p>}
    {pending && <Alert title="Report running" actions={<><Button variant="secondary" onClick={() => { setAppliedStart(pending); setState(scenario); setPending(null); setCell(''); setNode(''); }}>Complete local report</Button><Button variant="ghost" onClick={() => setPending(null)}>Cancel report</Button></>}>Both local reports retain their previous scope until this fixture completes.</Alert>}
  </>}</div>
    <div className="t98-form-actions">{<Button disabled={!start || pending !== null} onClick={() => setPending(start)}>Apply scope to both local reports</Button>}</div>
    {state === 'partial' && <Alert title="Partial retained evidence">Some matching observations lack keys. A changed prefix can move observations between paths, so these values are not known lower bounds.</Alert>}
    {state === 'stale' && <Alert title="Stale report">Last successful snapshot: 19 October 2026, 09:15 UTC. Run explicitly to replace it.</Alert>}
    {missing && <Alert title="Report evidence unavailable">{state === 'expired' ? 'The retained interval expired.' : 'The report selection cannot be established.'} No zero cohort or path graph is inferred.</Alert>}
    <Tabs label="Analytics report" value={view} onValueChange={setView} items={[{ value: 'retention', label: 'Retention cohorts', content: <><RetentionTable label="Observed cohort retention" context="Day columns are elapsed cohort periods; future, missing and measured zero have different meanings." columns={[{ id: 'day0', label: 'Day 0' }, { id: 'day1', label: 'Day 1' }, { id: 'day2', label: 'Day 2' }, { id: 'day3', label: 'Day 3' }]} cohorts={cohorts} emptyMessage={missing ? 'Cohort evidence unavailable.' : 'No observed cohorts in the applied range.'} loading={pending !== null} />{cell && <p role="status">{cell}</p>}</> }, { value: 'journeys', label: 'Observed journey prefixes', content: <>
      <Field label="Choose a ranked observed prefix" htmlFor={`${id}-path`}><Select value={missing || state === 'empty' ? '' : pathId} disabled={missing || state === 'empty'} onChange={event => { setPathId(event.target.value); setNode(''); }}>{missing || state === 'empty' ? <option value="">No eligible retained prefixes</option> : paths.map(item => <option key={item.id} value={item.id}>{item.label} · {item.count} observed visits</option>)}</Select></Field>
      <JourneyPath label="Selected observed journey" context="Native visitor/visit pairs · first 3 collapsed matching runs · at most 100 ranked prefixes. Edges are next matching retained observations, not proven exits or a funnel conversion. Capture coverage unknown; full history is not promised." countLabel="Observed visits with this prefix" selectedId={node} onSelect={setNode} steps={missing || state === 'empty' ? [] : path.nodes.map((label, index) => ({ id: `${path.id}-${index}`, label, count: path.count, detail: index === 2 ? 'Displayed step cap reached; further activity may exist.' : undefined }))} graph={!missing && state !== 'empty' ? <svg viewBox="0 0 420 120" width="100%" role="img" aria-label="Two observed branches from pricing: signup and documentation. Use the prefix selector and ordered list for values."><path d="M60 60 L190 25 L350 25 M60 60 L190 95 L350 95" fill="none" stroke="currentColor" /><text x="0" y="55">/pricing</text><text x="175" y="20">signup</text><text x="175" y="115">/docs</text><circle cx="60" cy="60" r="5" fill="currentColor" /></svg> : undefined} emptyMessage={missing ? 'Journey evidence unavailable.' : 'No observed matching prefixes.'} />{node && <p role="status">Selected retained node: {path.nodes[Number(node.split('-').at(-1))]} · {path.count} observed visits in the chosen prefix. This is not a navigation step.</p>}
    </> }]} />

  </FlowSection>;
}
