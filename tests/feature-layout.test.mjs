import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Alert, Button, CollectionTemplate, FlowSection } from '../dist/index.js';

test('feature sections compose within one page without taking ownership of forms or application state', () => {
  const html = renderToStaticMarkup(h('main', null,
    h(CollectionTemplate, { title: 'Placements', scope: 'Studio / Dubai' },
      h(FlowSection, { title: 'Check availability', id: 'availability', 'aria-busy': true },
        h('form', { id: 'availability-form', action: '/native-check', method: 'post' },
          h('label', { htmlFor: 'start' }, 'Start date'),
          h('input', { id: 'start', name: 'start', type: 'date', required: true, defaultValue: '2026-10-21' }),
          h('button', { type: 'submit' }, 'Check availability'))),
      h(FlowSection, { title: 'Inspect booking', scope: 'Booking demo-1' }, h('p', null, 'No booking submitted.')))));
  assert.equal([...html.matchAll(/<main\b/g)].length, 1);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.equal([...html.matchAll(/<h2\b/g)].length, 2);
  assert.equal([...html.matchAll(/<form\b/g)].length, 1);
  assert.match(html, /id="availability"[^>]*aria-busy="true"/);
  assert.match(html, /action="\/native-check" method="post"/);
  assert.match(html, /name="start"[^>]*value="2026-10-21"/);
  const names = [...html.matchAll(/<section aria-labelledby="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(names).size, 2, 'Feature accessible names use independent heading IDs');
  for (const name of names) assert.ok(html.includes(`<h2 id="${name}">`));
});

test('alert recovery actions follow intact inline prose without adding forms or losing native button contracts', () => {
  const html = renderToStaticMarkup(h(Alert, { title: 'Outcome unknown', tone: 'warning',
    actions: h(Button, { type: 'button', disabled: true, 'aria-describedby': 'receipt' }, 'Check outcome'),
  }, 'Keep receipt ', h('strong', { id: 'receipt' }, 'demo-1'), ' while checking.'));
  assert.match(html, /role="status"/);
  assert.ok(html.includes('Keep receipt <strong id="receipt">demo-1</strong> while checking.'));
  assert.ok(html.indexOf('while checking.') < html.indexOf('t98-alert-actions'));
  assert.match(html, /disabled=""[^>]*aria-describedby="receipt"/);
  assert.doesNotMatch(html, /<form\b|<h1\b/);
});

test('a feature preserves an explicit app-provided accessible name', () => {
  const html = renderToStaticMarkup(h(FlowSection, { title: 'Investigate website traffic', 'aria-label': 'Data investigation recipe' }, h('p', null, 'Applied result')));
  assert.match(html, /aria-label="Data investigation recipe"/);
  assert.doesNotMatch(html, /aria-labelledby=/);
  assert.match(html, /<h2[^>]*>Investigate website traffic<\/h2>/);
});
