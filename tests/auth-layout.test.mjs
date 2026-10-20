import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuthLayout } from '../dist/index.js';

test('omitting the layout heading preserves an app-owned authentication heading and native form', () => {
  const html = renderToStaticMarkup(h(AuthLayout, { brand: 'Discover', aside: h('p', null, 'Research') },
    h('form', { action: '/native-sign-in', method: 'post' }, h('h1', null, 'Recover account'),
      h('input', { type: 'email', name: 'email', required: true, autoComplete: 'username' }),
      h('button', { type: 'submit' }, 'Continue'))));
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.match(html, /<h1>Recover account<\/h1>/);
  assert.match(html, /action="\/native-sign-in" method="post"/);
  const input = html.match(/<input\b[^>]*>/)?.[0] || '';
  for (const attribute of ['type="email"', 'name="email"', 'required=""', 'autoComplete="username"']) assert.ok(input.includes(attribute));
  assert.match(html, /class="auth-story t98-auth-aside"/);
  assert.match(html, /class="auth-orbit" aria-hidden="true"/);
});

test('an explicit layout title retains the existing single-heading presentation', () => {
  const html = renderToStaticMarkup(h(AuthLayout, { brand: 'Campaign', title: 'Sign in', description: 'Use your account.' }, h('form', null, h('button', { type: 'submit' }, 'Sign in'))));
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.match(html, /<h1 class="t98-auth-title">Sign in<\/h1>/);
  assert.match(html, /Use your account\./);
  assert.equal([...html.matchAll(/<form\b/g)].length, 1);
});
