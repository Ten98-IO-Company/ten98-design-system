import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CheckboxGroup, CodeBlock, Combobox, Disclosure, Fieldset, InlineCode, Pager, RadioGroup, Scroller, SegmentedControl, StatusLine, Button } from '../dist/index.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const classes = html => [...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(' '));
const options = [{ value: 'a', label: 'Alpha', description: 'First' }, { value: 'b', label: 'Beta' }];
const rendered = [];
const checked = value => new RegExp(`value="${value}"[^>]*checked=""|checked=""[^>]*value="${value}"`);
const render = element => { const html = renderToStaticMarkup(element); rendered.push(html); return html; };

test('Disclosure follows the controlled state and keeps actions outside the summary', () => {
  const open = render(h(Disclosure, { summary: 'Advanced', open: true, onOpenChange() {}, actions: h(Button, null, 'Reset') }, 'Body'));
  assert.match(open, /<details class="t98-disclosure-details" open="">/);
  assert.match(open, /<summary[^>]*>.*Advanced.*<\/summary>/);
  assert.doesNotMatch(open.match(/<summary[\s\S]*?<\/summary>/)[0], /button/);
  assert.match(open, /<\/details><div class="t98-disclosure-actions"><button/);
  assert.doesNotMatch(render(h(Disclosure, { summary: 'S', open: false }, 'B')), /<details[^>]* open/);
  assert.match(render(h(Disclosure, { summary: 'S', defaultOpen: true, variant: 'plain' }, 'B')), /t98-disclosure--plain.*<details[^>]* open=""/);
});

test('Fieldset names its group, can hide the legend visually and disables its controls', () => {
  const html = render(h(Fieldset, { legend: 'Schedule', description: 'Help', disabled: true, layout: 'grid' }, 'x'));
  assert.match(html, /<fieldset[^>]* disabled=""[^>]* aria-describedby="([^"]+)-description"/);
  assert.match(html, /<legend class="t98-fieldset-legend">Schedule<\/legend>/);
  assert.match(html, /t98-fieldset-body--grid/);
  const hidden = render(h(Fieldset, { legend: 'Schedule', hideLegend: true }, 'x'));
  assert.match(hidden, /<legend[^>]*><span class="t98-visually-hidden">Schedule<\/span><\/legend>/);
});

test('RadioGroup shares one name, marks the checked option and describes its error', () => {
  const html = render(h(RadioGroup, { legend: 'Channel', name: 'channel', options, value: 'b', error: 'Pick one', onValueChange() {} }));
  assert.equal((html.match(/name="channel"/g) ?? []).length, 2);
  assert.match(html, checked('b'));
  assert.doesNotMatch(html, checked('a'));
  const id = html.match(/aria-describedby="([^"]+)-error"/)[1];
  assert.ok(html.includes(`id="${id}-error"`) && html.includes('role="alert">Pick one'));
  assert.match(html, /<fieldset[^>]*role="radiogroup"[^>]*aria-invalid="true"/);
  assert.match(render(h(RadioGroup, { legend: 'C', name: 'n', options, defaultValue: 'a' })), checked('a'));
});

test('CheckboxGroup reflects the selected values and scrolls in a labelled region', () => {
  const html = render(h(CheckboxGroup, { legend: 'Destinations', options, value: ['a'], onValueChange() {}, maxHeight: 'sm' }));
  assert.match(html, checked('a'));
  assert.doesNotMatch(html, checked('b'));
  assert.match(html, /role="region" tabindex="0" aria-label="Destinations options"/);
  assert.ok(classes(html).includes('t98-scroll-region--sm'));
});

test('SegmentedControl exposes aria-pressed and a single tab stop', () => {
  const html = render(h(SegmentedControl, { label: 'Range', value: 'b', onValueChange() {}, options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }));
  assert.match(html, /role="group" aria-label="Range"/);
  assert.match(html, /aria-pressed="false" tabindex="-1"[^>]*>A</);
  assert.match(html, /aria-pressed="true" tabindex="0"[^>]*>B</);
});

test('Pager disables absent ends and announces its status politely', () => {
  const html = render(h(Pager, { status: '1–20 of 132', onNext() {} }));
  assert.match(html, /^<nav class="t98-pager" aria-label="Pagination">/);
  assert.match(html, /<button[^>]* disabled=""[^>]*>.*Previous<\/button>/);
  assert.doesNotMatch(html.match(/<button[^>]*>Next/)[0], /disabled/);
  assert.match(html, /<span class="t98-pager-status" role="status">1–20 of 132<\/span>/);
});

test('CodeBlock is a labelled focusable region with a copy button; InlineCode is a code element', () => {
  const html = render(h(CodeBlock, { code: 'a < b', language: 'ts', copy: true, maxHeight: 'md', wrap: true }));
  assert.match(html, /<pre class="t98-code-pre t98-code-pre--wrap t98-scroll-region--md" role="region" tabindex="0" aria-label="ts code"><code>a &lt; b<\/code><\/pre>/);
  assert.ok(html.includes('Copy code'));
  assert.match(render(h(InlineCode, null, 'x')), /^<code class="t98-inline-code">x<\/code>$/);
});

test('StatusLine marks busy work and picks the live role', () => {
  const busy = render(h(StatusLine, { busy: true }, 'Loading'));
  assert.match(busy, /role="status" aria-live="polite" aria-busy="true"/);
  assert.match(busy, /<span class="t98-spinner" aria-hidden="true"><\/span>/);
  assert.match(render(h(StatusLine, { tone: 'danger', live: 'assertive' }, 'Failed')), /role="alert" aria-live="assertive"/);
});

test('Combobox wires its datalist and shows the supplied error only for values outside the list', () => {
  const html = render(h(Combobox, { label: 'City', options: ['Dubai', 'Doha'], value: 'Rome', onValueChange() {}, allowCustom: false, error: 'Pick a listed city', name: 'city' }));
  const list = html.match(/list="([^"]+)"/)[1];
  assert.ok(html.includes(`<datalist id="${list}"><option value="Dubai"></option>`));
  assert.match(html, /name="city"/);
  assert.match(html, /aria-invalid="true"/);
  assert.ok(html.includes('Pick a listed city'));
  assert.ok(!render(h(Combobox, { label: 'City', options: ['Dubai'], value: 'Dubai', onValueChange() {}, allowCustom: false, error: 'Nope' })).includes('Nope'));
});

test('Scroller is a labelled, focusable region', () => {
  assert.equal(render(h(Scroller, { label: 'Spend' }, 'x')), '<div class="t98-scroller" role="region" tabindex="0" aria-label="Spend">x</div>');
});

test('every emitted control class exists in the shipped stylesheet', () => {
  // Primitive button modifiers for the default variant and size are intentionally unstyled.
  for (const name of new Set(rendered.flatMap(classes))) if (!/^t98-button--(md|secondary)$/.test(name)) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});
