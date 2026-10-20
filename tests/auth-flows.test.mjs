import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppStateScreen, AuthErrorBoundary, AuthStory, FirstUserSetupFlow, InvitationAcceptFlow, OidcProviderButtons, PasswordRecoveryFlow, SignInFlow, TwoFactorChallengeFlow, WorkspaceOnboarding } from '../dist/index.js';

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

const twoFactor = props => renderToStaticMarkup(h(TwoFactorChallengeFlow, { brand, title: 'Verify', onModeChange() {}, action: '/2fa', ...props }));
const recovery = props => renderToStaticMarkup(h(PasswordRecoveryFlow, { brand, title: 'Reset', backToSignIn: { href: '/login' }, ...props }));
const invite = props => renderToStaticMarkup(h(InvitationAcceptFlow, { brand, title: 'Join', onSubmit() {}, invitation: { workspaceName: 'Acme', email: 'new@example.test', role: 'Editor', expiresAt: '2030-01-15T12:00:00Z' }, formatDate: value => String(value).slice(0, 10), ...props }));
const onboarding = props => renderToStaticMarkup(h(WorkspaceOnboarding, { brand, email: 'member@example.test', action: '/workspaces', ...props }));

test('two-factor mode sets the code input constraints, copy and toggle', () => {
  const authenticator = twoFactor({ mode: 'authenticator' });
  assert.match(tag(authenticator, 'code'), /autoComplete="one-time-code"/);
  assert.match(tag(authenticator, 'code'), /inputMode="numeric"/);
  assert.match(tag(authenticator, 'code'), /maxLength="6"/);
  assert.ok(authenticator.includes('Authentication code') && authenticator.includes('6-digit'));
  assert.match(authenticator, /<button[^>]*type="button"[^>]*>Use a recovery code<\/button>/);
  assert.match(authenticator, /<input type="hidden" name="mode" value="authenticator"\/>/);
  const recoveryMode = twoFactor({ mode: 'recovery', cancel: { href: '/login' } });
  assert.match(tag(recoveryMode, 'code'), /inputMode="text"/);
  assert.match(tag(recoveryMode, 'code'), /maxLength="21"/);
  assert.ok(recoveryMode.includes('Recovery code') && recoveryMode.includes('Use your authenticator app'));
  assert.match(recoveryMode, /<a [^>]*href="\/login"[^>]*>Back to sign in<\/a>/);
  assert.match(tag(twoFactor({ mode: 'authenticator', codeLength: { authenticator: 8 } }), 'code'), /maxLength="8"/);
});

test('password recovery renders request, loading, disabled, error, sent, reset and invalid', () => {
  const request = recovery({ stage: 'request', action: '/forgot' });
  assert.match(tag(request, 'email'), /autoComplete="username"/);
  assert.ok(request.includes('Send reset link') && request.includes('Back to sign in'));
  assert.match(recovery({ stage: 'request', availability: 'loading' }), /role="status"/);
  for (const [availability, text] of [['disabled', 'not available for this installation'], ['error', 'could not be checked']]) {
    const html = recovery({ stage: 'request', availability });
    assert.ok(html.includes(text) && !html.includes('name="email"'), availability);
  }
  assert.ok(recovery({ stage: 'request', availability: 'disabled', messages: { disabled: 'Ask an administrator.' } }).includes('Ask an administrator.'));
  const sent = recovery({ stage: 'request', sent: true });
  assert.ok(sent.includes('a reset link is on its way') && !sent.includes('<form'));
  const reset = recovery({ stage: 'reset', action: '/reset', token: 'abc', hiddenFields: { csrf: 'x' } });
  assert.match(tag(reset, 'password'), /autoComplete="new-password"/);
  assert.match(tag(reset, 'confirmation'), /autoComplete="new-password"/);
  assert.ok(reset.includes('Use at least 12 characters.'));
  assert.match(reset, /<input type="hidden" name="token" value="abc"\/>/);
  assert.match(reset, /<input type="hidden" name="csrf" value="x"\/>/);
  const invalid = recovery({ stage: 'reset', invalid: true, onRequestNewLink() {} });
  assert.ok(invalid.includes('expired or was already used') && !invalid.includes('<form'));
  assert.match(invalid, /<button[^>]*>Request a new link<\/button>/);
  const failed = recovery({ stage: 'reset', action: '/reset', fieldErrors: { confirmation: 'Passwords differ.' } });
  assert.match(tag(failed, 'confirmation'), /aria-invalid="true"/);
  assert.ok(failed.includes('Passwords differ.'));
  assert.ok(recovery({ stage: 'reset', action: '/reset', unconfirmed: 'Unknown result.' }).includes('Unknown result.'));
});

test('invitation states render one h1 and the right action', () => {
  const cases = [
    [{ state: 'loading', invitation: undefined }, /role="status"/],
    [{ state: 'details' }, />Create account and join<\/button>/],
    [{ state: 'details', signedInEmail: 'new@example.test' }, />Join workspace<\/button>/],
    [{ state: 'details', accountExists: true, onSignIn() {} }, />Sign in to join<\/button>/],
    [{ state: 'signin-required', onSignIn() {} }, />Sign in to join<\/button>/],
    [{ state: 'mismatch', signedInEmail: 'other@example.test', onSwitchAccount() {} }, /Signed in as other@example\.test; this invitation is for new@example\.test\./],
    [{ state: 'unavailable', invitation: undefined, error: 'Invitation cancelled.', onRetry() {} }, />Try again<\/button>/],
    [{ state: 'accepted', continueAction: { href: '/' } }, /<a [^>]*href="\/"[^>]*>Open workspace<\/a>/],
  ];
  for (const [props, expected] of cases) {
    const html = invite(props);
    assert.equal(count(html, /<h1[ >]/g), 1, props.state);
    assert.match(html, expected, props.state);
  }
  const create = invite({ state: 'details' });
  assert.match(tag(create, 'name'), /autoComplete="name"/);
  assert.match(tag(create, 'password'), /autoComplete="new-password"/);
  assert.ok(create.includes('2030-01-15') && create.includes('new@example.test') && create.includes('Editor'));
  assert.ok(!invite({ state: 'details', signedInEmail: 'new@example.test' }).includes('name="password"'));
  assert.ok(!invite({ state: 'details', accountExists: true }).includes('name="password"'));
  assert.match(invite({ state: 'details', token: 'inv', action: '/accept', onSubmit: undefined }), /<input type="hidden" name="token" value="inv"\/>/);
});

