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
