import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DataTable, MetricCard, MetricGrid } from '../dist/index.js';

const styles = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const render = renderToStaticMarkup;
const columns = [{ key: 'name', header: 'Name' }, { key: 'visits', header: 'Visits', numeric: true }];
const rows = [
  { id: 'b', name: 'Beta', visits: 5 },
  { id: 'a', name: 'Alpha', visits: 20 },
  { id: 'c', name: 'Gamma', visits: 9 },
];
const base = { columns, rows, rowKey: row => row.id, caption: 'Traffic' };
const table = props => render(h(DataTable, { ...base, ...props }));
const order = html => [...html.matchAll(/<td[^>]*>(Alpha|Beta|Gamma)<\/td>/g)].map(match => match[1]);

test('static mode renders a plain table with no search, toolbar, sort buttons or pager', () => {
  const html = table({ searchable: false, sortable: false, pagination: false });
  assert.doesNotMatch(html, /t98-table-toolbar|type="search"|t98-sort-button|aria-sort|Previous|Next|t98-table-pagination|t98-table-pager/);
  assert.match(html, /<table\b/);
  assert.deepEqual(order(html), ['Beta', 'Alpha', 'Gamma']);
  assert.equal(order(table({ searchable: false, sortable: false, pagination: false, pageSize: 1 })).length, 3, 'static mode shows every row');
  assert.match(table({ searchable: false }), /t98-table-toolbar/, 'turning off search alone keeps the count toolbar');
});

test('controlled sort leaves rows in the order given and announces aria-sort', () => {
  const html = table({ sort: { key: 'visits', direction: 'desc' }, onSortChange() {} });
  assert.deepEqual(order(html), ['Beta', 'Alpha', 'Gamma']);
  assert.match(html, /<th[^>]*scope="col"[^>]*aria-sort="descending"[^>]*>.*Visits/);
  assert.match(html, /<th[^>]*aria-sort="none"[^>]*>.*Name/);
  assert.deepEqual(order(table({ sort: { key: 'name', direction: 'asc' }, onSortChange() {} })), ['Beta', 'Alpha', 'Gamma']);
  assert.deepEqual(order(table()), ['Beta', 'Alpha', 'Gamma'], 'uncontrolled sort starts in source order');
  assert.match(table({ sort: undefined, onSortChange() {} }), /aria-sort="none"/);
});

test('controlled search does not filter rows', () => {
  const html = table({ search: 'zzz', onSearchChange() {} });
  assert.match(html, /value="zzz"/);
  assert.equal(order(html).length, 3);
});

test('index paging shows the rows given, reports the position and does not slice', () => {
  const html = table({ page: { index: 1, size: 3, total: 9 }, onPageChange() {} });
  assert.equal(order(html).length, 3, 'rows are not sliced by size');
  assert.match(html, /<nav class="t98-pager" aria-label="Traffic pages">/);
  assert.match(html, />9 records</);
  assert.match(html, /role="status">4–6 of 9</);
  const first = table({ page: { index: 0, size: 3, total: 9 } });
  assert.match(first.match(/<button[^>]*>(?:(?!<\/button>).)*Previous/)[0], /disabled=""/);
  assert.doesNotMatch(first.match(/<button[^>]*>(?:(?!<\/button>).)*Next/)[0], /disabled=""/);
  const last = table({ page: { index: 2, size: 3, total: 9 } });
  assert.doesNotMatch(last.match(/<button[^>]*>(?:(?!<\/button>).)*Previous/)[0], /disabled=""/);
  assert.match(last.match(/<button[^>]*>(?:(?!<\/button>).)*Next/)[0], /disabled=""/);
  assert.doesNotMatch(html, /Page 1 of|Previous page/, 'legacy local pager is not rendered');
});

