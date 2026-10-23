import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AccountScopePicker, FieldList, Input } from '../dist/index.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const rows = [{ id: 'a', time: '09:00' }, { id: 'b', time: '13:30' }, { id: 'c', time: '18:00' }];
const noop = () => {};
const list = props => renderToStaticMarkup(h(FieldList, {
  legend: 'Posting times', name: 'slots', items: rows, getKey: row => row.id, onAdd: noop, onRemove: noop, addLabel: 'Add time', removeLabel: index => `Remove time ${index + 1}`,
  renderItem: (row, _index, { name, id }) => h(Input, { id: id('time'), name: name('time'), defaultValue: row.time }), ...props,
}));
const buttonTag = (html, text) => html.match(new RegExp(`<button[^>]*>${text}</button>`))?.[0] ?? '';

test('FieldList is a fieldset of list items with hidden headings and native field names', () => {
  const html = list();
  assert.match(html, /<fieldset[\s\S]*<legend[^>]*>Posting times<\/legend>/);
  assert.equal((html.match(/<li class="t98-field-list-item"/g) ?? []).length, 3);
  for (const text of ['Item 1 of 3', 'Item 2 of 3', 'Item 3 of 3']) assert.match(html, new RegExp(`<h3 class="t98-visually-hidden">${text}</h3>`));
  for (const index of [0, 1, 2]) assert.ok(html.includes(`name="slots.${index}.time"`));
  assert.match(html, /<p class="t98-visually-hidden" role="status" aria-live="polite"><\/p>/);
  assert.match(html, /Remove time 2/);
  assert.doesNotMatch(html, /Move up/);
});

test('FieldList shows move buttons only with onMove and disables them at the ends', () => {
  const html = list({ onMove: noop });
  assert.equal((html.match(/data-move="up"/g) ?? []).length, 3);
  assert.match(html, /aria-label="Move item 1 up" disabled=""|disabled="" [^>]*aria-label="Move item 1 up"|aria-label="Move item 1 up"[^>]*disabled=""/);
  assert.doesNotMatch(html.match(/<button[^>]*aria-label="Move item 2 up"[^>]*>/)[0], /disabled/);
  assert.match(html.match(/<button[^>]*aria-label="Move item 3 down"[^>]*>/)[0], /disabled/);
});

test('FieldList disables Add at max and Remove at min and shows the reason', () => {
  const atMax = list({ max: 3 });
  assert.match(buttonTag(atMax, 'Add time'), /disabled=""/);
  assert.match(atMax, /No more than 3 items allowed\./);
  const id = atMax.match(/aria-describedby="([^"]+)"[^>]*>Add time/)?.[1] ?? atMax.match(/<button[^>]*>Add time/)[0].match(/aria-describedby="([^"]+)"/)[1];
  assert.ok(atMax.includes(`id="${id}"`));
  const atMin = list({ min: 3 });
  assert.match(buttonTag(atMin, 'Remove time 1'), /disabled=""/);
  assert.match(atMin, /At least 3 items are required\./);
  const free = list({ min: 1, max: 5 });
  assert.doesNotMatch(buttonTag(free, 'Add time'), /disabled/);
  assert.doesNotMatch(free, /required\.|allowed\./);
});

test('FieldList shows the empty message and the error', () => {
  const html = list({ items: [], emptyMessage: 'No times yet.', error: 'Add a time.' });
  assert.match(html, /No times yet\./);
  assert.doesNotMatch(html, /<ol/);
  // The error belongs to the fieldset: linked through aria-describedby and marking the group invalid.
  const describedBy = html.match(/<fieldset[^>]*aria-describedby="([^"]+)"/)[1];
  assert.match(html, /<fieldset[^>]*aria-invalid="true"/);
  assert.match(html, new RegExp(`<p class="t98-field-error" id="${describedBy}" role="alert">Add a time\.<\/p>`));
});

