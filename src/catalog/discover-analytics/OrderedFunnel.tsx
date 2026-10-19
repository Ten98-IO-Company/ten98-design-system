'use client';

import { useId, useState } from 'react';
import { Alert, Button, EditorTemplate, Field, FunnelBreakdown, Input, Select } from '../../lib';

type Condition = { id: string; type: 'path' | 'event'; value: string };
const initialSteps: Condition[] = [{ id: 'landing', type: 'path', value: '/pricing' }, { id: 'signup', type: 'event', value: 'signup_started' }, { id: 'complete', type: 'event', value: 'signup_completed' }];
const suppliedCounts = [100, 40, 10];
const suppliedPrevious = ['Not applicable: entry step', '40%', '25%'];
const suppliedOverall = ['100%', '40%', '10%'];

export default function OrderedFunnelExample() {
  const id = useId();
  const [steps, setSteps] = useState(initialSteps);
  const [name, setName] = useState('Store signup');
  const [windowMinutes, setWindowMinutes] = useState(30);
  const [range, setRange] = useState('2026-10-12');
  const [saved, setSaved] = useState({ name: 'Store signup', steps: initialSteps, windowMinutes: 30, range: '2026-10-12' });
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState('draft');
  const [selected, setSelected] = useState('');
  const [scenario, setScenario] = useState('ready');
  const invalid = !name.trim() || steps.length < 2 || steps.some(step => !step.value || (step.type === 'path' && (!step.value.startsWith('/') || /[?#]/.test(step.value)))) || !Number.isInteger(windowMinutes) || windowMinutes < 1 || windowMinutes > 1440 || !range;
  function move(index: number, target: number) {
    if (target < 0 || target >= steps.length) return;
    const next = [...steps]; [next[index], next[target]] = [next[target], next[index]]; setSteps(next); setDirty(true);
  }
  const missing = result === 'unavailable' || result === 'expired';
  const selectedIndex = saved.steps.findIndex(step => step.id === selected);
  return <><EditorTemplate title="Edit an ordered funnel" description="Synthetic saved funnel · no identity or conversion calculations run here" scope="Workspace North · demo-store · UTC" footer={<><Button disabled={invalid} onClick={() => { setSaved({ name, steps: steps.map(step => ({ ...step })), windowMinutes, range }); setDirty(false); setResult('draft'); setSelected(''); }}>Save local funnel</Button><Button variant="secondary" disabled={dirty || invalid} onClick={() => setResult(scenario)}>Run saved funnel</Button></>}>
    <Field label="Funnel name" htmlFor={`${id}-name`}><Input value={name} onChange={event => { setName(event.target.value); setDirty(true); }} /></Field>
    <Field label="Range start draft" htmlFor={`${id}-range`}><Input type="date" value={range} onChange={event => { setRange(event.target.value); setDirty(true); }} /></Field>
    <Field label="Window between consecutive matched steps (minutes)" htmlFor={`${id}-window`} error={!Number.isInteger(windowMinutes) || windowMinutes < 1 || windowMinutes > 1440 ? 'Use 1–1440 whole minutes.' : undefined}><Input type="number" min={1} max={1440} value={Number.isFinite(windowMinutes) ? windowMinutes : ''} onChange={event => { setWindowMinutes(event.target.valueAsNumber); setDirty(true); }} /></Field>
    <ol>{steps.map((step, index) => <li key={step.id}>
      <Field label={`Step ${index + 1} condition type`} htmlFor={`${id}-type-${step.id}`}><Select value={step.type} onChange={event => { setSteps(steps.map(item => item.id === step.id ? { ...item, type: event.target.value as Condition['type'] } : item)); setDirty(true); }}><option value="path">Page path</option><option value="event">Custom event</option></Select></Field>
      <Field label={`Step ${index + 1} exact match`} htmlFor={`${id}-value-${step.id}`}><Input value={step.value} onChange={event => { setSteps(steps.map(item => item.id === step.id ? { ...item, value: event.target.value } : item)); setDirty(true); }} /></Field>
      <Button variant="ghost" disabled={index === 0} aria-label={`Move step ${index + 1} earlier`} onClick={() => move(index, index - 1)}>Move earlier</Button><Button variant="ghost" disabled={index === steps.length - 1} aria-label={`Move step ${index + 1} later`} onClick={() => move(index, index + 1)}>Move later</Button>
    </li>)}</ol>
    {invalid && <Alert title="Check funnel draft" tone="warning">Provide a name, two valid literal conditions, dates and a valid window. The application performs authoritative schema validation.</Alert>}
    {dirty && <p role="status">Unsaved edits. Existing results keep the last saved definition until you save and run.</p>}
    <Field label="Next local result" htmlFor={`${id}-scenario`}><Select value={scenario} onChange={event => setScenario(event.target.value)}>{['ready', 'no-entrants', 'zero-completions', 'incomplete', 'unavailable', 'expired'].map(value => <option key={value}>{value}</option>)}</Select></Field>
  </EditorTemplate>
  <section aria-label="Saved funnel result">
    <FunnelBreakdown label={saved.name} countLabel="Estimated visitors" context={<><p>Saved ordered steps · {saved.windowMinutes} minute window between consecutive matched steps · seven-day range starting {saved.range} · UTC.</p><p>Native ordered semantics remain app-owned. The app supplies all counts and both denominators; no Any order or Exact order mode is imported.</p></>} steps={result === 'draft' ? [] : saved.steps.map((step, index) => ({ id: step.id, label: `${index + 1}. ${step.type} equals ${step.value}`, count: missing ? null : result === 'no-entrants' || result === 'zero-completions' && index === saved.steps.length - 1 ? 0 : suppliedCounts[index], reason: missing ? 'The retained funnel evidence is unavailable.' : undefined, detail: <><p>From previous: {missing || result === 'incomplete' || result === 'no-entrants' ? 'Unavailable: no complete denominator' : result === 'zero-completions' && index === saved.steps.length - 1 ? '0%' : suppliedPrevious[index]}</p><p>Overall: {missing || result === 'incomplete' || result === 'no-entrants' ? 'Unavailable: no complete entry denominator' : result === 'zero-completions' && index === saved.steps.length - 1 ? '0%' : suppliedOverall[index]}</p></> }))} selectedId={selected} onSelect={setSelected} notice={result === 'incomplete' ? 'Observation window incomplete; completion counts may change.' : result === 'draft' ? 'Saved draft has not been run.' : result === 'expired' ? 'Underlying evidence expired; counts are unavailable.' : undefined} />
    {selectedIndex >= 0 && <Alert title="Inspect selected step witness">Saved condition: {saved.steps[selectedIndex].value}. {missing ? 'No retained witness is available.' : result === 'no-entrants' || result === 'zero-completions' && selectedIndex === saved.steps.length - 1 ? 'No matching retained witness in this fixture.' : 'Synthetic matched observation · 14 October 2026, 09:02 UTC. Timestamp ties do not prove client action order.'}</Alert>}
  </section></>;
}
