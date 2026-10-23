import { useState } from 'react';
import { Alert, Badge, Field, Input, Select } from '../lib';
import { AppIcon } from '../lib/app';
import { Code } from './Code';
import { flowRecipes } from './flows';
import { routeHref } from './navigation';

export function FlowReference({ selected }: { selected?: string }) {
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState('All');
  const recipe = flowRecipes.find(item => item.id === selected);
  const visible = flowRecipes.filter(item => (product === 'All' || item.products === product) && `${item.researchId ?? ''} ${item.name} ${item.description} ${item.states.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  if (!selected) return <>
    <header className="reference-page-heading"><div><p className="reference-eyebrow">Feature flows</p><h1>Reusable sections for a feature.</h1><p>Compose these smaller feature sections into full page templates. Each includes copyable TSX, states, research references and acceptance cases. Previews use synthetic local data.</p></div><span className="reference-count">{flowRecipes.length} working flows</span></header>
    <div className="reference-flow-filters"><Field label="Find a flow" htmlFor="flow-query"><Input id="flow-query" value={query} onChange={event => setQuery(event.target.value)} placeholder="Task, state or research ID"/></Field><Field label="Product" htmlFor="flow-product"><Select id="flow-product" value={product} onChange={event => setProduct(event.target.value)}><option>All</option><option>Campaign</option><option>Discover</option></Select></Field></div>
    <p className="reference-muted" role="status">{visible.length} matching flows</p>
    <div className="reference-component-grid">{visible.map(item => <a className="reference-component-card" key={item.id} href={routeHref('Flows', { component: item.id })}><span>{item.products}{item.researchId && ` · ${item.researchId}`}</span><h2>{item.name}<AppIcon name="arrow" size={16}/></h2><p>{item.description}</p><small>{item.states.length} applicable states</small></a>)}</div>
    {!visible.length && <div className="reference-empty"><h2>No matching flows</h2><p>Change the product or search to find another task.</p></div>}
    <div className="reference-note"><h2>One feature section, then a full page</h2><p>A flow combines components for one feature. <a href={routeHref('Templates')}>A template arranges multiple feature sections into a complete layout.</a> Keep a single page title in the template. Application sessions own data, authorization, execution and release.</p></div>
  </>;
  if (!recipe) return <div className="reference-empty"><h1>Flow not found</h1><p>This link does not match a documented flow.</p><a href={routeHref('Flows')}>Browse flow recipes</a></div>;
  const Preview = recipe.Preview;
  return <>
    <a className="reference-back" href={routeHref('Flows')}><AppIcon name="arrow" size={14}/> All flow recipes</a>
    <header className="reference-page-heading"><div><p className="reference-eyebrow">{recipe.products}{recipe.researchId && ` · ${recipe.researchId}`}</p><h1>{recipe.name}</h1><p>{recipe.description}</p></div><Badge>Local simulation</Badge></header>
    <section className="reference-section"><h2>Task sequence</h2><ol className="reference-list">{recipe.steps.map(step => <li key={step}>{step}</li>)}</ol><p><strong>States to inspect:</strong> {recipe.states.join(' · ')}.</p><Alert title="Application contract" tone="info">{recipe.ownership}</Alert></section>
    <section className="reference-section"><h2>Interactive feature section</h2><p className="reference-muted">Place this feature section within a page template; it adds no page shell or page title. Use labelled demo controls to exercise outcomes. No provider requests are sent. Local success does not establish live service acceptance.</p><div className="reference-preview"><Preview/></div></section>
    {recipe.references && <section className="reference-section"><h2>Reference flows</h2><ul className="reference-list">{recipe.references.map(reference => <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a></li>)}</ul></section>}
    {recipe.acceptance && <section className="reference-section"><h2>Design decisions and acceptance cases</h2><ul className="reference-list">{recipe.acceptance.map(item => <li key={item}>{item}</li>)}</ul></section>}
    <section className="reference-section"><h2>Complete TSX</h2><p>Load <code>@ten98/ui/styles.css</code> for new screens. Established apps load <code>app-tokens.css</code>, <code>app.css</code> and <code>product.css</code> before app overrides. Replace demonstration state with your validated controller.</p><Code value={recipe.code}/></section>
  </>;
}
