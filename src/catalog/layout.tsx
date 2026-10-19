import { Alert, Button, Field, FlowSection, Input } from '../lib';
import { tsx, type ComponentEntry } from './model';

const example = tsx(['Button', 'Field', 'FlowSection', 'Input'], '<FlowSection title="Schedule a placement" description="Set dates before reviewing availability." scope="Studio / Dubai launch">\n  <div className="t98-form-grid">\n    <Field label="Start date" htmlFor="placement-start"><Input type="date" name="start" /></Field>\n    <Field label="End date" htmlFor="placement-end"><Input type="date" name="end" /></Field>\n  </div>\n  <div className="t98-form-actions"><Button>Review availability</Button></div>\n</FlowSection>');

export const layoutEntries: ComponentEntry[] = [{
  name: 'FlowSection', category: 'Layout',
  description: 'A compact feature section composed of controls, results and actions inside a full page template.',
  usage: 'Use for one feature task, such as checking availability, reviewing recipients or exploring keywords. A template composes several feature sections. Keep controls before their action, results after their applied scope, and h3 subheadings inside the section. FlowSection adds no page title, app shell, form, request or state controller. It owns a 16px section/body gap; use t98-form-grid for fields and t98-form-actions for wrapping buttons.',
  props: [
    { name: 'title', type: 'string', required: true, description: 'Feature heading, rendered as h2.' },
    { name: 'description', type: 'string', description: 'Short feature explanation beneath the title.' },
    { name: 'scope', type: 'ReactNode', description: 'Applied resource or account context for this feature.' },
    { name: 'actions', type: 'ReactNode', description: 'Optional context-independent section actions. Put actions that use draft controls after those controls in children.' },
    { name: 'children', type: 'ReactNode', required: true, description: 'App-owned controls, feedback and results in reading order.' },
  ],
  nativeProps: 'Standard section attributes including id, aria-label, aria-describedby and aria-busy. A generated heading ID supplies the accessible name by default.',
  tokens: ['--t98-space-2', '--t98-space-3', '--t98-space-4', '--t98-space-6', '--t98-text-xl', '--t98-text', '--t98-muted'],
  accessibility: ['A feature starts at h2 beneath the page template’s single h1. Use h3 for subparts.', 'Controls retain native labels, form ownership and keyboard behavior.', 'The app supplies pending, error, empty and read-only states; layout never implies success.'],
  related: ['OverviewTemplate', 'CollectionTemplate', 'DetailTemplate', 'EditorTemplate', 'SettingsTemplate', 'Card', 'Alert'],
  example,
  states: [
    { name: 'Feature section', description: 'Fields share one grid and one adjacent action row.', preview: <FlowSection title="Schedule a placement" description="Set dates before reviewing availability." scope="Studio / Dubai launch"><div className="t98-form-grid"><Field label="Start date" htmlFor="placement-start"><Input type="date" name="start" /></Field><Field label="End date" htmlFor="placement-end"><Input type="date" name="end" /></Field></div><div className="t98-form-actions"><Button>Review availability</Button></div></FlowSection>, code: example },
    { name: 'Read only', description: 'Inspection remains available while app-owned controls explain editing restrictions.', preview: <FlowSection title="Placement dates" scope="Studio / Dubai launch"><Alert title="Read-only access">An editor can change placement dates.</Alert><Field label="Start date" htmlFor="readonly-placement-start"><Input type="date" defaultValue="2026-10-21" readOnly /></Field></FlowSection>, code: tsx(['Alert', 'Field', 'FlowSection', 'Input'], '<FlowSection title="Placement dates" scope="Studio / Dubai launch">\n  <Alert title="Read-only access">An editor can change placement dates.</Alert>\n  <Field label="Start date" htmlFor="readonly-placement-start"><Input type="date" defaultValue="2026-10-21" readOnly /></Field>\n</FlowSection>') },
  ],
}];
