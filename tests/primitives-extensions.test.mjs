import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Alert, Badge, Button, Card, Field, Input, Meter, Progress, Select } from '../dist/index.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const classes = html => [...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(' ')).filter(name => name.startsWith('t98-'));
const all = [];
const render = element => { const html = renderToStaticMarkup(element); all.push(...classes(html)); return html; };

test('Select renders options, groups in first-seen order, a placeholder and trailing children', () => {
  const html = render(h(Select, { name: 'r', placeholder: 'Choose', options: [
    { value: 'a', label: 'A' }, { value: 'd', label: 'D', group: 'Gulf' }, { value: 'l', label: 'L', group: 'Europe' }, { value: 'r', label: 'R', group: 'Gulf', disabled: true },
  ] }, h('option', { value: 'x' }, 'Extra')));
  assert.match(html, /<option value="" disabled="" selected="">Choose<\/option>/);
  assert.ok(html.indexOf('>A<') < html.indexOf('label="Gulf"'));
  assert.ok(html.indexOf('label="Gulf"') < html.indexOf('label="Europe"'));
  assert.match(html, /<optgroup label="Gulf"><option value="d">D<\/option><option value="r" disabled="">R<\/option><\/optgroup>/);
  assert.ok(html.indexOf('>L<') < html.indexOf('Extra'));
  assert.doesNotMatch(render(h(Select, { value: 'a', onChange() {}, placeholder: 'Choose', options: [{ value: 'a', label: 'A' }] })), /<option value="" disabled="" selected/);
});

test('Field links a generated id to the control, description and error; htmlFor still wins', () => {
  const html = render(h(Field, { label: 'Name', required: true, description: 'Help', error: 'Bad' }, h(Input, { name: 'n', required: true })));
  const id = html.match(/<label[^>]* for="([^"]+)"/)[1];
  assert.ok(html.includes(`<input`) && html.includes(` id="${id}"`));
  assert.ok(html.includes(`aria-describedby="${id}-description ${id}-error"`));
  assert.ok(html.includes(`id="${id}-description"`) && html.includes(`id="${id}-error"`));
  assert.match(html, /<span class="t98-label-required" aria-hidden="true"> \*<\/span>/);
  assert.match(html, /<input[^>]* required=""/);
  const fixed = render(h(Field, { label: 'Name', htmlFor: 'fixed' }, h(Input, {})));
  assert.match(fixed, /for="fixed"/);
  assert.match(fixed, /<input[^>]* id="fixed"/);
});

test('Button renders anchors through component, drops href when disabled, and marks pressed and icon-only', () => {
  const Router = ({ href, className, children }) => h('a', { href: `/app${href}`, className, 'data-router': '' }, children);
  assert.match(render(h(Button, { href: '/x', component: Router }, 'Go')), /<a href="\/app\/x" class="t98-button t98-button--primary t98-button--md" data-router="">Go<\/a>/);
  assert.match(render(h(Button, { href: 'https://e.com' }, 'Go')), /^<a [^>]*href="https:\/\/e.com"/);
  const disabled = render(h(Button, { href: '/x', component: Router, disabled: true }, 'Go'));
  assert.match(disabled, /aria-disabled="true"/);
  assert.doesNotMatch(disabled, /href=|data-router/);
  const pressed = render(h(Button, { pressed: true, fullWidth: true }, 'Archived'));
  assert.match(pressed, /aria-pressed="true"/);
  assert.match(pressed, /t98-button--full/);
  assert.doesNotMatch(render(h(Button, null, 'Plain')), /aria-pressed/);
  const warnings = [];
  const warn = console.warn;
  console.warn = message => warnings.push(message);
  try {
    const iconOnly = render(h(Button, { icon: h('i'), 'aria-label': 'Add' }));
    assert.match(iconOnly, /t98-button--icon/);
    assert.match(iconOnly, /aria-label="Add"/);
    assert.equal(warnings.length, 0);
    render(h(Button, { icon: h('i') }));
    assert.equal(warnings.length, 1);
  } finally { console.warn = warn; }
});

