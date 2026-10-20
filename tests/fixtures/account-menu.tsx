import { useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { AccountMenu, SidebarFooter } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

const params = new URLSearchParams(location.search);
const formMode = params.has('form');
const unavailable = params.has('unavailable');
document.documentElement.dataset.theme = params.get('theme') || 'light';

function Shell() {
  const [draft, setDraft] = useState('');
  const [route, setRoute] = useState('Overview');
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState('Ready');
  const [mounted, setMounted] = useState(true);
  const [long, setLong] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef<(() => void) | null>(null);
  const draftInput = useRef<HTMLInputElement>(null);

  function guarded(action: () => void) {
    if (draft) {
      pending.current = action;
      dialog.current?.showModal();
    } else action();
  }

  function signOut() {
    setCount(value => value + 1);
    setBusy(true);
    setStatus('Signing out…');
  }

  const link = (label: string, href: string) => <a href={href} onClick={event => {
    event.preventDefault();
    guarded(() => setRoute(label));
  }}>{label}</a>;

  const accountActions = formMode
    ? <form onSubmit={event => {
      event.preventDefault();
      setCount(value => value + 1);
      setStatus('Account form submitted');
    }}>
      <label>Account name<input name="name" required className="t98-input" /></label>
      <button type="submit">Save account</button>
    </form>
    : <>
      {link('Profile and appearance', '/account')}
      {link('Account security', '/account/security')}
      <button type="button" disabled={busy} aria-busy={busy || undefined} onClick={() => guarded(signOut)}>
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
      {unavailable && <button type="button" aria-disabled onClick={signOut}>Unavailable action</button>}
      {unavailable && <button type="button" aria-busy onClick={signOut}>Pending action</button>}
      {unavailable && <a href="/must-not-navigate" aria-disabled onClick={signOut}>Unavailable link</a>}
    </>;

  const Frame = formMode ? 'div' : 'form';
  return <div style={{ padding: 16, minWidth: 0 }}>
    <Frame onSubmit={formMode ? undefined : (event: FormEvent<HTMLDivElement | HTMLFormElement>) => {
      event.preventDefault();
      setStatus('Unexpected form submit');
    }}>
      <header className="topbar" style={{ position: 'relative', padding: 0, minHeight: 56, overflow: 'visible' }}>
        <strong>Campaign</strong>
        {mounted && <AccountMenu
          name={long ? 'Alexandra Morgan-Williams and the regional operations team' : 'Alex Morgan'}
          email={long ? 'alexandra.morgan-williams@regional-operations.example.test' : 'alex@example.test'}
          avatar={<span className="avatar mini" aria-hidden>AM</span>}
        >{accountActions}</AccountMenu>}
      </header>
      <h1 style={{ marginTop: 24 }}>{route}</h1>
      <label style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        Local draft<input ref={draftInput} value={draft} onChange={event => setDraft(event.target.value)} className="t98-input" />
      </label>
      <p role="status" aria-label="Account action status">{status}</p>
      <output aria-label="Sign out calls">{count}</output>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 96 }}>
        <button type="button" id="outside" onClick={() => setStatus('Outside action')}>Outside action</button>
        <button type="button" onClick={() => { setBusy(false); setStatus('Sign out failed. Try again.'); }}>Finish failed sign out</button>
        <button type="button" onClick={() => setLong(value => !value)}>Use long identity</button>
        <button type="button" onClick={() => setMounted(value => !value)}>Toggle account control</button>
      </div>
    </Frame>
    <aside aria-label="Sidebar footer" style={{ marginTop: 48, maxWidth: 240 }}>
      <SidebarFooter version="0.8.12">
        <a href="/settings" onClick={event => { event.preventDefault(); setRoute('Settings'); }}>Settings</a>
      </SidebarFooter>
    </aside>
    <dialog ref={dialog} aria-labelledby="discard-title" onClose={() => {
      if (dialog.current?.returnValue === 'discard') {
        setDraft('');
        pending.current?.();
      }
      pending.current = null;
      draftInput.current?.focus();
    }}>
      <h2 id="discard-title">Unsaved draft</h2>
      <form method="dialog">
        <button value="keep" autoFocus>Keep editing</button>
        <button value="discard">Discard draft</button>
      </form>
    </dialog>
  </div>;
}

const fixtureRoot = document.getElementById('account-fixture');
if (!fixtureRoot) throw new Error('Account fixture root is missing.');
createRoot(fixtureRoot).render(<Shell />);
