import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConversationThread, DetailWorkspace, PublishingAgenda, SelectableList } from '../dist/coordination.js';

const render = (component, props) => renderToStaticMarkup(h(component, props));
const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');

test('agenda preserves app order, display labels and instants while retaining context through loading and errors', () => {
  const entries = Object.freeze([
    Object.freeze({ id: 'later', title: 'App order first', when: '01:30 · first DST occurrence', dateTime: '2026-11-01T05:30:00Z', status: 'Approved v3 · planned only' }),
    Object.freeze({ id: 'earlier', title: 'App order second', when: '01:30 · second DST occurrence', dateTime: '2026-11-01T06:30:00Z', status: 'Schedule outcome unknown · reconcile', actions: h('a', { href: '/records/original' }, 'Inspect original record') }),
  ]);
  const html = render(PublishingAgenda, { label: 'Publishing', scope: 'Studio · filtered range', timezoneLabel: 'America/New_York', entries, selectedId: 'earlier', onSelect() {}, loading: true, error: 'Overlay refresh failed.' });
  assert.match(html, /Display timezone: America\/New_York/);
  assert.match(html, /[dD]ate[Tt]ime="2026-11-01T05:30:00Z">01:30 · first DST occurrence/);
  assert.match(html, /[dD]ate[Tt]ime="2026-11-01T06:30:00Z">01:30 · second DST occurrence/);
  assert.ok(html.indexOf('App order first') < html.indexOf('App order second'));
  assert.match(html, /aria-pressed="true"[^>]*>App order second/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /Overlay refresh failed/);
  assert.match(html, /Schedule outcome unknown · reconcile/);
  assert.match(html, /href="\/records\/original"/);
  assert.deepEqual(entries.map(entry => entry.id), ['later', 'earlier']);
  const empty = render(PublishingAgenda, { label: 'Publishing', scope: 'Studio', timezoneLabel: 'UTC', entries: [], emptyMessage: 'No filter matches.' });
  assert.match(empty, /No filter matches/);
  const readonly = render(PublishingAgenda, { label: 'Publishing', scope: 'Studio', timezoneLabel: 'UTC', entries, onSelect() {}, readOnly: true });
  assert.match(readonly, /Read only/);
  assert.match(readonly, /<button/); // Read-only prevents editing, not inspecting records.
});

test('workspace selection is explicit and deselection retains mounted draft and list with a visible placeholder', () => {
  const props = { label: 'Inbox', listLabel: 'Conversations', detailLabel: 'Selected conversation', list: h('button', null, 'Open conversation'), detail: h('textarea', { defaultValue: 'Unsaved draft' }), onBack() {} };
  const selected = render(DetailWorkspace, { ...props, selected: true, backLabel: 'Back to conversations' });
  assert.match(selected, /data-selected="true"/);
  assert.match(selected, /class="[^"]*\bt98-detail-back\b[^"]*"[^>]*>Back to conversations/);
  assert.match(selected, /Open conversation/);
  assert.doesNotMatch(selected, /t98-detail-selected-content" hidden/);
  const empty = render(DetailWorkspace, { ...props, selected: false, emptyMessage: 'Choose a conversation.' });
  assert.match(empty, /data-selected="false"/);
  assert.match(empty, /Choose a conversation/);
  assert.match(empty, /class="t98-detail-selected-content" hidden=""><textarea>Unsaved draft/);
  assert.match(empty, /Open conversation/);
  assert.doesNotMatch(empty, /class="[^"]*\bt98-detail-back\b/);
});

