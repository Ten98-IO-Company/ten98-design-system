import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AccountMenu, SidebarFooter } from '../dist/index.js';

test('account disclosure preserves native app links, forms and disabled or busy controls', () => {
  const html = renderToStaticMarkup(h(AccountMenu, { name: 'Alex Rivera', email: 'alex@example.test' },
    h('a', { href: '/account?tab=profile' }, 'Account'),
    h('form', { action: '/sign-out', method: 'post' },
      h('input', { type: 'hidden', name: 'csrf', value: 'app-owned-token' }),
      h('button', { type: 'submit', disabled: true, 'aria-busy': true }, 'Sign out'))));
  assert.match(html, /aria-label="Account menu" aria-expanded="false" aria-controls="([^"]+)"/);
  const panelId = html.match(/aria-controls="([^"]+)"/)[1];
  assert.ok(html.includes(`id="${panelId}" hidden=""`));
  assert.match(html, /<a href="\/account\?tab=profile">Account<\/a>/);
  assert.match(html, /<form action="\/sign-out" method="post">/);
  assert.match(html, /name="csrf" value="app-owned-token"/);
  assert.match(html, /<button type="submit" disabled="" aria-busy="true">Sign out<\/button>/);
  assert.match(html, /aria-label="Alex Rivera">AR<\/span>/);
  assert.doesNotMatch(html, /role="(?:menu|menuitem|dialog)"|aria-modal=|tabindex=|tabIndex=/);
});

test('account identity is escaped and custom avatars and labels are retained', () => {
  const html = renderToStaticMarkup(h(AccountMenu, {
    name: '<script>alert(1)</script>', email: 'team&ops@example.test',
    label: 'Open your account', defaultOpen: true,
    avatar: h('span', { className: 'campaign-avatar' }, 'Campaign avatar'),
  }, h('button', { type: 'button', 'aria-disabled': true }, 'App action')));
  assert.match(html, /aria-label="Open your account" aria-expanded="true"/);
  assert.match(html, /class="campaign-avatar">Campaign avatar/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /team&amp;ops@example.test/);
  assert.match(html, /aria-disabled="true"/);
  assert.doesNotMatch(html, /<script| hidden=|t98-avatar/);
});

