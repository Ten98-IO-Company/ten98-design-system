import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DestinationPicker, MediaStrip, ContentPreview } from '../dist/composition.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');

const render = (Component, props) => renderToStaticMarkup(h(Component, props));
const accounts = [
  { id: 'main', name: 'Main account', provider: 'Same provider' },
  { id: 'regional', name: 'Regional account', provider: 'Same provider' },
  { id: 'locked', name: 'Locked account', provider: 'Same provider', disabled: true, disabledReason: 'Reconnect this exact account.' },
];
const items = [
  { id: 'stable-a', name: 'first.jpg', status: 'ready', altText: 'First alt' },
  { id: 'stable-b', name: 'second.jpg', status: 'pending', altText: 'Second alt' },
  { id: 'stable-c', name: 'third.jpg', status: 'error', altText: '', error: 'Choose a supported rendition.' },
];
const buttons = html => [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(([, attributes, content]) => ({ attributes, content }));

test('destination selection retains exact accounts and native disabled reasons', () => {
  const html = render(DestinationPicker, { label: 'Destination accounts', accounts, selectedIds: ['regional', 'locked', 'outside-current-list'], onSelectionChange() { assert.fail('Rendering cannot change controlled selection'); } });
  const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map(([input]) => input);
  assert.equal(inputs.length, 3);
  assert.match(html, /<legend[^>]*>Destination accounts<\/legend>/);
  assert.doesNotMatch(inputs[0], /checked=""|disabled=""/);
  assert.match(inputs[1], /value="regional"/);
  assert.match(inputs[1], /checked=""/);
  assert.doesNotMatch(inputs[1], /disabled=""/);
  assert.match(inputs[2], /checked=""/);
  assert.match(inputs[2], /disabled=""/);
  const reasonId = inputs[2].match(/aria-describedby="([^"]+)"/)?.[1];
  assert.ok(reasonId);
  assert.ok(html.includes(`id="${reasonId}"`));
  assert.match(html, /Reconnect this exact account\./);
  assert.equal([...html.matchAll(/Same provider/g)].length, 3, 'Accounts sharing a provider remain separate');
  for (const mode of ['pending', 'readOnly']) {
    const locked = render(DestinationPicker, { label: 'Accounts', accounts, selectedIds: ['regional'], onSelectionChange() {}, [mode]: true });
    assert.equal([...locked.matchAll(/disabled=""/g)].length, 3);
    assert.equal([...locked.matchAll(/checked=""/g)].length, 1);
  }
});

