import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h, createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as ui from '../dist/index.js';

// Gaps reported by Campaign's 0.5.4 to 0.14.0 adoption (issues #34-#45).
const render = (component, props, ...children) => renderToStaticMarkup(h(component, props, ...children));
const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');

test('U40: Box and text primitives accept ref (typed), and render normally with one', () => {
  for (const component of [ui.Stack, ui.Grid, ui.Inline, ui.Heading, ui.VisuallyHidden]) {
    const props = component === ui.Heading ? { level: 2, ref: createRef() } : { ref: createRef() };
    assert.match(render(component, props, 'x'), />x</);
  }
});

test('U41: ConfirmDialog names its cancel button', () => {
  const html = render(ui.ConfirmDialog, { open: true, onOpenChange() {}, title: 'Discard draft?', description: 'd', onConfirm() {}, cancelLabel: 'Keep editing' });
  assert.match(html, />Keep editing<\/button>/);
  assert.doesNotMatch(html, />Cancel<\/button>/);
});

test('U42: flows can hide their visible title inside a Dialog and keep it as the section name', () => {
  const html = render(ui.ProjectCreateFlow, { mode: 'create', defaultValues: { name: '' }, onSubmit() {}, hideTitle: true });
  assert.match(html, /<section class="t98-settings-flow" aria-label="Create a project">/);
  assert.doesNotMatch(html, /<h2[^>]*>Create a project<\/h2>/);
  assert.match(render(ui.WorkspaceCreateFlow, { mode: 'create', defaultValues: { name: '' }, onSubmit() {} }), /<h2[^>]*>Create a workspace|<h2[^>]*>/);
});

