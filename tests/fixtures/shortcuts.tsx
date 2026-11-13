import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button, Combobox, Dialog, Field, Heading, Inline, Input, KeyHint, SegmentedControl, ShortcutProvider, ShortcutScope, Stack, Text,
  findReservedChords, useCommand, useCommandKeys, useShortcutCommands, type Keymap, type KeymapEntry,
} from '@ten98/ui';
import '@ten98/ui/styles.css';

// Composed the way an application screen must be: library components only. The log shows which command ran.
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
if (params.get('dir') === 'rtl') document.documentElement.dir = 'rtl';

const keymaps: Record<string, Keymap> = {
  classic: { 'app.help': 'F1', 'voucher.payment': 'F5', 'voucher.receipt': 'F6', 'voucher.save': 'Ctrl+A', 'voucher.close': 'Escape', 'entry.next': 'Enter', 'entry.find': '/', 'dialog.confirm': 'Ctrl+Enter', 'voucher.copy': 'Alt+C', 'voucher.new': 'Ctrl+N', 'menu.new': 'N', 'voucher.print': { default: 'Alt+P', apple: 'Ctrl+Shift+P' } },
  'web-safe': { 'app.help': 'Shift+F1', 'voucher.payment': 'Alt+F5', 'voucher.receipt': 'Alt+F6', 'voucher.save': 'Ctrl+Enter', 'voucher.close': 'Escape', 'entry.next': 'Enter', 'entry.find': '/', 'dialog.confirm': 'Ctrl+Enter', 'voucher.copy': 'Alt+C', 'voucher.new': 'Alt+N', 'menu.new': 'N' },
};

declare global { interface Window { ran: string[] } }
window.ran = [];
const log = (id: string) => () => { window.ran.push(id); };

function Command({ id, label, enabled, allowInTextInput, matchPhysicalKey, keys }: { id: string; label: string; enabled?: boolean; allowInTextInput?: boolean; matchPhysicalKey?: boolean; keys?: KeymapEntry }) {
  useCommand({ id, label, group: 'Voucher', run: log(id), enabled, allowInTextInput, matchPhysicalKey, keys });
  return null;
}
function SaveButton() {
  const keys = useCommandKeys('voucher.save');
  return <Button onClick={log('voucher.save:button')}>Save {keys[0] && <KeyHint chord={keys[0]} />}</Button>;
}
function HelpList() {
  const commands = useShortcutCommands();
  return <Stack as="section" gap={2} aria-label="Keyboard shortcuts">
    {commands.map(command => <Text key={`${command.scope}-${command.id}`} data-command={command.id}>{command.label} · {command.scope ?? 'Application'} · {command.keys.join(' or ') || 'none'}</Text>)}
  </Stack>;
}

function Screen() {
  const [keymap, setKeymap] = useState('classic');
  const [override, setOverride] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [saveEnabled, setSaveEnabled] = useState(true);
  const [city, setCity] = useState('');
  const overrides = override ? { 'voucher.payment': ['F9'] } : undefined;
  const reserved = findReservedChords(keymaps[keymap]);
  return <ShortcutProvider keymaps={keymaps} keymap={keymap} overrides={overrides} platform={params.get('platform') === 'apple' ? 'apple' : undefined}>
    <Command id="app.help" label="Help" />
    <Stack as="main" gap={4}>
      <Heading level={1}>Shortcuts</Heading>
      <SegmentedControl label="Keymap" value={keymap} onValueChange={setKeymap} options={[{ value: 'classic', label: 'Classic' }, { value: 'web-safe', label: 'Web-safe' }]} />
      <Inline gap={2}>
        <Button variant="secondary" onClick={() => setOverride(!override)}>{override ? 'Reset payment key' : 'Move payment to F9'}</Button>
        <Button variant="secondary" onClick={() => setSaveEnabled(!saveEnabled)}>{saveEnabled ? 'Disable save' : 'Enable save'}</Button>
        <Button variant="secondary" onClick={() => setDialog(true)}>Open dialog</Button>
      </Inline>
      <Text id="reserved">{reserved.map(entry => `${entry.command}:${entry.chord}:${entry.kind}`).join(', ') || 'none'}</Text>
      <ShortcutScope name="Voucher">
        <Command id="voucher.payment" label="Payment" />
        <Command id="voucher.receipt" label="Receipt" />
        <Command id="voucher.save" label="Save voucher" enabled={saveEnabled} />
        <Command id="voucher.close" label="Close voucher" />
        <Command id="voucher.copy" label="Copy voucher" />
        {/* Option+letter types characters on Apple platforms, so print uses another chord there; web-safe falls back to these defaults. */}
        <Command id="voucher.print" label="Print voucher" keys={{ default: 'F8', apple: 'F9' }} />
        <Inline gap={2}><SaveButton /><Text id="payment-hint">Payment <KeyHint command="voucher.payment" /></Text><Text id="print-hint">Print <KeyHint command="voucher.print" /></Text></Inline>
        <ShortcutScope name="Entry" activation="focus">
          <Command id="entry.next" label="Next field" />
          <Command id="entry.find" label="Find account" />
          <Command id="voucher.save" label="Save entry" enabled={saveEnabled} />
          <Field label="Narration"><Input name="narration" /></Field>
          <Combobox label="City" options={['Dubai', 'Doha', 'Riyadh']} value={city} onValueChange={setCity} />
          <Button variant="secondary" onClick={log('entry.button')}>Entry button</Button>
        </ShortcutScope>
        {/* A menu's hot letter names a key position, so it also works on layouts that type another script there. */}
        <ShortcutScope name="Actions" activation="focus">
          <Command id="menu.new" label="New entry" matchPhysicalKey />
          <Button variant="secondary" onClick={log('menu.button')}>New entry <KeyHint command="menu.new" /></Button>
        </ShortcutScope>
      </ShortcutScope>
      <Field label="Outside"><Input name="outside" /></Field>
      <HelpList />
      <ShortcutScope name="Confirm" modal>
        <Command id="dialog.confirm" label="Confirm" />
        <Dialog open={dialog} onOpenChange={setDialog} title="Confirm posting">
          <Field label="Note"><Input name="note" /></Field>
        </Dialog>
      </ShortcutScope>
    </Stack>
  </ShortcutProvider>;
}

createRoot(document.getElementById('shortcuts-fixture')!).render(<Screen />);
