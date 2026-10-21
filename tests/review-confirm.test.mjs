import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReviewConfirm } from '../dist/workspace.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const base = { title: 'Send to 1,204 contacts', reviewKey: 'aud-1:rev-3', confirmLabel: 'Send now', onConfirm() {}, acknowledgements: [{ id: 'list', label: 'I reviewed the recipient list' }, { id: 'undo', label: 'I understand sends cannot be undone' }] };

test('confirm stays focusable but unavailable, and always says why', () => {
  const html = renderToStaticMarkup(h(ReviewConfirm, { ...base, onCancel() {} }, 'Summary'));
  assert.match(html, /<section class="t98-review-confirm" aria-labelledby="([^"]+)-title"><h3 class="t98-review-confirm-title" id="\1-title">Send to 1,204 contacts<\/h3>/);
  const button = html.match(/<button[^>]*>Send now<\/button>/)[0];
  assert.match(button, /aria-disabled="true"/);
  assert.doesNotMatch(button, / disabled=""/);
  const reasonId = button.match(/aria-describedby="([^"]+)"/)[1];
  assert.match(html, new RegExp(`id="${reasonId}">Check all 2 items above to continue\\.<`));
  assert.equal((html.match(/type="checkbox"/g) ?? []).length, 2);
  assert.match(html, /<legend class="t98-visually-hidden">Confirm before continuing<\/legend>/);
  assert.match(html, />Cancel</);
});

test('one acknowledgement, an app reason, busy and danger each change the message or the tone', () => {
  assert.match(renderToStaticMarkup(h(ReviewConfirm, { ...base, acknowledgements: [base.acknowledgements[0]] })), />Check the item above to continue\.</);
  const denied = renderToStaticMarkup(h(ReviewConfirm, { ...base, disabledReason: 'Only owners can send campaigns.' }));
  assert.match(denied, />Only owners can send campaigns\.</);
  const busy = renderToStaticMarkup(h(ReviewConfirm, { ...base, busy: true, onCancel() {} }));
  assert.match(busy, /aria-busy="true"/);
  assert.match(busy, /<fieldset class="t98-review-confirm-checks" disabled="">/);
  assert.match(busy, />Working…</);
  const danger = renderToStaticMarkup(h(ReviewConfirm, { ...base, tone: 'danger' }));
  assert.match(danger, /class="t98-review-confirm t98-review-confirm--danger"/);
  assert.match(danger, /t98-button--danger/);
  const none = renderToStaticMarkup(h(ReviewConfirm, { ...base, acknowledgements: [] }));
  assert.doesNotMatch(none, /aria-disabled|fieldset/);
  for (const name of ['t98-review-confirm', 't98-review-confirm--danger', 't98-review-confirm-reason', 't98-review-confirm-actions', 't98-review-confirm-checks']) assert.ok(styles.includes(`.${name}`), name);
});
