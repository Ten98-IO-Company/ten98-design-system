import { useState } from 'react';
import { Button, Field, Inline, Input, KeyHint, SegmentedControl, ShortcutProvider, ShortcutScope, Stack, Text, useCommand, useShortcutCommands, type Keymap } from '../lib';
import { tsx, type ComponentEntry, type ComponentProp } from './model';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, ...(required && { required }), ...(defaultValue && { defaultValue }) });
const hintTokens = ['--t98-border', '--t98-radius-sm', '--t98-muted', '--t98-subtle', '--t98-mono', '--t98-text-xs', '--t98-space-1'];

const keymaps: Record<string, Keymap> = {
  classic: { 'voucher.payment': 'F5', 'voucher.save': 'Ctrl+A', 'entry.next': 'Enter' },
  'web-safe': { 'voucher.payment': 'Alt+F5', 'voucher.save': 'Ctrl+Enter', 'entry.next': 'Enter' },
};
const keymapsCode = `const keymaps = {
  classic: { 'voucher.payment': 'F5', 'voucher.save': 'Ctrl+A', 'entry.next': 'Enter' },
  'web-safe': { 'voucher.payment': 'Alt+F5', 'voucher.save': 'Ctrl+Enter', 'entry.next': 'Enter' },
};`;

function Commands({ onRun }: { onRun: (label: string) => void }) {
  useCommand({ id: 'voucher.payment', label: 'Payment', group: 'Voucher', run: () => onRun('Payment') });
  useCommand({ id: 'voucher.save', label: 'Save voucher', group: 'Voucher', run: () => onRun('Save voucher') });
  return null;
}
function EntryCommands({ onRun }: { onRun: (label: string) => void }) {
  useCommand({ id: 'entry.next', label: 'Next field', run: () => onRun('Next field') });
  return null;
}
function HelpList() {
  return <Stack gap={1}>{useShortcutCommands().map(command => <Text key={`${command.scope}${command.id}`} size="sm">{command.label}: {command.keys.join(' or ')}</Text>)}</Stack>;
}
function RegistryDemo() {
  const [keymap, setKeymap] = useState('classic');
  const [last, setLast] = useState('Nothing yet');
  return <ShortcutProvider keymaps={keymaps} keymap={keymap}>
    <Stack gap={3}>
      <SegmentedControl label="Keymap" value={keymap} onValueChange={setKeymap} options={[{ value: 'classic', label: 'Classic' }, { value: 'web-safe', label: 'Web-safe' }]} />
      <ShortcutScope name="Voucher">
        <Commands onRun={setLast} />
        <Inline gap={2}><Text>Save <KeyHint command="voucher.save" /></Text><Text>Payment <KeyHint command="voucher.payment" /></Text></Inline>
        <ShortcutScope name="Entry" activation="focus">
          <EntryCommands onRun={setLast} />
          <Field label="Narration"><Input /></Field>
        </ShortcutScope>
      </ShortcutScope>
      <Text tone="muted">Last command: {last}</Text>
      <HelpList />
    </Stack>
  </ShortcutProvider>;
}
const registryCode = tsx(['KeyHint', 'ShortcutProvider', 'ShortcutScope', 'Field', 'Input', 'Text', 'useCommand'], `<ShortcutProvider keymaps={keymaps} keymap="classic" overrides={userBindings}>
  <ShortcutScope name="Voucher">
    <VoucherCommands />
    <Text>Save <KeyHint command="voucher.save" /></Text>
    <ShortcutScope name="Entry" activation="focus">
      <Field label="Narration"><Input /></Field>
    </ShortcutScope>
  </ShortcutScope>
</ShortcutProvider>`, `const userBindings = { 'voucher.payment': ['F9'] };
function VoucherCommands() {
  useCommand({ id: 'voucher.save', label: 'Save voucher', group: 'Voucher', run: () => {} });
  useCommand({ id: 'voucher.payment', label: 'Payment', group: 'Voucher', run: () => {} });
  return null;
}`).replace('export default function', `${keymapsCode}\n\nexport default function`);

const scopeCode = tsx(['Dialog', 'ShortcutScope', 'useCommand'], `<ShortcutScope name="Confirm posting" modal>
  <ConfirmCommand />
  <Dialog open onOpenChange={() => {}} title="Confirm posting">Post this voucher?</Dialog>
</ShortcutScope>`, `function ConfirmCommand() {
  useCommand({ id: 'dialog.confirm', label: 'Confirm', keys: 'Ctrl+Enter', run: () => {} });
  return null;
}`);

