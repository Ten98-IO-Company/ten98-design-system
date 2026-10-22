import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Heading, Inline, Popover, Stack, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
if (params.get('dir') === 'rtl') document.documentElement.dir = 'rtl';

function Screen() {
  const [picked, setPicked] = useState('');
  const [open, setOpen] = useState(false);
  return <Stack as="main" gap={4}>
    <Heading level={1}>Popover</Heading>
    <Inline justify="between">
      <Popover label="Emoji" triggerLabel="Add emoji">
        <Inline gap={1}>{['Smile', 'Heart', 'Party'].map(name => <Button key={name} variant="ghost" onClick={() => setPicked(name)}>{name}</Button>)}</Inline>
      </Popover>
      <Popover label="Filters" triggerLabel="Filters" placement="bottom-end" open={open} onOpenChange={setOpen}>
        <Text>Filter options</Text>
        <Button onClick={() => setOpen(false)}>Done</Button>
      </Popover>
    </Inline>
    <Text id="picked">{picked}</Text>
    <Text id="open">{String(open)}</Text>
  </Stack>;
}
createRoot(document.getElementById('popover-fixture')!).render(<Screen />);
