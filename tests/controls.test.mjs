import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CheckboxGroup, CodeBlock, Combobox, DateTimeField, Disclosure, FileField, Fieldset, InlineCode, Pager, RadioGroup, Scroller, SegmentedControl, StatusLine, Button } from '../dist/index.js';

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

test('DateTimeField sets the native type and limits and describes the time zone', () => {
  const html = render(h(DateTimeField, { label: 'Publish at', value: '2026-10-20T09:30', onValueChange() {}, min: '2026-10-01T00:00', max: '2026-12-31T23:59', step: 60, name: 'publishAt', description: 'Help', timeZoneLabel: 'Asia/Dubai (GST)', required: true }));
  assert.match(html, /<input[^>]*type="datetime-local"/);
  assert.match(html, /min="2026-10-01T00:00"[^>]*max="2026-12-31T23:59"|max="2026-12-31T23:59"[^>]*min="2026-10-01T00:00"/);
  assert.match(html, /name="publishAt"/);
  const zone = html.match(/<p class="t98-field-description t98-datetime-zone" id="([^"]+)">/)[1];
  assert.ok(html.includes('>Asia/Dubai (GST)</p>'));
  const describedBy = html.match(/<input[^>]*aria-describedby="([^"]+)"/)[1].split(' ');
  assert.ok(describedBy.includes(zone) && describedBy.some(id => id.endsWith('-description')));
  assert.match(render(h(DateTimeField, { label: 'Day', type: 'date', value: '', onValueChange() {}, error: 'Required' })), /type="date"[^>]*aria-invalid="true"|aria-invalid="true"[^>]*type="date"/);
  assert.match(render(h(DateTimeField, { label: 'At', type: 'time', value: '', onValueChange() {} })), /type="time"/);
  assert.doesNotMatch(render(h(DateTimeField, { label: 'At', value: '', onValueChange() {} })), /t98-datetime-zone/);
});

test('FileField passes accept, multiple and name to a native file input behind a visible button', () => {
  const html = render(h(FileField, { label: 'Attachments', accept: 'image/*', multiple: true, name: 'files', onFiles() {} }));
  assert.match(html, /<input[^>]*class="t98-input t98-file-input"[^>]*type="file"/);
  assert.ok(html.includes('accept="image/*"'));
  assert.match(html, /multiple=""/);
  assert.match(html, /name="files"/);
  assert.ok(html.includes('>Choose files</button>'));
  assert.match(html, /tabindex="-1"/);
  assert.ok(html.includes('<span role="status" class="t98-visually-hidden"></span>'));
  assert.match(render(h(FileField, { label: 'A', onFiles() {}, disabled: true })), /<button[^>]* disabled=""[^>]*>Choose files/);
});

test('FileField lists files with readable sizes, statuses and labelled remove buttons', () => {
  const files = [
    { id: 'a', name: 'tiny.txt', size: 512, status: 'pending' },
    { id: 'b', name: 'report.pdf', size: 1536, status: 'done' },
    { id: 'c', name: 'video.mov', size: 5 * 1024 * 1024 + 300000, status: 'error', error: 'Unsupported type' },
    { id: 'd', name: 'hero.png', size: 2048, status: 'uploading' },
  ];
  const html = render(h(FileField, { label: 'Attachments', files, onFiles() {}, onRemove() {} }));
  for (const text of ['512 B', '1.5 KB', '5.3 MB', '2 KB', 'Pending', 'Uploaded', 'Failed']) assert.ok(html.includes(text), text);
  assert.match(html, /<progress[^>]*aria-label="Uploading hero.png"/);
  for (const { name } of files) assert.ok(html.includes('aria-label="Remove ' + name + '"'), name);
  const id = html.match(/aria-describedby="([^"]+-c-error)"/)[1];
  assert.ok(html.includes('id="' + id + '">Unsupported type'));
  assert.doesNotMatch(render(h(FileField, { label: 'A', files, onFiles() {} })), /Remove /);
});

test('FileField describes the input by its description and error', () => {
  const html = render(h(FileField, { label: 'Attachments', description: 'PDF only', error: 'Too large', onFiles() {} }));
  const ids = html.match(/<input[^>]*aria-describedby="([^"]+)"/)[1].split(' ');
  assert.equal(ids.length, 2);
  for (const id of ids) assert.ok(html.includes('id="' + id + '"'), id);
  assert.match(html, /<input[^>]*aria-invalid="true"/);
  assert.ok(html.includes('role="alert">Too large'));
});

test('every emitted control class exists in the shipped stylesheet', () => {
  // Primitive button modifiers for the default variant and size are intentionally unstyled.
  for (const name of new Set(rendered.flatMap(classes))) if (!/^t98-button--(md|secondary)$/.test(name)) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});
