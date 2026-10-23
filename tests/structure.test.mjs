import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FormActions, FormGrid, Grid, Heading, Image, Inline, Link, Stack, Text, VisuallyHidden } from '../dist/index.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const classes = html => [...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(' '));

test('layout primitives render semantic tags with token classes that exist in the shipped stylesheet', () => {
  const html = renderToStaticMarkup(h(Stack, { as: 'section', gap: 6, 'aria-label': 'Report' },
    h(Inline, { justify: 'between', wrap: false }, h(Text, { as: 'span' }, 'A')),
    h(Grid, { as: 'ul', columns: 3, gap: 2 }, h(Stack, { as: 'li' }, 'One')),
    h(Grid, { minItemWidth: 'lg' }),
    h(FormGrid), h(FormActions)));
  assert.match(html, /^<section aria-label="Report" class="t98-stack t98-gap-6">/);
  assert.match(html, /<ul class="t98-grid t98-gap-2 t98-grid--3"><li class="t98-stack t98-gap-4">One<\/li><\/ul>/);
  assert.match(html, /class="t98-grid t98-gap-4 t98-grid--auto t98-grid--min-lg"/);
  for (const name of new Set(classes(html))) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('forms keep native submission attributes when composed from Stack', () => {
  const html = renderToStaticMarkup(h(Stack, { as: 'form', action: '/save', method: 'post', noValidate: true }, h(FormActions, null, 'x')));
  assert.match(html, /^<form [^>]*class="t98-stack t98-gap-4"/);
  for (const attribute of ['action="/save"', 'method="post"', 'noValidate=""']) assert.ok(html.includes(attribute), attribute);
});

test('text and heading separate outline level from visual size and only emit styled classes', () => {
  const html = renderToStaticMarkup(h('div', null,
    h(Heading, { level: 1 }, 'Page'), h(Heading, { level: 3, size: 'xl' }, 'Sub'),
    h(Text, { tone: 'muted', size: 'sm', weight: 'semibold', numeric: true, truncate: true, title: 'Full value' }, 'Value'),
    h(Text, { as: 'time', dateTime: '2026-10-20' }, 'Today'),
    h(VisuallyHidden, null, 'Hidden')));
  assert.match(html, /<h1 class="t98-heading t98-heading--2xl">Page<\/h1>/);
  assert.match(html, /<h3 class="t98-heading t98-heading--xl">Sub<\/h3>/);
  assert.match(html, /<p title="Full value" class="t98-text t98-text--sm t98-text-tone-muted t98-weight-semibold t98-numeric t98-truncate">/);
  assert.match(html, /<time dateTime="2026-10-20" class="t98-text">/i);
  assert.match(html, /<span class="t98-visually-hidden">Hidden<\/span>/);
  for (const name of new Set(classes(html))) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('links protect new-tab openers and delegate to a router component without losing styling', () => {
  const external = renderToStaticMarkup(h(Link, { href: 'https://example.com', target: '_blank' }, 'Docs'));
  assert.match(external, /rel="noopener noreferrer"/);
  assert.match(external, /class="t98-link t98-link--inline"/);
  const RouterLink = ({ href, className, children }) => h('a', { href, className, 'data-router': '' }, children);
  const routed = renderToStaticMarkup(h(Link, { href: '/reports', variant: 'standalone', component: RouterLink }, 'Reports'));
  assert.equal(routed, '<a href="/reports" class="t98-link t98-link--standalone" data-router="">Reports</a>');
});

test('images require alt text and default to lazy, async decoding', () => {
  const html = renderToStaticMarkup(h(Image, { src: '/a.png', alt: '', aspect: 'video' }));
  assert.equal(html, '<img src="/a.png" alt="" loading="lazy" decoding="async" class="t98-image t98-image--cover t98-aspect-video t98-image--rounded"/>');
});

test('options, description lists and prose lists keep native semantics', async () => {
  const { DescriptionList, List, ListItem, Option, OptionGroup, Select } = await import('../dist/index.js');
  const select = renderToStaticMarkup(h(Select, { 'aria-label': 'Range', defaultValue: '7' }, h(OptionGroup, { label: 'Recent' }, h(Option, { value: '7' }, '7 days'))));
  assert.match(select, /<optgroup label="Recent"><option value="7" selected="">7 days<\/option><\/optgroup>/);
  const details = renderToStaticMarkup(h(DescriptionList, { columns: 2, items: [{ term: 'Kind', description: 'Image' }] }));
  assert.equal(details, '<dl class="t98-description-list t98-description-list--2"><div><dt>Kind</dt><dd>Image</dd></div></dl>');
  const list = renderToStaticMarkup(h(List, { ordered: true }, h(ListItem, null, 'First')));
  assert.equal(list, '<ol class="t98-list t98-gap-1"><li class="t98-list-item">First</li></ol>');
  for (const name of new Set(classes(details + list)).values()) if (name !== 't98-list-item') assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('Text can keep the line breaks and spacing of multi-line text while long words still wrap', async () => {
  const { Text } = await import('../dist/index.js');
  const html = renderToStaticMarkup(h(Text, { preserveWhitespace: true }, 'Line one\n\n  indented line'));
  assert.match(html, /class="t98-text t98-text--pre"/);
  assert.match(styles, /\.t98-text--pre \{ white-space: pre-wrap; overflow-wrap: anywhere; \}/);
});
