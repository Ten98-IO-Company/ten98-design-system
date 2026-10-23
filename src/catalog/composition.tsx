import { useId, useState } from 'react';
import { ContentPreview, DestinationPicker, MediaStrip, SandboxedPreview, type DestinationAccount, type MediaItem } from '../lib/composition.js';
import { Field, Select, Textarea } from '../lib/primitives.js';
import { Image } from '../lib/structure.js';
import { tsx, type ComponentEntry, type ComponentProp } from './model.js';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, required, defaultValue });
const surfaceTokens = ['--t98-font', '--t98-surface', '--t98-text', '--t98-muted', '--t98-border', '--t98-radius', '--t98-space-3', '--t98-space-4'];
type Mode = 'default' | 'empty' | 'pending' | 'error' | 'readonly';
const storyImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 16'%3E%3Crect width='9' height='16' fill='%23f2c14e'/%3E%3Crect y='10' width='9' height='6' fill='%23ffffff'/%3E%3C/svg%3E";
const sampleEmail = '<body style="margin:0;font-family:Georgia,serif;color:#222;background:#fff"><div style="padding:24px"><h1 style="font-size:22px;margin:0 0 12px">Spring sale starts Monday</h1><p style="margin:0 0 12px">Thirty percent off studio sessions booked this week.</p><p style="margin:0"><a href="https://example.com/book" style="color:#0a58ca">Book a session</a></p></div></body>';
const accounts: DestinationAccount[] = [
  { id: 'studio-main', name: 'Studio — main account', provider: 'Social provider', description: 'Main account copy stays independent.' },
  { id: 'studio-regional', name: 'Studio — regional account', provider: 'Social provider', description: 'Regional account copy stays independent.' },
  { id: 'studio-paused', name: 'Studio — disconnected account', provider: 'Social provider', disabled: true, disabledReason: 'Reconnect this account before selecting it.' },
];
const destinationSetup = `const accounts: DestinationAccount[] = ${JSON.stringify(accounts, null, 2)};
const [selectedIds, setSelectedIds] = useState<string[]>(['studio-main']);`;
const destinationCode = (mode: Mode = 'default') => tsx(['DestinationPicker', 'type DestinationAccount'], `<>
  <DestinationPicker label="Destination accounts" accounts={${mode === 'empty' ? '[]' : 'accounts'}} selectedIds={selectedIds}
    onSelectionChange={setSelectedIds} description="Select exact accounts. Their saved copies remain independent."${mode === 'pending' ? ' pending' : ''}${mode === 'readonly' ? ' readOnly' : ''}${mode === 'error' ? ' error="The regional account could not be refreshed. Review its connection."' : ''} />
  <p role="status">Selected account IDs: {selectedIds.join(', ') || 'none'}</p>
</>`, destinationSetup, ['useState']);
function DestinationDemo({ mode = 'default' }: { mode?: Mode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(['studio-main']);
  return <><DestinationPicker label="Destination accounts" accounts={mode === 'empty' ? [] : accounts} selectedIds={selectedIds} onSelectionChange={setSelectedIds} description="Select exact accounts. Their saved copies remain independent." pending={mode === 'pending'} readOnly={mode === 'readonly'} error={mode === 'error' ? 'The regional account could not be refreshed. Review its connection.' : undefined} /><p role="status">Selected account IDs: {selectedIds.join(', ') || 'none'}</p></>;
}

const mediaItems: MediaItem[] = [
  { id: 'exterior', name: 'studio-exterior.svg', status: 'ready', altText: 'The studio entrance with its doors open.', url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3E%3Crect width='4' height='5' fill='%23c9d6e3'/%3E%3Crect x='1.4' y='2.4' width='1.2' height='2.6' fill='%235b6b7c'/%3E%3C/svg%3E", type: 'image/svg+xml', width: 1080, height: 1350, size: 48200 },
  { id: 'interior', name: 'studio-tour.mp4', status: 'pending', statusLabel: 'Processing pending', altText: 'A walk through the studio workroom.', type: 'video/mp4', width: 1080, height: 1920, duration: 42, size: 18400000 },
  { id: 'poster', name: 'opening-poster.pdf', status: 'error', altText: '', error: 'The app could not prepare this file. Choose a supported rendition.' },
];
const mediaSetup = (empty = false) => `const [items, setItems] = useState<MediaItem[]>(${empty ? '[]' : JSON.stringify(mediaItems, null, 2)});
function selectFiles(files: File[]) {
  setItems(current => [...current, ...files.map(file => ({
    id: crypto.randomUUID(), name: file.name, status: 'pending' as const,
    statusLabel: 'Selected locally; upload not connected', altText: '',
  }))]);
}`;
const mediaCode = (mode: Mode = 'default') => tsx(['MediaStrip', 'type MediaItem'], `<MediaStrip label="Draft media" items={items} onItemsChange={setItems} onFilesSelect={selectFiles}${mode === 'pending' ? ' pending' : ''}${mode === 'readonly' ? ' readOnly' : ''}${mode === 'error' ? ' error="One file needs attention. Other draft media is retained."' : ''} />`, mediaSetup(mode === 'empty'), ['useState']);
function MediaDemo({ mode = 'default' }: { mode?: Mode }) {
  const [items, setItems] = useState<MediaItem[]>(mode === 'empty' ? [] : mediaItems);
  return <MediaStrip label="Draft media" items={items} onItemsChange={setItems} pending={mode === 'pending'} readOnly={mode === 'readonly'} error={mode === 'error' ? 'One file needs attention. Other draft media is retained.' : undefined} onFilesSelect={files => setItems(current => [...current, ...files.map(file => ({ id: crypto.randomUUID(), name: file.name, status: 'pending' as const, statusLabel: 'Selected locally; upload not connected', altText: '' }))])} />;
}

type PreviewMode = 'default' | 'direct' | 'empty' | 'pending' | 'error';
const previewSetup = `const id = useId();
const [destination, setDestination] = useState('main');
const [copies, setCopies] = useState<Record<string, string>>({ main: 'Our studio opens this weekend.', regional: 'Join the regional studio opening on Saturday.' });`;
const previewCode = (mode: PreviewMode = 'default') => tsx(['ContentPreview', 'Field', 'Select', 'Textarea'], `<>
  <Field label="Preview account" htmlFor={id + '-account'}><Select value={destination} onChange={event => setDestination(event.target.value)}>
    <option value="main">Studio — main account</option><option value="regional">Studio — regional account</option>
  </Select></Field>
  <Field label="Copy for this account" htmlFor={id + '-copy'}><Textarea value={copies[destination]} onChange={event => setCopies(current => ({ ...current, [destination]: event.target.value }))} /></Field>
  <ContentPreview label="${mode === 'direct' ? 'Transactional message preview' : 'Account content preview'}" destination={destination === 'main' ? 'Studio — main account' : 'Studio — regional account'} provider="${mode === 'direct' ? 'Transactional email connection' : 'Social provider'}"${mode === 'empty' ? '' : ' text={copies[destination]}'}${mode === 'pending' ? ' pending' : ''}${mode === 'error' ? ' error="Preview metadata could not be refreshed. Review the retained copy."' : ''}
    footer={<span>${mode === 'direct' ? 'Audience, consent and send authorization are checked by the app.' : 'Effective account copy. Scheduling and readiness are checked by the app.'}</span>} />
</>`, previewSetup, ['useId', 'useState']);
function PreviewDemo({ mode = 'default' }: { mode?: PreviewMode }) {
  const id = useId();
  const [destination, setDestination] = useState('main');
  const [copies, setCopies] = useState<Record<string, string>>({ main: 'Our studio opens this weekend.', regional: 'Join the regional studio opening on Saturday.' });
  return <><Field label="Preview account" htmlFor={`${id}-account`}><Select value={destination} onChange={event => setDestination(event.target.value)}><option value="main">Studio — main account</option><option value="regional">Studio — regional account</option></Select></Field><Field label="Copy for this account" htmlFor={`${id}-copy`}><Textarea value={copies[destination]} onChange={event => setCopies(current => ({ ...current, [destination]: event.target.value }))} /></Field><ContentPreview label={mode === 'direct' ? 'Transactional message preview' : 'Account content preview'} destination={destination === 'main' ? 'Studio — main account' : 'Studio — regional account'} provider={mode === 'direct' ? 'Transactional email connection' : 'Social provider'} text={mode === 'empty' ? undefined : copies[destination]} pending={mode === 'pending'} error={mode === 'error' ? 'Preview metadata could not be refreshed. Review the retained copy.' : undefined} footer={<span>{mode === 'direct' ? 'Audience, consent and send authorization are checked by the app.' : 'Effective account copy. Scheduling and readiness are checked by the app.'}</span>} /></>;
}

export const compositionEntries: ComponentEntry[] = [
  {
    name: 'DestinationPicker', category: 'Controls', description: 'A controlled checklist of exact destination accounts with visible eligibility reasons.',
    usage: 'Use unique stable account IDs and keep each account’s caption, media and schedule in app state. Accounts sharing a provider remain separate. Selected IDs outside the visible list are preserved when another account is toggled. The app owns eligibility, credentials, validation and per-account variants. Pending or read-only locks changes while retaining selection.',
    props: [prop('label', 'string', 'Visible fieldset legend.', true), prop('accounts', 'readonly DestinationAccount[]', 'Each account has id, name, provider, optional description; disabled: true requires disabledReason.', true), prop('selectedIds', 'readonly string[]', 'Controlled selected account IDs.', true), prop('onSelectionChange', '(ids: string[]) => void', 'Receives a new selection; no copies or variants are modified.', true), prop('description', 'string', 'Help connected to the fieldset.'), prop('pending', 'boolean', 'Announces pending changes and disables checkboxes.', false, 'false'), prop('readOnly', 'boolean', 'Shows a read-only explanation and disables checkboxes.', false, 'false'), prop('error', 'string', 'App-owned error shown without clearing account selection.'), prop('emptyMessage', 'string', 'Context-specific message for no accounts.', false, 'No destination accounts available.'), prop('className', 'string', 'Additional root class.')],
    tokens: [...surfaceTokens, '--t98-accent', '--t98-control-border', '--t98-focus', '--t98-danger', '--t98-danger-soft'],
    accessibility: ['Native fieldset/legend and labelled checkboxes support Tab and Space.', 'Every disabled account retains its visible reason linked with aria-describedby.', 'Provider and exact account names are textual; shared providers never merge account identities.', 'Keep names and reasons wrapping at narrow widths; error and pending messages retain readable selections.'], related: ['Checkbox', 'Alert', 'ContentPreview'], example: destinationCode(),
    states: [
      { name: 'Selected and unavailable accounts', description: 'Toggle the regional account; the disconnected account has a native disabled checkbox and a visible reason.', preview: <DestinationDemo />, code: destinationCode() },
      { name: 'Empty', description: 'No available account records; the app can supply a connection action alongside the picker.', preview: <DestinationDemo mode="empty" />, code: destinationCode('empty') },
      { name: 'Pending', description: 'Selections are retained while changes are pending.', preview: <DestinationDemo mode="pending" />, code: destinationCode('pending') },
      { name: 'Partial error', description: 'Account context and readable selections remain beside the app-provided error.', preview: <DestinationDemo mode="error" />, code: destinationCode('error') },
      { name: 'Read only', description: 'Selection remains visible with all changes disabled.', preview: <DestinationDemo mode="readonly" />, code: destinationCode('readonly') },
    ],
  },
  {
    name: 'MediaStrip', category: 'Data display', description: 'Controlled draft media with file names, supplied previews, processing status, alt text and keyboard move controls.',
    usage: 'Supply unique stable IDs, full filenames, per-item status and app-rendered previews. Apply onItemsChange to local draft state; changes preserve other item metadata. Move controls change only the supplied order. A per-file pending status does not block local draft metadata edits; pending locks the whole strip during an app-owned mutation. Optional native file input reports files without reading, uploading, validating or authorizing them. Rights, storage, processing, approval invalidation and delivery references remain app-owned.',
    props: [prop('label', 'string', 'Visible heading and accessible region name.', true), prop('items', 'readonly MediaItem[]', 'Each item has id, name, status (ready/pending/unverified/error), altText, optional preview, statusLabel and error, and optional url, type (MIME), width, height, duration (seconds) and size (bytes). Without `preview`, an image, video or audio url is previewed; known dimensions, length and size are listed and missing ones are left out.', true), prop('onItemsChange', '(items: MediaItem[]) => void', 'Receives a new array after reorder, alt-text edit or removal; IDs remain unchanged.', true), prop('onFilesSelect', '(files: File[]) => void', 'Adds a labelled native multiple-file input when supplied. Receives raw files for app-owned handling.'), prop('accept', 'string', 'Native file-picker hint; the app must validate actual content.'), prop('pending', 'boolean', 'Disables all mutation controls while retaining items.', false, 'false'), prop('readOnly', 'boolean', 'Disables order/removal/file input and leaves alt text readable.', false, 'false'), prop('error', 'string', 'App-owned strip error; items remain visible.'), prop('emptyMessage', 'string', 'Context-specific empty-state message.', false, 'No media attached.'), prop('className', 'string', 'Additional root class.')],
    tokens: [...surfaceTokens, '--t98-subtle', '--t98-control-border', '--t98-focus', '--t98-success', '--t98-info', '--t98-danger', '--t98-space-2'],
    accessibility: ['Ordered list reflects controlled media order; filenames and statuses remain textual.', 'Labelled Move earlier/Move later buttons provide keyboard reordering and disable at their boundaries.', 'Alt-text fields have per-file labels and IDs stable across reordering.', 'Native file selection works without dragging. Read-only text remains focusable for inspection.', 'Stack media preview, metadata and wrapping controls on narrow screens; supplied previews must fit the available width.'], related: ['Field', 'Textarea', 'Button', 'Badge', 'ContentPreview'], example: mediaCode(),
    states: [
      { name: 'Ready, processing and failed media', description: 'Edit alt text, reorder or remove local items. Selecting files records their names locally; this demo has no upload or processing service.', preview: <MediaDemo />, code: mediaCode() },
      { name: 'Empty', description: 'Add media through the native file input.', preview: <MediaDemo mode="empty" />, code: mediaCode('empty') },
      { name: 'Metadata unverified', description: 'Unknown dimensions without an active job remain neutral and do not imply processing.', preview: <MediaStrip label="Unverified media" items={[{ id: 'unknown', name: 'uninspected-image.jpg', status: 'unverified', altText: '' }]} onItemsChange={() => {}} readOnly />, code: tsx(['MediaStrip'], '<MediaStrip label="Unverified media" items={[{ id: "unknown", name: "uninspected-image.jpg", status: "unverified", altText: "" }]} onItemsChange={() => {}} readOnly />') },
      { name: 'Pending change', description: 'App-owned mutation locks controls while retaining every item.', preview: <MediaDemo mode="pending" />, code: mediaCode('pending') },
      { name: 'Partial error', description: 'Failed media stays beside usable items and the strip-level explanation.', preview: <MediaDemo mode="error" />, code: mediaCode('error') },
      { name: 'Read only', description: 'Filenames, statuses and alt text remain readable.', preview: <MediaDemo mode="readonly" />, code: mediaCode('readonly') },
    ],
  },
  {
    name: 'ContentPreview', category: 'Data display', description: 'An approximate destination preview with supplied text, media and footer slots.',
    usage: 'Supply the effective content for the exact destination account. The component is read-only presentation; it does not count characters, fetch media, reproduce provider logos, sanitize arbitrary HTML or send content. Supply trusted React nodes and approved media rendering. The app owns validation, recipient policy, provenance, assets, scheduling and authorization; an approximate preview is not delivery evidence.',
    props: [prop('label', 'string', 'Visible preview heading and accessible region name.', true), prop('destination', 'string', 'Exact account, sender or destination identity.', true), prop('provider', 'string', 'Visible provider or connection identity.', true), prop('text', 'ReactNode', 'App-supplied effective text/content slot. Plain strings are escaped by React.'), prop('media', 'ReactNode', 'App-supplied authorized media; no URL fetching is performed.'), prop('footer', 'ReactNode', 'App-owned context, readiness or limitations.'), prop('chrome', "'card' | 'post' | 'story' | 'message'", 'Neutral layout approximating where the content appears; no platform logos, colours or trademarks.', false, "'card'"), prop('thread', 'readonly { id; text?; media? }[]', 'Later posts of a thread, numbered as a sequence.'), prop('captionLimit', 'number', 'Characters of a plain-text caption shown before Show full caption.'), prop('poll', '{ question?; options: string[]; duration? }', 'A poll attached to the post.'), prop('firstComment', 'ReactNode', 'The first comment posted with the content.'), prop('pending', 'boolean', 'Announces pending update while retaining supplied content.', false, 'false'), prop('error', 'string', 'App-owned preview error alongside retained content.'), prop('emptyMessage', 'string', 'Shown when neither text nor media is supplied.', false, 'No content supplied for this destination.'), prop('className', 'string', 'Additional root class.')],
    tokens: [...surfaceTokens, '--t98-subtle', '--t98-text-sm', '--t98-leading-normal', '--t98-danger', '--t98-danger-soft'],
    accessibility: ['Labelled region links a persistent, visible approximate-preview notice.', 'Destination and provider identity are text, with no invented platform branding.', 'Plain text preserves line breaks through the preview text styling; long content and media must fit narrow screens.', 'Pending updates and errors keep supplied content readable. Media-slot authors provide meaningful alternative text.'], related: ['DestinationPicker', 'MediaStrip', 'Alert'], example: previewCode(),
    states: [
      { name: 'Independent account copies', description: 'Switch accounts, edit the effective copy, then return to see each account’s separate draft.', preview: <PreviewDemo />, code: previewCode() },
      { name: 'Direct transactional message', description: 'The supplied footer keeps audience and send policy app-owned; provider eligibility is not inferred.', preview: <PreviewDemo mode="direct" />, code: previewCode('direct') },
      { name: 'Empty', description: 'A named destination without supplied content.', preview: <PreviewDemo mode="empty" />, code: previewCode('empty') },
      { name: 'Pending update', description: 'Previously supplied content stays visible while the app refreshes its preview.', preview: <PreviewDemo mode="pending" />, code: previewCode('pending') },
      { name: 'Error with retained content', description: 'The error does not erase the supplied effective copy.', preview: <PreviewDemo mode="error" />, code: previewCode('error') },
      { name: 'Thread with poll and first comment', description: 'A long caption is cut with Show full caption; later thread posts are numbered.', preview: <ContentPreview label="Studio thread" destination="Studio — main account" provider="Social connection" chrome="post" captionLimit={60}
          text="Our studio opens this weekend with a full programme of workshops, talks and late-night viewings for everyone." thread={[{ id: 't2', text: 'Saturday: workshops from 10:00.' }, { id: 't3', text: 'Sunday: talks from 14:00.' }]}
          poll={{ question: 'Which day will you come?', options: ['Saturday', 'Sunday'], duration: 'Poll closes in 1 day' }} firstComment="Tickets are free; reserve a place on our site." />,
        code: tsx(['ContentPreview'], `<ContentPreview label="Studio thread" destination="Studio — main account" provider="Social connection" chrome="post" captionLimit={60}
  text={caption} thread={[{ id: 't2', text: 'Saturday: workshops from 10:00.' }]}
  poll={{ question: 'Which day will you come?', options: ['Saturday', 'Sunday'], duration: 'Poll closes in 1 day' }}
  firstComment="Tickets are free; reserve a place on our site." />`, "const caption = 'Our studio opens this weekend with a full programme of workshops, talks and late-night viewings for everyone.';") },
      ...(['post', 'story', 'message'] as const).map(chrome => ({ name: chrome === 'post' ? 'Feed post layout' : chrome === 'story' ? 'Story layout (9:16)' : 'Direct message layout', description: chrome === 'story' ? 'Media fills a 9:16 frame and the text sits on a solid scrim, so its contrast never depends on the image.' : chrome === 'post' ? 'Avatar, account and provider above the copy and media, as in a feed.' : 'An outgoing message bubble aligned to the inline end.',
        preview: <ContentPreview label="Studio preview" destination="Studio — main account" provider="Social connection" chrome={chrome} text="Our studio opens this weekend." media={<Image src={storyImage} alt="The studio entrance at dusk" fit="cover" />} />,
        code: tsx(['ContentPreview', 'Image'], `<ContentPreview label="Studio preview" destination="Studio — main account" provider="Social connection" chrome="${chrome}"\n  text="Our studio opens this weekend." media={<Image src="/media/studio.jpg" alt="The studio entrance at dusk" fit="cover" />} />`) })),
    ],
  },
  {
    name: 'SandboxedPreview', category: 'Data display', description: 'Untrusted HTML, such as a rendered email, in a fully sandboxed frame that cannot run scripts or load from the network.',
    usage: 'Use for email and landing-page previews built from user or template content. The frame has every sandbox restriction and a content policy allowing only inline styles and data images; set allowRemoteImages to show https images once the viewer accepts that opening the preview contacts those hosts. Links and forms do nothing. The frame keeps a white canvas in dark themes, as mail clients do.',
    props: [prop('title', 'string', 'Visible heading and the frame name.', true), prop('html', 'string', 'Untrusted HTML document or fragment.'), prop('allowRemoteImages', 'boolean', 'Also allows https images (tracking pixels will load).', false, 'false'), prop('viewport', "'mobile' | 'desktop'", 'Frame width: 375 or 600px; scrolls sideways when wider than the space.', false, "'desktop'"), prop('height', "'sm' | 'md' | 'lg'", 'Frame height: 20, 32 or 48rem.', false, "'md'"), prop('notice', 'ReactNode', 'Context above the frame, such as subject, sender or an approximation notice.'), prop('unavailable', 'ReactNode', 'Shown instead of the frame.'), prop('className', 'string', 'Additional root class.')],
    tokens: [...surfaceTokens, '--t98-subtle', '--t98-focus'],
    accessibility: ['The frame is named by the visible title; its scroll container is a focusable, labelled region so keyboard users can scroll a wide frame.', 'Scripts, forms, popups, navigation by links and meta refresh are blocked; network loads are blocked by a content policy placed before any of the document.', 'Missing content shows the unavailable text rather than an empty frame.'],
    related: ['ContentPreview', 'ReplayViewer'], example: tsx(['SandboxedPreview'], '<SandboxedPreview title="Email preview: Spring sale" html={html} viewport="mobile"\n  notice="From Studio, to 1,204 subscribers. Approximate rendering." />', "const html = '<h1>Spring sale</h1><p>Thirty percent off this week.</p>';"),
    states: [
      { name: 'Desktop email', description: 'A 600px frame with an inline-styled email.', preview: <SandboxedPreview title="Email preview: Spring sale" html={sampleEmail} notice="From Studio, to 1,204 subscribers. Approximate rendering." height="sm" />, code: tsx(['SandboxedPreview'], '<SandboxedPreview title="Email preview: Spring sale" html={html} height="sm"\n  notice="From Studio, to 1,204 subscribers. Approximate rendering." />', "const html = '<h1>Spring sale</h1><p>Thirty percent off this week.</p>';") },
      { name: 'Mobile width', description: 'A 375px frame.', preview: <SandboxedPreview title="Email preview on mobile" html={sampleEmail} viewport="mobile" height="sm" />, code: tsx(['SandboxedPreview'], '<SandboxedPreview title="Email preview on mobile" html={html} viewport="mobile" height="sm" />', "const html = '<h1>Spring sale</h1><p>Thirty percent off this week.</p>';") },
      { name: 'Nothing to preview', description: 'No body yet.', preview: <SandboxedPreview title="Email preview" unavailable="Write the email body to see a preview." />, code: tsx(['SandboxedPreview'], '<SandboxedPreview title="Email preview" unavailable="Write the email body to see a preview." />') },
    ],
  },
];
