import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ConfirmDialog, Dialog, Field, Input, Stack, Text, useConfirmDialog, type ConfirmRequest } from '@ten98/ui';
import '@ten98/ui/styles.css';

// Composed the way an application screen must be: library components only. Each opener can also be opened from the test
// (window.openers), like a dialog that appears while a key is already held, for example when a request finishes mid-typing.
declare global { interface Window { log: string[]; openers: Record<string, () => void> } }
window.log = [];
window.openers = {};
const record = (entry: string) => { window.log.push(entry); };
function useOpener(name: string, open: () => void) {
  useEffect(() => { window.openers[name] = open; });
}

function PublishConfirm() {
  const [open, setOpen] = useState(false);
  useOpener('publish', () => setOpen(true));
  return <>
    <Button onClick={() => setOpen(true)}>Publish post</Button>
    <ConfirmDialog open={open} onOpenChange={setOpen} title="Publish this post?" description="It goes live on every connected channel."
      confirmLabel="Publish" onConfirm={() => record('publish')} />
  </>;
}
function HookConfirm({ name, opener, request }: { name: string; opener: string; request: ConfirmRequest }) {
  const [confirm, dialog] = useConfirmDialog();
  const ask = async () => record(`${name} ${await confirm(request)}`);
  useOpener(name, () => { void ask(); });
  return <>
    <Button onClick={ask}>{opener}</Button>
    {dialog}
  </>;
}
function PrimaryDialog() {
  const [open, setOpen] = useState(false);
  useOpener('apply', () => setOpen(true));
  return <>
    <Button onClick={() => setOpen(true)}>Change budget</Button>
    <Dialog open={open} onOpenChange={setOpen} title="Change budget?" initialFocus="primary"
      footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { record('apply'); setOpen(false); }}>Apply</Button></>}>
      <Text>The new daily budget applies from tomorrow.</Text>
    </Dialog>
  </>;
}
function FormDialog() {
  const [open, setOpen] = useState(false);
  useOpener('note', () => setOpen(true));
  return <>
    <Button onClick={() => setOpen(true)}>Add note</Button>
    <Dialog open={open} onOpenChange={setOpen} title="Add a note" initialFocus="first-field"
      onSubmit={data => { record(`note ${String(data.get('note'))}`); setOpen(false); }}
      footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save note</Button></>}>
      <Field label="Note"><Input name="note" defaultValue="Ready" /></Field>
    </Dialog>
  </>;
}
function TypedConfirm({ danger }: { danger?: boolean }) {
  const [open, setOpen] = useState(false);
  const name = danger ? 'Delete' : 'Rename';
  return <>
    <Button onClick={() => setOpen(true)}>{name} project</Button>
    <ConfirmDialog open={open} onOpenChange={setOpen} title={`${name} project?`} description="Check the name first." danger={danger}
      confirmationText="Studio" confirmLabel={name} onConfirm={() => record(name.toLowerCase())} />
  </>;
}

createRoot(document.getElementById('dialog-held-enter-fixture')!).render(<Stack as="main" gap={2}>
  <PublishConfirm />
  <HookConfirm name="ads" opener="Enable paid ads" request={{ title: 'Enable paid ads?', description: 'Spend starts today.', confirmLabel: 'Enable ads' }} />
  <HookConfirm name="sms" opener="Send test SMS" request={{ title: 'Send a test SMS?', description: 'One message to your phone.', confirmLabel: 'Send SMS', initialFocus: 'confirm' }} />
  <PrimaryDialog />
  <FormDialog />
  <TypedConfirm />
  <TypedConfirm danger />
  <Text>Dialog held Enter</Text>
</Stack>);
