import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Checkbox, Dialog, Field, Heading, Inline, Input, Stack, Text, useConfirmDialog, useLeaveGuard, type ConfirmRequest, type LeaveGuardBlocker } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// ?voucher=1 gives the screen a voucher-style question where Enter means "yes, quit"; ?inside=0 renders the editor's prompt
// beside its Dialog instead of inside it.
const params = new URLSearchParams(location.search);
const voucherPrompt: Partial<ConfirmRequest> = { title: 'Quit this voucher?', confirmLabel: 'Quit', danger: false, initialFocus: 'confirm' };

type Route = { page: string; step: number };
type Fixture = { navigate?: (to: string) => void; cancelEditor?: () => void; blockerRegistrations: number };
const fixture = window as unknown as Fixture;
fixture.blockerRegistrations = 0;
const trail: string[] = [];
const listeners = new Set<() => void>();
const note = (entry: string) => { trail.push(entry); listeners.forEach(listener => listener()); };

// A minimal history router standing in for the app's, as TanStack Router does: every navigation, pushed or popped, asks
// each mounted blocker first. A blocked pop puts the address back.
const blockers = new Set<() => Promise<boolean>>();
const useFixtureBlocker: LeaveGuardBlocker = shouldBlock => {
  useEffect(() => { fixture.blockerRegistrations++; blockers.add(shouldBlock); return () => { blockers.delete(shouldBlock); }; }, [shouldBlock]);
};
const blocked = async () => { for (const shouldBlock of [...blockers]) if (await shouldBlock()) return true; return false; };
const href = (route: Route) => `?${new URLSearchParams({ ...Object.fromEntries(params), page: route.page, step: String(route.step) })}`;

function useRouter() {
  const [route, setRoute] = useState<Route>(() => history.state ?? { page: 'Ledger', step: 0 });
  useEffect(() => {
    history.replaceState(route, '', href(route));
    let restoring = false;
    const onPop = async () => {
      if (restoring) { restoring = false; return; }
      const target = history.state as Route;
      if (await blocked()) { note(`stayed on ${route.page}`); restoring = true; history.go(1); return; }
      note(`back to ${target.page} ${target.step}`);
      setRoute(target);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [route]);
  const navigate = async (page: string, step = 0) => {
    if (await blocked()) { note(`stayed on ${route.page}`); return; }
    const next = { page, step };
    history.pushState(next, '', href(next));
    note(`went to ${page}${step ? ` ${step}` : ''}`);
    setRoute(next);
  };
  return { route, navigate };
}

// Campaign's shape: a modal editor whose own guard asks over it before it closes.
function NarrationEditor({ onClose }: { onClose: () => void }) {
  const [narration, setNarration] = useState('Opening balance');
  const guard = useLeaveGuard(narration !== 'Opening balance');
  useEffect(() => { fixture.cancelEditor = guard.cancel; }, [guard.cancel]);
  const close = () => void guard.leave(onClose).then(left => note(left ? 'editor closed' : 'editor stayed'));
  const inside = params.get('inside') !== '0';
  return <>
    <Dialog open onOpenChange={open => { if (!open) close(); }} title="Edit narration" onBeforeClose={reason => { note(`editor close ${reason}`); close(); return false; }}>
      <Field label="Narration"><Input value={narration} onChange={event => setNarration(event.target.value)} /></Field>
      <Text id="editor-pending">{guard.pending ? 'asking' : 'idle'}</Text>
      {inside && guard.dialog}
    </Dialog>
    {!inside && guard.dialog}
  </>;
}

function LedgerScreen({ navigate }: { navigate: (page: string, step?: number) => Promise<void> }) {
  const [name, setName] = useState('Cash');
  const [screenDialog, setScreenDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [screenConfirm, screenPrompt] = useConfirmDialog();
  const guard = useLeaveGuard(name !== 'Cash', {
    useBlocker: useFixtureBlocker,
    prompt: params.get('voucher') === '1' ? voucherPrompt : undefined,
    confirm: screenDialog ? request => { note('screen dialog asked'); return screenConfirm(request); } : undefined,
  });
  return <Stack gap={3}>
    <Heading level={1}>Ledger</Heading>
    <Field label="Ledger name"><Input value={name} onChange={event => setName(event.target.value)} /></Field>
    <Checkbox label="Ask with the screen's dialog" checked={screenDialog} onChange={event => setScreenDialog(event.target.checked)} />
    <Inline gap={2}>
      <Button onClick={() => guard.pass(() => void navigate('Groups'))}>Save</Button>
      <Button onClick={() => guard.pass(() => history.back())}>Save and back</Button>
      <Button onClick={() => guard.pass(() => location.reload())}>Save and reload</Button>
      <Button variant="secondary" onClick={() => location.reload()}>Reload</Button>
      <Button variant="secondary" onClick={() => void guard.leave(() => void navigate('Groups'))}>Cancel</Button>
      <Button variant="secondary" onClick={() => void guard.leave(() => void navigate('Groups'), voucherPrompt)}>Quit</Button>
      <Button variant="secondary" onClick={() => setEditing(true)}>Edit narration</Button>
    </Inline>
    <Text id="pending">{guard.pending ? 'asking' : 'idle'}</Text>
    {editing && <NarrationEditor onClose={() => setEditing(false)} />}
    {guard.dialog}
    {screenPrompt}
  </Stack>;
}

function App() {
  const { route, navigate } = useRouter();
  const [, setVersion] = useState(0);
  useEffect(() => { const listener = () => setVersion(version => version + 1); listeners.add(listener); return () => { listeners.delete(listener); }; }, []);
  useEffect(() => { fixture.navigate = to => void navigate(to); });
  return <Stack as="main" gap={4}>
    <Inline gap={2}>
      <Button variant="ghost" onClick={() => void navigate('Groups')}>Groups</Button>
      <Button variant="ghost" onClick={() => void navigate('Ledger')}>Ledger</Button>
      <Button variant="ghost" onClick={() => void navigate(route.page, route.step + 1)}>Next step</Button>
    </Inline>
    {route.page === 'Ledger' ? <LedgerScreen navigate={navigate} /> : <Heading level={1}>Groups</Heading>}
    <Text id="trail">{trail.join(' | ')}</Text>
  </Stack>;
}
createRoot(document.getElementById('leave-guard-fixture')!).render(<App />);
