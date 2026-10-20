import { useState } from 'react';
import { AccountMenu, SidebarFooter } from '../lib/account-menu';
import { AppIcon } from '../lib/app';
import { tsx, type ComponentEntry } from './model';

function AccountPreview({ expanded = false, long = false, busy = false }: { expanded?: boolean; long?: boolean; busy?: boolean }) {
  const [notice, setNotice] = useState('Choose an account option. This example makes no requests.');
  const name = long ? 'Alexandra Morgan-Williams and the regional operations team' : 'Alex Morgan';
  const email = long ? 'alexandra.morgan-williams@regional-operations.example.test' : 'alex@example.test';
  return <div className="account-example" style={{ minHeight: 360, width: '100%', minWidth: 0 }}>
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--t98-space-3)' }}>
      <strong>Workspace</strong>
      <AccountMenu name={name} email={email} defaultOpen={expanded}>
        <a href="#account-profile" onClick={event => { event.preventDefault(); setNotice('Profile and appearance selected.'); }}>Profile and appearance</a>
        <a href="#account-security" onClick={event => { event.preventDefault(); setNotice('Account security selected.'); }}>Account security</a>
        <button type="button" disabled={busy} aria-busy={busy || undefined} onClick={() => setNotice('Sign out requested once. The app owns the session and any draft guard.')}>
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
      </AccountMenu>
    </header>
    <p role="status" style={{ marginTop: 'var(--t98-space-6)' }}>{notice}</p>
    <label style={{ display: 'grid', gap: 'var(--t98-space-2)', marginTop: 'var(--t98-space-4)' }}>
      Local draft
      <input className="t98-input" placeholder="Menu changes keep this draft" />
    </label>
    <button type="button" className="t98-button t98-button--ghost" style={{ marginTop: 'var(--t98-space-4)' }} onClick={() => setNotice('Workspace action selected.')}>Workspace action</button>
  </div>;
}

function accountCode(expanded = false, long = false, busy = false) {
  return tsx(['AccountMenu'], `<>
<header style={{ display: 'flex', justifyContent: 'flex-end' }}>
  <AccountMenu name="${long ? 'Alexandra Morgan-Williams and the regional operations team' : 'Alex Morgan'}" email="${long ? 'alexandra.morgan-williams@regional-operations.example.test' : 'alex@example.test'}"${expanded ? ' defaultOpen' : ''}>
    <a href="/account">Profile and appearance</a>
    <a href="/account/security">Account security</a>
    <button type="button"${busy ? ' disabled aria-busy="true"' : ''} onClick={() => setNotice('Demo sign out requested.')}>
      ${busy ? 'Signing out…' : 'Sign out'}
    </button>
  </AccountMenu>
</header>
<p role="status">{notice}</p>
</>`, "const [notice, setNotice] = useState('');", ['useState']);
}

function FooterPreview({ connected = false, long = false }: { connected?: boolean; long?: boolean }) {
  return <aside aria-label="Example sidebar footer" style={{ width: '100%', maxWidth: 250 }}>
    <SidebarFooter version={long ? '0.1.0-preview.10+regional-build' : '0.1.0'}>
      {connected && <a href="#connection-settings" onClick={event => event.preventDefault()}>Channels connected</a>}
      <a href="#workspace-settings" onClick={event => event.preventDefault()}><AppIcon name="settings" size={18}/> Settings</a>
    </SidebarFooter>
  </aside>;
}

function footerCode(connected = false, long = false) {
  return tsx(['SidebarFooter'], `<SidebarFooter version="${long ? '0.1.0-preview.10+regional-build' : '0.1.0'}">
  ${connected ? '<a href="/settings/connections">Channels connected</a>\n  ' : ''}<a href="/settings">Settings</a>
</SidebarFooter>`);
}

