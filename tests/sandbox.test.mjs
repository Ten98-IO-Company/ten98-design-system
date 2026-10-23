import test from 'node:test';
import assert from 'node:assert/strict';
import { contentPolicyMeta, policyAllowsScripts, policyScriptsArePinned, prefixDocument } from '../dist/sandbox.js';

const prefix = contentPolicyMeta("default-src 'none'");

test('the policy prefix keeps a leading doctype only when the HTML parser ignores what precedes it', () => {
  for (const lead of ['', ' ', '\n', '\t\r\n\f ']) assert.ok(prefixDocument(`${lead}<!doctype html><p>x`, prefix).startsWith(`${lead}<!doctype html>${prefix}`), JSON.stringify(lead));
  // The HTML parser treats these as text, which opens <body>; a CSP meta that lands after them is ignored.
  for (const lead of ['\u00a0', '\u000b', '\u3000', '\u2028', '\ufeff']) {
    assert.ok(prefixDocument(`${lead}<!doctype html><p>x`, prefix).startsWith(prefix), `U+${lead.codePointAt(0).toString(16).padStart(4, '0')}`);
  }
});

test('scripts are pinned only by nonce or hash sources', () => {
  assert.equal(policyAllowsScripts("default-src 'none'"), false);
  assert.equal(policyAllowsScripts("script-src 'none'"), false);
  assert.equal(policyAllowsScripts("img-src data:"), true);
  const fresh = 'q7Zr2Kx9VbT4mNw8LcPa1Ye5';
  for (const pinned of [`script-src 'nonce-${fresh}'`, "script-src 'sha256-AbC+/=' 'strict-dynamic'", `default-src 'nonce-${fresh}'`]) assert.equal(policyScriptsArePinned(pinned), true, pinned);
  // Obviously static nonces (short constants) are refused; a recording can carry its own <script nonce>.
  for (const weak of ["script-src 'nonce-player1'", "script-src 'nonce-abc123'", "default-src 'nonce-x9'"]) assert.equal(policyScriptsArePinned(weak), false, weak);
  for (const loose of ["script-src 'unsafe-inline'", `script-src 'nonce-${fresh}' 'unsafe-inline'`, `script-src 'nonce-${fresh}' https:`, "script-src *", "script-src 'self'", "img-src data:", "script-src 'strict-dynamic'"]) assert.equal(policyScriptsArePinned(loose), false, loose);
});