test('multiple account disclosures receive distinct control IDs without browser globals', () => {
  const html = renderToStaticMarkup(h('div', null,
    h(AccountMenu, { name: 'First' }, h('a', { href: '/first' }, 'First')),
    h(AccountMenu, { name: 'Second' }, h('a', { href: '/second' }, 'Second'))));
  const ids = [...html.matchAll(/aria-controls="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
  assert.doesNotMatch(html, /t98-account-menu__identity[\s\S]*?<span><\/span>/);
});

test('sidebar footer retains supplied utilities and actual app version without adding profile actions', () => {
  const html = renderToStaticMarkup(h(SidebarFooter, { version: '2.7.4-beta.1', className: 'campaign-footer' },
    h('a', { href: '/settings' }, 'Settings'), h('button', { type: 'button', disabled: true }, 'Connections')));
  assert.match(html, /<footer class="t98-sidebar-footer campaign-footer">/);
  assert.match(html, /<a href="\/settings">Settings<\/a>/);
  assert.match(html, /<button type="button" disabled="">Connections<\/button>/);
  assert.match(html, /Version 2\.7\.4-beta\.1/);
  assert.equal([...html.matchAll(/<a\b/g)].length, 1);
  assert.equal([...html.matchAll(/<button\b/g)].length, 1);
  assert.doesNotMatch(html, /t98-account-menu|t98-avatar|Sign out|Profile/);
});

const items = [
  { id: 'profile', kind: 'link', label: 'Profile', href: 'profile', icon: 'user' },
  { id: 'sep', kind: 'separator' },
  { id: 'out', kind: 'button', label: 'Sign out', busyLabel: 'Signing out…', busy: true, danger: true, onSelect: () => undefined },
  { id: 'off', kind: 'button', label: 'Billing', disabled: true, onSelect: () => undefined },
  { id: 'gone', kind: 'link', label: 'Locked', href: 'locked', disabled: true },
];

test('AccountMenu items render links through linkComponent, separators, danger, busy and disabled', () => {
  const Route = ({ href, ...rest }) => h('a', { href: `/app/${href}`, 'data-route': href, ...rest });
  const html = renderToStaticMarkup(h(AccountMenu, { name: 'Alex', items, linkComponent: Route }));
  assert.match(html, /<a href="\/app\/profile" data-route="profile" class="t98-account-menu__item"><svg/);
  assert.match(html, /<hr class="t98-account-menu__separator"\/>/);
  assert.match(html, /<button type="button" class="t98-account-menu__item t98-account-menu__item--danger" disabled="" aria-busy="true"><span>Signing out…<\/span><\/button>/);
  assert.match(html, /<button type="button" class="t98-account-menu__item" disabled=""><span>Billing/);
  assert.match(html, /<a role="link" class="t98-account-menu__item" aria-disabled="true"><span>Locked/);
  assert.ok(!html.includes('href="/app/locked"'));
  const native = renderToStaticMarkup(h(AccountMenu, { name: 'Alex', items: items.slice(0, 1) }));
  assert.match(native, /<a href="profile" class="t98-account-menu__item">/);
});

test('AccountMenu renders items before still-supported children and every class is styled', () => {
  const html = renderToStaticMarkup(h(AccountMenu, { name: 'Alex', items }, h('a', { href: '/legacy' }, 'Legacy')));
  assert.ok(html.indexOf('Profile') < html.indexOf('Legacy'));
  const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
  for (const name of new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(' ')).filter(name => name.startsWith('t98-') && !name.startsWith('t98-avatar')))) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

// The menu's actions in order as their text, with a separator shown as "—".
const entries = html => [...html.split('class="t98-account-menu__actions">')[1].matchAll(/<hr\b[^>]*>|<(a|button)\b[^>]*>[\s\S]*?<\/\1>/g)]
  .map(match => match[0].startsWith('<hr') ? '—' : match[0].replace(/<[^>]+>/g, ''));
const menu = props => renderToStaticMarkup(h(AccountMenu, { name: 'Alex', ...props }));
const help = { id: 'help', kind: 'link', label: 'Help center', href: '/help' };
const signOut = { onSelect: () => undefined };
const legacy = h('a', { href: '/legacy' }, 'Legacy');

test('AccountMenu lists the app items, then Account settings, a separator and Sign out last', () => {
  assert.deepEqual(entries(menu({ items: [help], accountSettings: { href: '/account' }, signOut })), ['Help center', 'Account settings', '—', 'Sign out']);
  assert.deepEqual(entries(menu({ accountSettings: { href: '/account' }, signOut })), ['Account settings', '—', 'Sign out']);
  // Items the app already passes keep their own separators and place before the two entries, whatever they are.
  assert.deepEqual(entries(menu({ items: [help, { id: 'sep', kind: 'separator' }, { id: 'keys', kind: 'button', label: 'Shortcuts', onSelect: () => undefined }], accountSettings: { href: '/account' }, signOut })),
    ['Help center', '—', 'Shortcuts', 'Account settings', '—', 'Sign out']);
  // Deprecated children still render after items, and before the two entries.
  assert.deepEqual(entries(menu({ items: [help], children: legacy, accountSettings: { href: '/account' }, signOut })), ['Help center', 'Legacy', 'Account settings', '—', 'Sign out']);
  // It stays a disclosure with ordinary Tab order: no menu roles and no roving tabindex.
  assert.doesNotMatch(menu({ items: [help], accountSettings: { href: '/account' }, signOut }), /role="(?:menu|menuitem)"|tabindex=|tabIndex=/);
});

test('the separator before Sign out appears only when something sits above it', () => {
  assert.deepEqual(entries(menu({ signOut })), ['Sign out']);
  assert.deepEqual(entries(menu({ signOut, items: [] })), ['Sign out']);
  assert.deepEqual(entries(menu({ signOut, children: [false, null] })), ['Sign out']);
  assert.deepEqual(entries(menu({ signOut, items: [help] })), ['Help center', '—', 'Sign out']);
  assert.deepEqual(entries(menu({ signOut, children: legacy })), ['Legacy', '—', 'Sign out']);
  assert.deepEqual(entries(menu({ signOut, accountSettings: { href: '/account' } })), ['Account settings', '—', 'Sign out']);
  // Without Sign out nothing follows Account settings, so no separator trails it; without both props the menu is the app's own.
  assert.deepEqual(entries(menu({ accountSettings: { href: '/account' } })), ['Account settings']);
  assert.deepEqual(entries(menu({ items: [help] })), ['Help center']);
  assert.deepEqual(entries(menu({})), []);
});

test('Account settings and Sign out default their labels, style Sign out as a danger action and pass a busy state through', () => {
  const html = menu({ accountSettings: { href: '/account' }, signOut: { ...signOut, busy: true } });
  assert.match(html, /<a href="\/account" class="t98-account-menu__item"><span>Account settings<\/span><\/a>/);
  assert.match(html, /<button type="button" class="t98-account-menu__item t98-account-menu__item--danger" disabled="" aria-busy="true"><span>Signing out…<\/span><\/button>/);
  assert.match(menu({ signOut }), /<button type="button" class="t98-account-menu__item t98-account-menu__item--danger"><span>Sign out<\/span><\/button>/);
  assert.match(menu({ signOut: { ...signOut, disabled: true } }), /t98-account-menu__item--danger" disabled=""><span>Sign out/);
  // A relabelled Sign out keeps its own label while busy unless the app gives a busy label; the default one is English.
  assert.deepEqual(entries(menu({ signOut: { ...signOut, label: 'Log out', busy: true } })), ['Log out']);
  assert.deepEqual(entries(menu({ signOut: { ...signOut, label: 'Log out', busyLabel: 'Logging out…', busy: true } })), ['Logging out…']);
  assert.deepEqual(entries(menu({ accountSettings: { href: '/account', label: 'Settings' } })), ['Settings']);
});

test('Account settings renders through linkComponent like the link items', () => {
  const Route = ({ href, ...rest }) => h('a', { href: `/app/${href}`, 'data-route': href, ...rest });
  assert.match(menu({ linkComponent: Route, accountSettings: { href: 'account' }, signOut }), /<a href="\/app\/account" data-route="account" class="t98-account-menu__item"><span>Account settings<\/span><\/a>/);
});
