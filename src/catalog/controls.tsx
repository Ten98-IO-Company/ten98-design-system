import { useState, type ReactNode } from 'react';
import {
  AccountScopePicker, Button, CheckboxGroup, CodeBlock, Combobox, DateTimeField, Disclosure, FieldList, FileField, Fieldset, Field, Form, FormActions, Input, LoadMore, InlineCode, MediaPlayer, MultiCombobox, Pager, RadioGroup, Scroller, SegmentedControl, StatusLine, Text,
} from '../lib';
import type { ComboboxOption, FileItem } from '../lib';
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
const airports: ComboboxOption[] = [{ value: 'DXB', label: 'Dubai (DXB)' }, { value: 'DOH', label: 'Doha (DOH)' }, { value: 'RUH', label: 'Riyadh (RUH)' }, { value: 'AUH', label: 'Abu Dhabi (AUH)' }, { value: 'BAH', label: 'Bahrain (BAH)' }];
/** Stands in for an app search request: results arrive after a short delay, and "zz" fails. */
function useAirportSearch() {
  const [results, setResults] = useState<ComboboxOption[]>(airports);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout>>();
  function search(text: string) {
    clearTimeout(timer);
    setLoading(true); setLoadError(undefined);
    setTimer(setTimeout(() => {
      setLoading(false);
      if (text.toLowerCase() === 'zz') { setLoadError('Airports could not load. Try again.'); setResults([]); return; }
      setResults(airports.filter(option => option.label.toLowerCase().includes(text.toLowerCase())));
    }, 400));
  }
  return { results, loading, loadError, search };
}
function AsyncComboboxPreview() {
  const [value, setValue] = useState('');
  const { results, loading, loadError, search } = useAirportSearch();
  return <Combobox label="Airport" options={results} filter={false} loading={loading} loadError={loadError} onInputChange={search} value={value} onValueChange={setValue}
    valueLabel={airports.find(option => option.value === value)?.label} allowCustom={false} description='Type to search. "zz" shows a failed request.' />;
}
function MultiComboboxPreview({ async = false }: { async?: boolean }) {
  const [values, setValues] = useState<ComboboxOption[]>(airports.slice(0, 2));
  const { results, loading, loadError, search } = useAirportSearch();
  return async ? <MultiCombobox label="Destinations" options={results} filter={false} loading={loading} loadError={loadError} onInputChange={search} values={values} onValuesChange={setValues} name="destinations" />
    : <MultiCombobox label="Destinations" options={airports} values={values} onValuesChange={setValues} name="destinations" />;
}

function DateTimePreview({ zone = false }: { zone?: boolean }) {
  const [value, setValue] = useState('2026-10-20T09:30');
  return <DateTimeField label="Publish at" value={value} onValueChange={setValue} description="Posts go out at this time." timeZoneLabel={zone ? 'Asia/Dubai (GST)' : undefined} />;
}
function FilePreview({ withFiles = false }: { withFiles?: boolean }) {
  const [files, setFiles] = useState<FileItem[]>(withFiles ? [
    { id: 'a', name: 'brand-guidelines.pdf', size: 2411724, status: 'done' },
    { id: 'b', name: 'hero.png', size: 148200, status: 'uploading', progress: 42 },
    { id: 'c', name: 'broken.mov', size: 900, status: 'error', error: 'This file type is not supported.' },
  ] : []);
  return <FileField label="Attachments" accept="image/*,.pdf" multiple description="PDF or images." files={files}
    onFiles={added => setFiles([...files, ...added.map(file => ({ id: `${file.name}-${file.size}`, name: file.name, size: file.size, status: 'pending' as const }))])}
    onRemove={id => setFiles(files.filter(file => file.id !== id))} />;
}
/** A short silent WAV built in the browser, so the catalogue plays real audio without shipping a media file. */
function silentWav() {
  if (typeof URL.createObjectURL !== 'function') return undefined;
  const samples = 8000;
  const view = new DataView(new ArrayBuffer(44 + samples));
  const text = (offset: number, value: string) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + samples, true); text(8, 'WAVEfmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true); view.setUint32(28, 8000, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true); text(36, 'data'); view.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) view.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([view], { type: 'audio/wav' }));
}
const voiceNote = typeof window === 'undefined' ? undefined : silentWav();

const sample = "const total = items.reduce((sum, item) => sum + item.spend, 0);\nconsole.log(total);";

