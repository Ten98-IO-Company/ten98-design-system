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
