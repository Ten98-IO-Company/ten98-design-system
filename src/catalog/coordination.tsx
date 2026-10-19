import { useId, useRef, useState } from 'react';
import { ConversationThread, DetailWorkspace, PublishingAgenda, type ConversationMessage, type PublishingAgendaEntry } from '../lib/coordination.js';
import { Badge, Button, Field, Textarea } from '../lib/primitives.js';
import { tsx, type ComponentEntry, type ComponentProp } from './model.js';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, required, defaultValue });
const surfaceTokens = ['--t98-font', '--t98-surface', '--t98-subtle', '--t98-text', '--t98-muted', '--t98-border', '--t98-radius', '--t98-space-2', '--t98-space-3', '--t98-space-4'];
type AgendaMode = 'default' | 'selected' | 'empty' | 'loading' | 'readonly' | 'error' | 'pending' | 'unknown';
const agendaStatuses: Record<AgendaMode, string> = { default: 'Approval required · version 3', selected: 'Approved version 3 · planned, not submitted', empty: '', loading: 'Retained snapshot · approval required', readonly: 'Approval required · read only', error: 'Retained snapshot · remote sync failed', pending: 'Provider schedule pending · receipt p-42', unknown: 'Schedule outcome unknown · reconcile before retry' };
function AgendaDemo({ mode = 'default' }: { mode?: AgendaMode }) {
  const [selectedId, setSelectedId] = useState<string | undefined>(mode === 'selected' ? 'opening' : undefined);
  const entries: PublishingAgendaEntry[] = [{ id: 'opening', title: 'Studio opening', when: '19 October 2026 · 13:30', dateTime: '2026-10-19T09:30:00Z', status: <Badge tone={mode === 'unknown' ? 'warning' : 'neutral'}>{agendaStatuses[mode]}</Badge>, details: <span>Main account · original record v3</span> }];
  return <><PublishingAgenda label="Publishing agenda" scope="Studio · 19 October 2026" timezoneLabel="Asia/Dubai · UTC+04:00" entries={mode === 'empty' ? [] : entries} selectedId={selectedId} onSelect={setSelectedId} loading={mode === 'loading'} readOnly={mode === 'readonly'} error={mode === 'error' ? 'Google overlay could not refresh. Existing app-resolved entries are retained.' : undefined} emptyMessage="No posts in this range. Adjust the app's date filter." /><p role="status">Selected item: {selectedId ?? 'none'}</p>{selectedId && <Button variant="secondary" onClick={() => setSelectedId(undefined)}>Clear selection</Button>}</>;
}
function agendaCode(mode: AgendaMode = 'default') {
  return tsx(['PublishingAgenda', 'Badge', 'Button', 'type PublishingAgendaEntry'], `<>
  <PublishingAgenda label="Publishing agenda" scope="Studio · 19 October 2026" timezoneLabel="Asia/Dubai · UTC+04:00"
    entries={${mode === 'empty' ? '[]' : 'entries'}} selectedId={selectedId} onSelect={setSelectedId}${mode === 'loading' ? ' loading' : ''}${mode === 'readonly' ? ' readOnly' : ''}${mode === 'error' ? ' error="Google overlay could not refresh. Existing app-resolved entries are retained."' : ''}
    emptyMessage="No posts in this range. Adjust the app's date filter." />
  <p role="status">Selected item: {selectedId ?? 'none'}</p>
  {selectedId && <Button variant="secondary" onClick={() => setSelectedId(undefined)}>Clear selection</Button>}
</>`, `const [selectedId, setSelectedId] = useState<string | undefined>(${mode === 'selected' ? "'opening'" : 'undefined'});
const entries: PublishingAgendaEntry[] = [{
  id: 'opening', title: 'Studio opening', when: '19 October 2026 · 13:30', dateTime: '2026-10-19T09:30:00Z',
  status: <Badge tone="${mode === 'unknown' ? 'warning' : 'neutral'}">${agendaStatuses[mode]}</Badge>,
  details: <span>Main account · original record v3</span>,
}];`, ['useState']);
}