type Slot = { id: string; time: string };
function FieldListPreview({ bounded = false }: { bounded?: boolean }) {
  const [slots, setSlots] = useState<Slot[]>([{ id: 'a', time: '09:00' }, { id: 'b', time: '13:30' }]);
  const [next, setNext] = useState(3);
  const move = (from: number, to: number) => setSlots(current => { const copy = [...current]; copy.splice(to, 0, ...copy.splice(from, 1)); return copy; });
  return <FieldList legend="Posting times" name="slots" items={slots} getKey={slot => slot.id} addLabel="Add time" removeLabel={index => `Remove time ${index + 1}`}
    min={bounded ? 2 : 0} max={bounded ? 2 : undefined} emptyMessage="No posting times yet."
    onAdd={() => { setSlots(current => [...current, { id: `n${next}`, time: '' }]); setNext(next + 1); }}
    onRemove={index => setSlots(current => current.filter((_, position) => position !== index))} onMove={move}
    renderItem={(slot, index, { name, id }) => <Field label={`Time ${index + 1}`} htmlFor={id('time')}>
      <Input id={id('time')} name={name('time')} type="time" defaultValue={slot.time} />
    </Field>} />;
}
const scopeConnections = [
  { id: 'meta', label: 'Meta Business', detail: 'Connected 3 March' },
  { id: 'google', label: 'Google Ads', status: 'expired' as const },
];
const scopeAccounts = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `acct-${index + 1}`, label: `Ad account ${index + 1}`, detail: index === 0 ? 'Primary' : undefined, disabled: index === 1, disabledReason: index === 1 ? 'Suspended by the provider' : undefined }));
function AccountScopePreview({ count = 3, connected = 'meta', loading = false }: { count?: number; connected?: string; loading?: boolean }) {
  const [connectionId, setConnectionId] = useState(connected);
  const [accountId, setAccountId] = useState('');
  return <AccountScopePicker name="scope" connections={scopeConnections} accounts={loading ? null : scopeAccounts(count)} connectionId={connectionId} accountId={accountId}
    onConnectionChange={setConnectionId} onAccountChange={setAccountId} onConnect={() => undefined} />;
}

function FormPreview() {
  const [status, setStatus] = useState('');
  const [count, setCount] = useState(0);
  return <Form onSubmit={async data => { setCount(value => value + 1); await new Promise(resolve => setTimeout(resolve, 1200)); setStatus(`Saved ${String(data.get('name'))} (${count + 1} submit)`); }}>
    <Field label="Project name"><Input name="name" required defaultValue="Spring launch" /></Field>
    <FormActions><Button type="submit">Save</Button></FormActions>
    <StatusLine>{status}</StatusLine>
  </Form>;
}

