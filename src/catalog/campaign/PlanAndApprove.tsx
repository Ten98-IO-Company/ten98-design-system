'use client';

import { useId, useState } from 'react';
import { Alert, Badge, Button, Card, DetailWorkspace, Dialog, Field, Input, FlowSection, PublishingAgenda, Select } from '../../lib';

export default function PlanAndApprove() {
  const id = useId();
  const [timezone, setTimezone] = useState('Asia/Dubai');
  const [date, setDate] = useState('2026-10-21');
  const [time, setTime] = useState('10:00');
  const [version, setVersion] = useState(1);
  const [approvedVersion, setApprovedVersion] = useState<number | null>(null);
  const [stage, setStage] = useState('draft');
  const [selected, setSelected] = useState(false);
  const [review, setReview] = useState(false);
  const [filter, setFilter] = useState('all');
  const [stale, setStale] = useState(false);
  const [reviewNote, setReviewNote] = useState('Confirm the event time with the studio team.');
  const instant = `${date}T${time}:00+04:00`;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time) && Number.isFinite(Date.parse(instant));
  const when = valid ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(new Date(instant)) : 'Date or time incomplete';
  const locked = stage === 'delivery-pending' || stage === 'delivered';
  function edit(nextDate: string, nextTime: string) { setDate(nextDate); setTime(nextTime); setVersion(current => current + 1); setStage('draft'); }
  const status = approvedVersion !== null && approvedVersion !== version ? 'Approval stale' : stage;
  const detail = <Card title={`Studio opening · version ${version}`} description="Exact destination: Studio Dubai · demo-ig-17">
    <p>Approval: {approvedVersion === version ? `Approved v${version}` : approvedVersion ? `Approved v${approvedVersion} is stale` : 'Not approved'} · Plan: {['planned', 'delivery-pending', 'delivered'].includes(stage) ? 'Planned locally' : 'Not planned'} · Delivery: {stage === 'delivered' ? 'Synthetic provider evidence received' : stage === 'delivery-pending' ? 'Pending receipt' : 'No delivery evidence'}</p>
    {stage === 'changes-requested' && <Alert title="Reviewer requested changes" tone="warning">{reviewNote}</Alert>}
    <Field htmlFor={`${id}-date`} label="Planned date · publishing timezone Asia/Dubai"><Input type="date" value={date} disabled={locked} onChange={event => edit(event.target.value, time)} /></Field>
    <Field htmlFor={`${id}-time`} label="Planned time · UTC+04:00"><Input type="time" value={time} disabled={locked} onChange={event => edit(date, event.target.value)} /></Field>
    <p>Submitted instant: <code>{valid ? instant : 'Incomplete'}</code>. Changing the display timezone changes only the agenda label.</p>
    <div className="t98-form-actions"><Button disabled={!valid || locked} onClick={() => setStage('review-requested')}>Request review of v{version}</Button>
      <Button variant="secondary" disabled={stage !== 'review-requested'} onClick={() => setReview(true)}>Review exact version</Button>
      <Button variant="secondary" disabled={approvedVersion !== version || stage !== 'approved' || !valid || locked} onClick={() => setStage('planned')}>Save approved local plan</Button>
      <Button variant="secondary" disabled={stage !== 'planned'} onClick={() => setStage('delivery-pending')}>Simulate schedule submission</Button>
      <Button variant="secondary" disabled={stage !== 'delivery-pending'} onClick={() => setStage('delivered')}>Simulate delivery evidence</Button>
    </div>
    {approvedVersion !== null && approvedVersion !== version && <Alert title="Review the changed version" tone="warning">A material time edit created v{version}. Request review again before planning. Overdue or missing approval does not auto-publish.</Alert>}
    {stage === 'planned' && <Alert title="Plan saved locally">A planned date is not a provider schedule. Submission and delivery need separate app-owned evidence.</Alert>}
  </Card>;
  return <FlowSection title="Plan and approve content" description="Local reference · one synthetic publishing item, no scheduler or calendar synchronization." scope={`Workspace Studio · Project Dubai launch · ${date || 'Unscheduled date'}`}>
    <div className="t98-feature-controls">{<>
      <Field htmlFor={`${id}-tz`} label="Calendar display timezone"><Select value={timezone} onChange={event => setTimezone(event.target.value)}><option value="Asia/Dubai">Asia/Dubai · UTC+04:00</option><option value="Europe/London">Europe/London</option><option value="UTC">UTC</option></Select></Field><Field htmlFor={`${id}-filter`} label="Approval filter"><Select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All items</option><option value="changes-requested">Changes requested · no matching items</option></Select></Field>
    </>}</div>
    <div className="t98-form-actions">{<Button variant="secondary" onClick={() => setStale(current => !current)}>{stale ? 'Simulate successful refresh' : 'Simulate stale calendar sync'}</Button>}</div>
    {stale && <Alert title="Calendar sync stale" tone="warning">Last successful synthetic sync: 19 October 2026, 08:00 UTC. Current item and edits remain visible.</Alert>}
    <DetailWorkspace label="Publishing workspace" listLabel="Agenda" detailLabel="Version and schedule" selected={selected} onBack={() => { setSelected(false); requestAnimationFrame(() => document.getElementById(`${id}-inspect`)?.focus()); }}
      list={<><PublishingAgenda label="Publishing agenda" scope="Studio / Dubai launch · exact account demo-ig-17" timezoneLabel={timezone} selectedId={selected ? 'post-1' : undefined} entries={filter === 'all' ? [{ id: 'post-1', title: 'Studio opening', when, dateTime: valid ? instant : undefined, status: <Badge>{status}</Badge>, details: `Version ${version} · planned instant only, no provider schedule` }] : []} emptyMessage={<>No items match “Changes requested”. <Button variant="secondary" onClick={() => setFilter('all')}>Clear approval filter</Button></>} />{filter === 'all' && <Button id={`${id}-inspect`} onClick={() => setSelected(true)}>Inspect Studio opening</Button>}</>}
      detail={detail} />
    <Dialog open={review} onOpenChange={setReview} title={`Review Studio opening v${version}`} description="Synthetic reviewer: Maya. Inspect the exact version, destination and submitted instant."
      footer={<><Button variant="secondary" autoFocus disabled={!reviewNote.trim()} onClick={() => { setStage('changes-requested'); setReview(false); }}>Request changes with note</Button><Button onClick={() => { setApprovedVersion(version); setStage('approved'); setReview(false); }}>Approve v{version} locally</Button></>}>
      <dl><dt>Destination</dt><dd>Studio Dubai · Instagram · demo-ig-17</dd><dt>Content</dt><dd>Meet our Dubai studio on 21 October.</dd><dt>Version</dt><dd>{version}</dd><dt>Due time / publishing timezone</dt><dd>{instant} · Asia/Dubai</dd></dl><p>Approval does not submit a schedule or establish delivery. The application validates permissions, revisions and ambiguous timezone inputs.</p>
      <Field htmlFor={`${id}-review-note`} label="Note required when requesting changes"><Input value={reviewNote} onChange={event => setReviewNote(event.target.value)} /></Field>
    </Dialog>

  </FlowSection>;
}
