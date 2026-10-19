'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { Alert, Badge, Button, CopyButton, EditorTemplate, Field, Input, ResourceCard, Select, Stepper } from '../../lib';

/** Catalogue recipe: local state only; no authorization, requests or records. */
export default function ConnectionSetup() {
  const id = useId();
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [configured, setConfigured] = useState<{ name: string; endpoint: string } | null>(null);
  const [phase, setPhase] = useState<'setup' | 'configured' | 'pending' | 'confirmed' | 'failed'>('setup');
  const [outcome, setOutcome] = useState('success');
  const [lastConfirmed, setLastConfirmed] = useState<{ name: string; endpoint: string; at: string } | null>(null);
  const pending = phase === 'pending';

  useEffect(() => {
    if (!pending || !configured) return;
    const timer = window.setTimeout(() => {
      if (outcome === 'success') {
        setLastConfirmed({ ...configured, at: new Date().toISOString() });
        setPhase('confirmed');
      } else setPhase('failed');
    }, 800);
    return () => window.clearTimeout(timer);
  }, [pending, configured, outcome]);

  function configure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfigured({ name: name.trim(), endpoint: endpoint.trim() });
    setPhase('configured');
  }

  function edit() {
    setConfigured(null);
    setPhase('setup');
  }

  return <EditorTemplate title="Connection setup"
    scope={<p>Scope: Catalogue sandbox. This synthetic example stores configuration in this page only.</p>}
    steps={<Stepper steps={['Configure endpoint', 'Simulate verification', 'Observe synthetic event']}
      current={phase === 'setup' ? 0 : phase === 'confirmed' ? 3 : 1} />}>
    <div className="t98-settings-fields">
    <form onSubmit={configure} className="t98-settings-fields">
      <h2>Configure endpoint</h2>
      <Field label="Connection name (required)" htmlFor={`${id}-name`} description="Use a meaningful non-blank name. Native browser validation checks this form.">
        <Input name="connectionName" required pattern=".*\S.*" maxLength={80} value={name} disabled={pending}
          placeholder="Example sandbox" onChange={event => { setName(event.target.value); edit(); }} />
      </Field>
      <Field label="Endpoint URL (required)" htmlFor={`${id}-endpoint`} description="Enter an HTTP or HTTPS URL. No request will be sent to it.">
        <Input name="endpoint" type="url" required pattern="https?://.+" value={endpoint} disabled={pending}
          placeholder="https://example.test/events" onChange={event => { setEndpoint(event.target.value); edit(); }} />
      </Field>
      <div><Button type="submit" variant="secondary" disabled={pending}>Configure locally</Button></div>
    </form>
    <ResourceCard title={configured?.name ?? 'No configured connection'}
      description={configured?.endpoint ?? 'Enter the required fields and configure the endpoint to continue.'}
      status={<Badge tone={phase === 'confirmed' ? 'success' : phase === 'failed' ? 'danger' : 'neutral'}>
        {phase === 'setup' ? 'Setup required' : phase === 'configured' ? 'Configured · unverified' :
          phase === 'pending' ? 'Simulation pending' : phase === 'failed' ? 'Simulation failed' : 'Synthetic event observed'}
      </Badge>}
      actions={configured && <CopyButton value={JSON.stringify({ scope: 'catalogue-sandbox', ...configured }, null, 2)} label="Copy demo configuration" />}>
      <p>Copying configuration does not verify the endpoint or create a connection.</p>
      {configured && <div style={{ display: 'grid', gap: 'var(--t98-space-3)' }}>
        <Field label="Next simulation outcome" htmlFor={`${id}-outcome`} description="Demo control: choose the local result before simulating verification.">
          <Select value={outcome} disabled={pending} onChange={event => setOutcome(event.target.value)}>
            <option value="success">Synthetic event observed</option>
            <option value="failure">Synthetic verification failure</option>
          </Select>
        </Field>
        <div><Button loading={pending} onClick={() => setPhase('pending')}>
          {pending ? 'Simulating verification…' : phase === 'failed' ? 'Retry simulated verification' : 'Simulate verification'}
        </Button></div>
      </div>}
    </ResourceCard>
    {pending && <Alert title="Waiting for a synthetic event">The local simulation will finish shortly. No provider is being contacted.</Alert>}
    {phase === 'configured' && <Alert title="Configured locally; verification pending">Run the simulation explicitly to observe a synthetic result.</Alert>}
    {phase === 'failed' && <Alert tone="danger" title="Simulated verification failed">Your fields are preserved. Choose an outcome and retry the local simulation; retry creates no backend records.</Alert>}
    {phase === 'confirmed' && <Alert tone="success" title="Synthetic event observed">This confirms only the chosen demo outcome. Real verification requires application-owned evidence.</Alert>}
    {lastConfirmed && <p>Last confirmed synthetic event: <time dateTime={lastConfirmed.at}>{lastConfirmed.at}</time> for {lastConfirmed.name} ({lastConfirmed.endpoint}).
      {phase !== 'confirmed' && ' This is historical demo evidence, not current verified health.'}
    </p>}
    </div>
  </EditorTemplate>;
}
