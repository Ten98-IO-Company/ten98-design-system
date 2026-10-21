import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AccountScopePicker, Field, FieldList, Heading, Input, Stack, Text, type ScopeAccount } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';

const connections = [
  { id: 'meta', label: 'Meta Business with a deliberately long connection name that must wrap on narrow screens', detail: 'Connected 3 March' },
  { id: 'big', label: 'Agency pool' },
  { id: 'old', label: 'Google Ads', status: 'expired' as const },
  { id: 'empty', label: 'TikTok' },
  { id: 'slow', label: 'LinkedIn' },
];
const accountsFor = (connectionId: string): ScopeAccount[] | null => {
  if (connectionId === 'slow') return null;
  if (connectionId === 'empty') return [];
  const count = connectionId === 'big' ? 9 : 3;
  return Array.from({ length: count }, (_, index) => ({ id: `${connectionId}-${index + 1}`, label: `Ad account ${index + 1}`, disabled: connectionId === 'meta' && index === 1, disabledReason: 'Suspended by the provider' }));
};

interface Slot { id: string; time: string }

function Screen() {
  const [slots, setSlots] = useState<Slot[]>([{ id: 's1', time: '09:00' }, { id: 's2', time: '13:30' }, { id: 's3', time: '18:00' }]);
  const [counter, setCounter] = useState(4);
  const [connectionId, setConnectionId] = useState('');
  const [accountId, setAccountId] = useState('');
  const move = (from: number, to: number) => setSlots(current => { const copy = [...current]; copy.splice(to, 0, ...copy.splice(from, 1)); return copy; });
  return <Stack as="main" gap={6} id="field-list">
    <Heading level={1}>Field list</Heading>
    <FieldList legend="Posting times with a deliberately long group name that must wrap" name="slots" items={slots} getKey={slot => slot.id} min={1} max={5} addLabel="Add time"
      removeLabel={index => `Remove time ${index + 1}`} emptyMessage="No posting times yet."
      onAdd={() => { setSlots(current => [...current, { id: `s${counter}`, time: '' }]); setCounter(counter + 1); }}
      onRemove={index => setSlots(current => current.filter((_, position) => position !== index))} onMove={move}
      renderItem={(slot, index, { name, id }) => <Field label={`Time ${index + 1}`} htmlFor={id('time')}><Input id={id('time')} name={name('time')} type="time" defaultValue={slot.time} /></Field>} />
    <AccountScopePicker name="scope" connections={connections} accounts={connectionId ? accountsFor(connectionId) : []} connectionId={connectionId} accountId={accountId}
      onConnectionChange={setConnectionId} onAccountChange={setAccountId} onConnect={() => undefined} />
    <Text id="scope-state">Connection: {connectionId || 'none'}; account: {accountId || 'none'}</Text>
    <AccountScopePicker connections={[]} accounts={[]} connectionId={null} accountId={null} onConnectionChange={() => undefined} onAccountChange={() => undefined} connectHref="/connect" />
  </Stack>;
}

createRoot(document.getElementById('field-list-fixture')!).render(<Screen />);
