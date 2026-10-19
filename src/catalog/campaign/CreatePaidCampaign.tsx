'use client';

import { useId, useState } from 'react';
import { Alert, Badge, Button, ContentPreview, Dialog, EditorTemplate, Field, Input, OperationResults, ReviewSummary, Select, SettingsSection, Stepper } from '../../lib';

export default function CreatePaidCampaign() {
  const id = useId();
  const [name, setName] = useState('Dubai studio · Search launch');
  const [budget, setBudget] = useState('100');
  const [headline, setHeadline] = useState('Visit our Dubai studio');
  const [stage, setStage] = useState('draft');
  const [review, setReview] = useState(false);
  const [activate, setActivate] = useState(false);
  const [outcome, setOutcome] = useState('paused');
  const [error, setError] = useState('');
  const amount = Number(budget);
  const locked = ['creating', 'unknown', 'paused', 'active'].includes(stage);
  function changed() { setStage('draft'); setError(''); }
  function validate() {
    if (!name.trim() || !headline.trim() || !Number.isFinite(amount) || amount <= 0) { setError('Enter a name, headline and a positive finite daily budget. These fixture checks do not replace provider preflight.'); return; }
    setError(''); setStage('validated');
  }
  return <EditorTemplate title="Create a paid campaign" description="Local reference · synthetic account, creative and receipts. No campaign is created and no money is spent." scope="Studio / Dubai launch · Google Ads demo-account-101 · AED"
    steps={<Stepper steps={['Settings', 'Local check', 'Create paused', 'Inspect readback', 'Activate explicitly']} current={stage === 'draft' ? 0 : stage === 'validated' ? 1 : ['creating', 'unknown', 'failed'].includes(stage) ? 2 : stage === 'paused' ? 3 : 4} />}
    actions={<Badge>{stage}</Badge>}
    feedback={<><Alert title="Keep native account settings">Fixture supports Search / website visits only. Currency AED and daily allocation belong to this account. The application retains its native form names, provider capability checks, budget math and creative approval.</Alert>{error && <Alert title="Local validation failed" tone="danger"><a href={`#${id}-budget`}>{error}</a></Alert>}</>}
    preview={<ContentPreview label="Search creative preview" destination="Studio · demo-account-101" provider="Google Ads" text={<><strong>{headline}</strong><p>studio.example · Dubai</p><p>Meet our studio team. Synthetic display text.</p></>} footer="Approximate layout. Local validation and activation do not establish provider approval, delivery or spend." />}>
    <SettingsSection title="Account and supported objective" description="One synthetic verified account; changing account capabilities requires an app-owned refresh.">
      <Field htmlFor={`${id}-account`} label="Verified account"><Select disabled={locked}><option>Studio · demo-account-101 · AED</option></Select></Field>
      <Field htmlFor={`${id}-objective`} label="Supported objective and type"><Select disabled={locked}><option>Website visits · Search</option></Select></Field>
      <Field htmlFor={`${id}-name`} label="Campaign name"><Input value={name} disabled={locked} onChange={event => { setName(event.target.value); changed(); }} /></Field>
      <p>Target: Dubai, United Arab Emirates · language English · manual CPC · keyword [dubai studio]. Synthetic supported configuration; other objectives are not implied.</p>
    </SettingsSection>
    <SettingsSection title="Creative and allocation" description="Daily budget, account currency AED. Lifetime, shared and campaign-total budgets are separate app contracts.">
      <Field htmlFor={`${id}-headline`} label="Headline"><Input value={headline} disabled={locked} onChange={event => { setHeadline(event.target.value); changed(); }} /></Field>
      <Field htmlFor={`${id}-budget`} label="Daily budget · AED" error={error || undefined}><Input type="number" min="0.01" step="0.01" value={budget} disabled={locked} onChange={event => { setBudget(event.target.value); changed(); }} /></Field>
      <Field htmlFor={`${id}-response`} label="Simulated creation response"><Select value={outcome} disabled={locked} onChange={event => setOutcome(event.target.value)}><option value="paused">Confirmed paused readback</option><option value="failed">Confirmed not created</option><option value="unknown">Response lost · outcome unknown</option></Select></Field>
      <div className="t98-form-actions"><Button disabled={locked} onClick={validate}>Validate settings locally</Button><Button variant="secondary" disabled={stage !== 'validated'} onClick={() => setReview(true)}>Review exact paused creation</Button></div>
    </SettingsSection>
    {stage !== 'draft' && stage !== 'validated' && <OperationResults title="Creation receipt and readback" items={[{ id: 'create-1', target: name, status: stage === 'creating' ? 'pending' : stage === 'unknown' ? 'unknown' : stage === 'failed' ? 'error' : 'confirmed', receipt: 'demo-create-ads-001', detail: stage === 'paused' ? 'Synthetic readback: PAUSED. Provider review unobserved. Activation is a separate action.' : stage === 'active' ? 'Synthetic readback: ENABLED. Delivery and spend remain unobserved.' : stage === 'failed' ? 'Synthetic response confirms no campaign was created. Draft retained.' : undefined }]} />}
    {stage === 'creating' && <Button onClick={() => setStage(outcome)}>Simulate creation response</Button>}
    {stage === 'unknown' && <Alert title="Inspect receipt before another creation" tone="warning">The campaign may already exist. No creation or activation action is available.<Button variant="secondary" onClick={() => setStage('paused')}>Simulate reconciliation: found paused campaign</Button></Alert>}
    {stage === 'failed' && <Button variant="secondary" onClick={() => setStage('draft')}>Return to retained draft</Button>}
    {stage === 'paused' && <Button onClick={() => setActivate(true)}>Review activation of paused campaign</Button>}
    <Dialog open={review} onOpenChange={setReview} title="Review exact outgoing settings" footer={<><Button variant="secondary" autoFocus onClick={() => setReview(false)}>Keep editing</Button><Button onClick={() => { if (stage !== 'validated') return; setStage('creating'); setReview(false); }}>Simulate create paused</Button></>}>
      <ReviewSummary scope="Studio / Dubai launch · demo-account-101" resource={name} changes={[{ id: 'status', label: 'Initial status', before: 'No campaign', after: 'PAUSED' }, { id: 'budget', label: 'Daily account budget', before: 'No allocation', after: `AED ${budget} per day` }, { id: 'type', label: 'Objective / targeting', before: 'No settings', after: 'Website visits / Search / Dubai / English / manual CPC' }, { id: 'creative', label: 'Creative / keyword', before: 'No ad', after: `${headline} · [dubai studio] · studio.example` }]} consequences="No activation is included. Provider preflight, current mapping, role, capability and creative approval remain application preconditions." />
    </Dialog>
    <Dialog open={activate} onOpenChange={setActivate} title="Activate this paused campaign?" description="Synthetic receipt demo-create-ads-001 has a confirmed paused readback. This is a separate consequential action in the real app."
      footer={<><Button variant="secondary" autoFocus onClick={() => setActivate(false)}>Leave paused</Button><Button onClick={() => { if (stage === 'paused') setStage('active'); setActivate(false); }}>Simulate explicit activation</Button></>}><p>{name} · demo-account-101 · AED {budget} daily. Activation permits the provider to serve ads subject to provider approval; it does not prove delivery.</p></Dialog>
  </EditorTemplate>;
}