test('media order uses stable IDs and disables only the applicable move boundary', () => {
  const html = render(MediaStrip, { label: 'Draft media', items, onItemsChange() { assert.fail('Rendering cannot mutate media'); } });
  assert.deepEqual([...html.matchAll(/data-media-id="([^"]+)"/g)].map(([, id]) => id), items.map(item => item.id));
  const controls = buttons(html);
  assert.equal(controls.length, 9);
  assert.deepEqual(controls.filter(button => /disabled=""/.test(button.attributes)).map(button => button.content), ['Move earlier', 'Move later']);
  for (const item of items) {
    for (const action of ['Move earlier', 'Move later', 'Remove']) assert.ok(controls.some(button => button.attributes.includes(`aria-label="${action}: ${item.name}"`)));
    assert.ok(html.includes(`Alt text for ${item.name}`));
  }
  assert.match(html, /Processing/);
  assert.match(html, /Failed/);
  assert.match(html, /Choose a supported rendition\./);
  const reversed = render(MediaStrip, { label: 'Draft media', items: [...items].reverse(), onItemsChange() {} });
  assert.deepEqual([...reversed.matchAll(/data-media-id="([^"]+)"/g)].map(([, id]) => id), ['stable-c', 'stable-b', 'stable-a']);
  const one = buttons(render(MediaStrip, { label: 'Single media', items: items.slice(0, 1), onItemsChange() {} }));
  assert.deepEqual(one.map(button => /disabled=""/.test(button.attributes)), [true, true, false]);
});

test('pending and read-only media retain data while constraining native controls', () => {
  for (const mode of ['pending', 'readOnly']) {
    const html = render(MediaStrip, { label: 'Draft media', items, onItemsChange() {}, onFilesSelect() {}, [mode]: true });
    assert.equal(buttons(html).filter(button => /disabled=""/.test(button.attributes)).length, 9);
    assert.match(html, /<input[^>]*type="file"[^>]*multiple=""[^>]*disabled=""/);
    assert.match(html, /First alt/);
    const textareas = [...html.matchAll(/<textarea\b[^>]*>/g)].map(([textarea]) => textarea);
    assert.equal(textareas.length, 3);
    for (const textarea of textareas) assert.match(textarea, mode === 'pending' ? /disabled=""/ : /readOnly=""/);
  }
  assert.match(render(MediaStrip, { label: 'Empty media', items: [], onItemsChange() {} }), /No media attached\./);
});

test('preview labels its approximation and escapes supplied strings without fetching media', () => {
  const html = render(ContentPreview, { label: 'Account preview', destination: '<Main account>', provider: 'Provider & connection', text: '<script>alert("draft")</script>\nSecond line', media: h('span', null, 'App-supplied media'), footer: 'App-owned readiness', pending: true, error: 'Refresh failed; retained copy.' });
  assert.match(html, /aria-labelledby="[^"]+"/);
  assert.match(html, /aria-describedby="[^"]+"/);
  assert.match(html, /Approximate preview\. Final delivery may look different\./);
  assert.match(html, /&lt;Main account&gt;/);
  assert.match(html, /Provider &amp; connection/);
  assert.match(html, /&lt;script&gt;alert\(&quot;draft&quot;\)&lt;\/script&gt;\nSecond line/);
  assert.doesNotMatch(html, /<script|<img|<iframe/);
  assert.match(html, /App-supplied media/);
  assert.match(html, /App-owned readiness/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /Refresh failed; retained copy\./);
  assert.match(render(ContentPreview, { label: 'Empty preview', destination: 'Main', provider: 'Provider' }), /No content supplied for this destination\./);
});

test('unverified media metadata does not imply processing or readiness', () => {
  const html = render(MediaStrip, { label: 'Media', items: [{ id: 'unknown', name: 'image.jpg', status: 'unverified', altText: '' }], onItemsChange() {}, readOnly: true });
  assert.match(html, /Metadata unverified/);
  assert.doesNotMatch(html, /aria-busy="true"|>Processing<|>Ready</);
});

test('MediaStrip previews a url by type and lists known facts, leaving out missing or invalid ones', () => {
  const items = [
    { id: 'i', name: 'poster.jpg', status: 'ready', altText: 'Poster', url: '/p.jpg', type: 'image/jpeg', width: 1080, height: 1350, size: 48200 },
    { id: 'v', name: 'tour.mp4', status: 'ready', altText: '', url: '/t.mp4', type: 'video/mp4', width: 1080, height: 1920, duration: 3725, size: 18400000 },
    { id: 'x', name: 'unknown.bin', status: 'unverified', altText: '', url: '/u.bin', type: 'application/octet-stream', width: 0, height: Number.NaN, duration: -1, size: Number.NaN },
  ];
  const html = render(MediaStrip, { label: 'Draft media', items, onItemsChange() {} });
  assert.match(html, /<img[^>]*src="\/p.jpg"[^>]*alt="Poster"|<img[^>]*alt="Poster"[^>]*src="\/p.jpg"/);
  assert.match(html, /1080 × 1350 px · 47.1 KB/);
  assert.match(html, /<video[^>]*aria-label="Preview of tour.mp4"/);
  assert.match(html, /1080 × 1920 px · 1:02:05 · 17.5 MB/);
  const unknown = html.slice(html.indexOf('data-media-id="x"'));
  assert.match(unknown, /Preview unavailable/);
  assert.doesNotMatch(unknown, /t98-media-facts|0 × |0:00|NaN/);
  assert.ok(styles.includes('.t98-media-facts'));
});

test('ContentPreview chrome layouts stay neutral and keep text, media and identity readable', () => {
  const base = { label: 'Preview', destination: 'Studio main', provider: 'Social connection', text: 'Opening Saturday', media: h('img', { src: '/s.jpg', alt: 'Studio' }) };
  const card = render(ContentPreview, base);
  assert.match(card, /t98-content-preview-frame t98-content-preview-frame--card/);
  assert.doesNotMatch(card, /t98-content-preview-surface|t98-avatar/);
  const post = render(ContentPreview, { ...base, chrome: 'post' });
  assert.match(post, /t98-content-preview-surface"><div class="t98-content-preview-identity"><span[^>]*t98-avatar/);
  assert.ok(post.indexOf('Opening Saturday') < post.indexOf('alt="Studio"'));
  const story = render(ContentPreview, { ...base, chrome: 'story' });
  assert.ok(story.indexOf('alt="Studio"') < story.indexOf('Opening Saturday'), 'story media comes first, under the text');
  const message = render(ContentPreview, { ...base, chrome: 'message' });
  assert.match(message, /t98-content-preview-bubble"><div class="t98-content-preview-text">Opening Saturday/);
  for (const html of [post, story, message]) assert.match(html, /Approximate preview\. Final delivery may look different\./);
  for (const name of ['t98-content-preview-surface', 't98-content-preview-bubble', 't98-content-preview-who', 't98-content-preview-frame--story', 't98-content-preview-frame--post', 't98-content-preview-frame--message']) assert.ok(styles.includes(`.${name}`), name);
});
