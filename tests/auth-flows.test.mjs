import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppStateScreen, AuthErrorBoundary, AuthStory, FirstUserSetupFlow, OidcProviderButtons, SignInFlow } from '../dist/index.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const classes = html => [...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(' '));
const brand = h('span', null, 'Brand');
const count = (html, pattern) => (html.match(pattern) ?? []).length;
const tag = (html, name) => html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0] ?? '';

const signIn = props => renderToStaticMarkup(h(SignInFlow, { brand, title: 'Sign in', ...props }));
const setup = props => renderToStaticMarkup(h(FirstUserSetupFlow, { brand, title: 'Create owner account', ...props }));

test('sign-in renders stable field names and autocomplete tokens', () => {
  const html = signIn({ action: '/login' });
  assert.match(tag(html, 'email'), /autoComplete="username"/);
  assert.match(tag(html, 'password'), /autoComplete="current-password"/);
  assert.match(tag(html, 'password'), /maxLength="128"/);
  assert.equal(count(html, /<h1[ >]/g), 1);
});

test('first-user setup renders its fields, policy hint and optional parts', () => {
  const html = setup({ action: '/setup', tokenHint: 'Find it in the log.', tokenLength: { min: 8, max: 64 }, workspaceName: true, sampleOptIn: { label: 'Add sample content', defaultChecked: true } });
  assert.match(tag(html, 'name'), /autoComplete="name"[^>]*maxLength="120"|maxLength="120"[^>]*autoComplete="name"/);
  assert.match(tag(html, 'token'), /type="password"/);
  assert.match(tag(html, 'token'), /autoComplete="off"/);
  assert.match(tag(html, 'token'), /minLength="8"/);
  assert.match(tag(html, 'password'), /autoComplete="new-password"/);
  assert.match(tag(html, 'password'), /minLength="12"/);
  assert.match(tag(html, 'workspaceName'), /autoComplete="organization"/);
  assert.match(tag(html, 'sample'), /type="checkbox"/);
  assert.ok(html.includes('Use at least 12 characters.'));
  assert.ok(html.includes('Find it in the log.'));
  assert.equal(count(html, /<h1[ >]/g), 1);
  const plain = setup({ onSubmit() {}, passwordPolicy: { minLength: 16, maxLength: 64, hint: 'Use a passphrase.' } });
  assert.ok(!plain.includes('name="workspaceName"') && !plain.includes('name="sample"'));
  assert.ok(plain.includes('Use a passphrase.') && /name="password"[^>]*maxLength="64"|maxLength="64"[^>]*name="password"/.test(tag(plain, 'password')));
});

test('native mode posts to action with hidden fields; controlled mode has no action', () => {
  const native = signIn({ action: '/login', hiddenFields: { csrf: 'abc' } });
  assert.match(native, /<form[^>]*action="\/login"/);
  assert.match(native, /<form[^>]*method="post"/);
  assert.match(native, /<input type="hidden" name="csrf" value="abc"\/>/);
  const controlled = signIn({ onSubmit() {} });
  assert.doesNotMatch(controlled, /<form[^>]*(action|method)=/);
});

test('busy state is announced, disabled and shows the busy label', () => {
  const html = signIn({ busy: true, onSubmit() {} });
  assert.match(html, /<form[^>]*aria-busy="true"/);
  assert.match(html, /<fieldset[^>]*disabled=""/);
  assert.match(html, /aria-busy="true"[^>]*>.*Signing in…/);
  assert.ok(!signIn({ onSubmit() {} }).includes('aria-busy'));
});

test('errors and notices use alert and status roles and attach field errors', () => {
  const html = signIn({ onSubmit() {}, error: 'The email or password is incorrect.', notice: { tone: 'success', text: 'Password updated.' }, fieldErrors: { email: 'Enter a valid email address.' } });
  assert.match(html, /role="alert"[^>]*tabindex="-1"|tabindex="-1"[^>]*role="alert"/i);
  assert.match(html, /role="status"/);
  assert.match(tag(html, 'email'), /aria-invalid="true"/);
  assert.ok(html.includes('Enter a valid email address.'));
});

test('forgot password, cancel and sign-in-instead render as links or buttons', () => {
  const html = signIn({ onSubmit() {}, forgotPassword: { href: '/forgot' }, cancel: { label: 'Back', href: '/' } });
  assert.match(html, /<a [^>]*href="\/forgot"[^>]*>Forgot password\?<\/a>/);
  assert.match(html, /<a [^>]*href="\/"[^>]*>Back<\/a>/);
  assert.match(setup({ onSubmit() {}, signInInstead: { onClick() {} } }), /<button[^>]*type="button"[^>]*>Sign in instead<\/button>/);
});

