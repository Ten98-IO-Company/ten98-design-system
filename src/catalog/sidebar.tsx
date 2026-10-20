import { useEffect, useId, useRef, useState } from 'react';
import { useSidebarNavigation } from '../lib/sidebar.js';
import { tsx, type ComponentEntry } from './model.js';

type Mode = 'responsive' | 'mobile' | 'desktop';
const styles = `.sidebar-example,.sidebar-example *{box-sizing:border-box}
.sidebar-example{position:relative;min-height:320px;overflow:hidden;border:1px solid var(--t98-border);border-radius:8px;background:var(--t98-surface);color:var(--t98-text)}
.sidebar-example aside{position:absolute;inset:0 auto 0 0;width:180px;padding:16px;z-index:2;display:grid;align-content:start;gap:12px;background:var(--t98-subtle);border-right:1px solid var(--t98-border)}
.sidebar-example-content{margin-left:180px;padding:16px;display:grid;gap:12px;min-height:320px}
.sidebar-example button,.sidebar-example input{font:inherit;min-height:44px;max-width:100%}.sidebar-example input{width:100%}.sidebar-example nav{display:grid;gap:8px}
.sidebar-example-shade{position:absolute;inset:0;z-index:1;border:0;background:#0006;width:100%;height:100%}
.sidebar-example[data-mode=mobile] .sidebar-example-content{margin-left:0}.sidebar-example[data-mode=mobile] aside[data-sidebar-state=closed]{visibility:hidden}
.sidebar-example[data-mode=desktop] .sidebar-example-toggle{display:none}.sidebar-example dialog{max-width:min(360px,90vw)}.sidebar-example dialog::backdrop{background:#0007}
@media(max-width:760px){.sidebar-example:not([data-mode=desktop]) .sidebar-example-content{margin-left:0}.sidebar-example:not([data-mode=desktop]) aside[data-sidebar-state=closed]{visibility:hidden}}
@media(min-width:761px){.sidebar-example[data-mode=responsive] .sidebar-example-toggle{display:none}}`;

function SidebarDemo({ mode = 'responsive' }: { mode?: Mode }) {
  const navigationId = useId(), draftId = useId();
  const sidebarRef = useRef<HTMLElement>(null), triggerRef = useRef<HTMLButtonElement>(null), dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false), [draft, setDraft] = useState('Unsent local note'), [selected, setSelected] = useState('Overview'), [pending, setPending] = useState('');
  const mediaQuery = mode === 'mobile' ? '(min-width:0px)' : mode === 'desktop' ? '(max-width:0px)' : undefined;
  const navigation = useSidebarNavigation({ open, onOpenChange: setOpen, sidebarRef, triggerRef, mediaQuery });
  // Only the gallery has several independent app-shell previews on one document.
  // Close its previous drawer before opening another; the standalone copy needs no coordinator.
  useEffect(() => {
    const doc = sidebarRef.current?.ownerDocument;
    if (!doc) return;
    const closeOther = (event: Event) => { if ((event as CustomEvent<HTMLElement>).detail !== sidebarRef.current) setOpen(false); };
    doc.addEventListener('t98:sidebar-demo-open', closeOther);
    return () => doc.removeEventListener('t98:sidebar-demo-open', closeOther);
  }, []);
  function openNavigation() {
    sidebarRef.current?.ownerDocument.dispatchEvent(new CustomEvent('t98:sidebar-demo-open', { detail: sidebarRef.current }));
    setOpen(true);
  }
  function choose(next: string) {
    if (draft.trim()) { setPending(next); if (dialogRef.current) { dialogRef.current.returnValue = ''; dialogRef.current.showModal(); } }
    else { setSelected(next); setOpen(false); }
  }
  return <div className="sidebar-example" data-mode={mode}>
    <style>{styles}</style>
    <aside {...navigation.sidebarProps} ref={sidebarRef} id={navigationId} aria-label="Example workspace navigation">
      <strong>Workspace</strong><button type="button" className="sidebar-example-toggle" onClick={() => setOpen(false)}>Close navigation</button>
      <nav aria-label="Example pages">{['Overview', 'Reports'].map(next => <button type="button" key={next} aria-current={selected === next ? 'page' : undefined} onClick={() => choose(next)}>{next}</button>)}</nav>
    </aside>
    {navigation.modal && <button type="button" className="sidebar-example-shade" aria-label="Close navigation backdrop" onClick={() => setOpen(false)} />}
    <section {...navigation.contentProps} className="sidebar-example-content" aria-label="Example content">
      <button ref={triggerRef} type="button" className="sidebar-example-toggle" aria-controls={navigationId} aria-expanded={open} onClick={openNavigation}>Open navigation</button>
      <h2>{selected}</h2><label htmlFor={draftId}>Local draft<input id={draftId} value={draft} onChange={event => setDraft(event.target.value)} /></label>
      <p>Choose Reports to inspect the app-owned native draft confirmation. Closing navigation preserves the draft.</p>
    </section>
    <dialog ref={dialogRef} aria-label="Unsaved local draft" onClose={() => { if (dialogRef.current?.returnValue === 'discard') { setDraft(''); setSelected(pending); setOpen(false); } }}>
      <form method="dialog"><p>Discard your unsent local note?</p><button value="keep">Keep editing</button><button value="discard">Discard draft</button></form>
    </dialog>
  </div>;
}

