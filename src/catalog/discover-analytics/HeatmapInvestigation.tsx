'use client';

import { useId, useState } from 'react';
import { Alert, Button, DataTable, Field, FlowSection, Select, VisualEvidenceFrame, type VisualEvidenceAlignment } from '../../lib';

const scrollBands = [{ id: 'depth40', label: '40% document depth', clicks: 100, depth: '100 captured documents reached', x: 210, y: 128 }, { id: 'depth70', label: '70% document depth', clicks: 70, depth: '70 captured documents reached', x: 210, y: 224 }];
const elements = [{ id: 'signup', label: 'Start signup', clicks: 84, depth: 'Reached 70%', x: 210, y: 160 }, { id: 'docs', label: 'Read documentation', clicks: 25, depth: 'Reached 40%', x: 100, y: 250 }];

export default function HeatmapInvestigationExample() {
  const id = useId();
  const [mode, setMode] = useState('click');
  const [selected, setSelected] = useState('signup');
  const [alignment, setAlignment] = useState<VisualEvidenceAlignment>('unknown');
  const [state, setState] = useState('ready');
  const [recordings, setRecordings] = useState(false);
  const ranked = mode === 'click' ? elements : scrollBands; const element = ranked.find(item => item.id === selected) ?? ranked[0];
  const noSamples = state === 'no-samples';
  const forbidden = state === 'revoked';
  const expired = state === 'expired';
  const background = state === 'screenshot-unavailable' || noSamples ? undefined : <svg viewBox="0 0 420 320" width="100%" role="img" aria-label="Local synthetic page snapshot, captured viewport 420 by 320"><rect x="1" y="1" width="418" height="318" fill="none" stroke="currentColor" /><text x="25" y="45">Synthetic store page</text><rect x="150" y="135" width="120" height="50" fill="none" stroke="currentColor" /><text x="160" y="165">Start signup</text><text x="40" y="250">Read documentation</text></svg>;
  const overlay = <svg viewBox="0 0 420 320" width="100%" role="img" aria-label={`Synthetic ${mode} overlay for selected element ${element.label}`}>{mode === 'click' ? <circle cx={element.x} cy={element.y} r={22} fill="none" stroke="currentColor" strokeWidth="6" /> : <path d={`M0 ${element.y} H420`} fill="none" stroke="currentColor" strokeWidth="6" />}<text x="15" y="300">{mode === 'click' ? `${element.clicks} observed clicks` : element.depth}</text></svg>;
  return <FlowSection title="Investigate a heatmap" description="Only local SVG fixtures are rendered. No snapshot or website is fetched." scope="Workspace North · demo-store · /pricing · 12–18 October 2026 · UTC">
    <div className="t98-feature-controls">{<>

      <Field label="Map mode" htmlFor={`${id}-mode`}><Select value={mode} onChange={event => { setMode(event.target.value); setSelected(event.target.value === 'click' ? 'signup' : 'depth40'); setRecordings(false); }}><option value="click">Clicks</option><option value="scroll">Scroll reach</option></Select></Field>
    <Field label="App supplied alignment" htmlFor={`${id}-alignment`}><Select value={alignment} onChange={event => setAlignment(event.target.value as VisualEvidenceAlignment)}><option value="unknown">Unknown · suppress spatial overlay</option><option value="aligned">Aligned exact captured viewport</option><option value="mismatch">Page or viewport mismatch</option><option value="unavailable">Unavailable alignment</option></Select></Field>
    <Field label="Local capture availability" htmlFor={`${id}-state`}><Select value={state} onChange={event => { setState(event.target.value); setRecordings(false); }}>{['ready', 'no-samples', 'partial', 'screenshot-unavailable', 'expired', 'revoked'].map(value => <option key={value}>{value}</option>)}</Select></Field>

  </>}</div>
    <VisualEvidenceFrame label="Selected page evidence" context={<><p>/pricing · captured viewport 420 × 320 · snapshot 14 October 2026, 09:30 UTC.</p><p>{mode === 'click' ? 'Observed captured clicks, not visitors.' : 'Sampled captured document reach, not people or sessions. This local fixture supplies two cumulative depth bands; the app report supports ten.'} Numeric ranked data may remain independently authorized when a background expires.</p></>} alignment={alignment} expired={expired} forbidden={forbidden} background={background} overlay={overlay} reason={state === 'partial' ? 'Partial coverage. An aligned sample is one captured document, not all aggregate traffic.' : undefined} rankedList={<DataTable caption={mode === 'click' ? 'Observed element clicks' : 'Observed scroll reach'} rows={noSamples ? [] : ranked} rowKey={row => row.id} columns={[{ key: 'element', header: mode === 'click' ? 'Element' : 'Cumulative document depth', render: row => <Button variant="ghost" aria-pressed={row.id === element.id} onClick={() => { setSelected(row.id); setRecordings(false); }}>{row.label}</Button> }, { key: 'value', header: mode === 'click' ? 'Observed clicks' : 'Captured-document reach', render: row => mode === 'click' ? row.clicks : row.depth }]} emptyTitle="No captured samples" />} actions={<Button variant="secondary" disabled={forbidden || expired || noSamples} onClick={() => setRecordings(true)}>Inspect related recordings</Button>} />
    {recordings && !forbidden && !expired && <Alert title="Related recording context">Selected {element.label} · same page/geometry/scope. Open the app replay library and explicitly load an authorized recording. Selection alone loads no recording.</Alert>}
    <p>Overlay is hidden unless the application supplies known alignment and a present, unexpired, authorized background. Changing a scale or viewport cannot establish alignment.</p>

  </FlowSection>;
}