test('Alert works without a title, can be dismissed, and supports variants and role override', () => {
  const plain = render(h(Alert, { tone: 'warning' }, 'Message only'));
  assert.doesNotMatch(plain, /t98-alert-title/);
  assert.match(plain, /role="status"/);
  const dismissible = render(h(Alert, { title: 'T', onDismiss() {}, dismissLabel: 'Close message' }));
  assert.match(dismissible, /<button [^>]*aria-label="Close message"/);
  assert.match(render(h(Alert, { variant: 'inline' }, 'x')), /t98-alert--inline/);
  assert.match(render(h(Alert, { variant: 'banner' }, 'x')), /t98-alert--banner/);
  assert.doesNotMatch(render(h(Alert, { title: 'x' })), /t98-alert--default/);
  assert.match(render(h(Alert, { tone: 'danger', title: 'x' })), /role="alert"/);
  assert.match(render(h(Alert, { tone: 'danger', title: 'x', role: 'status' })), /role="status"/);
});

test('Card chooses its element and heading level and names landmarks by their title', () => {
  const section = render(h(Card, { as: 'section', headingLevel: 2, title: 'Plan' }, 'Body'));
  assert.match(section, /^<section class="t98-card" aria-labelledby="[^"]+"/);
  const id = section.match(/aria-labelledby="([^"]+)"/)[1];
  assert.ok(section.includes(`<h2 id="${id}" class="t98-card-title">Plan</h2>`));
  assert.match(render(h(Card, { as: 'article', headingLevel: 4, title: 'T' })), /^<article [^>]*>.*<h4 /);
  assert.match(render(h(Card, { title: 'T' })), /^<div class="t98-card"><div class="t98-card-header"><div><h3 class="t98-card-title">/);
  assert.equal(render(h(Card, { as: 'section' }, 'Only content')).includes('aria-labelledby'), false);
});

test('Progress can be indeterminate and Meter exposes its range attributes and visible reading', () => {
  const busy = render(h(Progress, { label: 'Syncing' }));
  assert.match(busy, /<progress [^>]*aria-busy="true"/);
  assert.doesNotMatch(busy, /value=|%/);
  assert.match(render(h(Progress, { value: 40 })), /value="40"[^>]*max="100"/);
  const meter = render(h(Meter, { label: 'Storage', value: 72, min: 0, max: 100, low: 60, high: 85, optimum: 10, valueLabel: '72 GB' }));
  for (const attribute of ['value="72"', 'min="0"', 'max="100"', 'low="60"', 'high="85"', 'optimum="10"', 'aria-label="Storage"']) assert.ok(meter.includes(attribute), attribute);
  assert.match(meter, /<span>Storage<\/span><span>72 GB<\/span>/);
});

test('Badge palette replaces the tone and every emitted class is styled', () => {
  for (const palette of ['rose', 'amber', 'lime', 'emerald', 'sky', 'violet', 'fuchsia']) {
    const html = render(h(Badge, { palette, tone: 'danger' }, palette));
    assert.ok(html.includes(`t98-palette--${palette}`));
    assert.doesNotMatch(html, /t98-tone--/);
  }
  assert.match(render(h(Badge, { tone: 'success' }, 'ok')), /t98-tone--success/);
  for (const name of new Set(all)) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('Field labels only its first control; later children keep their own ids', async () => {
  const { Field, Input, Badge } = await import('../dist/index.js');
  const html = renderToStaticMarkup(h(Field, { label: 'Amount', description: 'Before tax' }, h(Input, { name: 'amount' }), h(Badge, null, 'USD')));
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
  assert.match(html, /<input[^>]*aria-describedby="[^"]+-description"/);
  assert.doesNotMatch(html, /<span[^>]*class="t98-badge[^"]*"[^>]*aria-describedby/);
});
