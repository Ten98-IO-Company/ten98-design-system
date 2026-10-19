'use client';

import { useId, useState } from 'react';
import { Alert, Button, DataTable, EditorTemplate, Field, Input, Select } from '../../lib';

const initial = { model: 'first-click', kind: 'custom', conversion: 'signup_completed', dimension: 'utm_source' };

export default function ObservedAttributionExample() {
  const id = useId();
  const [draft, setDraft] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const [scenario, setScenario] = useState('ready');
  const [state, setState] = useState('ready');
  const [pending, setPending] = useState<typeof initial | null>(null);
  const [selected, setSelected] = useState('');
  const unavailable = state === 'unavailable';
  const noSource = state === 'unattributed';
  const zero = state === 'no-conversions';
  const sourceValue = applied.dimension === 'Paid ads' ? 'Not recorded' : applied.dimension === 'utm_campaign' ? 'autumn-launch' : applied.model === 'first-click' ? 'newsletter' : 'partner';
  const invalid = !draft.conversion || (draft.kind === 'pageview' && (!draft.conversion.startsWith('/') || /[?#]/.test(draft.conversion)));
  return <EditorTemplate title="Inspect observed attribution" description="Synthetic first/last observed touch reports; viewing performs no advertising action." scope="Workspace North · project demo-store · 12–18 October 2026 · UTC" actions={<Button disabled={invalid || pending !== null} onClick={() => setPending({ ...draft })}>Run attribution report</Button>} preview={<section aria-label="Applied attribution report">
    <h3>Applied model and conversion</h3><p>{applied.model} · {applied.kind} exactly {applied.conversion} · dimension {applied.dimension}.</p>
    <p>First: earliest retained observation at or before the first matching conversion. Last: latest observation strictly before the latest matching conversion. Both use these selected dates; neither proves first-ever acquisition or causality.</p>
    <p>Observed conversion events: {unavailable ? 'Unavailable' : zero ? 0 : 26}. Estimated converted visitor keys: {unavailable ? 'Unavailable: native keys missing' : zero ? 0 : 20}.</p>
    {noSource && <Alert title="Conversions exist without attributed source">Conversion events are observed; no eligible selected touch supplies the requested source value. Missing source is not Direct or unpaid traffic.</Alert>}
    {state === 'partial' && <Alert title="Incomplete evidence">Retained history or identity is incomplete. Supplied source shares are unavailable, not reliable lower bounds.</Alert>}
    {state === 'stale' && <Alert title="Stale attribution">Last snapshot 19 October 2026, 09:20 UTC; current collection settings cannot establish missing historical traffic.</Alert>}
    {unavailable && <Alert title="Attribution unavailable">Matching events may be observed while source/key evidence is unavailable. No zero-source report is inferred.</Alert>}
    <DataTable caption={`Observed selected-touch values · ${applied.dimension} · ${applied.model}`} rows={unavailable || zero ? [] : [{ id: 'source', label: noSource ? 'Not recorded' : sourceValue, keys: 20, share: state === 'partial' ? 'Unavailable: incomplete selection' : '100% of 20 observed converted keys' }]} rowKey={row => row.id} columns={[{ key: 'label', header: applied.dimension, render: row => <Button variant="ghost" onClick={() => setSelected(row.label)}>{row.label}</Button> }, { key: 'keys', header: 'Estimated converted keys', render: row => row.keys }, { key: 'share', header: 'Observed share (supplied)', render: row => row.share }]} emptyTitle={zero ? 'No conversion observations' : 'Attribution evidence unavailable'} />
    <p>Top 20 named values per dimension; this fixture displays one value. Full denominators include missing/empty values. Capture coverage is unknown.</p>
    {selected && <Alert title="Selected source evidence">{selected} · {applied.model}. UTM values are independent fields. They do not establish a paid ad platform; Paid ads uses the app supplied closed label only. No raw click identifier is shown.</Alert>}
  </section>}>
    <Field label="Observed attribution model draft" htmlFor={`${id}-model`}><Select value={draft.model} onChange={event => setDraft({ ...draft, model: event.target.value })}><option value="first-click">First observed in selected dates</option><option value="last-click">Last observed before latest conversion</option></Select></Field>
    <Field label="Conversion condition type" htmlFor={`${id}-kind`}><Select value={draft.kind} onChange={event => setDraft({ ...draft, kind: event.target.value })}><option value="custom">Custom event</option><option value="pageview">Page path</option></Select></Field>
    <Field label="Exact conversion value" htmlFor={`${id}-conversion`} error={invalid ? 'Provide a literal event name or valid page path for this condition.' : undefined}><Input value={draft.conversion} onChange={event => setDraft({ ...draft, conversion: event.target.value })} /></Field>
    <Field label="Acquisition dimension draft" htmlFor={`${id}-dimension`}><Select value={draft.dimension} onChange={event => setDraft({ ...draft, dimension: event.target.value })}><option value="utm_source">utm_source</option><option value="utm_campaign">utm_campaign</option><option value="Paid ads">Paid ads</option></Select></Field>
    <Field label="Next local report outcome" htmlFor={`${id}-scenario`}><Select value={scenario} onChange={event => setScenario(event.target.value)}>{['ready', 'no-conversions', 'unattributed', 'partial', 'stale', 'unavailable'].map(value => <option key={value}>{value}</option>)}</Select></Field>
    {JSON.stringify(draft) !== JSON.stringify(applied) && <p role="status">Draft changed. Applied model and conversion stay visible beside the previous report.</p>}
    {pending && <Alert title="Attribution report running">Existing result retains its applied model.<Button variant="secondary" onClick={() => { setApplied(pending); setState(scenario); setSelected(''); setPending(null); }}>Complete local attribution</Button><Button variant="ghost" onClick={() => setPending(null)}>Cancel report</Button></Alert>}
    <details><summary>Measurement and collection limits</summary><p>One selected touch per eligible converted key; conversion filters do not also filter the touch pool. Consent, monthly key rotation, retention and missing capture affect interpretation. Model assignment is descriptive. Paid campaign controls belong to Campaign.</p></details>
  </EditorTemplate>;
}