export const controlEntries: ComponentEntry[] = [
  entry('Disclosure', 'Layout', 'A native details/summary section that can sit beside actions.', 'Use for optional or advanced content. Leave `open` unset for self-managed state, or pass `open` with `onOpenChange` to control it.',
    [prop('summary', 'ReactNode', 'Always-visible heading text.', true), prop('open', 'boolean', 'Controlled expanded state.'), prop('onOpenChange', '(open: boolean) => void', 'Called with the next state when the summary is activated.'), prop('defaultOpen', 'boolean', 'Initial state when uncontrolled.', false, 'false'), prop('variant', "'boxed' | 'plain'", 'Bordered panel or bare heading and body.', false, "'boxed'"), prop('actions', 'ReactNode', 'Buttons beside the summary, rendered outside the summary element.')],
    ['--t98-border', '--t98-surface', '--t98-radius', '--t98-accent', '--t98-subtle', '--t98-space-3'],
    ['Uses native details and summary, so Enter and Space toggle it.', 'Actions are siblings of the summary, never nested inside it.'],
    ['Fieldset', 'Button'],
    [state('Uncontrolled', 'Starts open and manages its own state.', ['Button', 'Disclosure', 'Text'], '<Disclosure\n  summary="Advanced settings"\n  defaultOpen\n  actions={<Button variant="secondary" size="sm">Reset</Button>}\n>\n  <Text tone="muted">Retry limits and delivery windows.</Text>\n</Disclosure>', <DisclosurePreview />),
      state('Controlled', 'The parent owns the open state.', ['Button', 'Disclosure', 'Text'], '<Disclosure\n  summary="Advanced settings"\n  open={open}\n  onOpenChange={setOpen}\n  actions={<Button variant="secondary" size="sm">Reset</Button>}\n>\n  <Text tone="muted">Retry limits and delivery windows.</Text>\n</Disclosure>', <DisclosurePreview controlled />, 'const [open, setOpen] = useState(true);', ['useState'])]),
  entry('Form', 'Controls', 'A native form that locks its controls while a submit is pending and ignores repeat submits.', 'Use for every app form instead of a raw form element. With onSubmit, it prevents navigation and calls you once with FormData (including the submitter); without onSubmit it posts natively. busy locks it while app state is pending. Native validation still runs before onSubmit.',
    [prop('onSubmit', '(data: FormData, event) => void | Promise<void>', 'Called once per submit; repeat submits are ignored until it settles.'), prop('busy', 'boolean', 'App-owned pending state; locks the form.', false, 'false'), prop('gap', 'Space', 'Gap between direct children.', false, '4')],
    ['--t98-space-4'],
    ['Controls are disabled through a native fieldset while pending, and the form is aria-busy.', 'Focus returns to the submitting control when the lock lifts, if focus was lost.', 'Validation messages stay the job of Field error and native constraints.'],
    ['Field', 'FormActions', 'FormGrid'],
    [state('Single submit', 'Submit twice quickly: the second press is ignored while the first is pending.', ['Form', 'Field', 'Input', 'Button', 'FormActions', 'StatusLine'], '<Form onSubmit={async data => { await save(data); setStatus(`Saved ${data.get(\'name\')}`); }}>\n  <Field label="Project name"><Input name="name" required defaultValue="Spring launch" /></Field>\n  <FormActions><Button type="submit">Save</Button></FormActions>\n  <StatusLine>{status}</StatusLine>\n</Form>', <FormPreview />, "const [status, setStatus] = useState('');\nconst save = (data: FormData) => new Promise(resolve => setTimeout(resolve, 1200, data));", ['useState'])]),
  entry('LoadMore', 'Controls', 'Cursor-based "load more" with a count status, a busy state and an explicit reason when more cannot be loaded.', 'Use for inboxes, contact lists and event logs that page with a cursor. Pager stays for previous/next pages.',
    [prop('onLoadMore', '() => void', 'Loads the next page.', true), prop('hasMore', 'boolean', 'More items exist.', true), prop('busy', 'boolean', 'A page is loading; the button shows progress and ignores presses.'), prop('shown / total', 'number / number | null', 'Count status; total null when unknown.'), prop('itemLabel', 'string', 'Noun for the count.', false, "'items'"), prop('unavailableReason', 'ReactNode', 'Shown instead of the button when more exist but cannot be loaded.'), prop('endMessage', 'ReactNode', 'Shown when everything is loaded.', false, "'Everything is shown.'")],
    ['--t98-muted', '--t98-text-sm'],
    ['The count and loading state are a polite status.', 'The button stays focusable while loading, so focus is not lost.', 'An explicit reason replaces the button when the next page cannot be fetched.'],
    ['Pager', 'DataTable', 'ConversationThread'],
    [state('More available', 'Fifty of about 120 messages shown.', ['LoadMore'], '<LoadMore hasMore shown={50} total={120} itemLabel="messages" onLoadMore={loadOlder} />', <LoadMore hasMore shown={50} total={120} itemLabel="messages" onLoadMore={() => {}} />, 'const loadOlder = () => {};'),
      state('Cannot load more', 'The provider returned no cursor.', ['LoadMore'], '<LoadMore hasMore shown={50} itemLabel="contacts" unavailableReason="The provider did not return a cursor, so older contacts cannot be loaded." onLoadMore={() => {}} />', <LoadMore hasMore shown={50} itemLabel="contacts" unavailableReason="The provider did not return a cursor, so older contacts cannot be loaded." onLoadMore={() => {}} />),
      state('All shown', 'Nothing more to load.', ['LoadMore'], '<LoadMore hasMore={false} shown={12} total={12} itemLabel="events" onLoadMore={() => {}} />', <LoadMore hasMore={false} shown={12} total={12} itemLabel="events" onLoadMore={() => {}} />)]),
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
  entry('MediaPlayer', 'Data display', 'Native audio or video controls with a visible caption, captions tracks, a transcript and a fallback when the file cannot be played.', 'Use for voice notes, video replies and attachments in messages and asset details. Nothing autoplays and only metadata is preloaded. Supply `tracks` for video with speech and a `transcript` for audio. `unavailable` replaces the player for expired, processing or unauthorized media.',
    [prop('kind', "'audio' | 'video'", 'Player type.', true), prop('label', 'string', 'Visible caption and accessible name.', true), prop('src', 'string', 'Media URL.'), prop('type', 'string', 'MIME type, so the browser can skip formats it cannot play.'), prop('poster', 'string', 'Video poster image.'), prop('width', 'number', 'Intrinsic video width, reserving the aspect ratio.'), prop('height', 'number', 'Intrinsic video height.'), prop('tracks', 'readonly MediaTrack[]', 'WebVTT captions, subtitles, descriptions or chapters: src, srcLang, label, optional kind and default.'), prop('transcript', 'ReactNode', 'Text equivalent in a collapsed Transcript disclosure.'), prop('downloadHref', 'string', 'Download link offered when the file cannot be played.'), prop('unavailable', 'ReactNode', 'Reason shown instead of the player.')],
    ['--t98-text-sm', '--t98-muted', '--t98-subtle', '--t98-radius-sm'],
    ['The browser provides keyboard-operable controls; the element is named by `label`, which is also shown as the caption.', 'A playback failure replaces the player with text and the download link, so the attachment never disappears silently.', 'Captions tracks and the transcript disclosure give text equivalents (WCAG 1.2.1 and 1.2.2).'],
    ['ConversationThread', 'MediaStrip', 'FileField'],
    [state('Audio with transcript', 'A voice note with a transcript.', ['MediaPlayer'], '<MediaPlayer kind="audio" label="Voice note from Lina, 0:01" src="/media/voice-note.wav" type="audio/wav"\n  transcript="Hi, can you confirm the studio opening time?" />', <MediaPlayer kind="audio" label="Voice note from Lina, 0:01" src={voiceNote} type="audio/wav" transcript="Hi, can you confirm the studio opening time?" />),
      state('Cannot be played', 'The file failed to load, so the reason and a download link are shown.', ['MediaPlayer'], '<MediaPlayer kind="video" label="Video reply" src="/media/missing.mp4" type="video/mp4" downloadHref="/media/missing.mp4" />', <MediaPlayer kind="video" label="Video reply" src="data:video/mp4;base64,AAAA" type="video/mp4" downloadHref="#video-reply" />),
      state('Unavailable', 'The recording expired, so no player is rendered.', ['MediaPlayer'], '<MediaPlayer kind="video" label="Video reply" unavailable="This video expired on 1 October 2026." />', <MediaPlayer kind="video" label="Video reply" unavailable="This video expired on 1 October 2026." />)]),
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
      state('List only', 'A value outside the list shows the supplied error.', ['Combobox'], "<Combobox\n  label=\"City\"\n  options={['Dubai', 'Doha', 'Riyadh']}\n  value={value}\n  onValueChange={setValue}\n  allowCustom={false}\n  error=\"Choose a city from the list.\"\n/>", <ComboboxPreview strict />, "const [value, setValue] = useState('Dubai');", ['useState']),
      state('Async results', 'The app searches as the user types; results load, fail or are empty, and each state is announced.', ['Combobox', 'type ComboboxOption'], "<Combobox\n  label=\"Airport\"\n  options={results}\n  filter={false}\n  loading={loading}\n  loadError={loadError}\n  onInputChange={search}\n  value={value}\n  onValueChange={next => { setValue(next); setSelectedLabel(results.find(option => option.value === next)?.label); }}\n  valueLabel={selectedLabel}\n  allowCustom={false}\n/>", <AsyncComboboxPreview />, "const [value, setValue] = useState('');\n// Keep the chosen label: it can leave the results when the user searches again.\nconst [selectedLabel, setSelectedLabel] = useState<string>();\nconst [results, setResults] = useState<ComboboxOption[]>([]);\nconst [loading, setLoading] = useState(false);\nconst [loadError, setLoadError] = useState<string>();\n// The app owns the request: debounce it, ignore stale responses and word the failure.\nasync function search(text: string) {\n  setLoading(true);\n  setLoadError(undefined);\n  try {\n    const response = await fetch(`/api/airports?q=${encodeURIComponent(text)}`);\n    setResults(await response.json());\n  } catch {\n    setLoadError('Airports could not load. Try again.');\n  } finally {\n    setLoading(false);\n  }\n}", ['useState'])]),
  entry('MultiCombobox', 'Controls', 'Pick several listed options from a filtered list; picks show as removable tags.', 'Use for tags, destinations, audiences or recipients chosen from a known or searched list. Values are option objects, so tags keep their labels when async results change. For a short fixed list use CheckboxGroup.',
    [prop('label', 'ReactNode', 'Field label.', true), prop('options', '{ value: string; label: string }[]', 'Options; typed text filters them unless `filter` is false.', true), prop('values', 'readonly ComboboxOption[]', 'Picked options, in pick order.', true), prop('onValuesChange', '(values: ComboboxOption[]) => void', 'Called with the new picks after an add or a removal.', true), prop('name', 'string', 'One hidden input per picked value under this name.'), prop('required', 'boolean', 'The input is marked required only while nothing is picked.'), prop('onInputChange', '(text: string) => void', 'Typed text for an app search; an empty string when the field closes after typing.'), prop('filter', 'boolean', 'False when the app already filtered `options`.', false, 'true'), prop('loading', 'boolean', 'Shows and announces Loading results; supplied options stay visible.'), prop('loadError', 'string', 'Shown and announced when results could not load.'), prop('description', 'ReactNode', 'Help text.'), prop('error', 'ReactNode', 'Error message.'), prop('emptyMessage', 'string', 'Shown when nothing matches.', false, "'No matches'")],
    ['--t98-subtle', '--t98-border', '--t98-radius-pill', '--t98-control-touch', '--t98-accent'],
    ['The listbox is aria-multiselectable; aria-selected and a check mark show picked options, and the highlighted option is named by aria-activedescendant.', 'Enter or a click toggles an option and keeps the list open; Backspace in the empty input removes the last pick; each tag has a Remove button named after its option.', 'Adds and removals are announced in a polite status; focus returns to the input after a removal.'],
    ['Combobox', 'CheckboxGroup'],
    [state('Local options', 'Two airports picked; type to filter and Enter to toggle.', ['MultiCombobox', 'type ComboboxOption'], '<MultiCombobox label="Destinations" options={airports} values={values} onValuesChange={setValues} name="destinations" />', <MultiComboboxPreview />, "const airports: ComboboxOption[] = [{ value: 'DXB', label: 'Dubai (DXB)' }, { value: 'DOH', label: 'Doha (DOH)' }];\nconst [values, setValues] = useState<ComboboxOption[]>([]);", ['useState']),
      state('Async options', 'Results come from an app search; tags keep their labels when results change.', ['MultiCombobox', 'type ComboboxOption'], '<MultiCombobox label="Destinations" options={results} filter={false} loading={loading}\n  loadError={loadError} onInputChange={search} values={values} onValuesChange={setValues} name="destinations" />', <MultiComboboxPreview async />, "const [values, setValues] = useState<ComboboxOption[]>([]);\nconst [results, setResults] = useState<ComboboxOption[]>([]);\nconst [loading, setLoading] = useState(false);\nconst [loadError, setLoadError] = useState<string>();\n// The app owns the request: debounce it, ignore stale responses and word the failure.\nasync function search(text: string) {\n  setLoading(true);\n  setLoadError(undefined);\n  try {\n    const response = await fetch(`/api/airports?q=${encodeURIComponent(text)}`);\n    setResults(await response.json());\n  } catch {\n    setLoadError('Airports could not load. Try again.');\n  } finally {\n    setLoading(false);\n  }\n}", ['useState'])]),
  entry('DateTimeField', 'Controls', 'A labelled native date, time or date-and-time input with an optional visible time zone.', 'Values are the native strings (`2026-10-20`, `09:30`, `2026-10-20T09:30`). Use `timeZoneLabel` to say which zone the entry means; the library never converts zones, validates ranges beyond min and max, or words errors.',
    [prop('label', 'ReactNode', 'Field label.', true), prop('value', 'string', 'Native input value, or an empty string.', true), prop('onValueChange', '(value: string) => void', 'Called with the native string as it changes.', true), prop('type', "'date' | 'time' | 'datetime-local'", 'Which native input to render.', false, "'datetime-local'"), prop('min', 'string', 'Earliest native value.'), prop('max', 'string', 'Latest native value.'), prop('step', 'number | string', 'Native step in seconds (or days for date).'), prop('required', 'boolean', 'Marks the field required.'), prop('name', 'string', 'Form field name.'), prop('description', 'ReactNode', 'Help text linked to the input.'), prop('error', 'ReactNode', 'Marks the input invalid and shows this message.'), prop('disabled', 'boolean', 'Disables the input.'), prop('timeZoneLabel', 'string', 'Visible zone text such as "Asia/Dubai (GST)", linked to the input by aria-describedby.')],
    ['--t98-control-border', '--t98-danger', '--t98-muted'],
    ['A visible label, description, error and time zone are all linked with aria-describedby.', 'Uses the browser’s native picker, so keyboard and assistive technology behavior is the platform’s.'],
    ['DateRangeField', 'Field', 'Input'],
    [state('Date and time', 'Local date and time with a visible zone.', ['DateTimeField'], '<DateTimeField\n  label="Publish at"\n  value={value}\n  onValueChange={setValue}\n  description="Posts go out at this time."\n  timeZoneLabel="Asia/Dubai (GST)"\n/>', <DateTimePreview zone />, "const [value, setValue] = useState('2026-10-20T09:30');", ['useState']),
      state('Without zone', 'The zone note is optional.', ['DateTimeField'], '<DateTimeField label="Publish at" value={value} onValueChange={setValue} />', <DateTimePreview />, "const [value, setValue] = useState('2026-10-20T09:30');", ['useState'])]),
  entry('FileField', 'Controls', 'A file chooser button with a drop zone and a list of the files being handled.', 'The field only reports chosen or dropped files through `onFiles` and renders the `files` you pass back. Uploads, type and size checks and removal are the caller’s. Drag and drop is an extra; the Choose files button always works.',
    [prop('label', 'ReactNode', 'Field label.', true), prop('onFiles', '(files: File[]) => void', 'Called with the chosen or dropped files (only the first when not `multiple`).', true), prop('accept', 'string', 'Native accept hint for the chooser. Dropped files are not filtered; check them in the caller.'), prop('multiple', 'boolean', 'Allows several files.'), prop('name', 'string', 'Form field name.'), prop('files', "{ id: string; name: string; size?: number; status?: 'pending' | 'uploading' | 'done' | 'error'; progress?: number; error?: string }[]", 'Files to list below, with size in B, KB or MB and a status. An uploading file shows `progress` (0-100) as a percentage, or an indeterminate bar when it is unknown.'), prop('onRemove', '(id: string) => void', 'Adds a Remove button named after each file.'), prop('description', 'ReactNode', 'Help text linked to the input.'), prop('error', 'ReactNode', 'Marks the field invalid and shows this message.'), prop('disabled', 'boolean', 'Disables the button and the drop zone.'), prop('busy', 'boolean', 'Shows the button as loading and ignores new files.')],
    ['--t98-control-border', '--t98-accent', '--t98-subtle', '--t98-border', '--t98-muted'],
    ['The Choose files button opens the native chooser, so no one needs drag and drop.', 'Added files are announced politely ("2 files added"). Remove buttons are named "Remove" plus the file name, and every target is at least 44px.'],
    ['Field', 'Progress', 'Badge'],
    [state('Empty', 'Waiting for files.', ['FileField'], '<FileField\n  label="Attachments"\n  accept="image/*,.pdf"\n  multiple\n  description="PDF or images."\n  onFiles={files => upload(files)}\n/>', <FilePreview />, 'const upload = (files: File[]) => console.log(files.length);'),
      state('With files', 'Done, uploading and failed files with remove buttons.', ['FileField', 'type FileItem'], '<FileField\n  label="Attachments"\n  multiple\n  files={files}\n  onFiles={addFiles}\n  onRemove={removeFile}\n/>', <FilePreview withFiles />, "const [files, setFiles] = useState<FileItem[]>([{ id: 'a', name: 'brand-guidelines.pdf', size: 2411724, status: 'done' }]);\nconst addFiles = (added: File[]) => setFiles([...files, ...added.map(file => ({ id: file.name, name: file.name, size: file.size, status: 'pending' as const }))]);\nconst removeFile = (id: string) => setFiles(files.filter(file => file.id !== id));", ['useState'])]),
  entry('Scroller', 'Layout', 'A horizontally scrolling region for wide tables and charts.', 'Wrap content wider than its container so the page itself never scrolls sideways. The label is required.',
    [prop('label', 'string', 'Accessible name for the region.', true), prop('children', 'ReactNode', 'The wide content.', true)],
    ['--t98-accent'], ['A labelled region that takes keyboard focus so arrow keys scroll it.'], ['CodeBlock', 'CheckboxGroup'],
    [state('Wide content', 'Content wider than the region scrolls sideways.', ['Scroller', 'Text'], '<Scroller label="Monthly spend">\n  <Text>Jan 1,204 · Feb 1,310 · Mar 1,198 · Apr 1,420 · May 1,377 · Jun 1,502 · Jul 1,466 · Aug 1,389</Text>\n</Scroller>', <Scroller label="Monthly spend"><Text>Jan 1,204 · Feb 1,310 · Mar 1,198 · Apr 1,420 · May 1,377 · Jun 1,502 · Jul 1,466 · Aug 1,389</Text></Scroller>)]),
  entry('FieldList', 'Controls', 'A fieldset of repeatable rows with add, remove and optional move buttons, focus management and a polite status.', 'Use for lists of the same small group of fields, such as posting times or links. The caller owns the items and every value; the list renders each row with `renderItem` and uses `helpers.name(field)` so native forms post `name.0.field`. Moving uses buttons, not drag.',
    [prop('legend', 'ReactNode', 'Group name.', true), prop('name', 'string', 'Prefix of the native field names.', true), prop('items', 'T[]', 'The rows.', true), prop('getKey', '(item: T) => string', 'Stable key of a row.', true), prop('renderItem', '(item: T, index: number, helpers: { index; count; name(field); id(field) }) => ReactNode', 'The fields of one row.', true), prop('onAdd', '() => void', 'Append a row.', true), prop('onRemove', '(index: number) => void', 'Remove a row.', true), prop('addLabel', 'string', 'Add button text.', true), prop('removeLabel', '(index: number) => string', 'Remove button text for a row.', true), prop('onMove', '(from: number, to: number) => void', 'Adds Move up and Move down buttons.'), prop('min', 'number', 'Fewest rows; Remove is disabled at the bound and the reason is shown.', false, '0'), prop('max', 'number', 'Most rows; Add is disabled at the bound and the reason is shown.'), prop('emptyMessage', 'string', 'Shown when there are no rows.', false, "'No items yet.'"), prop('error', 'ReactNode', 'Group-level message.'), prop('description', 'ReactNode', 'Help text.'), prop('disabled', 'boolean', 'Disables every control.'), prop('labels', 'Partial<FieldListLabels>', 'Replaces the built-in English status text, row headings and move labels.')],
    ['--t98-border', '--t98-surface', '--t98-space-3', '--t98-radius'],
    ['Built on a native fieldset and legend; each row is a list item with a visually hidden heading such as "Item 2 of 5".', 'After Add, focus moves to the new row’s first field; after Remove, to the next row’s first field or the Add button. A polite status announces "Item added", "Item removed" and "Moved to position N".', 'Move keeps focus on the moved row’s button. Every button is at least 44px.'],
    ['Fieldset', 'Field', 'Button'],
    [state('Reorderable', 'Add, remove and move rows.', ['Field', 'FieldList', 'Input'], "<FieldList\n  legend=\"Posting times\"\n  name=\"slots\"\n  items={slots}\n  getKey={slot => slot.id}\n  addLabel=\"Add time\"\n  removeLabel={index => `Remove time ${index + 1}`}\n  onAdd={() => setSlots([...slots, { id: String(slots.length + 1), time: '' }])}\n  onRemove={index => setSlots(slots.filter((_, position) => position !== index))}\n  onMove={(from, to) => setSlots(move(slots, from, to))}\n  renderItem={(slot, index, { name, id }) => (\n    <Field label={`Time ${index + 1}`} htmlFor={id('time')}>\n      <Input id={id('time')} name={name('time')} type=\"time\" defaultValue={slot.time} />\n    </Field>\n  )}\n/>", <FieldListPreview />,
      "type Slot = { id: string; time: string };\nconst [slots, setSlots] = useState<Slot[]>([{ id: 'a', time: '09:00' }, { id: 'b', time: '13:30' }]);\nconst move = (items: Slot[], from: number, to: number) => { const copy = [...items]; copy.splice(to, 0, ...copy.splice(from, 1)); return copy; };", ['useState']),
      state('At its bounds', 'With min and max of 2, Add and Remove are disabled and say why.', ['Field', 'FieldList', 'Input'], "<FieldList\n  legend=\"Posting times\"\n  name=\"slots\"\n  items={slots}\n  getKey={slot => slot.id}\n  min={2}\n  max={2}\n  addLabel=\"Add time\"\n  removeLabel={index => `Remove time ${index + 1}`}\n  onAdd={() => undefined}\n  onRemove={() => undefined}\n  renderItem={(slot, index, { name, id }) => (\n    <Field label={`Time ${index + 1}`} htmlFor={id('time')}>\n      <Input id={id('time')} name={name('time')} type=\"time\" defaultValue={slot.time} />\n    </Field>\n  )}\n/>", <FieldListPreview bounded />,
      "type Slot = { id: string; time: string };\nconst slots: Slot[] = [{ id: 'a', time: '09:00' }, { id: 'b', time: '13:30' }];")]),
  entry('AccountScopePicker', 'Controls', 'Choose a provider connection, then the account or ad account inside it.', 'The caller loads the accounts of the chosen connection (pass `null` while loading) and decides any default; changing the connection calls `onAccountChange("")` first. Up to six accounts are radio buttons; more use a list-only combobox, which leaves out disabled accounts.',
    [prop('connections', "{ id: string; label: string; status?: 'connected' | 'expired' | 'error'; detail?: ReactNode }[]", 'Available connections.', true), prop('accounts', '{ id: string; label: string; detail?: ReactNode; disabled?: boolean; disabledReason?: string }[] | null', 'Accounts of the chosen connection; null while loading.', true), prop('connectionId', 'string | null', 'Chosen connection.', true), prop('accountId', 'string | null', 'Chosen account.', true), prop('onConnectionChange', '(id: string) => void', 'Called with the new connection.', true), prop('onAccountChange', '(id: string) => void', 'Called with the chosen account, or an empty string when cleared.', true), prop('connectHref', 'string', 'Link shown when there are no connections, or to reconnect an expired one.'), prop('onConnect', '() => void', 'Button handler used instead of a link.'), prop('labels', 'Partial<AccountScopeLabels>', 'Replaces the built-in English text.'), prop('required', 'boolean', 'Marks the connection and the combobox required.'), prop('error', 'ReactNode', 'Message shown below the picker.'), prop('name', 'string', 'Native names `${name}.connection` and `${name}.account`.')],
    ['--t98-muted', '--t98-warning', '--t98-danger', '--t98-space-3'],
    ['Connection is a native select; an expired or errored connection shows a Badge with words and an explanation, and no accounts until it is fixed.', 'Loading is a polite status. Accounts are a native radio group or a list-only combobox with the standard keyboard model; disabled accounts show their reason.'],
    ['Select', 'RadioGroup', 'Combobox', 'StatusLine'],
    [state('Accounts', 'Three accounts as radio buttons, one disabled with a reason.', ['AccountScopePicker'], "<AccountScopePicker\n  name=\"scope\"\n  connections={connections}\n  accounts={accounts}\n  connectionId={connectionId}\n  accountId={accountId}\n  onConnectionChange={setConnectionId}\n  onAccountChange={setAccountId}\n/>", <AccountScopePreview />,
      "const connections = [{ id: 'meta', label: 'Meta Business', detail: 'Connected 3 March' }, { id: 'google', label: 'Google Ads', status: 'expired' as const }];\nconst accounts = [{ id: 'a1', label: 'Ad account 1' }, { id: 'a2', label: 'Ad account 2', disabled: true, disabledReason: 'Suspended by the provider' }, { id: 'a3', label: 'Ad account 3' }];\nconst [connectionId, setConnectionId] = useState('meta');\nconst [accountId, setAccountId] = useState('');", ['useState']),
      state('Many accounts', 'More than six accounts use the combobox.', ['AccountScopePicker'], "<AccountScopePicker\n  name=\"scope\"\n  connections={connections}\n  accounts={accounts}\n  connectionId=\"meta\"\n  accountId={accountId}\n  onConnectionChange={() => undefined}\n  onAccountChange={setAccountId}\n/>", <AccountScopePreview count={9} />,
      "const connections = [{ id: 'meta', label: 'Meta Business' }];\nconst accounts = Array.from({ length: 9 }, (_, index) => ({ id: `a${index + 1}`, label: `Ad account ${index + 1}` }));\nconst [accountId, setAccountId] = useState('');", ['useState']),
      state('Loading', 'Accounts are loading.', ['AccountScopePicker'], "<AccountScopePicker\n  connections={connections}\n  accounts={null}\n  connectionId=\"meta\"\n  accountId=\"\"\n  onConnectionChange={() => undefined}\n  onAccountChange={() => undefined}\n/>", <AccountScopePreview loading />,
      "const connections = [{ id: 'meta', label: 'Meta Business' }];"),
      state('Expired connection', 'The badge explains why no accounts are shown.', ['AccountScopePicker'], "<AccountScopePicker\n  connections={connections}\n  accounts={[]}\n  connectionId=\"google\"\n  accountId=\"\"\n  onConnectionChange={() => undefined}\n  onAccountChange={() => undefined}\n  onConnect={() => undefined}\n/>", <AccountScopePreview connected="google" />,
      "const connections = [{ id: 'google', label: 'Google Ads', status: 'expired' as const }];")]),
];