test('cursor pagination disables the ends it reports', () => {
  const nextOnly = table({ page: { cursor: { hasPrevious: false, hasNext: true }, status: 'Newest' } });
  assert.match(nextOnly.match(/<button[^>]*>(?:(?!<\/button>).)*Previous/)[0], /disabled=""/);
  assert.doesNotMatch(nextOnly.match(/<button[^>]*>(?:(?!<\/button>).)*Next/)[0], /disabled=""/);
  assert.match(nextOnly, /role="status">Newest</);
  assert.match(nextOnly, />3 shown</, 'without a total the count does not claim a collection size');
  const previousOnly = table({ page: { cursor: { hasPrevious: true, hasNext: false } } });
  assert.doesNotMatch(previousOnly.match(/<button[^>]*>(?:(?!<\/button>).)*Previous/)[0], /disabled=""/);
  assert.match(previousOnly.match(/<button[^>]*>(?:(?!<\/button>).)*Next/)[0], /disabled=""/);
});

test('rowHeader columns render th scope=row and align classes follow the column', () => {
  const html = table({
    columns: [{ key: 'name', header: 'Name', rowHeader: true, wrap: true, minWidth: 'md' }, { key: 'visits', header: 'Visits', numeric: true }, { key: 'x', header: 'X', align: 'center' }],
  });
  assert.match(html, /<th[^>]*scope="row"[^>]*>Beta<\/th>/);
  assert.match(html, /<td class="t98-table-cell--end t98-table-cell--numeric">5<\/td>/);
  assert.match(html, /<th scope="col" class="t98-table-cell--end t98-table-cell--numeric"/);
  assert.match(html, /t98-table-cell--center/);
  assert.match(html, /class="t98-table-cell--wrap t98-table-cell--md"/);
});

test('a missing cell value is announced as Not available and never rendered as 0', () => {
  const html = table({
    rows: [{ id: 'a', name: 'Alpha', visits: undefined }, { id: 'b', name: 'Beta', visits: 0 }, { id: 'c', name: 'Gamma', visits: null }],
    columns: [...columns, { key: 'custom', header: 'Custom', render: row => row.name === 'Alpha' ? undefined : 'ok' }],
  });
  assert.equal([...html.matchAll(/<span aria-hidden="true">—<\/span><span class="t98-visually-hidden">Not available<\/span>/g)].length, 3);
  assert.match(html, /<td class="[^"]*">0<\/td>/, 'a real zero stays 0');
});

test('empty, unavailable and loading are distinct states', () => {
  const empty = table({ rows: [] });
  const unavailable = table({ rows: [], unavailable: h('button', null, 'Retry load') });
  const loading = table({ rows: [], loading: true });
  assert.match(empty, /No records found/);
  assert.doesNotMatch(empty, /Retry load|Loading records/);
  assert.match(unavailable, /t98-table-state[^>]*><button>Retry load<\/button>/);
  assert.doesNotMatch(unavailable, /No records found|Loading records|t98-table-count|Previous/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /Loading records…/);
  assert.match(loading, /t98-spinner/);
  assert.doesNotMatch(loading, /No records found/);
  assert.doesNotMatch(empty, /aria-busy/);
  assert.match(table({ rows: [], emptyState: h('p', null, 'Nothing yet') }), /Nothing yet/);
  assert.doesNotMatch(table({ rows, unavailable: 'Failed' }), /Beta/, 'unavailable replaces stale rows');
});

test('ariaLabel names the table without a caption, and captionHidden controls visibility', () => {
  const { caption, ...named } = base;
  const labelled = render(h(DataTable, { ...named, ariaLabel: 'Traffic summary' }));
  assert.match(labelled, /<table[^>]*aria-label="Traffic summary"/);
  assert.doesNotMatch(labelled, /<caption/);
  assert.match(labelled, /aria-label="Traffic summary table"/);
  assert.match(table(), /<caption class="t98-visually-hidden">Traffic<\/caption>/);
  assert.match(table({ captionHidden: false }), /<caption class="t98-table-caption">Traffic<\/caption>/);
});

