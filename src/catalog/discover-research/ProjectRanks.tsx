'use client';

import { useId, useState } from 'react';
import { Alert, Button, DataTable, Field, Input, OverviewTemplate, RankComparison, Select, type RankComparisonRow } from '../../lib';

const samples: RankComparisonRow[] = [
  { id: 'found', label: 'privacy analytics', current: 8, previous: 12, change: 'Improved by 4 positions', source: 'Synthetic Google organic · first 100', detail: 'Latest valid observation 18 October 2026 · desktop · UAE · English' },
  { id: 'not-found', label: 'analytics guide', current: 0, currentReason: 'Native position 0: not found within checked first 100 results; not rank zero.', previous: null, previousReason: 'Never checked in the baseline run.', change: null, changeReason: 'No measured prior position.', source: 'Synthetic native rank contract · coverage 100' },
  { id: 'not-checked', label: 'private metrics', current: null, currentReason: 'Not checked in this run.', previous: 19, change: null, changeReason: 'Latest position unavailable.', source: 'Synthetic saved keyword' },
  { id: 'failed', label: 'web analytics tools', current: null, currentReason: 'Latest attempt failed. Previous valid observation is retained separately.', previous: 24, change: null, changeReason: 'Failed attempt does not establish a new position.', source: 'Synthetic failed run · 18 October 2026' },
  { id: 'unavailable', label: 'audience research', current: null, currentReason: 'Unsupported market/device; no provider observation.', previous: null, previousReason: 'No compatible observation.', change: null, source: 'Unavailable' },
];

export default function ProjectRanks() {
  const id = useId();
  const [name, setName] = useState('Atlas');
  const [project, setProject] = useState('');
  const [view, setView] = useState('Latest');
  const [state, setState] = useState('Compatible observations');
  const [selected, setSelected] = useState('found');
  const [run, setRun] = useState(false);
  const row = samples.find(item => item.id === selected)!;
  return <OverviewTemplate title="Set up a project and inspect ranks" description="Synthetic project and saved observations · local session only" scope={<p>Observation context: Google organic · UAE · English · desktop · first 100 results. Historical context is immutable.</p>}>
    <Field label="Project name" htmlFor={`${id}-name`}><Input value={name} onChange={e => setName(e.target.value)} maxLength={100} /></Field><Button disabled={!name.trim()} onClick={() => setProject(name.trim())}>Create local project</Button>
    {project ? <p>Local project: {project}. Draft name edits do not rename historical observations.</p> : <Alert title="No project created">Create the local project to inspect this synthetic saved keyword set.</Alert>}
    <Field label="Demo state" htmlFor={`${id}-state`}><Select value={state} onChange={e => setState(e.target.value)}>{['Compatible observations', 'No saved keywords', 'No completed runs', 'Incompatible baseline', 'Partial coverage', 'Paused schedule'].map(s => <option key={s}>{s}</option>)}</Select></Field>
    <Field label="Rank section" htmlFor={`${id}-view`}><Select value={view} onChange={e => setView(e.target.value)}>{['Latest', 'History', 'Runs'].map(s => <option key={s}>{s}</option>)}</Select></Field>
    {state === 'Paused schedule' && <Alert title="Schedule paused">No new checks are implied by opening this view. Schedule authorization belongs to the app.</Alert>}
    {state === 'No saved keywords' ? <p>No saved keywords. Add keywords and review engine/market/device before any paid check.</p> : state === 'No completed runs' ? <p>No completed observations. A queued run is not a measured zero.</p> : project && <>
      {state === 'Incompatible baseline' && <Alert tone="warning" title="Baseline uses another device">Compare is unavailable; the latest observation remains readable.</Alert>}
      {state === 'Partial coverage' && <Alert tone="warning" title="Partial run">Some keywords were not checked; absence is not a not-found observation.</Alert>}
      {view === 'Latest' ? <><RankComparison label="Latest rank observations" context="18 October versus 11 October 2026 · Google · UAE · English · desktop" currentLabel="Latest native position" previousLabel="Previous native position" rows={state === 'Incompatible baseline' ? samples.map(item => ({ ...item, previous: null, previousReason: 'Baseline device differs.', change: null, changeReason: 'Contexts are incompatible.' })) : samples} /><Field label="Inspect one keyword" htmlFor={`${id}-keyword`}><Select value={selected} onChange={e => setSelected(e.target.value)}>{samples.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</Select></Field><Button variant="secondary" onClick={() => setView('History')}>Open selected keyword history</Button></> : view === 'History' ? <><Button variant="secondary" onClick={() => setView('Latest')}>Back to latest ranks</Button><RankComparison label={`${row.label} history`} context="Selected keyword retained across list/detail · immutable market/device" currentLabel="18 October 2026" previousLabel="11 October 2026" rows={[row]} /></> : <DataTable caption="Synthetic rank run receipts" rows={[{ id: 'rank-18', status: 'Failed latest attempt; prior observation retained' }, { id: 'rank-11', status: 'Completed compatible baseline' }]} rowKey={r => r.id} columns={[{ key: 'id', header: 'Run receipt' }, { key: 'status', header: 'Outcome' }]} />}
      <p>Five saved keywords × one Google/market/device combination = five checks. This preview creates no schedule or real run.</p><Button disabled={run} onClick={() => setRun(true)}>Preview local run pending state</Button>{run && <Alert title="Local run pending">demo-rank-request-01 has no completed observation. <Button variant="secondary" onClick={() => { setRun(false); setView('Runs'); }}>Inspect local runs</Button></Alert>}
    </>}
  </OverviewTemplate>;
}
