import { useEffect, useState } from 'react';
import { Button, Input, Select } from '../lib/primitives';
import { legacyAliases, tokenGroup, tokenNames, tokenReferences } from './tokens';
import { Code } from './Code';

export const tokenExampleCode = `import { tokens } from '@ten98/ui/tokens';
import '@ten98/ui/styles.css'; // once at the application root

export default function Example() {
  return <div style={{ color: tokens.color.text, padding: tokens.space[4] }}>
    Use semantic tokens for custom content.
  </div>;
}`;
const tokenCssCode = `.custom-panel {
  background: var(--t98-surface);
  border: 1px solid var(--t98-border);
}`;

export function useTokenValues(names: readonly string[]) {
  const [values, setValues] = useState<Record<string, string>>({});
  const key = names.join('|');
  useEffect(() => {
    let frame: number;
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { const style = getComputedStyle(document.documentElement); setValues(Object.fromEntries(names.map(name => [name, style.getPropertyValue(name).trim()]))); }); };
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-density'] });
    const media = matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', update);
    update();
    return () => { observer.disconnect(); media.removeEventListener('change', update); cancelAnimationFrame(frame); };
  }, [key]);
  return values;
}

export function TokenTable({ names, onCopy }: { names: readonly string[]; onCopy: (value: string) => void }) {
  const values = useTokenValues(names);
  return <div className="reference-table-scroll" role="region" aria-label="Design token values" tabIndex={0}><table className="reference-table"><thead><tr><th scope="col">Token</th><th scope="col">Current value</th><th scope="col">Usage</th></tr></thead><tbody>{names.map(name => {
    const canonical = legacyAliases[name] ?? name;
    return <tr key={name}><th scope="row"><code>{name}</code>{legacyAliases[name] && <small>Alias of <code>{canonical}</code></small>}</th><td><div className="token-value">{tokenGroup(canonical) === 'Colors' && <i aria-hidden="true" style={{ background: `var(${name})` }}/>}<code>{values[name] || '—'}</code></div></td><td><Button variant="ghost" size="sm" aria-label={`Copy var(${name})`} onClick={() => onCopy(`var(${name})`)}>Copy CSS</Button>{tokenReferences[canonical] && <button type="button" className="reference-token-path" aria-label={`Copy ${tokenReferences[canonical]}`} onClick={() => onCopy(tokenReferences[canonical])}>{tokenReferences[canonical]}</button>}</td></tr>;
  })}</tbody></table></div>;
}

export function TokenReference({ query, group, onFilter, onCopy }: { query: string; group: string; onFilter: (query: string, group: string) => void; onCopy: (value: string) => void }) {
  const [aliases, setAliases] = useState(false);
  const names = aliases ? [...tokenNames, ...Object.keys(legacyAliases)] : tokenNames;
  const groups = ['All', ...new Set(tokenNames.map(tokenGroup)), ...(aliases ? ['App aliases'] : [])];
  const activeGroup = groups.includes(group) ? group : 'All';
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const visible = names.filter(name => (activeGroup === 'All' || (activeGroup === 'App aliases' ? !!legacyAliases[name] : !legacyAliases[name] && tokenGroup(name) === activeGroup)) && terms.every(term => `${name} ${legacyAliases[name] ?? ''} ${tokenGroup(legacyAliases[name] ?? name)} ${tokenReferences[legacyAliases[name] ?? name] ?? ''}`.toLowerCase().includes(term)));
  return <><header className="reference-page-heading"><div><p className="reference-eyebrow">Design tokens</p><h1>One source for every component</h1><p>Names come directly from the library CSS. Values below follow the selected appearance and density.</p></div><span className="reference-count">{tokenNames.length} tokens · {Object.keys(legacyAliases).length} app aliases</span></header><div className="reference-filters"><Input aria-label="Search design tokens" placeholder="Search a token, role or TypeScript path…" value={query} onChange={event => onFilter(event.target.value, activeGroup)}/><Select aria-label="Token category" value={activeGroup} onChange={event => onFilter(query, event.target.value)}>{groups.map(name => <option key={name}>{name}</option>)}</Select><label className="reference-check"><input type="checkbox" checked={aliases} onChange={event => { setAliases(event.target.checked); if (!event.target.checked && group === 'App aliases') onFilter(query, 'All'); }}/> Include app aliases</label></div><p className="reference-result-count" role="status">{visible.length} tokens shown</p>{visible.length ? <TokenTable names={visible} onCopy={onCopy}/> : <div className="reference-empty"><h2>No matching tokens</h2><p>Try a role such as accent, spacing, border or motion.</p><Button variant="secondary" onClick={() => onFilter('', 'All')}>Clear filters</Button></div>}<div className="reference-note"><h2>Use semantic roles</h2><p>Import the styles once at the application root. Use CSS variables for custom presentation and the typed references where available. Theme changes update values without changing your component code.</p><Code title="Token usage.tsx" value={tokenExampleCode}/><Code title="Custom panel.css" label="Copy CSS" value={tokenCssCode}/></div></>;
}
