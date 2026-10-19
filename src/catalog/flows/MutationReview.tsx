'use client';

import { useId, useState } from 'react';
import { Alert, Badge, Button, Card, Dialog, Field, Input, Select } from '../../lib';

type Outcome = 'confirmed' | 'error' | 'unknown';
type Stage = 'draft' | 'pending' | Outcome;

export default function MutationReview() {
  const id = useId();
  const [draft, setDraft] = useState('CRM sandbox · Operations');
  const [submitted, setSubmitted] = useState('');
  const [scenario, setScenario] = useState<Outcome>('confirmed');
  const [stage, setStage] = useState<Stage>('draft');
  const [review, setReview] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [reconciliation, setReconciliation] = useState('unknown');
  const [reconciled, setReconciled] = useState(false);
  const locked = stage === 'pending' || stage === 'unknown' || stage === 'confirmed';
  const receipt = `demo-mutation-${String(attempt).padStart(3, '0')}`;

  function confirm() {
    if (locked || !draft.trim() || draft.trim() === 'CRM sandbox') return;
    setSubmitted(draft.trim());
    setAttempt(value => value + 1);
    setReconciled(false);
    setReconciliation('unknown');
    setStage('pending');
    setReview(false);
  }

  function reconcile() {
    setReconciled(true);
    if (reconciliation === 'confirmed') setStage('confirmed');
    if (reconciliation === 'not-applied') setStage('error');
  }

  return <div className="t98-settings-fields">
    <Alert title="Local simulation" tone="info">
      Rename a synthetic connection. No request is sent. Choose a response, review the change, then simulate its outcome.
    </Alert>
    <Card title="Connection display name" description="Workspace: Operations · Project: Internal tools"
      actions={<Badge tone={stage === 'confirmed' ? 'success' : stage === 'error' ? 'danger' : stage === 'unknown' ? 'warning' : 'neutral'}>{stage === 'error' ? 'Not applied' : stage}</Badge>}>
      <div className="t98-settings-fields">
        <p><strong>Resource:</strong> CRM sandbox <code>connect-demo-42</code></p>
        <Field label="New display name" htmlFor={`${id}-name`} description="Your draft is retained if the simulated change fails or the review is closed.">
          <Input value={draft} maxLength={80} disabled={locked} onChange={event => setDraft(event.target.value)} />
        </Field>
        <Field label="Demo response for the next attempt" htmlFor={`${id}-scenario`}>
          <Select value={scenario} disabled={locked} onChange={event => setScenario(event.target.value as Outcome)}>
            <option value="confirmed">Confirmed applied</option>
            <option value="error">Confirmed not applied</option>
            <option value="unknown">Outcome unknown</option>
          </Select>
        </Field>
        {(stage === 'draft' || stage === 'error' || stage === 'pending') && <Button disabled={stage !== 'pending' && (!draft.trim() || draft.trim() === 'CRM sandbox')} onClick={() => stage === 'pending' ? setStage(scenario) : setReview(true)}>
          {stage === 'pending' ? 'Simulate response' : stage === 'error' ? 'Review retry' : 'Review change'}
        </Button>}
        {stage !== 'draft' && <p><strong>Demo receipt:</strong> <code>{receipt}</code><br />Requested name: {submitted}</p>}
        {stage === 'pending' && <>
          <Alert title="Waiting for a simulated response" tone="info">The requested rename is pending. Its outcome has not been confirmed.</Alert>
        </>}
        {stage === 'error' && <Alert title="Confirmed not applied" tone="danger">
          {reconciled ? 'Simulated reconciliation found that this change was not applied.' : 'The simulated response confirms this change was not applied.'} Your draft is retained. Review it before trying again.
        </Alert>}
        {stage === 'unknown' && <>
          <Alert title="Outcome unknown — reconcile before repeating" tone="warning">
            A response was lost. The connection may already have been renamed. Keep receipt {receipt} while checking the outcome.
            {reconciled && <p>The latest simulated check is still inconclusive. No repeat action is available.</p>}
          </Alert>
          <Field label="Demo reconciliation result" htmlFor={`${id}-reconciliation`}>
            <Select value={reconciliation} onChange={event => setReconciliation(event.target.value)}>
              <option value="unknown">Still unknown</option>
              <option value="confirmed">Confirmed applied</option>
              <option value="not-applied">Confirmed not applied</option>
            </Select>
          </Field>
          <Button variant="secondary" onClick={reconcile}>Simulate reconciliation</Button>
        </>}
        {stage === 'confirmed' && <>
          <Alert title="Rename confirmed in this demo" tone="success">
            {reconciled ? 'Simulated reconciliation confirms' : 'The simulated response confirms'} that connect-demo-42 is now named “{submitted}”.
          </Alert>
          <Button variant="secondary" onClick={() => { setStage('draft'); setSubmitted(''); setReconciled(false); }}>Start another demo</Button>
        </>}
      </div>
    </Card>
    <Dialog open={review} onOpenChange={setReview} title="Review connection rename"
      description="Confirm this exact resource, scope and change in the local simulation."
      footer={<><Button variant="secondary" autoFocus onClick={() => setReview(false)}>Cancel</Button><Button onClick={confirm}>Confirm rename</Button></>}>
      <dl>
        <dt>Resource</dt><dd>CRM sandbox · connect-demo-42</dd>
        <dt>Workspace / project</dt><dd>Operations / Internal tools</dd>
        <dt>Change</dt><dd>Display name: “CRM sandbox” → “{draft.trim()}”</dd>
      </dl>
      <p>This demo changes the connection's display name. Closing this review retains your draft.</p>
    </Dialog>
  </div>;
}
