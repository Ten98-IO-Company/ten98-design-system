import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppliedFilters, Button, Field, Heading, Input, ReportToolbar, Select, Stack, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';
const initial = { from: '2026-11-01', to: '2026-11-07', zone: 'UTC', query: '', country: 'United Arab Emirates', device: 'All devices' };
const longScope = 'Retained report scope includes scopeIdentifierWithoutWordBreaks012345678901234567890123456789012345678901234567890123456789 and its original observation window.';

function Screen() {
  const [draft, setDraft] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const [applies, setApplies] = useState(0);
  const [exports, setExports] = useState(0);
  return <Stack as="main" gap={4} id="report-toolbar-screen">
    <Heading level={1}>Visitor report</Heading>
    <form onSubmit={event => { event.preventDefault(); setApplied(draft); setApplies(count => count + 1); }}>
      <ReportToolbar label="Visitor report controls" advancedLabel="More report filters"
        controls={<>
          <Field label="From" htmlFor="rt-from"><Input id="rt-from" type="date" value={draft.from} onChange={event => setDraft({ ...draft, from: event.target.value })}/></Field>
          <Field label="To" htmlFor="rt-to"><Input id="rt-to" type="date" value={draft.to} onChange={event => setDraft({ ...draft, to: event.target.value })}/></Field>
          <Field label="Time zone" htmlFor="rt-zone"><Select id="rt-zone" value={draft.zone} onChange={event => setDraft({ ...draft, zone: event.target.value })}><option>UTC</option><option>Asia/Dubai</option></Select></Field>
          <Field label="Search" htmlFor="rt-search"><Input id="rt-search" type="search" value={draft.query} onChange={event => setDraft({ ...draft, query: event.target.value })}/></Field>
          <Button type="submit">Apply report</Button>
        </>}
        advanced={<>
          <Field label="Country" htmlFor="rt-country"><Input id="rt-country" value={draft.country} onChange={event => setDraft({ ...draft, country: event.target.value })}/></Field>
          <Field label="Device" htmlFor="rt-device"><Select id="rt-device" value={draft.device} onChange={event => setDraft({ ...draft, device: event.target.value })}><option>All devices</option><option>Mobile</option></Select></Field>
        </>}
        summary={<Stack gap={2}>
          <AppliedFilters label="Applied report scope" filters={[{ id: 'range', label: 'Period', value: applied.from + ' to ' + applied.to }, { id: 'zone', label: 'Time zone', value: applied.zone }, { id: 'country', label: 'Country', value: applied.country }, { id: 'query', label: 'Search', value: applied.query || 'All results' }]}/>
          <Text id="result-summary">{longScope}</Text>
        </Stack>}
        actions={<Button id="export-result" type="button" variant="secondary" onClick={() => setExports(count => count + 1)}>Export result</Button>}/>
    </form>
    <Text>Caller applies: <span id="apply-count">{applies}</span></Text>
    <Text>Caller exports: <span id="export-count">{exports}</span></Text>
    <Text>No provider or report requests are made by this fixture.</Text>
  </Stack>;
}

createRoot(document.getElementById('report-toolbar-fixture')!).render(<Screen/>);
