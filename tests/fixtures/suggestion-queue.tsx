import { useState, type ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Field, Heading, Input, Stack, SuggestionQueue, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

type QueueProps = ComponentProps<typeof SuggestionQueue>;
type Change = Parameters<NonNullable<QueueProps['onStateChange']>>[0];
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
document.documentElement.dir = params.get('dir') === 'rtl' ? 'rtl' : 'ltr';
const initial: QueueProps['groups'] = [
  { id: 'campaign:[draft]', label: 'Campaign terms', provenance: 'Imported from the campaign brief.', items: [
    { id: 'term:[one]', label: 'Search phrase', state: 'suggested', description: 'A phrase supplied by the user.', provenance: 'Source: the product brief.' },
    { id: 'two', label: 'Product name', state: 'suggested', description: 'A retained source identifier: campaignSourceIdentifierWithoutBreaks0123456789012345678901234567890123456789', provenance: 'Source: the product catalog.' },
    { id: 'three', label: 'Existing audience', state: 'accepted' },
    { id: 'old', label: 'Old phrase', state: 'dismissed' },
  ] },
  { id: 'locations/#', label: 'Locations', items: [{ id: 'term:[one]', label: 'Dubai', state: 'suggested', provenance: 'Source: project location.' }] },
];

function Screen() {
  const mode = params.get('mode');
  const [groups, setGroups] = useState<QueueProps['groups']>(() => mode === 'empty' ? [] : mode === 'empty-group' ? [{ id: 'empty', label: 'No suggestions yet', items: [] }] : mode === 'accepted' || mode === 'dismissed' ? [{ id: 'only', label: 'Reviewed terms', items: [{ id: 'only', label: 'Reviewed phrase', state: mode === 'accepted' ? 'accepted' : 'dismissed' }] }] : initial);
  const [requests, setRequests] = useState<Change[]>([]);
  const [pending, setPending] = useState<Change>();
  const [draft, setDraft] = useState('Search phrase');
  const [submits, setSubmits] = useState(0);
  const [readOnly, setReadOnly] = useState(mode === 'read-only');
  const apply = (change: Change) => setGroups(current => current.map(group => group.id !== change.groupId ? group : { ...group, items: group.items.map(item => change.itemIds.includes(item.id) ? { ...item, state: change.state } : item) }));
  const change = (next: Change) => {
    setRequests(current => [...current, next]);
    if (params.has('hold')) setPending(next); else apply(next);
  };
  const presented = groups.map(group => ({ ...group, items: group.items.map(item => group.id === 'campaign:[draft]' && item.id === 'term:[one]' ? { ...item, label: draft, edited: draft !== 'Search phrase', editor: <Field label="Edit search phrase" htmlFor="suggestion-editor"><Input id="suggestion-editor" value={draft} onChange={event => setDraft(event.target.value)} /></Field> } : item) }));
  return <Stack as="main" gap={5}>
    <Heading level={1}>Suggested campaign setup</Heading>
    <form onSubmit={event => { event.preventDefault(); setSubmits(count => count + 1); }}>
      <div id="primary-queue"><SuggestionQueue label="Campaign suggestions" groups={presented} onStateChange={mode === 'no-handler' ? undefined : change} readOnly={readOnly} readOnlyReason="This saved review is read-only." emptyMessage="No suggestions are available." /></div>
    </form>
    <Button type="button" onClick={() => { if (pending) { apply(pending); setPending(undefined); } }}>Commit pending request</Button>
    <Button type="button" onClick={() => setReadOnly(current => !current)}>Toggle read-only</Button>
    <Text id="queue-requests">{JSON.stringify(requests)}</Text>
    <Text id="queue-submits">Form submissions: {submits}</Text>
    <Text id="queue-draft">Draft: {draft}</Text>
    {params.has('two') && <div id="secondary-queue"><SuggestionQueue label="Second suggestions" groups={[{ id: 'campaign:[draft]', label: 'Campaign terms', items: [{ id: 'term:[one]', label: 'Search phrase', state: 'suggested' }] }]} onStateChange={next => setRequests(current => [...current, next])} /></div>}
  </Stack>;
}

createRoot(document.getElementById('suggestion-queue-fixture')!).render(<Screen />);
