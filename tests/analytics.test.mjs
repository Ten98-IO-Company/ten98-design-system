import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FunnelBreakdown, RetentionTable, JourneyPath, RankComparison } from '../dist/analytics.js';

const render = (component, props) => renderToStaticMarkup(h(component, props));
const context = 'example.test · 1–18 October 2026 · UTC · unique users';

test('funnel bars use only supplied normalized ratios and preserve independent counts', () => {
  const steps = [1, .5, 0, null, undefined, NaN, Infinity, -.1, 1.1].map((barRatio, index) => ({
    id: String(index), label: `Step ${index}`, count: index === 3 ? 0 : index === 2 ? null : 'formatted count', barRatio,
  }));
  const html = render(FunnelBreakdown, { label: 'Bars', context, variant: 'bars', steps });
  assert.match(html, /t98-funnel-breakdown--bars/);
  assert.deepEqual([...html.matchAll(/class="t98-funnel-bar-fill" width="([^"]+)"/g)].map(match => Number(match[1])), [100, 50, 0]);
  assert.equal([...html.matchAll(/Comparison unavailable/g)].length, 6);
  assert.match(html, /Count: <span>0<\/span>/);
  assert.match(html, /Count: <span>Unavailable<\/span>/);
  assert.match(html, /formatted count/);
  assert.doesNotMatch(html, /NaN|Infinity|role="progressbar"/);
});

test('funnel list remains the default and ratios do not alter its markup', () => {
  const props = { label: 'Legacy', context, steps: [{ id: 'a', label: 'A', count: 0 }] };
  assert.equal(render(FunnelBreakdown, props), render(FunnelBreakdown, { ...props, variant: 'list', steps: [{ ...props.steps[0], barRatio: .75 }] }));
  assert.doesNotMatch(render(FunnelBreakdown, props), /--bars|<svg|Comparison unavailable/);
});

test('funnel keeps supplied zero, missing counts and independent conversion text distinct', () => {
  const props = { label: 'Purchase funnel', context, selectedId: 'complete', steps: [
    { id: 'enter', label: 'Entrants', count: 10 },
    { id: 'complete', label: 'Completed', count: 0, conversion: 'Supplied rate: 0% of entrants' },
    { id: 'missing', label: 'Missing', count: null, reason: 'Partition unavailable.', conversion: null, conversionReason: 'No compatible observation.' },
  ] };
  const html = render(FunnelBreakdown, { ...props, onSelect() {} });
  assert.match(html, /<ol class="t98-funnel-steps">/);
  assert.match(html, /Count: <span>0<\/span>/);
  assert.match(html, /Count: <span>Unavailable<\/span>/);
  assert.match(html, /Supplied rate: 0% of entrants/);
  assert.match(html, /Partition unavailable/);
  assert.match(html, /No compatible observation/);
  assert.equal([...html.matchAll(/aria-pressed="true"/g)].length, 1);
  assert.match(html, /aria-pressed="true">Completed<\/button>/);
  assert.doesNotMatch(render(FunnelBreakdown, props), /<button/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test('retention preserves observed zero and never assigns zero to future, unavailable or missing cells', () => {
  const html = render(RetentionTable, { label: 'Retention', context,
    columns: [{ id: 'observed', label: 'Week 0' }, { id: 'future', label: 'Week 1' }, { id: 'unavailable', label: 'Week 2' }, { id: 'missing', label: 'Week 3' }],
    cohorts: [{ id: 'cohort', label: 'October cohort', size: 0, cells: {
      observed: { status: 'observed', value: 0 },
      future: { status: 'future', reason: 'Window incomplete.', value: 0 },
      unavailable: { status: 'unavailable', reason: 'Source denied.', value: 0 },
    } }],
  });
  assert.match(html, /role="region" aria-label="Retention table" tabindex="0"/);
  assert.match(html, /<caption class="t98-retention-caption">Retention<\/caption>/);
  assert.match(html, /<th scope="row">October cohort<\/th>/);
  assert.match(html, /data-status="observed"><span class="t98-retention-value">0<\/span>/);
  assert.match(html, /data-status="future"><span class="t98-retention-value">Not yet observed<\/span>/);
  assert.equal([...html.matchAll(/data-status="unavailable"><span class="t98-retention-value">Unavailable<\/span>/g)].length, 2);
  assert.match(html, /Window incomplete/);
  assert.match(html, /Source denied/);
  assert.doesNotMatch(html, /role="grid"|Pagination|NaN|Infinity/);
});

test('journey keeps app order and keyboard selection beside an app graph without inferring rates', () => {
  const props = { label: 'Journey', context, selectedId: 'end', graph: h('p', null, 'App graph'), steps: [
    { id: 'start', label: '/start', count: 10 }, { id: 'end', label: '/end', count: 0, detail: 'Bounded to two steps.' },
  ] };
  const html = render(JourneyPath, { ...props, onSelect() {} });
  assert.match(html, /App graph/);
  assert.match(html, /<ol class="t98-journey-steps">/);
  assert.ok(html.indexOf('/start') < html.indexOf('/end'));
  assert.match(html, /aria-pressed="true">\/end<\/button>/);
  assert.match(html, /Count: <span>0<\/span>/);
  assert.match(html, /Bounded to two steps/);
  assert.doesNotMatch(render(JourneyPath, props), /<button|%/);
});

test('rank keeps original observation labels and missing-rank reasons without inventing zero or change', () => {
  const html = render(RankComparison, { label: 'Rank history', context, currentLabel: '18 October · UTC', previousLabel: '11 October · UTC',
    notice: 'Latest attempt failed; retained observation is stale.', rows: [
      { id: 'missing', label: 'Inbox', current: null, previous: null, currentReason: 'Not found in observed top 100.', previousReason: 'Not checked.', change: null, changeReason: 'No compatible pair.', source: 'Provider · UAE mobile' },
      { id: 'supplied', label: 'Mail', current: '3', previous: '6', change: 'App says: 3 positions higher', source: 'Provider · UAE mobile' },
    ],
  });
  assert.match(html, /<th scope="col">18 October · UTC<\/th>/);
  assert.match(html, /<th scope="col">11 October · UTC<\/th>/);
  assert.match(html, /role="region" aria-label="Rank history table" tabindex="0"/);
  assert.match(html, /Not found in observed top 100/);
  assert.match(html, /Not checked/);
  assert.match(html, /No compatible pair/);
  assert.match(html, /App says: 3 positions higher/);
  assert.match(html, /Provider · UAE mobile/);
  assert.doesNotMatch(html, />0<|NaN|Infinity|%/);
});
