'use client';

import { useId, useState } from 'react';
import {
  ActivityFeed, Alert, Badge, Breadcrumb, Button, Card, Checkbox, CollectionTemplate,
  ContentPreview, DataTable, DestinationPicker, DetailTemplate, EditorTemplate, EmptyState,
  Field, FlowSection, Icon, Input, MediaStrip, MetricCard, OverviewTemplate, SectionNav, Select,
  SettingsTemplate, Textarea, type DataColumn, type MediaItem,
} from '../lib';

export type TemplateKind = 'OverviewTemplate' | 'CollectionTemplate' | 'DetailTemplate' | 'EditorTemplate' | 'SettingsTemplate';
export type TemplateMode = 'default' | 'empty' | 'loading' | 'readonly' | 'error' | 'saving' | 'long-scope';
type CampaignRow = { id: string; name: string; status: string; owner: string; updated: string };

const longScope = 'International studio group / Middle East and North Africa / Regional creative operations / Autumn launch workspace with an intentionally long account name';
const campaigns: CampaignRow[] = [
  { id: 'launch', name: 'Studio launch', status: 'Draft', owner: 'Alex Morgan', updated: '2026-10-20' },
  { id: 'autumn', name: 'Autumn update', status: 'In review', owner: 'Sam Patel', updated: '2026-10-19' },
  { id: 'open-day', name: 'Studio open day', status: 'Scheduled', owner: 'Alex Morgan', updated: '2026-10-18' },
  { id: 'services', name: 'New services', status: 'Draft', owner: 'Studio team', updated: '2026-10-17' },
];
const campaignColumns: DataColumn<CampaignRow>[] = [
  { key: 'name', header: 'Campaign' },
  { key: 'status', header: 'Status', render: row => <Badge tone={row.status === 'Scheduled' ? 'info' : row.status === 'In review' ? 'warning' : 'neutral'}>{row.status}</Badge> },
  { key: 'owner', header: 'Owner' },
  { key: 'updated', header: 'Updated', render: row => <time dateTime={row.updated}>{row.updated}</time> },
];
const accounts = [
  { id: 'studio-dubai', name: 'Studio Dubai', provider: 'Instagram' },
  { id: 'studio-company', name: 'Studio Company', provider: 'LinkedIn' },
];
const sampleMedia: MediaItem[] = [{
  id: 'launch-artwork', name: 'Studio launch artwork', status: 'unverified',
  altText: 'An announcement of the studio launch', preview: <Icon name="file" size={32} />,
}];
const activity = [
  { id: 'draft', title: 'Studio launch draft updated', description: 'Alex Morgan edited the caption. No delivery was requested.', time: 'Today, 10:15' },
  { id: 'review', title: 'Autumn update moved to review', description: 'Sam Patel requested a review in this example workspace.', time: 'Yesterday, 16:40' },
];

