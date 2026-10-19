'use client';

import { useId, useState } from 'react';
import { Alert, AudienceSummary, Badge, Button, Dialog, EditorTemplate, Field, Input, OperationResults, ReviewSummary, Select, Textarea } from '../../lib';

const importRows = [
  ['1', 'a***@example.test', 'Added', 'Verified transactional address · appointment request evidence demo-consent-11'],
  ['2', 'b***@example.test', 'Updated', 'Verified transactional address · appointment request evidence demo-consent-12'],
  ['3', 'c***@example.test', 'Skipped', 'Suppressed · earlier consent cannot override suppression'],
  ['4', 'invalid row', 'Error', 'Invalid address · identity conflict retained for manual review'],
  ['5', 'e***@example.test', 'Unverified', 'Unverified address · eligibility unavailable until app review'],
];

export default function ReviewDirectAudience() {
  const id = useId();
  const [importStage, setImportStage] = useState('not-started');
  const [audience, setAudience] = useState('not-previewed');
  const [subject, setSubject] = useState('Your Dubai studio appointment');
  const [content, setContent] = useState('Your requested appointment is confirmed for 21 October at 10:00 Asia/Dubai.');
  const [stage, setStage] = useState('draft');
  const [review, setReview] = useState(false);
  const [outcome, setOutcome] = useState('accepted');
  const [receiptContent, setReceiptContent] = useState('');
  const locked = ['pending', 'unknown', 'accepted', 'delivered'].includes(stage);
  const ready = audience === 'ready';
  function edit() { setStage('draft'); setReview(false); }
  return <EditorTemplate title="Review audience, preview and send" description="Local reference · five synthetic import rows, two eligible transactional recipients. No message or contact import is sent." scope="Studio / Dubai launch · Cloudflare transactional email fixture"
    actions={<Badge>{stage}</Badge>}
    preview={<AudienceSummary title="Exact audience preview" scope="Studio / Dubai launch · appointment confirmations" channel="Email · synthetic Cloudflare connection" purpose="Transactional appointment confirmation only" counts={{ total: importStage === 'complete' ? 5 : null, eligible: ready ? 2 : null, excluded: ready ? 2 : null, unverified: ready ? 1 : null }} exclusions={ready ? [{ reason: 'Suppression wins over prior consent', count: 1 }, { reason: 'Invalid address / unresolved identity conflict', count: 1 }] : []} sample={ready ? <p>a***@example.test and b***@example.test · explicit appointment request evidence demo-consent-11 / 12. The unverified address is excluded from the send count.</p> : <p>No eligible audience has been confirmed yet.</p>} importResult={importStage === 'complete' ? 'Added 1 · updated 1 · skipped 1 · error 1 · unverified 1. Rows retained below.' : 'Import preview not complete'} pending={audience === 'pending'} stale={audience === 'stale'} staleReason="Synthetic consent/template evidence changed. Refresh the local audience before another review." />}>
    <Alert title="Transactional boundary">A marketing reference does not authorize marketing through Cloudflare. The application owns consent, suppression, identity conflicts, channel policy, template approval and the exact preview signature. All effects here stay local while mounted.</Alert>
    <Field htmlFor={`${id}-purpose`} label="Permitted channel and purpose"><Select disabled={locked}><option>Email · transactional appointment confirmation</option></Select></Field>
    <div className="t98-form-actions"><Button disabled={importStage !== 'not-started' || locked} onClick={() => setImportStage('pending')}>Preview synthetic import</Button>{importStage === 'pending' && <Button variant="secondary" onClick={() => setImportStage('complete')}>Simulate import result ready</Button>}</div>
    {importStage === 'pending' && <p role="status">Import preview pending. No contacts have been created.</p>}
    {importStage === 'complete' && <><div className="t98-table-region" role="region" aria-label="Synthetic import result rows" tabIndex={0}><table className="t98-table"><caption>Import preview · all 5 rows · no identity silently merged</caption><thead><tr><th scope="col">Row</th><th scope="col">Contact</th><th scope="col">Outcome</th><th scope="col">Evidence / remedy</th></tr></thead><tbody>{importRows.map(row => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div>
      <Button variant="secondary" disabled={locked || audience === 'pending'} onClick={() => setAudience('pending')}>Refresh local audience preview</Button>{audience === 'pending' && <Button variant="secondary" onClick={() => setAudience('ready')}>Simulate consent and suppression result</Button>}</>}
    <Field htmlFor={`${id}-sender`} label="Verified sender"><Input value="Studio appointments · appointments@example.test" readOnly /></Field>
    <Field htmlFor={`${id}-subject`} label="Transactional subject"><Input value={subject} disabled={locked} onChange={event => { setSubject(event.target.value); edit(); }} /></Field>
    <Field htmlFor={`${id}-body`} label="Supported plain-text appointment template"><Textarea value={content} disabled={locked} onChange={event => { setContent(event.target.value); edit(); }} /></Field>
    <Field htmlFor={`${id}-response`} label="Simulated send response"><Select value={outcome} disabled={locked} onChange={event => setOutcome(event.target.value)}><option value="accepted">Provider accepted · delivery unobserved</option><option value="error">Confirmed not sent</option><option value="unknown">Unknown · reconcile before repeat</option></Select></Field>
    <div className="t98-form-actions"><Button disabled={!ready || !subject.trim() || !content.trim() || locked} onClick={() => setReview(true)}>Review exact send to 2 recipients</Button><Button variant="secondary" disabled={locked || audience === 'not-previewed'} onClick={() => { setAudience('stale'); setReview(false); }}>Simulate changed eligibility / stale review</Button></div>
    {stage === 'pending' && <Button onClick={() => setStage(outcome)}>Simulate provider send response</Button>}
    {stage !== 'draft' && <OperationResults title="Recipient send receipts" description="Accepted, delivered and read are distinct. No automatic resend follows pending or uncertain outcomes." items={[{ id: 'recipient-a', target: 'a***@example.test · demo-consent-11', status: stage === 'unknown' ? 'unknown' : stage === 'pending' ? 'pending' : stage === 'error' ? 'error' : stage === 'delivered' ? 'delivered' : 'accepted', receipt: 'demo-direct-001-a', detail: receiptContent }, { id: 'recipient-b', target: 'b***@example.test · demo-consent-12', status: stage === 'unknown' ? 'unknown' : stage === 'pending' ? 'pending' : stage === 'error' ? 'error' : stage === 'delivered' ? 'delivered' : 'accepted', receipt: 'demo-direct-001-b', detail: stage === 'delivered' ? 'Separate synthetic delivery receipt. Read state unavailable.' : 'Same reviewed content; delivery unobserved until separately evidenced.' }]} />}
    {stage === 'unknown' && <Alert title="Uncertain send · repeating is blocked" tone="warning">Keep both recipient receipts. The real app reconciles per recipient; it never automatically resends the audience.<Button variant="secondary" onClick={() => setStage('accepted')}>Simulate reconciliation: both accepted</Button></Alert>}
    {stage === 'accepted' && <Button variant="secondary" onClick={() => setStage('delivered')}>Simulate separate delivery receipts</Button>}
    {stage === 'delivered' && <p>Delivery is confirmed only within this synthetic result. Read tracking is unavailable for this connection.</p>}
    {stage === 'error' && <Button variant="secondary" onClick={() => { setStage('draft'); setAudience('stale'); }}>Keep content and refresh eligibility before retry</Button>}
    <Dialog open={review} onOpenChange={setReview} title="Review exact transactional send" footer={<><Button variant="secondary" autoFocus onClick={() => setReview(false)}>Keep draft</Button><Button onClick={() => { if (!ready || locked || !subject.trim() || !content.trim()) return; setReceiptContent(`Reviewed subject: ${subject}. Reviewed body: ${content}`); setStage('pending'); setReview(false); }}>Simulate explicit send to 2 recipients</Button></>}><ReviewSummary scope="Studio / Dubai launch · email · transactional appointment confirmation" resource="Exact audience signature demo-audience-r1 · template demo-appointment-v1" changes={[{ id: 'audience', label: 'Recipients', before: 'No send', after: '2 eligible / 5 imported · a*** and b*** only' }, { id: 'sender', label: 'Sender / time', before: 'No send', after: 'Studio appointments · appointments@example.test · immediately after confirmation' }, { id: 'subject', label: 'Subject', before: 'Draft', after: subject }, { id: 'content', label: 'Plain-text content', before: 'Draft', after: content }]} consequences="Suppressed, invalid and unverified recipients are excluded. The app must recheck the preview signature, eligibility, permission and template state immediately before submission." /></Dialog>
  </EditorTemplate>;
}
