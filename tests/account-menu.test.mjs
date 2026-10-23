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
