import { useId, useState } from 'react';
import { Alert, Field, Select, Tabs } from '../lib';
import { componentEntries } from './entries';
import { routeHref } from './navigation';
import { Code } from './Code';
import { previewLink } from './AdapterPreview';

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
  ['4. Feature flows', 'Compose controls and patterns into one small feature section: check availability, review recipients or inspect a keyword result. Keep its actions beside their inputs and its state within that section.', ['FlowSection', 'Flows']],
  ['5. Full page templates', 'Arrange several feature sections into one familiar page. The template owns its single page title, scope, columns and page actions. The app supplies routes, data, permissions, drafts and authoritative results.', choices.map(item => item[0])],
] as const;
const rules = [
  ['Scope before action', 'Keep workspace, project, resource and applied time range visible before consequential actions. Draft controls must not relabel retained results.'],
  ['One page title', 'The app shell owns navigation and the main landmark. A template owns one PageHeader. Put the task’s main action in its established header or editor footer.'],
  ['Spacing has one owner', 'Use 8px for tightly related items, 12px between actions, 16px between fields and card contents, and 24px between feature sections. Use shared token classes; do not add child margins on top of a parent gap.'],
  ['Feature section or page', 'A flow belongs to one feature and starts at h2. A full template combines multiple feature sections beneath one h1. Do not place a page template inside a flow or add a Card around every section.'],
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
  const choiceId = useId();
  const entry = componentEntries.find(item => item.name === selected)!;
  const [, job, use, order] = choices.find(([name]) => name === selected)!;
  return <><header className="reference-page-heading"><div><p className="reference-eyebrow">Layout and usage standards</p><h1>Full pages built from familiar feature sections.</h1><p>Five complete page layouts combine smaller feature flows and shared components. Keep scope, spacing and action placement consistent across every ten98 app.</p></div></header><Tabs value={tab} onValueChange={setTab} label="Layout and usage standards" items={[
    { value: 'layouts', label: 'Fixed templates', content: <><div className="reference-template-picker"><Field label="Page template" htmlFor={choiceId}><Select value={selected} onChange={event => setSelected(event.target.value)}>{choices.map(([name, task]) => <option key={name} value={name}>{name.replace('Template', '')} — {task}</option>)}</Select></Field><div className="reference-template-context"><strong>{job}</strong><p>{use}</p><p className="reference-template-order">{order}</p></div></div><section className="reference-section"><h2>{selected}</h2><div className="reference-preview" onClickCapture={previewLink}>{entry.states[0].preview}</div><Code value={entry.example}/><a className="reference-link" href={routeHref('Components', { component: selected })}>Props, states, tokens and accessibility for {selected}</a></section><Alert title="Keep the shell stable">Compose one template inside AppShell. Keep application controllers and forms in its slots. Templates do not create nested forms, run requests or decide when a change is saved.</Alert></> },
    { value: 'hierarchy', label: 'Component hierarchy', content: <ol className="reference-hierarchy">{layers.map(([title, description, names]) => <li key={title}><h2>{title}</h2><p>{description}</p><div className="reference-related">{names.map(name => <a key={name} href={name === 'Design tokens' || name === 'Flows' ? routeHref(name) : routeHref('Components', { component: name })}>{name}</a>)}</div></li>)}</ol> },
    { value: 'rules', label: 'Behavior and usage', content: <div className="reference-guide-grid">{rules.map(([title, body]) => <section className="reference-note" key={title}><h2>{title}</h2><p>{body}</p></section>)}</div> },
  ]}/><div className="reference-note"><p><a href="https://github.com/Ten98-IO-Company/ten98-design-system/blob/main/docs/reviews/2026-10-19/visual-templates.md" target="_blank" rel="noreferrer">Captured template comparisons and critique</a> compare official published product UI with local synthetic specimens. The report labels capture scope and evidence gaps.</p></div></>;
}
