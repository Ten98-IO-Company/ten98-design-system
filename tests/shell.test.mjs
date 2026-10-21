import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppShell, AppTopbar, Banner, SearchField, SectionNav, SidebarNav, SidebarStatus, WorkspaceProjectSwitcher } from '../dist/index.js';

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

const people = [{ id: 'acme', name: 'Acme', roleLabel: 'Admin', initials: 'AC' }, { id: 'labs', name: 'Labs' }];
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

test('WorkspaceProjectSwitcher shows decorative workspace initials beside the select', () => {
  const html = sw();
  assert.match(html, /<span class="t98-avatar t98-avatar--sm t98-switcher__avatar" aria-hidden="true">AC<\/span>/);
  assert.ok(!html.includes('role="img"'));
  assert.ok(!sw({ workspaceId: 'labs' }).includes('t98-switcher__avatar'));
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

const shellFrame = (props = {}) => renderToStaticMarkup(h(AppShell, {
  sidebar: h('p', null, 'Side'),
  topbar: h(AppTopbar, { breadcrumb: { icon: 'home', scope: 'Acme', current: 'Overview' }, menuToggle: true, search: 'S', badge: { label: 'Beta', hideOnMobile: true }, actions: 'A' }),
  ...props,
}, h('p', null, 'Body')));

test('AppShell renders the topbar in a header outside main and the skip link targets main', () => {
  const html = shellFrame({ sidebarLabel: 'Workspace', skipLinkLabel: 'Jump', mainLabel: 'Page', banners: h(Banner, { title: 'Hi' }), navigation: { open: false, onOpenChange: noop } });
  const mainId = html.match(/<main[^>]*id="([^"]+)"/)[1];
  assert.match(html, new RegExp(`<a class="t98-skip-link" href="#${mainId.replace(/:/g, '\:')}">Jump</a>`));
  assert.match(html, /<main[^>]*tabindex="-1"[^>]*aria-label="Page"/);
  assert.match(html, /<aside[^>]*aria-label="Workspace"/);
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  assert.ok(!main.includes('t98-app-topbar') && !main.includes('<header'));
  assert.ok(html.indexOf('<header') < html.indexOf('<main') && html.indexOf('t98-shell-banners') < html.indexOf('<main'));
  assert.match(html, /aria-label="Close navigation"/);
  assert.ok(!html.includes('t98-shell-shade'));
});

test('AppShell topbar overrides header and static usage keeps the original markup', () => {
  const both = shellFrame({ header: 'Plain header' });
  assert.ok(!both.includes('Plain header'));
  const plain = renderToStaticMarkup(h(AppShell, { sidebar: 'S', header: 'Plain header' }, 'Body'));
  assert.match(plain, /<div class="t98-shell-header">Plain header<\/div>/);
  assert.doesNotMatch(plain, /t98-shell-close|--drawer|<header/);
  assert.doesNotMatch(shellFrame(), /aria-controls/);
});

test('AppTopbar exposes the breadcrumb, current page and the drawer toggle wiring', () => {
  const html = shellFrame({ navigation: { open: true, onOpenChange: noop } });
  assert.match(html, /<nav aria-label="Breadcrumb"[^>]*><ol/);
  assert.match(html, /<li class="t98-app-topbar__separator" aria-hidden="true">/);
  assert.match(html, /<li class="t98-app-topbar__crumb t98-app-topbar__current" aria-current="page">Overview<\/li>/);
  const sidebarId = html.match(/<aside[^>]*id="([^"]+)"/)[1];
  assert.match(html, new RegExp(`aria-label="Open navigation" aria-controls="${sidebarId.replace(/:/g, '\:')}" aria-expanded="true"`));
  assert.match(html, /t98-app-topbar__badge t98-app-topbar__badge--hide-mobile/);
});

test('Banner renders tone, action through linkComponent, dismiss and live', () => {
  const Route = ({ href, ...rest }) => h('a', { href: `/r/${href}`, ...rest });
  const html = renderToStaticMarkup(h(Banner, { tone: 'sample', pill: 'Sample', title: 'Demo data', icon: 'bell', live: true, action: { label: 'Connect', href: 'connect' }, linkComponent: Route, onDismiss: noop, dismissLabel: 'Hide' }, 'Not real.'));
  assert.match(html, /class="t98-banner t98-banner--sample" role="status"/);
  assert.match(html, /<a href="\/r\/connect" class="t98-banner__action">/);
  assert.match(html, /<button type="button" class="t98-banner__dismiss" aria-label="Hide">/);
  const button = renderToStaticMarkup(h(Banner, { action: { label: 'Retry', onSelect: noop } }, 'x'));
  assert.match(button, /<button type="button" class="t98-banner__action"><span>Retry/);
  assert.doesNotMatch(button, /role=|dismiss/);
});

test('SidebarStatus hides the dot from assistive technology and supports actions', () => {
  const html = renderToStaticMarkup(h(SidebarStatus, { tone: 'connected', label: 'Channels connected', action: { label: 'Manage', href: '/c' } }));
  assert.match(html, /t98-sidebar-status--connected/);
  assert.match(html, /<span class="t98-sidebar-status__dot" aria-hidden="true">/);
  assert.match(html, /<a href="\/c" class="t98-sidebar-status__action">/);
  assert.doesNotMatch(renderToStaticMarkup(h(SidebarStatus, { tone: 'idle', label: 'Idle' })), /action/);
});

