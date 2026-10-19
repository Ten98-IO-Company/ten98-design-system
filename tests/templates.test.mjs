import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CollectionTemplate, DetailTemplate, EditorTemplate, OverviewTemplate, SettingsTemplate } from '../dist/templates.js';

const marker = name => h('span', { 'data-slot': name }, name);
const render = (Component, props) => renderToStaticMarkup(h('main', null, h(Component, props)));
const cases = [
  [OverviewTemplate, 'overview', ['scope', 'filters', 'metrics', 'content']],
  [CollectionTemplate, 'collection', ['scope', 'toolbar', 'selection', 'content', 'pagination']],
  [DetailTemplate, 'detail', ['breadcrumb', 'scope', 'status', 'navigation', 'content', 'aside']],
  [EditorTemplate, 'editor', ['breadcrumb', 'scope', 'steps', 'feedback', 'content', 'preview', 'footer']],
  [SettingsTemplate, 'settings', ['scope', 'navigation', 'feedback', 'content']],
];

test('all fixed templates preserve heading, reading order and app-owned native form controls', () => {
  for (const [Component, variant, order] of cases) {
    const props = Object.fromEntries(order.filter(slot => slot !== 'content').map(slot => [slot, marker(slot)]));
    const html = render(Component, { ...props, title: 'Campaign & workspace', description: 'Scoped page description', id: 'app-page', className: 'app-hook', 'aria-busy': true, 'data-product': 'campaign',
      actions: h('button', { type: 'button', disabled: true }, 'App action'),
      children: h('form', { id: 'app-form', action: '/save-draft', method: 'post' }, h('h2', null, 'Draft content'), marker('content'), h('input', { name: 'draft', defaultValue: 'Retained draft', readOnly: true }), h('button', { type: 'submit' }, 'App save')),
    });
    assert.match(html, new RegExp(`class="t98-template t98-template--${variant} app-hook"`));
    assert.match(html, /<section[^>]*aria-label="Campaign &amp; workspace"[^>]*id="app-page"[^>]*aria-busy="true"[^>]*data-product="campaign"/);
    assert.equal([...html.matchAll(/<main\b/g)].length, 1, `${variant} adds no nested main landmark`);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${variant} has one PageHeader heading`);
    assert.match(html, /<h1>Campaign &amp; workspace<\/h1>/);
    assert.match(html, /<h2>Draft content<\/h2>/);
    assert.equal([...html.matchAll(/<form\b/g)].length, 1, `${variant} does not wrap the supplied form`);
    assert.match(html, /<form[^>]*id="app-form"[^>]*action="\/save-draft"[^>]*method="post"/);
    assert.match(html, /<input[^>]*readOnly=""[^>]*name="draft"[^>]*value="Retained draft"/);
    assert.equal([...html.matchAll(/<button\b/g)].length, 2, `${variant} adds no save or action controls`);
    let previous = -1;
    for (const slot of order) {
      const position = html.indexOf(`data-slot="${slot}"`);
      assert.ok(position > previous, `${variant}: ${slot} follows the preceding slot`);
      previous = position;
    }
    const heading = html.indexOf('<h1>');
    assert.ok(heading < html.indexOf('data-slot="scope"'), `${variant}: scope follows the heading`);
    if (order.includes('breadcrumb')) assert.ok(html.indexOf('data-slot="breadcrumb"') < heading);
    assert.ok(html.includes('Scoped page description'));
  }
});

test('optional slots disappear without removing content or adding empty sidebars', () => {
  for (const [Component, variant] of cases) {
    const html = render(Component, { title: 'Page', children: marker('content') });
    assert.match(html, /data-slot="content"/);
    assert.doesNotMatch(html, /<aside\b|<footer\b|t98-template-(scope|filters|metrics|toolbar|selection|pagination|breadcrumb|status|navigation|steps|feedback|preview|aside|footer)"/);
    assert.match(html, /t98-template-main/);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, variant);
  }
});

test('editor retains native external form association and explicit app feedback', () => {
  const html = render(EditorTemplate, { title: 'Edit campaign', 'aria-describedby': 'save-error',
    feedback: h('p', { id: 'save-error', role: 'alert' }, 'Save failed; draft retained.'),
    children: h('form', { id: 'draft-form' }, h('input', { name: 'title', defaultValue: 'Draft value' })),
    preview: marker('preview'), footer: h('button', { type: 'submit', form: 'draft-form', disabled: true }, 'Saving draft'),
  });
  assert.match(html, /aria-describedby="save-error"/);
  assert.match(html, /id="save-error" role="alert">Save failed; draft retained\./);
  assert.match(html, /<button type="submit" form="draft-form" disabled="">Saving draft<\/button>/);
  assert.ok(html.indexOf('</form>') < html.indexOf('form="draft-form"'), 'The submit control stays outside the supplied form');
  assert.ok(html.indexOf('save-error" role=') < html.indexOf('<form'));
  assert.equal([...html.matchAll(/<form\b/g)].length, 1);
});