test('workspace onboarding shows the account, a create form and a native sign-out form', () => {
  const html = onboarding({ help: 'Ask an owner.', onRefresh() {}, account: { label: 'Account settings', href: '/account' }, signOut: { action: '/logout', hiddenFields: { csrf: 'x' } } });
  assert.equal(count(html, /<h1[ >]/g), 1);
  assert.ok(html.includes('Workspace access') && html.includes('Signed in as member@example.test') && html.includes('Ask an owner.'));
  assert.equal(count(html, /<h2[ >]/g), 1);
  assert.match(tag(html, 'name'), /maxLength="120"/);
  assert.match(html, />Refresh access<\/button>/);
  assert.match(html, /<a [^>]*href="\/account"[^>]*>Account settings<\/a>/);
  assert.match(html, /<form action="\/logout" method="post"><input type="hidden" name="csrf" value="x"\/><button[^>]*type="submit"[^>]*>Sign out<\/button><\/form>/);
  assert.match(onboarding({ signOut: { onClick() {} } }), /<button[^>]*type="button"[^>]*>Sign out<\/button>/);
  assert.ok(onboarding({ children: h('p', null, 'Extra') }).includes('<p>Extra</p>'));
});

test('unconfirmed outcomes render a warning alert distinct from errors', () => {
  const html = signIn({ onSubmit() {}, unconfirmed: 'Result unknown.', error: 'Failed.' });
  assert.match(html, /t98-tone--warning[^>]*role="alert"|role="alert"[^>]*t98-tone--warning/);
  assert.ok(html.includes('Result unknown.') && html.includes('Failed.'));
  const screen = renderToStaticMarkup(h(AppStateScreen, { state: 'unconfirmed', brand, onRetry() {} }));
  assert.match(screen, /t98-tone--warning/);
  assert.ok(screen.includes('may or may not have completed'));
  assert.match(screen, /<button[^>]*>Reload<\/button>/);
});

test('every auth flow and state renders exactly one main landmark and one h1', () => {
  const screens = {
    signin: signIn({ onSubmit() {} }), setup: setup({ onSubmit() {} }),
    loading: renderToStaticMarkup(h(AppStateScreen, { state: 'loading', brand })), error: renderToStaticMarkup(h(AppStateScreen, { state: 'error', brand })),
    boundary: renderToStaticMarkup(h(AppStateScreen, { state: 'boundary', brand })), unconfirmed: renderToStaticMarkup(h(AppStateScreen, { state: 'unconfirmed', brand })),
    labelled: signIn({ onSubmit() {}, label: 'Custom label' }),
    twoFactorA: twoFactor({ mode: 'authenticator' }), twoFactorR: twoFactor({ mode: 'recovery' }),
    onboarding: onboarding({}),
  };
  for (const stage of ['request', 'reset']) for (const extra of [{}, { availability: 'loading' }, { availability: 'disabled' }, { availability: 'error' }, { sent: true }, { invalid: true }]) screens[`recovery-${stage}-${JSON.stringify(extra)}`] = recovery({ stage, ...extra });
  for (const state of ['loading', 'details', 'signin-required', 'mismatch', 'unavailable', 'accepted']) screens[`invitation-${state}`] = invite({ state });
  for (const [name, html] of Object.entries(screens)) {
    assert.equal(count(html, /<main[ >]/g), 1, `${name} has one main`);
    assert.equal(count(html, /<h1[ >]/g), 1, `${name} has one h1`);
  }
  assert.match(screens.labelled, /<main[^>]*aria-label="Custom label"/);
  assert.match(screens.signin, /<main[^>]*aria-label="Sign in"/);
});

test('every class emitted by the new flows is styled', () => {
  const screens = [
    twoFactor({ mode: 'recovery', busy: true, error: 'x', unconfirmed: 'u', cancel: { href: '/' }, fieldErrors: { code: 'c' } }),
    recovery({ stage: 'request', availability: 'loading' }), recovery({ stage: 'request', availability: 'error' }), recovery({ stage: 'request', sent: true }),
    recovery({ stage: 'reset', fieldErrors: { confirmation: 'c' }, onRequestNewLink() {} }), recovery({ stage: 'reset', invalid: true, onRequestNewLink() {} }),
    invite({ state: 'details', providers: h(OidcProviderButtons, { providers: [{ id: 'a', name: 'A', href: '/a' }] }), onSignIn() {}, cancel: { href: '/' } }),
    invite({ state: 'mismatch', onSwitchAccount() {}, cancel: { href: '/' } }), invite({ state: 'accepted', continueAction: { href: '/' } }), invite({ state: 'loading' }),
    onboarding({ help: 'h', onRefresh() {}, account: { label: 'A', href: '/' }, signOut: { action: '/out' }, children: h('p', null, 'x') }),
  ];
  const emitted = new Set(screens.flatMap(classes));
  for (const name of emitted) if (/^t98-/.test(name) && !['t98-button--md', 't98-button--secondary', 't98-description-list--1'].includes(name)) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});
