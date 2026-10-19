import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog, Input, Select, ToastProvider } from './lib';
import { AppBrand, AppIcon } from './lib/app';
import type { Density, Theme } from './lib/tokens';
import { ComponentCatalogue } from './catalog/ComponentCatalogue';
import { FlowReference } from './catalog/FlowReference';
import { flowRecipes } from './catalog/flows';
import { TokenReference } from './catalog/TokenReference';
import { BrandReference } from './catalog/BrandReference';
import { Guides } from './catalog/Guides';
import { componentEntries, findComponents } from './catalog/entries';
import { filterTokens } from './catalog/tokens';
import { componentSlug, pages, readRoute, routeHref, type Page } from './catalog/navigation';
import { version } from '../package.json';
import './lib/app-tokens.css';
import './lib/app.css';
import './lib/primitives.css';
import './lib/patterns.css';
import './lib/workspace.css';
import './showcase.css';

const groups: { label: string; items: { name: Page; icon: string }[] }[] = [
  { label: 'REFERENCE', items: [{ name: 'Components', icon: 'layers' }, { name: 'Flows', icon: 'grid' }, { name: 'Design tokens', icon: 'sun' }, { name: 'Brand & login', icon: 'lock' }] },
  { label: 'BUILD WITH TEN98', items: [{ name: 'Getting started', icon: 'folder' }, { name: 'Patterns', icon: 'grid' }, { name: 'Guidelines', icon: 'shield' }, { name: 'Changelog', icon: 'calendar' }] },
];
function preference<T extends string>(name: string, fallback: T, values: readonly T[]): T {
  try { const saved = localStorage.getItem(name) as T; return values.includes(saved) ? saved : fallback; } catch { return fallback; }
}

