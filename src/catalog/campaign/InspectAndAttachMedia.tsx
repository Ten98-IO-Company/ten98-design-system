'use client';

import { useId, useState } from 'react';
import { Alert, AssetDetails, Badge, Button, FlowSection, Field, Input, MediaStrip, Select, type MediaItem } from '../../lib';

type Asset = { id: string; name: string; alt: string; status: MediaItem['status']; approved: boolean; rights: string; expired: boolean; source: string; version: number };

export default function InspectAndAttachMedia() {
  const id = useId();
  const [assets, setAssets] = useState<Asset[]>([{ id: 'asset-launch', name: 'studio-launch-original.png', alt: 'Studio launch invitation', status: 'unverified', approved: false, rights: 'Studio-owned fixture artwork', expired: false, source: 'Synthetic DAM library · no remote image requested', version: 1 }]);
  const [selected, setSelected] = useState('asset-launch');
  const [query, setQuery] = useState('');
  const [destination, setDestination] = useState('ig-studio');
  const [attached, setAttached] = useState<MediaItem[]>([]);
  const [notice, setNotice] = useState('');
  const asset = assets.find(item => item.id === selected) ?? assets[0];
  const filtered = assets.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
  function update(patch: Partial<Asset>) { setAssets(current => current.map(item => item.id === asset.id ? { ...item, ...patch } : item)); setNotice(''); }
  const eligible = asset.status === 'ready' && asset.approved && !!asset.rights.trim() && !asset.expired;
  return <FlowSection title="Find, approve and attach media" description="Local reference · files stay on this screen; no transfer, processing or storage service is contacted." scope="Studio / Dubai launch · synthetic DAM library">
    <div className="t98-form-grid">{<>
      <Field htmlFor={`${id}-search`} label="Find by full filename"><Input type="search" value={query} onChange={event => setQuery(event.target.value)} /></Field><Field htmlFor={`${id}-upload`} label="Select local files · upload demonstration" description="Only filenames enter the local fixture queue. File contents are not uploaded or inspected."><Input type="file" multiple accept="image/*,video/*" onChange={event => { const files = Array.from(event.currentTarget.files ?? []); const next: Asset[] = files.map((file, index) => ({ id: `${id}-upload-${assets.length}-${index}`, name: file.name, alt: '', status: 'pending', approved: false, rights: '', expired: false, source: 'Local selection · no upload started', version: 1 })); setAssets(current => [...current, ...next]); if (next[0]) setSelected(next[0].id); event.currentTarget.value = ''; }} /></Field>
    </>}</div>
    <div className="t98-control-stack">{filtered.length ? filtered.map(item => <div key={item.id} className="t98-form-actions"><Button key={item.id} variant={item.id === selected ? 'primary' : 'secondary'} aria-pressed={item.id === selected} onClick={() => setSelected(item.id)}>{item.name} · {item.status}</Button></div>) : <Alert title="No filenames match" actions={<><Button variant="secondary" onClick={() => setQuery('')}>Clear filename filter</Button></>}></Alert>}</div>
    <AssetDetails assetId={asset.id} name={asset.name} kind="Synthetic image/video metadata" source={asset.source} original={`${asset.name} · original version ${asset.version} retained`} delivery={asset.status === 'ready' ? `demo-delivery-${asset.id}-v${asset.version} · synthetic reference only` : 'Not verified · processing or inspection required'} deliveryStatus={asset.expired ? 'Expired · cannot attach' : asset.status === 'ready' ? 'Synthetic ready evidence' : asset.status} deliveryExpiry={asset.expired ? 'Simulated expired delivery reference' : 'Fixture expiry: 21 October 2026 · 18:00 UTC'} approvalStatus={asset.approved ? `Approved exact original version ${asset.version} locally` : 'Needs review / approval stale'} processing={asset.status === 'pending'} metadata={[{ label: 'Dimensions', value: asset.status === 'ready' ? 'Synthetic 1200 × 1200 fixture evidence; actual file uninspected' : 'Unverified · never inferred from a filename' }, { label: 'Usage evidence', value: asset.rights || 'Missing · attachment blocked' }, { label: 'Destination', value: destination === 'ig-studio' ? 'Studio Dubai · demo-ig-17' : 'Studio Company · demo-li-28' }]} preview={<p>Preview unavailable in this metadata-only reference. Inspect the original in the app-owned media viewer.</p>} error={asset.status === 'error' ? 'Synthetic transfer / processing failure. Original filename and metadata are retained.' : undefined} issue={asset.expired ? 'Delivery reference expired. The app must obtain and validate a fresh delivery reference.' : undefined}
      actions={<><Button variant="secondary" onClick={() => update({ status: 'ready', source: 'Synthetic verified delivery fixture · no processing performed' })}>Simulate verified processing result</Button><Button variant="secondary" onClick={() => update({ status: 'error', approved: false })}>Simulate per-file processing failure</Button><Button variant="secondary" onClick={() => update({ status: 'pending', approved: false })}>Simulate processing pending</Button><Button variant="secondary" disabled={asset.status !== 'ready' || !asset.rights.trim() || asset.expired} onClick={() => update({ approved: true })}>Approve exact fixture version locally</Button><Button variant="ghost" onClick={() => update({ expired: true })}>Simulate delivery expiry</Button><Button variant="secondary" disabled={!asset.expired} onClick={() => update({ expired: false })}>Simulate refreshed delivery reference</Button><Button variant="secondary" onClick={() => update({ version: asset.version + 1, approved: false, status: 'unverified' })}>Simulate changed original · invalidate approval</Button></>} />
    <div className="t98-form-grid">
      <Field htmlFor={`${id}-rights`} label="Usage evidence · local metadata"><Input value={asset.rights} onChange={event => update({ rights: event.target.value, approved: false })} /></Field>
    <Field htmlFor={`${id}-alt`} label="Alternative text for this asset"><Input value={asset.alt} onChange={event => update({ alt: event.target.value, approved: false })} /></Field>
    <Field htmlFor={`${id}-destination`} label="Exact attachment destination"><Select value={destination} onChange={event => { setDestination(event.target.value); setAttached([]); setNotice('Destination changed. Review and attach explicitly for this destination.'); }}><option value="ig-studio">Studio Dubai · Instagram · demo-ig-17</option><option value="li-company">Studio Company · LinkedIn · demo-li-28</option></Select></Field>
    </div>
    <div className="t98-form-actions"><Button disabled={!eligible} onClick={() => { setAttached(current => [...current.filter(item => item.id !== asset.id), { id: asset.id, name: `${asset.name} · pinned fixture v${asset.version}`, altText: asset.alt, status: 'ready', statusLabel: 'Attached to local draft only' }]); setNotice('Attached to the selected local draft. Existing scheduled or approved media was not replaced.'); }}>Attach reviewed media to selected draft</Button></div>
    {notice && <p role="status">{notice}</p>}
    <MediaStrip label={`Local draft attachments · ${destination}`} items={attached} onItemsChange={setAttached} />
    <Alert title="Presentation boundary">The app owns uploads, checksum/version checks, public delivery validation, rights and approval policies. Fixture review is not authorization to use a real asset. No scheduled media is silently replaced.</Alert>
    <Badge>{assets.filter(item => item.status === 'pending').length} file(s) pending · {assets.filter(item => item.status === 'error').length} failed</Badge>

  </FlowSection>;
}