test('footer cells align to columns, skipping hidden ones, and row actions add a trailing cell', () => {
  const html = table({
    columns: [{ key: 'name', header: 'Name', rowHeader: true }, { key: 'skip', header: 'Skip', hidden: true }, { key: 'visits', header: 'Visits', numeric: true }],
    footerCells: ['Total', 'hidden', 34], rowActions: row => h('a', { href: `#${row.id}` }, 'Open'), rowActionsLabel: 'Row actions', searchable: false, sortable: false,
  });
  assert.match(html, /<tfoot><tr><th scope="row">Total<\/th><td class="t98-table-cell--end t98-table-cell--numeric">34<\/td><td class="t98-table-actions"><\/td><\/tr><\/tfoot>/);
  assert.doesNotMatch(html, /hidden<\/t|Skip/);
  assert.match(html, /<th scope="col" class="t98-table-actions"><span class="t98-visually-hidden">Row actions<\/span><\/th>/);
  assert.match(html, /<td class="t98-table-actions"><a href="#b">Open<\/a><\/td>/);
});

test('sticky, compact and stacked options set modifiers and stacked data labels', () => {
  const html = table({ stickyHeader: true, density: 'compact', responsive: 'stack', rowActions: () => 'x' });
  assert.match(html, /t98-data-table t98-data-table--sticky t98-data-table--compact t98-data-table--stack/);
  assert.match(html, /<td data-label="Name" role="cell">Beta<\/td>/);
  assert.match(html, /<td class="t98-table-cell--end t98-table-cell--numeric" data-label="Visits" role="cell">5<\/td>/);
  assert.match(html, /<table[^>]*role="table"/);
  assert.doesNotMatch(table(), /data-label|role="cell"|role="table"/);
});

test('MetricCard shows unavailable instead of zero, and a hint', () => {
  const html = render(h(MetricCard, { label: 'Conversion', unavailable: 'Unavailable', change: '5%', chart: [1, 2], hint: 'Last 7 days' }));
  assert.match(html, /<strong class="t98-metric-value t98-metric-value--unavailable">Unavailable<\/strong>/);
  assert.doesNotMatch(html, /t98-metric-change|t98-sparkline|>0</);
  assert.match(html, /<p class="t98-metric-hint">Last 7 days<\/p>/);
  assert.match(render(h(MetricCard, { label: 'Events', value: 0 })), /<strong class="t98-metric-value">0<\/strong>/);
});

test('MetricGrid lays out cards with named widths and optional list semantics', () => {
  const card = label => h(MetricCard, { key: label, label, value: 1 });
  const plain = render(h(MetricGrid, { minItemWidth: 'lg', label: 'Totals' }, card('A'), card('B')));
  assert.match(plain, /^<div class="t98-metric-grid t98-metric-grid--lg" role="group" aria-label="Totals">/);
  const list = render(h(MetricGrid, { list: true, label: 'Totals' }, card('A'), card('B')));
  assert.match(list, /^<ul class="t98-metric-grid t98-metric-grid--md" aria-label="Totals"><li><article/);
  assert.equal([...list.matchAll(/<li>/g)].length, 2);
  assert.match(render(h(MetricGrid, null, card('A'))), /^<div class="t98-metric-grid t98-metric-grid--md"><article/);
});

test('every data table and metric class used by the new markup exists in the combined stylesheet', () => {
  const html = [
    table({ stickyHeader: true, density: 'compact', responsive: 'stack', footerCells: ['x'], rowActions: () => 'x', captionHidden: false, loading: true, selectable: true,
      columns: [{ key: 'name', header: 'Name', rowHeader: true, wrap: true, minWidth: 'sm', align: 'center' }, { key: 'visits', header: 'V', numeric: true, minWidth: 'lg' }, { key: 'm', header: 'M', minWidth: 'md' }] }),
    table({ rows: [], unavailable: 'x', page: { index: 0, size: 1 } }), table({ page: { cursor: { hasPrevious: false, hasNext: false } } }),
    render(h(MetricGrid, { list: true, label: 'x', minItemWidth: 'sm' }, h(MetricCard, { label: 'a', unavailable: 'x', hint: 'h' }))),
    render(h(MetricGrid, { minItemWidth: 'lg' }, h(MetricCard, { label: 'a', value: 1 }))),
  ].join('');
  const used = new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(' ')).filter(name => name.startsWith('t98-') && !/^t98-button--(md|secondary)$/.test(name)));
  assert.ok(used.size > 20);
  const missing = [...used].filter(name => !new RegExp(`\\.${name}(?![\\w-])`).test(styles));
  assert.deepEqual(missing, []);
});

