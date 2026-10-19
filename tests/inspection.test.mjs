import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VisualEvidenceFrame, ReplayControls } from '../dist/inspection.js';

const render = (component, props) => renderToStaticMarkup(h(component, props));
const visual = { label: 'Click evidence', context: 'example.test/product · 640 × 360 · 18 October, 08:00 UTC',
  background: h('p', null, 'BACKGROUND_EVIDENCE'), overlay: h('p', null, 'SPATIAL_OVERLAY'), rankedList: h('ol', null, h('li', null, 'AUTHORIZED_RANKED_COUNTS')) };
const replay = { playing: false, onPlayingChange() {}, currentTime: 12, duration: 90, onSeek() {}, playbackRate: 1, allowedRates: [0.5, 1, 2], onRateChange() {}, skipInactive: false, onSkipInactiveChange() {} };

test('spatial overlays render only with an aligned present background', () => {
  assert.match(render(VisualEvidenceFrame, { ...visual, alignment: 'aligned' }), /SPATIAL_OVERLAY/);
  for (const alignment of ['unknown', 'mismatch', 'unavailable']) {
    const html = render(VisualEvidenceFrame, { ...visual, alignment });
    assert.doesNotMatch(html, /SPATIAL_OVERLAY/);
    assert.match(html, /AUTHORIZED_RANKED_COUNTS/);
    assert.match(html, /ranked elements/);
  }
  assert.doesNotMatch(render(VisualEvidenceFrame, { ...visual, alignment: 'aligned', background: null }), /SPATIAL_OVERLAY/);
});

test('expiry hides capture and overlay while revocation hides all supplied evidence', () => {
  const expired = render(VisualEvidenceFrame, { ...visual, alignment: 'aligned', expired: true });
  assert.doesNotMatch(expired, /SPATIAL_OVERLAY|BACKGROUND_EVIDENCE/);
  assert.match(expired, /Capture expired/);
  assert.match(expired, /AUTHORIZED_RANKED_COUNTS/);
  const revoked = render(VisualEvidenceFrame, { ...visual, alignment: 'aligned', forbidden: true, actions: h('button', null, 'Access help') });
  assert.doesNotMatch(revoked, /SPATIAL_OVERLAY|BACKGROUND_EVIDENCE|AUTHORIZED_RANKED_COUNTS/);
  assert.match(revoked, /Access revoked/);
  assert.match(revoked, /example.test\/product/);
  assert.match(revoked, /Access help/);
});

test('evidence list labels preserve defaults, escape custom text and stay hidden when forbidden', () => {
  const defaults = render(VisualEvidenceFrame, { ...visual, alignment: 'unknown' });
  assert.match(defaults, /aria-label="Click evidence ranked elements"/);
  assert.match(defaults, /<h4 class="t98-visual-ranked-title">Ranked elements<\/h4>/);
  const props = { ...visual, alignment: 'unknown', rankedListLabel: 'Coordinate groups & depth bands <numeric>' };
  const custom = render(VisualEvidenceFrame, props);
  assert.match(custom, /aria-label="Click evidence Coordinate groups &amp; depth bands &lt;numeric&gt;"/);
  assert.match(custom, /<h4 class="t98-visual-ranked-title">Coordinate groups &amp; depth bands &lt;numeric&gt;<\/h4>/);
  assert.match(custom, /AUTHORIZED_RANKED_COUNTS/);
  assert.doesNotMatch(custom, /SPATIAL_OVERLAY|<numeric>/);
  assert.doesNotMatch(render(VisualEvidenceFrame, { ...props, forbidden: true }), /Coordinate groups|AUTHORIZED_RANKED_COUNTS|t98-visual-ranked/);
});

test('unloaded and loading timelines disable native playback controls without claiming zero elapsed', () => {
  for (const loading of [false, true]) {
    const html = render(ReplayControls, { ...replay, currentTime: null, duration: null, loading, reason: 'Explicit loading is app owned.' });
    assert.match(html, /Elapsed unavailable \/ duration unavailable/);
    assert.match(html, /type="range"[^>]*min="0"[^>]*max="0"[^>]*disabled=""/);
    assert.equal([...html.matchAll(/disabled=""/g)].length, 4);
    assert.match(html, /aria-describedby=/);
    if (loading) assert.match(html, /aria-busy="true"/);
    assert.doesNotMatch(html, /Elapsed 0 seconds|NaN|Infinity/);
  }
});

test('seek bounds and rate choices stay finite and positive without issuing callbacks during render', () => {
  const request = () => assert.fail('Rendering must not issue player requests.');
  const html = render(ReplayControls, { ...replay, currentTime: 120, duration: 90, onSeek: request, onPlayingChange: request,
    allowedRates: [1, 1, 2, 0, -1, NaN, Infinity], onRateChange: request });
  assert.match(html, /type="range"[^>]*min="0"[^>]*max="90"[^>]*value="90"/);
  assert.equal([...html.matchAll(/<option value="1"/g)].length, 1);
  assert.match(html, /<option value="2"/);
  assert.doesNotMatch(html, /NaN|Infinity|<option value="0"|<option value="-1"/);
  for (const [currentTime, duration] of [[NaN, Infinity], [-1, 90], [12, -90], [0, 0]]) {
    const invalid = render(ReplayControls, { ...replay, currentTime, duration });
    assert.match(invalid, /type="range"[^>]*disabled=""/);
    assert.doesNotMatch(invalid, /NaN|Infinity|max="-/);
  }
});

test('inactivity skipping is hidden when unsupported and readable without a change callback', () => {
  const { skipInactive, onSkipInactiveChange, ...playback } = replay;
  for (const props of [playback, { ...playback, onSkipInactiveChange }]) {
    const html = render(ReplayControls, props);
    assert.doesNotMatch(html, /Skip inactive periods|type="checkbox"|disabled=""/);
    assert.match(html, /Play recording/);
    assert.match(html, /type="range"/);
    assert.match(html, /Playback speed/);
  }
  for (const skipInactive of [false, true]) {
    const readonly = render(ReplayControls, { ...playback, skipInactive });
    assert.match(readonly, /type="checkbox"[^>]*disabled=""/);
    assert.match(readonly, /Skip inactive periods/);
    assert.equal([...readonly.matchAll(/disabled=""/g)].length, 1);
    assert.equal(/checked=""/.test(readonly), skipInactive);
    const editable = render(ReplayControls, { ...replay, skipInactive });
    assert.match(editable, /type="checkbox"/);
    assert.doesNotMatch(editable, /disabled=""/);
    assert.equal(/checked=""/.test(editable), skipInactive);
  }
});
