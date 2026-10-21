import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ApiKeysFlow, DangerZoneFlow, ProjectCreateFlow, SettingsLayout, TeamFlow, WorkspaceCreateFlow } from '../dist/index.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const rendered = [];
const render = element => { const html = renderToStaticMarkup(element); rendered.push(html); return html; };
const names = html => [...html.matchAll(/ name="([^"]+)"/g)].map(match => match[1]);
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
  assert.match(html, /<fieldset class="t98-workspace-fieldset" disabled=""/);
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
  const required = render(h(ProjectCreateFlow, { mode: 'create', defaultValues: { name: '', origin: '' }, onSubmit: noop }));
  assert.deepEqual(names(required), ['name', 'origin']);
  assert.match(required, /<input[^>]*name="origin"[^>]*>/);
  assert.match(required.match(/<input[^>]*name="origin"[^>]*>/)[0], /type="url"[^>]*required|required=""[^>]*type="url"|type="url"/);
  assert.match(required.match(/<input[^>]*name="origin"[^>]*>/)[0], /required=""/);
  const optional = render(h(ProjectCreateFlow, { mode: 'edit', defaultValues: { name: 'Site', origin: '' }, originRequired: false, onSubmit: noop }));
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
  assert.match(unconfirmed, /aria-label="Retry: Delete workspace"/);
  assert.doesNotMatch(unconfirmed, /Archive/);
  assert.doesNotMatch(unconfirmed, />Delete workspace<\/button>/);
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
