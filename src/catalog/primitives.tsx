import { useEffect, useId, useRef, useState } from 'react';
import {
  Accordion, Alert, Avatar, Badge, Breadcrumb, Button, Card, Checkbox, Dialog, Field,
  Icon, Input, Meter, Progress, Select, Separator, Skeleton, Switch, Tabs, Textarea, Tooltip,
} from '../lib/primitives.js';
import { tsx, type ComponentEntry, type ComponentState } from './model.js';
import primitivesSource from '../lib/primitives.tsx?raw';

const controlTokens = ['--t98-font', '--t98-control-height', '--t98-control-border', '--t98-radius', '--t98-surface', '--t98-text', '--t98-muted', '--t98-accent', '--t98-danger'];
const tones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const;
const toneTokens = ['--t98-muted', '--t98-subtle', '--t98-accent', '--t98-accent-soft', '--t98-success', '--t98-success-soft', '--t98-warning', '--t98-warning-soft', '--t98-danger', '--t98-danger-soft', '--t98-info', '--t98-info-soft'];
const iconNames = [...primitivesSource.split('const iconPaths = {')[1].split('} as const;')[0].matchAll(/^\s+(?:'([^']+)'|(\w+)):\s*'/gm)].map(match => match[1] ?? match[2]);
const iconGalleryCode = tsx(['Icon'], `<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--t98-space-4)' }}>\n  {${JSON.stringify(iconNames)}.map(name => (\n    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--t98-space-2)' }}>\n      <Icon name={name} />\n      <code>{name}</code>\n    </div>\n  ))}\n</div>`);

type ControlKind = 'Input' | 'Textarea' | 'Select';
type ControlState = 'Empty' | 'Filled' | 'Error' | 'Disabled' | 'Read only' | 'Required' | 'Focus and hover';

function ControlPreview({ kind, state }: { kind: ControlKind; state: ControlState }) {
  const id = useId();
  const props = {
    name: 'project', disabled: state === 'Disabled', required: state === 'Required',
    defaultValue: state === 'Filled' || state === 'Read only' || state === 'Disabled' ? 'Launch campaign' : '',
  };
  return <Field htmlFor={id} label="Project name" error={state === 'Error' ? 'Enter a project name.' : undefined}
    description={state === 'Focus and hover' ? 'Move your pointer here, then Tab to the control to inspect its native focus ring.' : undefined}>
    {kind === 'Input' ? <Input {...props} placeholder="Name your project" readOnly={state === 'Read only'} />
      : kind === 'Textarea' ? <Textarea {...props} placeholder="Describe your project" readOnly={state === 'Read only'} />
        : <Select {...props}><option value="">Choose a project</option><option value="Launch campaign">Launch campaign</option><option value="Website audit">Website audit</option></Select>}
  </Field>;
}

function controlCode(kind: ControlKind, state: ControlState) {
  const value = state === 'Filled' || state === 'Read only' || state === 'Disabled' ? ' defaultValue="Launch campaign"' : kind === 'Select' ? ' defaultValue=""' : '';
  const flags = `${state === 'Disabled' ? ' disabled' : ''}${state === 'Read only' ? ' readOnly' : ''}${state === 'Required' ? ' required' : ''}`;
  const control = kind === 'Select'
    ? `<Select name="project"${value}${flags}>\n    <option value="">Choose a project</option>\n    <option value="Launch campaign">Launch campaign</option>\n    <option value="Website audit">Website audit</option>\n  </Select>`
    : `<${kind} name="project" placeholder="${kind === 'Input' ? 'Name your project' : 'Describe your project'}"${value}${flags} />`;
  return tsx(['Field', kind], `<Field htmlFor={id} label="Project name"${state === 'Error' ? ' error="Enter a project name."' : ''}${state === 'Focus and hover' ? ' description="Hover the control, then Tab to inspect keyboard focus."' : ''}>\n  ${control}\n</Field>`, 'const id = useId();', ['useId']);
}

function controlStates(kind: ControlKind): ComponentState[] {
  const names: ControlState[] = ['Empty', 'Filled', 'Error', 'Disabled', ...(kind === 'Select' ? [] : ['Read only' as const]), 'Required', 'Focus and hover'];
  const descriptions: Record<ControlState, string> = {
    Empty: kind === 'Select' ? 'An empty option is explicit; the browser owns the menu.' : 'A placeholder supports the visible label; it does not replace it.',
    Filled: 'An uncontrolled initial value remains editable. Use value and onChange for application-controlled values.',
    Error: 'Field supplies aria-invalid, an associated error and the danger border. Validation remains application-owned.',
    Disabled: 'Native disabled controls cannot be focused or submitted with the form.',
    'Read only': 'Native readOnly preserves focus and submission while preventing edits.',
    Required: 'The native required attribute participates in browser form validation.',
    'Focus and hover': 'Hover with a pointer and use Tab for the actual focus state. No simulated interaction styling is applied.',
  };
  return names.map(state => ({ name: state, description: descriptions[state], preview: <ControlPreview kind={kind} state={state} />, code: controlCode(kind, state) }));
}

function FieldPreview({ mode }: { mode: 'description' | 'error' | 'required' }) {
  const id = useId();
  return <Field htmlFor={id} label={mode === 'required' ? 'Project name (required)' : 'Project name'}
    description="Visible to everyone in this workspace." error={mode === 'error' ? 'Use a name with at least three characters.' : undefined}>
    <Input name="projectName" defaultValue={mode === 'error' ? 'AB' : ''} required={mode === 'required'} />
  </Field>;
}

function MixedCheckbox() {
  const ref = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(false);
  const [mixed, setMixed] = useState(true);
  useEffect(() => { if (ref.current) ref.current.indeterminate = mixed; }, [mixed]);
  return <Checkbox ref={ref} label="Select all campaigns" checked={checked} aria-checked={mixed ? 'mixed' : checked}
    onChange={event => { setMixed(false); setChecked(event.currentTarget.checked); }} />;
}

