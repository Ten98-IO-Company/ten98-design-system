import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AccountMenu, AppTopbar, Button, DataTable, Dialog, Field, Heading, Input, Sheet, Stack, Tabs, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
document.documentElement.dir = params.get('dir') === 'rtl' ? 'rtl' : 'ltr';

function ConsumerScreen() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('brand');
  const [draft, setDraft] = useState('Saved brand');
  const [saves, setSaves] = useState(0);
  const [signOuts, setSignOuts] = useState(0);
  return <>
    <header style={{ position: 'fixed', insetBlockStart: 0, insetInline: 0, height: 60, zIndex: 'var(--t98-z-popover)', background: 'var(--t98-surface)' }}>
      <AppTopbar breadcrumb={{ current: 'Project context' }} actions={<AccountMenu name="Synthetic account" items={[{ id: 'signout', kind: 'button', label: 'Sign out', onSelect: () => setSignOuts(count => count + 1) }]} />} />
    </header>
    <main style={{ paddingBlockStart: 76 }}><Stack gap={4}>
      <Button type="button" onClick={() => setOpen(true)}>Edit project context</Button>
      <Tabs label="Context sections" value={tab} onValueChange={setTab} items={[{ value: 'brand', label: 'Brand', content: <Text>Saved brand context.</Text> }, { value: 'pages', label: 'Pages', content: <Text>Saved key pages.</Text> }]} />
      <Text id="consumer-saves">Consumer saves: {saves}</Text>
      <Text id="consumer-signouts">Sign outs: {signOuts}</Text>
      <div id="consumer-table" style={{ position: 'absolute', insetInline: 0, top: 310 }}>
        <DataTable ariaLabel="Background records" stickyHeader searchable={false} sortable={false} pagination={false} columns={[{ key: 'label', header: 'Competitor', render: row => row.label }, { key: 'domain', header: 'Primary domain', render: row => row.domain }]} rows={[{ id: 'one', label: 'Saved competitor', domain: 'example.test' }]} rowKey={row => row.id} />
      </div>
      <Sheet open={open} modal={false} width="sm" topInset={60} title="Project context editor" onClose={() => setOpen(false)}>
        <form aria-label="Edit project context" onSubmit={event => { event.preventDefault(); setSaves(count => count + 1); }}>
          <Field label="Brand name" htmlFor="consumer-brand"><Input id="consumer-brand" name="brand" value={draft} onChange={event => setDraft(event.target.value)} /></Field>
          <Button type="submit">Save changes</Button>
        </form>
      </Sheet>
    </Stack></main>
  </>;
}

function Screen() {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(params.get('modal') !== 'false');
  const [draft, setDraft] = useState('Original campaign');
  const [background, setBackground] = useState('Background draft');
  const [busy, setBusy] = useState(params.get('mode') === 'legacy');
  const [unknown, setUnknown] = useState(false);
  const [error, setError] = useState('');
  const [saves, setSaves] = useState(0);
  const [closes, setCloses] = useState(0);
  const [submitted, setSubmitted] = useState('');
  const finishSave = useRef<(() => void) | undefined>(undefined);
  const returnTarget = useRef<HTMLInputElement>(null);
  const close = () => { setCloses(count => count + 1); setOpen(false); };
  const actions = <>
    <Button type="button" variant="secondary" onClick={() => setModal(value => !value)}>Switch modality</Button>
    <Button type="button" variant="secondary" onClick={() => setBusy(true)}>Start busy</Button>
    <Button type="button" variant="secondary" onClick={() => { setBusy(false); finishSave.current?.(); finishSave.current = undefined; }}>Finish simulated save</Button>
    <Button type="button" variant="secondary" onClick={() => { setUnknown(true); setError('Save outcome is unknown.'); }}>Simulate unknown save</Button>
  </>;
  const children = <Stack gap={4}>
    <Field label="Campaign name" htmlFor="sheet-campaign"><Input id="sheet-campaign" name="campaign" value={draft} onChange={event => setDraft(event.target.value)} /></Field>
    <Field label="Revision" htmlFor="sheet-revision"><Input id="sheet-revision" name="revision" value="revision-7" readOnly /></Field>
    {params.has('long') && Array.from({ length: 24 }, (_, index) => <Text key={index}>Saved observation {index + 1}: retained campaign context and evidence remain readable inside the scrolling editor.</Text>)}
  </Stack>;
  const shared = {
    open, title: 'Edit campaign', description: 'Update the saved campaign draft.', modal, actions,
    dirty: params.get('mode') === 'dirty' && draft !== 'Original campaign',
    restoreFocus: params.has('restore') ? () => returnTarget.current : undefined,
    footer: <Button type="submit" name="intent" value="save">Save campaign</Button>,
    onSubmit: async (data: FormData) => {
      setSaves(count => count + 1);
      setSubmitted(JSON.stringify([...data.entries()]));
      if (params.get('mode') === 'submit') {
        setBusy(true);
        await new Promise<void>(resolve => { finishSave.current = resolve; });
        setError('Simulated save failed; draft retained.');
      } else setError('Simulated validation error; draft retained.');
    },
    children,
  };
  return <Stack as="main" gap={4}>
    <Heading level={1}>Campaign workspace</Heading>
    <Button id="open-sheet" type="button" onClick={() => setOpen(true)}>Open editor</Button>
    <Field label="Background campaign" htmlFor="background-campaign"><Input id="background-campaign" value={background} onChange={event => setBackground(event.target.value)} /></Field>
    <Field label="Return focus target" htmlFor="return-target"><Input ref={returnTarget} id="return-target" defaultValue="Focus returns here" /></Field>
    <Text id="sheet-saves">Save calls: {saves}</Text>
    <Text id="sheet-closes">Close calls: {closes}</Text>
    <Text id="sheet-submitted">{submitted}</Text>
    <Text id="sheet-background">Background: {background}</Text>
    {params.get('mode') === 'legacy'
      ? <Dialog {...shared} onOpenChange={next => { if (!next) close(); }} closeDisabled={busy} />
      : <Sheet {...shared} onClose={close} width={params.get('width') === 'sm' ? 'sm' : params.get('width') === 'lg' ? 'lg' : 'md'} busy={busy} unconfirmed={unknown ? 'The last save has not been confirmed.' : undefined} error={error || undefined} recovery={unknown ? <Button type="button" onClick={() => setUnknown(false)}>Check save status</Button> : undefined} />}
  </Stack>;
}

createRoot(document.getElementById('sheet-fixture')!).render(params.has('consumer') ? <ConsumerScreen /> : <Screen />);