export const accountMenuEntries: ComponentEntry[] = [
  {
    name: 'AccountMenu', category: 'Navigation',
    description: 'One top-right account dropdown with identity and app-owned account links and actions.',
    usage: 'Place once in the page header. Remove the duplicate profile and sign-out block from the sidebar. Keep account routes, router links, unsaved-work guards, async errors and sign-out state in the app. Supply native links for navigation and type="button" actions. This nonmodal disclosure uses ordinary Tab navigation; it is not an ARIA application menu. Never render interactive content inside the avatar slot.',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Display name shown inside the dropdown and used by the default initials avatar.' },
      { name: 'email', type: 'string', description: 'Optional account email, wrapped without truncating its value.' },
      { name: 'avatar', type: 'ReactNode', description: 'Optional non-interactive existing app avatar. Preserve the Campaign initials/image treatment.' },
      { name: 'children', type: 'ReactNode', required: true, description: 'Native app or router links and buttons. Their handlers, hrefs, disabled states and business rules stay app-owned.' },
      { name: 'label', type: 'string', defaultValue: 'Account menu', description: 'Accessible label on the icon-only disclosure button.' },
      { name: 'defaultOpen', type: 'boolean', defaultValue: 'false', description: 'Initial disclosure state, useful for catalogue states. Does not take focus on mount.' },
    ],
    tokens: ['--t98-space-2', '--t98-space-3', '--t98-space-4', '--t98-surface', '--t98-text', '--t98-muted', '--t98-border', '--t98-accent', '--t98-radius', '--t98-z-popover'],
    accessibility: ['Use Enter or Space on the labelled trigger, then Tab through native links and actions.', 'Escape closes and restores trigger focus. Outside interaction and Tab exit dismiss without trapping or stealing focus.', 'Keep busy/disabled actions native. Navigation and session changes remain explicit app behavior. Long identity text wraps at narrow widths.'],
    related: ['Avatar', 'SidebarFooter', 'AppShell', 'useSidebarNavigation'],
    example: accountCode(),
    states: [
      { name: 'Closed', description: 'A single header avatar opens the account options; the draft below remains mounted.', preview: <AccountPreview/>, code: accountCode() },
      { name: 'Open', description: 'Identity, account links and sign out form one compact dropdown.', preview: <AccountPreview expanded/>, code: accountCode(true) },
      { name: 'Long identity', description: 'A long display name and email wrap inside the dropdown.', preview: <AccountPreview expanded long/>, code: accountCode(true, true) },
      { name: 'Busy action', description: 'A pending app action stays disabled while account navigation remains inspectable.', preview: <AccountPreview expanded busy/>, code: accountCode(true, false, true) },
    ],
  },
  {
    name: 'SidebarFooter', category: 'Layout',
    description: 'A quiet sidebar footer for settings, optional connection links and the real application version.',
    usage: 'Place at the bottom of the existing sidebar. Pass the app build version, not the UI package version. Keep profile identity and sign out in AccountMenu in the header. Retain existing role-gated settings links and connection state; this component does not invent routes, health or version data.',
    props: [
      { name: 'version', type: 'string', required: true, description: 'Actual application version supplied by the app build.' },
      { name: 'children', type: 'ReactNode', required: true, description: 'Existing settings and optional connection/source actions.' },
      { name: 'className', type: 'string', description: 'Optional app layout class; preserve shared spacing.' },
    ],
    tokens: ['--t98-space-2', '--t98-space-3', '--t98-space-4', '--t98-muted', '--t98-border', '--t98-text'],
    accessibility: ['Keep supplied navigation as real links or router links.', 'Version remains readable text and wraps when needed; do not put another account menu here.'],
    related: ['AccountMenu', 'AppShell', 'useSidebarNavigation'], example: footerCode(),
    states: [
      { name: 'Settings and version', description: 'Minimal footer with one settings entry and the application version.', preview: <FooterPreview/>, code: footerCode() },
      { name: 'Connection link', description: 'An app-owned connection link precedes settings without repeating profile controls.', preview: <FooterPreview connected/>, code: footerCode(true) },
      { name: 'Long version', description: 'Preview/build metadata wraps within the sidebar.', preview: <FooterPreview long/>, code: footerCode(false, true) },
    ],
  },
];
