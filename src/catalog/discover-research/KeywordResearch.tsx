'use client';

import { useId, useState } from 'react';
import { Alert, Button, Checkbox, CollectionTemplate, DataTable, Field, Input, RunCostSummary, Select } from '../../lib';

type Request = { seed: string; market: string; limit: string };
type Idea = { keyword: string; volume: number | null };

export default function KeywordResearch() {
  const id = useId();
  const [draft, setDraft] = useState<Request>({ seed: 'privacy analytics', market: 'United Arab Emirates · English', limit: '25' });
  const [quote, setQuote] = useState<Request | null>(null);
  const [receipt, setReceipt] = useState<Request | null>(null);
  const [state, setState] = useState('Draft');
  const [outcome, setOutcome] = useState('Partial bounded result');
  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const valid = draft.seed.trim().length > 0 && [...draft.seed.trim()].length <= 80 && draft.seed.trim().split(/\s+/u).length <= 10;
  const ideas: Idea[] = receipt && state === 'Ready' ? [{ keyword: receipt.seed, volume: 1200 }, { keyword: `${receipt.seed} guide`, volume: 0 }, { keyword: `${receipt.seed} tools`, volume: null }] : [];
  const visible = ideas.filter(row => row.keyword.toLowerCase().includes(filter.toLowerCase()));
  return <CollectionTemplate title="Explore and save keywords" description="Synthetic local research · Atlas project · no provider requests"
    scope={<p>Results and saves retain their executed market. Typing only edits the next request.</p>}
    selection={<p role="status">{selected.length} of {ideas.length} returned ideas selected · {saved.length} saved locally. Saved keywords do not enable recurring tracking.</p>}>
    <Field label="Seed keyword" htmlFor={`${id}-seed`} error={!valid ? 'Enter 1–80 Unicode characters and at most 10 words.' : undefined}><Input value={draft.seed} onChange={e => setDraft({ ...draft, seed: e.target.value })} /></Field>
    <Field label="Supported market and language" htmlFor={`${id}-market`}><Select value={draft.market} onChange={e => setDraft({ ...draft, market: e.target.value })}><option>United Arab Emirates · English</option><option>United States · English</option></Select></Field>
    <Field label="Maximum ideas" htmlFor={`${id}-limit`}><Select value={draft.limit} onChange={e => setDraft({ ...draft, limit: e.target.value })}>{['25', '50', '100'].map(n => <option key={n}>{n}</option>)}</Select></Field>
    <Field label="Local execution outcome" htmlFor={`${id}-outcome`}><Select value={outcome} disabled={state === 'Queued'} onChange={e => setOutcome(e.target.value)}>{['Partial bounded result', 'No ideas', 'Unknown charge', 'Permission lost'].map(s => <option key={s}>{s}</option>)}</Select></Field>
    <Button disabled={!valid || state === 'Queued' || state === 'Unknown charge'} onClick={() => { setQuote({ ...draft, seed: draft.seed.trim() }); setState('Review'); }}>Review local run quote</Button>
    {(state === 'Review' || state === 'Queued' || state === 'Unknown charge') && quote && <RunCostSummary state={state === 'Review' ? 'quoted' : state === 'Queued' ? 'pending' : 'uncertain'} scope={`${quote.seed} · ${quote.market} · maximum ${quote.limit} ideas`} units={`One ideas request, no paging; bound ${quote.limit}`} estimatedPrice="US$0.020000 · synthetic example only" quoteExpiryLabel="Five-minute application quote; local review has no spend authority" receipt={state !== 'Review' ? 'demo-keyword-request-01' : undefined} actions={state === 'Review' ? <><Button onClick={() => { setReceipt(quote); setState('Queued'); setSelected([]); }}>Start approved local preview</Button><Button variant="secondary" onClick={() => setState('Draft')}>Cancel review; keep draft</Button></> : state === 'Queued' ? <Button onClick={() => setState(outcome === 'Partial bounded result' ? 'Ready' : outcome)}>Read local receipt</Button> : <Button onClick={() => setState('Reconciled receipt only')}>Inspect original receipt locally</Button>} />}
    {state === 'Reconciled receipt only' && <Alert title="Original charge evidence inspected">Synthetic receipt demo-keyword-request-01 retained. Lost provider rows cannot be reconstructed. A new attempt needs a new explicit quote.</Alert>}
    {state === 'Permission lost' && <Alert title="Research permission lost">The execution scope and draft remain labelled. No result payload is shown; the app must recheck authorization.</Alert>}
    {state === 'No ideas' && <Alert title="No returned ideas">This completed synthetic receipt contains no ideas. Edit the draft and explicitly review another request.</Alert>}
    {receipt && <p>Executed: {receipt.seed} · {receipt.market} · maximum {receipt.limit} · receipt demo-keyword-request-01 · retrieved 18 October 2026, 23:00 UTC.</p>}
    {state === 'Ready' && <><Alert tone="warning" title="Three synthetic rows; bounded result">Provider estimates, not native traffic. Index freshness unknown. Null volume is unavailable; zero is a reported estimate of zero.</Alert><Field label="Filter returned ideas locally" htmlFor={`${id}-filter`}><Input value={filter} onChange={e => setFilter(e.target.value)} /></Field><DataTable caption="Synthetic DataForSEO ideas · executed market" rows={visible} rowKey={row => row.keyword} searchable={false} emptyTitle="No ideas match this local filter" columns={[
      { key: 'select', header: 'Select', render: row => <Checkbox label={`Select ${row.keyword}`} checked={selected.includes(row.keyword)} onChange={e => setSelected(e.target.checked ? [...selected, row.keyword] : selected.filter(k => k !== row.keyword))} /> },
      { key: 'keyword', header: 'Keyword' }, { key: 'volume', header: 'Estimated monthly searches', render: row => row.volume === null ? 'Unavailable' : row.volume },
    ]} /><Button disabled={!selected.length} onClick={() => setSaved([...new Set([...saved, ...selected.map(keyword => `${keyword} · ${receipt?.market}`)])])}>Save selected keywords locally</Button>{filter && <Button variant="ghost" onClick={() => setFilter('')}>Clear local filter</Button>}</>}
    {saved.length > 0 && <section aria-label="Saved local keywords"><h3>Saved local list</h3><ul>{saved.map(k => <li key={k}>{k} · authored selection; no recurring rank checks</li>)}</ul></section>}
    {state === 'Draft' && <p>No research run yet. Edit the seed and review its exact scope.</p>}
  </CollectionTemplate>;
}
