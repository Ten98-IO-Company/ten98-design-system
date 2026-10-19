'use client';

import { useId, useState } from 'react';
import { CollectionTemplate, DetailTemplate, EditorTemplate, OverviewTemplate, SettingsTemplate, EmptyState, MetricCard, Stepper, Alert, Badge, Breadcrumb, Button, Card, Checkbox, Field, Input, Select } from '../lib';

export type TemplateKind = 'OverviewTemplate' | 'CollectionTemplate' | 'DetailTemplate' | 'EditorTemplate' | 'SettingsTemplate';
export type TemplateMode = 'default' | 'empty' | 'loading' | 'readonly' | 'error' | 'saving' | 'long-scope';
const longScope = 'International studio group / Middle East and North Africa / Regional creative operations / Autumn launch workspace with an intentionally long account name';

export function TemplateDemo({ kind, mode = 'default' }: { kind: TemplateKind; mode?: TemplateMode }) {
  const id = useId();
  const [period, setPeriod] = useState('week');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(false);
  const [name, setName] = useState(mode === 'empty' ? '' : 'Studio launch');
  const [updates, setUpdates] = useState(true);
  const [message, setMessage] = useState('');
  const busy = mode === 'loading' || mode === 'saving';
  const readOnly = mode === 'readonly';
  const locked = busy || readOnly;
  const scope = <p><strong>Workspace:</strong> {mode === 'long-scope' ? longScope : 'Studio / Main account'}</p>;
  const feedback = message ? <Alert title={message} /> : mode === 'error' ? <Alert tone="danger" title="The last request failed">Your current values are retained. Review them and try the local action again.</Alert> : readOnly ? <Alert title="Read-only access">An editor can make changes in this workspace.</Alert> : busy ? <p role="status">{mode === 'saving' ? 'Saving the local draft…' : 'Loading; the last available content is shown.'}</p> : <p>Local demonstration data.</p>;
  const action = <Button disabled={locked} onClick={() => setMessage('The local example was refreshed. No request was sent.')}>Refresh example</Button>;
  const breadcrumb = <Breadcrumb items={[{ label: 'Campaigns' }, { label: 'Studio launch' }]} />;
  const empty = <EmptyState title="No content yet" description="Add a name to create content in this local example." action={<Button disabled={locked} onClick={() => setName('New local draft')}>Add example content</Button>} />;
  if (kind === 'OverviewTemplate') return <OverviewTemplate title="Overview" description="Review the workspace before opening a record." actions={action} scope={scope} aria-busy={busy || undefined}
    filters={<Field label="Reporting period" htmlFor={`${id}-period`}><Select value={period} disabled={locked} onChange={event => setPeriod(event.target.value)}><option value="week">This week</option><option value="month">This month</option></Select></Field>}
    metrics={<><MetricCard label="Drafts" value={name ? period === 'week' ? 3 : 12 : '—'} /><MetricCard label="Ready for review" value={name ? period === 'week' ? 1 : 4 : '—'} /></>}>
    {feedback}{name ? <Card><h2>Workspace activity</h2><p>{period === 'week' ? 'Three drafts were edited this week.' : 'Twelve drafts were edited this month.'}</p></Card> : empty}
  </OverviewTemplate>;
  if (kind === 'CollectionTemplate') {
    const rows = (name ? [name, 'Autumn update'] : []).filter(row => row.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    return <CollectionTemplate title="Campaigns" description="Find and select work in this workspace." actions={action} scope={scope} aria-busy={busy || undefined}
      toolbar={<Field label="Search campaigns" htmlFor={`${id}-search`}><Input type="search" value={query} disabled={busy} onChange={event => setQuery(event.target.value)} /></Field>}
      selection={<><Checkbox label="Select matching campaigns" checked={selected} disabled={locked || !rows.length} onChange={event => setSelected(event.target.checked)} /><p role="status">{selected ? rows.length : 0} matching campaigns selected</p></>}>
      {feedback}{rows.length ? <Card><h2>Campaigns in this workspace</h2><ul>{rows.map(row => <li key={row}>{row}</li>)}</ul></Card> : <EmptyState title="No matching campaigns" description="Clear the search or add local example content." action={<Button variant="secondary" disabled={locked} onClick={() => { setQuery(''); setName('New local draft'); }}>Reset example</Button>} />}
    </CollectionTemplate>;
  }
  if (kind === 'DetailTemplate') return <DetailTemplate title={name || 'Untitled campaign'} description="Inspect one record and its related context." actions={action} breadcrumb={breadcrumb} scope={scope} status={<Badge>Draft</Badge>} aria-busy={busy || undefined}
    navigation={<nav aria-label="Campaign sections"><a href={`#${id}-summary`}>Summary</a> <a href={`#${id}-activity`}>Activity</a></nav>}
    aside={<Card title="Record context"><p>Owner: Studio team</p><p>Destination: Main account</p></Card>}>
    {feedback}<section id={`${id}-summary`}><h2>Summary</h2>{name ? <p>{name} is a draft for the studio’s main account.</p> : empty}</section><section id={`${id}-activity`}><h2>Activity</h2><p>No delivery has been requested.</p></section>
  </DetailTemplate>;
  const form = <form id={`${id}-form`} onSubmit={event => { event.preventDefault(); setMessage('Values saved in the local example. No request was sent.'); }}>
    <section id={`${id}-general`}><h2>{kind === 'EditorTemplate' ? 'Draft content' : 'General'}</h2><Field label={kind === 'EditorTemplate' ? 'Campaign name' : 'Workspace name'} htmlFor={`${id}-name`}><Input name="name" required value={name} disabled={busy} readOnly={readOnly} onChange={event => setName(event.target.value)} /></Field></section>
    {kind === 'SettingsTemplate' && <section id={`${id}-notifications`}><h2>Notifications</h2><Checkbox label="Send review updates" checked={updates} disabled={locked} onChange={event => setUpdates(event.target.checked)} /></section>}
    {kind === 'SettingsTemplate' && <Button type="submit" disabled={readOnly} loading={busy}>Save workspace settings</Button>}
  </form>;
  if (kind === 'EditorTemplate') return <EditorTemplate title="Edit campaign" description="Compose, inspect the preview and save the draft." breadcrumb={breadcrumb} scope={scope} aria-busy={busy || undefined}
    steps={<Stepper steps={['Content', 'Review']} current={0} />} feedback={feedback} preview={<Card title="Draft preview"><p>{name || 'Add a campaign name to see it here.'}</p><p>Approximate local preview.</p></Card>}
    footer={<Button type="submit" form={`${id}-form`} disabled={readOnly} loading={busy}>Save draft</Button>}>{form}</EditorTemplate>;
  return <SettingsTemplate title="Workspace settings" description="Keep account configuration separate from daily work." scope={scope} aria-busy={busy || undefined}
    navigation={<nav aria-label="Settings sections"><p><a href={`#${id}-general`}>General</a></p><p><a href={`#${id}-notifications`}>Notifications</a></p></nav>} feedback={feedback}>{form}</SettingsTemplate>;
}
