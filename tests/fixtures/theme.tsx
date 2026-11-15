import { useState } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Button, RadioGroup, Stack, StatusLine, Text, isAccountTheme, useTheme, type AccountTheme } from '@ten98/ui';
import '@ten98/ui/styles.css';

// ?account=<theme> plays a loaded account value, ?fail=1 makes the save reject, ?cache=off passes storageKey null
// and ?ssr=1 hydrates server-rendered HTML instead of rendering on the client.
const params = new URLSearchParams(location.search);
const account = params.get('account');
const cacheOff = params.get('cache') === 'off';

function Controls({ saved, onSaved }: { saved: AccountTheme | null; onSaved: (theme: AccountTheme | null) => void }) {
  const [note, setNote] = useState('');
  const { theme, resolvedTheme, setTheme } = useTheme({
    value: saved,
    ...(cacheOff ? { storageKey: null } : {}),
    onChange: async next => {
      if (params.get('fail') === '1') throw new Error('The account could not be saved.');
      onSaved(saved === null ? null : next);
    },
  });
  const choose = (next: AccountTheme) => setTheme(next)
    .then(remembered => setNote(remembered ? 'Saved for this browser.' : 'Changed for this tab only.'))
    .catch((error: Error) => setNote(error.message));
  return <>
    <RadioGroup name="theme" legend="Appearance" orientation="horizontal" value={theme} onValueChange={value => void choose(value as AccountTheme)}
      options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
    <Text>Showing <span id="resolved">{resolvedTheme}</span></Text>
    {note && <StatusLine>{note}</StatusLine>}
  </>;
}

function Fixture() {
  const [saved, setSaved] = useState<AccountTheme | null>(isAccountTheme(account) ? account : null);
  const [mounted, setMounted] = useState(true);
  return <Stack gap={4} as="main">
    {mounted && <Controls saved={saved} onSaved={setSaved} />}
    <Button variant="secondary" onClick={() => setSaved('light')}>Account loads light</Button>
    <Button variant="secondary" onClick={() => setSaved('dark')}>Account loads dark</Button>
    <Button variant="secondary" onClick={() => setSaved(null)}>Sign out</Button>
    <Button variant="secondary" onClick={() => setMounted(false)}>Unmount</Button>
  </Stack>;
}

const container = document.getElementById('theme-fixture')!;
if (params.get('ssr') === '1') {
  // The server snapshot renders here exactly as on a server; the document keeps what the pre-paint script set.
  container.innerHTML = renderToString(<Fixture />);
  hydrateRoot(container, <Fixture />, { onRecoverableError: error => console.error('Hydration error:', error) });
} else createRoot(container).render(<Fixture />);
