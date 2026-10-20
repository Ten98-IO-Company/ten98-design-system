import { publicCode, type ComponentEntry, type ComponentProp } from './model.js';
import { TemplateDemo, type TemplateKind as Kind, type TemplateMode as Mode } from './TemplateDemo.js';
import demoSource from './TemplateDemo.tsx?raw';

const prop = (name: string, type: string, description: string, required = false): ComponentProp => ({ name, type, description, required });
const baseProps = [
  prop('title', 'string', 'The page’s only h1, rendered by PageHeader.', true),
  prop('description', 'string', 'Short explanation below the page title.'),
  prop('actions', 'ReactNode', 'Page actions. Keep one primary action and name its scope.'),
  prop('scope', 'ReactNode', 'Visible workspace, account or resource context; supply it whenever the content is scoped.'),
  prop('children', 'ReactNode', 'Multiple feature-sized FlowSection compositions. The app supplies any form and its handlers; sections begin at h2.', true),
];
const tokens = ['--t98-font', '--t98-text', '--t98-muted', '--t98-border', '--t98-surface', '--t98-subtle', '--t98-radius', '--t98-space-3', '--t98-space-4', '--t98-space-6', '--t98-content-max', '--t98-form-max'];
const modeDescriptions: Record<Mode, [string, string]> = {
  default: ['Default', 'A complete page combines several feature sections. Controls use local example data; no service or persistence is connected.'],
  empty: ['Empty', 'Keep context and controls visible while explaining missing content.'],
  loading: ['Loading', 'The app marks the page busy, retains content and disables conflicting changes.'],
  readonly: ['Read-only', 'Retain content and explain why mutation controls are unavailable.'],
  error: ['Error', 'Keep the current content and show an app-owned error with a recovery path.'],
  saving: ['Saving', 'Retain draft values and show a pending submit action. The app owns the request lifecycle.'],
  'long-scope': ['Long scope', 'Long workspace names wrap in their fixed scope slot without changing the hierarchy.'],
};

function demoCode(kind: Kind, mode: Mode = 'default') {
  return publicCode(demoSource) + '\nexport default function Example() {\n  return <TemplateDemo kind=' + JSON.stringify(kind) + ' mode=' + JSON.stringify(mode) + ' />;\n}\n';
}

