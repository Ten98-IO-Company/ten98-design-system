'use client';

import { useId, useState } from 'react';
import { Alert, Badge, Button, CollectionTemplate, DataTable, EvidenceDetail, Field, Select, type EvidenceAvailability } from '../../lib';

const sources = [
  { id: 'cited', url: 'https://publisher.example/privacy', relation: 'Explicit citation', capture: 'API execution', owner: 'Third-party publisher', answer: 'Synthetic original answer: compare the documented retention and consent controls. Source [1] supports this comparison.', evidence: 'Citation [1] appeared in the retained answer. This is separate from retrieval activity.' },
  { id: 'retrieved', url: 'https://docs.atlas.example/privacy', relation: 'Retrieved source only', capture: 'Provider collection', owner: 'Ownership unverified', answer: 'Synthetic retained response contains no explicit citation to this URL.', evidence: 'Provider supplied a retrieval trace. Retrieval alone is not a citation.' },
  { id: 'consumer', url: 'https://journal.example/guide', relation: 'Consumer-supplied capture', capture: 'User-provided consumer-interface capture', owner: 'Ambiguous ownership', answer: 'Synthetic user-supplied answer excerpt retained with its capture label. Its authenticity has not been independently verified.', evidence: 'Consumer-supplied capture; not proof of an API result or a complete consumer population.' },
];
const availability: Record<string, EvidenceAvailability> = { Available: 'ready', Loading: 'loading', 'Missing answer': 'unavailable', 'Expired evidence': 'expired', 'Access revoked': 'forbidden', 'Payload error': 'error' };

export default function CitationInvestigation() {
  const id = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const [state, setState] = useState('Available');
  const [filter, setFilter] = useState('All source relationships');
  const source = sources.find(item => item.id === selected);
  const visible = sources.filter(item => filter === 'All source relationships' || item.relation === filter);
  return <CollectionTemplate title="Investigate citations and original answers" description="Synthetic Atlas evidence · 12–18 October 2026 · retained capture methods" scope={<p>Scope: UAE · English · named sample executions. Citation counts, retrieved sources and consumer-supplied captures have separate meanings.</p>}
    toolbar={<><Field label="Evidence availability" htmlFor={`${id}-availability`}><Select value={state} onChange={e => setState(e.target.value)}>{Object.keys(availability).map(s => <option key={s}>{s}</option>)}</Select></Field><Field label="Source relationship filter" htmlFor={`${id}-relationship`}><Select value={filter} onChange={e => setFilter(e.target.value)}><option>All source relationships</option>{sources.map(s => <option key={s.id}>{s.relation}</option>)}<option>No matching relationship</option></Select></Field></>}>
    {source ? <EvidenceDetail label={`Answer evidence for ${source.relation}`} title={source.relation} scope="Atlas · 12–18 October 2026 · UAE · English · selected execution" provenance={`${source.capture} · synthetic execution ${source.id} · captured 18 October 2026, 23:00 UTC`} availability={availability[state]} onBack={() => setSelected(null)} backLabel="Back to scoped source results"
      message={state === 'Available' ? 'Original supplied text is rendered as text. Source grouping is supplied by the application.' : state === 'Expired evidence' ? 'Retained answer payload expired. Aggregate counts cannot recreate its text.' : state === 'Access revoked' ? 'Current permission is required. Answer and source payload are hidden.' : state === 'Missing answer' ? 'Original answer was not retained. A citation count cannot reconstruct it.' : 'The original payload is not available in this state.'}
      answer={<p>{source.answer}</p>} evidence={<><Badge>{source.relation}</Badge><p>{source.evidence}</p><p>Publisher ownership: {source.owner}. Grouping method: supplied synthetic category; no automatic ownership inference.</p></>}
      sources={<p dir="ltr">Source URL (synthetic, displayed as text): {source.url}</p>} /> : <>
      {state === 'Access revoked' ? <Alert title="Source access revoked">Source payloads are hidden pending current authorization. The selected filter is retained.</Alert> : <DataTable caption="Synthetic source relationships and capture methods" rows={visible} rowKey={r => r.id} emptyTitle="No citations or sources match this observed sample filter" columns={[{ key: 'relation', header: 'Relationship' }, { key: 'capture', header: 'Capture method' }, { key: 'owner', header: 'Ownership label' }, { key: 'detail', header: 'Investigation', render: row => <Button variant="ghost" aria-label={`Inspect ${row.relation}`} onClick={() => setSelected(row.id)}>Open execution evidence</Button> }]} />}
      {visible.length === 0 && <Button variant="secondary" onClick={() => setFilter('All source relationships')}>Clear relationship filter</Button>}
      <Alert title="Interpret only the observed sample">No source-gap score, recommendation or unobserved answer is inferred. Use the original execution method and denominator when reporting citation coverage.</Alert>
    </>}
  </CollectionTemplate>;
}