type DetailMode = 'empty' | 'selected' | 'narrow' | 'loading' | 'error';
function DetailDemo({ mode = 'selected' }: { mode?: DetailMode }) {
  const id = useId();
  const returnFocus = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState(mode !== 'empty');
  const [draft, setDraft] = useState('Draft remains in the app while returning to the list.');
  return <div style={mode === 'narrow' ? { maxWidth: '21rem' } : undefined}><DetailWorkspace label="Inbox workspace" listLabel="Conversations" detailLabel="Studio opening conversation" selected={selected} onBack={() => { setSelected(false); requestAnimationFrame(() => returnFocus.current?.focus()); }}
    list={<Button ref={returnFocus} variant="secondary" aria-pressed={selected} onClick={() => setSelected(true)}>Open studio conversation</Button>}
    detail={<><p>{mode === 'loading' ? 'Loading new messages. Previous context is retained.' : mode === 'error' ? 'Latest messages could not refresh. Your draft is retained.' : 'Message context supplied by the app.'}</p><Field htmlFor={id} label="App-owned reply draft"><Textarea value={draft} onChange={event => setDraft(event.target.value)} /></Field><Button variant="ghost" onClick={() => { setSelected(false); requestAnimationFrame(() => returnFocus.current?.focus()); }}>Return to conversations</Button></>} />
    <p role="status">{selected ? 'Conversation selected.' : 'No conversation selected.'} Retained draft: {draft || '(empty)'}</p></div>;
}
function detailCode(mode: DetailMode = 'selected') {
  return tsx(['DetailWorkspace', 'Button', 'Field', 'Textarea'], `<div${mode === 'narrow' ? ' style={{ maxWidth: \'21rem\' }}' : ''}>
  <DetailWorkspace label="Inbox workspace" listLabel="Conversations" detailLabel="Studio opening conversation" selected={selected}
    onBack={returnToList}
    list={<Button ref={returnFocus} variant="secondary" aria-pressed={selected} onClick={() => setSelected(true)}>Open studio conversation</Button>}
    detail={<>
      <p>${mode === 'loading' ? 'Loading new messages. Previous context is retained.' : mode === 'error' ? 'Latest messages could not refresh. Your draft is retained.' : 'Message context supplied by the app.'}</p>
      <Field htmlFor={id} label="App-owned reply draft"><Textarea value={draft} onChange={event => setDraft(event.target.value)} /></Field>
      <Button variant="ghost" onClick={returnToList}>Return to conversations</Button>
    </>} />
  <p role="status">{selected ? 'Conversation selected.' : 'No conversation selected.'} Retained draft: {draft || '(empty)'}</p>
</div>`, `const id = useId();
const returnFocus = useRef<HTMLButtonElement>(null);
const [selected, setSelected] = useState(${mode !== 'empty'});
const [draft, setDraft] = useState('Draft remains in the app while returning to the list.');
function returnToList() {
  // Guard unsaved work here when required by your app.
  setSelected(false);
  requestAnimationFrame(() => returnFocus.current?.focus());
}`, ['useId', 'useRef', 'useState']);
}

