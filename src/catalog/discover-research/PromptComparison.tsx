'use client';

import { useId, useState } from 'react';
import { Alert, Button, ComparisonMetric, DataTable, FlowSection, Field, OperationResults, RunCostSummary, Select, Textarea } from '../../lib';

type PromptVersion = { text: string; version: number };

export default function PromptComparison() {
  const id = useId();
  const [draft, setDraft] = useState('Which privacy analytics tools suit a small publisher?');
  const [version, setVersion] = useState<PromptVersion>({ text: draft, version: 1 });
  const [quoted, setQuoted] = useState<PromptVersion | null>(null);
  const [executed, setExecuted] = useState<PromptVersion | null>(null);
  const [state, setState] = useState('Draft');
  const [outcome, setOutcome] = useState('Partial providers');
  const complete = state === 'Partial providers' || state === 'Completed';
  const dirty = draft !== version.text;
  const executionLocked = state === 'Collecting' || state === 'Uncertain charge';
  return <FlowSection title="Version a prompt and compare executions" description="Synthetic Atlas prompt study · API execution method · UAE · English" scope={<p>One prompt × two supported model slots × one market = two planned checks. An API execution does not prove an observed consumer-interface answer.</p>}>
    <Field label="Prompt draft" htmlFor={`${id}-prompt`}><Textarea value={draft} maxLength={2000} onChange={e => setDraft(e.target.value)} /></Field>
    <div className="t98-form-actions"><Button disabled={!draft.trim() || !dirty || executionLocked} onClick={() => { setVersion({ text: draft, version: version.version + 1 }); setState('Draft'); }}>Save local prompt version</Button></div><p>Authored version {version.version}: {version.text}</p>{dirty && <Alert title="Unexecuted draft changes">{executionLocked ? 'Keep editing locally; save another version after the original execution is resolved.' : 'Save a version before quoting this wording.'} Existing execution snapshots retain their original version.</Alert>}
    <Field label="Local execution outcome" htmlFor={`${id}-outcome`}><Select value={outcome} disabled={state === 'Collecting'} onChange={e => setOutcome(e.target.value)}>{['Partial providers', 'Completed', 'Uncertain charge', 'Quota exhausted', 'Unsupported engine'].map(s => <option key={s}>{s}</option>)}</Select></Field>
    <div className="t98-form-actions"><Button disabled={dirty || state === 'Collecting' || state === 'Uncertain charge'} onClick={() => { setQuoted({ ...version }); setState('Review'); }}>Review local execution quote</Button></div>
    {quoted && state !== 'Draft' && <RunCostSummary state={state === 'Review' ? 'quoted' : state === 'Collecting' ? 'pending' : state === 'Uncertain charge' ? 'uncertain' : state === 'Quota exhausted' || state === 'Unsupported engine' ? 'blocked' : 'settled'} scope={`Prompt v${quoted.version} · ${quoted.text} · model A + model B · UAE · English`} units="2 planned API executions; no automatic overages" estimatedPrice="US$0.040000 · synthetic estimate" settledPrice={complete ? 'US$0.017000 · synthetic receipt' : undefined} receipt={executed && state !== 'Review' ? 'demo-prompt-request-01 · original execution receipt' : undefined} quoteExpiryLabel="Five-minute application quote; no real quote or dispatch here" actions={state === 'Review' ? <><Button onClick={() => { setExecuted({ ...quoted }); setState('Collecting'); }}>Run approved local version</Button><Button variant="secondary" onClick={() => setState('Draft')}>Cancel local review</Button></> : state === 'Collecting' ? <Button onClick={() => setState(outcome)}>Read local execution receipts</Button> : state === 'Uncertain charge' ? <Button onClick={() => setState('Reconciled receipt only')}>Inspect original charge receipt</Button> : undefined} />}
    {state === 'Reconciled receipt only' && <Alert title="Receipt inspected; answers unavailable">No lost answer is reconstructed and no paid request repeats. Another attempt needs an explicit quote.</Alert>}
    {(state === 'Quota exhausted' || state === 'Unsupported engine') && <Alert title={state}>No fallback model or overage starts. The app supplies eligibility and confirmed charge status.</Alert>}
    {executed && <p>Execution snapshot: prompt v{executed.version} · {executed.text} · 18 October 2026. New authored versions do not rewrite this snapshot.</p>}
    {complete && <>
      <ComparisonMetric label="Brand mentioned in observed API answers" current={{ label: `Prompt v${executed?.version} observed answer set`, range: '18 October 2026 · UAE · English', value: state === 'Partial providers' ? '1 / 1 observed answer' : '1 / 2 observed answers', partial: state === 'Partial providers', source: 'Synthetic API executions', detail: 'Planned denominator: 2 model checks. Observed denominator excludes unavailable answers; planned coverage remains separate.' }} baseline={{ label: 'Prior prompt set v0', range: '11 October 2026', value: null, unavailableReason: 'Prompt wording and provider set differ; no compatible baseline.' }} change={{ label: 'Compatible change', value: null, reason: 'Changed prompt sets cannot establish a like-for-like change.' }} />
      <OperationResults title="Individual execution receipts" items={[{ id: 'a', target: 'Model A · prompt snapshot', status: 'observed', receipt: 'demo-api-answer-a', detail: 'One retained synthetic API answer; Atlas mentioned.' }, { id: 'b', target: 'Model B · prompt snapshot', status: state === 'Partial providers' ? 'error' : 'observed', receipt: 'demo-api-answer-b', detail: state === 'Partial providers' ? 'Provider result failed; no answer evidence and no automatic retry.' : 'One retained synthetic API answer; Atlas not mentioned.' }]} />
      <DataTable caption="Accessible synthetic coverage table" rows={[{ id: 'scope', planned: 2, observed: state === 'Partial providers' ? 1 : 2, mentioned: 1 }]} rowKey={r => r.id} searchable={false} columns={[{ key: 'planned', header: 'Planned executions' }, { key: 'observed', header: 'Observed answers' }, { key: 'mentioned', header: 'Observed answers mentioning brand' }]} />
    </>}

  </FlowSection>;
}
