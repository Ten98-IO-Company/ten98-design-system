import { createRoot } from 'react-dom/client';
import { Field, Input, ShortcutProvider, Stack, useCommand } from '@ten98/ui';
import '@ten98/ui/styles.css';

// Measures which chords a page receives and whether cancelling them stops the browser's own action. With ?bind=1 every
// chord is a registered command, so the registry is what cancels it; without, the page only observes.
const params = new URLSearchParams(location.search);
const chord = params.get('chord') ?? '';
const bind = params.get('bind') === '1';

declare global { interface Window { report: { keydowns: number; cancelable: boolean; prevented: boolean; ran: boolean; effects: string[] } } }
window.report = { keydowns: 0, cancelable: false, prevented: false, ran: false, effects: [] };
const effect = (name: string) => { if (!window.report.effects.includes(name)) window.report.effects.push(name); };
// Capture on window records arrival before anything can stop it; the window bubble listener runs after the registry's document listener.
window.addEventListener('keydown', event => { if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) { window.report.keydowns++; window.report.cancelable = event.cancelable; } }, true);
window.addEventListener('keydown', event => { if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) window.report.prevented = event.defaultPrevented; });
window.addEventListener('beforeprint', () => effect('print'));
window.addEventListener('blur', () => effect('window-blur'));
document.addEventListener('input', () => effect('input'));
document.addEventListener('selectionchange', () => { const input = document.querySelector('input'); if (input && input.selectionStart === 0 && input.selectionEnd === input.value.length) effect('select-all'); });
document.addEventListener('focusout', () => effect('focus-moved'));
document.addEventListener('submit', event => { event.preventDefault(); effect('submit'); });

function Bound() {
  useCommand({ id: 'probe', label: 'Probe', run: () => { window.report.ran = true; }, allowInTextInput: true });
  return null;
}

function Probe() {
  return <ShortcutProvider keymaps={{ probe: { probe: chord } }}>
    {bind && <Bound />}
    <Stack as="form" gap={2}>
      <Field label="Probe"><Input name="probe" defaultValue="abc" autoFocus /></Field>
    </Stack>
  </ShortcutProvider>;
}
createRoot(document.getElementById('key-reachability-fixture')!).render(<Probe />);