function sidebarCode(mode: Mode = 'responsive') {
  return tsx(['useSidebarNavigation'], `<div className="sidebar-example" data-mode="${mode}">
  <style>{styles}</style>
  <aside {...navigation.sidebarProps} ref={sidebarRef} id={navigationId} aria-label="Example workspace navigation">
    <strong>Workspace</strong>
    <button type="button" className="sidebar-example-toggle" onClick={() => setOpen(false)}>Close navigation</button>
    <nav aria-label="Example pages">{['Overview', 'Reports'].map(next => <button type="button" key={next} aria-current={selected === next ? 'page' : undefined} onClick={() => choose(next)}>{next}</button>)}</nav>
  </aside>
  {navigation.modal && <button type="button" className="sidebar-example-shade" aria-label="Close navigation backdrop" onClick={() => setOpen(false)} />}
  <section {...navigation.contentProps} className="sidebar-example-content" aria-label="Example content">
    <button ref={triggerRef} type="button" className="sidebar-example-toggle" aria-controls={navigationId} aria-expanded={open} onClick={() => setOpen(true)}>Open navigation</button>
    <h2>{selected}</h2>
    <label htmlFor={draftId}>Local draft<input id={draftId} value={draft} onChange={event => setDraft(event.target.value)} /></label>
    <p>Choose Reports to inspect the app-owned native draft confirmation. Closing navigation preserves the draft.</p>
  </section>
  <dialog ref={dialogRef} aria-label="Unsaved local draft" onClose={() => {
    if (dialogRef.current?.returnValue === 'discard') { setDraft(''); setSelected(pending); setOpen(false); }
  }}>
    <form method="dialog"><p>Discard your unsent local note?</p><button value="keep">Keep editing</button><button value="discard">Discard draft</button></form>
  </dialog>
</div>`, `const styles = ${JSON.stringify(styles)};
const navigationId = useId(), draftId = useId();
const sidebarRef = useRef<HTMLElement>(null), triggerRef = useRef<HTMLButtonElement>(null), dialogRef = useRef<HTMLDialogElement>(null);
const [open, setOpen] = useState(false), [draft, setDraft] = useState('Unsent local note');
const [selected, setSelected] = useState('Overview'), [pending, setPending] = useState('');
const navigation = useSidebarNavigation({ open, onOpenChange: setOpen, sidebarRef, triggerRef${mode === 'responsive' ? '' : `, mediaQuery: '${mode === 'mobile' ? '(min-width:0px)' : '(max-width:0px)'}'`} });
function choose(next: string) {
  // The application guards navigation; the hook never discards drafts.
  if (draft.trim()) {
    setPending(next);
    if (dialogRef.current) { dialogRef.current.returnValue = ''; dialogRef.current.showModal(); }
  } else { setSelected(next); setOpen(false); }
}`, ['useId', 'useRef', 'useState']);
}

