import { useId, useState } from 'react';
import { CollectionTemplate, DetailTemplate, EditorTemplate, OverviewTemplate, SettingsTemplate } from '../lib/templates.js';
import { EmptyState, MetricCard, Stepper } from '../lib/patterns.js';
import { Alert, Badge, Breadcrumb, Button, Card, Checkbox, Field, Input, Select } from '../lib/primitives.js';
import { tsx, type ComponentEntry, type ComponentProp } from './model.js';

type Kind = 'OverviewTemplate' | 'CollectionTemplate' | 'DetailTemplate' | 'EditorTemplate' | 'SettingsTemplate';
type Mode = 'default' | 'empty' | 'loading' | 'readonly' | 'error' | 'saving' | 'long-scope';
const longScope = 'International studio group / Middle East and North Africa / Regional creative operations / Autumn launch workspace with an intentionally long account name';
const prop = (name: string, type: string, description: string, required = false): ComponentProp => ({ name, type, description, required });
const baseProps = [
  prop('title', 'string', 'The page’s only h1, rendered by PageHeader.', true),
  prop('description', 'string', 'Short explanation below the page title.'),
  prop('actions', 'ReactNode', 'Page actions. Keep one primary action and name its scope.'),
  prop('scope', 'ReactNode', 'Visible workspace, account or resource context; supply it whenever the content is scoped.'),
  prop('children', 'ReactNode', 'App-owned content. Start content sections at h2; supply any form and its handlers here.', true),
];
const tokens = ['--t98-font', '--t98-text', '--t98-muted', '--t98-border', '--t98-surface', '--t98-subtle', '--t98-radius', '--t98-space-3', '--t98-space-4', '--t98-space-6', '--t98-content-max', '--t98-form-max'];
const modeDescriptions: Record<Mode, [string, string]> = {
  default: ['Default', 'Local controls demonstrate the fixed slots. No service or persistence is connected.'],
  empty: ['Empty', 'Keep context and controls visible while explaining missing content.'],
  loading: ['Loading', 'The app marks the page busy, retains content and disables conflicting changes.'],
  readonly: ['Read-only', 'Retain content and explain why mutation controls are unavailable.'],
  error: ['Error', 'Keep the current content and show an app-owned error with a recovery path.'],
  saving: ['Saving', 'Retain draft values and show a pending submit action. The app owns the request lifecycle.'],
  'long-scope': ['Long scope', 'Long workspace names wrap in their fixed scope slot without changing the hierarchy.'],
};