/** Local page compositions. Apps replace these fixtures with their own state and controllers. */
export function TemplateDemo({ kind, mode = 'default' }: { kind: TemplateKind; mode?: TemplateMode }) {
  const id = useId();
  const [period, setPeriod] = useState('week');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [reviewSelection, setReviewSelection] = useState(false);
  const [name, setName] = useState(mode === 'empty' ? '' : 'Studio launch');
  const [content, setContent] = useState(mode === 'empty' ? '' : 'Meet the team and explore our new studio. Join us for an open day this autumn.');
  const [destinations, setDestinations] = useState<string[]>(mode === 'empty' ? [] : ['studio-dubai']);
  const [media, setMedia] = useState<MediaItem[]>(mode === 'empty' ? [] : sampleMedia);
  const [timezone, setTimezone] = useState('Asia/Dubai');
  const [approval, setApproval] = useState('required');
  const [updates, setUpdates] = useState(true);
  const [digest, setDigest] = useState(false);
  const [message, setMessage] = useState('');
  const busy = mode === 'loading' || mode === 'saving';
  const readOnly = mode === 'readonly';
  const locked = busy || readOnly;
  const rows = name ? [{ ...campaigns[0], name }, ...campaigns.slice(1)] : [];
  const matchingRows = rows.filter(row => status === 'all' || row.status === status);
  const selectedRows = matchingRows.filter(row => selected.includes(row.id));
  const scope = <p><strong>Workspace:</strong> {mode === 'long-scope' ? longScope : 'Studio / Main account'}</p>;
  const feedback = message ? <Alert title={message} />
    : mode === 'error' ? <Alert tone="danger" title="Example action failed">Your local values are retained. Review them and try the example action again.</Alert>
    : readOnly ? <Alert title="Read-only access">An editor can make changes in this workspace.</Alert>
    : busy ? <p role="status">{mode === 'saving' ? 'Example save in progress…' : 'Loading; the last available example content is shown.'}</p>
    : <p>Local demonstration data. Changes are kept only while this example is open.</p>;
  const action = <Button variant="secondary" disabled={busy} onClick={() => setMessage('The local example was refreshed. No request was sent.')}>Refresh example</Button>;
  const breadcrumb = <Breadcrumb items={[{ label: 'Campaigns' }, { label: name || 'Untitled campaign' }]} />;
  const empty = <EmptyState title="No campaigns yet" description="Add sample content to explore this page layout."
    action={<Button disabled={locked} onClick={() => setName('New local draft')}>Add example content</Button>} />;

  if (kind === 'OverviewTemplate') return <OverviewTemplate title="Overview" description="See what needs attention across the workspace." actions={action} scope={scope} aria-busy={busy || undefined}
    filters={<Field label="Reporting period" htmlFor={`${id}-period`}><Select value={period} disabled={busy} onChange={event => setPeriod(event.target.value)}><option value="week">This week</option><option value="month">This month</option></Select></Field>}
    metrics={<><MetricCard label="Drafts" value={name ? period === 'week' ? 2 : 8 : '—'} /><MetricCard label="In review" value={name ? period === 'week' ? 1 : 4 : '—'} /><MetricCard label="Scheduled" value={name ? period === 'week' ? 1 : 6 : '—'} /></>}>
    {feedback}
    <FlowSection title="Publishing queue" description="Upcoming work and its current review state.">
      {rows.length ? <DataTable caption="Publishing queue" columns={campaignColumns} rows={rows} rowKey={row => row.id} searchable={false} pageSize={4} /> : empty}
    </FlowSection>
    <FlowSection title="Recent activity" description="The latest changes in this example workspace.">
      {name ? <ActivityFeed items={activity} /> : <EmptyState title="No activity yet" description="Changes to example campaigns will appear here." />}
    </FlowSection>
  </OverviewTemplate>;

  if (kind === 'CollectionTemplate') return <CollectionTemplate title="Campaigns" description="Find work, inspect its status and review a selection." actions={action} scope={scope} aria-busy={busy || undefined}
    toolbar={<Field label="Campaign status" htmlFor={`${id}-status`}><Select value={status} disabled={busy} onChange={event => { setStatus(event.target.value); setSelected([]); setReviewSelection(false); }}><option value="all">All statuses</option><option>Draft</option><option>In review</option><option>Scheduled</option></Select></Field>}
    selection={<FlowSection title="Selected campaigns" description="Inspect a local selection before choosing an app-owned action."
      actions={<Button variant="secondary" disabled={locked || !selectedRows.length} onClick={() => setReviewSelection(true)}>Review selected</Button>}>
      <p role="status">{selectedRows.length} {selectedRows.length === 1 ? 'campaign selected' : 'campaigns selected'}</p>
      {reviewSelection && <Card title="Selection review"><ul>{selectedRows.map(row => <li key={row.id}>{row.name} — {row.status}</li>)}</ul><p>No campaign status has changed.</p></Card>}
    </FlowSection>}>
    {feedback}
    <FlowSection title="Campaign results" description="Search, sort and select records. The table contains the only pagination controls.">
      {rows.length ? <DataTable key={status} caption="Campaigns" columns={campaignColumns} rows={matchingRows} rowKey={row => row.id} pageSize={3}
        selectable={!locked} onSelectionChange={keys => { setSelected(keys); setReviewSelection(false); }} emptyTitle="No matching campaigns" /> : empty}
    </FlowSection>
  </CollectionTemplate>;

  if (kind === 'DetailTemplate') return <DetailTemplate title={name || 'Untitled campaign'} description="Campaign content, destinations and change history." actions={action} breadcrumb={breadcrumb} scope={scope} status={<Badge>Draft</Badge>} aria-busy={busy || undefined}
    navigation={<SectionNav label="Campaign sections" items={[{ id: 'summary', label: 'Summary', href: `#${id}-summary`, current: true }, { id: 'destinations', label: 'Destinations and media', href: `#${id}-destinations` }, { id: 'activity', label: 'Activity', href: `#${id}-activity` }]} />}
    aside={<Card title="Owner and review"><p><strong>Owner:</strong> Alex Morgan</p><p><strong>Review:</strong> Not requested</p><p><strong>Time zone:</strong> Asia/Dubai</p><p>No delivery has been requested.</p></Card>}>
    {feedback}
    <FlowSection id={`${id}-summary`} title="Summary" description="The current draft and its purpose.">
      {name ? <Card title={name}><p>{content}</p><p><strong>Objective:</strong> Introduce the studio and invite visitors to the open day.</p></Card> : empty}
    </FlowSection>
    <FlowSection id={`${id}-destinations`} title="Destinations and media" description="Inspect the draft’s exact account and attached artwork.">
      <Card title="Destination"><p>{destinations.length ? 'Studio Dubai' : 'No destination selected'}</p>{destinations.length > 0 && <p>Instagram · Draft copy only</p>}</Card>
      <MediaStrip label="Attached media" items={media} onItemsChange={setMedia} readOnly />
    </FlowSection>
    <FlowSection id={`${id}-activity`} title="Activity" description="A record of changes to this campaign.">
      {name ? <ActivityFeed items={activity.slice(0, 1)} /> : <EmptyState title="No campaign activity" description="This example has no campaign history yet." />}
    </FlowSection>
  </DetailTemplate>;

  if (kind === 'EditorTemplate') return <EditorTemplate title="Edit campaign" description="Compose a draft, inspect the preview and save when ready." breadcrumb={breadcrumb} scope={scope} aria-busy={busy || undefined}
    feedback={feedback}
    preview={<div className="t98-feature-parts">
      <FlowSection title="Live preview" description="An approximate view of the local draft.">
        <ContentPreview label="Draft preview" destination={accounts.filter(account => destinations.includes(account.id)).map(account => account.name).join(', ') || 'No account selected'} provider="Local example"
          text={content || undefined} media={media.length ? <p>{media.length} sample artwork attached</p> : undefined} footer={<p>{name || 'Untitled campaign'}</p>} />
      </FlowSection>
      <FlowSection title="Readiness" description="Local completeness checks; provider validation remains app-owned.">
        <ul className="t98-control-stack"><li>Campaign name: {name.trim() ? 'Added' : 'Required'}</li><li>Caption: {content.trim() ? 'Added' : 'Required'}</li><li>Destination: {destinations.length ? 'Selected' : 'Required'}</li><li>Media: {media.length ? 'Metadata unverified' : 'No media attached'}</li></ul>
      </FlowSection>
    </div>}
    footer={<div className="t98-form-actions"><Button type="submit" form={`${id}-form`} disabled={readOnly} loading={busy}>Save draft</Button><p>Saves this local example only.</p></div>}>
    <form id={`${id}-form`} className="t98-form-stack" onSubmit={event => { event.preventDefault(); if (!locked) setMessage('Draft saved in the local example. No request was sent.'); }}>
      <FlowSection id={`${id}-general`} title="Draft content" description="Use a clear internal name and write the account caption.">
        <Field label="Campaign name" htmlFor={`${id}-name`}><Input name="name" required maxLength={100} value={name} disabled={busy} readOnly={readOnly} onChange={event => { setName(event.target.value); setMessage(''); }} /></Field>
        <Field label="Caption" htmlFor={`${id}-caption`} description="Up to 2,200 characters. Incomplete drafts can be saved; publishing checks stay separate."><Textarea name="caption" maxLength={2200} rows={5} value={content} disabled={busy} readOnly={readOnly} onChange={event => { setContent(event.target.value); setMessage(''); }} /></Field>
      </FlowSection>
      <FlowSection title="Destination accounts" description="Choose the exact accounts for this draft.">
        <DestinationPicker label="Accounts" accounts={accounts} selectedIds={destinations} pending={busy} readOnly={readOnly} onSelectionChange={ids => { setDestinations(ids); setMessage(''); }} />
      </FlowSection>
      <FlowSection title="Media" description="Review sample artwork and its alternative text.">
        <MediaStrip label="Draft media" items={media} onItemsChange={items => { setMedia(items); setMessage(''); }} pending={busy} readOnly={readOnly} />
        {!media.length && <div className="t98-form-actions"><Button variant="secondary" disabled={locked} onClick={() => setMedia(sampleMedia)}>Add sample artwork</Button></div>}
      </FlowSection>
    </form>
  </EditorTemplate>;

  return <SettingsTemplate title="Workspace settings" description="Manage identity, review preferences and notifications." scope={scope} aria-busy={busy || undefined}
    navigation={<SectionNav label="Settings sections" wrap items={[{ id: 'general', label: 'General', href: `#${id}-general`, current: true }, { id: 'notifications', label: 'Notifications', href: `#${id}-notifications` }]} />} feedback={feedback}>
    <form id={`${id}-form`} className="t98-form-stack" onSubmit={event => { event.preventDefault(); if (!locked) setMessage('Values saved in the local example. No request was sent.'); }}>
      <FlowSection id={`${id}-general`} title="General" description="Identity and default review behavior for this workspace.">
        <Field label="Workspace name" htmlFor={`${id}-name`}><Input name="name" required maxLength={100} value={name} disabled={busy} readOnly={readOnly} onChange={event => { setName(event.target.value); setMessage(''); }} /></Field>
        <div className="t98-form-grid">
          <Field label="Time zone" htmlFor={`${id}-timezone`}><Select name="timezone" value={timezone} disabled={locked} onChange={event => { setTimezone(event.target.value); setMessage(''); }}><option value="Asia/Dubai">Dubai (Asia/Dubai)</option><option value="Europe/London">London (Europe/London)</option><option value="America/New_York">New York (America/New_York)</option></Select></Field>
          <Field label="Review preference" htmlFor={`${id}-approval`}><Select name="approval" value={approval} disabled={locked} onChange={event => { setApproval(event.target.value); setMessage(''); }}><option value="required">Request review before publishing</option><option value="optional">Review is optional</option></Select></Field>
        </div>
        <p>The application enforces permissions and publishing requirements.</p>
      </FlowSection>
      <FlowSection id={`${id}-notifications`} title="Notifications" description="Choose which workspace updates you receive.">
        <Checkbox name="reviewUpdates" label="Send review updates" checked={updates} disabled={locked} onChange={event => { setUpdates(event.target.checked); setMessage(''); }} />
        <Checkbox name="weeklyDigest" label="Send a weekly activity summary" checked={digest} disabled={locked} onChange={event => { setDigest(event.target.checked); setMessage(''); }} />
      </FlowSection>
      <div className="t98-form-actions"><Button type="submit" disabled={readOnly} loading={busy}>Save workspace settings</Button><p>Saves this local example only.</p></div>
    </form>
  </SettingsTemplate>;
}