test('conversation messages show direction as text, group per-message actions and withhold removed content', () => {
  const messages = [
    { id: 'a', author: 'Visitor', time: '13:00', visibility: 'public', direction: 'inbound', content: 'Secret original text', attachments: h('span', null, 'Original attachment'), removed: true, removedReason: 'Hidden by a teammate.', actions: h('button', { type: 'button' }, 'Unhide') },
    { id: 'b', author: 'Studio team', time: '13:05', visibility: 'public', direction: 'outbound', content: 'Reply', actions: h('button', { type: 'button' }, 'Copy link') },
    { id: 'c', author: 'Legacy', time: '13:06', visibility: 'note', content: 'No direction' },
  ];
  const html = render(ConversationThread, { label: 'Comments', messages });
  assert.match(html, /data-direction="inbound" data-removed="true"/);
  assert.match(html, /data-direction="outbound"/);
  assert.match(html, />Received</);
  assert.match(html, />Sent</);
  assert.match(html, /Message removed\.[\s\S]*Hidden by a teammate\./);
  assert.doesNotMatch(html, /Secret original text|Original attachment/);
  assert.match(html, /role="group" aria-label="Actions for the message from Visitor, 13:00"><button type="button">Unhide/);
  assert.match(html, /aria-label="Actions for the message from Studio team, 13:05"/);
  const legacy = html.slice(html.indexOf('data-message-id="c"'));
  assert.doesNotMatch(legacy, /data-direction|Received|Sent<|t98-conversation-actions/);
  for (const name of ['t98-conversation-direction', 't98-conversation-actions', 't98-conversation-removed-label', 't98-conversation-removed-reason']) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('conversation distinguishes public, private and note text and never infers send success from a composer', () => {
  const messages = Object.freeze(['public', 'private', 'note'].map((visibility, index) => Object.freeze({ id: `${index}`, author: `Author ${index}`, time: `App time ${index}`, dateTime: '2026-10-19T09:00:00Z', visibility, content: `Content ${index}`, ...(index === 2 ? { attachments: h('span', null, 'Attachment failed'), status: 'Receipt unknown' } : {}) })));
  const html = render(ConversationThread, { label: 'Studio conversation', messages, loading: true, error: 'Partial history unavailable.', status: 'Send outcome unknown. Reconcile first.', composer: h('form', null, h('textarea', { defaultValue: 'Retained reply' }), h('button', { disabled: true }, 'Reply pending')) });
  for (const label of ['Public reply', 'Private message', 'Internal note', 'Attachment failed', 'Receipt unknown', 'Partial history unavailable', 'Send outcome unknown. Reconcile first.', 'Retained reply']) assert.ok(html.includes(label));
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /[dD]ate[Tt]ime="2026-10-19T09:00:00Z">App time 0/);
  assert.doesNotMatch(html, /role="log"|Send successful|Message delivered/);
  const readonly = render(ConversationThread, { label: 'Studio', messages, readOnly: true, composer: h('textarea', { defaultValue: 'Preserved draft' }) });
  assert.match(readonly, /Read only. Replies are unavailable/);
  assert.match(readonly, /class="t98-conversation-composer" hidden=""><textarea>Preserved draft/);
  assert.match(render(ConversationThread, { label: 'Studio', messages: [], emptyMessage: 'No matching messages.' }), /No matching messages/);
});

test('SelectableList is one listbox with a roving stop on the selection and states unread counts in text', () => {
  const items = [
    { id: 'a', title: 'Lina Haddad', preview: 'Is the studio open on Friday?', meta: '10:42', unread: 3 },
    { id: 'b', title: 'Omar Saleh', preview: 'Thanks!', meta: 'Yesterday' },
    { id: 'c', title: 'Archived thread', disabled: true },
  ];
  const html = render(SelectableList, { label: 'Conversations', items, selectedId: 'b', onSelect() {} });
  assert.match(html, /<ul class="t98-selectable-list" role="listbox" aria-label="Conversations">/);
  assert.equal((html.match(/role="option"/g) ?? []).length, 3);
  assert.match(html, /data-item-id="b" aria-selected="true" tabindex="0"/);
  assert.match(html, /data-item-id="a" aria-selected="false" tabindex="-1" class="t98-selectable-item t98-selectable-item--unread"/);
  assert.match(html, /<span aria-hidden="true">3<\/span><span class="t98-visually-hidden">, 3 unread<\/span>/);
  assert.match(html, /data-item-id="c" aria-selected="false" aria-disabled="true"/);
  const none = render(SelectableList, { label: 'Conversations', items, onSelect() {} });
  assert.match(none, /data-item-id="a" aria-selected="false" tabindex="0"/);
  assert.match(render(SelectableList, { label: 'C', items: [], onSelect() {}, emptyMessage: 'No conversations match.' }), /No conversations match\./);
  assert.match(render(SelectableList, { label: 'C', items: [{ id: 'x', title: 'X', unread: 250 }], onSelect() {} }), />99\+</);
  for (const name of ['t98-selectable', 't98-selectable-item', 't98-selectable-unread', 't98-selectable-preview']) assert.ok(styles.includes(`.${name}`), name);
});
