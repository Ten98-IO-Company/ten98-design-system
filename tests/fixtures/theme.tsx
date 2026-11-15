import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, RadioGroup, Stack, StatusLine, Text, isAccountTheme, useTheme, type AccountTheme } from '@ten98/ui';
import '@ten98/ui/styles.css';

// ?account=<theme> plays a loaded account value; ?fail=1 makes the save reject.
const params = new URLSearchParams(location.search);
const account = params.get('account');

function Fixture() {
  const [saved, setSaved] = useState<AccountTheme | null>(isAccountTheme(account) ? account : null);
  const [note, setNote] = useState('');
  const { theme, resolvedTheme, setTheme } = useTheme({
    value: saved,
    onChange: async next => {
      if (params.get('fail') === '1') throw new Error('The account could not be saved.');
      setSaved(saved === null ? null : next);
    },
  });
  const choose = (next: AccountTheme) => setTheme(next)
    .then(remembered => setNote(remembered ? 'Saved for this browser.' : 'Changed for this tab only.'))
    .catch((error: Error) => setNote(error.message));
  return <Stack gap={4} as="main">
    <RadioGroup name="theme" legend="Appearance" orientation="horizontal" value={theme} onValueChange={value => void choose(value as AccountTheme)}
      options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
    <Text>Showing <span id="resolved">{resolvedTheme}</span></Text>
    <Button variant="secondary" onClick={() => setSaved('light')}>Account loads light</Button>
    {note && <StatusLine>{note}</StatusLine>}
  </Stack>;
}
createRoot(document.getElementById('theme-fixture')!).render(<Fixture />);
