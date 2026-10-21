import test from 'node:test';
import assert from 'node:assert/strict';
import { arcPath, bandScale, linearScale, niceDomain, segments, stackSigned, tickIncrement, ticks } from '../dist/chart-scale.js';

test('ticks match the values published for d3-array', () => {
  assert.deepEqual(ticks(0, 1, 10), [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
  assert.deepEqual(ticks(-1.2, 4.7, 5), [-1, 0, 1, 2, 3, 4]);
  assert.deepEqual(ticks(1, 0, 2), [1, 0.5, 0]);
  assert.deepEqual(ticks(3, 3, 5), [3]);
  assert.deepEqual(ticks(0, 1, 0), []);
  assert.equal(tickIncrement(0, 10, 5), 2);
  assert.equal(tickIncrement(0, 1, 10), -10);
});

test('niceDomain extends a domain to round tick steps', () => {
  assert.deepEqual(niceDomain([0.2, 9.4], 5), [0, 10]);
  assert.deepEqual(niceDomain([-3.7, 12.1], 5), [-5, 15]);
  assert.deepEqual(niceDomain([5, 5], 5), [5, 5]);
});

test('linearScale maps linearly and passes null through instead of inventing zero', () => {
  const scale = linearScale([0, 10], [100, 0]);
  assert.equal(scale(0), 100);
  assert.equal(scale(5), 50);
  assert.equal(scale(null), null);
  assert.equal(scale(Number.NaN), null);
  assert.equal(linearScale([2, 2], [0, 10])(2), 5);
});

test('bandScale computes step, bandwidth, padding and alignment', () => {
  const plain = bandScale(4, [0, 100]);
  assert.equal(plain.step, 25);
  assert.equal(plain.bandwidth, 25);
  assert.equal(plain.start(2), 50);
  const padded = bandScale(3, [0, 100], { paddingInner: 0.5, paddingOuter: 0.25 });
  // step = 100 / (3 - 0.5 + 0.5) = 33.33; the leftover space is zero, so the first band starts at the outer padding.
  assert.ok(Math.abs(padded.step - 100 / 3) < 1e-9);
  assert.ok(Math.abs(padded.bandwidth - 100 / 6) < 1e-9);
  assert.ok(Math.abs(padded.start(0) - 100 / 3 * 0.25) < 1e-9);
  const aligned = bandScale(2, [0, 100], { paddingInner: 0, paddingOuter: 0, align: 1 });
  assert.equal(aligned.start(0), 0);
});

test('stackSigned stacks positives up and negatives down from zero and keeps nulls out', () => {
  const stacked = stackSigned([[3, -2, null, 0], [4, -1, 5, 2], [-5, 6, -1, null]]);
  assert.deepEqual(stacked[0], [[0, 3], [-2, 0], null, [0, 0]]);
  assert.deepEqual(stacked[1], [[3, 7], [-3, -2], [0, 5], [0, 2]]);
  assert.deepEqual(stacked[2], [[-5, 0], [0, 6], [-1, 0], null]);
});

test('segments split a series at every missing value', () => {
  const runs = segments([1, 2, null, 4, null, null, 7, 8, 9], value => value !== null);
  assert.deepEqual(runs.map(run => run.map(entry => entry.index)), [[0, 1], [3], [6, 7, 8]]);
  assert.deepEqual(segments([null, null], value => value !== null), []);
});

test('arcPath returns valid closed paths for quarter, full and empty slices', () => {
  const quarter = arcPath(40, 70, 0, Math.PI / 2);
  assert.match(quarter, /^M0 -70A70 70 0 0 1 70 0L40 0A40 40 0 0 0 0 -40Z$/);
  const full = arcPath(40, 70, 0, 2 * Math.PI);
  assert.equal((full.match(/A/g) ?? []).length, 4, 'a full turn is two arcs for each radius');
  assert.equal((arcPath(0, 70, 0, 2 * Math.PI).match(/A/g) ?? []).length, 2);
  assert.match(arcPath(40, 70, 0, Math.PI * 1.5), /A70 70 0 1 1/);
  assert.equal(arcPath(40, 70, 1, 1), '');
  for (const path of [quarter, full]) assert.doesNotMatch(path, /NaN|Infinity/);
});
