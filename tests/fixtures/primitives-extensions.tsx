import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, Badge, Button, Card, ConfirmDialog, Dialog, Field, Heading, Inline, Input, Meter, Progress, Select, Stack, Tabs } from '@ten98/ui';
import '@ten98/ui/styles.css';

// Composed from library components only, the way an application screen must be.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';
const palettes = ['rose', 'amber', 'lime', 'emerald', 'sky', 'violet', 'fuchsia'] as const;
const regions = [
  { value: 'dubai', label: 'Dubai', group: 'Middle East' }, { value: 'riyadh', label: 'Riyadh', group: 'Middle East' },
  { value: 'london', label: 'London', group: 'Europe' },
];

function LazyTabs() {
  const [value, setValue] = useState('one');
  return <div id="lazy-tabs"><Tabs label="Lazy sections" value={value} onValueChange={setValue} keepMounted={false} items={[
    { value: 'one', label: 'One', content: 'First panel' },
    { value: 'two', label: 'Two', content: 'Second panel', disabled: true },
    { value: 'three', label: 'Three', content: 'Third panel' },
    { value: 'four', label: 'Four', content: 'Fourth panel' },
  ]} /></div>;
}

function GuardedDialog() {
  const [open, setOpen] = useState(false);
  const [veto, setVeto] = useState(true);
  const [reasons, setReasons] = useState<string[]>([]);
  return <div id="guarded">
    <Button id="open-guarded" variant="secondary" onClick={() => setOpen(true)}>Edit draft</Button>
    <p id="close-reasons" role="status">{reasons.join(',')}</p>
    <Dialog open={open} onOpenChange={setOpen} title="Edit draft" onBeforeClose={reason => { setReasons(list => [...list, reason]); return veto ? false : undefined; }}
      footer={<Button id="allow-close" variant="secondary" onClick={() => setVeto(false)}>Allow closing</Button>}>
      <Field label="Draft title"><Input id="draft-title" /></Field>
    </Dialog>
  </div>;
}

function AcknowledgedConfirm() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  return <div id="acknowledged">
    <Button id="open-confirm" variant="secondary" onClick={() => { setDone(false); setOpen(true); }}>Delete project</Button>
    <p id="confirm-result" role="status">{done ? 'deleted' : ''}</p>
    <ConfirmDialog open={open} onOpenChange={setOpen} title="Delete project?" description="This cannot be undone." danger confirmLabel="Delete" confirmationText="DELETE"
      acknowledgement="I understand all campaigns will be removed" onConfirm={() => setDone(true)}>
      <p id="confirm-body">Linked <a href="/campaigns">campaigns</a> are deleted too.</p>
    </ConfirmDialog>
  </div>;
}

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
    <LazyTabs />
    <GuardedDialog />
    <AcknowledgedConfirm />
    <Inline id="palettes">{palettes.map(palette => <Badge key={palette} palette={palette}>{palette}</Badge>)}</Inline>
  </Stack>;
}

createRoot(document.getElementById('primitives-extensions-fixture')!).render(<Screen />);