test('U43: Dialog has a wide size and a sticky footer', () => {
  assert.match(render(ui.Dialog, { open: true, onOpenChange() {}, title: 'Compose', size: 'wide' }, 'x'), /class="t98-dialog t98-dialog--wide"/);
  assert.ok(styles.includes('.t98-dialog--wide'));
  assert.match(styles, /\.t98-dialog-footer \{ position: sticky; bottom: 0;/);
});

test('U44: ContentPreview previews a device width', () => {
  assert.match(render(ui.ContentPreview, { label: 'P', destination: 'D', provider: 'p', text: 't', device: 'mobile' }), /t98-content-preview-frame--mobile/);
  assert.ok(styles.includes('.t98-content-preview-frame--desktop'));
});

test('U45: MediaPlayer can skip preloading', () => {
  assert.match(render(ui.MediaPlayer, { kind: 'audio', label: 'Voice note', src: '/a.m4a', preload: 'none' }), /<audio[^>]*preload="none"/);
  assert.match(render(ui.MediaPlayer, { kind: 'audio', label: 'Voice note', src: '/a.m4a' }), /<audio[^>]*preload="metadata"/);
});

test('U46: ConversationThread and DetailWorkspace take a heading level', () => {
  assert.match(render(ui.ConversationThread, { label: 'Inbox', messages: [], headingLevel: 2 }), /<h2[^>]*class="t98-conversation-title">Inbox<\/h2>/);
  const detail = render(ui.DetailWorkspace, { label: 'Leads', listLabel: 'All leads', detailLabel: 'Lead', list: 'l', detail: 'd', selected: false, onBack() {}, headingLevel: 2 });
  assert.match(detail, /<h2 id="[^"]+-title" class="t98-detail-title">Leads<\/h2>/);
  assert.match(detail, /<h3 id="[^"]+-list" class="t98-detail-pane-title" tabindex="-1">All leads<\/h3>/);
  assert.match(render(ui.DetailWorkspace, { label: 'L', listLabel: 'a', detailLabel: 'b', list: 'l', detail: 'd', selected: false, onBack() {} }), /<h3[^>]*class="t98-detail-title"/);
});

test('U47: AccountScopePicker can be read-only', () => {
  const html = render(ui.AccountScopePicker, { connections: [{ id: 'meta', label: 'Meta' }], accounts: [{ id: 'a', label: 'Ad account 1' }], connectionId: 'meta', accountId: 'a', onConnectionChange() {}, onAccountChange() {}, disabled: true });
  assert.match(html, /<select[^>]*disabled=""/);
  assert.match(html, /<fieldset[^>]*disabled=""|<input[^>]*type="radio"[^>]*disabled=""/);
});

test('U50: ReviewConfirm can take focus on its heading', () => {
  const html = render(ui.ReviewConfirm, { title: 'Send now?', reviewKey: 'k', confirmLabel: 'Send', onConfirm() {}, acknowledgements: [], autoFocus: true });
  assert.match(html, /<h3 class="t98-review-confirm-title" id="[^"]+" tabindex="-1">Send now\?<\/h3>/);
});

test('U51: MediaStrip caps alt text and counts it', () => {
  const html = render(ui.MediaStrip, { label: 'Media', altMaxLength: 100, onItemsChange() {}, items: [{ id: 'a', name: 'hero.jpg', status: 'ready', altText: 'Studio at dusk' }] });
  assert.match(html, /<textarea[^>]*maxLength="100"|<textarea[^>]*maxlength="100"/);
  assert.match(html, />14 \/ 100 characters</);
});

test('TeamFlow shows invitation statuses in sentence case, overridable, and keeps raw values for its checks', () => {
  const base = { currentUserId: 'u1', members: [], roles: [{ value: 'editor', label: 'Editor' }], assignableRoles: () => [], onRoleChange() {}, onRemove() {}, onInvite() {}, onRevokeInvitation() {},
    invitations: [{ id: 'i1', email: 'a@example.com', role: 'editor', expiresAt: '2026-11-01T00:00:00Z', status: 'revoked' }, { id: 'i2', email: 'b@example.com', role: 'editor', expiresAt: '2026-11-01T00:00:00Z', status: 'pending' }] };
  const html = render(ui.TeamFlow, base);
  assert.match(html, />Revoked<\/span>/);
  assert.match(html, />Pending<\/span>/);
  assert.doesNotMatch(html, />revoked</);
  assert.match(render(ui.TeamFlow, { ...base, invitationStatusLabels: { revoked: 'Withdrawn' } }), />Withdrawn<\/span>/);
});

test('useConfirmDialog renders nothing until a confirmation is requested', () => {
  function Probe() { const [, dialog] = ui.useConfirmDialog({ danger: true }); return h('div', null, dialog ?? 'idle'); }
  assert.equal(render(Probe, {}), '<div>idle</div>');
});

// Campaign's 0.18.0 adoption findings.
test('CalendarMonth isCreatable limits Create to the days it accepts, and the grid resets the legacy table nowrap', () => {
  const props = { month: { year: 2026, month: 10 }, weekStartsOn: 1, locale: 'en-GB', today: '2026-10-21', days: new Map(), onPrev() {}, onNext() {}, onToday() {}, onCreateDay() {} };
  const html = render(ui.CalendarMonth, { ...props, isCreatable: iso => iso >= '2026-10-21' });
  const created = [...html.matchAll(/aria-label="Create on [^"]*?(\d+) October 2026"/g)].map(match => Number(match[1]));
  assert.deepEqual(created, Array.from({ length: 11 }, (_, index) => 21 + index));
  assert.equal([...render(ui.CalendarMonth, props).matchAll(/t98-calendar-create/g)].length, 31);
  assert.match(styles, /\.t98-calendar-grid\s*\{[^}]*white-space:\s*normal/);
});

test('DataTable emptyDescription replaces or removes the default, and TeamFlow states an empty invitation list once', () => {
  const table = { ariaLabel: 'Keys', columns: [{ key: 'name', header: 'Name', render: row => row.name }], rows: [], rowKey: row => row.id, emptyTitle: 'No keys yet.' };
  assert.match(render(ui.DataTable, table), /New records will appear here\./);
  assert.match(render(ui.DataTable, { ...table, emptyDescription: 'Create a key to call the API.' }), /<p>Create a key to call the API\.<\/p>/);
  assert.doesNotMatch(render(ui.DataTable, { ...table, emptyDescription: null }), /New records will appear here|<h3>No keys yet\.<\/h3><p>/);
  const team = render(ui.TeamFlow, { currentUserId: 'me', onRoleChange() {}, onRemove() {}, onInvite() {}, onRevokeInvitation() {}, invitations: [],
    roles: [{ value: 'editor', label: 'Editor' }], assignableRoles: () => [], members: [{ id: 'me', name: 'Me', email: 'me@example.test', role: 'owner' }] });
  assert.match(team, /No pending invitations\./);
  assert.doesNotMatch(team, /New records will appear here\./);
});

test('U52: EmbedHost is a named region with an empty SDK mount, size presets, and loading or fallback covers', () => {
  const html = render(ui.EmbedHost, { label: 'Billboard locations map', size: 'lg', narrowSize: 'md', busy: true, loadingLabel: 'Loading map…' });
  assert.match(html, /^<div class="t98-embed-host" role="region" aria-label="Billboard locations map" aria-busy="true" data-size="lg" data-narrow-size="md">/);
  assert.match(html, /<div class="t98-embed-host-mount"><\/div>/);
  assert.match(html, /role="status"[^>]*aria-busy="true"[^>]*>.*Loading map…/);
  const failed = render(ui.EmbedHost, { label: 'Map', fallback: 'Map unavailable.' });
  assert.match(failed, /<div class="t98-embed-host-mount" hidden=""><\/div><div class="t98-embed-host-cover">Map unavailable\.<\/div>/);
  assert.match(render(ui.EmbedHost, { label: 'Map' }), /data-size="md" data-narrow-size="md"/);
  for (const rule of ['data-size="sm"', 'data-size="lg"', 'data-narrow-size="md"', 'data-aspect="video"']) assert.ok(styles.includes(`.t98-embed-host[${rule}]`), rule);
});

test('Checkbox and Switch labels are 44px touch targets', () => {
  assert.match(styles, /\.t98-checkbox-label\s*\{[^}]*min-block-size:\s*var\(--t98-control-touch\)/);
  assert.match(styles, /\.t98-switch-label\s*\{[^}]*min-block-size:\s*var\(--t98-control-touch\)/);
});

test('U54: Card titles can sit at h5 and h6 under deeper pane headings', () => {
  assert.match(render(ui.Card, { title: 'Contact', headingLevel: 5 }, 'x'), /<h5 [^>]*class="t98-card-title"[^>]*>Contact<\/h5>|<h5 class="t98-card-title"[^>]*>Contact<\/h5>/);
  assert.match(render(ui.Card, { title: 'Notes', headingLevel: 6 }, 'x'), /<h6[^>]*>Notes<\/h6>/);
});

test('U55: app.css owns the page base, reduced motion, legacy table rows and AppField colours', () => {
  const app = readFileSync(new URL('../dist/app.css', import.meta.url), 'utf8');
  assert.match(app, /:where\(html\)\{font-family:var\(--font-sans\);font-synthesis:none;color:var\(--color-text\);background:var\(--color-canvas\)\}/);
  assert.match(app, /:where\(body\)\{font-size:14px\}/);
  assert.doesNotMatch(app, /:root\{[^}]*font-size/, 'a root font size would shrink rem tokens');
  assert.match(app, /prefers-reduced-motion: reduce\)\{\*,\*::before,\*::after\{animation-duration:0s!important/);
  assert.match(app, /:where\(table:not\(\.t98-review-table\)\) tbody tr:last-child>td\{border-bottom:0\}/);
  assert.match(app, /:where\(table:not\(\.t98-review-table\)\) tbody tr:hover\{background:var\(--color-surface-subtle\)\}/);
  assert.match(app, /max-width:1200px\)\{\n:where\(table:not\(\.t98-review-table\)\) :is\(th,td\)\{padding-inline:16px\}/);
  assert.match(app, /\.field input::placeholder,\.field textarea::placeholder\{color:var\(--color-text-placeholder\)\}/);
  assert.match(app, /\.field \.required\{color:var\(--color-text-muted\)\}/);
});

test('U56: AuthLayout defaults to the card surface without an aside; plain opts out, through the flows and state screens', () => {
  const brand = h('span', null, 'Ten98');
  assert.match(render(ui.SignInFlow, { brand, title: 'Sign in' }), /class="t98-auth-layout auth-shell t98-auth-layout--card"/);
  assert.doesNotMatch(render(ui.SignInFlow, { brand, title: 'Sign in', surface: 'plain' }), /t98-auth-layout--card/);
  assert.match(render(ui.AppStateScreen, { brand, state: 'loading' }), /t98-auth-layout--card/);
  assert.doesNotMatch(render(ui.AppStateScreen, { brand, state: 'loading', surface: 'plain' }), /t98-auth-layout--card/);
  // Beside an aside the default stays plain; an explicit card cards the form column.
  assert.doesNotMatch(render(ui.SignInFlow, { brand, title: 'Sign in', aside: 'Story' }), /t98-auth-layout--card/);
  assert.match(render(ui.SignInFlow, { brand, title: 'Sign in', surface: 'card', aside: 'Story' }), /class="t98-auth-layout auth-shell auth-split t98-auth-layout--card"/);
});

// Campaign Lead's 0.21.0 browser pass (U57-U62); Form ref, calendar width and crumb ellipsis are browser-tested.
test('U59: TeamFlow shows Two-factor only when members report it, and names an unreported status', () => {
  const base = { currentUserId: 'me', onRoleChange() {}, onRemove() {}, onInvite() {}, onRevokeInvitation() {}, invitations: [], roles: [{ value: 'editor', label: 'Editor' }], assignableRoles: () => [] };
  const unreported = render(ui.TeamFlow, { ...base, members: [{ id: 'me', name: 'Me', email: 'me@example.test', role: 'owner' }] });
  assert.doesNotMatch(unreported, />Two-factor</);
  const mixed = render(ui.TeamFlow, { ...base, members: [{ id: 'me', name: 'Me', email: 'me@example.test', role: 'owner', twoFactor: true }, { id: 'b', name: 'Bo', email: 'b@example.test', role: 'editor' }] });
  assert.match(mixed, />Two-factor</);
  assert.match(mixed, />Not reported</);
});

test('U62: Select width="auto" sizes to its options; the default still fills a Field', () => {
  assert.match(render(ui.Select, { width: 'auto', options: [{ value: 'aed', label: 'AED' }] }), /class="t98-input t98-select t98-select--auto"/);
  assert.match(render(ui.Select, { options: [] }), /class="t98-input t98-select"/);
  assert.match(styles, /\.t98-select--auto\s*\{\s*width:\s*auto;\s*max-width:\s*100%;\s*\}/);
});

test('U72: ProjectCreateFlow\'s origin is text with a URL keyboard, so the app validates bare domains itself', () => {
  const html = render(ui.ProjectCreateFlow, { onSubmit() {}, showOrigin: true, defaultValues: { name: '', origin: '' } });
  const origin = html.match(/<input[^>]*name="origin"[^>]*>/)[0];
  assert.match(origin, /type="text"/);
  assert.match(origin, /inputMode="url"|inputmode="url"/);
  assert.doesNotMatch(origin, /type="url"/);
});

test('U64: legacy tables are not forced to 600px under 760px; only their own content sets the width', () => {
  const app = readFileSync(new URL('../dist/app.css', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /table\{min-width:600px\}/);
});

test('U66: SectionNav drops hidden items and renders disabled ones as non-links with their reason; wrap is opt-in', () => {
  const items = [
    { id: 'account', label: 'Your account', href: 'account', current: true },
    { id: 'billing', label: 'Billing', href: 'billing', hidden: true },
    { id: 'api', label: 'API access', href: 'api', disabled: true, disabledReason: 'Owners only' },
  ];
  const html = render(ui.SectionNav, { label: 'Settings', items });
  assert.doesNotMatch(html, /Billing/);
  assert.match(html, /<span class="t98-section-nav__link" aria-disabled="true">API access<span[^>]*>, Owners only<\/span><\/span>/);
  assert.doesNotMatch(html, /href="api"/);
  assert.doesNotMatch(html, /t98-section-nav__list--wrap/);
  assert.match(render(ui.SectionNav, { label: 'Settings', items, wrap: true }), /class="t98-section-nav__list t98-section-nav__list--wrap"/);
});

// Campaign Lead's second browser pass on 0.23.0 (#76-#81).
test('#79: InvitationAcceptFlow labels the role and takes its terms from messages', () => {
  const html = render(ui.InvitationAcceptFlow, { brand: h('span', null, 'Ten98'), state: 'details', token: 't', onAccept() {},
    invitation: { workspaceName: 'Acme', email: 'a@example.test', role: 'editor', expiresAt: '2026-10-30T00:00:00Z' },
    roleLabel: role => role === 'editor' ? 'Editor' : role, messages: { roleTerm: 'Access' }, formatDate: () => '30 Oct 2026' });
  assert.match(html, />Access<\/dt><dd[^>]*>Editor</);
  assert.match(html, />30 Oct 2026</);
  assert.doesNotMatch(html, />editor</);
});

test('#80: TeamFlow marks the required invite email', () => {
  const html = render(ui.TeamFlow, { currentUserId: 'me', onRoleChange() {}, onRemove() {}, onInvite() {}, onRevokeInvitation() {}, invitations: [], roles: [{ value: 'editor', label: 'Editor' }], assignableRoles: () => [], members: [{ id: 'me', name: 'Me', email: 'me@example.test', role: 'owner' }] });
  assert.match(html, /Email address<span class="t98-label-required" aria-hidden="true"> \*<\/span>|<label[^>]*>[^<]*<span class="t98-label-required"/);
});

test('#81: DataTable names each row checkbox and can lock selection while busy', () => {
  const props = { ariaLabel: 'Campaigns', columns: [{ key: 'name', header: 'Name' }], rows: [{ id: 'a', name: 'City after hours' }], rowKey: row => row.id, selectable: true };
  const named = render(ui.DataTable, { ...props, selectionLabel: row => `Select ${row.name}` });
  assert.match(named, /aria-label="Select City after hours"/);
  const locked = render(ui.DataTable, { ...props, selectionDisabled: true });
  assert.equal([...locked.matchAll(/<input type="checkbox"[^>]*disabled=""/g)].length, 2);
  assert.match(render(ui.DataTable, props), /aria-label="Select row 1"/);
});

test('#76-#78: wrap columns keep their longest word, the status label keeps a basis, selected segments keep contrast on hover', () => {
  assert.match(styles, /\.t98-table \.t98-table-cell--wrap\s*\{[^}]*overflow-wrap:\s*break-word/);
  assert.match(styles, /\.t98-sidebar-status__label\s*\{[^}]*flex:\s*1 1 8rem/);
  assert.match(styles, /\.t98-segmented-option:hover:not\(:disabled\):not\(\[aria-pressed='true'\]\)/);
});

test('FirstUserSetupFlow setupToken={false}: no token field, so the first sign-up becomes the owner', () => {
  const brand = h('span', null, 'Ten98');
  const withToken = render(ui.FirstUserSetupFlow, { brand, title: 'Create owner account', onSubmit() {} });
  assert.match(withToken, /name="token"/);
  const owner = render(ui.FirstUserSetupFlow, { brand, title: 'Create owner account', setupToken: false, workspaceName: true, onSubmit() {} });
  assert.doesNotMatch(owner, /name="token"|Setup token/);
  for (const field of ['name', 'email', 'password', 'workspaceName']) assert.match(owner, new RegExp(`name="${field}"`));
});

test('WorkspaceOnboarding can be a create-first-project step with a sample-data checkbox inside its form', () => {
  const brand = h('span', null, 'Ten98');
  const html = render(ui.WorkspaceOnboarding, { brand, email: 'o@example.test', nameLabel: 'Project name', sampleOptIn: { label: 'Add sample data' }, onSubmit() {} });
  assert.match(html, />Project name</);
  const form = html.match(/<form[\s\S]*<\/form>/)[0];
  assert.match(form, /name="sample"[^>]*value="true"|value="true"[^>]*name="sample"/);
  assert.doesNotMatch(render(ui.WorkspaceOnboarding, { brand, email: 'o@example.test', onSubmit() {} }), /name="sample"/);
});

test('DataTable server sort: buttons can be disabled while busy and named "Sort by <header>"', () => {
  const props = { ariaLabel: 'Audit pages', columns: [{ key: 'words', header: 'Words' }], rows: [{ id: 'a', words: 10 }], rowKey: row => row.id, sort: { key: 'words', direction: 'asc' }, onSortChange() {} };
  const html = render(ui.DataTable, { ...props, sortDisabled: true, sortLabel: header => `Sort by ${header}` });
  assert.match(html, /<button type="button" class="t98-sort-button" disabled="" aria-label="Sort by Words"/);
  assert.doesNotMatch(render(ui.DataTable, props), /t98-sort-button" disabled/);
});

// Cross-app consistency audit (#151).
test('#151: AppStateScreen not-found says the page is missing and links home, without an error alert', () => {
  const html = render(ui.AppStateScreen, { state: 'not-found', brand: h('span', null, 'Ten98'), homeHref: '/' });
  assert.match(html, />Page not found</);
  assert.match(html, /This page does not exist or has moved\./);
  assert.match(html, /<a[^>]*href="\/"[^>]*>Go to home<\/a>/);
  assert.doesNotMatch(html, /role="alert"/);
});

test('#151: workspace and project forms default their busy labels', () => {
  assert.match(render(ui.WorkspaceCreateFlow, { mode: 'create', defaultValues: { name: '' }, onSubmit() {}, busy: true }), /Creating workspace…/);
  assert.match(render(ui.ProjectCreateFlow, { mode: 'create', defaultValues: { name: '' }, showOrigin: false, onSubmit() {}, busy: true }), /Creating project…/);
  assert.match(render(ui.ProjectCreateFlow, { mode: 'edit', defaultValues: { name: 'A' }, showOrigin: false, onSubmit() {}, busy: true }), /Saving…/);
});

test('#151: touch screens raise every control height to the 44px touch token', () => {
  const tokens = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
  assert.match(tokens, /@media \(pointer: coarse\) \{\s*:root, \[data-theme\], \.t98-theme, \[data-density\] \{ --t98-control-height: var\(--t98-control-touch\); --t98-control-md: var\(--t98-control-touch\); \}/);
});

test('#151: createDateFormatter formats one timestamp the same way for a locale and time zone', () => {
  const format = ui.createDateFormatter({ locale: 'en-GB', timeZone: 'Asia/Dubai' });
  assert.equal(format.date('2026-10-30T22:30:00Z'), '31 Oct 2026');
  assert.equal(format.dateTime('2026-10-30T22:30:00Z'), '31 Oct 2026, 02:30');
  assert.equal(format.relative('2026-11-02T12:00:00Z', new Date('2026-10-30T12:00:00Z')), 'in 3 days');
  assert.equal(format.relative('2026-10-30T10:00:00Z', new Date('2026-10-30T12:00:00Z')), '2 hours ago');
  assert.equal(format.date('not a date'), 'not a date');
});