function TemplateDemo({ kind, mode = 'default' }: { kind: Kind; mode?: Mode }) {
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

function demoCode(kind: Kind, mode: Mode = 'default') {
  const busy = mode === 'loading' || mode === 'saving';
  const feedback = mode === 'error' ? '<Alert tone="danger" title="The last request failed">Your current values are retained. Review them and try the local action again.</Alert>' : mode === 'readonly' ? '<Alert title="Read-only access">An editor can make changes in this workspace.</Alert>' : busy ? `<p role="status">${mode === 'saving' ? 'Saving the local draft…' : 'Loading; the last available content is shown.'}</p>` : '<p>Local demonstration data.</p>';
  const setup = `const id = useId();
const [period, setPeriod] = useState('week');
const [query, setQuery] = useState('');
const [selected, setSelected] = useState(false);
const [name, setName] = useState(${JSON.stringify(mode === 'empty' ? '' : 'Studio launch')});
const [updates, setUpdates] = useState(true);
const [message, setMessage] = useState('');
const busy = ${busy};
const readOnly = ${mode === 'readonly'};
const locked = busy || readOnly;
const scope = <p><strong>Workspace:</strong> ${mode === 'long-scope' ? longScope : 'Studio / Main account'}</p>;
const feedback = message ? <Alert title={message} /> : ${feedback};
const action = <Button disabled={locked} onClick={() => setMessage('The local example was refreshed. No request was sent.')}>Refresh example</Button>;
const breadcrumb = <Breadcrumb items={[{ label: 'Campaigns' }, { label: 'Studio launch' }]} />;
const empty = <EmptyState title="No content yet" description="Add a name to create content in this local example." action={<Button disabled={locked} onClick={() => setName('New local draft')}>Add example content</Button>} />;`;
  let jsx: string;
  if (kind === 'OverviewTemplate') jsx = `<OverviewTemplate title="Overview" description="Review the workspace before opening a record." actions={action} scope={scope} aria-busy={busy || undefined}
  filters={<Field label="Reporting period" htmlFor={id + '-period'}><Select value={period} disabled={locked} onChange={event => setPeriod(event.target.value)}><option value="week">This week</option><option value="month">This month</option></Select></Field>}
  metrics={<><MetricCard label="Drafts" value={name ? period === 'week' ? 3 : 12 : '—'} /><MetricCard label="Ready for review" value={name ? period === 'week' ? 1 : 4 : '—'} /></>}>
  {feedback}{name ? <Card><h2>Workspace activity</h2><p>{period === 'week' ? 'Three drafts were edited this week.' : 'Twelve drafts were edited this month.'}</p></Card> : empty}
</OverviewTemplate>`;
  else if (kind === 'CollectionTemplate') jsx = `<CollectionTemplate title="Campaigns" description="Find and select work in this workspace." actions={action} scope={scope} aria-busy={busy || undefined}
  toolbar={<Field label="Search campaigns" htmlFor={id + '-search'}><Input type="search" value={query} disabled={busy} onChange={event => setQuery(event.target.value)} /></Field>}
  selection={<><Checkbox label="Select matching campaigns" checked={selected} disabled={locked || !rows.length} onChange={event => setSelected(event.target.checked)} /><p role="status">{selected ? rows.length : 0} matching campaigns selected</p></>}>
  {feedback}{rows.length ? <Card><h2>Campaigns in this workspace</h2><ul>{rows.map(row => <li key={row}>{row}</li>)}</ul></Card> : <EmptyState title="No matching campaigns" description="Clear the search or add local example content." action={<Button variant="secondary" disabled={locked} onClick={() => { setQuery(''); setName('New local draft'); }}>Reset example</Button>} />}
</CollectionTemplate>`;
  else if (kind === 'DetailTemplate') jsx = `<DetailTemplate title={name || 'Untitled campaign'} description="Inspect one record and its related context." actions={action} breadcrumb={breadcrumb} scope={scope} status={<Badge>Draft</Badge>} aria-busy={busy || undefined}
  navigation={<nav aria-label="Campaign sections"><a href={'#' + id + '-summary'}>Summary</a> <a href={'#' + id + '-activity'}>Activity</a></nav>}
  aside={<Card title="Record context"><p>Owner: Studio team</p><p>Destination: Main account</p></Card>}>
  {feedback}<section id={id + '-summary'}><h2>Summary</h2>{name ? <p>{name} is a draft for the studio’s main account.</p> : empty}</section>
  <section id={id + '-activity'}><h2>Activity</h2><p>No delivery has been requested.</p></section>
</DetailTemplate>`;
  else {
    const form = `<form id={id + '-form'} onSubmit={event => { event.preventDefault(); setMessage('Values saved in the local example. No request was sent.'); }}>
  <section id={id + '-general'}><h2>${kind === 'EditorTemplate' ? 'Draft content' : 'General'}</h2>
    <Field label="${kind === 'EditorTemplate' ? 'Campaign name' : 'Workspace name'}" htmlFor={id + '-name'}><Input name="name" required value={name} disabled={busy} readOnly={readOnly} onChange={event => setName(event.target.value)} /></Field>
  </section>${kind === 'SettingsTemplate' ? `
  <section id={id + '-notifications'}><h2>Notifications</h2><Checkbox label="Send review updates" checked={updates} disabled={locked} onChange={event => setUpdates(event.target.checked)} /></section>
  <Button type="submit" disabled={readOnly} loading={busy}>Save workspace settings</Button>` : ''}
</form>`;
    jsx = kind === 'EditorTemplate' ? `<EditorTemplate title="Edit campaign" description="Compose, inspect the preview and save the draft." breadcrumb={breadcrumb} scope={scope} aria-busy={busy || undefined}
  steps={<Stepper steps={['Content', 'Review']} current={0} />} feedback={feedback}
  preview={<Card title="Draft preview"><p>{name || 'Add a campaign name to see it here.'}</p><p>Approximate local preview.</p></Card>}
  footer={<Button type="submit" form={id + '-form'} disabled={readOnly} loading={busy}>Save draft</Button>}>
  ${form}
</EditorTemplate>` : `<SettingsTemplate title="Workspace settings" description="Keep account configuration separate from daily work." scope={scope} aria-busy={busy || undefined}
  navigation={<nav aria-label="Settings sections"><p><a href={'#' + id + '-general'}>General</a></p><p><a href={'#' + id + '-notifications'}>Notifications</a></p></nav>} feedback={feedback}>
  ${form}
</SettingsTemplate>`;
  }
  return tsx([kind, 'Alert', 'Badge', 'Breadcrumb', 'Button', 'Card', 'Checkbox', 'EmptyState', 'Field', 'Input', 'MetricCard', 'Select', 'Stepper'], jsx, setup + (kind === 'CollectionTemplate' ? "\nconst rows = (name ? [name, 'Autumn update'] : []).filter(row => row.toLocaleLowerCase().includes(query.toLocaleLowerCase()));" : ''), ['useId', 'useState']);
}

const definitions: { name: Kind; description: string; usage: string; props: ComponentProp[]; modes: Mode[] }[] = [
  { name: 'OverviewTemplate', description: 'The fixed workspace summary: context, filters, key metrics, then activity.',
    usage: 'Choose for a cross-record summary. Fixed order: header → scope → filters → metrics → content. Use MetricCard in metrics and h2 sections in content. Put record search and bulk actions on CollectionTemplate instead. Keep errors and empty states in content without removing scope or filters.',
    props: [prop('filters', 'ReactNode', 'App-controlled reporting period and summary filters.'), prop('metrics', 'ReactNode', 'A short row of MetricCard components; keep their order stable.')], modes: ['default', 'empty', 'loading', 'error', 'long-scope'] },
  { name: 'CollectionTemplate', description: 'The fixed record browser: context, search, selection, results and optional pagination.',
    usage: 'Choose for finding and acting on many records. Fixed order: header → scope → toolbar → selection → content → pagination. Keep the toolbar in place when results are empty. The app owns query, selection and pagination. Omit pagination when the supplied DataTable already renders it; avoid duplicate table search controls.',
    props: [prop('toolbar', 'ReactNode', 'Search, filters and view controls owned by the app.'), prop('selection', 'ReactNode', 'Selection count and permitted bulk actions, directly above results.'), prop('pagination', 'ReactNode', 'Optional app-controlled pagination; omit when the content owns pagination.')], modes: ['default', 'empty', 'loading', 'readonly', 'error', 'long-scope'] },
  { name: 'DetailTemplate', description: 'The fixed single-record view: identity and status before sections and related information.',
    usage: 'Choose for inspecting one record. Fixed order: breadcrumb → header → scope → status → navigation → content → aside. Supply a labelled navigation element and actual destinations. The optional aside follows primary content in reading order and stacks after it on narrow screens. Use EditorTemplate for substantial edits.',
    props: [prop('breadcrumb', 'ReactNode', 'Breadcrumb component with app-provided destinations.'), prop('status', 'ReactNode', 'Record lifecycle or eligibility; do not imply readiness from layout alone.'), prop('navigation', 'ReactNode', 'A labelled record-section navigation element.'), prop('aside', 'ReactNode', 'Optional related information; provide its content, not another aside landmark.')], modes: ['default', 'empty', 'loading', 'readonly', 'error', 'long-scope'] },
  { name: 'EditorTemplate', description: 'The fixed editing workspace: steps and feedback, app form, preview, then save controls.',
    usage: 'Choose for creating or editing one item. Fixed order: breadcrumb → header → scope → steps → feedback → content → preview → footer. Supply the form as children. Connect footer submit buttons to that form with the native form attribute. The template never creates a form, sends a request or owns a save action. Use one save location in the footer, keep values during errors and pair pending controls with app-owned feedback.',
    props: [prop('breadcrumb', 'ReactNode', 'Breadcrumb component above the page heading.'), prop('steps', 'ReactNode', 'Optional Stepper for a genuinely staged editor.'), prop('feedback', 'ReactNode', 'App-owned validation, error, read-only or saving feedback before the form.'), prop('preview', 'ReactNode', 'Optional preview content; follows the form in reading order.'), prop('footer', 'ReactNode', 'App-owned save and cancel controls. Associate submit controls with the supplied form id.')], modes: ['default', 'empty', 'loading', 'readonly', 'error', 'saving', 'long-scope'] },
  { name: 'SettingsTemplate', description: 'The fixed configuration page: scope, section navigation, feedback and settings forms.',
    usage: 'Choose for persistent workspace or account configuration. Fixed order: header → scope → section navigation → feedback → content. Supply a labelled navigation element and h2-led settings sections. The app owns each form, its save controls and authorization. Keep current values visible while saving or recovering from a failed request.',
    props: [prop('navigation', 'ReactNode', 'Labelled settings navigation, before the form on narrow screens.'), prop('feedback', 'ReactNode', 'App-owned validation, permission, error or saving feedback before settings content.')], modes: ['default', 'loading', 'readonly', 'error', 'saving', 'long-scope'] },
];

export const templateEntries: ComponentEntry[] = definitions.map(definition => ({
  name: definition.name, category: 'Layout', description: definition.description, usage: definition.usage,
  props: [...baseProps, ...definition.props], nativeProps: 'Standard section attributes, including id, className, aria-busy and aria-describedby. App-supplied slot contents retain their native semantics and handlers.', tokens,
  accessibility: [
    'Use one template within AppShell or the app’s existing main landmark. The template renders a labelled section and one PageHeader h1; begin content sections at h2.',
    'DOM order is the documented slot order. Preserve that order visually and on narrow screens; do not reorder slots with CSS.',
    'Slots retain app-provided labels, keyboard behavior, disabled/read-only states and live feedback. Name each navigation and supply real destinations.',
    'Use aria-busy on the template during app-owned requests. Keep draft values and explicit error text visible; the layout does not infer request success or permissions.',
  ],
  related: ['AppShell', 'PageHeader', ...definitions.filter(item => item.name !== definition.name).map(item => item.name)],
  example: demoCode(definition.name),
  states: definition.modes.map(mode => ({ name: modeDescriptions[mode][0], description: modeDescriptions[mode][1], preview: <TemplateDemo kind={definition.name} mode={mode} />, code: demoCode(definition.name, mode) })),
}));
