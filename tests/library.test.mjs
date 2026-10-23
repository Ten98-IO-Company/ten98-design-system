import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, accessSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as ui from '../dist/index.js';
import * as app from '../dist/app.js';

const render = (Component, props, children) => renderToStaticMarkup(h(Component, props, children));
const file = path => new URL(`../${path}`, import.meta.url);
const cssRules = css => [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
  selector: selector.trim(),
  declarations: Object.fromEntries([...body.matchAll(/([\w-]+)\s*:\s*([^;]+);?/g)].map(([, property, value]) => [property, value.trim()])),
}));
const selectors = rule => rule.selector.replace(/['"\s]/g, '').split(',');

test('application fields retain native submission, defaults and constraints', () => {
  const html = render(app.AppField, { label: 'Budget', name: 'budget', type: 'number', defaultValue: 12.5, required: true, min: 0, step: 'any' });
  assert.match(html, /<label class="field">/);
  assert.match(html, /name="budget"/);
  assert.match(html, /type="number"/);
  assert.match(html, /value="12.5"/);
  assert.match(html, /min="0"/);
  assert.match(html, /step="any"/);
  assert.match(html, /required=""/);
  const textarea = render(app.AppField, { label: 'Message', multiline: true, name: 'message', defaultValue: 'Saved text', maxLength: 500, required: true });
  const control = textarea.match(/<textarea\b[^>]*>/)?.[0];
  assert.ok(control);
  for (const attribute of ['name="message"', 'required=""', 'maxLength="500"']) assert.ok(control.includes(attribute));
  assert.match(textarea, />Saved text<\/textarea>/);
  const select = render(app.AppSelect, { label: 'Status', name: 'status', value: 'active', options: [['draft', 'Draft'], ['active', 'Active']] });
  assert.match(select, /<select name="status">/);
  assert.match(select, /<option value="active" selected="">Active<\/option>/);
});

test('application multiline fields forward controlled textarea props and preserve native defaults', () => {
  const onChange = () => assert.fail('Rendering must not issue an edit.');
  const field = app.AppField({ label: 'Article HTML', multiline: true, name: 'body', value: '<script>stored text</script>',
    onChange, readOnly: true, id: 'article-html', 'aria-describedby': 'article-help', 'aria-invalid': true,
    rows: 6, cols: 40, wrap: 'soft', required: true, form: 'article-form', type: 'url', min: 1, step: 2, checked: true });
  assert.equal(field.props.children[1].props.onChange, onChange);
  const html = renderToStaticMarkup(field);
  const control = html.match(/<textarea\b[^>]*>/)?.[0];
  assert.ok(control);
  for (const attribute of ['name="body"', 'readOnly=""', 'id="article-html"', 'aria-describedby="article-help"', 'aria-invalid="true"',
    'rows="6"', 'cols="40"', 'wrap="soft"', 'required=""', 'form="article-form"']) assert.ok(control.includes(attribute), attribute);
  assert.match(html, />&lt;script&gt;stored text&lt;\/script&gt;<\/textarea>/);
  assert.doesNotMatch(control, /\b(?:type|min|step|checked|value)=/);
  const defaults = render(app.AppField, { label: 'Saved copy', multiline: true, name: 'copy', defaultValue: 'Saved & editable', disabled: true, maxLength: 500 });
  assert.match(defaults, /<textarea\b[^>]*name="copy"/);
  assert.match(defaults, /disabled=""/);
  assert.match(defaults, /maxLength="500"/);
  assert.match(defaults, />Saved &amp; editable<\/textarea>/);
  assert.doesNotMatch(defaults, /readOnly=|\bvalue=/);
});

test('application branding and Campaign inbox retain their pre-adoption markup', () => {
  const brand = render(app.AppBrand, { product: 'Discover' });
  assert.match(brand, /^<span class="brand">/);
  assert.match(brand, /<small>DISCOVER<\/small>/);
  assert.doesNotMatch(brand, /href=|role=|tabindex=/i);
  assert.match(render(app.AppBrand, { product: 'Campaign', href: '/campaigns' }), /^<a class="brand" href="\/campaigns">/);
  const inbox = render(app.AppIcon, { name: 'inbox' });
  assert.match(inbox, /d="M4 4h16l2 12v4H2v-4L4 4ZM2 15h6l2 3h4l2-3h6"/);
  assert.match(inbox, /aria-hidden="true"/);
  assert.equal(render(app.AppIcon, { name: 'unknown-icon' }), render(app.AppIcon, { name: 'grid' }));
});

test('SecretField keeps one correctly labelled input and hides its value initially', () => {
  const html = render(ui.SecretField, { label: 'API key', value: 'example-only' });
  const inputId = html.match(/<input[^>]*id="([^"]+)"/)?.[1];
  assert.ok(inputId);
  assert.ok(html.includes(`for="${inputId}"`));
  assert.equal([...html.matchAll(/\bid="([^"]+)"/g)].filter(([, id]) => id === inputId).length, 1);
  assert.match(html, /type="password"/);
  assert.match(html, /readOnly=""/);
  assert.match(html, /aria-label="Show API key"/);
});

test('DateRangeField labels both dates and supplies native range boundaries', () => {
  const html = render(ui.DateRangeField, { label: 'Reporting period', start: '2026-10-01', end: '2026-10-19', onChange() {} });
  assert.match(html, /<legend>Reporting period<\/legend>/);
  assert.equal([...html.matchAll(/type="date"/g)].length, 2);
  assert.match(html, /max="2026-10-19"/);
  assert.match(html, /min="2026-10-01"/);
  assert.equal([...html.matchAll(/<label\b/g)].length, 2);
  assert.doesNotMatch(html, /aria-invalid|role="alert"/);
});

test('DateRangeField explains an invalid range instead of blocking it, and shows an exclusive end as the last included day', () => {
  const error = (props) => render(ui.DateRangeField, { label: 'Period', onChange() {}, ...props }).match(/role="alert">([^<]+)</)?.[1];
  assert.equal(error({ start: '2026-10-19', end: '2026-10-01' }), 'End date must be on or after the start date.');
  assert.equal(error({ start: '2025-12-30', end: '2026-01-05', min: '2026-01-01' }), 'Start on or after 2026-01-01.');
  assert.equal(error({ start: '2026-10-01', end: '2026-10-30', max: '2026-10-21' }), 'End on or before 2026-10-21.');
  assert.equal(error({ start: '2026-10-01', end: '2026-11-01', maxDays: 31 }), 'Choose at most 31 days; this range has 32.');
  assert.equal(error({ start: '2026-10-01', end: '2026-10-31', maxDays: 31 }), undefined);
  // Half-open end: [1 Oct, 1 Nov) is 31 days and the field shows 31 Oct.
  const exclusive = render(ui.DateRangeField, { label: 'Period', start: '2026-10-01', end: '2026-11-01', endExclusive: true, maxDays: 31, onChange() {} });
  assert.match(exclusive, /Last day included/);
  assert.match(exclusive, /value="2026-10-31"/);
  assert.doesNotMatch(exclusive, /role="alert"/);
  assert.equal(error({ start: '2026-10-01', end: '2026-10-01', error: 'Server says no.' }), 'Server says no.');
  const invalid = render(ui.DateRangeField, { label: 'Period', start: '2026-10-19', end: '2026-10-01', onChange() {} });
  assert.equal([...invalid.matchAll(/aria-invalid="true"/g)].length, 2);
  const id = invalid.match(/id="([^"]+-error)"/)[1];
  assert.equal([...invalid.matchAll(new RegExp(`aria-describedby="${id}"`, 'g'))].length, 3);
});

test('PermissionMatrix handles inherited role names and labels every grant', () => {
  const props = { roles: ['Viewer', 'constructor', '__proto__'], permissions: [{id:'read',label:'Read projects'}], onChange() {} };
  const html = render(ui.PermissionMatrix, { ...props, value: { Viewer: ['read'] } });
  assert.equal([...html.matchAll(/type="checkbox"/g)].length, 3);
  assert.equal([...html.matchAll(/checked=""/g)].length, 1);
  for (const role of props.roles) assert.ok(html.includes(`aria-label="Read projects — ${role}"`));
  assert.match(html, /scope="row"/);
  const disabled = render(ui.PermissionMatrix, { ...props, value: {}, disabled: true });
  assert.equal([...disabled.matchAll(/disabled=""/g)].length, 3);
});

test('ConfirmDialog requires the exact confirmation text before enabling the action', () => {
  const html = render(ui.ConfirmDialog, { open: true, onOpenChange() {}, title: 'Delete project?', description: 'Review before deleting.', onConfirm() {}, confirmLabel: 'Delete project', confirmationText: 'Autumn campaign', danger: true });
  const action = html.match(/<button\b[^>]*class="[^"]*t98-button--danger[^"]*"[^>]*>/)?.[0];
  assert.ok(action);
  assert.match(action, /disabled=""/);
  assert.match(html, /Type Autumn campaign to confirm/);
});

// W3C sRGB relative luminance and contrast ratio; compare thresholds without rounding.
// https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
function contrast(foreground, background) {
  const luminance = hex => {
    assert.match(hex, /^#(?:[\da-f]{3}|[\da-f]{6})$/i, 'Contrast colors must be opaque sRGB hex values');
    const expanded = hex.length === 4 ? [...hex.slice(1)].map(digit => digit + digit).join('') : hex.slice(1);
    const [red, green, blue] = [0, 2, 4].map(offset => {
      const channel = parseInt(expanded.slice(offset, offset + 2), 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('table operations search visible values, sort naturally and numerically, and preserve input', () => {
  const rows = Object.freeze([
    Object.freeze({ id: 'ten', name: 'Project 10', cost: 2 }),
    Object.freeze({ id: 'two', name: 'project 2', cost: 10 }),
    Object.freeze({ id: 'blank', name: null, cost: 0 }),
    Object.freeze({ id: 'tie', name: 'PROJECT 2', cost: 10 }),
  ]);
  const columns = [
    { key: 'name', header: 'Project' },
    { key: 'cost', header: 'Cost' },
    { key: 'derived', header: 'Derived', sortValue: row => `${row.id} custom` },
  ];
  const ids = result => result.map(row => row.id);
  assert.deepEqual(ids(ui.filterAndSortRows(rows, columns, '', { key: 'name', direction: 'asc' })), ['blank', 'two', 'tie', 'ten']);
  assert.deepEqual(ids(ui.filterAndSortRows(rows, columns, '', { key: 'cost', direction: 'desc' })), ['two', 'tie', 'ten', 'blank']);
  assert.deepEqual(ids(ui.filterAndSortRows(rows, columns, '  PROJECT 2  ')), ['two', 'tie']);
  assert.deepEqual(ids(ui.filterAndSortRows(rows, columns, 'ten custom')), ['ten']);
  assert.deepEqual(ui.filterAndSortRows(rows, columns, '', { key: 'missing', direction: 'asc' }), rows);
  assert.notStrictEqual(ui.filterAndSortRows(rows, columns), rows);
  assert.deepEqual(ids(rows), ['ten', 'two', 'blank', 'tie']);
  assert.deepEqual(ui.filterAndSortRows([], columns), []);
  assert.deepEqual(ui.filterAndSortRows(rows, columns, 'no matching project'), []);
});

test('Field connects the direct control to its label, help and validation error', () => {
  const html = render(ui.Field, {
    label: 'Project name', htmlFor: 'project-name', description: 'Visible to your team.', error: 'Enter a name.',
  }, h(ui.Input, { 'aria-describedby': 'existing-help' }));
  const input = html.match(/<input\b[^>]*>/)?.[0];
  assert.ok(input, 'Field renders its input');
  assert.match(html, /<label\b[^>]*for="project-name"[^>]*>Project name<\/label>/);
  assert.match(input, /\bid="project-name"/);
  assert.match(input, /aria-describedby="existing-help project-name-description project-name-error"/);
  assert.match(input, /aria-invalid="true"/);
  assert.match(html, /id="project-name-description"/);
  assert.match(html, /id="project-name-error"[^>]*role="alert"/);
  const valid = render(ui.Field, { label: 'Email', htmlFor: 'email' }, h(ui.Input, { id: 'email', type: 'email' }));
  assert.match(valid, /<input\b[^>]*id="email"/);
  assert.doesNotMatch(valid, /aria-invalid|aria-describedby/);
});

test('Button defaults to a non-submit action and stays focusable but inert while loading', () => {
  const busy = render(ui.Button, { loading: true, disabled: false }, 'Save project');
  assert.match(busy, /^<button\b[^>]*type="button"/);
  // aria-disabled, not disabled: a disabled button drops focus to <body> while it works (#82).
  assert.doesNotMatch(busy, /\bdisabled=""/);
  assert.match(busy, /aria-disabled="true"/);
  assert.match(busy, /aria-busy="true"/);
  assert.match(busy, /Save project/);
  const submit = render(ui.Button, { type: 'submit' }, 'Submit');
  assert.match(submit, /type="submit"/);
  assert.doesNotMatch(submit, /disabled|aria-busy/);
});

test('Progress clamps out-of-range values and shows nonfinite input as indeterminate, never 0%', () => {
  for (const value of [NaN, Infinity, -Infinity]) {
    const html = render(ui.Progress, { value, label: 'Upload' });
    assert.match(html, /<progress class="t98-progress" aria-label="Upload" aria-busy="true">/);
    assert.doesNotMatch(html, /value=|%|NaN|Infinity/);
  }
  for (const [value, expected] of [[-10, 0], [125, 100], [42.4, 42.4]]) {
    const html = render(ui.Progress, { value, label: 'Upload' });
    const progress = html.match(/<progress\b[^>]*>/)?.[0];
    assert.ok(progress);
    assert.match(progress, new RegExp(`value="${expected}"`));
    assert.match(progress, /max="100"/);
    assert.match(progress, /aria-label="Upload"/);
    assert.doesNotMatch(html, /NaN|Infinity/);
  }
});

test('Avatar preserves Unicode code points in initials and labels empty names', () => {
  const html = render(ui.Avatar, { name: '𠮷田 Éloïse' });
  assert.match(html, /aria-label="𠮷田 Éloïse"/);
  assert.match(html, />𠮷É<\/span>/);
  assert.match(render(ui.Avatar, { name: '' }), /aria-label="Unknown user"[^>]*>\?<\/span>/);
});

test('Sparkline handles empty, flat, single and nonfinite series with an accessible summary', () => {
  for (const values of [[], [5], [5, 5, 5], [NaN, Infinity, -Infinity], [2, NaN, 4]]) {
    const html = render(ui.Sparkline, { values, label: 'Traffic' });
    assert.match(html, /role="img"/);
    assert.match(html, /aria-label="Traffic:/);
    assert.doesNotMatch(html, /NaN|Infinity/);
  }
  assert.match(render(ui.Sparkline, { values: [], label: 'Traffic' }), /Traffic: no data/);
  assert.match(render(ui.Sparkline, { values: [5], label: 'Traffic' }), /<circle\b/);
  assert.match(render(ui.Sparkline, { values: [5, 5, 5], label: 'Traffic' }), /<polyline\b/);
});

test('Sparkline keeps coordinates finite across the finite number range', () => {
  const html = render(ui.Sparkline, { values: [-Number.MAX_VALUE, 0, Number.MAX_VALUE], label: 'Range' });
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test('DataTable renders semantic empty state and safe paging for invalid page sizes', () => {
  const columns = [{ key: 'name', header: 'Name' }];
  const props = { columns, caption: 'All resources', rowKey: row => row.id, selectable: true };
  const empty = render(ui.DataTable, { ...props, rows: [], pageSize: 0 });
  assert.match(empty, /<table\b/);
  assert.match(empty, /<caption\b[^>]*>All resources<\/caption>/);
  assert.match(empty, /scope="col"[^>]*aria-sort="none"/);
  assert.match(empty, /No records found/);
  assert.match(empty, /Page 1 of 1/);
  for (const label of ['Previous page', 'Next page', 'Select all rows on this page']) {
    const control = empty.match(new RegExp(`<(?:button|input)\\b[^>]*aria-label="${label}"[^>]*>`))?.[0];
    assert.ok(control, `${label} is named`);
    assert.match(control, /disabled=""/);
  }
  const rows = Array.from({ length: 6 }, (_, index) => ({ id: String(index + 1), name: `Record ${index + 1}` }));
  for (const pageSize of [0, -1, NaN, Infinity, 0.5]) {
    const html = render(ui.DataTable, { ...props, rows, pageSize });
    assert.match(html, /Page 1 of 2/);
    assert.match(html, /Record 5/);
    assert.doesNotMatch(html, /Record 6|NaN|Infinity/);
  }
  const fractional = render(ui.DataTable, { ...props, rows, pageSize: 2.9 });
  assert.match(fractional, /Page 1 of 3/);
  assert.match(fractional, /Record 2/);
  assert.doesNotMatch(fractional, /Record 3/);
});

test('the distributable resolves its public exports, client boundaries and combined stylesheet', () => {
  const manifest = JSON.parse(readFileSync(file('package.json'), 'utf8'));
  for (const target of Object.values(manifest.exports)) {
    // A subpath pattern (./css/*.css) is checked by the per-sheet test; every literal target must exist.
    for (const path of typeof target === 'string' ? [target] : Object.values(target)) if (!path.includes('*')) accessSync(file(path));
  }
  for (const name of ['Button', 'Input', 'Field', 'Dialog', 'Tabs', 'DataTable', 'AppShell', 'Sparkline', 'filterAndSortRows', 'ProductSwitcher', 'DateRangeField', 'CopyButton', 'SecretField', 'ConfirmDialog', 'ToastProvider', 'useToast', 'AuthLayout', 'PermissionMatrix']) {
    assert.ok(ui[name], `Public export ${name} resolves`);
  }
  for (const path of ['dist/primitives.js', 'dist/patterns.js', 'dist/workspace.js']) assert.match(readFileSync(file(path), 'utf8'), /^(['"])use client\1;/);
  const tokenCss = readFileSync(file('dist/tokens.css'), 'utf8');
  const styles = readFileSync(file('dist/styles.css'), 'utf8');
  assert.ok(styles.includes(tokenCss.trim()), 'Combined styles include the theme tokens');
  assert.match(styles, /\.t98-button\b/);
  assert.match(styles, /\.t98-data-table\b/);
  for (const value of Object.values(ui.tokens).flatMap(group => typeof group === 'object' ? Object.values(group) : [group])) {
    const variable = value.match(/^var\((--[^)]+)\)$/)?.[1];
    assert.ok(variable, `Token ${value} references a CSS variable`);
    assert.ok(tokenCss.includes(`${variable}:`), `Token ${variable} is defined in packaged CSS`);
  }
});

test('packaged light and dark semantic colors retain required text and control contrast', () => {
  assert.equal(contrast('#000', '#fff'), 21);
  assert.equal(contrast('#fff', '#fff'), 1);
  const rules = cssRules(readFileSync(file('dist/tokens.css'), 'utf8'));
  const pairs = [
    ['text', 'surface', 4.5],
    ...['surface', 'bg', 'subtle'].map(background => ['muted', background, 4.5]),
    ...['accent', 'accent-hover'].map(background => ['on-accent', background, 4.5]),
    ...['success', 'warning', 'danger', 'info'].map(tone => [tone, `${tone}-soft`, 4.5]),
    ['control-border', 'surface', 3],
  ];
  for (const theme of ['light', 'dark']) {
    const palette = rules.find(rule => selectors(rule).includes(`[data-theme=${theme}]`))?.declarations;
    assert.ok(palette, `${theme} palette is present in the packaged CSS`);
    for (const [foreground, background, minimum] of pairs) {
      const ratio = contrast(palette[`--t98-${foreground}`], palette[`--t98-${background}`]);
      assert.ok(ratio >= minimum, `${theme} ${foreground} on ${background}: ${ratio.toFixed(3)}:1, requires ${minimum}:1`);
    }
  }
});

test('scoped system themes and comfortable density explicitly reset inherited settings', () => {
  const rules = cssRules(readFileSync(file('src/lib/tokens.css'), 'utf8'));
  const light = rules.find(rule => selectors(rule).includes('[data-theme=light]'));
  assert.ok(light);
  assert.ok(selectors(light).includes('[data-theme=system]'), 'System theme has an explicit light default inside a dark ancestor');
  assert.equal(light.declarations['color-scheme'], 'light');
  const base = Object.assign({}, ...rules.filter(rule => selectors(rule).includes(':root')).map(rule => rule.declarations));
  const comfortable = rules.find(rule => selectors(rule).includes('[data-density=comfortable]'))?.declarations;
  const compact = rules.find(rule => selectors(rule).includes('[data-density=compact]'))?.declarations;
  assert.ok(comfortable, 'Comfortable density has its own scoped reset');
  assert.ok(compact);
  for (const property of ['--t98-control-height', '--t98-cell-padding']) {
    assert.ok(base[property], `Default ${property} is defined`);
    assert.equal(comfortable[property], base[property], `Comfortable density restores ${property}`);
    assert.notEqual(compact[property], comfortable[property], `Compact ${property} remains distinct`);
  }
});

test('standalone components set their font and scope border-box sizing to ten98 classes', () => {
  const css = ['src/lib/primitives.css', 'src/lib/patterns.css'].map(path => readFileSync(file(path), 'utf8')).join('\n');
  const rules = cssRules(css);
  const fontRules = rules.filter(rule => /var\(\s*--t98-font\s*\)/.test(rule.declarations['font-family'] ?? rule.declarations.font ?? ''));
  for (const name of ['badge', 'avatar', 'card', 'field', 'checkbox-label', 'alert', 'progress-group', 'tooltip', 'breadcrumb', 'accordion', 'button', 'input', 'switch-label', 'dialog', 'tab', 'data-table', 'metric-card', 'page-header', 'empty-state', 'activity-feed', 'resource-card', 'settings-section', 'stepper', 'app-shell']) {
    assert.ok(fontRules.some(rule => new RegExp(`\\.t98-${name}(?![\\w-])`).test(rule.selector)), `${name} declares the shared font without relying on the host body`);
  }
  const sizing = rules.find(rule => rule.declarations['box-sizing'] === 'border-box'
    && /\[class\^=['"]t98-['"]\]/.test(rule.selector)
    && /\[class\*=['"] t98-['"]\]/.test(rule.selector));
  assert.ok(sizing, 'Both first and later ten98 classes receive scoped border-box sizing');
  assert.match(sizing.selector, /::before/);
  assert.match(sizing.selector, /::after/);
});

test('the catalogue loads every stylesheet bundled into styles.css, so previews match what apps get', () => {
  const build = readFileSync(new URL('../scripts/build.mjs', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
  const bundled = [...build.match(/writeFileSync\('dist\/styles\.css', \[([^\]]+)\]/)[1].matchAll(/'([^']+\.css)'/g)].map(match => match[1]);
  assert.ok(bundled.length > 5, 'found the bundled stylesheet list');
  for (const file of bundled.filter(file => file !== 'tokens.css')) assert.ok(main.includes(`import './lib/${file}';`), `catalogue imports ${file}`);
});

test('styles.css bundles every component stylesheet in src/lib', () => {
  const build = readFileSync(new URL('../scripts/build.mjs', import.meta.url), 'utf8');
  const bundled = [...build.match(/writeFileSync\('dist\/styles\.css', \[([^\]]+)\]/)[1].matchAll(/'([^']+\.css)'/g)].map(match => match[1]);
  // auth.css is inlined into workspace.css; app, app-tokens and product are separate entry points.
  const entryPoints = new Set(['auth.css', 'app.css', 'app-tokens.css', 'product.css']);
  for (const file of readdirSync(new URL('../src/lib/', import.meta.url)).filter(name => name.endsWith('.css') && !entryPoints.has(name))) assert.ok(bundled.includes(file), `styles.css bundles ${file}`);
});

test('shipped sources, README and notices use LF only, so npm pack is byte-identical on every OS', () => {
  const offenders = [];
  const walk = url => { for (const entry of readdirSync(url, { withFileTypes: true })) {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), url);
    if (entry.isDirectory()) walk(child);
    else if (/\.(css|tsx?|mjs|md|json)$/.test(entry.name) && readFileSync(child, 'utf8').includes('\r')) offenders.push(child.pathname);
  } };
  for (const dir of ['../src/lib/', '../dist/']) walk(new URL(dir, import.meta.url));
  for (const file of ['../README.md', '../package.json', '../THIRD_PARTY_NOTICES.md']) if (readFileSync(new URL(file, import.meta.url), 'utf8').includes('\r')) offenders.push(file);
  assert.deepEqual(offenders, []);
});

test('Dialog takes an eyebrow and, with onSubmit, makes body and footer one form', () => {
  const html = render(ui.Dialog, { open: true, onOpenChange() {}, title: 'Edit placement', eyebrow: 'Dubai Marina billboard', onSubmit() {}, footer: h(ui.Button, { type: 'submit' }, 'Save placement') }, 'Fields');
  assert.match(html, /<p class="t98-dialog-eyebrow">Dubai Marina billboard<\/p><h2[^>]*class="t98-dialog-title">Edit placement<\/h2>/);
  assert.match(html, /<form class="t98-dialog-form"><fieldset class="t98-dialog-fieldset"><div class="t98-dialog-body">Fields<\/div><div class="t98-dialog-footer"><button type="submit"/);
  assert.doesNotMatch(render(ui.Dialog, { open: true, onOpenChange() {}, title: 'T', children: 'x' }), /<form|t98-dialog-eyebrow/);
  const css = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
  for (const name of ['t98-dialog-eyebrow', 't98-dialog-form', 't98-dialog-discard']) assert.ok(css.includes(`.${name}`), name);
});

test('each component stylesheet is published under @ten98/ui/css/<sheet>.css', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(manifest.exports['./css/*.css'], './dist/*.css');
  for (const sheet of ['tokens', 'primitives', 'structure', 'patterns', 'workspace', 'products', 'navigation', 'shell', 'controls', 'account-flows', 'workspace-flows', 'charts', 'spatial']) {
    assert.doesNotThrow(() => accessSync(new URL(`../dist/${sheet}.css`, import.meta.url)), sheet);
  }
});

// Keeps the shared look from drifting (#120): one type scale, three weights, sentence case and themed colours.
const libDir = new URL('../src/lib/', import.meta.url);
const sheets = readdirSync(libDir).filter(name => name.endsWith('.css') && name !== 'tokens.css');
const libRules = sheets.flatMap(sheet => [...readFileSync(new URL(sheet, libDir), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
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
const offences = check => libRules.flatMap(rule => rule.declarations.filter(([property, value]) => check(property, value, rule.where)).map(([property, value]) => `${rule.where} { ${property}: ${value} }`));
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

test('tracking stays between -0.04em (display headlines) and 0, and nothing is set in capitals', () => {
  const tracking = offences((property, value, where) => {
    if (brandLockup.test(where)) return false;
    if (property === 'text-transform') return value === 'uppercase';
    if (property !== 'letter-spacing' || value === '0' || value === 'normal') return false;
    const em = value.match(/^(-?\d*\.?\d+)em$/);
    return !em || Number(em[1]) < -0.04 || Number(em[1]) > 0;
  });
  assert.deepEqual(tracking, []);
});

test('colours come from tokens, apart from named exemptions', () => {
  const literal = offences((property, value, where) => !property.startsWith('--')
    && /#[0-9a-f]{3,8}\b/i.test(value.replace(/var\(--[\w-]+,\s*#[0-9a-f]{3,8}\)/gi, ''))
    && !hexAllowed.some(pattern => pattern.test(where)) && !brandLockup.test(where));
  assert.deepEqual(literal, []);
});
