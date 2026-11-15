import assert from 'node:assert/strict';
import { test } from '@playwright/test';
import { nextEntryCell, normalizeDecimal } from '../../src/lib/entry-grid.js';

// Pure navigation and commit rules, without a page; the keyboard flow is in entry-grid.spec.ts.
const columns = [{}, { readOnly: true }, {}, {}];

test('Enter and Tab advance to the next editable cell, then the next row, skipping read-only columns', () => {
  assert.deepEqual(nextEntryCell(columns, 2, { row: 0, column: 0 }, 1), { row: 0, column: 2 });
  assert.deepEqual(nextEntryCell(columns, 2, { row: 0, column: 3 }, 1), { row: 1, column: 0 });
  assert.equal(nextEntryCell(columns, 2, { row: 1, column: 3 }, 1), undefined);
});

test('Shift+Tab and Backspace on an empty cell go back, and stop at the first cell', () => {
  assert.deepEqual(nextEntryCell(columns, 2, { row: 0, column: 2 }, -1), { row: 0, column: 0 });
  assert.deepEqual(nextEntryCell(columns, 2, { row: 1, column: 0 }, -1), { row: 0, column: 3 });
  assert.equal(nextEntryCell(columns, 2, { row: 0, column: 0 }, -1), undefined);
  assert.equal(nextEntryCell([{ readOnly: true }], 3, { row: 0, column: 0 }, 1), undefined);
});

test('amounts are decimal strings in and out, normalised without arithmetic', () => {
  assert.deepEqual(normalizeDecimal('1250', 2, true), { value: '1250.00' });
  assert.deepEqual(normalizeDecimal('1,250.5', 2, true), { value: '1250.50' });
  assert.deepEqual(normalizeDecimal('007.10', 2, true), { value: '7.10' });
  assert.deepEqual(normalizeDecimal('.5', 2, true), { value: '0.50' });
  assert.deepEqual(normalizeDecimal('٣٠٠٫٢٥', 2, true), { value: '300.25' });
  assert.deepEqual(normalizeDecimal('۱۲', 2, true), { value: '12.00' });
  assert.deepEqual(normalizeDecimal('  ', 2, true), { value: '' });
  // Precision is never lost to floating point: digits stay digits.
  assert.deepEqual(normalizeDecimal('90071992547409931234.99', 2, true), { value: '90071992547409931234.99' });
  assert.deepEqual(normalizeDecimal('12.345', 2, true), { error: 'scale' });
  assert.deepEqual(normalizeDecimal('12.3400', 2, true), { value: '12.34' });
  for (const text of ['-5', '1e3', '12.3.4', '.', 'abc']) assert.deepEqual(normalizeDecimal(text, 2, true), { error: 'number' }, text);
});

test('grouping separators are dropped only between groups of three digits, never guessed', () => {
  assert.deepEqual(normalizeDecimal('1 234 567.5', 2, true), { value: '1234567.50' });
  assert.deepEqual(normalizeDecimal('12 345', 2, true), { value: '12345.00' });
  assert.deepEqual(normalizeDecimal('١٬٢٣٤٫٥', 2, true), { value: '1234.50' });
  // A decimal comma, uneven groups and mixed separators are not silently turned into other numbers.
  for (const text of ['12,50', '1,2,3', '1,23,456', '1,234 567', ',123', '1234,567', '1.234,5', '1,234.5,6']) assert.deepEqual(normalizeDecimal(text, 2, true), { error: 'number' }, text);
});

test('without a scale, decimals are kept as typed, with no padding', () => {
  assert.deepEqual(normalizeDecimal('12.345', Infinity, true), { value: '12.345' });
  assert.deepEqual(normalizeDecimal('7', Infinity, true), { value: '7' });
});

test('quantities keep only the places typed, up to their scale', () => {
  assert.deepEqual(normalizeDecimal('2.500', 3, false), { value: '2.5' });
  assert.deepEqual(normalizeDecimal('3', 3, false), { value: '3' });
  assert.deepEqual(normalizeDecimal('0.0005', 3, false), { error: 'scale' });
});
