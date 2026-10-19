'use client';

import { useId, useState } from 'react';
import { Alert, Button, DataTable, DetailTemplate, EvidenceSummary, Field, RunCostSummary, Select } from '../../lib';

type Scope = { profile: string; target: string; meaning: string };
const scopes: Scope[] = [
  { profile: 'Organic exact URL path', target: 'https://www.atlas.example/guides', meaning: 'Canonical atlas.example/guides; HTTP/HTTPS, leading www, query and fragment are ignored; trailing slash is equivalent.' },
  { profile: 'Backlinks exact URL', target: 'https://www.atlas.example/guides/', meaning: 'Exact HTTPS scheme, www hostname, path and trailing slash are preserved. Query and fragment are not accepted.' },
  { profile: 'Backlinks domain only', target: 'atlas.example', meaning: 'Only the named hostname; leading www normalized as required by the provider. Descendant subdomains excluded.' },
];

export default function DomainResearch() {
  const id = useId();
  const [draft, setDraft] = useState(0);
  const [quote, setQuote] = useState<Scope | null>(null);
  const [receipt, setReceipt] = useState<Scope | null>(null);
  const [state, setState] = useState('Draft');
  const [outcome, setOutcome] = useState('Partial');
  const locked = state === 'Pending' || state === 'Uncertain';
  const rows = state === 'Partial' ? [{ id: 'link-1', source: 'https://publisher.example/research', anchor: 'Analytics guide', rank: 0 as number | null }, { id: 'link-2', source: 'https://journal.example/notes', anchor: 'Atlas', rank: null }] : [];
  return <DetailTemplate title="Review domain and backlink research" description="Synthetic fixed-scope requests · Atlas · DataForSEO presentation only" scope={<p>No target fetch, quote service or paid call. The app supplies canonical requests and receipts.</p>}>
    <Field label="Supported example target and semantics" htmlFor={`${id}-target`}><Select value={draft} onChange={e => setDraft(Number(e.target.value))}>{scopes.map((scope, index) => <option value={index} key={scope.profile}>{scope.profile}</option>)}</Select></Field>
    <p dir="ltr">Draft target: {scopes[draft].target}</p><p>{scopes[draft].meaning}</p>
    <Field label="Local run outcome" htmlFor={`${id}-outcome`}><Select value={outcome} disabled={locked} onChange={e => setOutcome(e.target.value)}>{['Partial', 'Observed zero', 'Unavailable', 'Failed before dispatch', 'Uncertain'].map(s => <option key={s}>{s}</option>)}</Select></Field>
    <Button disabled={locked} onClick={() => { setQuote({ ...scopes[draft] }); setState('Quoted'); }}>Review exact local quote</Button>
    {quote && <RunCostSummary scope={<><p dir="ltr">{quote.target}</p><p>{quote.profile}: {quote.meaning}</p></>} units="First 25 results · one request · backlinks offset 0 · no automatic next page" state={state === 'Quoted' ? 'quoted' : state === 'Expired' ? 'expired' : state === 'Pending' ? 'pending' : state === 'Uncertain' ? 'uncertain' : state === 'Failed before dispatch' ? 'blocked' : 'settled'} estimatedPrice="US$0.030000 · synthetic example" settledPrice={['Partial', 'Observed zero', 'Unavailable', 'Reconciled'].includes(state) ? 'US$0.021000 · synthetic receipt' : undefined} quoteExpiryLabel="App-supplied five-minute expiry; expired quote cannot start" receipt={receipt && state !== 'Quoted' && state !== 'Expired' ? 'demo-domain-request-01 · original request key retained' : undefined}
      actions={state === 'Quoted' ? <><Button onClick={() => { setReceipt(quote); setState('Pending'); }}>Start approved local run</Button><Button variant="secondary" onClick={() => setState('Expired')}>Simulate quote expiry</Button></> : state === 'Pending' ? <Button onClick={() => setState(outcome)}>Inspect local receipt</Button> : state === 'Uncertain' ? <Button onClick={() => setState('Reconciled')}>Reconcile original receipt locally</Button> : undefined} />}
    {state === 'Reconciled' && <Alert title="Charge reconciled; result still unavailable">Original demo-domain-request-01 is retained. Reconciliation establishes synthetic charge evidence only; it cannot recreate lost rows. Another attempt needs an explicit new quote.</Alert>}
    {state === 'Failed before dispatch' && <Alert tone="danger" title="Confirmed failure before dispatch">No provider work occurred. Keep this receipt; a new attempt requires another review.</Alert>}
    {receipt && <EvidenceSummary variant="compact" source={`DataForSEO · ${receipt.profile}`} observedAt={{ label: 'Retrieved 18 October 2026, 23:00 UTC' }} basis={receipt.meaning} freshness={{ status: 'unknown', reason: 'Underlying provider index time was not supplied.' }} coverage={{ status: state === 'Partial' ? 'partial' : 'unavailable', reason: state === 'Partial' ? 'Two synthetic rows of a first-page bound of 25; no full inventory claim.' : state === 'Observed zero' ? 'Provider reported no matches in the exact requested scope.' : 'Result coverage is not established.' }} availability={state === 'Partial' || state === 'Observed zero' ? 'ready' : 'unavailable'} value={state === 'Observed zero' ? 0 : undefined} reason={state === 'Observed zero' ? 'Confirmed zero matches in this synthetic observation, not zero across the web.' : 'Receipt scope remains independent from the current draft.'} />}
    {state === 'Partial' && (receipt?.profile.startsWith('Organic') ? <DataTable caption="Synthetic organic keywords · UAE · English · bounded result" rows={[{ keyword: 'privacy analytics', position: 8 as number | null, volume: 0 as number | null }, { keyword: 'analytics guide', position: null, volume: null }]} rowKey={r => r.keyword} columns={[{ key: 'keyword', header: 'Organic keyword' }, { key: 'position', header: 'Absolute organic position', render: r => r.position === null ? 'Unavailable' : r.position }, { key: 'volume', header: 'Estimated monthly searches', render: r => r.volume === null ? 'Unavailable' : r.volume }]} /> : <DataTable caption="Synthetic referring pages · bounded result · DataForSEO rank (0–100)" rows={rows} rowKey={r => r.id} columns={[{ key: 'source', header: 'Referring page' }, { key: 'anchor', header: 'Anchor' }, { key: 'rank', header: 'DataForSEO rank (0–100)', render: r => r.rank === null ? 'Unavailable' : r.rank }]} />)}
  </DetailTemplate>;
}
