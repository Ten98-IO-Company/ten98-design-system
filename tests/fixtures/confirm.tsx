import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Field, Form, FormActions, Heading, Input, Stack, Text, useConfirmDialog } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
function Revoker({ log }: { log: (entry: string) => void }) {
  const [confirm, dialog] = useConfirmDialog({ danger: true });
  return <Stack gap={2}>
    <Button onClick={async () => log(`revoke ${await confirm({ title: 'Revoke key?', description: 'Apps using it stop working.', confirmLabel: 'Revoke key' })}`)}>Revoke key</Button>
    <Button onClick={async () => log(`delete ${await confirm({ title: 'Delete project?', description: 'This cannot be undone.', confirmLabel: 'Delete project', confirmationText: 'Studio' })}`)}>Delete project</Button>
    {dialog}
  </Stack>;
}

function Screen() {
  const [entries, setEntries] = useState<string[]>([]);
  const [mounted, setMounted] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const log = (entry: string) => setEntries(current => [...current, entry]);
  return <Stack as="main" gap={4}>
    <Heading level={1}>Confirm</Heading>
    {mounted && <Revoker log={log} />}
    <Button variant="secondary" onClick={() => setMounted(false)}>Unmount</Button>
    <Text id="log">{entries.join(' | ')}</Text>
    <Form fieldErrors={errors} onSubmit={() => setErrors({ password: 'Use at least 12 characters.' })}>
      <Field label="Email"><Input name="email" defaultValue="a@example.com" /></Field>
      <Field label="New password" error={errors.password}><Input name="password" type="password" /></Field>
      <FormActions><Button type="submit">Change password</Button></FormActions>
    </Form>
  </Stack>;
}
createRoot(document.getElementById('confirm-fixture')!).render(<Screen />);
