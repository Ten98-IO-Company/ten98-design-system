'use client';

import { useId, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, ConversationThread, FlowSection, DetailWorkspace, Dialog, Field, OperationResults, Select, Textarea, type ConversationMessage, type OperationStatus } from '../../lib';

const initialMessages: Record<string, ConversationMessage[]> = {
  marina: [{ id: 'm1', author: 'Sam · @sam.demo', time: '19 October 2026 · 10:15 Asia/Dubai', visibility: 'public', content: 'When does the studio open?' }],
  creek: [{ id: 'm2', author: 'Robin · @robin.demo', time: '19 October 2026 · 10:18 Asia/Dubai', visibility: 'public', content: 'Is the event accessible?' }],
};

export default function RecoverPublishingInbox() {
  const id = useId();
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  const [selected, setSelected] = useState('');
  const [switchTo, setSwitchTo] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [modes, setModes] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState(initialMessages);
  const [sends, setSends] = useState<Record<string, OperationStatus | undefined>>({});
  const [submitted, setSubmitted] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const [review, setReview] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [recovery, setRecovery] = useState<OperationStatus>('error');
  const [unknown, setUnknown] = useState<OperationStatus>('unknown');
  const active = selected || 'marina';
  const draft = drafts[active] ?? '';
  const mode = modes[active] ?? 'public';
  const send = sends[active];
  const locked = send === 'pending' || send === 'unknown';
  function select(next: string) { if (drafts[active]?.trim()) setSwitchTo(next); else setSelected(next); }
  function acceptReply() {
    setSends(current => ({ ...current, [active]: 'accepted' }));
    setMessages(current => ({ ...current, [active]: [...current[active], { id: `${active}-out-${current[active].length}`, author: 'Maya · Studio', time: 'Synthetic acceptance · no delivery time', visibility: 'public', content: submitted[active], status: 'Accepted · delivery unobserved' }] }));
    setDrafts(current => ({ ...current, [active]: '' }));
  }
  const composer = <><Field htmlFor={`${id}-mode`} label="Reply visibility"><Select value={mode} disabled={locked} onChange={event => setModes(current => ({ ...current, [active]: event.target.value }))}><option value="public">Public reply · visible externally</option><option value="note">Internal note · local proposed example only</option></Select></Field>
    <Field htmlFor={`${id}-reply`} label={mode === 'public' ? 'Public reply text' : 'Internal note text · never sent externally'}><Textarea value={draft} disabled={locked} onChange={event => setDrafts(current => ({ ...current, [active]: event.target.value }))} /></Field>
    <Button disabled={!draft.trim() || locked} onClick={() => { if (mode === 'note') { setMessages(current => ({ ...current, [active]: [...current[active], { id: `${active}-note-${current[active].length}`, author: 'Maya · Studio', time: 'Local note · unsynced', visibility: 'note', content: draft }] })); setDrafts(current => ({ ...current, [active]: '' })); } else setReview(true); }}>{mode === 'public' ? 'Review public reply' : 'Add local internal note'}</Button>
    {send === 'pending' && <><Button variant="secondary" onClick={acceptReply}>Simulate accepted reply</Button><Button variant="secondary" onClick={() => setSends(current => ({ ...current, [active]: 'unknown' }))}>Simulate lost response</Button><Button variant="secondary" onClick={() => setSends(current => ({ ...current, [active]: 'error' }))}>Simulate confirmed send failure</Button></>}
    {send === 'unknown' && <Alert title="Reply outcome unknown" tone="warning" actions={<><Button variant="secondary" onClick={acceptReply}>Simulate reconciliation: accepted reply found</Button></>}>Draft and receipt are retained. Sending again is blocked until the application reconciles the original operation.</Alert>}
    {send === 'error' && <p role="status">Confirmed not sent. Draft retained; review it before another attempt.</p>}
  </>;
  return <FlowSection title="Publishing recovery and inbox" description="Local reference · synthetic post results and conversations. No provider sends or durable notes are performed." scope="Studio / Dubai launch · exact account Studio Dubai · demo-ig-17">
    <div className="t98-control-stack">{<Alert title="Proposed local note capability">Current consumer controllers own read, archive and reopen. Internal notes here demonstrate explicit visibility; they do not claim an integrated note backend. Inbound messages do not establish marketing consent.</Alert>}</div>
    <OperationResults title="Per-destination recovery · post demo-post-4" description="Attempted 19 October 2026 at 06:00 UTC. Retry only a known failed destination." items={[
      { id: 'delivered', target: 'Studio Company · demo-li-28', status: 'delivered', receipt: 'demo-publish-li-001', detail: 'Published receipt retained; this successful destination is never retried.' },
      { id: 'failed', target: 'Studio Dubai · demo-ig-17', status: recovery, receipt: 'demo-publish-ig-001', error: recovery === 'error' ? 'Synthetic disconnected-account failure. Reconnect exact account in the app before retry.' : undefined, actions: recovery === 'error' ? <Button variant="secondary" onClick={() => setRecovery('pending')}>Simulate reconnection and retry failed destination only</Button> : recovery === 'pending' ? <Button variant="secondary" onClick={() => setRecovery('accepted')}>Simulate retry accepted · not published</Button> : undefined },
      { id: 'unknown', target: 'Studio Shop · demo-ig-39', status: unknown, receipt: 'demo-publish-shop-001', actions: unknown === 'unknown' ? <Button variant="secondary" onClick={() => setUnknown('delivered')}>Simulate reconciliation: published receipt found</Button> : undefined },
    ]} />
    <DetailWorkspace label="Unified inbox" listLabel="Conversations" detailLabel="Conversation and reply" selected={!!selected} onBack={() => { const previous = active; setSelected(''); requestAnimationFrame(() => buttons.current[previous]?.focus()); }}
      list={<>{['marina', 'creek'].map(value => <Card key={value} title={value === 'marina' ? 'Sam · studio opening' : 'Robin · event access'}><p>{drafts[value]?.trim() ? 'Unsaved draft retained' : 'No unsaved draft'} · {resolved[value] ? 'Reviewed / resolved' : 'Needs review'}</p><Button ref={element => { buttons.current[value] = element; }} aria-pressed={selected === value} onClick={() => select(value)}>Open {value === 'marina' ? 'Sam' : 'Robin'} conversation</Button></Card>)}</>}
      detail={<><Field htmlFor={`${id}-permission`} label="Simulated reply permission"><Select value={readOnly ? 'read-only' : 'reply'} onChange={event => setReadOnly(event.target.value === 'read-only')}><option value="reply">Can reply</option><option value="read-only">Permission lost · read only</option></Select></Field><ConversationThread label={`${active === 'marina' ? 'Sam' : 'Robin'} · public Instagram conversation`} messages={messages[active]} readOnly={readOnly} composer={composer} status={<Badge>{resolved[active] ? 'Reviewed / resolved · independent of send state' : 'Needs workflow review'}</Badge>} />
        {send && <OperationResults title="Reply receipt" items={[{ id: active, target: `${active} conversation · exact account demo-ig-17`, status: send, receipt: `demo-inbox-${active}-${attempts[active] ?? 1}`, detail: send === 'accepted' ? 'Synthetic provider acceptance. Delivery and workflow review remain separate.' : undefined }]} />}
        <Button variant="secondary" onClick={() => setResolved(current => ({ ...current, [active]: !current[active] }))}>{resolved[active] ? 'Reopen conversation locally' : 'Mark conversation reviewed locally'}</Button>{resolved[active] && <Button variant="secondary" onClick={() => { setResolved(current => ({ ...current, [active]: false })); setMessages(current => ({ ...current, [active]: [...current[active], { id: `${active}-new-${current[active].length}`, author: active === 'marina' ? 'Sam' : 'Robin', time: 'New synthetic inbound message', visibility: 'public', content: 'One more question, please.' }] })); }}>Simulate new message · reopen review</Button>}</>} />
    <Dialog open={switchTo !== null} onOpenChange={open => { if (!open) setSwitchTo(null); }} title="Keep this unsaved draft before switching?" footer={<><Button variant="secondary" autoFocus onClick={() => setSwitchTo(null)}>Stay in conversation</Button><Button onClick={() => { setSelected(switchTo ?? ''); setSwitchTo(null); }}>Keep draft and switch</Button></>}><p>Text, visibility choice, pending receipt and history stay attached to {active}. Returning restores that conversation's draft. Nothing is sent or discarded.</p></Dialog>
    <Dialog open={review} onOpenChange={setReview} title="Review public reply" description={`Exact destination: ${active} · Studio Dubai demo-ig-17. This reply is external and public.`} footer={<><Button variant="secondary" autoFocus onClick={() => setReview(false)}>Keep draft</Button><Button onClick={() => { if (readOnly || locked || !draft.trim()) return; setSubmitted(current => ({ ...current, [active]: draft })); setAttempts(current => ({ ...current, [active]: (current[active] ?? 0) + 1 })); setSends(current => ({ ...current, [active]: 'pending' })); setReview(false); }}>Simulate public send</Button></>}><p>{draft}</p><p>The application checks channel windows, attachments, templates, permissions and current operation keys before sending. Acceptance does not resolve the conversation.</p></Dialog>

  </FlowSection>;
}
