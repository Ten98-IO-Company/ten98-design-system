import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Field, Heading, Inline, Input, Stack, Text, useLeaveGuard, type LeaveGuardBlocker } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// A minimal in-memory router standing in for the app's: navigate() asks every mounted blocker first, as TanStack Router does.
const blockers = new Set<() => Promise<boolean>>();
const useFixtureBlocker: LeaveGuardBlocker = shouldBlock => {
  useEffect(() => { blockers.add(shouldBlock); return () => { blockers.delete(shouldBlock); }; }, [shouldBlock]);
};

function LedgerScreen({ navigate }: { navigate: (to: string) => void }) {
  const [name, setName] = useState('Cash');
  const guard = useLeaveGuard(name !== 'Cash', { useBlocker: useFixtureBlocker });
  return <Stack gap={3}>
    <Heading level={1}>Ledger</Heading>
    <Field label="Ledger name"><Input value={name} onChange={event => setName(event.target.value)} /></Field>
    <Inline gap={2}>
      <Button onClick={() => guard.pass(() => navigate('Groups'))}>Save</Button>
      <Button variant="secondary" onClick={() => void guard.leave(() => navigate('Groups'))}>Cancel</Button>
    </Inline>
    {guard.dialog}
  </Stack>;
}

function App() {
  const [page, setPage] = useState('Ledger');
  const [trail, setTrail] = useState<string[]>([]);
  const navigate = async (to: string) => {
    for (const shouldBlock of [...blockers]) if (await shouldBlock()) { setTrail(current => [...current, `stayed on ${page}`]); return; }
    setTrail(current => [...current, `went to ${to}`]);
    setPage(to);
  };
  return <Stack as="main" gap={4}>
    <Inline gap={2}>
      <Button variant="ghost" onClick={() => void navigate('Groups')}>Groups</Button>
      <Button variant="ghost" onClick={() => void navigate('Ledger')}>Ledger</Button>
    </Inline>
    {page === 'Ledger' ? <LedgerScreen navigate={to => void navigate(to)} /> : <Heading level={1}>Groups</Heading>}
    <Text id="trail">{trail.join(' | ')}</Text>
  </Stack>;
}
createRoot(document.getElementById('leave-guard-fixture')!).render(<App />);
