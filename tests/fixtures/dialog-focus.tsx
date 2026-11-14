import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ConfirmDialog, Dialog, Field, Input, Stack, Text, type DialogInitialFocus } from '@ten98/ui';
import '@ten98/ui/styles.css';

// Composed the way an application screen must be: library components only. Each button opens one dialog setup.
declare global { interface Window { log: string[] } }
window.log = [];

function PeriodDialog({ name, initialFocus }: { name: string; initialFocus?: DialogInitialFocus }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)}>Open {name}</Button>
    <Dialog open={open} onOpenChange={setOpen} title={`Period (${name})`} initialFocus={initialFocus}
      footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { window.log.push(`apply ${name}`); setOpen(false); }}>Apply</Button></>}>
      <Field label="From"><Input name="from" /></Field>
    </Dialog>
  </>;
}
function NoteRefDialog() {
  const [open, setOpen] = useState(false);
  const note = useRef<HTMLInputElement>(null);
  return <>
    <Button onClick={() => setOpen(true)}>Open ref</Button>
    <Dialog open={open} onOpenChange={setOpen} title="Period (ref)" initialFocus={note}>
      <Field label="From"><Input name="from" /></Field>
      <Field label="Note"><Input ref={note} name="note" /></Field>
    </Dialog>
  </>;
}
function Confirm({ name, danger, initialFocus, confirmationText }: { name: string; danger?: boolean; initialFocus?: 'confirm' | 'cancel'; confirmationText?: string }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)}>Confirm {name}</Button>
    <ConfirmDialog open={open} onOpenChange={next => { if (!next && open) window.log.push(`close ${name}`); setOpen(next); }} title={`Confirm ${name}?`} description="Check before continuing."
      danger={danger} initialFocus={initialFocus} confirmationText={confirmationText} confirmLabel="Go ahead" onConfirm={() => { window.log.push(`confirm ${name}`); }} />
  </>;
}

createRoot(document.getElementById('dialog-focus-fixture')!).render(<Stack as="main" gap={2}>
  <PeriodDialog name="default" />
  <PeriodDialog name="field" initialFocus="first-field" />
  <PeriodDialog name="primary" initialFocus="primary" />
  <PeriodDialog name="close" initialFocus="close" />
  <NoteRefDialog />
  <Confirm name="post" />
  <Confirm name="delete" danger />
  <Confirm name="purge" danger initialFocus="confirm" />
  <Confirm name="rename" confirmationText="Studio" />
  <Text>Dialog focus</Text>
</Stack>);
