import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Dialog, Field, Form, FormActions, Heading, Image, Input, Stack, Text, Textarea } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
declare global { interface Window { finish: () => void } }
function EditDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Dubai Marina billboard');
  const [saved, setSaved] = useState('');
  return <>
    <Button onClick={() => { setName('Dubai Marina billboard'); setOpen(true); }}>Edit placement</Button>
    <Dialog open={open} onOpenChange={setOpen} eyebrow="Outdoor placements" title="Edit placement" dirty={name !== 'Dubai Marina billboard'}
      onSubmit={data => new Promise<void>(resolve => setTimeout(() => { setSaved(String(data.get('placement'))); setOpen(false); resolve(); }, 300))}
      footer={<FormActions><Button type="submit">Save placement</Button></FormActions>}>
      <Field label="Placement name"><Input name="placement" value={name} onChange={event => setName(event.target.value)} /></Field>
    </Dialog>
    <Text id="saved">{saved}</Text>
  </>;
}
function Screen() {
  const [calls, setCalls] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  return <Stack as="main" gap={6}>
    <Heading level={1}>Form</Heading>
    <Form ref={formRef} onSubmit={data => new Promise<void>(resolve => { setCalls(current => [...current, `${data.get('name')} via ${data.get('intent')}`]); window.finish = resolve; })}>
      <Field label="Project name"><Input name="name" required defaultValue="Spring launch" /></Field>
      <Field label="SMS message" count={{ value: message, max: 20 }}><Textarea name="sms" value={message} onChange={event => setMessage(event.target.value)} /></Field>
      <FormActions><Button type="submit" name="intent" value="save">Save</Button></FormActions>
    </Form>
    {/* An app action outside the form that submits it through the forwarded ref, as Campaign's "Save and check audience" does. */}
    <Button variant="secondary" onClick={() => formRef.current?.requestSubmit()}>Submit from outside</Button>
    <Text id="calls">{calls.join(' | ')}</Text>
    <EditDialog />
    <Image src="/tests/missing-image.png" alt="Spring launch hero" aspect="video" />
    <Image src="/tests/missing-decorative.png" alt="" />
  </Stack>;
}
createRoot(document.getElementById('form-fixture')!).render(<Screen />);
