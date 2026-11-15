import { useState } from 'react';
import { RadioGroup, Stack, Text, type AccountTheme } from '../lib';
import { tsx, type ComponentEntry, type ComponentProp } from './model';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, required, defaultValue });
const options = [{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }];

// The catalogue keeps its own appearance menu, so the preview themes a box instead of the page.
function ThemeDemo() {
  const [theme, setTheme] = useState<AccountTheme>('dark');
  return <div data-theme={theme} style={{ background: 'var(--t98-bg)', color: 'var(--t98-text)', padding: 'var(--t98-space-4)', borderRadius: 'var(--t98-radius)', border: '1px solid var(--t98-border)' }}>
    <Stack gap={3}>
      <RadioGroup name="theme-demo" legend="Appearance" orientation="horizontal" value={theme} onValueChange={value => setTheme(value as AccountTheme)} options={options} />
      <Text tone="muted">In an app, useTheme puts this value on &lt;html data-theme&gt; and caches it; System follows the device.</Text>
    </Stack>
  </div>;
}

const accountCode = tsx(['AccountProfileFlow', 'useTheme', 'type AccountProfileValues', 'type AccountTheme'], `<AccountProfileFlow
  email="member@example.test"
  defaultValues={{ name: 'Sam Rivera', theme }}
  onSubmit={values => save(values)}
/>`, `// The account's saved theme, null until it loads. The app owns the request.
const [saved, setSaved] = useState<AccountTheme | null>(null);
const { theme } = useTheme({ value: saved });
const save = async (values: AccountProfileValues) => { /* POST the profile, then: */ setSaved(values.theme); };`, ['useState']);

const browserCode = tsx(['RadioGroup', 'StatusLine', 'useTheme', 'type AccountTheme'], `<>
  <RadioGroup
    name="theme"
    legend="Appearance"
    orientation="horizontal"
    value={theme}
    onValueChange={value => void setTheme(value as AccountTheme).then(remembered => setNote(remembered ? 'Saved for this browser.' : 'Changed for this tab; this browser could not save it.'))}
    options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
  />
  {note && <StatusLine tone="success">{note}</StatusLine>}
</>`, `// No account value: the choice lives in this browser only.
const { theme, setTheme } = useTheme();
const [note, setNote] = useState('');`, ['useState']);

const accountOnlyCode = tsx(['AccountProfileFlow', 'useTheme', 'type AccountProfileValues', 'type AccountTheme'], `<AccountProfileFlow
  email="member@example.test"
  defaultValues={{ name: 'Sam Rivera', theme }}
  onSubmit={values => save(values)}
/>`, `// No browser cache: until the account loads, after sign-out and on unmount the device setting applies.
const [saved, setSaved] = useState<AccountTheme | null>(null);
const { theme } = useTheme({ value: saved, storageKey: null });
const save = async (values: AccountProfileValues) => { /* POST the profile, then: */ setSaved(values.theme); };`, ['useState']);

const documentCode = `import type { ReactNode } from 'react';
import { createThemeScript } from '@ten98/ui';

// Server-rendered document: the script runs before the stylesheets paint. Give it the response's CSP nonce;
// TanStack Start's head().scripts adds ssr.nonce itself, and a page without a nonce policy needs none.
export default function Document({ nonce, children }: { nonce?: string; children?: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: createThemeScript() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
`;

export const themeEntries: ComponentEntry[] = [
  {
    name: 'useTheme', category: 'Application adapters', description: 'Light, dark and system appearance: applied to the page, cached for the next load and never flashing.',
    usage: 'Call useTheme({ value, onChange }) once in the shell. It sets <html data-theme> (the token selectors) and caches only the theme string in localStorage under "ten98-theme". value is the theme saved on the account, null while unknown; once known it always wins and is cached, and null never clears the cache. Until then the cached theme applies, then "system". setTheme(theme) applies and caches a choice at once, awaits onChange (save it there) and restores the previous theme if onChange rejects; it resolves whether this browser remembered the choice (false when storage is blocked; it still applies to the tab). theme is the choice and resolvedTheme what shows, with "system" following prefers-color-scheme. Put createThemeScript(storageKey?) first in <head> as an inline classic script so a cached dark theme paints dark before the app loads; it is a string and needs no React. Under a nonce CSP give it the nonce: TanStack Start adds ssr.nonce to head().scripts, a server that rewrites <script tags covers it too, and a page without a nonce policy needs none. Hydration keeps what the script applied. With storageKey: null nothing is cached or read: an unknown value is "system", sign-out returns to "system", unmounting resets to "system", setTheme resolves false, and no pre-paint script is needed. With the cache on, the hook never fetches and leaves the theme in place when it unmounts.',
    props: [
      prop('value', 'AccountTheme | null', 'The theme saved on the account. null or undefined while loading, signed out or unavailable.'),
      prop('onChange', '(theme: AccountTheme) => unknown', 'Saves a choice made with setTheme. A rejection restores the previous theme and rejects setTheme.'),
      prop('storageKey', 'string | null', 'localStorage key; pass the same key to createThemeScript. null turns the browser cache off.', false, "'ten98-theme'"),
      prop('returns', '{ theme; resolvedTheme; setTheme }', "theme: AccountTheme; resolvedTheme: 'light' | 'dark'; setTheme(theme) => Promise<boolean>."),
    ],
    tokens: ['--t98-bg', '--t98-text', '--t98-border'],
    accessibility: [
      'Themes only switch token values; every pair meets the same contrast in light and dark.',
      'System follows the operating system and changes live when it does; the pre-paint script keeps a dark theme from flashing a bright page.',
      'Pair it with a labelled RadioGroup or the AccountProfileFlow theme field rather than an unlabelled toggle.',
    ],
    related: ['AccountProfileFlow', 'RadioGroup'], example: accountCode,
    states: [
      { name: 'Saved on the account', description: 'The profile form saves the theme with the account; the hook applies and caches the saved value.', preview: <ThemeDemo />, code: accountCode },
      { name: 'Account only (no browser cache)', description: 'storageKey: null keeps nothing in the browser; without a known account value the device setting applies.', preview: <ThemeDemo />, code: accountOnlyCode },
      { name: 'This browser only', description: 'Without an account value, setTheme keeps the choice in this browser and reports when storage is blocked.', preview: <ThemeDemo />, code: browserCode },
      { name: 'Pre-paint script', description: 'The inline head script that applies the cached theme before the first paint.', preview: <Text tone="muted">Runs in the document head before any stylesheet paints; open the theme fixture to see it.</Text>, code: documentCode },
    ],
  },
];
