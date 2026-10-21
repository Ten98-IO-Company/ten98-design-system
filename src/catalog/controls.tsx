import { useState, type ReactNode } from 'react';
import {
  Button, CheckboxGroup, CodeBlock, Combobox, DateTimeField, Disclosure, FileField, Fieldset, Field, Input, InlineCode, Pager, RadioGroup, Scroller, SegmentedControl, StatusLine, Text,
} from '../lib';
import type { FileItem } from '../lib';
import { tsx, type ComponentCategory, type ComponentEntry, type ComponentProp, type ComponentState } from './model';

const noElements = 'Applications use this instead of writing the native element, className or style.';
const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, ...(required && { required }), ...(defaultValue && { defaultValue }) });
const height = prop('maxHeight', "'sm' | 'md' | 'lg'", 'Limits the height (12, 20 or 32rem) and scrolls inside a labelled region that keyboard users can focus.');

function state(name: string, description: string, imports: string[], jsx: string, preview: ReactNode, setup = '', reactImports: string[] = []): ComponentState {
  return { name, description, preview, code: tsx(imports, jsx, setup, reactImports) };
}
function entry(name: string, category: ComponentCategory, description: string, usage: string, props: ComponentProp[], tokens: string[], accessibility: string[], related: string[], states: ComponentState[]): ComponentEntry {
  return { name, category, description, usage: `${usage} ${noElements}`, props, tokens, accessibility, related, example: states[0].code!, states };
}

const channels = [
  { value: 'email', label: 'Email', description: 'Sent from the campaign address.' },
  { value: 'social', label: 'Social' },
  { value: 'sms', label: 'SMS', disabled: true },
];
const channelsCode = "[\n  { value: 'email', label: 'Email', description: 'Sent from the campaign address.' },\n  { value: 'social', label: 'Social' },\n  { value: 'sms', label: 'SMS', disabled: true },\n]";

function DisclosurePreview({ controlled = false }: { controlled?: boolean }) {
  const [open, setOpen] = useState(true);
  return <Disclosure summary="Advanced settings" {...(controlled ? { open, onOpenChange: setOpen } : { defaultOpen: true })} actions={<Button variant="secondary" size="sm">Reset</Button>}>
    <Text tone="muted">Retry limits and delivery windows.</Text>
  </Disclosure>;
}
function RadioPreview({ error }: { error?: string }) {
  const [value, setValue] = useState('email');
  return <RadioGroup legend="Channel" name={error ? 'channel-error' : 'channel'} options={channels} value={value} onValueChange={setValue} error={error} />;
}
function CheckboxPreview() {
  const [value, setValue] = useState(['email']);
  return <CheckboxGroup legend="Destinations" options={channels} value={value} onValueChange={setValue} maxHeight="sm" />;
}
function SegmentedPreview() {
  const [value, setValue] = useState('week');
  return <SegmentedControl label="Range" value={value} onValueChange={setValue} options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />;
}
function ComboboxPreview({ strict = false }: { strict?: boolean }) {
  const [value, setValue] = useState(strict ? 'Dubai' : '');
  return <Combobox label="City" options={['Dubai', 'Doha', 'Riyadh']} value={value} onValueChange={setValue} allowCustom={!strict} error={strict ? 'Choose a city from the list.' : undefined} />;
}
function DateTimePreview({ zone = false }: { zone?: boolean }) {
  const [value, setValue] = useState('2026-10-20T09:30');
  return <DateTimeField label="Publish at" value={value} onValueChange={setValue} description="Posts go out at this time." timeZoneLabel={zone ? 'Asia/Dubai (GST)' : undefined} />;
}
function FilePreview({ withFiles = false }: { withFiles?: boolean }) {
  const [files, setFiles] = useState<FileItem[]>(withFiles ? [
    { id: 'a', name: 'brand-guidelines.pdf', size: 2411724, status: 'done' },
    { id: 'b', name: 'hero.png', size: 148200, status: 'uploading' },
    { id: 'c', name: 'broken.mov', size: 900, status: 'error', error: 'This file type is not supported.' },
  ] : []);
  return <FileField label="Attachments" accept="image/*,.pdf" multiple description="PDF or images." files={files}
    onFiles={added => setFiles([...files, ...added.map(file => ({ id: `${file.name}-${file.size}`, name: file.name, size: file.size, status: 'pending' as const }))])}
    onRemove={id => setFiles(files.filter(file => file.id !== id))} />;
}
const sample = "const total = items.reduce((sum, item) => sum + item.spend, 0);\nconsole.log(total);";

