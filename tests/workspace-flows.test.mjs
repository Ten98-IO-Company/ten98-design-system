import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as ui from '../dist/index.js';
import { ApiKeysFlow, DangerZoneFlow, ProjectCreateFlow, SettingsLayout, TeamFlow, WorkspaceCreateFlow } from '../dist/index.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const rendered = [];
const render = element => { const html = renderToStaticMarkup(element); rendered.push(html); return html; };
const names = html => [...html.matchAll(/ name="([^"]+)"/g)].map(match => match[1]);
// The value attribute of the named input, or '' when it renders none.
const valueOf = (html, name) => html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0].match(/ value="([^"]*)"/)?.[1] ?? '';
const noop = () => {};

const scopes = [{ value: 'read', label: 'Read' }, { value: 'write', label: 'Write' }];
const expiryOptions = [{ value: '30', label: '30 days' }, { value: 'never', label: 'No expiry' }];
const key = { id: 'k1', name: 'CI deploy', prefix: 't98_ab12', scopes: ['read'], createdAt: '2026-09-01', revoked: false };
const keysProps = { keys: [key, { ...key, id: 'k2', name: 'Old key', revoked: true }], scopes, expiryOptions, onCreate: noop, onDismissSecret: noop, onRevoke: noop };

const roles = [{ value: 'owner', label: 'Owner' }, { value: 'admin', label: 'Admin' }, { value: 'member', label: 'Member' }];
const members = [
  { id: 'u1', name: 'Amal', email: 'amal@example.com', role: 'owner', twoFactor: true },
  { id: 'u2', name: 'Sam', email: 'sam@example.com', role: 'member' },
  { id: 'u3', name: 'Lee', email: 'lee@example.com', role: 'admin' },
];
const teamProps = {
  currentUserId: 'u1', members, roles, assignableRoles: member => member.id === 'u3' || member.id === 'u1' ? [] : ['admin', 'member'], onRoleChange: noop, onRemove: noop,
  invitations: [{ id: 'i1', email: 'new@example.com', role: 'member', expiresAt: '2026-11-01', status: 'pending' }], onInvite: noop, onRevokeInvitation: noop,
};

test('ApiKeysFlow uses typed field names, lists keys and offers revoke only for active keys', () => {
  const html = render(h(ApiKeysFlow, keysProps));
  assert.deepEqual([...new Set(names(html))].sort(), ['expiry', 'name', 'scopes']);
  assert.match(html, /aria-label="Revoke: CI deploy"/);
  assert.doesNotMatch(html, /aria-label="Revoke: Old key"/);
  assert.match(html, /Revoked/);
  assert.match(html, /t98_ab12…/);
  assert.match(html, /Jun|Sep 1, 2026/);
});

test('ApiKeysFlow shows the secret only when revealedSecret is set, with a once-only warning', () => {
  assert.doesNotMatch(render(h(ApiKeysFlow, keysProps)), /New API key|t98_live_token/);
  const html = render(h(ApiKeysFlow, { ...keysProps, revealedSecret: { id: 'k3', token: 't98_live_token' } }));
  assert.match(html, /You won’t see it again/);
  assert.match(html, /<input[^>]*type="password"[^>]*value="t98_live_token"|<input[^>]*value="t98_live_token"[^>]*type="password"/);
  assert.match(html, /Copy key/);
  assert.match(html, /I have saved it/);
});

test('ApiKeysFlow passes paging to the table and locks while busy', () => {
  const html = render(h(ApiKeysFlow, { ...keysProps, page: { index: 0, size: 2, total: 5 }, onPageChange: noop, busy: true }));
  assert.match(html, /Next/);
  assert.match(html, /<fieldset class="t98-flow-fieldset" disabled=""/);
});

test('TeamFlow gives the current user no remove action and read-only rows no role select', () => {
  const html = render(h(TeamFlow, teamProps));
  assert.match(html, /aria-label="Remove: Sam"/);
  assert.doesNotMatch(html, /aria-label="Remove: Amal"/, 'the current user cannot remove themselves');
  assert.doesNotMatch(html, /aria-label="Remove: Lee"/, 'read-only rows have no actions');
  assert.match(html, /aria-label="Role for Sam"/);
  assert.doesNotMatch(html, /aria-label="Role for Lee"/);
  assert.doesNotMatch(html, /aria-label="Role for Amal"/);
  assert.match(html, /aria-label="Revoke: new@example.com"/);
  assert.match(html, /Nov 1, 2026/);
});

