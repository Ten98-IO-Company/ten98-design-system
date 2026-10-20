import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, Badge, Button, Card, Field, Heading, Inline, Input, Meter, Progress, Select, Stack } from '@ten98/ui';
import '@ten98/ui/styles.css';

// Composed from library components only, the way an application screen must be.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';
const palettes = ['rose', 'amber', 'lime', 'emerald', 'sky', 'violet', 'fuchsia'] as const;
const regions = [
  { value: 'dubai', label: 'Dubai', group: 'Middle East' }, { value: 'riyadh', label: 'Riyadh', group: 'Middle East' },
  { value: 'london', label: 'London', group: 'Europe' },
];

function Screen() {
  const [pressed, setPressed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  return <Stack as="main" gap={6} id="extensions">
    <Heading level={1}>Primitive extensions</Heading>
    <Inline id="buttons">
      <Button id="link-button" href="/reports" variant="secondary">Open reports</Button>
      <Button id="disabled-link" href="/reports" disabled>Disabled link</Button>
      <Button id="toggle" variant="secondary" pressed={pressed} onClick={() => setPressed(!pressed)}>Show archived</Button>
      <Button id="icon-only" variant="secondary" icon={<span aria-hidden="true">+</span>} aria-label="Add project" />
    </Inline>
    <Button id="full-width" fullWidth>Create project</Button>
    <Card as="section" headingLevel={2} title="A card whose title is deliberately long enough to wrap at narrow widths" description="Section landmark">
      <Field label="Region" required description="Grouped options with a placeholder">
        <Select id="region" name="region" placeholder="Choose a region" options={regions} required />
      </Field>
      <Field label="Project name"><Input id="project" name="project" /></Field>
    </Card>
    {!dismissed && <Alert id="dismissible" tone="success" title="Changes saved" onDismiss={() => setDismissed(true)} dismissLabel="Dismiss message">The synchronisation finished without errors for every destination.</Alert>}
    <Alert variant="inline" tone="danger">Enter a valid email address.</Alert>
    <Alert variant="banner" tone="info">Reports may be unavailable tonight.</Alert>
    <Progress label="Syncing destinations" />
    <Progress label="Files uploaded" value={64} />
    <Meter label="Storage used" value={72} valueLabel="72 GB of 100 GB" low={60} high={85} optimum={10} />
    <Inline id="palettes">{palettes.map(palette => <Badge key={palette} palette={palette}>{palette}</Badge>)}</Inline>
  </Stack>;
}

createRoot(document.getElementById('primitives-extensions-fixture')!).render(<Screen />);