test('every emitted shell class exists in the shipped stylesheet', () => {
  const html = [render({ filter: 'x', emptyFilter: () => 'none' }), sw({ create: { onSelect: noop } }), sw({ workspaces: [] }),
    shellFrame({ navigation: { open: true, onOpenChange: noop } }), renderToStaticMarkup(h(Banner, { tone: 'danger', pill: 'P', title: 'T', icon: 'bell', action: { label: 'A', icon: 'plus', href: 'x' }, onDismiss: noop }, 'c')), renderToStaticMarkup(h(SidebarStatus, { tone: 'idle', label: 'L', action: { label: 'A', onSelect: noop } })),
    renderToStaticMarkup(h(SearchField, { label: 'S', value: 'v', onValueChange: noop, onClear: noop, shortcut: '/' })),
    renderToStaticMarkup(h(SearchField, { label: 'S', value: '', onValueChange: noop, shortcut: '/', variant: 'topbar' }))].join('');
  const used = new Set(classes(html).filter(name => name.startsWith('t98-')));
  assert.ok(used.size > 10);
  assert.ok(styles.includes('.t98-shell-shade'), 'shade is styled');
  for (const name of used) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('SidebarNav renders an anchor for an item with both href and onSelect', () => {
  const html = render({ groups: [{ id: 'g', items: [{ id: 'a', label: 'Draft page', href: 'draft', onSelect: noop }] }] });
  assert.match(html, /<a href="draft" class="t98-sidebar-nav__item"/);
  assert.ok(!html.includes('<button'));
});

test('the shell sidebar has an accessible name by default, which the mobile drawer dialog inherits', async () => {
  const { AppShell } = await import('../dist/index.js');
  assert.match(renderToStaticMarkup(h(AppShell, { sidebar: 'nav' }, 'x')), /<aside[^>]*aria-label="Application navigation"/);
  assert.match(renderToStaticMarkup(h(AppShell, { sidebar: 'nav', sidebarLabel: 'Workspace' }, 'x')), /<aside[^>]*aria-label="Workspace"/);
});

test('filtering keys items by group, so the same item id in two groups filters independently', async () => {
  const { SidebarNav } = await import('../dist/index.js');
  const html = renderToStaticMarkup(h(SidebarNav, { label: 'Nav', filter: 'reports', groups: [
    { id: 'a', label: 'A', items: [{ id: 'overview', label: 'Reports overview', onSelect() {} }] },
    { id: 'b', label: 'B', items: [{ id: 'overview', label: 'Overview', onSelect() {} }] },
  ] }));
  assert.match(html, /<li class="t98-sidebar-nav__entry"><button[^>]*>.*Reports overview/);
  assert.match(html, /<li class="t98-sidebar-nav__entry" hidden="">.*?>Overview</);
});

test('AppTopbar truncates by default and wraps long labels only with wrap', () => {
  const crumb = { scope: 'A very long scope', current: 'A very long current page' };
  assert.doesNotMatch(renderToStaticMarkup(h(AppTopbar, { breadcrumb: crumb })), /t98-app-topbar--wrap/);
  assert.match(renderToStaticMarkup(h(AppTopbar, { breadcrumb: crumb, wrap: true })), /class="t98-app-topbar t98-app-topbar--wrap"/);
  assert.match(styles, /\.t98-app-topbar--wrap \.t98-app-topbar__current[^{]*\{[^}]*white-space: normal/);
});

const sections = [{ id: 'overview', label: 'Overview', href: 'overview', current: true }, { id: 'reports', label: 'Reports', href: 'reports', badge: 2 }];

test('SectionNav is a labelled nav of links with aria-current and no tab semantics', () => {
  const html = renderToStaticMarkup(h(SectionNav, { label: 'Campaign sections', items: sections }));
  assert.match(html, /<nav aria-label="Campaign sections" class="t98-section-nav"><ul/);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  assert.match(html, /<a href="overview" class="t98-section-nav__link" aria-current="page">Overview<\/a>/);
  assert.match(html, /Reports<span[^>]*>2<\/span>/);
  assert.doesNotMatch(html, /role="tab|tablist|tabindex/);
  for (const name of new Set(classes(html))) if (/^t98-/.test(name) && name !== 't98-badge--neutral') assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('SectionNav renders links through linkComponent and guards clicks like SidebarNav', () => {
  const seen = [];
  const Route = props => { seen.push(props); return h('a', { href: `/app/${props.href}`, className: props.className, 'aria-current': props['aria-current'] }, props.children); };
  const selected = [];
  renderToStaticMarkup(h(SectionNav, { label: 'S', items: sections, linkComponent: Route, onSelect: (item, event) => { selected.push(item.id); event.preventDefault(); } }));
  assert.deepEqual(seen.map(props => props.href), ['overview', 'reports']);
  let prevented = 0;
  const click = extra => ({ button: 0, defaultPrevented: false, preventDefault() { prevented += 1; this.defaultPrevented = true; }, ...extra });
  seen[1].onClick(click());
  assert.deepEqual(selected, ['reports']);
  assert.equal(prevented, 1);
  seen[1].onClick(click({ ctrlKey: true }));
  seen[1].onClick(click({ button: 1 }));
  assert.deepEqual(selected, ['reports']);
});

test('SectionNav is one scrollable row with logical, touch-sized styles', () => {
  const rule = name => styles.match(new RegExp(`\\.${name}\\s*\\{[^}]*\\}`))?.[0] ?? '';
  assert.match(rule('t98-section-nav__list'), /overflow-x:\s*auto/);
  assert.match(rule('t98-section-nav__link'), /min-block-size:\s*var\(--t98-control-touch\)/);
  assert.match(rule('t98-section-nav__link'), /border-block-end/);
  assert.doesNotMatch(rule('t98-section-nav__link') + rule('t98-section-nav__list'), /(?:margin|padding|border)-(?:left|right)|text-align:\s*(?:left|right)/);
});
