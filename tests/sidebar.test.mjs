import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSidebarNavigation } from '../dist/index.js';

function Shell({ open }) {
  const sidebarRef = useRef(null), triggerRef = useRef(null);
  const { modal, sidebarProps, contentProps } = useSidebarNavigation({ open, onOpenChange() {}, sidebarRef, triggerRef });
  return h('div', { 'data-modal': modal }, h('aside', { ...sidebarProps, ref: sidebarRef }, h('a', { href: '/native-route' }, 'Tool')),
    h('main', contentProps, h('button', { ref: triggerRef }, 'Navigation')));
}

test('server rendering is browser-independent and preserves native routing and desktop content', () => {
  for (const open of [false, true]) {
    const html = renderToStaticMarkup(h(Shell, { open }));
    assert.match(html, /data-modal="false"/);
    assert.match(html, new RegExp(`data-sidebar-state="${open ? 'open' : 'closed'}"`));
    assert.match(html, /href="\/native-route"/);
    assert.doesNotMatch(html, / inert|role="dialog"|aria-modal|visibility:/);
  }
});
