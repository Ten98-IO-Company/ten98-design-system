import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
// Type-checked against the source; Node resolves the package's own name to the built dist at run time.
import { RouteErrorScreen, type RouteErrorScreenProps } from '@ten98/ui';

const render = (props: RouteErrorScreenProps) => renderToStaticMarkup(h(RouteErrorScreen, props));
// The visible text in document order, one entry per text node.
const texts = (html: string) => [...html.matchAll(/>([^<]+)</g)].map(match => match[1]);

test('RouteErrorScreen server output contains only its own copy and the given message', () => {
  const message = 'The report could not load. Reference: 7F3A-21C9.';
  const html = render({ message, onRetry() {}, homeHref: '/home' });
  assert.deepEqual(texts(html), ['This page stopped working', message, 'Try again', 'Go to home']);
  assert.match(html, /<section[^>]*aria-labelledby="([^"]+)"[\s\S]*<h1[^>]*id="\1"[^>]*tabindex="-1"/);
  assert.match(html, /role="alert"/);
  assert.match(html, /<a [^>]*href="\/home"[^>]*>Go to home<\/a>/);
  assert.doesNotMatch(html, /<main\b/, 'the shell already owns the main landmark');
});

test('RouteErrorScreen title, retry label and actions follow its props', () => {
  const html = render({ message: 'Saved views could not load.', title: 'Reports stopped working', onRetry() {}, retryLabel: 'Load again' });
  assert.deepEqual(texts(html), ['Reports stopped working', 'Saved views could not load.', 'Load again']);
  assert.doesNotMatch(html, /<a\b/, 'no home link without homeHref');
  assert.deepEqual(texts(render({ message: 'Saved views could not load.' })), ['This page stopped working', 'Saved views could not load.'], 'no actions without onRetry or homeHref');
});

test('RouteErrorScreen shows the default copy for a message that is not a string, without reading the value', () => {
  const touched: string[] = [];
  const error = Object.assign(new Error('internal detail 5f2c'), { cause: 'cause detail 91ab' });
  // Read every value first: formatting the stack reads the message, which would count as a read by the screen.
  const values = Object.fromEntries((['message', 'stack', 'cause', 'name'] as const).map(key => [key, error[key]]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(error, key, { get() { touched.push(key); return value; }, configurable: true });
  Object.assign(error, {
    toString() { touched.push('toString'); return 'toString detail'; },
    [Symbol.toPrimitive]() { touched.push('toPrimitive'); return 'primitive detail'; },
  });
  for (const message of [error, { message: 'object detail 33de' }, 42, null, undefined, '', '   ']) {
    const html = render({ message: message as never, onRetry() {} });
    assert.deepEqual(texts(html), ['This page stopped working', 'An unexpected error interrupted this page.', 'Try again']);
    assert.doesNotMatch(html, /detail|Error/);
  }
  assert.deepEqual(touched, [], 'the screen never reads or converts the value');
});

test('RouteErrorScreen does not import @ten98/runtime', () => {
  const source = readFileSync(new URL('../dist/page-state.js', import.meta.url), 'utf8');
  assert.match(source, /^(['"])use client\1;/);
  assert.doesNotMatch(source, /@ten98\/runtime/);
});