export const controlEntries: ComponentEntry[] = [
  entry('Disclosure', 'Layout', 'A native details/summary section that can sit beside actions.', 'Use for optional or advanced content. Leave `open` unset for self-managed state, or pass `open` with `onOpenChange` to control it.',
    [prop('summary', 'ReactNode', 'Always-visible heading text.', true), prop('open', 'boolean', 'Controlled expanded state.'), prop('onOpenChange', '(open: boolean) => void', 'Called with the next state when the summary is activated.'), prop('defaultOpen', 'boolean', 'Initial state when uncontrolled.', false, 'false'), prop('variant', "'boxed' | 'plain'", 'Bordered panel or bare heading and body.', false, "'boxed'"), prop('actions', 'ReactNode', 'Buttons beside the summary, rendered outside the summary element.')],
    ['--t98-border', '--t98-surface', '--t98-radius', '--t98-accent', '--t98-subtle', '--t98-space-3'],
    ['Uses native details and summary, so Enter and Space toggle it.', 'Actions are siblings of the summary, never nested inside it.'],
    ['Fieldset', 'Button'],
    [state('Uncontrolled', 'Starts open and manages its own state.', ['Button', 'Disclosure', 'Text'], '<Disclosure\n  summary="Advanced settings"\n  defaultOpen\n  actions={<Button variant="secondary" size="sm">Reset</Button>}\n>\n  <Text tone="muted">Retry limits and delivery windows.</Text>\n</Disclosure>', <DisclosurePreview />),
      state('Controlled', 'The parent owns the open state.', ['Button', 'Disclosure', 'Text'], '<Disclosure\n  summary="Advanced settings"\n  open={open}\n  onOpenChange={setOpen}\n  actions={<Button variant="secondary" size="sm">Reset</Button>}\n>\n  <Text tone="muted">Retry limits and delivery windows.</Text>\n</Disclosure>', <DisclosurePreview controlled />, 'const [open, setOpen] = useState(true);', ['useState'])]),
  entry('Fieldset', 'Layout', 'A native fieldset and legend that groups related fields.', 'Use when several fields answer one question. Hide the legend visually only when surrounding text already names the group.',
    [prop('legend', 'ReactNode', 'Group name announced with each control.', true), prop('description', 'ReactNode', 'Help text linked to the group.'), prop('disabled', 'boolean', 'Disables every control inside.'), prop('hideLegend', 'boolean', 'Keeps the legend for assistive technology but hides it visually.'), prop('layout', "'stack' | 'grid' | 'inline'", 'How children are arranged.', false, "'stack'"), prop('children', 'ReactNode', 'The grouped fields.', true)],
    ['--t98-text', '--t98-space-2', '--t98-space-3', '--t98-muted'],
    ['The legend names the group for screen readers; a hidden legend stays in the accessibility tree.', 'Disabled state is inherited natively by every contained control.'],
    ['RadioGroup', 'CheckboxGroup', 'Disclosure'],
    [state('Grid layout', 'Two related fields side by side.', ['Field', 'Fieldset', 'Input'], '<Fieldset legend="Schedule" description="Times use the account time zone." layout="grid">\n  <Field label="Start" htmlFor="start"><Input id="start" type="time" /></Field>\n  <Field label="End" htmlFor="end"><Input id="end" type="time" /></Field>\n</Fieldset>',
      <Fieldset legend="Schedule" description="Times use the account time zone." layout="grid"><Field label="Start" htmlFor="catalog-fs-start"><Input id="catalog-fs-start" type="time" /></Field><Field label="End" htmlFor="catalog-fs-end"><Input id="catalog-fs-end" type="time" /></Field></Fieldset>),
      state('Disabled', 'All controls inside are unavailable.', ['Field', 'Fieldset', 'Input'], '<Fieldset legend="Schedule" disabled>\n  <Field label="Start" htmlFor="start"><Input id="start" type="time" /></Field>\n</Fieldset>',
        <Fieldset legend="Schedule" disabled><Field label="Start" htmlFor="catalog-fs-off"><Input id="catalog-fs-off" type="time" /></Field></Fieldset>)]),
  entry('RadioGroup', 'Controls', 'A labelled list of native radio buttons for one choice.', 'Use for two to seven mutually exclusive options. Pass `value` with `onValueChange` to control it, or `defaultValue` to let it manage itself.',
    [prop('legend', 'ReactNode', 'Group name.', true), prop('name', 'string', 'Form field name shared by the radios.', true), prop('options', '{ value: string; label: ReactNode; description?: ReactNode; disabled?: boolean }[]', 'The choices.', true), prop('value', 'string', 'Selected value (controlled).'), prop('defaultValue', 'string', 'Initial value when uncontrolled.'), prop('onValueChange', '(value: string) => void', 'Called when the selection changes.'), prop('orientation', "'vertical' | 'horizontal'", 'Direction of the list.', false, "'vertical'"), prop('error', 'ReactNode', 'Marks the group invalid and shows this message, linked by aria-describedby.'), prop('description', 'ReactNode', 'Help text linked to the group.'), prop('disabled', 'boolean', 'Disables every option.')],
    ['--t98-accent', '--t98-danger', '--t98-muted', '--t98-space-1'],
    ['Native radios give arrow-key selection within the group.', 'Each row is at least 44px tall. The error is announced and referenced by the group.'],
    ['CheckboxGroup', 'SegmentedControl', 'Fieldset'],
    [state('Selected', 'One option selected and one disabled.', ['RadioGroup'], `<RadioGroup\n  legend="Channel"\n  name="channel"\n  value={value}\n  onValueChange={setValue}\n  options={${channelsCode}}\n/>`, <RadioPreview />, "const [value, setValue] = useState('email');", ['useState']),
      state('Error', 'The group is invalid and the message is described.', ['RadioGroup'], `<RadioGroup\n  legend="Channel"\n  name="channel"\n  value={value}\n  onValueChange={setValue}\n  error="Choose a channel."\n  options={${channelsCode}}\n/>`, <RadioPreview error="Choose a channel." />, "const [value, setValue] = useState('email');", ['useState'])]),
  entry('CheckboxGroup', 'Controls', 'A labelled list of native checkboxes for several choices.', 'Use for multi-select lists. Set `maxHeight` for long lists so they scroll inside the group.',
    [prop('legend', 'ReactNode', 'Group name.', true), prop('options', '{ value: string; label: ReactNode; description?: ReactNode; disabled?: boolean }[]', 'The choices.', true), prop('value', 'string[]', 'Selected values.', true), prop('onValueChange', '(value: string[]) => void', 'Called with the next selection.', true), prop('name', 'string', 'Form field name for native submission.'), height, prop('orientation', "'vertical' | 'horizontal'", 'Direction of the list.', false, "'vertical'"), prop('error', 'ReactNode', 'Marks the group invalid and shows this message.'), prop('description', 'ReactNode', 'Help text linked to the group.'), prop('disabled', 'boolean', 'Disables every option.')],
    ['--t98-accent', '--t98-border', '--t98-radius', '--t98-muted'],
    ['A scrolling list is a labelled region that takes keyboard focus so it can be scrolled with arrow keys.', 'Each row is at least 44px tall.'],
    ['RadioGroup', 'Checkbox', 'Scroller'],
    [state('Scrolling list', 'A bounded list that scrolls inside the group.', ['CheckboxGroup'], `<CheckboxGroup\n  legend="Destinations"\n  value={value}\n  onValueChange={setValue}\n  maxHeight="sm"\n  options={${channelsCode}}\n/>`, <CheckboxPreview />, "const [value, setValue] = useState(['email']);", ['useState'])]),
  entry('SegmentedControl', 'Controls', 'A compact single-choice toggle group.', 'Use to switch a view or range in place, for example Day, Week or Month. Use RadioGroup when the choice is submitted with a form.',
    [prop('label', 'string', 'Accessible name for the group.', true), prop('options', '{ value: string; label: ReactNode; disabled?: boolean }[]', 'The segments.', true), prop('value', 'string', 'Selected value.', true), prop('onValueChange', '(value: string) => void', 'Called when a segment is chosen.', true)],
    ['--t98-accent', '--t98-on-accent', '--t98-control-border', '--t98-radius'],
    ['Each segment is a button with aria-pressed.', 'One tab stop; arrow keys, Home and End move focus and select. Segments are at least 44px.'],
    ['RadioGroup', 'Tabs'],
    [state('Week selected', 'Arrow keys move through the segments.', ['SegmentedControl'], "<SegmentedControl\n  label=\"Range\"\n  value={value}\n  onValueChange={setValue}\n  options={[\n    { value: 'day', label: 'Day' },\n    { value: 'week', label: 'Week' },\n    { value: 'month', label: 'Month' },\n  ]}\n/>", <SegmentedPreview />, "const [value, setValue] = useState('week');", ['useState'])]),
  entry('Pager', 'Navigation', 'Previous and next buttons with a status line, in a navigation landmark.', 'Omit `onPrevious` or `onNext` at the ends of the list to disable that button. Pass the visible range as `status`.',
    [prop('onPrevious', '() => void', 'Go back; absent disables the button.'), prop('onNext', '() => void', 'Go forward; absent disables the button.'), prop('label', 'string', 'Landmark name.', false, "'Pagination'"), prop('status', 'ReactNode', 'Position text such as "21–40 of 132", announced politely.'), prop('previousLabel', 'string', 'Previous button text.', false, "'Previous'"), prop('nextLabel', 'string', 'Next button text.', false, "'Next'")],
    ['--t98-muted', '--t98-space-3', '--t98-text-sm'],
    ['Rendered as a nav landmark with an accessible name.', 'The status is a polite live region. Buttons are at least 44px.'],
    ['Button', 'Breadcrumb'],
    [state('Middle page', 'Both directions are available.', ['Pager'], '<Pager status="21–40 of 132" onPrevious={() => {}} onNext={() => {}} />', <Pager status="21–40 of 132" onPrevious={() => undefined} onNext={() => undefined} />),
      state('First page', 'Previous is disabled.', ['Pager'], '<Pager status="1–20 of 132" onNext={() => {}} />', <Pager status="1–20 of 132" onNext={() => undefined} />)]),
  entry('CodeBlock', 'Data display', 'Preformatted code in a labelled, scrollable region, with an optional copy button.', 'Use for snippets, payloads and logs. `language` is a label only; no syntax highlighting is applied.',
    [prop('code', 'string', 'The source text.', true), prop('language', 'string', 'Label shown above the block and used in its accessible name.'), prop('label', 'string', 'Overrides the accessible name.'), prop('wrap', 'boolean', 'Wraps long lines instead of scrolling sideways.', false, 'false'), height, prop('copy', 'boolean', 'Adds a copy button.', false, 'false')],
    ['--t98-mono', '--t98-subtle', '--t98-border', '--t98-radius', '--t98-text-sm'],
    ['The block is a labelled region and takes focus so keyboard users can scroll it.', 'Copy confirmation is announced through a status region.'],
    ['InlineCode', 'CopyButton', 'Scroller'],
    [state('With copy', 'Language label and copy button.', ['CodeBlock'], `<CodeBlock language="ts" copy code={${JSON.stringify(sample)}} />`, <CodeBlock language="ts" copy code={sample} />),
      state('Wrapped and bounded', 'Wraps lines and scrolls past a maximum height.', ['CodeBlock'], `<CodeBlock wrap maxHeight="sm" code={${JSON.stringify(sample.repeat(6))}} />`, <CodeBlock wrap maxHeight="sm" code={sample.repeat(6)} />)]),
  entry('InlineCode', 'Data display', 'A short code fragment inside running text.', 'Use for identifiers, paths and values inside a sentence. Use CodeBlock for multiple lines.',
    [prop('children', 'ReactNode', 'The code text.', true)], ['--t98-mono', '--t98-subtle', '--t98-radius-sm'],
    ['Renders a native code element; long values wrap.'], ['CodeBlock', 'Text'],
    [state('In a sentence', 'Inline with body text.', ['InlineCode', 'Text'], '<Text>Set <InlineCode>retryLimit</InlineCode> before publishing.</Text>', <Text>Set <InlineCode>retryLimit</InlineCode> before publishing.</Text>)]),
  entry('StatusLine', 'Feedback', 'A single-line status message with an optional spinner.', 'Use for loading and result messages that do not need an Alert. Set `busy` while work is in progress.',
    [prop('children', 'ReactNode', 'The message.', true), prop('tone', "'neutral' | 'success' | 'warning' | 'danger' | 'info'", 'Message color; always pair it with words.', false, "'neutral'"), prop('busy', 'boolean', 'Shows a spinner and sets aria-busy.', false, 'false'), prop('live', "'polite' | 'assertive'", 'How urgently the update is announced.', false, "'polite'")],
    ['--t98-muted', '--t98-success', '--t98-danger', '--t98-warning', '--t98-info'],
    ['A status region (or alert when assertive) announces changes.', 'The spinner is decorative and stops under reduced motion.'],
    ['Alert', 'Progress', 'Skeleton'],
    [state('Busy', 'Work is in progress.', ['StatusLine'], '<StatusLine busy>Loading campaigns…</StatusLine>', <StatusLine busy>Loading campaigns…</StatusLine>),
      state('Error', 'An urgent failure.', ['StatusLine'], '<StatusLine tone="danger" live="assertive">Could not load campaigns.</StatusLine>', <StatusLine tone="danger" live="assertive">Could not load campaigns.</StatusLine>)]),
  entry('Combobox', 'Controls', 'An editable combobox: a text field with a filtered, keyboard-operable suggestion list.', 'Use when a value is usually one of a known list but may be typed. Set `allowCustom` to false and supply `error` to flag values outside the list.',
    [prop('label', 'ReactNode', 'Field label.', true), prop('options', 'string[] | { value: string; label: string }[]', 'Suggestions. Typed text filters them case-insensitively by containing text.', true), prop('value', 'string', 'Current value: an option value, or the typed text when it matches no option.', true), prop('onValueChange', '(value: string) => void', 'Called as the text changes, and with the option value when one is accepted.', true), prop('allowCustom', 'boolean', 'Whether values outside the list are acceptable. When false, leaving the field with such a value shows error and keeps the text.', false, 'true'), prop('error', 'ReactNode', 'Message shown for the field; with allowCustom false, only when the value is not an option.'), prop('description', 'ReactNode', 'Help text.'), prop('name', 'string', 'Form field name; a hidden input carries the value.'), prop('emptyMessage', 'string', 'Shown and announced when nothing matches.', false, "'No matches'"), prop('placeholder', 'string', 'Hint text; never a replacement for the label.'), prop('required', 'boolean', 'Marks the field required.'), prop('disabled', 'boolean', 'Disables the field.')],
    ['--t98-danger', '--t98-control-border', '--t98-muted'],
    ['A visible label, description and error are linked with aria-describedby.', 'Follows the WAI-ARIA editable combobox with list autocomplete: Down and Up move through options and wrap, Alt+Down opens, Enter accepts, Escape closes then clears, Tab closes without accepting.', 'DOM focus stays on the input; aria-activedescendant names the highlighted option, and a polite status announces the number of results.'],
    ['Field', 'Input', 'Select'],
    [state('Free text', 'Any value is accepted.', ['Combobox'], "<Combobox label=\"City\" options={['Dubai', 'Doha', 'Riyadh']} value={value} onValueChange={setValue} />", <ComboboxPreview />, "const [value, setValue] = useState('');", ['useState']),
      state('List only', 'A value outside the list shows the supplied error.', ['Combobox'], "<Combobox\n  label=\"City\"\n  options={['Dubai', 'Doha', 'Riyadh']}\n  value={value}\n  onValueChange={setValue}\n  allowCustom={false}\n  error=\"Choose a city from the list.\"\n/>", <ComboboxPreview strict />, "const [value, setValue] = useState('Dubai');", ['useState'])]),
  entry('DateTimeField', 'Controls', 'A labelled native date, time or date-and-time input with an optional visible time zone.', 'Values are the native strings (`2026-10-20`, `09:30`, `2026-10-20T09:30`). Use `timeZoneLabel` to say which zone the entry means; the library never converts zones, validates ranges beyond min and max, or words errors.',
    [prop('label', 'ReactNode', 'Field label.', true), prop('value', 'string', 'Native input value, or an empty string.', true), prop('onValueChange', '(value: string) => void', 'Called with the native string as it changes.', true), prop('type', "'date' | 'time' | 'datetime-local'", 'Which native input to render.', false, "'datetime-local'"), prop('min', 'string', 'Earliest native value.'), prop('max', 'string', 'Latest native value.'), prop('step', 'number | string', 'Native step in seconds (or days for date).'), prop('required', 'boolean', 'Marks the field required.'), prop('name', 'string', 'Form field name.'), prop('description', 'ReactNode', 'Help text linked to the input.'), prop('error', 'ReactNode', 'Marks the input invalid and shows this message.'), prop('disabled', 'boolean', 'Disables the input.'), prop('timeZoneLabel', 'string', 'Visible zone text such as "Asia/Dubai (GST)", linked to the input by aria-describedby.')],
    ['--t98-control-border', '--t98-danger', '--t98-muted'],
    ['A visible label, description, error and time zone are all linked with aria-describedby.', 'Uses the browser’s native picker, so keyboard and assistive technology behavior is the platform’s.'],
    ['DateRangeField', 'Field', 'Input'],
    [state('Date and time', 'Local date and time with a visible zone.', ['DateTimeField'], '<DateTimeField\n  label="Publish at"\n  value={value}\n  onValueChange={setValue}\n  description="Posts go out at this time."\n  timeZoneLabel="Asia/Dubai (GST)"\n/>', <DateTimePreview zone />, "const [value, setValue] = useState('2026-10-20T09:30');", ['useState']),
      state('Without zone', 'The zone note is optional.', ['DateTimeField'], '<DateTimeField label="Publish at" value={value} onValueChange={setValue} />', <DateTimePreview />, "const [value, setValue] = useState('2026-10-20T09:30');", ['useState'])]),
  entry('FileField', 'Controls', 'A file chooser button with a drop zone and a list of the files being handled.', 'The field only reports chosen or dropped files through `onFiles` and renders the `files` you pass back. Uploads, type and size checks and removal are the caller’s. Drag and drop is an extra; the Choose files button always works.',
    [prop('label', 'ReactNode', 'Field label.', true), prop('onFiles', '(files: File[]) => void', 'Called with the chosen or dropped files (only the first when not `multiple`).', true), prop('accept', 'string', 'Native accept hint for the chooser. Dropped files are not filtered; check them in the caller.'), prop('multiple', 'boolean', 'Allows several files.'), prop('name', 'string', 'Form field name.'), prop('files', "{ id: string; name: string; size?: number; status?: 'pending' | 'uploading' | 'done' | 'error'; error?: string }[]", 'Files to list below, with size in B, KB or MB and a status.'), prop('onRemove', '(id: string) => void', 'Adds a Remove button named after each file.'), prop('description', 'ReactNode', 'Help text linked to the input.'), prop('error', 'ReactNode', 'Marks the field invalid and shows this message.'), prop('disabled', 'boolean', 'Disables the button and the drop zone.'), prop('busy', 'boolean', 'Shows the button as loading and ignores new files.')],
    ['--t98-control-border', '--t98-accent', '--t98-subtle', '--t98-border', '--t98-muted'],
    ['The Choose files button opens the native chooser, so no one needs drag and drop.', 'Added files are announced politely ("2 files added"). Remove buttons are named "Remove" plus the file name, and every target is at least 44px.'],
    ['Field', 'Progress', 'Badge'],
    [state('Empty', 'Waiting for files.', ['FileField'], '<FileField\n  label="Attachments"\n  accept="image/*,.pdf"\n  multiple\n  description="PDF or images."\n  onFiles={files => upload(files)}\n/>', <FilePreview />, 'const upload = (files: File[]) => console.log(files.length);'),
      state('With files', 'Done, uploading and failed files with remove buttons.', ['FileField', 'type FileItem'], '<FileField\n  label="Attachments"\n  multiple\n  files={files}\n  onFiles={addFiles}\n  onRemove={removeFile}\n/>', <FilePreview withFiles />, "const [files, setFiles] = useState<FileItem[]>([{ id: 'a', name: 'brand-guidelines.pdf', size: 2411724, status: 'done' }]);\nconst addFiles = (added: File[]) => setFiles([...files, ...added.map(file => ({ id: file.name, name: file.name, size: file.size, status: 'pending' as const }))]);\nconst removeFile = (id: string) => setFiles(files.filter(file => file.id !== id));", ['useState'])]),
  entry('Scroller', 'Layout', 'A horizontally scrolling region for wide tables and charts.', 'Wrap content wider than its container so the page itself never scrolls sideways. The label is required.',
    [prop('label', 'string', 'Accessible name for the region.', true), prop('children', 'ReactNode', 'The wide content.', true)],
    ['--t98-accent'], ['A labelled region that takes keyboard focus so arrow keys scroll it.'], ['CodeBlock', 'CheckboxGroup'],
    [state('Wide content', 'Content wider than the region scrolls sideways.', ['Scroller', 'Text'], '<Scroller label="Monthly spend">\n  <Text>Jan 1,204 · Feb 1,310 · Mar 1,198 · Apr 1,420 · May 1,377 · Jun 1,502 · Jul 1,466 · Aug 1,389</Text>\n</Scroller>', <Scroller label="Monthly spend"><Text>Jan 1,204 · Feb 1,310 · Mar 1,198 · Apr 1,420 · May 1,377 · Jun 1,502 · Jul 1,466 · Aug 1,389</Text></Scroller>)]),
];
