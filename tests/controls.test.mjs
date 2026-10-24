import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Blockquote, Popover, LoadMore, ResourceCard, Image, Form, Field as UIField, Textarea, CheckboxGroup, CodeBlock, MediaPlayer, MultiCombobox, Combobox, DateTimeField, Disclosure, FileField, Fieldset, InlineCode, Pager, RadioGroup, Scroller, SegmentedControl, StatusLine, Button } from '../dist/index.js';

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

test('Combobox follows the editable list-autocomplete contract and carries its value in a hidden input', () => {
  const html = render(h(Combobox, { label: 'City', options: ['Dubai', 'Doha'], value: 'Do', onValueChange() {}, name: 'city', description: 'Help' }));
  const input = html.match(/<input[^>]*role="combobox"[^>]*>/)[0];
  assert.match(input, /aria-autocomplete="list"/);
  assert.match(input, /aria-expanded="false"/);
  assert.doesNotMatch(input, /aria-activedescendant| name=/);
  const list = input.match(/aria-controls="([^"]+)"/)[1];
  assert.ok(html.includes(`<ul class="t98-combobox-list" id="${list}" role="listbox"`));
  const ids = [...html.matchAll(/<li id="([^"]+)" role="option" aria-selected="false"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, 2);
  assert.match(html, /<input type="hidden" name="city" value="Do"\/>/);
  const id = input.match(/ id="([^"]+)"/)[1];
  assert.ok(input.includes(`aria-describedby="${id}-description"`));
  assert.ok(html.includes('<span role="status" class="t98-visually-hidden"></span>'));
});

test('Combobox accepts label and value options', () => {
  const html = render(h(Combobox, { label: 'City', options: [{ value: 'dxb', label: 'Dubai' }, { value: 'doh', label: 'Doha' }], value: 'dxb', onValueChange() {}, name: 'city' }));
  assert.match(html, /<input[^>]*role="combobox"[^>]*value="Dubai"/);
  assert.match(html, /<input type="hidden" name="city" value="dxb"\/>/);
  assert.ok(html.includes('>Doha</li>'));
});

test('Combobox shows the supplied error for a list-only field only after it was left, and always when custom values are allowed', () => {
  const props = { label: 'City', options: ['Dubai'], onValueChange() {}, error: 'Pick a listed city' };
  assert.ok(!render(h(Combobox, { ...props, allowCustom: false, value: 'Rome' })).includes('Pick a listed city'));
  const free = render(h(Combobox, { ...props, value: 'Rome' }));
  assert.ok(free.includes('role="alert">Pick a listed city'));
  assert.match(free, /aria-invalid="true"/);
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
    { id: 'e', name: 'clip.mp4', size: 4096, status: 'uploading', progress: 42.4 },
    { id: 'f', name: 'bad.mp4', size: 4096, status: 'uploading', progress: Number.NaN },
  ];
  const html = render(h(FileField, { label: 'Attachments', files, onFiles() {}, onRemove() {} }));
  for (const text of ['512 B', '1.5 KB', '5.3 MB', '2 KB', 'Pending', 'Uploaded', 'Failed']) assert.ok(html.includes(text), text);
  assert.match(html, /<progress[^>]*aria-label="Uploading hero.png"/);
  assert.match(html, /<span>42%<\/span><\/div><progress class="t98-progress" value="42.4" max="100" aria-label="Uploading clip.mp4"/);
  // A non-finite progress is indeterminate, never 0%.
  assert.match(html, /<progress class="t98-progress" aria-label="Uploading bad.mp4" aria-busy="true"/);
  assert.doesNotMatch(html, /0%/);
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

test('a list-only Combobox never posts text that is not one of its options', async () => {
  const { Combobox } = await import('../dist/index.js');
  const listed = renderToStaticMarkup(h(Combobox, { label: 'Zone', name: 'zone', options: ['Asia/Dubai'], value: 'Asia/Dubai', onValueChange() {}, allowCustom: false }));
  assert.match(listed, /<input type="hidden" name="zone" value="Asia\/Dubai"/);
  const partial = renderToStaticMarkup(h(Combobox, { label: 'Zone', name: 'zone', options: ['Asia/Dubai'], value: 'Asia/Du', onValueChange() {}, allowCustom: false }));
  assert.match(partial, /<input type="hidden" name="zone" value=""/);
  const custom = renderToStaticMarkup(h(Combobox, { label: 'Tag', name: 'tag', options: ['a'], value: 'new', onValueChange() {} }));
  assert.match(custom, /<input type="hidden" name="tag" value="new"/);
});

test('Fieldset links its error and marks the group invalid; RadioGroup can be required', async () => {
  const { Fieldset, RadioGroup } = await import('../dist/index.js');
  const group = renderToStaticMarkup(h(Fieldset, { legend: 'Slots', error: 'Add at least one slot.' }, 'x'));
  const describedBy = group.match(/<fieldset[^>]*aria-describedby="([^"]+)"/)[1];
  assert.match(group, /<fieldset[^>]*aria-invalid="true"/);
  assert.match(group, new RegExp(`id="${describedBy}"[^>]*role="alert"[^>]*>Add at least one slot\.`));
  const radios = renderToStaticMarkup(h(RadioGroup, { legend: 'Account', name: 'account', required: true, options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }));
  assert.equal([...radios.matchAll(/<input[^>]*type="radio"[^>]*required=""/g)].length, 2);
});

