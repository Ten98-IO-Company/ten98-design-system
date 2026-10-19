import { useState } from 'react';
import { Alert, Tabs } from '../lib';
import { componentEntries } from './entries';
import { routeHref } from './navigation';
import { Code } from './Code';

const choices = [
  ['OverviewTemplate', 'Understand a scope', 'Analytics overview, campaign performance, operations health', 'Scope → filters → metrics → results'],
  ['CollectionTemplate', 'Find and act on records', 'Campaigns, assets, keywords, servers, queues', 'Scope → toolbar → selection → results → pagination'],
  ['DetailTemplate', 'Inspect one resource', 'Campaign, source answer, property, incident, call', 'Breadcrumb → scope → status → tabs → content + related information'],
  ['EditorTemplate', 'Create or change a draft', 'Post composer, query setup, report configuration', 'Scope → steps → feedback → form + preview → save actions'],
  ['SettingsTemplate', 'Configure one scope', 'Workspace, project, connection and device settings', 'Scope → settings navigation → feedback → grouped fields'],
];
const layers = [
  ['1. Design tokens', 'Use semantic roles for color, spacing, type, motion and density. Change the canonical role instead of copying values into a screen.', ['Design tokens']],
  ['2. Native controls', 'Choose one control for one action or input. Use visible labels, native validation and explicit controlled state where the app requires it.', ['Button', 'Field', 'Input', 'Select', 'Textarea', 'Checkbox']],
  ['3. Shared patterns', 'Compose a known task or state: applied scope, data quality, review, receipts, inspection and recovery.', ['AppliedFilters', 'EvidenceSummary', 'ReviewSummary', 'OperationResults', 'DetailWorkspace']],
  ['4. Fixed page templates', 'Pick the template by the user’s task. Keep its slot order, title position and action placement consistent.', choices.map(item => item[0])],
  ['5. Application flows', 'The app supplies routes, data, permissions, drafts, calculations and authoritative results. Connect typed callbacks; preserve the agreed flow.', ['Flows']],
] as const;
const rules = [
  ['Scope before action', 'Keep workspace, project, resource and applied time range visible before consequential actions. Draft controls must not relabel retained results.'],
  ['One page title', 'The app shell owns navigation and the main landmark. A template owns one PageHeader. Put the task’s main action in its established header or editor footer.'],
  ['Stable actions', 'Use links to navigate and buttons to act. Save/Publish remain explicit. Disable duplicate pending mutations, retain drafts and keep uncertain outcomes visible.'],
  ['State has meaning', 'Measured zero, unavailable, empty, filtered empty, partial, stale and unknown are different. Success requires actual confirmation of the labelled outcome.'],
  ['Progressive evidence', 'Keep source/time and essential partial/stale warnings beside results. Use compact evidence in report headers; move detailed definitions into a labelled disclosure.'],
  ['Read-only still permits inspection', 'Preserve readable records and navigation. Explain unavailable edit actions. The app continues to enforce permissions at the server.'],
  ['Keyboard and narrow screens', 'Retain labelled move/select/back controls, focus recovery and mounted drafts. Use list/detail on narrow screens, contained table scrolling and no visible sidebar scrollbar.'],
  ['Challenge before adoption', 'Preserve working contracts while comparing interaction choices to references. Verify failure/recovery and draft behavior; do not copy app defects or competitor policies.'],
];

export function TemplateGuide() {
  const [tab, setTab] = useState('layouts');
  const [selected, setSelected] = useState('OverviewTemplate');
  const entry = componentEntries.find(item => item.name === selected)!;
  return <><header className="reference-page-heading"><div><p className="reference-eyebrow">Layout and usage standards</p><h1>Choose the task. Keep the familiar layout.</h1><p>Five fixed page structures, one component hierarchy and shared behavior rules across every ten98 app.</p></div></header><Tabs value={tab} onValueChange={setTab} label="Layout and usage standards" items={[
    { value: 'layouts', label: 'Fixed templates', content: <><div className="reference-guide-grid">{choices.map(([name, job, use, order]) => <button type="button" className="reference-template-choice" aria-pressed={selected === name} key={name} onClick={() => setSelected(name)}><strong>{name}</strong><span>{job}</span><small>{use}</small><code>{order}</code></button>)}</div><section className="reference-section"><h2>{selected}</h2><p>{entry.description}</p><div className="reference-preview">{entry.states[0].preview}</div><Code value={entry.example}/><a className="reference-link" href={routeHref('Components', { component: selected })}>Props, states, tokens and accessibility for {selected}</a></section><Alert title="Keep the shell stable">Compose one template inside AppShell. Keep application controllers and forms in its slots. Templates do not create nested forms, run requests or decide when a change is saved.</Alert></> },
    { value: 'hierarchy', label: 'Component hierarchy', content: <ol className="reference-hierarchy">{layers.map(([title, description, names]) => <li key={title}><h2>{title}</h2><p>{description}</p><div className="reference-related">{names.map(name => <a key={name} href={name === 'Design tokens' || name === 'Flows' ? routeHref(name) : routeHref('Components', { component: name })}>{name}</a>)}</div></li>)}</ol> },
    { value: 'rules', label: 'Behavior and usage', content: <div className="reference-guide-grid">{rules.map(([title, body]) => <section className="reference-note" key={title}><h2>{title}</h2><p>{body}</p></section>)}</div> },
  ]}/></>;
}
