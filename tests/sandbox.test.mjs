import test from 'node:test';
import assert from 'node:assert/strict';
import { contentPolicyMeta, prefixDocument } from '../dist/sandbox.js';

const prefix = contentPolicyMeta("default-src 'none'");

test('the policy prefix keeps a leading doctype only when the HTML parser ignores what precedes it', () => {
  for (const lead of ['', ' ', '\n', '\t\r\n\f ']) assert.ok(prefixDocument(`${lead}<!doctype html><p>x`, prefix).startsWith(`${lead}<!doctype html>${prefix}`), JSON.stringify(lead));
  // The HTML parser treats these as text, which opens <body>; a CSP meta that lands after them is ignored.
  for (const lead of ['\u00a0', '\u000b', '\u3000', '\u2028', '\ufeff']) {
    assert.ok(prefixDocument(`${lead}<!doctype html><p>x`, prefix).startsWith(prefix), `U+${lead.codePointAt(0).toString(16).padStart(4, '0')}`);
  }
});