const definitions: { name: Kind; description: string; usage: string; props: ComponentProp[]; modes: Mode[] }[] = [
  { name: 'OverviewTemplate', description: 'A complete workspace overview combining metrics, a publishing queue and recent activity.',
    usage: 'Choose for a cross-record summary page. Fixed order: header → scope → filters → metrics → feature sections. Use MetricCard in metrics and FlowSection for separate queue and activity features. Keep one page title and page actions at the template level. Put record search and bulk actions on CollectionTemplate. Keep errors and empty states inside their affected feature without removing context or filters.',
    props: [prop('filters', 'ReactNode', 'App-controlled reporting period and summary filters.'), prop('metrics', 'ReactNode', 'A short row of MetricCard components; keep their order stable.')], modes: ['default', 'empty', 'loading', 'error', 'long-scope'] },
  { name: 'CollectionTemplate', description: 'A complete record browser combining filters, selection review and a searchable campaign table.',
    usage: 'Choose for a page that finds and acts on many records. Fixed order: header → scope → toolbar → selection → results → optional pagination. Compose selection review and results as distinct FlowSection features. Keep filters visible when results are empty. DataTable supplies its own search, selection and pagination in this example; omit duplicate controls from the template slots. Apps own server queries and bulk-action authorization.',
    props: [prop('toolbar', 'ReactNode', 'Search, filters and view controls owned by the app.'), prop('selection', 'ReactNode', 'Selection count and permitted bulk actions, directly above results.'), prop('pagination', 'ReactNode', 'Optional app-controlled pagination; omit when the content owns pagination.')], modes: ['default', 'empty', 'loading', 'readonly', 'error', 'long-scope'] },
  { name: 'DetailTemplate', description: 'A complete campaign detail page combining summary, destinations, media, activity and owner context.',
    usage: 'Choose for inspecting one record across related features. Fixed order: breadcrumb → header → scope → status → navigation → feature sections → aside. Use FlowSection for summary, destinations/media and activity, with a labelled navigation and actual section destinations. The owner/context aside follows primary content in reading order and stacks below it on narrow screens. Use EditorTemplate for substantial edits.',
    props: [prop('breadcrumb', 'ReactNode', 'Breadcrumb component with app-provided destinations.'), prop('status', 'ReactNode', 'Record lifecycle or eligibility; do not imply readiness from layout alone.'), prop('navigation', 'ReactNode', 'A labelled record-section navigation element.'), prop('aside', 'ReactNode', 'Optional related information; provide its content, not another aside landmark.')], modes: ['default', 'empty', 'loading', 'readonly', 'error', 'long-scope'] },
  { name: 'EditorTemplate', description: 'A complete editing page combining draft content, accounts, media, a live preview and readiness checks.',
    usage: 'Choose for creating or editing one item across several feature sections. Fixed order: breadcrumb → header → scope → optional steps → feedback → form sections → preview → footer. Supply one form containing FlowSection groups for content, accounts and media. Put the approximate preview and readiness information in the preview slot. Use one footer save location and associate its submit button with the form id. Add Stepper only for a genuinely staged editor. Preserve native constraints, draft values and pending/error feedback; the app owns save and provider validation.',
    props: [prop('breadcrumb', 'ReactNode', 'Breadcrumb component above the page heading.'), prop('steps', 'ReactNode', 'Optional Stepper for a genuinely staged editor.'), prop('feedback', 'ReactNode', 'App-owned validation, error, read-only or saving feedback before the form.'), prop('preview', 'ReactNode', 'Optional preview content; follows the form in reading order.'), prop('footer', 'ReactNode', 'App-owned save and cancel controls. Associate submit controls with the supplied form id.')], modes: ['default', 'empty', 'loading', 'readonly', 'error', 'saving', 'long-scope'] },
  { name: 'SettingsTemplate', description: 'A complete configuration page combining identity, time zone, review preferences and notifications.',
    usage: 'Choose for workspace or account configuration. Fixed order: header → scope → section navigation → feedback → form sections. Use labelled section navigation and FlowSection groups for General and Notifications. Related settings share one form and one save action; separate forms only when their scopes or save lifecycles differ. Keep current values visible while saving or recovering. The app owns persistence, policy enforcement and authorization.',
    props: [prop('navigation', 'ReactNode', 'Labelled settings navigation, before the form on narrow screens.'), prop('feedback', 'ReactNode', 'App-owned validation, permission, error or saving feedback before settings content.')], modes: ['default', 'loading', 'readonly', 'error', 'saving', 'long-scope'] },
];

export const templateEntries: ComponentEntry[] = definitions.map(definition => ({
  name: definition.name, category: 'Layout', description: definition.description, usage: definition.usage,
  props: [...baseProps, ...definition.props], nativeProps: 'Standard section attributes, including id, className, aria-busy and aria-describedby. App-supplied slot contents retain their native semantics and handlers.', tokens,
  accessibility: [
    'Use one full page template within AppShell or the app’s existing main landmark. The template owns one PageHeader h1; compose multiple smaller FlowSection features beneath it, beginning at h2.',
    'DOM order is the documented slot order. Preserve that order visually and on narrow screens; do not reorder slots with CSS.',
    'Slots retain app-provided labels, keyboard behavior, disabled/read-only states and live feedback. Name each navigation and supply real destinations.',
    'Use aria-busy on the template during app-owned requests. Keep draft values and explicit error text visible; the layout does not infer request success or permissions.',
  ],
  related: ['AppShell', 'FlowSection', 'PageHeader', ...definitions.filter(item => item.name !== definition.name).map(item => item.name)],
  example: demoCode(definition.name),
  states: definition.modes.map(mode => ({ name: modeDescriptions[mode][0], description: modeDescriptions[mode][1], preview: <TemplateDemo kind={definition.name} mode={mode} />, code: demoCode(definition.name, mode) })),
}));
