// Keeps the shared look from drifting (#120): one type scale, three weights, sentence case and themed colours.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../src/lib/', import.meta.url);
const sheets = readdirSync(dir).filter(name => name.endsWith('.css') && name !== 'tokens.css');
const rules = sheets.flatMap(sheet => [...readFileSync(new URL(sheet, dir), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  .matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
  where: `${sheet} ${selector.trim()}`,
  declarations: [...body.matchAll(/([\w-]+)\s*:\s*([^;]+);?/g)].map(([, property, value]) => [property, value.trim()]),
})));

// Each exemption names why it differs from the product scale.
const brandLockup = /\.brand(-mark)?\b/; // The logo mark and wordmark keep their own drawn type.
const hexAllowed = [
  /\.t98-palette--/, // Decorative user-tag swatches, each pair checked at 4.5:1 in light and dark.
  /\.integration-settings-icon\.\w+/, // Third-party provider tiles keep a tint of the provider's identity.
  /\.t98-sandboxed-preview-frame|\.t98-content-preview-text/, // Previews of external content on fixed white or a scrim.
];
const offences = check => rules.flatMap(rule => rule.declarations.filter(([property, value]) => check(property, value, rule.where)).map(([property, value]) => `${rule.where} { ${property}: ${value} }`));
const sizePx = value => {
  const match = value.match(/(?:^|\s)(\d*\.?\d+)(px|rem|em)\b/);
  return match ? Number(match[1]) * (match[2] === 'px' ? 1 : 16) : undefined;
};

test('no text is set below 12px', () => {
  const small = offences((property, value, where) => {
    if (brandLockup.test(where)) return false;
    if (property === 'font-size') return (sizePx(value) ?? 12) < 12;
    if (property === 'font') return (sizePx(value.replace(/\/[^\s]+/, '')) ?? 12) < 12;
    return false;
  });
  assert.deepEqual(small, []);
});

test('weights are 400, 500 or 600', () => {
  const weight = (property, value) => property === 'font-weight' ? value : property === 'font' ? value.split(/\s+/)[0] : undefined;
  const heavy = offences((property, value, where) => {
    const given = weight(property, value);
    return /^\d+$/.test(given ?? '') && !['400', '500', '600'].includes(given) && !brandLockup.test(where);
  });
  assert.deepEqual(heavy, []);
});

test('tracking stays between -0.03em and 0, and nothing is set in capitals', () => {
  const tracking = offences((property, value, where) => {
    if (brandLockup.test(where)) return false;
    if (property === 'text-transform') return value === 'uppercase';
    if (property !== 'letter-spacing' || value === '0' || value === 'normal') return false;
    const em = value.match(/^(-?\d*\.?\d+)em$/);
    return !em || Number(em[1]) < -0.03 || Number(em[1]) > 0;
  });
  assert.deepEqual(tracking, []);
});

test('colours come from tokens, apart from named exemptions', () => {
  const literal = offences((property, value, where) => !property.startsWith('--')
    && /#[0-9a-f]{3,8}\b/i.test(value.replace(/var\(--[\w-]+,\s*#[0-9a-f]{3,8}\)/gi, ''))
    && !hexAllowed.some(pattern => pattern.test(where)) && !brandLockup.test(where));
  assert.deepEqual(literal, []);
});