test('TeamFlow has one invitation form with typed names, no direct add form, and optional policy and ownership', () => {
  const html = render(h(TeamFlow, teamProps));
  assert.deepEqual([...new Set(names(html))].sort(), ['email', 'role']);
  assert.doesNotMatch(html, /Add (existing|account|member)|workspaceId|projectId/i);
  assert.doesNotMatch(html, /Require two-factor|Transfer ownership/);
  const full = render(h(TeamFlow, { ...teamProps, policy: { twoFactorRequired: true, onChange: noop }, ownership: { candidates: [{ value: 'u2', label: 'Sam' }], onTransfer: noop }, inviteLink: { id: 'i2', url: 'https://example.com/invite/abc' } }));
  assert.match(full, /Require two-factor[\s\S]*/);
  assert.match(full, /<input[^>]*type="checkbox"[^>]*checked=""|<input[^>]*checked=""[^>]*type="checkbox"/);
  assert.match(full, /Transfer ownership/);
  assert.match(full, /value="https:\/\/example.com\/invite\/abc"/);
});

test('WorkspaceCreateFlow and ProjectCreateFlow submit typed names; originRequired toggles required', () => {
  const create = render(h(WorkspaceCreateFlow, { mode: 'create', defaultValues: { name: '' }, onSubmit: noop }));
  assert.deepEqual(names(create), ['name']);
  assert.match(create, /Create workspace/);
  const rename = render(h(WorkspaceCreateFlow, { mode: 'rename', defaultValues: { name: 'Acme' }, onSubmit: noop, cancel: { href: '/back' } }));
  assert.match(rename, /value="Acme"/);
  assert.match(rename, /href="\/back"/);
  const required = render(h(ProjectCreateFlow, { mode: 'create', defaultValues: { name: '', origin: '' }, showOrigin: true, onSubmit: noop }));
  assert.deepEqual(names(required), ['origin', 'name']);
  assert.match(required, /<input[^>]*name="origin"[^>]*>/);
  assert.match(required.match(/<input[^>]*name="origin"[^>]*>/)[0], /inputMode="url"/);
  assert.match(required.match(/<input[^>]*name="origin"[^>]*>/)[0], /required=""/);
  const optional = render(h(ProjectCreateFlow, { mode: 'edit', defaultValues: { name: 'Site', origin: '' }, showOrigin: true, originRequired: false, onSubmit: noop }));
  assert.doesNotMatch(optional.match(/<input[^>]*name="origin"[^>]*>/)[0], /required/);
});

test('DangerZoneFlow offers only an exact retry of the attempted action when unconfirmed', () => {
  const actions = [
    { id: 'delete', title: 'Delete workspace', description: 'Gone.', confirmLabel: 'Delete workspace', confirmationText: 'DELETE', retryOnly: true },
    { id: 'archive', title: 'Archive', description: 'Hide.', confirmLabel: 'Archive' },
  ];
  const normal = render(h(DangerZoneFlow, { actions, onConfirm: noop }));
  assert.match(normal, />Delete workspace<\/button>/);
  assert.match(normal, />Archive<\/button>/);
  const unconfirmed = render(h(DangerZoneFlow, { actions, onConfirm: noop, unconfirmed: 'Timed out.' }));
  // Without an attempt confirmed in this mount, the restored action asks for confirmation again.
  assert.match(unconfirmed, />Delete workspace<\/button>/);
  assert.doesNotMatch(unconfirmed, /aria-label="Retry: Delete workspace"/);
  assert.doesNotMatch(unconfirmed, /Archive/);
});

test('SettingsLayout omits disallowed items, hides empty groups and marks the current page', () => {
  const items = [
    { id: 'profile', label: 'Profile', group: 'account', href: '/profile' },
    { id: 'team', label: 'Team', group: 'workspace', href: '/team' },
    { id: 'billing', label: 'Billing', group: 'workspace', href: '/billing', allowed: false },
    { id: 'ops', label: 'Operations', group: 'operator', href: '/ops', allowed: false },
  ];
  const html = render(h(SettingsLayout, { title: 'Settings', scope: 'Acme', items, current: 'team' }, 'Body'));
  assert.doesNotMatch(html, /Billing|Operations|Operator/);
  assert.doesNotMatch(html, /Project/);
  assert.match(html, /Account/);
  assert.match(html, /<a [^>]*aria-current="page"[^>]*>[\s\S]*Team/);
  assert.doesNotMatch(html.match(/<a [^>]*href="\/profile"[^>]*>/)[0], /aria-current/);
  assert.match(html, /t98-template--settings/);
  assert.match(html, /Acme/);
});