test('OIDC providers render links, buttons, pending and failure states; an empty list renders nothing', () => {
  assert.equal(renderToStaticMarkup(h(OidcProviderButtons, { providers: [] })), '');
  assert.equal(renderToStaticMarkup(h(OidcProviderButtons, { providers: null })), '');
  const html = renderToStaticMarkup(h(OidcProviderButtons, { providers: [{ id: 'a', name: 'Microsoft', href: '/auth/a' }, { id: 'b', name: 'Google' }, { id: 'c', name: 'Okta' }], pending: 'b' }));
  assert.match(html, /<a [^>]*href="\/auth\/a"[^>]*>Continue with Microsoft<\/a>/);
  assert.ok(html.includes('or continue with'));
  assert.match(html, /aria-busy="true"[^>]*>.*Continue with Google/);
  assert.match(html, /disabled=""[^>]*>Continue with Okta/);
  assert.match(renderToStaticMarkup(h(OidcProviderButtons, { providers: null, loading: true })), /role="status"/);
  const failed = renderToStaticMarkup(h(OidcProviderButtons, { providers: null, error: 'Providers unavailable.', onRetry() {} }));
  assert.match(failed, /role="alert"/);
  assert.ok(failed.includes('Try again'));
});

test('story, state screens and boundary keep one h1 and the right roles', () => {
  const story = renderToStaticMarkup(h(AuthStory, { eyebrow: 'E', title: 'Plan.', emphasis: 'Measure.', lead: 'Lead', channels: [{ icon: 'send', label: 'Social' }], footnote: 'Note' }));
  assert.ok(!story.includes('<h'));
  assert.match(story, /<em>Measure\.<\/em>/);
  assert.match(story, /class="auth-channels" aria-hidden="true"/);
  const loading = renderToStaticMarkup(h(AppStateScreen, { state: 'loading', brand }));
  assert.match(loading, /role="status"/);
  assert.equal(count(loading, /<h1[ >]/g), 1);
  for (const state of ['error', 'boundary']) {
    const html = renderToStaticMarkup(h(AppStateScreen, { state, brand, onRetry() {} }));
    assert.match(html, /role="alert"/);
    assert.match(html, /<button[^>]*>(Try again|Reload)<\/button>/);
    assert.equal(count(html, /<h1[ >]/g), 1);
  }
  assert.ok(renderToStaticMarkup(h(AuthErrorBoundary, null, h('p', null, 'ok'))).includes('<p>ok</p>'));
});

test('every emitted t98 class exists in the shipped stylesheet', () => {
  const screens = [
    signIn({ onSubmit() {}, busy: true, error: 'x', notice: { tone: 'info', text: 'y' }, forgotPassword: { href: '/f' }, cancel: { label: 'c', href: '/' }, fieldErrors: { email: 'e' }, providers: h(OidcProviderButtons, { providers: [{ id: 'a', name: 'A', href: '/a' }, { id: 'b', name: 'B' }] }), aside: h(AuthStory, { eyebrow: 'E', title: 'T', lead: 'L', footnote: 'F' }) }),
    setup({ onSubmit() {}, workspaceName: true, sampleOptIn: { label: 's' }, signInInstead: { href: '/' } }),
    renderToStaticMarkup(h(AppStateScreen, { state: 'loading', brand })),
    renderToStaticMarkup(h(AppStateScreen, { state: 'error', brand, onRetry() {} })),
    renderToStaticMarkup(h(OidcProviderButtons, { providers: null, loading: true })),
  ];
  const emitted = new Set(screens.flatMap(classes));
  // The default button size and the secondary variant are the base look and carry no rule of their own.
  for (const name of emitted) if (/^t98-/.test(name) && !['t98-button--md', 't98-button--secondary'].includes(name)) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
  for (const name of ['auth-story-title', 'auth-channels', 'or-divider', 'eyebrow']) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('a labelled AuthLayout is the main landmark; an unlabelled one stays a div for app-owned <main>', async () => {
  const { AuthLayout } = await import('../dist/index.js');
  assert.match(renderToStaticMarkup(h(AuthLayout, { brand: 'Brand', label: 'Sign in' }, 'x')), /^<main class="t98-auth-layout[^"]*" aria-label="Sign in">/);
  assert.match(renderToStaticMarkup(h(AuthLayout, { brand: 'Brand' }, 'x')), /^<div class="t98-auth-layout/);
});