test('a loading table states no record count or page position until its data settles', async () => {
  const { DataTable } = await import('../dist/index.js');
  const html = renderToStaticMarkup(h(DataTable, { caption: 'Campaigns', columns: [{ key: 'name', header: 'Name' }], rows: [], rowKey: row => row.name, loading: true }));
  assert.match(html, /Loading records/);
  assert.doesNotMatch(html, /0 records|Page 1 of 1/);
});

test('server paging keeps selections from other pages; the app owns them', async () => {
  const { DataTable } = await import('../dist/index.js');
  // A selection pruned to the current page would announce only the rows rendered here.
  const html = renderToStaticMarkup(h(DataTable, { caption: 'Rows', columns: [{ key: 'id', header: 'Id' }], rows: [{ id: 'page2-row' }], rowKey: row => row.id, selectable: true, page: { index: 1, size: 1, total: 3 } }));
  assert.match(html, /page2-row/);
});

test('controlled selectedKeys renders checked boxes and the select-all state', () => {
  const partial = table({ selectable: true, selectedKeys: ['a'], onSelectionChange() {} });
  assert.equal([...partial.matchAll(/<input type="checkbox" aria-label="Select row \d+" checked=""/g)].length, 1);
  assert.match(partial, /<tr data-selected="true"><td class="t98-table-check"/);
  assert.doesNotMatch(partial.match(/<input[^>]*Select all rows[^>]*>/)[0], /checked=""/);
  const all = table({ selectable: true, selectedKeys: ['a', 'b', 'c'], onSelectionChange() {} });
  assert.match(all.match(/<input[^>]*Select all rows[^>]*>/)[0], /checked=""/);
  assert.match(all, /3 selected/);
  const none = table({ selectable: true, selectedKeys: [], onSelectionChange() {} });
  assert.doesNotMatch(none, /checked=""/);
});

test('activeKey marks one row current and onRowActivate gives rows a single tab stop', () => {
  const html = table({ activeKey: 'a', onRowActivate() {} });
  assert.equal([...html.matchAll(/aria-current="true"/g)].length, 1);
  assert.equal([...html.matchAll(/<tr[^>]*tabindex="0"/g)].length, 1);
  assert.match(html, /<tr aria-current="true"[^>]*tabindex="0"/, 'the active row is the tab stop');
  assert.equal(table({ activeKey: 'a' }).includes('tabindex="-1"'), false, 'no roving without onRowActivate');
  assert.match(table({ onRowActivate() {} }), /<tr class="t98-table-row--interactive" tabindex="0"><td>Beta/, 'first row is the stop without an active row');
});

test('rowDetail renders only for expanded keys with the disclosure wired to the detail row', () => {
  const closed = table({ rowDetail: row => `Detail ${row.name}` });
  assert.doesNotMatch(closed, /Detail Alpha|t98-table-detail/);
  assert.equal([...closed.matchAll(/aria-expanded="false"/g)].length, 3);
  const open = table({ rowDetail: row => `Detail ${row.name}`, expandedKeys: ['a'], onExpandedChange() {} });
  assert.equal([...open.matchAll(/Detail (Alpha|Beta|Gamma)/g)].length, 1);
  const controls = open.match(/aria-expanded="true" aria-controls="([^"]+)"/)[1];
  assert.match(open, new RegExp(`<tr id="${controls}" class="t98-table-detail"><td colSpan="3">Detail Alpha`));
  assert.match(open, /<th scope="col" class="t98-table-expand"><span class="t98-visually-hidden">Details/);
});
