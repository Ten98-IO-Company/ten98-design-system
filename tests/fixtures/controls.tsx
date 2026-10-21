import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button, CheckboxGroup, CodeBlock, Combobox, DateTimeField, Disclosure, Field, FileField, Fieldset, Heading, InlineCode, Input, Pager, RadioGroup, Scroller, SegmentedControl, Stack, StatusLine, Text,
  type FileItem,
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

const longName = 'quarterly-campaign-performance-review-final-approved-version-with-all-regional-appendices-and-legal-sign-off-2026.pdf';

function Screen() {
  const [publishAt, setPublishAt] = useState('2026-10-20T09:30');
  const [files, setFiles] = useState<FileItem[]>([{ id: 'seed', name: longName, size: 2411724, status: 'done' }]);
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
    <DateTimeField label="Publish at" value={publishAt} onValueChange={setPublishAt} min="2026-10-01T00:00" description="Posts go out at this time." timeZoneLabel="Asia/Dubai (GST)" />
    <FileField label="Attachments" accept="image/*,.pdf" multiple description="PDF or images." files={files}
      onFiles={added => setFiles(current => [...current, ...added.map(file => ({ id: file.name, name: file.name, size: file.size, status: 'pending' as const }))])}
      onRemove={id => setFiles(current => current.filter(file => file.id !== id))} />
    <Text>Value: {publishAt}</Text>
    <Scroller label="Monthly spend"><Text>Jan 1,204 · Feb 1,310 · Mar 1,198 · Apr 1,420 · May 1,377 · Jun 1,502</Text></Scroller>
  </Stack>;
}

createRoot(document.getElementById('controls-fixture')!).render(<Screen />);