test('MediaPlayer names native controls by its caption, preloads metadata only and never autoplays', () => {
  const audio = renderToStaticMarkup(h(MediaPlayer, { kind: 'audio', label: 'Voice note, 0:42', src: '/a.m4a', type: 'audio/mp4', transcript: 'Hello there', downloadHref: '/a.m4a' }));
  rendered.push(audio);
  assert.match(audio, /<figcaption class="t98-media-player-label">Voice note, 0:42<\/figcaption><audio class="t98-media-player-element" controls="" preload="metadata" aria-label="Voice note, 0:42"><source src="\/a.m4a" type="audio\/mp4"\/>/);
  assert.doesNotMatch(audio, /autoplay|autoPlay/);
  assert.match(audio, /Transcript[\s\S]*Hello there/);
  assert.match(audio, /<a[^>]*href="\/a.m4a"[^>]*download=""|download=""[^>]*href="\/a.m4a"/);
  const video = renderToStaticMarkup(h(MediaPlayer, { kind: 'video', label: 'Video reply', src: '/v.mp4', width: 640, height: 360, poster: '/p.jpg', tracks: [{ src: '/v.vtt', srcLang: 'en', label: 'English', default: true }] }));
  rendered.push(video);
  assert.match(video, /<video[^>]*poster="\/p.jpg"[^>]*width="640"[^>]*height="360"[^>]*playsInline=""|<video[^>]*playsinline=""/i);
  assert.match(video, /<track kind="captions" src="\/v.vtt" srcLang="en" label="English" default=""\/>|<track kind="captions" src="\/v.vtt" srclang="en" label="English" default=""\/>/);
  const gone = renderToStaticMarkup(h(MediaPlayer, { kind: 'video', label: 'Video reply', src: '/v.mp4', unavailable: 'Expired.' }));
  assert.match(gone, /Expired\./);
  assert.doesNotMatch(gone, /<video/);
  assert.match(renderToStaticMarkup(h(MediaPlayer, { kind: 'audio', label: 'Voice' })), /No audio supplied\./);
});

