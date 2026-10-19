'use client';

import { useId, useState } from 'react';
import { Alert, Badge, Button, ContentPreview, DestinationPicker, EditorTemplate, Field, MediaStrip, Tabs, Textarea, type MediaItem } from '../../lib';

const accounts = [
  { id: 'ig-studio', name: 'Studio Dubai · @studio.demo', provider: 'Instagram', description: 'Project launch · account demo-ig-17' },
  { id: 'li-company', name: 'Studio Company · company/demo', provider: 'LinkedIn', description: 'Project launch · organization demo-li-28' },
  { id: 'ig-shop', name: 'Studio Shop · @shop.demo', provider: 'Instagram', disabled: true as const, disabledReason: 'Reconnect this exact account before selecting it.' },
];
const originalMedia: MediaItem[] = [{ id: 'launch-1', name: 'launch-original.png', altText: 'Studio launch invitation', status: 'unverified', statusLabel: 'Dimensions unverified · synthetic fixture' }];

export default function ComposeSocialPost() {
  const id = useId();
  const [selected, setSelected] = useState(['ig-studio', 'li-company']);
  const [active, setActive] = useState('ig-studio');
  const [captions, setCaptions] = useState<Record<string, string>>({ 'ig-studio': 'Meet our Dubai studio on 21 October.', 'li-company': 'Our Dubai studio opens on 21 October. Meet the team.' });
  const [media, setMedia] = useState<Record<string, MediaItem[]>>({});
  const [policy, setPolicy] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState('');
  const [snapshot, setSnapshot] = useState<{ selected: string[]; active: string; captions: Record<string, string>; media: Record<string, MediaItem[]>; policy: Record<string, string> } | null>(null);
  const [validation, setValidation] = useState<string[] | null>(null);
  const account = accounts.find(item => item.id === active) ?? accounts[0];
  const items = policy[active] === 'empty' ? [] : policy[active] === 'custom' ? media[active] ?? [] : originalMedia;
  function changeMedia(next: MediaItem[]) { setMedia(current => ({ ...current, [active]: next })); setPolicy(current => ({ ...current, [active]: next.length ? 'custom' : 'empty' })); setValidation(null); }
  function validate() {
    const issues = selected.flatMap(accountId => {
      const destination = accounts.find(item => item.id === accountId)!;
      const assets = policy[accountId] === 'empty' ? [] : policy[accountId] === 'custom' ? media[accountId] ?? [] : originalMedia;
      return [!captions[accountId]?.trim() ? `${destination.name}: add a caption.` : '', assets.some(item => item.status !== 'ready') ? `${destination.name}: media is pending, failed or unverified. Inspect it before provider preflight.` : ''].filter(Boolean);
    });
    setValidation(selected.length ? issues : ['Select at least one exact account.']);
  }
  return <EditorTemplate title="Compose a social post" description="Local reference · synthetic accounts and media. This example saves only while mounted and sends no provider request." scope="Workspace Studio · Project Dubai launch"
    actions={<Badge tone={validation?.length === 0 ? 'success' : 'neutral'}>{validation?.length === 0 ? 'Local checks passed' : 'Draft'}</Badge>}
    feedback={<><Alert title="Account copies stay independent">Selecting two Instagram accounts would create two account copies. Empty media explicitly removes inherited media. Local checks do not establish provider eligibility or approval.</Alert>{saved && <p role="status">{saved}</p>}{validation && <Alert title={validation.length ? 'Review the draft' : 'Ready for app-owned preflight'} tone={validation.length ? 'warning' : 'success'}>{validation.length ? <ul>{validation.map(issue => <li key={issue}>{issue}</li>)}</ul> : 'Selected captions and fixture media passed these local checks. Nothing has been scheduled or published.'}</Alert>}</>}
    preview={<ContentPreview label="Account preview" destination={account.name} provider={account.provider} text={captions[active]} media={<p>{items.length ? items.map(item => `${item.name} (${item.status})`).join(', ') : 'Explicitly no media'}</p>} footer="Approximate layout. The app supplies weighted counts, network options, consent and provider validation." />}
    footer={<><Button variant="secondary" onClick={() => { setSnapshot({ selected, active, captions, media, policy }); setSaved(`Local draft snapshot saved for ${selected.length} account(s), including incomplete content. No durable storage.`); }}>Save local draft</Button><Button variant="secondary" disabled={!snapshot} onClick={() => { if (!snapshot) return; setSelected(snapshot.selected); setActive(snapshot.active); setCaptions(snapshot.captions); setMedia(snapshot.media); setPolicy(snapshot.policy); setValidation(null); setSaved('Saved local snapshot restored.'); }}>Restore saved local draft</Button><Button onClick={validate}>Validate selected accounts locally</Button></>}>
    <DestinationPicker label="Exact destination accounts" accounts={accounts} selectedIds={selected} onSelectionChange={next => { setSelected(next); if (!next.includes(active) && next[0]) setActive(next[0]); setValidation(null); }} />
    {selected.length > 0 ? <><Tabs label="Edit account copy" value={active} onValueChange={setActive} items={selected.map(value => ({ value, label: accounts.find(item => item.id === value)!.name }))} />
      <Field htmlFor={`${id}-caption`} label={`Caption for ${account.name}`}><Textarea value={captions[active] ?? ''} onChange={event => { setCaptions(current => ({ ...current, [active]: event.target.value })); setValidation(null); }} /></Field>
      <p>Media choice: {policy[active] === 'empty' ? 'Explicitly empty' : policy[active] === 'custom' ? 'Account-specific media' : 'Inherited from original draft'}</p>
      <MediaStrip label={`Media for ${account.name}`} items={items} onItemsChange={changeMedia} onFilesSelect={files => changeMedia([...items, ...files.map((file): MediaItem => ({ id: `${id}-${crypto.randomUUID()}`, name: file.name, altText: '', status: 'pending', statusLabel: 'Local file selected · upload not started' }))])} />
      <div className="t98-form-actions"><Button variant="secondary" onClick={() => { setPolicy(current => ({ ...current, [active]: 'inherit' })); setValidation(null); }}>Use inherited media</Button><Button variant="secondary" onClick={() => changeMedia([])}>Use no media for this account</Button>
        <Button variant="secondary" disabled={!items.length} onClick={() => changeMedia(items.map(item => ({ ...item, status: 'ready', statusLabel: 'Synthetic ready evidence · no upload performed', error: undefined })))}>Simulate ready media evidence</Button>
        <Button variant="ghost" disabled={!items.length} onClick={() => changeMedia(items.map(item => ({ ...item, status: 'error', error: 'Synthetic processing failure. Original and caption are retained.' })))}>Simulate media failure</Button></div>
    </> : <Alert title="No destination selected">Select an account to edit its copy. Previously entered account captions remain in this local draft.</Alert>}
  </EditorTemplate>;
}
