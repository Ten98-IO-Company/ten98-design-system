import { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Field, Input, ShortcutProvider, Stack, useCommand } from '@ten98/ui';
import '@ten98/ui/styles.css';

// A command that handles Backspace only in an empty field and declines it elsewhere, and a disabled command.
declare global { interface Window { ran: string[] } }
window.ran = [];

function Commands({ previous }: { previous: () => void }) {
  useCommand({ id: 'field.back', label: 'Previous field', allowInTextInput: true, run: press => {
    const target = press?.target;
    if (target instanceof HTMLInputElement && target.name === 'second' && target.value === '') { window.ran.push('back'); previous(); }
    else press?.decline();
  } });
  useCommand({ id: 'field.clear', label: 'Clear', enabled: false, run: () => window.ran.push('clear') });
  return null;
}

function Screen() {
  const first = useRef<HTMLInputElement>(null);
  return <ShortcutProvider keymaps={{ classic: { 'field.back': 'Backspace', 'field.clear': 'Ctrl+K' } }}>
    <Commands previous={() => first.current?.focus()} />
    <Stack as="main" gap={3}>
      <Field label="First"><Input ref={first} name="first" defaultValue="kept" /></Field>
      <Field label="Second"><Input name="second" /></Field>
    </Stack>
  </ShortcutProvider>;
}

createRoot(document.getElementById('shortcut-decline-fixture')!).render(<Screen />);
