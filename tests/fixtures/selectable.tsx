import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Heading, SelectableList, Stack, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';
function Screen() {
  const [selected, setSelected] = useState<string | null>('b');
  // App-level next/previous commands, as an inbox binds to j and k: they change the selection without touching focus.
  useEffect(() => {
    const order = ['a', 'b', 'd'];
    const move = (event: KeyboardEvent) => {
      if (event.key !== 'j' && event.key !== 'k') return;
      setSelected(current => order[Math.min(order.length - 1, Math.max(0, order.indexOf(current ?? 'b') + (event.key === 'j' ? 1 : -1)))]);
    };
    window.addEventListener('keydown', move);
    return () => window.removeEventListener('keydown', move);
  }, []);
  return <Stack as="main" gap={4}>
    <Heading level={1}>Selectable list</Heading>
    <SelectableList label="Conversations" selectedId={selected} onSelect={setSelected} items={[
      { id: 'a', title: 'Lina Haddad with a long name that should truncate on one line', preview: 'Is the studio open on Friday? We would like the larger room for an afternoon shoot with four people and props.', meta: '10:42', unread: 3 },
      { id: 'b', title: 'Omar Saleh', preview: 'Thanks!', meta: 'Yesterday' },
      { id: 'c', title: 'Archived', disabled: true },
      { id: 'd', title: 'Sara Odeh', preview: 'Booked.', meta: 'Mon' },
    ]} />
    <Text id="selected">{selected}</Text>
    <Button variant="secondary">Elsewhere</Button>
  </Stack>;
}
createRoot(document.getElementById('selectable-fixture')!).render(<Screen />);