function App() {
  const [route, setRoute] = useState(() => readRoute(location.hash));
  const [theme, setTheme] = useState<Theme>(() => preference('t98-theme', 'light', ['light', 'dark', 'system']));
  const [density, setDensity] = useState<Density>(() => preference('t98-density', 'comfortable', ['comfortable', 'compact']));
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 760px)').matches);
  const sidebar = useRef<HTMLElement>(null);
  const selected = route.page === 'Flows' ? flowRecipes.find(entry => entry.id === route.component) : componentEntries.find(entry => componentSlug(entry.name) === route.component);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.density = density;
    try { localStorage.setItem('t98-theme', theme); localStorage.setItem('t98-density', density); } catch { /* Session settings remain usable without storage. */ }
  }, [theme, density]);
  useEffect(() => {
    const navigate = () => { setRoute(readRoute(location.hash)); setMenuOpen(false); setSearchOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); };
    const keyboard = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(open => !open); } };
    addEventListener('hashchange', navigate); addEventListener('keydown', keyboard);
    return () => { removeEventListener('hashchange', navigate); removeEventListener('keydown', keyboard); };
  }, []);
  useEffect(() => { document.title = `${selected?.name ?? route.page} · ten98 Design system`; }, [route.page, selected]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { const media = matchMedia('(max-width: 760px)'); const change = () => { setMobile(media.matches); if (!media.matches) setMenuOpen(false); }; media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, []);
  useEffect(() => {
    if (!menuOpen || !mobile || !sidebar.current) return;
    const trigger = document.activeElement as HTMLElement;
    const controls = () => [...sidebar.current!.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)')];
    controls()[0]?.focus();
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); return; }
      if (event.key !== 'Tab') return;
      const elements = controls(), first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keyboard); trigger?.focus(); };
  }, [menuOpen, mobile]);
  async function copy(value: string) { try { await navigator.clipboard.writeText(value); setNotice('Copied to clipboard'); } catch { setNotice('Clipboard unavailable. Select and copy the visible value.'); } }
  function filterTokenPage(q: string, group: string) { history.replaceState(null, '', routeHref('Design tokens', { query: q, group })); setRoute(readRoute(location.hash)); }
  const searchResults = [
    ...pages.filter(page => page.toLowerCase().includes(query.trim().toLowerCase())).map(name => ({ name, kind: 'Guide', href: routeHref(name) })),
    ...flowRecipes.filter(flow => `${flow.name} ${flow.description} ${flow.states.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())).map(flow => ({ name: flow.name, kind: 'Flow', href: routeHref('Flows', { component: flow.id }) })),
    ...findComponents(query).slice(0, 15).map(entry => ({ name: entry.name, kind: entry.category, href: routeHref('Components', { component: entry.name }) })),
    ...(query.trim() ? filterTokens(query).slice(0, 12).map(name => ({ name, kind: 'Token', href: routeHref('Design tokens', { query: name }) })) : []),
  ];
  return <><a className="catalog-skip" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a><div className={`catalog ${menuOpen ? 'catalog-menu-open' : ''}`}><aside ref={sidebar} className="catalog-sidebar" aria-label="Design system navigation" inert={mobile && !menuOpen}><AppBrand product="Design system" href={routeHref('Components')}/><button className="catalog-menu-close" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><AppIcon name="close"/></button><p className="catalog-sidebar-description">Campaign's design language.<br/>Shared across ten98 tools.</p><nav>{groups.map(group => <div className="catalog-navigation-group" key={group.label}><p>{group.label}</p>{group.items.map(item => <a key={item.name} className="catalog-navigation-link" href={routeHref(item.name)} aria-current={route.page === item.name ? 'page' : undefined}><AppIcon name={item.icon} size={18}/><span>{item.name}</span>{item.name === 'Components' && <small>{componentEntries.length}</small>}</a>)}</div>)}</nav><footer className="catalog-sidebar-footer"><span>Library v{version}</span><a href="https://github.com/Ten98-IO-Company/ten98-design-system">Source <AppIcon name="arrow" size={14}/></a></footer></aside>{menuOpen && <button className="catalog-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)}/>}
    <div className="catalog-body" inert={mobile && menuOpen}><header className="catalog-header"><div className="catalog-breadcrumb"><button className="catalog-menu-toggle" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><AppIcon name="menu"/></button><span>Design system</span><span aria-hidden="true">/</span><strong>{selected?.name ?? route.page}</strong></div><div className="catalog-header-controls"><button className="catalog-search-button" aria-label="Search catalogue" onClick={() => { setQuery(''); setSearchOpen(true); }}><AppIcon name="search" size={17}/><span>Search catalogue</span><kbd>Ctrl K</kbd></button><Select aria-label="Appearance" value={theme} onChange={event => setTheme(event.target.value as Theme)}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></Select><Select aria-label="Density" value={density} onChange={event => setDensity(event.target.value as Density)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></Select></div></header>
    <main id="main-content" className="catalog-main" tabIndex={-1}>
      {route.page === 'Components' ? <ComponentCatalogue route={route} theme={theme} density={density} onCopy={copy}/>
      : route.page === 'Flows' ? <FlowReference selected={route.component}/>
      : route.page === 'Design tokens' ? <TokenReference query={route.query} group={route.group} onFilter={filterTokenPage} onCopy={copy}/>
      : route.page === 'Brand & login' ? <BrandReference theme={theme} density={density}/>
      : <Guides page={route.page}/>}
      <footer className="catalog-main-footer"><span>ten98 Design system · MIT</span><span>Shared tokens. Composable components.</span></footer>
    </main></div></div>
    <Dialog open={searchOpen} onOpenChange={setSearchOpen} title="Find a component or token" description="Search names, uses and supported states."><Input autoFocus aria-label="Search components, tokens and guides" placeholder="Try button, disabled, confirmation, accent…" value={query} onChange={event => setQuery(event.target.value)}/><div className="catalog-search-results">{searchResults.map(result => <a key={result.href} href={result.href} onClick={() => setSearchOpen(false)}><span><strong>{result.name}</strong><small>{result.kind}</small></span><AppIcon name="arrow" size={16}/></a>)}{!searchResults.length && <p role="status">No results. Try a component name or a semantic role.</p>}</div></Dialog>
    {notice && <div className="catalog-notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><AppIcon name="close" size={16}/></button></div>}
  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><ToastProvider><App/></ToastProvider></React.StrictMode>);