function SwitchPreview({ initial = false, disabled = false }: { initial?: boolean; disabled?: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  return <Switch label="Email notifications" checked={enabled} onCheckedChange={setEnabled} disabled={disabled} />;
}

function TabsPreview({ initial = 'overview', lazy = false }: { initial?: string; lazy?: boolean }) {
  const [value, setValue] = useState(initial);
  return <Tabs label="Campaign details" value={value} onValueChange={setValue} keepMounted={!lazy} items={[
    { value: 'overview', label: 'Overview', content: 'Campaign summary and confirmed metrics.' },
    { value: 'activity', label: 'Activity', content: 'Recent campaign changes appear here.', disabled: lazy },
    { value: 'settings', label: 'Settings', content: 'Campaign preferences appear here.' },
  ]} />;
}

function tabsCode(initial = 'overview') {
  return tsx(['Tabs'], `<Tabs label="Campaign details" value={value} onValueChange={setValue} items={[\n  { value: 'overview', label: 'Overview', content: 'Campaign summary and confirmed metrics.' },\n  { value: 'activity', label: 'Activity', content: 'Recent campaign changes appear here.' },\n  { value: 'settings', label: 'Settings', content: 'Campaign preferences appear here.' },\n]} />`, `const [value, setValue] = useState('${initial}');`, ['useState']);
}

function DialogPreview({ pending = false }: { pending?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const id = useId();
  return <>
    <Button onClick={() => { setBusy(pending); setOpen(true); }}>{pending ? 'Open pending-close example' : 'Open dialog'}</Button>
    <Dialog open={open} onOpenChange={setOpen} title="Edit project" description="Dialog state belongs to the application."
      closeDisabled={busy} footer={busy
        ? <Button onClick={() => setBusy(false)}>Finish simulated save</Button>
        : <Button variant="secondary" onClick={() => setOpen(false)}>Done</Button>}>
      {busy ? <p role="status">Simulated save is pending. Finish it to restore Escape, backdrop and close-button dismissal.</p>
        : <Field htmlFor={id} label="Project name"><Input defaultValue="Launch campaign" /></Field>}
    </Dialog>
  </>;
}

function dialogCode(pending = false) {
  return tsx(['Button', 'Dialog', 'Field', 'Input'], `<>\n  <Button onClick={() => { setBusy(${pending}); setOpen(true); }}>Open dialog</Button>\n  <Dialog\n    open={open}\n    onOpenChange={setOpen}\n    title="Edit project"\n    description="Dialog state belongs to the application."\n    closeDisabled={busy}\n    footer={busy\n      ? <Button onClick={() => setBusy(false)}>Finish simulated save</Button>\n      : <Button variant="secondary" onClick={() => setOpen(false)}>Done</Button>}\n  >\n    {busy\n      ? <p role="status">Simulated save is pending. Finish it to enable dismissal.</p>\n      : <Field htmlFor={id} label="Project name"><Input defaultValue="Launch campaign" /></Field>}\n  </Dialog>\n</>`, 'const [open, setOpen] = useState(false);\nconst [busy, setBusy] = useState(false);\nconst id = useId();', ['useState', 'useId']);
}

const regionOptions = [
  { value: 'dubai', label: 'Dubai', group: 'Middle East' }, { value: 'riyadh', label: 'Riyadh', group: 'Middle East' },
  { value: 'london', label: 'London', group: 'Europe' }, { value: 'other', label: 'Other', disabled: true },
];
const buttonExample = tsx(['Button', 'Icon'], '<Button icon={<Icon name="plus" />}>Create project</Button>');
const fieldExample = tsx(['Field', 'Input'], '<Field htmlFor={id} label="Project name" description="Visible to everyone in this workspace.">\n  <Input name="projectName" />\n</Field>', 'const id = useId();', ['useId']);
const checkboxExample = tsx(['Checkbox'], '<Checkbox label="Include archived campaigns" checked={checked} onChange={event => setChecked(event.currentTarget.checked)} />', 'const [checked, setChecked] = useState(false);', ['useState']);
const switchCode = (initial: boolean, disabled = false) => tsx(['Switch'], `<Switch label="Email notifications" checked={enabled} onCheckedChange={setEnabled}${disabled ? ' disabled' : ''} />`, `const [enabled, setEnabled] = useState(${initial});`, ['useState']);
const tooltipExample = tsx(['Button', 'Tooltip'], '<Tooltip content="Download the current report as CSV.">\n  <Button variant="secondary">Export report</Button>\n</Tooltip>');
const accordionExample = tsx(['Accordion'], `<Accordion items={[\n  { title: 'What is shared?', content: 'Tokens, components and common interaction patterns.' },\n  { title: 'Where do business rules live?', content: 'In each consuming application.' },\n]} />`);

function CountPreview() {
  const [message, setMessage] = useState('Your studio session is confirmed for Saturday at 10:00.');
  return <Field label="SMS message" count={{ value: message, max: 160 }}><Textarea value={message} onChange={event => setMessage(event.target.value)} /></Field>;
}

export const primitiveEntries: ComponentEntry[] = [
  {
    name: 'Button', category: 'Controls', description: 'A native button for one action, with consistent emphasis, size and pending feedback.',
    usage: 'Use primary for the main action, secondary for supporting actions, ghost for quiet actions and danger for a destructive action. Set type="submit" inside a form when it should submit.',
    props: [
      { name: 'variant', type: "'primary' | 'secondary' | 'ghost' | 'danger'", defaultValue: "'primary'", description: 'Visual emphasis; does not change action behavior.' },
      { name: 'size', type: "'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Control size; medium responds to the inherited density token.' },
      { name: 'loading', type: 'boolean', defaultValue: 'false', description: 'Shows a decorative spinner, disables interaction and sets aria-busy.' },
      { name: 'icon', type: 'ReactNode', description: 'Optional leading visual. Replaced by the spinner while loading. With no children it becomes an icon-only 44px square button that needs an aria-label (development warning).' },
      { name: 'href', type: 'string', description: 'Renders a styled anchor instead of a button. When disabled or loading the anchor drops href and sets aria-disabled.' },
      { name: 'component', type: 'ComponentType<{ href: string; className?: string; children?: ReactNode }>', description: 'Router link used for href, the same contract as Link.component.' },
      { name: 'pressed', type: 'boolean', description: 'Sets aria-pressed for a toggle button and applies the pressed style.' },
      { name: 'fullWidth', type: 'boolean', defaultValue: 'false', description: 'Fills the width of its container.' },
    ], nativeProps: 'All native button attributes, children, className and HTMLButtonElement ref. type defaults to "button"; disabled defaults to false. onClick does not run while disabled or loading.',
    tokens: ['--t98-font', '--t98-control-height', '--t98-control-border', '--t98-radius', '--t98-surface', '--t98-text', '--t98-subtle', '--t98-muted', '--t98-accent', '--t98-accent-hover', '--t98-on-accent', '--t98-danger'],
    accessibility: ['Use clear visible action text; give icon-only buttons an aria-label.', 'Tab focuses; Enter and Space activate. Disabled/loading buttons leave the Tab order.', 'Hover, keyboard focus and native pressed interaction are tested by actually interacting. Use pressed only for a real application-owned toggle.'],
    related: ['Icon', 'ConfirmDialog', 'CopyButton'], example: buttonExample,
    states: [
      ...(['primary', 'secondary', 'ghost', 'danger'] as const).map(variant => ({ name: variant, description: `${variant[0].toUpperCase() + variant.slice(1)} emphasis. Hover to inspect its supported hover styling.`, preview: <Button variant={variant}>{variant === 'danger' ? 'Delete draft' : 'Create project'}</Button>, code: tsx(['Button'], `<Button variant="${variant}">${variant === 'danger' ? 'Delete draft' : 'Create project'}</Button>`) })),
      ...(['sm', 'md', 'lg'] as const).map(size => ({ name: `Size ${size}`, description: 'The same native action at a supported size.', preview: <Button size={size}>Create project</Button>, code: tsx(['Button'], `<Button size="${size}">Create project</Button>`) })),
      { name: 'With icon', description: 'The decorative icon supports a visible text label.', preview: <Button icon={<Icon name="plus" />}>Create project</Button>, code: buttonExample },
      { name: 'Disabled', description: 'Unavailable action; explain the reason near the action when users need it.', preview: <Button disabled>Create project</Button>, code: tsx(['Button'], '<Button disabled>Create project</Button>') },
      { name: 'Link button', description: 'href renders a styled anchor; pass component for a router link.', preview: <Button href="/reports" variant="secondary">Open reports</Button>, code: tsx(['Button'], '<Button href="/reports" variant="secondary">Open reports</Button>') },
      { name: 'Disabled link button', description: 'A disabled anchor has no href and exposes aria-disabled.', preview: <Button href="/reports" disabled>Open reports</Button>, code: tsx(['Button'], '<Button href="/reports" disabled>Open reports</Button>') },
      { name: 'Pressed toggle', description: 'pressed sets aria-pressed and the pressed style.', preview: <Button variant="secondary" pressed>Show archived</Button>, code: tsx(['Button'], '<Button variant="secondary" pressed>Show archived</Button>') },
      { name: 'Icon only', description: 'A 44px square target; the accessible name comes from aria-label.', preview: <Button variant="secondary" icon={<Icon name="plus" />} aria-label="Add project" />, code: tsx(['Button', 'Icon'], '<Button variant="secondary" icon={<Icon name="plus" />} aria-label="Add project" />') },
      { name: 'Full width', description: 'Fills its container, for example in a narrow panel.', preview: <Button fullWidth>Create project</Button>, code: tsx(['Button'], '<Button fullWidth>Create project</Button>') },
      { name: 'Loading', description: 'Pending feedback retains the text and prevents repeated activation.', preview: <Button loading>Creating project…</Button>, code: tsx(['Button'], '<Button loading>Creating project…</Button>') },
      { name: 'Hover, focus and press', description: 'Hover this button, Tab to it, then hold Space or click. The browser owns focus and press behavior; the library supplies hover and focus-visible styles.', preview: <Button variant="secondary">Try native interactions</Button>, code: tsx(['Button'], '<Button variant="secondary">Try native interactions</Button>') },
    ],
  },
  {
    name: 'Input', category: 'Controls', description: 'A styled native single-line input with the browser’s validation, focus and editing behavior.',
    usage: 'Compose with Field for a visible label, help and validation errors. Choose the native type and constraints that fit the data; the application owns values and validation.',
    props: [], nativeProps: 'All InputHTMLAttributes<HTMLInputElement> and HTMLInputElement ref, including type, name, value/onChange, defaultValue, required, disabled, readOnly, aria-invalid and className. No custom props. Native type defaults to text.',
    tokens: controlTokens, accessibility: ['Always associate a visible label, usually through Field.', 'Use error text alongside aria-invalid; color alone is insufficient.', 'readOnly controls remain focusable and submit; disabled controls do neither. Native input types may add browser-specific controls.'],
    related: ['Field', 'Textarea', 'Select', 'SecretField'], example: controlCode('Input', 'Empty'), states: controlStates('Input'),
  },
  {
    name: 'Textarea', category: 'Controls', description: 'A native multiline text control that can be resized vertically.',
    usage: 'Use for descriptions, notes and plain-text drafts. Set rows for the initial height and native maxLength when a real limit exists.',
    props: [{ name: 'rows', type: 'number', defaultValue: '4', description: 'Native initial row count. CSS also supplies a minimum height.' }],
    nativeProps: 'All TextareaHTMLAttributes<HTMLTextAreaElement> and HTMLTextAreaElement ref, including name, value/onChange, defaultValue, required, disabled, readOnly, maxLength and className.',
    tokens: controlTokens, accessibility: ['Use a visible Field label and connect errors and help text.', 'Native keyboard editing, text selection and vertical resizing are preserved.', 'No rich-text, autosize or character-counter API is included.'],
    related: ['Field', 'Input'], example: controlCode('Textarea', 'Empty'), states: controlStates('Textarea'),
  },
  {
    name: 'Select', category: 'Controls', description: 'A native select for choosing from a short, explicit list of options.',
    usage: 'Supply option children and a value/onChange pair or defaultValue. Include an empty option when no selection is meaningful. Native menu rendering varies by platform.',
    props: [
      { name: 'options', type: '{ value: string; label: string; disabled?: boolean; group?: string }[]', description: 'Rendered before children. Options with the same group share one optgroup, placed where the group first appears.' },
      { name: 'placeholder', type: 'string', description: 'A disabled empty first option, selected while value and defaultValue are empty.' },
    ], nativeProps: 'All SelectHTMLAttributes<HTMLSelectElement> and HTMLSelectElement ref, including children, name, value/onChange, defaultValue, required, disabled, multiple and className. No readOnly attribute exists for native select; use a static value presentation when editing is unavailable but submission must be preserved.',
    tokens: controlTokens, accessibility: ['Use Field to label the control and associate help/errors.', 'Keyboard selection and the option menu are browser-native.', 'For type-to-filter choices use Combobox (WAI-ARIA APG list autocomplete); for several choices use CheckboxGroup.'],
    related: ['Field', 'ProductSwitcher', 'Input'], example: controlCode('Select', 'Empty'),
    states: [
      ...controlStates('Select'),
      { name: 'Options and groups', description: 'options replaces hand-written option children; group creates optgroups.', preview: <Field label="Region"><Select name="region" placeholder="Choose a region" options={regionOptions} /></Field>, code: tsx(['Field', 'Select'], '<Field label="Region">\n  <Select name="region" placeholder="Choose a region" options={[\n    { value: \'dubai\', label: \'Dubai\', group: \'Middle East\' },\n    { value: \'riyadh\', label: \'Riyadh\', group: \'Middle East\' },\n    { value: \'london\', label: \'London\', group: \'Europe\' },\n    { value: \'other\', label: \'Other\', disabled: true },\n  ]} />\n</Field>') },
    ],
  },
  {
    name: 'Field', category: 'Controls', description: 'Connects a visible label, description and error to one direct form-control child.',
    usage: 'Use a unique htmlFor, normally from useId. Leave the direct child’s id unset or set it to the same value. The child must forward generated ARIA attributes to its native control.',
    props: [
      { name: 'label', type: 'ReactNode', required: true, description: 'Visible control label.' },
      { name: 'htmlFor', type: 'string', description: 'Control ID and prefix for description/error IDs. Optional: when omitted an ID is generated and applied to a child without one.' },
      { name: 'required', type: 'boolean', defaultValue: 'false', description: 'Adds an aria-hidden " *" marker to the label. Set required on the control itself for validation.' },
      { name: 'description', type: 'ReactNode', description: 'Help text associated through aria-describedby.' },
      { name: 'error', type: 'ReactNode', description: 'Error text with role="alert"; sets the direct child’s aria-invalid.' },
      { name: 'count', type: '{ value: string; max: number; measure?: (value: string) => number }', description: 'Shows "used / max characters" linked to the control, marks it invalid when over, and announces only when it nears or passes the limit. measure supplies grapheme or weighted counting; the control is not hard-capped.' },
      { name: 'children', type: 'ReactNode', description: 'Use one direct control; existing aria-describedby is preserved and extended.' },
    ], nativeProps: 'HTMLAttributes<HTMLDivElement>, including className, are applied to the wrapper. Set required (validation), disabled and value on the control; the Field required prop only adds the visual marker.',
    tokens: ['--t98-font', '--t98-text', '--t98-muted', '--t98-danger'],
    accessibility: ['Label, help and errors are programmatically associated.', 'A nested wrapper is not a substitute for a direct control child. Custom children must forward id, aria-describedby and aria-invalid.', 'Field does not validate or disable its child automatically; the required marker is visual only.'],
    related: ['Input', 'Textarea', 'Select'], example: fieldExample,
    states: [
      { name: 'Description', description: 'Visible supporting text connected to the input.', preview: <FieldPreview mode="description" />, code: fieldExample },
      { name: 'Error', description: 'The description is retained; error text and invalid state are added.', preview: <FieldPreview mode="error" />, code: tsx(['Field', 'Input'], '<Field htmlFor={id} label="Project name" description="Visible to everyone in this workspace." error="Use a name with at least three characters.">\n  <Input name="projectName" defaultValue="AB" />\n</Field>', 'const id = useId();', ['useId']) },
      { name: 'Generated ID and required marker', description: 'Without htmlFor the label is linked to the control through a generated ID.', preview: <Field label="Project name" required description="Visible to everyone in this workspace."><Input name="projectName" required /></Field>, code: tsx(['Field', 'Input'], '<Field label="Project name" required description="Visible to everyone in this workspace.">\n  <Input name="projectName" required />\n</Field>') },
      { name: 'Character count', description: 'A 160-character limit; over the limit the counter turns red, the control is invalid and the state is announced once.', preview: <CountPreview />, code: tsx(['Field', 'Textarea'], '<Field label="SMS message" count={{ value: message, max: 160 }}>\n  <Textarea value={message} onChange={event => setMessage(event.target.value)} />\n</Field>', "const [message, setMessage] = useState('Your studio session is confirmed for Saturday at 10:00.');", ['useState']) },
      { name: 'Required composition', description: 'The label states the requirement and the native input enforces it on submission.', preview: <FieldPreview mode="required" />, code: tsx(['Field', 'Input'], '<Field htmlFor={id} label="Project name (required)" description="Visible to everyone in this workspace.">\n  <Input name="projectName" required />\n</Field>', 'const id = useId();', ['useId']) },
    ],
  },
  {
    name: 'Checkbox', category: 'Controls', description: 'A labelled native checkbox for an independent selection or a group of selections.',
    usage: 'Use checked/onChange for controlled selection or defaultChecked for an initial value. Set indeterminate on the native input ref for a mixed aggregate selection.',
    props: [{ name: 'label', type: 'ReactNode', required: true, description: 'Visible text inside the wrapping label.' }],
    nativeProps: 'Native input props except type, plus HTMLInputElement ref. type is always checkbox. className styles the wrapping label. indeterminate is a DOM property, not a component prop.',
    tokens: ['--t98-font', '--t98-text', '--t98-accent'],
    accessibility: ['The whole label activates the native checkbox; Tab focuses and Space toggles it.', 'Use the ref’s indeterminate property and aria-checked="mixed" for a partial group selection.', 'A mixed state describes actual child selection; do not use it as a loading indicator.'],
    related: ['Switch', 'PermissionMatrix', 'DataTable'], example: checkboxExample,
    states: [
      { name: 'Unchecked', description: 'Click the label or use Space to toggle the native control.', preview: <Checkbox label="Include archived campaigns" defaultChecked={false} />, code: tsx(['Checkbox'], '<Checkbox label="Include archived campaigns" defaultChecked={false} />') },
      { name: 'Checked', description: 'An initial selection remains editable.', preview: <Checkbox label="Include archived campaigns" defaultChecked />, code: tsx(['Checkbox'], '<Checkbox label="Include archived campaigns" defaultChecked />') },
      { name: 'Mixed', description: 'The native indeterminate property represents a partially selected group. The first change clears the mixed state.', preview: <MixedCheckbox />, code: tsx(['Checkbox'], '<Checkbox\n  ref={ref}\n  label="Select all campaigns"\n  checked={checked}\n  aria-checked={mixed ? \'mixed\' : checked}\n  onChange={event => {\n    setMixed(false);\n    setChecked(event.currentTarget.checked);\n  }}\n/>', 'const ref = useRef<HTMLInputElement>(null);\nconst [checked, setChecked] = useState(false);\nconst [mixed, setMixed] = useState(true);\nuseEffect(() => {\n  if (ref.current) ref.current.indeterminate = mixed;\n}, [mixed]);', ['useEffect', 'useRef', 'useState']) },
      { name: 'Disabled unchecked', description: 'Disabled native input cannot be toggled or submitted.', preview: <Checkbox label="Include archived campaigns" disabled />, code: tsx(['Checkbox'], '<Checkbox label="Include archived campaigns" disabled />') },
      { name: 'Disabled checked', description: 'Existing selection shown while interaction is unavailable.', preview: <Checkbox label="Include archived campaigns" defaultChecked disabled />, code: tsx(['Checkbox'], '<Checkbox label="Include archived campaigns" defaultChecked disabled />') },
      { name: 'Keyboard focus', description: 'Tab to this checkbox to inspect the real focus-visible ring.', preview: <Checkbox label="Include archived campaigns" />, code: checkboxExample },
    ],
  },
  {
    name: 'Switch', category: 'Controls', description: 'A controlled on/off switch for a boolean setting.',
    usage: 'Use when a setting reads naturally as on/off. Keep checked state and persistence in the consuming app. Use Checkbox for selection, consent and bulk-selection lists.',
    props: [
      { name: 'label', type: 'ReactNode', required: true, description: 'Visible stable label; do not rename the setting when it changes.' },
      { name: 'checked', type: 'boolean', required: true, description: 'Current on/off state; exposed through aria-checked.' },
      { name: 'onCheckedChange', type: '(checked: boolean) => void', required: true, description: 'Called with the next state after activation unless onClick prevents default.' },
    ], nativeProps: 'Button attributes except onChange, children and type. The component supplies type="button", role="switch" and the visible label. disabled defaults to false; className styles the outer button. Use disabled while saving when needed; there is no built-in pending state.',
    tokens: ['--t98-font', '--t98-text', '--t98-control-border', '--t98-accent', '--t98-on-accent'],
    accessibility: ['Tab focuses; Enter and Space toggle the controlled switch.', 'The accessible label stays constant and aria-checked communicates state.', 'This button is not a successful form field; submit the controlled boolean through the app’s validated save flow.'],
    related: ['Checkbox', 'SettingsSection'], example: switchCode(false),
    states: [
      { name: 'Off', description: 'Activate to turn the local setting on.', preview: <SwitchPreview />, code: switchCode(false) },
      { name: 'On', description: 'Activate to turn the local setting off.', preview: <SwitchPreview initial />, code: switchCode(true) },
      { name: 'Disabled off', description: 'Unavailable setting with its current state visible.', preview: <SwitchPreview disabled />, code: switchCode(false, true) },
      { name: 'Disabled on', description: 'Enabled setting that cannot currently be changed.', preview: <SwitchPreview initial disabled />, code: switchCode(true, true) },
      { name: 'Keyboard focus', description: 'Tab to inspect the real focus ring, then use Space or Enter to toggle.', preview: <SwitchPreview />, code: switchCode(false) },
    ],
  },
  {
    name: 'Badge', category: 'Data display', description: 'A concise text status or category with optional decorative dot.',
    usage: 'Use a meaningful text label and an appropriate semantic tone. Badge is display-only; use a Button or link for actions.',
    props: [
      { name: 'tone', type: "'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'", defaultValue: "'neutral'", description: 'Semantic foreground and soft background pair.' },
      { name: 'palette', type: "'rose' | 'amber' | 'lime' | 'emerald' | 'sky' | 'violet' | 'fuchsia'", description: 'Decorative colour for user tags; replaces the tone colours and meets 4.5:1 in both themes. Use tone for status.' },
      { name: 'dot', type: 'boolean', defaultValue: 'false', description: 'Adds a decorative dot in the foreground color.' },
    ], nativeProps: 'HTMLAttributes<HTMLSpanElement>, including children and className. No disabled, selected or loading state API.',
    tokens: ['--t98-font', ...toneTokens], accessibility: ['Include readable text; the dot and color alone do not communicate status.', 'No live-region role is added automatically; use Alert or a status region for meaningful asynchronous updates.'],
    related: ['Alert', 'ResourceCard'], example: tsx(['Badge'], '<Badge tone="success" dot>Connected</Badge>'),
    states: [
      ...tones.map(tone => ({ name: `Tone ${tone}`, description: 'Semantic color pair; the text carries the meaning.', preview: <Badge tone={tone}>{tone === 'success' ? 'Connected' : tone === 'danger' ? 'Failed' : tone === 'warning' ? 'Needs attention' : tone === 'info' ? 'Processing' : tone === 'accent' ? 'Featured' : 'Draft'}</Badge>, code: tsx(['Badge'], `<Badge tone="${tone}">${tone === 'success' ? 'Connected' : tone === 'danger' ? 'Failed' : tone === 'warning' ? 'Needs attention' : tone === 'info' ? 'Processing' : tone === 'accent' ? 'Featured' : 'Draft'}</Badge>`) })),
      ...(['rose', 'amber', 'lime', 'emerald', 'sky', 'violet', 'fuchsia'] as const).map(palette => ({ name: `Palette ${palette}`, description: 'Decorative tag colour with no status meaning.', preview: <Badge palette={palette}>{palette}</Badge>, code: tsx(['Badge'], `<Badge palette="${palette}">${palette}</Badge>`) })),
      { name: 'With dot', description: 'A decorative marker supplements readable text.', preview: <Badge tone="success" dot>Connected</Badge>, code: tsx(['Badge'], '<Badge tone="success" dot>Connected</Badge>') },
    ],
  },
  {
    name: 'Avatar', category: 'Data display', description: 'A named initials avatar for a person or workspace.',
    usage: 'Provide the full display name. The component uses the first character of the first two whitespace-separated words and does not fetch images.',
    props: [
      { name: 'name', type: 'string', required: true, description: 'Full accessible name and source of initials. Empty names use ? and “Unknown user”.' },
      { name: 'size', type: "'sm' | 'md' | 'lg'", defaultValue: "'md'", description: '25, 32 or 44 pixel avatar diameter.' },
    ], nativeProps: 'HTMLAttributes<HTMLSpanElement>, including className. The component supplies role="img" and aria-label. No image URL, disabled, loading or presence-status API.',
    tokens: ['--t98-font', '--t98-accent', '--t98-accent-soft'], accessibility: ['The full name is available through aria-label, rather than initials alone.', 'Wrap in an accessible button or link only when the avatar has an action.'],
    related: ['ActivityFeed', 'Card'], example: tsx(['Avatar'], '<Avatar name="Alex Morgan" />'),
    states: [
      ...(['sm', 'md', 'lg'] as const).map(size => ({ name: `Size ${size}`, description: 'Initials display at a supported size.', preview: <Avatar name="Alex Morgan" size={size} />, code: tsx(['Avatar'], `<Avatar name="Alex Morgan" size="${size}" />`) })),
      { name: 'One-word name', description: 'One word produces one initial.', preview: <Avatar name="Alex" />, code: tsx(['Avatar'], '<Avatar name="Alex" />') },
      { name: 'Unknown name', description: 'An empty name uses a visible question mark and “Unknown user” accessible label.', preview: <Avatar name="" />, code: tsx(['Avatar'], '<Avatar name="" />') },
    ],
  },
  {
    name: 'Card', category: 'Layout', description: 'A surface with an optional title, description, action slot and content.',
    usage: 'Group related information and controls on a surface. Card owns a 16px gap between direct content children; put related buttons in t98-form-actions and fields in t98-form-grid. Use FlowSection for a feature boundary without a second surface. Use ResourceCard for resource/connection composition. Cards are not interactive by themselves.',
    props: [
      { name: 'title', type: 'ReactNode', description: 'Optional title rendered inside a heading (h3 by default).' },
      { name: 'as', type: "'div' | 'section' | 'article'", defaultValue: "'div'", description: 'Element for the card. A titled section or article is named by its title.' },
      { name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', defaultValue: '3', description: 'Outline level of the title.' },
      { name: 'description', type: 'ReactNode', description: 'Optional supporting text rendered inside a paragraph.' },
      { name: 'actions', type: 'ReactNode', description: 'Optional header action slot; provide labelled controls.' },
      { name: 'children', type: 'ReactNode', description: 'Optional padded card body.' },
    ], nativeProps: 'HTMLAttributes<HTMLDivElement> except the native title attribute; includes className. No clickable, disabled, loading or selected state API.',
    tokens: ['--t98-font', '--t98-border', '--t98-radius', '--t98-surface', '--t98-text', '--t98-muted'],
    accessibility: ['The title is an h3 unless headingLevel is set; place the card where this fits the page’s heading hierarchy.', 'Put actions in actual buttons/links. Do not turn the whole card into an unlabelled clickable div.'],
    related: ['ResourceCard', 'MetricCard', 'Skeleton'], example: tsx(['Button', 'Card'], '<Card title="Launch campaign" description="Draft campaign in this workspace." actions={<Button variant="secondary">Edit campaign</Button>}>\n  <p>Add content and choose publishing channels.</p>\n</Card>'),
    states: [
      { name: 'Content only', description: 'A simple panel without a generated heading.', preview: <Card><p>Add content and choose publishing channels.</p></Card>, code: tsx(['Card'], '<Card><p>Add content and choose publishing channels.</p></Card>') },
      { name: 'Title and description', description: 'Optional header content above the padded body.', preview: <Card title="Launch campaign" description="Draft campaign in this workspace."><p>Add content and choose publishing channels.</p></Card>, code: tsx(['Card'], '<Card title="Launch campaign" description="Draft campaign in this workspace.">\n  <p>Add content and choose publishing channels.</p>\n</Card>') },
      { name: 'Section with heading level', description: 'A named section landmark whose title is an h2.', preview: <Card as="section" headingLevel={2} title="Launch campaign"><p>Add content and choose publishing channels.</p></Card>, code: tsx(['Card'], '<Card as="section" headingLevel={2} title="Launch campaign">\n  <p>Add content and choose publishing channels.</p>\n</Card>') },
      { name: 'With actions', description: 'Actions wrap at narrow widths; all behavior remains in the provided control.', preview: <Card title="Launch campaign" description="Draft campaign in this workspace." actions={<Button variant="secondary">Edit campaign</Button>}><p>Add content and choose publishing channels.</p></Card>, code: tsx(['Button', 'Card'], '<Card title="Launch campaign" description="Draft campaign in this workspace." actions={<Button variant="secondary">Edit campaign</Button>}>\n  <p>Add content and choose publishing channels.</p>\n</Card>') },
    ],
  },
  {
    name: 'Tabs', category: 'Navigation', description: 'Controlled tab buttons and associated panels for related content on one page.',
    usage: 'Supply stable item values and keep the active value in app state. Use real route links for navigation between pages. Mark unavailable tabs disabled; set keepMounted={false} to render only the active panel.',
    props: [
      { name: 'items', type: 'TabItem[]', required: true, description: 'Each item has value:string, label:ReactNode and optional content:ReactNode and optional disabled:boolean (aria-disabled, skipped by arrow keys, not activatable). Values must be unique.' },
      { name: 'value', type: 'string', required: true, description: 'Active value. An unmatched value renders the first item active.' },
      { name: 'onValueChange', type: '(value: string) => void', required: true, description: 'Called on click or supported keyboard navigation.' },
      { name: 'label', type: 'string', defaultValue: "'Sections'", description: 'Accessible name of the tablist.' },
      { name: 'keepMounted', type: 'boolean', defaultValue: 'true', description: 'Keeps inactive panels mounted but hidden. False renders only the active panel, so inactive content is absent from the DOM until selected.' },
      { name: 'className', type: 'string', description: 'Additional class on the wrapping div.' },
    ], nativeProps: 'No general native attribute spread. By default item content remains mounted in hidden panels; preserve application state with stable values or use keepMounted={false} for lazy panels.',
    tokens: ['--t98-font', '--t98-border', '--t98-muted', '--t98-text', '--t98-accent'],
    accessibility: ['Tab enters at the selected tab; ArrowLeft/ArrowRight wrap and select immediately. Home/End select the first/last tab.', 'Generated IDs associate each tab with its panel; inactive panels are hidden (or absent with keepMounted={false}).', 'Disabled tabs keep aria-disabled so they are still announced, but arrow keys and Home/End skip them and activation is ignored.', 'Arrow keys currently follow the listed left/right sequence in both text directions. There is no vertical orientation or manual-activation option.'],
    related: ['PageHeader', 'Breadcrumb'], example: tabsCode(),
    states: [
      { name: 'First tab selected', description: 'Overview is selected and its panel is visible.', preview: <TabsPreview />, code: tabsCode() },
      { name: 'Alternate tab selected', description: 'The active value can begin on any existing item.', preview: <TabsPreview initial="activity" />, code: tabsCode('activity') },
      { name: 'Keyboard selection and hover', description: 'Tab into the list, use ArrowLeft/ArrowRight or Home/End, and hover the other tabs. These are actual interactions.', preview: <TabsPreview />, code: tabsCode() },
      { name: 'Disabled tab and lazy panels', description: 'Activity is disabled: arrow keys skip it and it cannot be activated. With keepMounted={false} only the selected panel is in the DOM.', preview: <TabsPreview lazy />, code: tsx(['Tabs'], `<Tabs label="Campaign details" value={value} onValueChange={setValue} keepMounted={false} items={[\n  { value: 'overview', label: 'Overview', content: 'Campaign summary and confirmed metrics.' },\n  { value: 'activity', label: 'Activity', content: 'Recent campaign changes appear here.', disabled: true },\n  { value: 'settings', label: 'Settings', content: 'Campaign preferences appear here.' },\n]} />`, "const [value, setValue] = useState('overview');", ['useState']) },
      { name: 'Empty items', description: 'An empty items array renders an empty tablist. Prefer a meaningful empty state in the consuming app.', preview: <Tabs label="Campaign details" items={[]} value="" onValueChange={() => {}} />, code: tsx(['Tabs'], '<Tabs label="Campaign details" items={[]} value={value} onValueChange={setValue} />', "const [value, setValue] = useState('');", ['useState']) },
    ],
  },
  {
    name: 'Dialog', category: 'Feedback', description: 'A controlled native modal dialog with a title, optional description and footer.',
    usage: 'Open from an explicit launcher. The application owns drafts, submit handling and pending state. Use ConfirmDialog for its built-in typed confirmation and async confirmation flow.',
    props: [
      { name: 'open', type: 'boolean', required: true, description: 'Desired native modal state. Open dialogs enter the browser top layer.' },
      { name: 'onOpenChange', type: '(open: boolean) => void', required: true, description: 'Close request callback from close button, Escape, backdrop or native close. Update app state.' },
      { name: 'title', type: 'ReactNode', required: true, description: 'Visible h2 associated as the dialog’s accessible name.' },
      { name: 'description', type: 'ReactNode', description: 'Supporting paragraph associated through aria-describedby.' },
      { name: 'children', type: 'ReactNode', required: true, description: 'Dialog body; provide labelled controls where applicable.' },
      { name: 'footer', type: 'ReactNode', description: 'Optional action area beneath the body.' },
      { name: 'className', type: 'string', description: 'Additional class on the native dialog.' },
      { name: 'onBeforeClose', type: "(reason: 'escape' | 'backdrop' | 'close-button') => boolean | void", description: 'Called before Escape, backdrop or close-button closes. Return false to keep the dialog open (for example to show a discard-changes prompt); focus stays inside. Not called while closeDisabled.' },
      { name: 'eyebrow', type: 'ReactNode', description: 'Short context above the title, for example the record being edited.' },
      { name: 'onSubmit', type: '(data: FormData, event) => void | Promise<void>', description: 'Makes body and footer one form; type="submit" footer buttons submit it. Called once per submit; the dialog cannot close until it settles.' },
      { name: 'dirty / discardMessage', type: 'boolean / ReactNode', description: 'Unsaved changes: Escape, the backdrop and the close button show a "Discard unsaved changes?" prompt; Escape there means keep editing.' },
      { name: 'closeDisabled', type: 'boolean', defaultValue: 'false', description: 'Disables close button and suppresses Escape/backdrop close requests. Parent code can still set open=false.' },
    ], nativeProps: 'No general native dialog attribute spread. Do not force the open attribute or use CSS to simulate a modal. Native showModal requires browser support.',
    tokens: ['--t98-font', '--t98-border', '--t98-surface', '--t98-text', '--t98-muted', '--t98-bg', '--t98-overlay'],
    accessibility: ['Native modal semantics and focus containment; the launcher receives focus again on close.', 'Escape and backdrop clicks request close unless closeDisabled is true.', 'Keep a clear completion/recovery action while closing is disabled; the pending example explicitly provides a finish control.'],
    related: ['ConfirmDialog', 'Field', 'Button'], example: dialogCode(),
    states: [
      { name: 'Closed → open → closed', description: 'Use the launcher to see a real modal, then Done, Escape, backdrop or the close button to close it. Focus returns to the launcher.', preview: <DialogPreview />, code: dialogCode() },
      { name: 'Pending close disabled', description: 'Open a simulated pending state. Close button, Escape and backdrop are blocked until Finish simulated save restores them. No request or data mutation is made.', preview: <DialogPreview pending />, code: dialogCode(true) },
    ],
  },
  {
    name: 'Alert', category: 'Feedback', description: 'Inline status, explanation or error with a title and optional supporting content.',
    usage: 'Keep information requiring action visible in the page. Choose the tone by meaning and include text that explains the condition and next step.',
    props: [
      { name: 'title', type: 'ReactNode', description: 'Optional concise visible title rendered in a paragraph; children alone make a message-only alert.' },
      { name: 'variant', type: "'default' | 'inline' | 'banner'", defaultValue: "'default'", description: 'inline is compact with no border or padding; banner is full width without side borders.' },
      { name: 'onDismiss', type: '() => void', description: 'Adds a labelled dismiss button. The application removes the alert.' },
      { name: 'dismissLabel', type: 'string', defaultValue: "'Dismiss'", description: 'Accessible name of the dismiss button.' },
      { name: 'tone', type: "'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'", defaultValue: "'info'", description: 'Semantic tone. danger supplies role="alert"; other tones supply role="status".' },
      { name: 'actions', type: 'ReactNode', description: 'Optional wrapping action row below the message, separated by the shared 12px action gap. Keep related buttons here instead of beside inline prose.' },
    ], nativeProps: 'HTMLAttributes<HTMLDivElement> except native title; children form the optional description. Includes className. Pass role to override the default announcement. No disabled or loading API.',
    tokens: ['--t98-font', '--t98-radius', ...toneTokens], accessibility: ['Danger uses an assertive alert role; other tones use a polite status role.', 'Use live updates sparingly and avoid repeating the same message unnecessarily.', 'The icon is decorative; readable text explains the condition.'],
    related: ['ToastProvider', 'Badge', 'EmptyState'], example: tsx(['Alert'], '<Alert title="Connection saved" tone="success">New events will appear after the next successful sync.</Alert>'),
    states: [
      ...tones.map(tone => ({ name: `Tone ${tone}`, description: tone === 'danger' ? 'An assertive alert for a failure that needs attention.' : 'A polite status message with supporting text.', preview: <Alert title={tone === 'danger' ? 'Connection failed' : 'Connection status'} tone={tone}>{tone === 'danger' ? 'Check the credentials and try again.' : 'The application supplies this message from its actual connection state.'}</Alert>, code: tsx(['Alert'], `<Alert title="${tone === 'danger' ? 'Connection failed' : 'Connection status'}" tone="${tone}">${tone === 'danger' ? 'Check the credentials and try again.' : 'The application supplies this message from its actual connection state.'}</Alert>`) })),
      { name: 'Title only', description: 'Short status without a description.', preview: <Alert title="Changes saved" tone="success" />, code: tsx(['Alert'], '<Alert title="Changes saved" tone="success" />') },
      { name: 'Without title', description: 'Children alone form the message.', preview: <Alert tone="warning">Your trial ends in three days.</Alert>, code: tsx(['Alert'], '<Alert tone="warning">Your trial ends in three days.</Alert>') },
      { name: 'Inline', description: 'Compact message with no border or padding.', preview: <Alert variant="inline" tone="danger">Enter a valid email address.</Alert>, code: tsx(['Alert'], '<Alert variant="inline" tone="danger">Enter a valid email address.</Alert>') },
      { name: 'Banner', description: 'Full-width message for the top of a page or panel.', preview: <Alert variant="banner" title="Maintenance tonight" tone="info">Reports may be unavailable from 22:00.</Alert>, code: tsx(['Alert'], '<Alert variant="banner" title="Maintenance tonight" tone="info">Reports may be unavailable from 22:00.</Alert>') },
      { name: 'Dismissible', description: 'A labelled dismiss button calls onDismiss; the component keeps no state.', preview: <Alert title="Changes saved" tone="success" onDismiss={() => {}} dismissLabel="Dismiss message" />, code: tsx(['Alert'], '<>{open && <Alert title="Changes saved" tone="success" onDismiss={() => setOpen(false)} dismissLabel="Dismiss message" />}</>', 'const [open, setOpen] = useState(true);', ['useState']) },
      { name: 'Recovery action', description: 'Recovery follows the complete message and wraps without squeezing the text into columns.', preview: <Alert title="Outcome unknown" tone="warning" actions={<><Button variant="secondary">Check outcome</Button><Button variant="ghost">Keep receipt</Button></>}>Keep this receipt while checking the existing operation before trying again.</Alert>, code: tsx(['Alert', 'Button'], '<Alert title="Outcome unknown" tone="warning" actions={<><Button variant="secondary">Check outcome</Button><Button variant="ghost">Keep receipt</Button></>}>Keep this receipt while checking the existing operation before trying again.</Alert>') },
    ],
  },
  {
    name: 'Progress', category: 'Feedback', description: 'A labelled native progress bar: a percentage from zero to one hundred, or indeterminate when value is omitted.',
    usage: 'Use measured completion from a real operation. For unknown duration, omit value for an indeterminate bar rather than inventing a percentage.',
    props: [
      { name: 'value', type: 'number', description: 'Completion percentage; omit for an indeterminate bar (aria-busy, no value). Finite values clamp to 0–100; nonfinite values become 0. Visible text rounds to an integer.' },
      { name: 'label', type: 'string', defaultValue: "'Progress'", description: 'Visible label and accessible name.' },
      { name: 'className', type: 'string', description: 'Additional class on the outer progress group.' },
    ], nativeProps: 'No general native attribute spread. Fixed native max=100. Display-only; no disabled, loading or error prop.',
    tokens: ['--t98-font', '--t98-muted', '--t98-subtle', '--t98-accent'], accessibility: ['Native progress semantics include the numeric value and supplied label.', 'A completed percentage is not proof of a successful business operation; show the confirmed result separately.'],
    related: ['Skeleton', 'Alert', 'Stepper'], example: tsx(['Progress'], '<Progress value={64} label="Files uploaded" />'),
    states: [
      ...([0, 64, 100] as const).map(value => ({ name: value === 0 ? 'Not started' : value === 100 ? 'Complete' : 'In progress', description: 'A confirmed determinate value supplied by the application.', preview: <Progress value={value} label="Files uploaded" />, code: tsx(['Progress'], `<Progress value={${value}} label="Files uploaded" />`) })),
      { name: 'Indeterminate', description: 'No value: the bar is busy with an animation that stops under prefers-reduced-motion.', preview: <Progress label="Syncing" />, code: tsx(['Progress'], '<Progress label="Syncing" />') },
      { name: 'Out-of-range guard', description: 'A value of 140 is clamped to 100. Validate incoming values at application boundaries too.', preview: <Progress value={140} label="Guard example" />, code: tsx(['Progress'], '<Progress value={140} label="Guard example" />') },
    ],
  },
  {
    name: 'Meter', category: 'Feedback', description: 'A labelled native meter for a scalar measurement within a known range, such as quota used.',
    usage: 'Use for a measurement with a meaningful scale (storage, score, capacity), not for task progress; use Progress for that. Set low, high and optimum so the colour reflects whether the reading is good.',
    props: [
      { name: 'value', type: 'number', required: true, description: 'Current measurement.' },
      { name: 'min', type: 'number', defaultValue: '0', description: 'Lower bound.' },
      { name: 'max', type: 'number', defaultValue: '100', description: 'Upper bound.' },
      { name: 'low', type: 'number', description: 'Upper edge of the low range.' },
      { name: 'high', type: 'number', description: 'Lower edge of the high range.' },
      { name: 'optimum', type: 'number', description: 'Best value; with low and high it decides whether the colour is good, cautionary or poor.' },
      { name: 'label', type: 'string', defaultValue: "'Meter'", description: 'Visible label and accessible name.' },
      { name: 'valueLabel', type: 'ReactNode', description: 'Visible reading; defaults to the numeric value.' },
      { name: 'className', type: 'string', description: 'Additional class on the outer group.' },
    ], nativeProps: 'No general native attribute spread. Display-only native meter element.',
    tokens: ['--t98-font', '--t98-muted', '--t98-subtle', '--t98-success', '--t98-warning', '--t98-danger'], accessibility: ['Native meter semantics expose value, range and the supplied label.', 'The visible reading is text; colour alone does not communicate the range.'],
    related: ['Progress', 'MetricCard'], example: tsx(['Meter'], '<Meter label="Storage used" value={72} valueLabel="72 GB of 100 GB" low={60} high={85} optimum={20} />'),
    states: [
      { name: 'Good', description: 'Within the optimum range.', preview: <Meter label="Storage used" value={20} valueLabel="20 GB of 100 GB" low={60} high={85} optimum={10} />, code: tsx(['Meter'], '<Meter label="Storage used" value={20} valueLabel="20 GB of 100 GB" low={60} high={85} optimum={10} />') },
      { name: 'Caution', description: 'In the middle range.', preview: <Meter label="Storage used" value={72} valueLabel="72 GB of 100 GB" low={60} high={85} optimum={10} />, code: tsx(['Meter'], '<Meter label="Storage used" value={72} valueLabel="72 GB of 100 GB" low={60} high={85} optimum={10} />') },
      { name: 'Poor', description: 'In the range furthest from optimum.', preview: <Meter label="Storage used" value={95} valueLabel="95 GB of 100 GB" low={60} high={85} optimum={10} />, code: tsx(['Meter'], '<Meter label="Storage used" value={95} valueLabel="95 GB of 100 GB" low={60} high={85} optimum={10} />') },
    ],
  },
  {
    name: 'Skeleton', category: 'Feedback', description: 'A decorative placeholder for content that is still loading.',
    usage: 'Match the approximate content shape, mark the containing region busy and provide a separate loading status. Replace the skeleton after the actual request resolves.',
    props: [], nativeProps: 'HTMLAttributes<HTMLDivElement>, including className and style, determine shape. aria-hidden defaults to true. No disabled, error or loaded-state API; the application mounts/unmounts it.',
    tokens: ['--t98-subtle'], accessibility: ['Skeleton is hidden from assistive technology; label the surrounding busy region and include a readable status.', 'Pulsing animation stops when prefers-reduced-motion is reduce.', 'Avoid exposing internal dummy content or repeatedly announcing decorative placeholders.'],
    related: ['Card', 'Progress', 'EmptyState'], example: tsx(['Skeleton'], '<section aria-busy="true" aria-label="Loading campaign">\n  <p role="status">Loading campaign…</p>\n  <Skeleton style={{ width: \'70%\' }} />\n</section>'),
    states: [
      { name: 'Text placeholder', description: 'A width that approximates a line of content, with explicit loading text.', preview: <section aria-busy="true" aria-label="Loading campaign"><p role="status">Loading campaign…</p><Skeleton style={{ width: '70%' }} /></section>, code: tsx(['Skeleton'], '<section aria-busy="true" aria-label="Loading campaign">\n  <p role="status">Loading campaign…</p>\n  <Skeleton style={{ width: \'70%\' }} />\n</section>') },
      { name: 'Content block', description: 'Native style attributes supply the placeholder shape without a new component variant.', preview: <section aria-busy="true" aria-label="Loading campaign"><p role="status">Loading campaign…</p><Skeleton style={{ height: 96, width: '100%' }} /></section>, code: tsx(['Skeleton'], '<section aria-busy="true" aria-label="Loading campaign">\n  <p role="status">Loading campaign…</p>\n  <Skeleton style={{ height: 96, width: \'100%\' }} />\n</section>') },
      { name: 'Reduced motion', description: 'Use the operating system or browser reduced-motion setting to see the real nonanimated state. No component prop is needed.', preview: <Skeleton style={{ width: '70%' }} />, code: tsx(['Skeleton'], '<Skeleton style={{ width: \'70%\' }} />') },
    ],
  },
  {
    name: 'Separator', category: 'Layout', description: 'A native horizontal rule for a thematic break between groups of content.',
    usage: 'Use when content changes subject or group. Use layout spacing alone when no thematic separation is intended.',
    props: [], nativeProps: 'HTMLAttributes<HTMLHRElement>, including className, are forwarded to hr. No vertical, disabled, loading or size variant API.',
    tokens: ['--t98-border'], accessibility: ['Native hr supplies separator semantics.', 'Set aria-hidden only when a redundant decorative line should be removed from the accessibility tree.'],
    related: ['Card', 'SettingsSection'], example: tsx(['Separator'], '<div>\n  <p>Campaign details</p>\n  <Separator />\n  <p>Publishing preferences</p>\n</div>'),
    states: [
      { name: 'Thematic separator', description: 'A horizontal line with native separator semantics.', preview: <div><p>Campaign details</p><Separator /><p>Publishing preferences</p></div>, code: tsx(['Separator'], '<div>\n  <p>Campaign details</p>\n  <Separator />\n  <p>Publishing preferences</p>\n</div>') },
      { name: 'Decorative separator', description: 'Hide a purely decorative redundant line from assistive technology.', preview: <Separator aria-hidden="true" />, code: tsx(['Separator'], '<Separator aria-hidden="true" />') },
    ],
  },
  {
    name: 'Tooltip', category: 'Feedback', description: 'Supplemental information revealed by pointer hover or keyboard focus.',
    usage: 'Wrap one focusable element that forwards aria-describedby. Keep essential instructions visible and avoid interactive content inside the tooltip.',
    props: [
      { name: 'content', type: 'ReactNode', required: true, description: 'Supplemental, noninteractive tooltip content.' },
      { name: 'children', type: "ReactElement<{ 'aria-describedby'?: string }>", required: true, description: 'Exactly one focusable element that forwards aria-describedby; existing descriptions are retained.' },
      { name: 'className', type: 'string', description: 'Additional class on the wrapper span.' },
    ], nativeProps: 'No general native attribute spread. No forced-open, placement, delay, disabled or loading API. Disabled native buttons do not receive keyboard focus; explain their reason visibly.',
    tokens: ['--t98-font', '--t98-text', '--t98-surface'],
    accessibility: ['Appears on hover and focus; Escape dismisses until the next mouse-entry or focus event.', 'The child receives aria-describedby linking the role="tooltip" element.', 'The popup is not a substitute for a control’s accessible name, and must not hold links or actions.'],
    related: ['Button', 'Icon', 'Field'], example: tooltipExample,
    states: [
      { name: 'Closed, hover and focus', description: 'Initially hidden. Hover or Tab to the actual button to reveal the tooltip; move to its text without crossing a gap.', preview: <Tooltip content="Download the current report as CSV."><Button variant="secondary">Export report</Button></Tooltip>, code: tooltipExample },
      { name: 'Escape dismissal', description: 'Focus or hover the button, then press Escape. Re-enter with the pointer or focus again to restore the tooltip.', preview: <Tooltip content="Download the current report as CSV."><Button variant="secondary">Try Escape dismissal</Button></Tooltip>, code: tsx(['Button', 'Tooltip'], '<Tooltip content="Download the current report as CSV.">\n  <Button variant="secondary">Try Escape dismissal</Button>\n</Tooltip>') },
    ],
  },
  {
    name: 'Breadcrumb', category: 'Navigation', description: 'A compact ordered trail of parent pages ending in the current page.',
    usage: 'Supply parent hrefs and the current page as the final item. Links are native anchors; for custom client routing, compose the app’s router links in a shell/header slot.',
    props: [
      { name: 'items', type: '{ label: ReactNode; href?: string }[]', required: true, description: 'Ordered page hierarchy. Earlier items with href become links; the final item is always current-page text.' },
      { name: 'className', type: 'string', description: 'Additional class on the nav landmark.' },
    ], nativeProps: 'No general native attribute spread. aria-label is fixed to Breadcrumb. No active/disabled/loading props; current state comes from item position.',
    tokens: ['--t98-font', '--t98-muted', '--t98-text', '--t98-accent'],
    accessibility: ['The nav is labelled Breadcrumb and contains an ordered list.', 'The final item has aria-current="page". Decorative separators are hidden from assistive technology.', 'Hover and Tab reveal native anchor interaction and the library focus-visible ring.'],
    related: ['PageHeader', 'Tabs', 'AppShell'], example: tsx(['Breadcrumb'], '<Breadcrumb items={[\n  { label: \'Workspace\', href: \'#workspace\' },\n  { label: \'Campaigns\', href: \'#campaigns\' },\n  { label: \'Launch campaign\' },\n]} />'),
    states: [
      { name: 'Parents and current page', description: 'Earlier linked items navigate; the final item remains current-page text.', preview: <Breadcrumb items={[{ label: 'Workspace', href: '#workspace' }, { label: 'Campaigns', href: '#campaigns' }, { label: 'Launch campaign' }]} />, code: tsx(['Breadcrumb'], '<Breadcrumb items={[\n  { label: \'Workspace\', href: \'#workspace\' },\n  { label: \'Campaigns\', href: \'#campaigns\' },\n  { label: \'Launch campaign\' },\n]} />') },
      { name: 'Single current page', description: 'A one-item trail has no separator or parent link.', preview: <Breadcrumb items={[{ label: 'Campaigns' }]} />, code: tsx(['Breadcrumb'], '<Breadcrumb items={[{ label: \'Campaigns\' }]} />') },
    ],
  },
  {
    name: 'Accordion', category: 'Layout', description: 'Independent native details disclosures for optional supporting content.',
    usage: 'Group short supporting sections. Users can open multiple items at once; essential instructions should remain visible outside collapsed content.',
    props: [
      { name: 'items', type: '{ title: ReactNode; content: ReactNode }[]', required: true, description: 'Each item renders a native details with summary and content. Keep item order stable when content changes.' },
      { name: 'className', type: 'string', description: 'Additional class on the wrapping div.' },
    ], nativeProps: 'No general native attribute spread. Starts closed and is browser-controlled. No open/defaultOpen, exclusive, disabled or loading state API.',
    tokens: ['--t98-font', '--t98-border', '--t98-radius', '--t98-surface', '--t98-text', '--t98-muted', '--t98-accent'],
    accessibility: ['Tab focuses each summary; Enter or Space toggles it.', 'Native details/summary communicates expanded state and hides collapsed content.', 'Do not nest interactive buttons inside summary labels. Use a visible heading outside the group where needed.'],
    related: ['Card', 'SettingsSection'], example: accordionExample,
    states: [
      { name: 'Closed → expanded', description: 'Activate either summary to inspect the real expanded content and rotated chevron.', preview: <Accordion items={[{ title: 'What is shared?', content: 'Tokens, components and common interaction patterns.' }, { title: 'Where do business rules live?', content: 'In each consuming application.' }]} />, code: accordionExample },
      { name: 'Multiple expanded and keyboard focus', description: 'Open both items; each is independent. Tab and Space/Enter exercise actual focus and toggle states.', preview: <Accordion items={[{ title: 'What is shared?', content: 'Tokens, components and common interaction patterns.' }, { title: 'Where do business rules live?', content: 'In each consuming application.' }]} />, code: accordionExample },
    ],
  },
  {
    name: 'Icon', category: 'Data display', description: 'A bundled current-color stroke SVG with decorative and meaning-bearing modes.',
    usage: 'Use a bundled name for navigation, controls and status. Pair with visible text where possible; give icon-only buttons their own accessible action name.',
    props: [
      { name: 'name', type: 'IconName | (string & {})', required: true, description: 'Bundled icon name. Unknown strings render the components fallback glyph. Names include plus, search, check, x, copy, download, settings, users, shield, server, phone, workflow, send, calendar, target, billboard, link, image and chart. Lucide-derived glyphs are credited in THIRD_PARTY_NOTICES.md.' },
      { name: 'size', type: 'number', defaultValue: '18', description: 'Default SVG width and height in pixels. Native SVG width/height can override dimensions.' },
      { name: 'title', type: 'string', description: 'Adds an SVG title, role="img" and removes the default aria-hidden. Omit for decorative icons.' },
    ], nativeProps: 'SVGProps<SVGSVGElement> except native name; includes className, aria-* and stroke attributes. Uses a 24×24 viewBox and stroke=currentColor by default. No disabled, loading or selected state API.',
    tokens: [], accessibility: ['Decorative by default with aria-hidden=true.', 'Provide title when the standalone icon conveys information; label icon-only buttons with aria-label.', 'Icons inherit currentColor from their context rather than owning a semantic token.'],
    related: ['Button', 'Badge', 'AppIcon'], example: tsx(['Button', 'Icon'], '<Button variant="secondary" icon={<Icon name="download" />}>Export report</Button>'),
    states: [
      { name: 'Every bundled glyph', description: `${iconNames.length} main component glyphs, derived from the actual Icon source. AppIcon retains Campaign’s separate compatibility set; use its catalogue entry for those names.`, preview: <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--t98-space-4)' }}>{iconNames.map(name => <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--t98-space-2)' }}><Icon name={name} /><code>{name}</code></div>)}</div>, code: iconGalleryCode },
      { name: 'Decorative with visible text', description: 'The visible button text names the action; the SVG is decorative.', preview: <Button variant="secondary" icon={<Icon name="download" />}>Export report</Button>, code: tsx(['Button', 'Icon'], '<Button variant="secondary" icon={<Icon name="download" />}>Export report</Button>') },
      { name: 'Meaning-bearing image', description: 'A title names the standalone SVG image.', preview: <Icon name="shield" title="Protected workspace" size={24} />, code: tsx(['Icon'], '<Icon name="shield" title="Protected workspace" size={24} />') },
      { name: 'Icon-only button', description: 'The button has an action label independent of the decorative SVG.', preview: <Button variant="secondary" aria-label="Copy report link" icon={<Icon name="copy" />} />, code: tsx(['Button', 'Icon'], '<Button variant="secondary" aria-label="Copy report link" icon={<Icon name="copy" />} />') },
      { name: 'Custom size', description: 'Use size for both SVG dimensions.', preview: <Icon name="layers" title="Shared layers" size={32} />, code: tsx(['Icon'], '<Icon name="layers" title="Shared layers" size={32} />') },
      { name: 'Unknown name fallback', description: 'Unknown string names use the components glyph. Prefer the typed IconName union for known icons.', preview: <Icon name="unknown-name" title="Fallback icon" />, code: tsx(['Icon'], '<Icon name="unknown-name" title="Fallback icon" />') },
    ],
  },
];