const connections = [{ id: 'meta', label: 'Meta' }, { id: 'old', label: 'Google', status: 'expired' }, { id: 'bad', label: 'TikTok', status: 'error' }];
const accounts = count => Array.from({ length: count }, (_, index) => ({ id: `a${index + 1}`, label: `Account ${index + 1}` }));
const scope = props => renderToStaticMarkup(h(AccountScopePicker, { connections, accounts: accounts(3), connectionId: 'meta', accountId: 'a2', onConnectionChange: noop, onAccountChange: noop, name: 'scope', ...props }));

test('AccountScopePicker names the connection and radio accounts for native forms', () => {
  const html = scope();
  assert.match(html, /<select[^>]*name="scope.connection"/);
  assert.match(html, /<option value="meta" selected="">Meta<\/option>/);
  assert.equal((html.match(/type="radio"[^>]*name="scope.account"|name="scope.account"[^>]*type="radio"/g) ?? []).length, 3);
  assert.match(html, /value="a2"[^>]*checked=""|checked=""[^>]*value="a2"/);
  assert.doesNotMatch(html, /role="combobox"/);
});

test('AccountScopePicker switches from radio buttons to a list-only combobox above six accounts', () => {
  assert.doesNotMatch(scope({ accounts: accounts(6) }), /role="combobox"/);
  assert.match(scope({ accounts: accounts(6) }), /type="radio"/);
  const many = scope({ accounts: accounts(7) });
  assert.match(many, /role="combobox"/);
  assert.doesNotMatch(many, /type="radio"/);
  assert.match(many, /<input type="hidden" name="scope.account" value="a2"\/>/);
});

test('AccountScopePicker shows loading, empty and unavailable-connection states', () => {
  assert.match(scope({ accounts: null }), /role="status"[^>]*aria-busy="true"[\s\S]*Loading accounts…/);
  assert.match(scope({ accounts: [] }), /This connection has no accounts available\./);
  const expired = scope({ connectionId: 'old', accountId: '', onConnect: noop });
  assert.match(expired, /t98-tone--warning[^>]*>[\s\S]*Expired<\/span>/);
  assert.match(expired, /This connection has expired\./);
  assert.match(expired, />Reconnect<\/button>/);
  assert.match(expired, /Google \(Expired\)/);
  assert.doesNotMatch(expired, /type="radio"/);
  assert.match(scope({ connectionId: 'bad', accountId: '' }), /t98-tone--danger[\s\S]*has an error/);
  assert.match(scope({ connectionId: null, accountId: null }), /Choose a connection to see its accounts\./);
});

test('AccountScopePicker offers to connect when there are no connections and shows disabled reasons', () => {
  const none = scope({ connections: [], connectionId: null, accountId: null, connectHref: '/connect' });
  assert.match(none, /No connections yet\./);
  assert.match(none, /<a [^>]*href="\/connect"[^>]*>Connect an account<\/a>/);
  assert.doesNotMatch(none, /<select/);
  const reason = scope({ accounts: [{ id: 'a1', label: 'One', disabled: true, disabledReason: 'Suspended' }] });
  assert.match(reason, /disabled=""[\s\S]*Suspended/);
  assert.match(scope({ error: 'Pick an account.' }), /role="alert">Pick an account\./);
});

test('field list and account picker styles are tokenised, logical and at least 44px', () => {
  for (const selector of ['.t98-field-list-item', '.t98-field-list-actions .t98-button', '.t98-account-scope-status']) assert.ok(styles.includes(selector), selector);
  const css = styles.split('\n').filter(line => /t98-(field-list|account-scope)/.test(line)).join('\n');
  assert.match(css, /min-block-size: 44px/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|\b(?:margin|padding|border)-(?:left|right|top|bottom)\b|\b(?:width|height)\s*:/);
});

test('sources carry no carriage returns', () => {
  for (const file of ['../src/lib/field-list.tsx', '../src/lib/account-scope.tsx']) assert.doesNotMatch(readFileSync(new URL(file, import.meta.url), 'utf8'), /\r/);
});
