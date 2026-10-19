'use client';

import { useId, useState } from 'react';
import { Alert, Badge, Button, Card, Checkbox, Dialog, Field, Input, MetricCard, OperationResults, OverviewTemplate, ReviewSummary, Select } from '../../lib';

export default function InspectPaidPerformance() {
  const id = useId();
  const [from, setFrom] = useState('2026-10-12');
  const [to, setTo] = useState('2026-10-18');
  const [applied, setApplied] = useState('12–18 October 2026');
  const [budget, setBudget] = useState('120');
  const [current, setCurrent] = useState('100');
  const [shared, setShared] = useState(false);
  const [stage, setStage] = useState('draft');
  const [review, setReview] = useState(false);
  const [outcome, setOutcome] = useState('unknown');
  const [job, setJob] = useState('none');
  const [jobRange, setJobRange] = useState('');
  const [stale, setStale] = useState(false);
  const [error, setError] = useState('');
  const locked = ['pending', 'unknown', 'confirmed'].includes(stage);
  const valid = Number.isFinite(Number(budget)) && Number(budget) > 0 && Number(budget) !== Number(current);
  const csv = `account,campaign,requested_range,retained_metric_range,timezone,as_of,spend_aed,conversions\ndemo-account-101,demo-campaign-7,${jobRange},2026-10-12–2026-10-18,Asia/Dubai,2026-10-19T08:00:00Z,420,unavailable\n`;
  return <OverviewTemplate title="Inspect performance and paid changes" description="Local reference · one synthetic campaign. All numbers and job references are fixtures; no provider or report service is called." scope="Studio / Dubai launch · demo-account-101 · AED · Asia/Dubai"
    filters={<><Field htmlFor={`${id}-from`} label="Report start date"><Input type="date" value={from} onChange={event => setFrom(event.target.value)} /></Field><Field htmlFor={`${id}-to`} label="Report end date"><Input type="date" value={to} onChange={event => setTo(event.target.value)} /></Field><Button disabled={!from || !to || from > to} onClick={() => { setApplied(`${from}–${to}`); setStale(true); }}>Apply date scope · retain stale snapshot</Button></>}
    metrics={<><MetricCard label="Spend · AED · last retained snapshot" value="420.00" /><MetricCard label="Conversions · provider collection incomplete" value="Unavailable" /><MetricCard label="Clicks · measured fixture" value="84" /></>}>
    <Alert title={stale ? 'Previous snapshot retained · requested range changed' : 'Synthetic performance snapshot'} tone={stale ? 'warning' : 'info'}>Requested range: {applied}. Displayed retained metrics cover 12–18 October 2026, as of 19 October 2026 at 08:00 UTC. Attribution: provider-reported click metrics. Unavailable conversion coverage is not zero.</Alert>
    <Card title="Dubai Search launch · demo-campaign-7" description="Selection: exactly 1 campaign. No bulk reallocation.">
      <p>Budget owner: {shared ? 'Shared budget · allocation editing unavailable' : 'This campaign · daily allocation'} · current AED {current} daily · revision demo-r17</p>
      <Checkbox label="Simulate shared / unreadable budget ownership" checked={shared} disabled={locked} onChange={event => { setShared(event.target.checked); setStage('draft'); }} />
      {shared && <Alert title="Allocation edit unavailable">The app must resolve the shared budget owner and permission before offering an edit.</Alert>}
      <Field htmlFor={`${id}-budget`} label="Proposed daily budget · AED" error={error || undefined}><Input type="number" min="0.01" step="0.01" value={budget} disabled={locked || shared} onChange={event => { setBudget(event.target.value); setStage('draft'); setError(''); }} /></Field>
      <Field htmlFor={`${id}-outcome`} label="Simulated paid-change result"><Select value={outcome} disabled={locked} onChange={event => setOutcome(event.target.value)}><option value="unknown">Unknown · reconcile before repeat</option><option value="confirmed">Confirmed applied</option><option value="error">Confirmed not applied</option></Select></Field>
      <Button disabled={locked || shared} onClick={() => { if (!valid) { setError('Enter a positive finite daily amount different from the current budget.'); return; } setReview(true); }}>Review change to 1 campaign</Button>
      {stage === 'pending' && <Button variant="secondary" onClick={() => { setStage(outcome); if (outcome === 'confirmed') setCurrent(budget); }}>Simulate paid-change response</Button>}
      {stage !== 'draft' && <OperationResults title="Budget operation" items={[{ id: 'budget-1', target: 'demo-campaign-7 · AED daily budget', status: stage === 'pending' ? 'pending' : stage === 'unknown' ? 'unknown' : stage === 'error' ? 'error' : 'confirmed', receipt: 'demo-budget-change-001 · requested revision demo-r17', detail: stage === 'confirmed' ? `Synthetic current readback: AED ${current} daily.` : undefined }]} />}
      {stage === 'unknown' && <Alert title="Outcome unknown · repeat blocked" tone="warning">Inspect the same receipt and current provider revision first.<Button variant="secondary" onClick={() => { setCurrent(budget); setStage('confirmed'); }}>Simulate reconciliation: change found applied</Button><Button variant="secondary" onClick={() => setStage('error')}>Simulate reconciliation: confirmed not applied</Button></Alert>}
      {stage === 'error' && <Button variant="secondary" onClick={() => setStage('draft')}>Review retained draft again</Button>}
    </Card>
    <Card title="Requested report" description={`Job scope: demo-account-101 · ${jobRange || applied} · Asia/Dubai · bounded to 1 synthetic campaign.`} actions={<Badge>{job === 'none' ? 'Not requested' : job}</Badge>}>
      {job === 'none' && <Button onClick={() => { setJobRange(applied); setJob('pending'); }}>Request local report job</Button>}
      {job !== 'none' && <p>Local mounted receipt: demo-report-001. Real jobs and scope snapshots must be persisted by the app.</p>}
      {job === 'pending' && <Button variant="secondary" onClick={() => setJob('ready')}>Simulate report ready</Button>}
      {job === 'ready' && <><p><a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="synthetic-campaign-report.csv">Download bounded synthetic CSV · 1 row</a></p><Button variant="secondary" onClick={() => setJob('download-failed')}>Simulate download failure</Button></>}
      {job === 'download-failed' && <Alert title="Report ready; download failed" tone="warning">Keep demo-report-001. Retry retrieval without requesting another report.<Button variant="secondary" onClick={() => setJob('ready')}>Retry local download retrieval</Button></Alert>}
    </Card>
    <Dialog open={review} onOpenChange={setReview} title="Review paid change" footer={<><Button variant="secondary" autoFocus onClick={() => setReview(false)}>Keep draft</Button><Button onClick={() => { if (!valid || shared || locked) return; setStage('pending'); setReview(false); }}>Confirm local budget change</Button></>}>
      <ReviewSummary scope="Studio / Dubai launch · account demo-account-101 · 1 campaign" resource="Dubai Search launch · demo-campaign-7 · revision demo-r17" changes={[{ id: 'daily', label: 'Campaign-owned daily budget', before: `AED ${current} per day`, after: `AED ${budget} per day` }]} consequences="A real increase can permit additional spend. The app rechecks revision, immutable currency, ownership and permission before serializing the write. This demo sends nothing." />
    </Dialog>
  </OverviewTemplate>;
}
