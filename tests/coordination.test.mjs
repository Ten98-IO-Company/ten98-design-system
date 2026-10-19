import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConversationThread, DetailWorkspace, PublishingAgenda } from '../dist/coordination.js';

const render = (component, props) => renderToStaticMarkup(h(component, props));

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