export const sidebarEntries: ComponentEntry[] = [{
  name: 'useSidebarNavigation', category: 'Navigation',
  description: 'Responsive sidebar behavior for existing app markup: inert closed navigation, mobile focus containment and desktop cleanup.',
  usage: 'Keep routing, selected items, CSS geometry and unsaved-work guards in the application. Spread sidebarProps onto the labelled aside with sidebarRef and contentProps onto its sibling content wrapper. Wire triggerRef, aria-controls and aria-expanded on the menu button; render a close button or backdrop when modal is true. The default media query is (max-width:760px). Mobile previews below force a matching media query for demonstration and start closed so mounting a gallery never steals focus. This example performs no requests.',
  props: [
    { name: 'open', type: 'boolean', required: true, description: 'Controlled mobile drawer state; start false for a stable server/client initial render.' },
    { name: 'onOpenChange', type: '(open: boolean) => void', required: true, description: 'Receives Escape and desktop-resize close requests. The app updates open.' },
    { name: 'sidebarRef', type: 'RefObject<HTMLElement | null>', required: true, description: 'Attach to the same aside that receives sidebarProps.' },
    { name: 'triggerRef', type: 'RefObject<HTMLElement | null>', required: true, description: 'Attach to the labelled native menu button for focus restoration.' },
    { name: 'mediaQuery', type: 'string', defaultValue: '(max-width:760px)', description: 'Viewport matchMedia query selecting modal behavior. Align app CSS with a custom breakpoint.' },
    { name: 'result.modal', type: 'boolean', description: 'True only while the mobile query matches and open is true; controls the app-owned backdrop.' },
    { name: 'result.sidebarProps', type: 'native aside props', description: 'Spread inert, role, aria-modal, data-sidebar-state, tabIndex and style. Merge any custom style with the supplied style; preserve its closed visibility.' },
    { name: 'result.contentProps', type: 'native content-wrapper props', description: 'Spread onto the sibling content wrapper to apply native inert while the mobile drawer is modal. Keep app-owned native dialogs outside it.' },
  ],
  tokens: ['--t98-surface', '--t98-subtle', '--t98-text', '--t98-border'],
  accessibility: ['Name the aside and navigation; associate the trigger with its unique aside ID. Keep a native close action available inside the drawer.', 'Only visible, enabled controls participate in mobile Tab cycling; hidden, inert and closed-details content is excluded. Escape closes the drawer and visible triggers regain focus.', 'Open native dialogs retain Escape, Tab and focus ownership. The application must confirm unsaved work before committing navigation; closing a drawer does not authorize discarding a draft.', 'Desktop removes modal semantics and content inertness. React 18 and 19 receive their supported native inert serialization. The hook supplies behavior, not sidebar styling or application landmarks.'],
  related: ['AppShell', 'AuthLayout', 'DetailWorkspace'], example: sidebarCode(),
  states: [
    { name: 'Responsive 760px', description: 'Resize the viewport: desktop sidebar becomes a closed mobile drawer at 760px. The page and local draft stay mounted.', preview: <SidebarDemo />, code: sidebarCode() },
    { name: 'Closed mobile', description: 'A forced mobile query demonstrates closed navigation exclusion at any gallery width. Open navigation to enter the drawer.', preview: <SidebarDemo mode="mobile" />, code: sidebarCode('mobile') },
    { name: 'Mobile open and native draft guard', description: 'Click Open navigation, use Tab/ShiftTab and choose Reports. Escape dismisses the native confirmation while the draft and drawer remain; explicit Discard commits navigation.', preview: <SidebarDemo mode="mobile" />, code: sidebarCode('mobile') },
    { name: 'Desktop', description: 'A forced nonmatching query keeps navigation and content available without modal semantics. Draft confirmation stays application-owned.', preview: <SidebarDemo mode="desktop" />, code: sidebarCode('desktop') },
  ],
}];
