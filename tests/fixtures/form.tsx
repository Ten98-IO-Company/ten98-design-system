import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Field, Form, FormActions, Heading, Input, Stack, Text, Textarea } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
declare global { interface Window { finish: () => void } }
function Screen() {
  const [calls, setCalls] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  return <Stack as="main" gap={6}>
    <Heading level={1}>Form</Heading>
    <Form onSubmit={data => new Promise<void>(resolve => { setCalls(current => [...current, `${data.get('name')} via ${data.get('intent')}`]); window.finish = resolve; })}>
      <Field label="Project name"><Input name="name" required defaultValue="Spring launch" /></Field>
      <Field label="SMS message" count={{ value: message, max: 20 }}><Textarea name="sms" value={message} onChange={event => setMessage(event.target.value)} /></Field>
      <FormActions><Button type="submit" name="intent" value="save">Save</Button></FormActions>
    </Form>
    <Text id="calls">{calls.join(' | ')}</Text>
  </Stack>;
}
createRoot(document.getElementById('form-fixture')!).render(<Screen />);
