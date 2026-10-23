import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parsePlayerMessage, playerDocument, playerFrameSource, playerScriptUrl, validCommand } from '../dist/player-protocol.js';
import { IsolatedPlayerFrame, ReplayViewer } from '../dist/spatial.js';
import { SandboxedPreview } from '../dist/composition.js';

const base = 'https://app.example.test/projects/1';

test('the player document starts with a connection-blocking CSP and nonces the one script', () => {
  const doc = playerDocument({ scriptUrl: 'https://app.example.test/replay.js', nonce: 'n0nce', token: 't0ken' });
  assert.match(doc, /^<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-n0nce';/);
  for (const directive of ["connect-src 'none'", "worker-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'", "font-src 'none'", "media-src 'none'"]) assert.ok(doc.includes(directive), directive);
  assert.equal((doc.match(/<script /g) ?? []).length, 1);
  assert.match(doc, /<script nonce="n0nce" src="https:\/\/app.example.test\/replay.js" data-ten98-token="t0ken" referrerpolicy="no-referrer"><\/script>$/);
  assert.match(playerDocument({ scriptUrl: 'https://a.test/p.js', nonce: 'n', token: 't', integrity: 'sha384-abc', workers: true }), /worker-src blob:;[\s\S]*integrity="sha384-abc" crossorigin="anonymous"/);
  // Attribute values cannot break out of their quotes.
  assert.doesNotMatch(playerDocument({ scriptUrl: 'https://a.test/p.js"><script>x</script>', nonce: 'n', token: 't' }), /"><script>x/);
});

test('the frame source is always a data: URL; script sources other than https or root-relative paths are refused', () => {
  assert.match(playerFrameSource('<p>x</p>'), /^data:text\/html;charset=utf-8,/);
  assert.equal(playerScriptUrl('/replay.js', base), 'https://app.example.test/replay.js');
  assert.equal(playerScriptUrl('https://cdn.example.test/replay.js', base), 'https://cdn.example.test/replay.js');
  for (const refused of ['blob:https://app.example.test/1234', 'data:text/javascript,alert(1)', 'javascript:alert(1)', '//evil.example/replay.js', 'replay.js', '', 'ftp://x/replay.js'])
    assert.equal(playerScriptUrl(refused, base), null, refused);
});

test('IsolatedPlayerFrame refuses srcDoc, src and same-origin frame sources and never server-renders its nonce or token', () => {
  const props = { title: 'Replay', playerSrc: '/replay.js', payload: { events: [] } };
  for (const source of [{ srcDoc: '<p>x</p>' }, { src: 'blob:https://app.example.test/1' }, { src: '/player.html' }, { srcdoc: '<p>x</p>' }]) {
    const html = renderToStaticMarkup(h(IsolatedPlayerFrame, { ...props, ...source }));
    assert.match(html, /role="alert">The player was refused/, JSON.stringify(source));
    assert.doesNotMatch(html, /<iframe/);
  }
  const ssr = renderToStaticMarkup(h(IsolatedPlayerFrame, props));
  assert.doesNotMatch(ssr, /<iframe|nonce|data-ten98-token/);
  assert.match(ssr, /role="status">Preparing the isolated player…/);
});

test('player messages are validated strictly: exact keys, finite bounded times, ticks only after ready', () => {
  assert.deepEqual(parsePlayerMessage({ type: 'hello', token: 'a' }, null), { type: 'hello', token: 'a' });
  assert.deepEqual(parsePlayerMessage({ type: 'ready', duration: 5000 }, null), { type: 'ready', duration: 5000 });
  assert.deepEqual(parsePlayerMessage({ type: 'tick', time: 10, playing: true }, 5000), { type: 'tick', time: 10, playing: true });
  for (const [message, duration] of [
    [{ type: 'hello', token: 1 }, null], [{ type: 'hello', token: 'a', extra: 1 }, null], [{ type: 'ready', duration: Number.NaN }, null],
    [{ type: 'ready', duration: -1 }, null], [{ type: 'tick', time: 1, playing: true }, null], [{ type: 'tick', time: 6000, playing: true }, 5000],
    [{ type: 'tick', time: 1, playing: 'yes' }, 5000], [{ type: 'navigate', href: 'https://evil' }, 5000], [null, 5000], [['ready'], 5000], ['ready', 5000],
  ]) assert.equal(parsePlayerMessage(message, duration), null, JSON.stringify(message));
  assert.equal(validCommand({ type: 'play', offset: 10 }, 5000), true);
  assert.equal(validCommand({ type: 'play', offset: 6000 }, 5000), false);
  assert.equal(validCommand({ type: 'play', offset: 1 }, null), false);
  assert.equal(validCommand({ type: 'speed', value: 3 }, 5000), false);
  assert.equal(validCommand({ type: 'position', axis: 'y', value: 400 }, 5000, { x: 0, y: 300 }), false);
  assert.equal(validCommand({ type: 'position', axis: 'y', value: 300 }, 5000, { x: 0, y: 300 }), true);
});

test('the simpler hosts never combine allow-scripts with allow-same-origin', () => {
  const controls = { playing: false, onPlayingChange() {}, currentTime: 0, duration: 1, onSeek() {}, playbackRate: 1, allowedRates: [1], onRateChange() {} };
  assert.doesNotMatch(renderToStaticMarkup(h(ReplayViewer, { label: 'R', context: 'c', title: 't', srcDoc: '<p>x</p>', controls })), /allow-same-origin/);
  assert.doesNotMatch(renderToStaticMarkup(h(SandboxedPreview, { title: 't', html: '<p>x</p>' })), /allow-same-origin/);
});
