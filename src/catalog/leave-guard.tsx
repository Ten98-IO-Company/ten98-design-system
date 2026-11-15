import { useState } from 'react';
import { Button, Field, Inline, Input, Stack, Text, useLeaveGuard } from '../lib';
import { tsx, type ComponentEntry, type ComponentProp } from './model';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, ...(required && { required }), ...(defaultValue && { defaultValue }) });

const setup = `const [page, setPage] = useState('Ledger');
const [saved, setSaved] = useState('Cash');
const [name, setName] = useState(saved);
const guard = useLeaveGuard(name !== saved);
const go = (next: string) => void guard.leave(() => { setPage(next); setName(saved); });`;
const exampleJsx = `<Stack gap={3}>
  <Text tone="muted">Page: {page}</Text>
  <Field label="Ledger name"><Input value={name} onChange={event => setName(event.target.value)} /></Field>
  <Inline gap={2}>
    <Button variant="secondary" onClick={() => go(page === 'Ledger' ? 'Groups' : 'Ledger')}>Go to {page === 'Ledger' ? 'Groups' : 'Ledger'}</Button>
    <Button onClick={() => guard.pass(() => { setSaved(name); setPage(page === 'Ledger' ? 'Groups' : 'Ledger'); })}>Save and go</Button>
  </Inline>
  {guard.dialog}
</Stack>`;
const exampleCode = tsx(['Button', 'Field', 'Inline', 'Input', 'Stack', 'Text', 'useLeaveGuard'], exampleJsx, setup, ['useState']);

function LeaveGuardDemo() {
  const [page, setPage] = useState('Ledger');
  const [saved, setSaved] = useState('Cash');
  const [name, setName] = useState(saved);
  const guard = useLeaveGuard(name !== saved);
  const go = (next: string) => void guard.leave(() => { setPage(next); setName(saved); });
  return <Stack gap={3}>
    <Text tone="muted">Page: {page}</Text>
    <Field label="Ledger name"><Input value={name} onChange={event => setName(event.target.value)} /></Field>
    <Inline gap={2}>
      <Button variant="secondary" onClick={() => go(page === 'Ledger' ? 'Groups' : 'Ledger')}>Go to {page === 'Ledger' ? 'Groups' : 'Ledger'}</Button>
      <Button onClick={() => guard.pass(() => { setSaved(name); setPage(page === 'Ledger' ? 'Groups' : 'Ledger'); })}>Save and go</Button>
    </Inline>
    {guard.dialog}
  </Stack>;
}

export const leaveGuardEntries: ComponentEntry[] = [{
  name: 'useLeaveGuard', category: 'Navigation',
  description: 'Asks before unsaved work is lost: in-app navigation, the screen’s own exits and closing or reloading the tab.',
  usage: 'Call useLeaveGuard(dirty, options) in the screen that owns the form and render guard.dialog once. While dirty, guard.leave(exit) asks before the screen’s own exits (Cancel, Escape, a SidebarNav or SectionNav onSelect that calls event.preventDefault()), guard.pass(exit) runs a settled exit after a save or delete without asking, and the browser warns before a reload or closing the tab. Clean screens never prompt and register no beforeunload listener. The package imports no router: pass useBlocker, a hook adapter for your router, to also hold links and the browser back. With TanStack Router: const useRouterBlocker: LeaveGuardBlocker = shouldBlock => { useBlocker({ shouldBlockFn: shouldBlock, enableBeforeUnload: false }); }, defined once at module level. An app with its own navigation calls guard.leave from its navigate function instead. For a draft inside a Dialog, use the Dialog’s dirty prop; this guard is for leaving a screen.',
  props: [
    prop('dirty', 'boolean', 'Whether the screen holds unsaved work. Usually typed-value comparison; false for read-only screens.', true),
    prop('options.useBlocker', 'LeaveGuardBlocker', 'Router adapter, a hook receiving shouldBlock. Define it once at module level; it must not change between renders.'),
    prop('options.prompt', 'Partial<ConfirmRequest>', 'Wording merged over the default question.', false, 'Discard unsaved changes? / Discard changes / Keep editing'),
    prop('options.confirm', '(request: ConfirmRequest) => Promise<boolean>', 'An existing useConfirmDialog confirm, so the screen shares one dialog; guard.dialog is then null.'),
    prop('result.leave', '(exit, prompt?) => Promise<boolean>', 'Asks while dirty, then runs exit on a yes. Resolves whether it left; an optional prompt overrides the wording for this exit.'),
    prop('result.pass', '(exit) => void', 'Runs exit without asking and lets the navigation it starts through the router adapter and beforeunload for a moment.'),
    prop('result.shouldBlock', '() => Promise<boolean>', 'Resolves true to stay. What useBlocker receives; also usable from custom routers.'),
    prop('result.dialog', 'ReactNode', 'The shared ConfirmDialog prompt; render it once.'),
  ],
  tokens: [],
  accessibility: [
    'The prompt is the shared ConfirmDialog: a modal dialog with its title and description announced, Escape and Keep editing both stay, and focus returns to the control that started the exit.',
    'Discard changes is the danger action and never the default; nothing is discarded without an explicit choice.',
    'The browser’s own unload warning is used for reloads and closing the tab, since pages cannot show their own dialog there.',
  ],
  related: ['ConfirmDialog', 'Dialog', 'SidebarNav', 'SectionNav'], example: exampleCode,
  states: [{ name: 'Leave a dirty screen', description: 'Change the name, then go to the other page: the prompt asks first. Keep editing stays; Discard changes leaves. Save and go leaves without asking.', preview: <LeaveGuardDemo />, code: exampleCode }],
}];