type ConversationMode = 'default' | 'empty' | 'loading' | 'readonly' | 'error' | 'pending' | 'unknown';
const threadStatus: Record<ConversationMode, string> = { default: 'History supplied by the app.', empty: 'No matching messages in this local example.', loading: 'Sync pending. Displayed history is retained.', readonly: 'Reply permission unavailable.', error: 'Attachment failed. Draft is retained.', pending: 'Reply pending · receipt r-19. Inspect before another send.', unknown: 'Reply outcome unknown. Reconcile receipt r-19 before retrying.' };
const sampleMessages: ConversationMessage[] = [
  { id: 'public-1', author: 'Studio visitor', time: '19 October · 13:00 Dubai', dateTime: '2026-10-19T09:00:00Z', visibility: 'public', content: 'What time does the studio open?' },
  { id: 'private-1', author: 'Studio visitor', time: '19 October · 13:02 Dubai', dateTime: '2026-10-19T09:02:00Z', visibility: 'private', content: 'Please send the appointment details privately.' },
  { id: 'note-1', author: 'Studio teammate', time: '19 October · 13:03 Dubai', dateTime: '2026-10-19T09:03:00Z', visibility: 'note', content: 'Confirm the opening time before replying.' },
];
function ConversationDemo({ mode = 'default' }: { mode?: ConversationMode }) {
  const id = useId();
  const [draft, setDraft] = useState('We will confirm the opening time.');
  const [receipt, setReceipt] = useState('');
  return <ConversationThread label="Studio opening conversation" messages={mode === 'empty' ? [] : sampleMessages} loading={mode === 'loading'} readOnly={mode === 'readonly'} status={<p role="status">{receipt || threadStatus[mode]}</p>} error={mode === 'error' ? 'The attachment was not sent. Review it before any app-authorized retry.' : undefined}
    composer={<form onSubmit={event => { event.preventDefault(); setReceipt('Local draft preview recorded. No provider send was attempted.'); }}><Field htmlFor={id} label="Public reply draft"><Textarea value={draft} onChange={event => setDraft(event.target.value)} /></Field><Button type="submit" disabled={!draft.trim() || mode === 'pending' || mode === 'unknown'}>Preview local reply</Button><p>The app owns reply eligibility, attachments and sending. This example retains its draft.</p></form>} />;
}
function conversationCode(mode: ConversationMode = 'default') {
  return tsx(['ConversationThread', 'Button', 'Field', 'Textarea', 'type ConversationMessage'], `<ConversationThread label="Studio opening conversation" messages={${mode === 'empty' ? '[]' : 'messages'}}${mode === 'loading' ? ' loading' : ''}${mode === 'readonly' ? ' readOnly' : ''}
  status={<p role="status">{receipt || ${JSON.stringify(threadStatus[mode])}}</p>}${mode === 'error' ? ' error="The attachment was not sent. Review it before any app-authorized retry."' : ''}
  composer={<form onSubmit={event => { event.preventDefault(); setReceipt('Local draft preview recorded. No provider send was attempted.'); }}>
    <Field htmlFor={id} label="Public reply draft"><Textarea value={draft} onChange={event => setDraft(event.target.value)} /></Field>
    <Button type="submit" disabled={!draft.trim()${mode === 'pending' || mode === 'unknown' ? ' || true' : ''}}>Preview local reply</Button>
    <p>The app owns reply eligibility, attachments and sending. This example retains its draft.</p>
  </form>} />`, `const id = useId();
const [draft, setDraft] = useState('We will confirm the opening time.');
const [receipt, setReceipt] = useState('');
const messages: ConversationMessage[] = ${JSON.stringify(sampleMessages, null, 2)};`, ['useId', 'useState']);
}

