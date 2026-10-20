import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button, CheckboxGroup, CodeBlock, Combobox, Disclosure, Field, Fieldset, Heading, InlineCode, Input, Pager, RadioGroup, Scroller, SegmentedControl, Stack, StatusLine, Text,
} from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';
const channels = [
  { value: 'email', label: 'Email', description: 'Sent from the campaign address.' },
  { value: 'social', label: 'Social network with a deliberately long destination name that must wrap' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push' },
  { value: 'web', label: 'Web' },
  { value: 'print', label: 'Print' },
];
const code = Array.from({ length: 24 }, (_, line) => `const metric${line} = await loadCampaignMetric('destination-${line}', { window: 'last-30-days', includeOrganic: true });`).join('\n');

function Screen() {
  const [open, setOpen] = useState(false);
  const [radio, setRadio] = useState('email');
  const [boxes, setBoxes] = useState(['email']);
  const [range, setRange] = useState('week');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(2);
  return <Stack as="main" gap={6} id="controls">
    <Heading level={1}>Controls</Heading>
    <Disclosure summary="Advanced settings" open={open} onOpenChange={setOpen} actions={<Button variant="secondary" size="sm">Reset</Button>}>
      <Text tone="muted">Retry limits and delivery windows.</Text>
    </Disclosure>
    <Fieldset legend="Schedule" description="Times use the account time zone." layout="grid">
      <Field label="Start" htmlFor="start"><Input id="start" type="time" /></Field>
      <Field label="End" htmlFor="end"><Input id="end" type="time" /></Field>
    </Fieldset>
    <RadioGroup legend="Channel" name="channel" options={channels} value={radio} onValueChange={setRadio} />
    <CheckboxGroup legend="Destinations" options={channels} value={boxes} onValueChange={setBoxes} maxHeight="sm" />
    <SegmentedControl label="Range" value={range} onValueChange={setRange} options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
    <Pager label="Results pages" status={`${page * 20 - 19}–${page * 20} of 60`} onPrevious={page > 1 ? () => setPage(page - 1) : undefined} onNext={page < 3 ? () => setPage(page + 1) : undefined} />
    <CodeBlock language="ts" copy maxHeight="sm" code={code} />
    <Text>Set <InlineCode>retryLimit</InlineCode> before publishing.</Text>
    <StatusLine busy>Loading campaigns…</StatusLine>
    <Combobox label="City" options={['Dubai', 'Doha', 'Riyadh']} value={city} onValueChange={setCity} />
    <Scroller label="Monthly spend"><Text>Jan 1,204 · Feb 1,310 · Mar 1,198 · Apr 1,420 · May 1,377 · Jun 1,502</Text></Scroller>
  </Stack>;
}

createRoot(document.getElementById('controls-fixture')!).render(<Screen />);