test('every t98 class emitted by the workspace flows is styled', () => {
  const emitted = new Set(rendered.flatMap(html => [...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(' '))));
  for (const name of emitted) if (/^t98-/.test(name) && !['t98-button--md', 't98-button--secondary'].includes(name)) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('TeamFlow preselects the last, least-privileged role unless defaultInviteRole says otherwise', () => {
  const inviteSelect = html => html.match(/<select[^>]*name="role"[^>]*>[\s\S]*?<\/select>/)[0];
  assert.match(inviteSelect(render(h(TeamFlow, teamProps))), /<option value="member" selected/);
  assert.match(inviteSelect(render(h(TeamFlow, { ...teamProps, defaultInviteRole: 'admin' }))), /<option value="admin" selected/);
});

test('flow-frame stays internal while CopyButton keeps its manual-copy fallback', () => {
  const entry = readFileSync(new URL('../dist/index.js', import.meta.url), 'utf8');
  assert.doesNotMatch(entry, /flow-frame/);
  for (const name of ['FlowFrame', 'SettingsFlow', 'FlowActionControl', 'useSingleSubmit', 'formatFlowDate', 'TargetConfirm']) assert.equal(ui[name], undefined, `${name} is not public`);
  // The fallback needs a browser clipboard; the browser spec exercises it. Here the shipped source must still contain both routes.
  const workspace = readFileSync(new URL('../dist/workspace.js', import.meta.url), 'utf8');
  assert.match(workspace, /navigator\.clipboard\.writeText/);
  assert.match(workspace, /execCommand\('copy'\)/);
});

test('a danger action restored after a reload confirms again instead of retrying directly', async () => {
  const { DangerZoneFlow } = await import('../dist/index.js');
  const html = renderToStaticMarkup(h(DangerZoneFlow, { unconfirmed: 'We could not confirm the deletion.', onConfirm() {},
    actions: [{ id: 'delete', title: 'Delete workspace', description: 'Removes everything.', confirmLabel: 'Delete workspace', confirmationText: 'DELETE', retryOnly: true }] }));
  assert.match(html, />Delete workspace<\/button>/);
  assert.doesNotMatch(html, /aria-label="Retry: Delete workspace"/);
});

test('an admin sees owner and admin rows labelled while inviting only editors and viewers', async () => {
  const { TeamFlow } = await import('../dist/index.js');
  const html = renderToStaticMarkup(h(TeamFlow, { currentUserId: 'me', onRoleChange() {}, onRemove() {}, onInvite() {}, onRevokeInvitation() {}, invitations: [],
    roles: [{ value: 'editor', label: 'Editor' }, { value: 'viewer', label: 'Viewer' }], assignableRoles: () => [],
    members: [{ id: 'o', name: 'Olu', email: 'o@example.test', role: 'owner' }, { id: 'a', name: 'Ada', email: 'a@example.test', role: 'admin' }] }));
  assert.match(html, />Owner</);
  assert.match(html, />Admin</);
  assert.doesNotMatch(html, />owner<|>admin</);
  const invite = html.match(/<select[^>]*name="role"[^>]*>(.*?)<\/select>/s)[1];
  assert.deepEqual([...invite.matchAll(/value="([^"]+)"/g)].map(match => match[1]), ['editor', 'viewer']);
  const renamed = renderToStaticMarkup(h(TeamFlow, { currentUserId: 'me', onRoleChange() {}, onRemove() {}, onInvite() {}, onRevokeInvitation() {}, invitations: [], roles: [], assignableRoles: () => [],
    roleLabels: { owner: 'Workspace owner' }, members: [{ id: 'o', name: 'Olu', email: 'o@example.test', role: 'owner' }] }));
  assert.match(renamed, />Workspace owner</);
});

test('ProjectCreateFlow asks for the name only, and renders the site address only when the app asks for it', async () => {
  const { ProjectCreateFlow } = await import('../dist/index.js');
  const props = { mode: 'create', defaultValues: { name: '', origin: 'https://example.com' }, onSubmit() {} };
  const byDefault = renderToStaticMarkup(h(ProjectCreateFlow, props));
  assert.deepEqual(names(byDefault), ['name']);
  assert.doesNotMatch(byDefault, /name="origin"|Site origin/);
  // An address the app passes is not used while its field is hidden.
  assert.equal(valueOf(byDefault, 'name'), '');
  assert.deepEqual(names(renderToStaticMarkup(h(ProjectCreateFlow, { ...props, showOrigin: false }))), ['name']);
  const website = renderToStaticMarkup(h(ProjectCreateFlow, { ...props, showOrigin: true }));
  assert.match(website.match(/<input[^>]*name="origin"[^>]*>/)[0], /required/);
});

test('ProjectCreateFlow puts the address before the name, in create and edit mode alike', async () => {
  const { ProjectCreateFlow } = await import('../dist/index.js');
  for (const mode of ['create', 'edit']) {
    const html = renderToStaticMarkup(h(ProjectCreateFlow, { mode, showOrigin: true, defaultValues: { name: 'Site', origin: 'https://example.com' }, sampleOptIn: { label: 'Add sample data' }, onSubmit() {} }));
    assert.deepEqual(names(html), ['origin', 'name', 'sample']);
    assert.ok(html.indexOf('Site origin') < html.indexOf('Project name'), `${mode}: the address label comes first`);
    assert.ok(html.indexOf('Project name') < html.indexOf('Add sample data'), `${mode}: the sample choice stays last`);
  }
});

test('ProjectCreateFlow suggests the name from the address hostname until the app gives a name', async () => {
  const { ProjectCreateFlow } = await import('../dist/index.js');
  const suggested = (origin, name = '', showOrigin = true) =>
    valueOf(renderToStaticMarkup(h(ProjectCreateFlow, { mode: 'create', showOrigin, defaultValues: { name, origin }, onSubmit() {} })), 'name');
  assert.equal(suggested('https://www.example.com/x'), 'example.com');
  assert.equal(suggested('www.example.com'), 'example.com');
  assert.equal(suggested('example.com/path?q=1#top'), 'example.com');
  assert.equal(suggested('HTTP://WWW.Example.COM:8080'), 'example.com');
  assert.equal(suggested('https://shop.example.co.uk/'), 'shop.example.co.uk');
  assert.equal(suggested('localhost:3000'), 'localhost');
  assert.equal(suggested('https://user@www.example.com'), 'example.com');
  // No address, or text that is not one yet, suggests nothing.
  for (const text of ['', '   ', 'https://', 'my website']) assert.equal(suggested(text), '', JSON.stringify(text));
  // A name from the app is kept; the suggestion is not a default for it.
  assert.equal(suggested('https://www.example.com', 'Acme'), 'Acme');
  assert.equal(suggested('https://www.example.com', '', false), '');
  // The name field's own limit holds for a long host.
  assert.equal(suggested(`https://${'a'.repeat(60)}.${'b'.repeat(60)}.${'c'.repeat(60)}.com`).length, 120);
});

test('TeamFlow explains an empty invitation list, hints a solo member to invite, and shows expiry as relative text (#151)', () => {
  const solo = render(h(TeamFlow, { ...teamProps, members: [members[0]], invitations: [], formatRelative: () => 'in 3 days' }));
  assert.match(solo, /You’re the only member\. Invite someone to work together\./);
  assert.match(solo, /No pending invitations\.<\/h3><p>Invitations you send appear here until they’re accepted\.<\/p>/);
  assert.doesNotMatch(render(h(TeamFlow, teamProps)), /only member/);
  // Relative text is opt-in and keeps the date visible beneath it; without it a caller's formatDate stays the cell text.
  const html = render(h(TeamFlow, { ...teamProps, formatRelative: () => 'in 3 days' }));
  assert.match(html, /<time datetime="2026-11-01T00:00:00.000Z">in 3 days<\/time><span class="[^"]*t98-text-tone-muted">Nov 1, 2026<\/span>/i);
  const custom = render(h(TeamFlow, { ...teamProps, formatDate: () => '1. Nov. 2026' }));
  assert.match(custom, /data-label="Expires" role="cell">1\. Nov\. 2026<\/td>/);
  assert.doesNotMatch(custom, /<time/);
  assert.doesNotMatch(html, /Resend: |New link: /);
  const withActions = render(h(TeamFlow, { ...teamProps, onResendInvitation: noop, onRenewInvitationLink: noop }));
  assert.match(withActions, /aria-label="Resend: new@example\.com"[^>]*>Resend</);
  assert.match(withActions, /aria-label="New link: new@example\.com"[^>]*>New link</);
});
