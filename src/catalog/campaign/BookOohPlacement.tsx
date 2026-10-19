'use client';

import { useId, useState } from 'react';
import { Alert, Badge, Button, Card, Checkbox, CollectionTemplate, Dialog, Field, Input, OperationResults, ReviewSummary, Select } from '../../lib';

const inventory = [{ key: 'face-marina', label: 'Dubai Marina · face demo-11' }, { key: 'face-creek', label: 'Dubai Creek · face demo-12' }];

export default function BookOohPlacement() {
  const id = useId();
  const [selected, setSelected] = useState(['face-marina']);
  const [from, setFrom] = useState('2026-10-21');
  const [to, setTo] = useState('2026-10-21');
  const [stage, setStage] = useState('draft');
  const [availability, setAvailability] = useState('available');
  const [result, setResult] = useState('');
  const [review, setReview] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [expired, setExpired] = useState(false);
  const [readback, setReadback] = useState('booked');
  const locked = ['booking-pending', 'unknown', 'booked', 'cancel-pending', 'cancelled'].includes(stage);
  const valid = selected.length > 0 && !!from && !!to && from <= to;
  function invalidate() { setStage('draft'); setResult(''); setExpired(false); }
  return <CollectionTemplate title="Plan and reconcile OOH placements" description="Local reference · synthetic authorized inventory and provider quote. No hold, booking, cancellation or charge is sent." scope="Studio / Dubai launch · Demo OOH provider · sandbox environment" selection={<p>{selected.length} authorized face(s) selected · 1 line item · full-day only · frequency 6 plays/hour</p>}>
    <Alert title="Quote belongs to the whole line item">AED 2,400 is a fixed synthetic provider quote for this exact proposal. It is not divided into per-screen prices. A selection or date change requires a new provider quote and availability check in the app.</Alert>
    <Card title="Authorized inventory · list selection" description="Keyboard-accessible alternative to an app-owned map. Availability below is a summary, not per-screen evidence.">
      {inventory.map(face => <Checkbox key={face.key} label={face.label} checked={selected.includes(face.key)} disabled={locked} onChange={event => { setSelected(current => event.target.checked ? [...current, face.key] : current.filter(value => value !== face.key)); invalidate(); }} />)}
      <Field htmlFor={`${id}-from`} label="Full-day start · Asia/Dubai"><Input type="date" value={from} disabled={locked} onChange={event => { setFrom(event.target.value); invalidate(); }} /></Field>
      <Field htmlFor={`${id}-to`} label="Full-day end · Asia/Dubai"><Input type="date" value={to} disabled={locked} onChange={event => { setTo(event.target.value); invalidate(); }} /></Field>
      <Button disabled={!valid || locked} onClick={() => { setStage('proposal'); setResult(''); }}>Save local proposal and fixture quote</Button>
    </Card>
    {stage !== 'draft' && <Card title="Whole-line-item quote · demo-quote-001" actions={<Badge tone={expired ? 'warning' : 'neutral'}>{expired ? 'Quote stale' : 'AED 2,400 · full line item'}</Badge>}>
      <p>Faces: {selected.map(key => `${inventory.find(face => face.key === key)?.label ?? key} (${key})`).join('; ')} · {from} through {to} · Asia/Dubai · frequency 6/hour · full-day. Quote excludes any claim of delivery or refund entitlement.</p>
      <Field htmlFor={`${id}-availability`} label="Simulated availability summary"><Select value={availability} disabled={locked} onChange={event => { setAvailability(event.target.value); setResult(''); }}><option value="available">Whole line item available</option><option value="partial">Partial · provider did not identify per-face availability</option><option value="unavailable">Whole line item unavailable</option></Select></Field>
      <div className="t98-form-actions"><Button disabled={locked || expired} onClick={() => { setResult(availability); setStage('availability-checked'); }}>Check synthetic availability</Button><Button variant="secondary" disabled={locked} onClick={() => { setExpired(true); setResult(''); }}>Simulate quote / availability expiry</Button><Button variant="secondary" disabled={locked || !expired} onClick={() => { setExpired(false); setStage('proposal'); }}>Review refreshed fixture quote</Button></div>
      {result && <Alert title={`Availability: ${result}`} tone={result === 'available' ? 'success' : 'warning'}>{result === 'available' ? 'Synthetic summary covers the selected line item. The app rechecks at commitment.' : 'Review inventory before commitment. No per-screen allocation has been inferred.'}</Alert>}
      <Button disabled={locked || result !== 'available' || expired} onClick={() => setReview(true)}>Review exact booking</Button>
    </Card>}
    {['booking-pending', 'unknown', 'booked', 'cancel-pending', 'cancelled'].includes(stage) && <OperationResults title="Booking ledger" items={[{ id: 'book-1', target: 'OOH proposal demo-proposal-001', status: stage === 'unknown' ? 'unknown' : stage === 'booking-pending' || stage === 'cancel-pending' ? 'pending' : 'confirmed', receipt: 'demo-book-001', detail: stage === 'booked' ? 'Synthetic readback: BOOKED. Proof of play is not yet available.' : stage === 'cancel-pending' ? 'Cancellation requested; booking is not yet confirmed cancelled.' : stage === 'cancelled' ? 'Synthetic provider readback: CANCELLED. Refund status remains unknown.' : undefined }]} />}
    {stage === 'booking-pending' && <><Field htmlFor={`${id}-readback`} label="Simulated booking readback"><Select value={readback} onChange={event => setReadback(event.target.value)}><option value="booked">Confirmed booked</option><option value="unknown">Outcome unknown / partial creation</option></Select></Field><Button onClick={() => setStage(readback)}>Inspect synthetic booking readback</Button></>}
    {stage === 'unknown' && <Alert title="Reconcile the booking receipt" tone="warning">Do not create another booking. The provider may have created all or part of the placement.<Button variant="secondary" onClick={() => setStage('booked')}>Simulate reconciliation: whole booking confirmed</Button></Alert>}
    {stage === 'booked' && <Button variant="danger" onClick={() => setCancel(true)}>Review cancellation request</Button>}
    {stage === 'cancel-pending' && <Button variant="secondary" onClick={() => setStage('cancelled')}>Simulate confirmed cancellation readback</Button>}
    <Dialog open={review} onOpenChange={setReview} title="Review OOH commitment" footer={<><Button variant="secondary" autoFocus onClick={() => setReview(false)}>Keep proposal</Button><Button onClick={() => { if (expired || result !== 'available' || locked) return; setStage('booking-pending'); setReview(false); }}>Simulate booking submission</Button></>}><ReviewSummary scope="Studio / Dubai launch · sandbox · 1 full-day line item" resource="demo-proposal-001 · demo-quote-001" changes={[{ id: 'booking', label: 'Placement status', before: 'Local proposal', after: 'Booking request pending readback' }, { id: 'quote', label: 'Whole-line-item quote', before: 'No commitment', after: 'AED 2,400' }, { id: 'faces', label: 'Selected inventory and dates', before: 'No booking', after: `${selected.map(key => `${inventory.find(face => face.key === key)?.label ?? key} (${key})`).join('; ')} · ${from}–${to} · Asia/Dubai · 6/hour` }]} consequences="Availability must be rechecked by the app. Existing one-line-item, full-day and frequency limits remain. A hold or summary is not permanent availability." /></Dialog>
    <Dialog open={cancel} onOpenChange={setCancel} title="Request cancellation of demo-book-001?" footer={<><Button variant="secondary" autoFocus onClick={() => setCancel(false)}>Keep booking</Button><Button variant="danger" onClick={() => { setStage('cancel-pending'); setCancel(false); }}>Simulate cancellation request</Button></>}><p>This records a pending cancellation request. Only provider readback confirms cancellation. Cancellation does not establish a refund.</p></Dialog>
  </CollectionTemplate>;
}
