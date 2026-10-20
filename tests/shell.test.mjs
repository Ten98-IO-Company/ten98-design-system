import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SearchField, SidebarNav, WorkspaceProjectSwitcher } from '../dist/index.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const classes = html => [...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(' '));
const noop = () => undefined;
const groups = [
  { id: 'work', label: 'Work', items: [
    { id: 'overview', label: 'Overview', icon: 'home', href: 'overview', current: true },
    { id: 'inbox', label: 'Inbox', onSelect: noop, badge: 3, badgeLabel: 'unread', keywords: ['messages'] },
  ] },
  { id: 'manage', label: 'Manage', items: [{ id: 'settings', label: 'Settings', href: 'settings' }] },
];
const render = (props = {}) => renderToStaticMarkup(h(SidebarNav, { label: 'Main', groups, ...props }));

test('SidebarNav marks the current item, labels groups and hides the badge text visually', () => {
  const html = render();
  assert.match(html, /<nav aria-label="Main"/);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  assert.match(html, /aria-current="page"[^>]*>.*?Overview/);
  assert.match(html, /aria-labelledby="[^"]+"/);
  assert.match(html, /t98-visually-hidden"> unread</);
});

test('SidebarNav filter hides non-matching items by label or keyword and shows emptyFilter', () => {
  const byKeyword = render({ filter: ' MESSAGES ' });
  assert.match(byKeyword, /<li class="t98-sidebar-nav__entry">(?:(?!<li).)*Inbox/);
  assert.match(byKeyword, /<li class="t98-sidebar-nav__entry" hidden="">(?:(?!<li).)*Overview/);
  assert.match(byKeyword, /<div class="t98-sidebar-nav__group" hidden="">.*Manage/);
  assert.ok(!byKeyword.includes('t98-sidebar-nav__empty'));
  const none = render({ filter: 'zzz', emptyFilter: q => `No match for ${q}` });
  assert.match(none, /t98-sidebar-nav__empty">No match for zzz</);
  assert.ok(!render({ emptyFilter: () => 'x' }).includes('t98-sidebar-nav__empty'));
  assert.match(render({ groups: [{ id: 'g', items: [{ id: 'a', label: 'A', href: 'a', hidden: true }] }] }), /hidden=""/);
});

test('SidebarNav renders href items through linkComponent and onSelect items as buttons', () => {
  const Route = ({ href, className, children, ...rest }) => h('a', { href: `/app/${href}`, className, 'data-route': href, ...rest }, children);
  const html = render({ linkComponent: Route });
  assert.match(html, /<a href="\/app\/overview" class="t98-sidebar-nav__item" data-route="overview" aria-current="page"/);
  assert.match(html, /<button type="button" class="t98-sidebar-nav__item"[^>]*>.*?Inbox/);
  assert.ok(!html.includes('data-route="inbox"'));
  assert.match(render(), /<a href="settings"/);
});

const people = [{ id: 'acme', name: 'Acme', roleLabel: 'Admin' }, { id: 'labs', name: 'Labs' }];
const sw = props => renderToStaticMarkup(h(WorkspaceProjectSwitcher, { workspaces: people, projects: [{ id: 'p1', name: 'Launch' }], workspaceId: 'acme', projectId: 'p1', onWorkspaceChange: noop, onProjectChange: noop, ...props }));

test('WorkspaceProjectSwitcher covers role, no workspaces, loading, empty and create states', () => {
  const base = sw({ create: { onSelect: noop } });
  assert.match(base, /aria-describedby="([^"]+)-role"/);
  assert.match(base, /id="[^"]+-role"[^>]*>Admin</);
  assert.match(base, /<button type="button" class="t98-switcher__create" aria-label="New project in Acme"/);
  assert.ok(!sw().includes('t98-switcher__create'));
  const none = sw({ workspaces: [] });
  assert.match(none, /^<p class="t98-switcher t98-switcher__empty">No workspaces available<\/p>$/);
  const loading = sw({ projects: null, projectId: null });
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /Loading projects…/);
  const empty = sw({ projects: [], projectId: null });
  assert.match(empty, /<select[^>]*disabled=""[^>]*>.*No projects yet/);
  assert.ok(!empty.includes('aria-busy'));
  const link = sw({ create: { href: 'new', label: 'Add project' }, linkComponent: ({ href, ...rest }) => h('a', { href: `/r/${href}`, ...rest }) });
  assert.match(link, /<a href="\/r\/new" class="t98-switcher__create" aria-label="Add project in Acme"/);
  assert.match(sw({ labels: { noWorkspaces: 'Nada' }, workspaces: [] }), />Nada</);
});

test('SearchField keeps a persistent polite status region and shows clear only with a value', () => {
  const field = props => renderToStaticMarkup(h(SearchField, { label: 'Search', value: '', onValueChange: noop, ...props }));
  const empty = field({ hideLabel: true, shortcut: '/', onClear: noop });
  assert.match(empty, /<div role="status" class="t98-search-field__status"><\/div>/);
  assert.match(empty, /class="t98-search-field__label t98-visually-hidden"/);
  assert.match(empty, /<kbd[^>]*aria-hidden="true">\/<\/kbd>/);
  assert.match(empty, /type="search"/);
  assert.ok(!empty.includes('t98-search-field__clear'));
  const filled = field({ value: 'x', onClear: noop, clearLabel: 'Clear', status: '2 results', variant: 'topbar' });
  assert.match(filled, /aria-label="Clear"/);
  assert.match(filled, /t98-search-field--topbar/);
  assert.match(filled, /role="status"[^>]*>2 results</);
});

test('every emitted shell class exists in the shipped stylesheet', () => {
  const html = [render({ filter: 'x', emptyFilter: () => 'none' }), sw({ create: { onSelect: noop } }), sw({ workspaces: [] }),
    renderToStaticMarkup(h(SearchField, { label: 'S', value: 'v', onValueChange: noop, onClear: noop, shortcut: '/' })),
    renderToStaticMarkup(h(SearchField, { label: 'S', value: '', onValueChange: noop, shortcut: '/', variant: 'topbar' }))].join('');
  const used = new Set(classes(html).filter(name => name.startsWith('t98-')));
  assert.ok(used.size > 10);
  for (const name of used) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});