test('Blockquote renders a figure with a native blockquote and an optional caption', () => {
  const html = renderToStaticMarkup(h(Blockquote, { source: 'Visitor', cite: 'https://example.test/c/1' }, 'Quoted'));
  rendered.push(html);
  assert.equal(html, '<figure class="t98-quote"><blockquote class="t98-quote-text" cite="https://example.test/c/1">Quoted</blockquote><figcaption class="t98-quote-source">Visitor</figcaption></figure>');
  assert.doesNotMatch(renderToStaticMarkup(h(Blockquote, null, 'Quoted')), /figcaption/);
  for (const name of ['t98-quote', 't98-quote-text', 't98-quote-source', 't98-media-player', 't98-media-player-label', 't98-media-player-element', 't98-media-player-reason']) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('an async Combobox names a value missing from the current results and posts it', () => {
  const html = renderToStaticMarkup(h(Combobox, { label: 'Airport', name: 'airport', options: [], filter: false, value: 'DXB', valueLabel: 'Dubai (DXB)', onValueChange() {}, allowCustom: false, loading: true }));
  rendered.push(html);
  assert.match(html, /value="Dubai \(DXB\)"/);
  assert.match(html, /<input type="hidden" name="airport" value="DXB"\/>/);
  assert.match(html, /aria-busy="true"[\s\S]*Loading results…/);
});

test('MultiCombobox renders removable tags, one hidden input per value and an aria-multiselectable list', () => {
  const values = [{ value: 'DXB', label: 'Dubai' }, { value: 'DOH', label: 'Doha' }];
  const html = renderToStaticMarkup(h(MultiCombobox, { label: 'Destinations', name: 'to', options: [...values, { value: 'RUH', label: 'Riyadh' }], values, onValuesChange() {}, required: true }));
  rendered.push(html);
  assert.match(html, /<ul class="t98-combobox-tags" aria-label="Selected Destinations">/);
  assert.match(html, /aria-label="Remove Dubai"/);
  assert.match(html, /aria-label="Remove Doha"/);
  assert.match(html, /<input type="hidden" name="to" value="DXB"\/><input type="hidden" name="to" value="DOH"\/>/);
  assert.match(html, /role="listbox"[^>]*aria-multiselectable="true"/);
  assert.match(html, /aria-selected="true"[^>]*>(<svg[^>]*>.*?<\/svg>)Dubai/);
  assert.match(html, /aria-selected="false"[^>]*>(<svg[^>]*>.*?<\/svg>)Riyadh/);
  assert.doesNotMatch(html.slice(html.indexOf('role="combobox"') - 300, html.indexOf('role="combobox"') + 400), /required=""/);
  const empty = renderToStaticMarkup(h(MultiCombobox, { label: 'Destinations', options: values, values: [], onValuesChange() {}, required: true }));
  assert.match(empty, /role="combobox"[^>]*required=""|required=""[^>]*role="combobox"/);
  assert.doesNotMatch(empty, /t98-combobox-tags/);
  for (const name of ['t98-combobox-tags', 't98-combobox-tag', 't98-combobox-tag-label', 't98-combobox-tag-remove', 't98-combobox-check']) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('Form wraps its controls in a lockable fieldset and stays a native form', () => {
  const html = renderToStaticMarkup(h(Form, { action: '/save', method: 'post', gap: 3 }, h('input', { name: 'a' })));
  rendered.push(html);
  assert.match(html, /^<form class="t98-form t98-stack t98-gap-3" action="\/save" method="post"><fieldset class="t98-form-body"><input name="a"\/><\/fieldset><\/form>$/);
  assert.match(renderToStaticMarkup(h(Form, { busy: true, onSubmit() {} }, 'x')), /<form class="t98-form t98-stack t98-gap-4" aria-busy="true"><fieldset class="t98-form-body" disabled="">/);
  assert.ok(styles.includes('.t98-form-body'));
});

test('Field count links "used / max" to the control, counts code points, and marks it invalid only when over', () => {
  const near = renderToStaticMarkup(h(UIField, { label: 'SMS', htmlFor: 'sms', count: { value: 'é'.repeat(155), max: 160 } }, h(Textarea, {})));
  assert.match(near, /<textarea[^>]*id="sms"[^>]*aria-describedby="sms-count"/);
  assert.match(near, /id="sms-count">155 \/ 160 characters</);
  assert.match(near, /t98-field-count--near/);
  assert.match(near, /role="status">Approaching the character limit</);
  assert.doesNotMatch(near, /aria-invalid/);
  const over = renderToStaticMarkup(h(UIField, { label: 'SMS', htmlFor: 'sms', count: { value: 'x'.repeat(170), max: 160 } }, h(Textarea, {})));
  assert.match(over, /aria-invalid="true"/);
  assert.match(over, /170 \/ 160 characters, 10 over the limit/);
  assert.match(over, /role="status">Over the character limit</);
  // A weighted measure (for example GSM-7 extension characters count twice).
  const weighted = renderToStaticMarkup(h(UIField, { label: 'SMS', count: { value: '[]', max: 160, measure: value => [...value].length * 2 } }, h(Textarea, {})));
  assert.match(weighted, />4 \/ 160/);
  const ok = renderToStaticMarkup(h(UIField, { label: 'SMS', count: { value: 'hi', max: 160 } }, h(Textarea, {})));
  assert.match(ok, /role="status"><\/span>/);
  for (const name of ['t98-field-count', 't98-field-count--near', 't98-field-count--over']) assert.ok(styles.includes(`.${name}`), name);
});

test('Combobox options can carry a description under the label', () => {
  const html = renderToStaticMarkup(h(Combobox, { label: 'Interest', options: [{ value: '1', label: 'Running', description: 'Sports › Fitness · 120M people' }, { value: '2', label: 'Cycling' }], value: '', onValueChange() {} }));
  assert.match(html, /role="option"[^>]*><span class="t98-combobox-option-text"><span>Running<\/span><span class="t98-combobox-option-description">Sports › Fitness · 120M people<\/span><\/span><\/li>/);
  assert.match(html, /role="option"[^>]*>Cycling<\/li>/);
  assert.ok(styles.includes('.t98-combobox-option-description'));
});

test('LoadMore states the count, keeps a busy button focusable and explains when more cannot load', () => {
  const more = renderToStaticMarkup(h(LoadMore, { hasMore: true, shown: 50, total: 120, itemLabel: 'messages', onLoadMore() {} }));
  rendered.push(more);
  assert.match(more, /role="status">Showing 50 of 120 messages</);
  assert.match(more, />Load more</);
  const busy = renderToStaticMarkup(h(LoadMore, { hasMore: true, busy: true, shown: 50, onLoadMore() {} }));
  assert.match(busy, /role="status">Loading more items…</);
  assert.match(busy, /aria-busy="true"/);
  assert.match(busy, /aria-disabled="true"[^>]*>Loading…</);
  assert.doesNotMatch(busy, /<button[^>]* disabled=""/);
  const blocked = renderToStaticMarkup(h(LoadMore, { hasMore: true, shown: 50, unavailableReason: 'No cursor.', onLoadMore() {} }));
  assert.match(blocked, /No cursor\./);
  assert.doesNotMatch(blocked, /<button/);
  assert.match(renderToStaticMarkup(h(LoadMore, { hasMore: false, shown: 12, total: 12, onLoadMore() {} })), /Everything is shown\./);
  assert.match(renderToStaticMarkup(h(LoadMore, { hasMore: true, shown: 5, total: null, onLoadMore() {} })), /Showing 5 items</);
  for (const name of ['t98-load-more', 't98-load-more-status', 't98-load-more-reason', 't98-load-more-end']) assert.ok(styles.includes(`.${name}`), name);
});

test('ResourceCard takes a media slot in place of its icon and lists tags', () => {
  const html = renderToStaticMarkup(h(ResourceCard, { title: 'Hero', description: 'Image', tags: ['Image', 'Spring'], media: h(Image, { src: '/h.jpg', alt: 'Hero art', aspect: 'video' }) }));
  rendered.push(html);
  assert.match(html, /class="t98-resource-card t98-resource-card--media"><div class="t98-resource-media"><img/);
  assert.doesNotMatch(html, /t98-resource-icon/);
  assert.match(html, /<ul class="t98-resource-tags" aria-label="Tags for Hero"><li><span class="t98-badge[^"]*">Image<\/span><\/li><li>/);
  assert.match(renderToStaticMarkup(h(ResourceCard, { title: 'T', description: 'D' })), /t98-resource-icon/);
  for (const name of ['t98-resource-media', 't98-resource-tags', 't98-image-fallback']) assert.ok(styles.includes(`.${name}`), name);
});

test('field descriptions keep their own rule: the counter styles never leak into it', () => {
  // Regression: inserting the counter rule split this selector list, right-aligning every description (0.11.0 gate).
  assert.ok(styles.includes('.t98-field-description, .t98-field-error { margin: 0; font-size: 11px; line-height: 17px; overflow-wrap: anywhere; }'));
  assert.doesNotMatch(styles, /\.t98-field-description,\s*\.t98-field-count/);
});

test('Combobox options can be listed but not pickable, with the reason stated', () => {
  const html = renderToStaticMarkup(h(Combobox, { label: 'Interest', value: '', onValueChange() {}, options: [{ value: 'a', label: 'Running' }, { value: 'b', label: 'Cycling', disabled: true, disabledReason: 'Not available in this market' }] }));
  assert.match(html, /aria-disabled="true"[^>]*><span class="t98-combobox-option-text"><span>Cycling<\/span><span class="t98-combobox-option-description">Not available in this market<\/span>/);
  assert.doesNotMatch(html.slice(html.indexOf('Running') - 200, html.indexOf('Running')), /aria-disabled/);
});

test('MultiCombobox at its limit lists other options as not pickable, and a controlled input keeps its text', () => {
  const options = [{ value: 'a', label: 'Dubai' }, { value: 'b', label: 'Doha' }, { value: 'c', label: 'Riyadh' }];
  const html = renderToStaticMarkup(h(MultiCombobox, { label: 'Destinations', options, values: options.slice(0, 2), onValuesChange() {}, max: 2, inputValue: 'Ri', onInputValueChange() {} }));
  assert.match(html, /aria-disabled="true"[^>]*>[\s\S]*?<span>Riyadh<\/span><span class="t98-combobox-option-description">You can pick up to 2\.<\/span>/);
  assert.match(html, /role="combobox"[^>]*value="Ri"|value="Ri"[^>]*role="combobox"/);
  // Picked options stay selectable so they can be removed at the limit.
  assert.doesNotMatch(html.slice(html.indexOf('<span>Dubai') - 300, html.indexOf('<span>Dubai')), /aria-disabled/);
});

test('Popover links a native popover panel to its trigger as a labelled non-modal dialog', () => {
  const html = renderToStaticMarkup(h(Popover, { label: 'Emoji', triggerLabel: 'Add emoji' }, h('button', { type: 'button' }, '😀')));
  rendered.push(html);
  const panelId = html.match(/popovertarget="([^"]+)"|popoverTarget="([^"]+)"/i);
  assert.ok(panelId, html);
  const id = panelId[1] ?? panelId[2];
  assert.match(html, new RegExp(`aria-controls="${id}" aria-expanded="false" aria-haspopup="dialog"`));
  assert.match(html, new RegExp(`<div id="${id}" popover="auto" role="dialog" aria-label="Emoji" tabindex="-1" class="t98-popover-panel">`));
  assert.ok(styles.includes('.t98-popover-panel'));
});
