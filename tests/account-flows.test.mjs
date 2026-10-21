import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AccountProfileFlow, LinkedIdentitiesFlow, PasswordChangeFlow, SessionListFlow, SettingsPanel, TwoFactorSetupFlow } from '../dist/index.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const classes = html => [...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(' '));
const tag = (html, name) => html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0] ?? '';
const noop = () => undefined;

const profile = props => renderToStaticMarkup(h(AccountProfileFlow, { email: 'member@example.test', emailHref: '/email', defaultValues: { name: 'Sam', theme: 'dark', locale: 'ar', timeZone: 'UTC' }, localeOptions: [{ value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' }], timeZones: ['UTC', 'Asia/Dubai'], onDetectTimeZone: () => 'UTC', onSubmit: noop, ...props }));
const password = props => renderToStaticMarkup(h(PasswordChangeFlow, { hasPassword: true, onSubmit: noop, ...props }));
const handlers = { onStart: noop, onVerify: noop, onAcknowledgeCodes: noop, onRegenerate: noop, onDisable: noop };
const twoFactor = props => renderToStaticMarkup(h(TwoFactorSetupFlow, { ...handlers, recoveryCodes: ['aaaa-1111', 'bbbb-2222'], enrolment: { qrDataUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', manualKey: 'JBSWY3DPEHPK3PXP' }, ...props }));
const sessions = [{ id: 's1', device: 'Chrome on Windows', lastActiveAt: '2030-01-15T12:00:00Z', current: true }, { id: 's2', device: 'Safari on iPhone', lastActiveAt: '2030-01-14T08:30:00Z', current: false }];
const sessionList = props => renderToStaticMarkup(h(SessionListFlow, { sessions, onRevoke: noop, onRevokeOthers: noop, ...props }));
const identities = [{ id: 'i1', providerName: 'Microsoft', email: 'member@example.test', linkedAt: '2030-01-10T09:00:00Z' }];
const linked = props => renderToStaticMarkup(h(LinkedIdentitiesFlow, { identities, providers: [{ id: 'google', name: 'Google' }], hasPassword: true, onLink: noop, onUnlink: noop, ...props }));

test('profile renders typed field names and a read-only email', () => {
  const html = profile();
  assert.match(tag(html, 'email'), /readOnly=""/);
  assert.match(tag(html, 'name'), /autoComplete="name"/);
  assert.ok(html.includes('name="theme"') && html.includes('name="locale"') && html.includes('name="timeZone"'));
  assert.match(html, /href="\/email"/);
  assert.match(html, /Use my time zone/);
  assert.ok(!profile({ onDetectTimeZone: undefined }).includes('Use my time zone'));
});

test('password change has typed fields, a policy hint and a no-password state', () => {
  const html = password({ policy: { minLength: 16, maxLength: 64 } });
  assert.match(tag(html, 'currentPassword'), /autoComplete="current-password"/);
  assert.match(tag(html, 'newPassword'), /autoComplete="new-password"[^>]*minLength="16"|minLength="16"[^>]*autoComplete="new-password"/);
  assert.ok(tag(html, 'confirmation'));
  assert.ok(html.includes('Use at least 16 characters.'));
  const none = password({ hasPassword: false, setPasswordHref: '/set' });
  assert.ok(!none.includes('<form') && none.includes('href="/set"'));
});

test('two-factor stages render their own content and recovery codes only in the codes stage', () => {
  const off = twoFactor({ stage: 'off' });
  assert.ok(tag(off, 'password') && !off.includes('aaaa-1111') && !off.includes('JBSWY3DPEHPK3PXP'));
  const enrolling = twoFactor({ stage: 'enrolling' });
  assert.match(enrolling, /<img[^>]*alt="QR code to scan/);
  assert.ok(enrolling.includes('JBSWY3DPEHPK3PXP') && !enrolling.includes('aaaa-1111'));
  assert.match(tag(enrolling, 'code'), /autoComplete="one-time-code"/);
  assert.match(tag(enrolling, 'code'), /inputMode="numeric"/);
  const codes = twoFactor({ stage: 'codes' });
  assert.ok(codes.includes('aaaa-1111') && codes.includes('bbbb-2222') && codes.includes('Copy all') && codes.includes('Download') && codes.includes('I saved these codes'));
  assert.ok(!codes.includes('JBSWY3DPEHPK3PXP'));
  const on = twoFactor({ stage: 'on' });
  assert.ok(!on.includes('aaaa-1111') && on.includes('Regenerate recovery codes') && on.includes('Turn off two-factor authentication'));
});

test('the current session has no revoke action', () => {
  const html = sessionList();
  assert.ok(html.includes('This device'));
  assert.equal(html.match(/aria-label="Sign out: [^"]+"/g)?.length, 1);
  assert.ok(html.includes('aria-label="Sign out: Safari on iPhone"') && !html.includes('Sign out: Chrome on Windows'));
  assert.ok(html.includes('Jan 15, 2030'));
  assert.match(html, /<th[^>]*scope="row"/);
});

test('the last identity cannot be unlinked without a password', () => {
  const blocked = linked({ hasPassword: false });
  assert.match(blocked, /<button[^>]*disabled=""[^>]*aria-label="Unlink: Microsoft"|<button[^>]*aria-label="Unlink: Microsoft"[^>]*disabled=""/);
  assert.ok(blocked.includes('Set a password before unlinking it.') && !blocked.includes('name="password"'));
  const allowed = linked();
  assert.doesNotMatch(allowed, /aria-label="Unlink: Microsoft"[^>]*disabled=""|disabled=""[^>]*aria-label="Unlink: Microsoft"/);
  assert.ok(tag(allowed, 'password'));
  const two = linked({ hasPassword: false, identities: [...identities, { id: 'i2', providerName: 'Google', linkedAt: '2030-01-11' }] });
  assert.ok(!two.includes('Set a password before unlinking it.'));
});

test('a pending identity proof shows the provider details and both actions', () => {
  const html = linked({ pendingProof: { providerName: 'Google', issuer: 'https://accounts.example.test', subject: 'sub-1', expiresAt: '2030-01-15T12:00:00Z' }, onConfirmProof: noop, onDismissProof: noop });
  for (const text of ['https://accounts.example.test', 'sub-1', 'Link this account', 'Cancel']) assert.ok(html.includes(text), text);
});

test('disabled flows disable the fieldset but keep values visible', () => {
  const html = profile({ disabled: true });
  assert.match(html, /<fieldset[^>]*disabled=""/);
  assert.match(tag(html, 'name'), /value="Sam"/);
  assert.match(html, /value="dark"[^>]*checked=""|checked=""[^>]*value="dark"/);
  const busy = password({ busy: true, busyLabel: 'Changing…' });
  assert.match(busy, /<form[^>]*aria-busy="true"/);
  assert.match(busy, /<fieldset[^>]*disabled=""/);
  assert.ok(busy.includes('Changing…'));
  assert.match(sessionList({ disabled: true }), /disabled=""[^>]*aria-label="Sign out: Safari on iPhone"|aria-label="Sign out: Safari on iPhone"[^>]*disabled=""/);
});

test('outcomes use alert roles and every emitted class is styled', () => {
  const failed = password({ error: 'The password could not be changed.', unconfirmed: 'Reload before retrying.', notice: { tone: 'success', text: 'Saved.' }, fieldErrors: { currentPassword: 'Wrong password.' } });
  assert.match(failed, /role="alert"[^>]*>.*The password could not be changed\./s);
  assert.ok(failed.includes('Reload before retrying.') && failed.includes('Saved.') && failed.includes('Wrong password.'));
  const screens = [profile(), profile({ disabled: true }), password(), password({ hasPassword: false }), failed, ...['off', 'enrolling', 'codes', 'on'].map(stage => twoFactor({ stage })), sessionList(), linked(), linked({ hasPassword: false, pendingProof: { providerName: 'Google', issuer: 'i', subject: 's', expiresAt: '2030-01-15' } })];
  const emitted = new Set(screens.flatMap(classes));
  for (const name of emitted) if (/^t98-/.test(name) && !['t98-button--md', 't98-button--secondary', 't98-description-list--1'].includes(name)) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('AccountProfileFlow omits language and time zone when the app stores neither', async () => {
  const { AccountProfileFlow } = await import('../dist/index.js');
  const minimal = renderToStaticMarkup(h(AccountProfileFlow, { email: 'a@example.test', defaultValues: { name: 'Sam', theme: 'system' }, onSubmit() {} }));
  assert.doesNotMatch(minimal, /name="locale"|name="timeZone"|Use my time zone/);
  assert.match(minimal, /name="name"/);
  const full = renderToStaticMarkup(h(AccountProfileFlow, { email: 'a@example.test', defaultValues: { name: 'Sam', theme: 'system', locale: 'en', timeZone: 'Asia/Dubai' },
    localeOptions: [{ value: 'en', label: 'English' }], timeZones: ['Asia/Dubai'], onDetectTimeZone: () => 'Asia/Dubai', onSubmit() {} }));
  assert.match(full, /name="locale"/);
  assert.match(full, /name="timeZone"/);
  assert.match(full, /Use my time zone/);
});

const panel = props => renderToStaticMarkup(h(SettingsPanel, { title: 'Webhook', description: 'Where events go.', ...props }, h('input', { name: 'url', defaultValue: 'x' })));

test('SettingsPanel renders the heading, outcome alerts and a locking fieldset', () => {
  const html = panel({ submitLabel: 'Save', onSubmit: noop, error: 'Could not save.', unconfirmed: 'Reload first.', notice: { tone: 'success', text: 'Saved.' } });
  assert.match(html, /<section class="t98-settings-flow" aria-label="Webhook">/);
  assert.match(html, /<h2[^>]*>Webhook<\/h2>/);
  assert.ok(html.includes('Where events go.') && html.includes('Could not save.') && html.includes('Reload first.') && html.includes('Saved.'));
  assert.match(html, /role="alert"[^>]*>.*Could not save\./s);
  assert.match(html, /<form[^>]*>/);
  assert.match(html, /<button[^>]*type="submit"/);
  assert.doesNotMatch(html, /<fieldset[^>]*disabled/);
  assert.match(panel({ onSubmit: noop, disabled: true }), /<fieldset[^>]*disabled=""/);
  const busy = panel({ onSubmit: noop, submitLabel: 'Save', busy: true, busyLabel: 'Saving…' });
  assert.match(busy, /<form[^>]*aria-busy="true"/);
  assert.match(busy, /<fieldset[^>]*disabled=""/);
  assert.ok(busy.includes('Saving…'));
  for (const name of new Set(classes(html))) if (/^t98-/.test(name) && !['t98-button--md', 't98-button--primary'].includes(name)) assert.ok(styles.includes(`.${name}`), `${name} is styled`);
});

test('SettingsPanel posts natively with action, renders no form without a handler and adds extra actions', () => {
  const native = panel({ action: '/save', method: 'post', submitLabel: 'Save' });
  assert.match(native, /<form[^>]*action="\/save"[^>]*method="post"|<form[^>]*method="post"[^>]*action="\/save"/);
  assert.doesNotMatch(panel({ submitLabel: 'Save' }), /<form/);
  assert.match(panel({ onSubmit: noop, actions: h('a', { href: '/cancel' }, 'Cancel') }), /<a href="\/cancel">Cancel<\/a>/);
});
