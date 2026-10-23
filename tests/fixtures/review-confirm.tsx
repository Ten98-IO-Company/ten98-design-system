import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, DescriptionList, Heading, ReviewConfirm, Stack, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
declare global { interface Window { finish: () => void } }
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';

function Screen() {
  const [audience, setAudience] = useState('Spring subscribers');
  const [sent, setSent] = useState<string[]>([]);
  return <Stack as="main" gap={6}>
    <Heading level={1}>Review confirm</Heading>
    <Button variant="secondary" onClick={() => setAudience('Lapsed customers')}>Change audience</Button>
    <ReviewConfirm title={`Send to ${audience}`} tone="danger" reviewKey={audience} confirmLabel="Send now" onCancel={() => setSent(current => [...current, 'cancelled'])}
      acknowledgements={[{ id: 'list', label: 'I reviewed the recipient list' }, { id: 'undo', label: 'I understand sends cannot be undone' }]}
      onConfirm={() => new Promise<void>(resolve => { setSent(current => [...current, audience]); window.finish = resolve; })}>
      <DescriptionList items={[{ term: 'Audience', description: audience }, { term: 'Recipients', description: '1,204' }]} />
    </ReviewConfirm>
    <Text id="sent">{sent.join(' | ')}</Text>
  </Stack>;
}
createRoot(document.getElementById('review-confirm-fixture')!).render(<Screen />);
