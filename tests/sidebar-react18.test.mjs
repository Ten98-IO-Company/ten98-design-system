import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { chromium } from '@playwright/test';
import { build } from 'vite';

// Optional pinned test fixture: npm pack react@18.3.1 react-dom@18.3.1, then extract
// their package/ directories as react/ and react-dom/. No production dependency changes.
const fixture = process.env.TEN98_REACT18_FIXTURE;
test('real React 18 emits native inert attributes and removes them when the drawer closes', { skip: !fixture }, async () => {
  const [react, dom, source] = await Promise.all([
    readFile(join(fixture, 'react/umd/react.development.js'), 'utf8'),
    readFile(join(fixture, 'react-dom/umd/react-dom.development.js'), 'utf8'),
    readFile(process.env.TEN98_SIDEBAR_SOURCE || new URL('../src/lib/sidebar.tsx', import.meta.url), 'utf8'),
  ]);
  await verifyInert(react, dom, source, '18.3.1');
});

test('real installed React 19 retains native inert attributes and focus recovery', { skip: !process.env.TEN98_SIDEBAR_COMPAT }, async () => {
  const result = await build({ configFile: false, logLevel: 'silent',
    plugins: [{ name: 'react-compat-fixture', resolveId(id) { if(id.endsWith('virtual:react-compat')) return '\0react-compat'; },
      load(id) { if(id === '\0react-compat') return "import * as React from 'react';import {createRoot} from 'react-dom/client';window.React=React;window.ReactDOM={createRoot};"; } }],
    define: { 'process.env.NODE_ENV': JSON.stringify('development') },
    build: { write: false, minify: false, lib: { entry: 'virtual:react-compat', name: 'ReactCompat', formats: ['iife'] } },
  });
  const bundle = (Array.isArray(result) ? result[0] : result).output.find(item => item.type === 'chunk').code;
  const source = await readFile(new URL('../src/lib/sidebar.tsx', import.meta.url), 'utf8');
  const {version} = await import('react');
  assert.match(version, /^19\./);
  await verifyInert(bundle, '', source, version);
});

async function verifyInert(react, dom, source, expectedVersion) {
  const hook = stripTypeScriptTypes(source.replace(/^import[^\n]*\n/m, '')).replace('export function useSidebarNavigation', 'function useSidebarNavigation');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setContent('<div id="fixture"></div>');
    await page.addScriptTag({ content: react });
    if (dom) await page.addScriptTag({ content: dom });
    await page.addScriptTag({ content: `const {useEffect,useRef,useState,version}=React;${hook}
      function Shell(){const [open,setOpen]=useState(false),sidebarRef=useRef(null),triggerRef=useRef(null);const {sidebarProps,contentProps}=useSidebarNavigation({open,onOpenChange:setOpen,sidebarRef,triggerRef});return React.createElement('div',null,React.createElement('aside',{...sidebarProps,ref:sidebarRef,id:'sidebar'},React.createElement('button',{id:'close',onClick:()=>setOpen(false)},'Close')),React.createElement('main',{...contentProps,id:'content'},React.createElement('button',{id:'open',ref:triggerRef,onClick:()=>setOpen(true)},'Open')));}
      ReactDOM.createRoot(document.getElementById('fixture')).render(React.createElement(Shell));` });
    assert.equal(await page.evaluate(() => React.version), expectedVersion);
    await page.waitForFunction(() => document.getElementById('sidebar')?.hasAttribute('inert'), null, { timeout: 2000 });
    assert.equal(await page.locator('#sidebar').evaluate(node => node.inert), true);
    assert.equal(await page.locator('#content').evaluate(node => node.hasAttribute('inert')), false);
    await page.locator('#open').click();
    await page.waitForFunction(() => document.getElementById('content')?.hasAttribute('inert'), null, { timeout: 2000 });
    assert.equal(await page.locator('#content').evaluate(node => node.inert), true);
    assert.equal(await page.locator('#sidebar').evaluate(node => node.hasAttribute('inert')), false);
    await page.locator('#close').click();
    await page.waitForFunction(() => !document.getElementById('content')?.hasAttribute('inert'), null, { timeout: 2000 });
    assert.equal(await page.locator('#sidebar').evaluate(node => node.inert), true);
    assert.equal(await page.locator('#open').evaluate(node => node === document.activeElement), true);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}