export const shortcutEntries: ComponentEntry[] = [
  {
    name: 'ShortcutProvider', category: 'Navigation', description: 'One command registry and remappable keymap for menus, key hints, help lists and a command palette.',
    usage: 'Mount once near the root. Components register commands with useCommand({ id, label, group, run, enabled, keys }); keymaps are app data (command id → chords), one named keymap is active and the user’s overrides merge on top (an empty list unbinds). The innermost active ShortcutScope that binds a chord wins, and a disabled command still claims its chord. useShortcutCommands() lists every command with its current chords and a run() for menus and palettes; useCommandKeys(id) gives one command’s chords. Chords use event.key, falling back to the physical key under Ctrl, Alt or Meta, so they work on Arabic layouts and with Option. The registry cancels a key only when a command runs, never acts on keys a widget already handled, during IME composition or for AltGr characters. reservedChord() and findReservedChords() name chords browsers keep (Ctrl+N, Ctrl+T, Ctrl+W, Alt+F4, F11) or use themselves (F5, Ctrl+P, Alt+D) so the app can warn and offer an alternate. Development builds warn about two enabled commands on one chord in one scope. Routing, persistence of the user’s bindings and the help screen itself stay in the app.',
    props: [
      prop('keymaps', 'Record<string, Keymap>', 'Named keymaps, for example classic and web-safe. Keymap = Record<commandId, chord | chord[]>; "Mod" is Command on Apple platforms and Ctrl elsewhere.'),
      prop('keymap', 'string', 'Name of the active keymap.', false, 'the first'),
      prop('overrides', 'Keymap', 'The user’s own bindings, merged over the active keymap.'),
      prop('platform', "'apple' | 'other'", 'Detected after mount when omitted. Sets Mod and the KeyHint labels.'),
      prop('children', 'ReactNode', 'The app.', true),
    ],
    tokens: hintTokens,
    accessibility: [
      'Keys a focused field or control uses itself stay with it: typing, caret and list keys in text fields, Enter in a textarea, Enter, Space and arrows on buttons, links, checkboxes and selects. A command opts in with allowInTextInput (never on controls).',
      'Chords that only type characters run only inside a focus-activated ShortcutScope that holds focus (WCAG 2.1.4), and every chord can be remapped.',
      'The registry never moves or traps focus and announces nothing; show bindings with KeyHint and the app’s help list.',
    ],
    related: ['ShortcutScope', 'KeyHint'], example: registryCode,
    states: [{ name: 'Keymaps, scopes and a help list', description: 'Press F5 or Ctrl+A, focus Narration and press Enter, then switch to the web-safe keymap: hints and the list follow.', preview: <RegistryDemo />, code: registryCode }],
  },
  {
    name: 'ShortcutScope', category: 'Navigation', description: 'A nested shortcut context such as a screen, an entry grid or an open list.',
    usage: 'Commands registered by descendants belong to the nearest scope. mounted scopes (screens) are active while rendered; focus scopes (an entry grid, an open list) only while focus is inside; the innermost wins. Focus inside a dialog or popover runs only scopes inside it; wrap a Dialog or Popover in a modal scope so its commands work wherever focus is in it. Renders a display: contents wrapper, so it adds no box.',
    props: [
      prop('name', 'string', 'Context name for help lists and development warnings.', true),
      prop('activation', "'mounted' | 'focus'", 'When the scope is active.', false, "'mounted'"),
      prop('modal', 'boolean', 'Active only with focus inside, and then no outer command runs.', false, 'false'),
      prop('children', 'ReactNode', 'The scoped content.', true),
    ],
    tokens: [],
    accessibility: ['Adds no element to the accessibility tree and leaves the tab order and visible focus untouched.', 'Escape in a dialog keeps its native close unless the dialog’s own scope binds Escape.'],
    related: ['ShortcutProvider', 'Dialog', 'Popover'], example: scopeCode,
    states: [{ name: 'Dialog scope', description: 'A modal scope around a Dialog gives Ctrl+Enter to the dialog only while it is open and focused.', preview: <Text tone="muted">Open the shortcuts fixture to try a modal scope; a preview here would open a modal dialog.</Text>, code: scopeCode }],
  },
  {
    name: 'KeyHint', category: 'Navigation', description: 'A key chord shown as key caps with platform labels.',
    usage: 'Pass chord, or command to show that command’s first current chord (nothing when it has none), so menus and buttons follow the keymap and the user’s overrides. Apple platforms show ⌘ ⌥ ⇧ ⌃, others Ctrl, Alt and Shift. formatChord(chord, platform) returns the same labels as data.',
    props: [
      prop('chord', 'KeyChord', 'The chord to show, for example "Ctrl+S" or "Mod+K".'),
      prop('command', 'string', 'A registered command id; shows its first current chord.'),
      prop('platform', "'apple' | 'other'", 'Defaults to the provider’s platform.'),
      prop('className', 'string', 'Layout hook only.'),
    ],
    tokens: hintTokens,
    accessibility: ['Key caps are hidden from assistive technology; a visually hidden spoken form such as "Control+Shift+S" or "Command+S" is read instead.', 'Reads left to right in right-to-left pages, as the keys are printed. Borders use ButtonText in forced colors.', 'It is not a live region and announces nothing.'],
    related: ['ShortcutProvider', 'SearchField'], example: tsx(['KeyHint'], '<KeyHint chord="Mod+Shift+S" />'),
    states: [
      { name: 'Windows and Linux', description: 'Modifier names and arrows.', preview: <Inline gap={3}><KeyHint chord="Ctrl+Shift+S" platform="other" /><KeyHint chord="F5" platform="other" /><KeyHint chord="Alt+ArrowDown" platform="other" /></Inline>, code: tsx(['Inline', 'KeyHint'], '<Inline gap={3}>\n  <KeyHint chord="Ctrl+Shift+S" platform="other" />\n  <KeyHint chord="F5" platform="other" />\n  <KeyHint chord="Alt+ArrowDown" platform="other" />\n</Inline>') },
      { name: 'Apple', description: 'Symbols in the platform order.', preview: <Inline gap={3}><KeyHint chord="Mod+Shift+S" platform="apple" /><KeyHint chord="Alt+Enter" platform="apple" /></Inline>, code: tsx(['Inline', 'KeyHint'], '<Inline gap={3}>\n  <KeyHint chord="Mod+Shift+S" platform="apple" />\n  <KeyHint chord="Alt+Enter" platform="apple" />\n</Inline>') },
      { name: 'In a button', description: 'The hint follows the command’s current chord.', preview: <Button variant="secondary">Save <KeyHint chord="Ctrl+S" platform="other" /></Button>, code: tsx(['Button', 'KeyHint'], '<Button variant="secondary">Save <KeyHint command="voucher.save" /></Button>') },
    ],
  },
];