export const coordinationEntries: ComponentEntry[] = [
  {
    name: 'PublishingAgenda', category: 'Data display', description: 'Controlled agenda of app-resolved publishing and review records, with explicit scope and display timezone.',
    usage: 'Use as the narrow-screen calendar presentation or a publishing review list. The app formats dates, preserves instants, sorts entries, deduplicates Google overlays and owns calendar engines, schedules, approval versions and original record actions. Planned, approved and provider-scheduled remain independent app-supplied text.',
    props: [prop('label', 'string', 'Visible agenda heading and accessible section name.', true), prop('scope', 'string', 'Visible project, date range and filter scope.', true), prop('timezoneLabel', 'string', 'App-resolved display timezone; no conversion is performed.', true), prop('entries', 'readonly PublishingAgendaEntry[]', 'Stable id, title, when:string, optional dateTime, required status:ReactNode, optional details/actions:ReactNode. Rendered in supplied order.', true), prop('selectedId', 'string', 'Controlled selected record ID.'), prop('onSelect', '(id: string) => void', 'Requests selection through a native title button; no callback produces static headings.'), prop('loading', 'boolean', 'Announces loading and retains supplied entries; does not show empty content during initial load.', false, 'false'), prop('readOnly', 'boolean', 'Explains editing restrictions while retaining title inspection. App-supplied actions must enforce their own permissions.', false, 'false'), prop('error', 'ReactNode', 'Visible alert retaining usable entries.'), prop('emptyMessage', 'ReactNode', 'App-specific no-records or filtered-empty explanation.', false, 'No publishing items in this scope.'), prop('actions', 'ReactNode', 'App-owned scope or navigation actions.'), prop('className', 'string', 'Additional section class.')],
    tokens: [...surfaceTokens, '--t98-focus', '--t98-control-touch'], accessibility: ['Labelled section and ordered list preserve the app-resolved reading order. Visible display timezone accompanies unmodified time labels.', 'Native title buttons expose selection with aria-pressed and support Tab, Enter and Space. Entry actions remain siblings, avoiding nested buttons.', 'Loading uses aria-busy and a status message; errors are alerts. Neither clears supplied entries.', 'Rows and action slots wrap on narrow screens. The agenda introduces no drag interaction or date validation.'], related: ['DetailWorkspace', 'Badge', 'DateRangeField'], example: agendaCode(),
    states: ([['Agenda', 'default', 'Select a record through its native title button.'], ['Selected review', 'selected', 'Controlled selection highlights the exact app-supplied version.'], ['Empty range', 'empty', 'No records has a distinct scope-specific explanation.'], ['Loading with retained items', 'loading', 'Previous entries stay visible during refresh.'], ['Read only', 'readonly', 'Readable records retain selection for inspection; editing actions remain unavailable.'], ['Partial sync error', 'error', 'A failed Google overlay refresh retains app-resolved entries.'], ['Schedule pending', 'pending', 'App-supplied receipt remains distinct from planned time.'], ['Unknown schedule outcome', 'unknown', 'No automatic retry is offered for an uncertain result.']] as const).map(([name, mode, description]) => ({ name, description, preview: <AgendaDemo mode={mode} />, code: agendaCode(mode) })),
  },
  {
    name: 'DetailWorkspace', category: 'Layout', description: 'Controlled list/detail workspace with two desktop panes and a labelled narrow-screen back path.',
    usage: 'Use for inbox and publishing record details. The app owns selection, routing, draft storage and unsaved-work guards. Both slots remain mounted while selection changes; narrow layouts hide the inactive pane with CSS. App onBack restores focus after committing its selection change. A changing detail slot must retain per-record drafts in app state.',
    props: [prop('label', 'string', 'Visible workspace heading.', true), prop('listLabel', 'string', 'Accessible list-pane heading.', true), prop('detailLabel', 'string', 'Accessible detail-pane heading, ideally naming the selected record.', true), prop('list', 'ReactNode', 'App-owned selectable list, filters and list states.', true), prop('detail', 'ReactNode', 'App-owned detail, composer and loading/error states; retained in the DOM when deselected.', true), prop('selected', 'boolean', 'Explicitly chooses the detail or list pane on narrow screens; never inferred from slot truthiness.', true), prop('onBack', '() => void', 'App guards draft, clears selection and restores list focus; callback does not automatically change selected.', true), prop('backLabel', 'string', 'Visible narrow-screen back-button text.', false, 'Back to list'), prop('emptyMessage', 'ReactNode', 'Desktop detail placeholder when no record is selected.', false, 'Select an item to see its details.'), prop('className', 'string', 'Additional workspace class.')],
    tokens: [...surfaceTokens, '--t98-focus', '--t98-control-touch'], accessibility: ['Workspace and panes have linked visible headings. Native Back button is shown with selected details at narrow widths.', 'Inactive narrow pane uses display:none; deselected detail content uses hidden, keeping controls outside keyboard and accessibility navigation while retaining DOM state.', 'Selection changes that hide or remove the focused control fall back to the visible pane heading. Initial and visible app focus are preserved. App callbacks own guards and restoration to the originating list control; Escape never bypasses confirmation.', 'At narrow container widths only the selected pane is shown. Empty selection keeps the list usable; desktop shows a detail placeholder.'], related: ['PublishingAgenda', 'ConversationThread', 'ResourceCard'], example: detailCode(),
    states: ([['Selected desktop', 'selected', 'Edit a draft, return to the list and reopen it; draft remains controlled by this example.'], ['No selection', 'empty', 'The list is available with an explicit desktop detail placeholder.'], ['Narrow with back', 'narrow', 'A 21rem wrapper demonstrates one pane and a labelled Back action; reopening preserves the draft.'], ['Loading detail', 'loading', 'App-owned loading content preserves the reply draft.'], ['Detail refresh error', 'error', 'App-owned failure context leaves the draft available.']] as const).map(([name, mode, description]) => ({ name, description, preview: <DetailDemo mode={mode} />, code: detailCode(mode) })),
  },
  {
    name: 'ConversationThread', category: 'Data display', description: 'Readonly conversation history with explicit public, private and internal-note labels and an app-owned composer slot.',
    usage: 'Use within inbox details after the app resolves message order, authorization and provenance. Message labels describe supplied history and do not enable notes or assignment in Campaign. App owns drafts, recipients, send windows, templates, attachments, pending keys, receipt reconciliation and supported actions. Unknown sends require app reconciliation before retry.',
    props: [prop('label', 'string', 'Visible conversation title and accessible section name.', true), prop('messages', 'readonly ConversationMessage[]', 'Stable id, author:string, time:string, optional dateTime, visibility:public | private | note, content:ReactNode, optional attachments/status:ReactNode. Rendered without sorting.', true), prop('composer', 'ReactNode', 'App-owned, visibly labelled form with its own submit, drafts and eligibility. No submit handler is added by the library.'), prop('status', 'ReactNode', 'Thread-level sync, permission or uncertain-send context; app chooses live announcement semantics.'), prop('loading', 'boolean', 'Announces loading and preserves supplied history.', false, 'false'), prop('readOnly', 'boolean', 'Shows a reply restriction and hides the mounted composer. App still enforces permission at send boundaries.', false, 'false'), prop('error', 'ReactNode', 'Visible alert retaining messages and draft slot.'), prop('emptyMessage', 'ReactNode', 'Explanation for empty or filtered history.', false, 'No messages in this conversation.'), prop('className', 'string', 'Additional thread class.')],
    tokens: [...surfaceTokens, '--t98-info-soft', '--t98-warning-soft'], accessibility: ['Ordered history keeps author, formatted time and visible Public reply, Private message or Internal note text for every message. Distinction never relies on color.', 'Optional machine-readable dates pass through without localization. Attachments and status slots retain their app-supplied accessible labels.', 'History is not a live log, avoiding repeated announcements on mount. App can supply a focused status announcement for new or pending events.', 'Readonly composer stays mounted under hidden so it cannot receive keyboard focus. The app labels composer fields and buttons and preserves its draft across record changes.'], related: ['DetailWorkspace', 'Textarea', 'Alert', 'Badge'], example: conversationCode(),
    states: ([['Public, private and note', 'default', 'Edit and preview a local public reply; history labels do not change. No provider send runs.'], ['Empty history', 'empty', 'Empty message list is explicit while the app-owned draft remains.'], ['Loading history', 'loading', 'Messages and draft survive an app-supplied refresh state.'], ['Read only', 'readonly', 'Readable history is retained while the composer is hidden.'], ['Failed attachment', 'error', 'An app-supplied error retains history and text.'], ['Reply pending', 'pending', 'A pending receipt prevents the demo from offering another submission.'], ['Unknown send outcome', 'unknown', 'An explicit reconciliation message and disabled demo action distinguish uncertainty from failure.']] as const).map(([name, mode, description]) => ({ name, description, preview: <ConversationDemo mode={mode} />, code: conversationCode(mode) })),
  },
];
