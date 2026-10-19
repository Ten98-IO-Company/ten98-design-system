import { useState } from 'react';
import { AppBadge, AppBrand, AppEmpty, AppField, AppIcon, AppSelect, AppStat } from '../lib/app';
import { tsx, type ComponentEntry } from './model';

const appExample = (imports: string[], jsx: string, setup = '', reactImports: string[] = []) => tsx(imports, jsx, setup, reactImports, '@ten98/ui/app');
const iconNames = ['sun', 'users', 'user', 'shield', 'key', 'monitor', 'menu', 'agent', 'grid', 'layers', 'send', 'calendar', 'target', 'billboard', 'image', 'inbox', 'globe', 'chart', 'settings', 'search', 'plus', 'arrow', 'chevron', 'more', 'check', 'close', 'refresh', 'link', 'folder', 'logout', 'pin', 'download', 'lock', 'money', 'eye'];
const badgeValues = ['active', 'live', 'published', 'approved', 'configured', 'draft', 'pending', 'planned', 'paused', 'scheduled', 'booked', 'submitted', 'requested', 'failed', 'rejected', 'cancelled', 'completed', 'resolved', 'not connected'];

function ControlledField() {
  const [name, setName] = useState('Summer launch');
  return <AppField label="Campaign name" name="campaign" value={name} onChange={event => setName(event.target.value)} />;
}

function NativeForm() {
  const [result, setResult] = useState('');
  return <form onSubmit={event => { event.preventDefault(); setResult(`Ready to save: ${new FormData(event.currentTarget).get('email')}`); }}>
    <AppField label="Email" name="email" type="email" required placeholder="name@example.com" />
    <button type="submit" className="button primary">Check email</button>
    <output aria-live="polite">{result}</output>
  </form>;
}

function SelectForm() {
  const [result, setResult] = useState('');
  return <form onSubmit={event => { event.preventDefault(); setResult(`Selected: ${new FormData(event.currentTarget).get('status')}`); }}>
    <AppSelect label="Status" name="status" value="draft" options={[["draft", "Draft"], ["scheduled", "Scheduled"], ["published", "Published"]]} />
    <button className="button" type="submit">Read selection</button>
    <output aria-live="polite">{result}</output>
  </form>;
}

export const adapterEntries: ComponentEntry[] = [
  {
    name: 'AppIcon', category: 'Application adapters', importPath: '@ten98/ui/app',
    description: 'Decorative SVG icons preserving the existing Campaign and Discover icon geometry.',
    usage: 'Use the existing Campaign icon vocabulary wherever it fits, including new app screens. Icon from the main entry supplies additional symbols when needed. Icons inherit currentColor; put the accessible name on the surrounding control. AppIcon itself has no stylesheet dependency; native icon-button styling requires the shared app styles.',
    props: [
      { name: 'name', type: 'string', required: true, description: `Existing icon key. Supported: ${iconNames.join(', ')}. Unknown names render grid.` },
      { name: 'size', type: 'number', defaultValue: '19', description: 'SVG width and height in pixels. A containing app rule, such as stat-card svg, may override the rendered size.' },
    ],
    nativeProps: 'No native SVG props, className, title or event handlers are forwarded. The SVG always has aria-hidden="true", viewBox="0 0 24 24" and strokeWidth="1.65".',
    tokens: [], accessibility: ['Decorative only: every SVG is hidden from assistive technology.', 'For an icon-only button, provide aria-label on the native button. Do not rely on the icon name as a label.'], related: ['Icon', 'AppStat', 'AppEmpty'],
    example: appExample(['AppIcon'], '<button type="button" className="icon-button" aria-label="Search campaigns">\n  <AppIcon name="search" />\n</button>'),
    states: [
      { name: 'All icon names', description: 'The complete built-in compatibility set. Labels outside the SVG identify the decorative specimens.', preview: <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>{iconNames.map(name => <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><AppIcon name={name} />{name}</span>)}</div>, code: appExample(['AppIcon'], `<div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>\n${iconNames.map(name => `  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><AppIcon name="${name}" />${name}</span>`).join('\n')}\n</div>`) },
      { name: 'Explicit size', description: '19px by default; size can be changed when no containing CSS overrides it.', preview: <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><AppIcon name="chart" size={16} /><AppIcon name="chart" /><AppIcon name="chart" size={32} /></div>, code: appExample(['AppIcon'], '<div style={{ display: \'flex\', alignItems: \'center\', gap: 16 }}>\n  <AppIcon name="chart" size={16} />\n  <AppIcon name="chart" />\n  <AppIcon name="chart" size={32} />\n</div>') },
      { name: 'Unknown name fallback', description: 'An unrecognized key safely renders the grid icon; it does not report an error.', preview: <span><AppIcon name="unknown-icon" /> Grid fallback</span>, code: appExample(['AppIcon'], '<span><AppIcon name="unknown-icon" /> Grid fallback</span>') },
      { name: 'Named native control', description: 'Tab to the real button to inspect its visible focus ring. A label makes the action understandable without the SVG.', preview: <button type="button" className="icon-button" aria-label="Search campaigns"><AppIcon name="search" /></button>, code: appExample(['AppIcon'], '<button type="button" className="icon-button" aria-label="Search campaigns">\n  <AppIcon name="search" />\n</button>') },
    ],
  },
  {
    name: 'AppBrand', category: 'Application adapters', importPath: '@ten98/ui/app',
    description: 'The existing ten98 wordmark and uppercase product name, rendered as a noninteractive span or a native link.',
    usage: 'Use this original Campaign mark, wordmark and product-label composition as the shared branding source of truth, including on app shells and login screens. Load @ten98/ui/app-tokens.css, then @ten98/ui/app.css once at the app entry. Supply href for a navigable home link. Omitting href intentionally produces a noninteractive brand; an onClick-only span does not gain keyboard button behavior.',
    props: [
      { name: 'product', type: 'string', required: true, description: 'Product label, displayed with toUpperCase().' },
      { name: 'href', type: 'string', description: 'When provided and truthy, renders an anchor with native link semantics. Otherwise renders a span.' },
      { name: 'onClick', type: 'React.MouseEventHandler<HTMLElement>', description: 'Passed to the rendered link or span. Use with an href when enhancing real navigation; this prop alone does not make a span an accessible action.' },
      { name: 'className', type: 'string', defaultValue: 'brand', description: 'Replaces the outer class. Keep brand in this value to retain the compatibility wordmark layout.' },
    ],
    nativeProps: 'No remaining anchor/span props are forwarded. For router integration, preserve the native href; AppBrand does not accept asChild, target, aria-label, ref or a router component.',
    tokens: ['--t98-accent', '--t98-on-accent', '--t98-text', '--t98-muted'],
    accessibility: ['The 98 mark is decorative and aria-hidden; ten98 and the product remain text.', 'Only href creates a native focusable link. Tab and Enter work normally for that link.'], related: ['AppIcon', 'AppField'],
    example: appExample(['AppBrand'], '<AppBrand product="Campaign" href="/campaign" />'),
    states: [
      { name: 'Noninteractive brand', description: 'Default span: branding without a navigation action.', preview: <AppBrand product="Campaign" />, code: appExample(['AppBrand'], '<AppBrand product="Campaign" />') },
      { name: 'Home link', description: 'A real link. Tab to inspect focus, then activate it to reach the labelled home anchor in this specimen.', preview: <div><AppBrand product="Campaign" href="#campaign-home" /><p id="campaign-home">Campaign home</p></div>, code: appExample(['AppBrand'], '<div>\n  <AppBrand product="Campaign" href="#campaign-home" />\n  <p id="campaign-home">Campaign home</p>\n</div>') },
      { name: 'Discover product', description: 'The product name is supplied by the app and converted to uppercase.', preview: <AppBrand product="Discover" />, code: appExample(['AppBrand'], '<AppBrand product="Discover" />') },
      { name: 'Extended class', description: 'Keep brand when adding an app-owned class; replacing it removes the base layout rules.', preview: <AppBrand product="Wiki" className="brand wiki-brand" />, code: appExample(['AppBrand'], '<AppBrand product="Wiki" className="brand wiki-brand" />') },
    ],
  },
  {
    name: 'AppField', category: 'Application adapters', importPath: '@ten98/ui/app',
    description: 'A wrapped native input, or a deliberately limited uncontrolled textarea, retaining existing form submission contracts.',
    usage: 'Preserve existing native forms and Campaign login patterns with name, defaultValue and browser validation. Load @ten98/ui/app-tokens.css, then @ten98/ui/app.css once at the app entry. Use Field/Input/Textarea when richer validation or forwarding is needed. The multiline branch only forwards name, defaultValue, placeholder, required, maxLength and disabled.',
    props: [
      { name: 'label', type: 'string', required: true, description: 'Visible label wrapping the native control. A required input/textarea adds a visible asterisk.' },
      { name: 'multiline', type: 'boolean', defaultValue: 'false', description: 'Switches from input to textarea. The textarea is always uncontrolled and has a restricted forwarding contract.' },
      { name: 'name', type: 'string', description: 'Native submission key. Forwarded in both modes.' },
      { name: 'defaultValue', type: 'React.InputHTMLAttributes<HTMLInputElement>["defaultValue"]', description: 'Initial uncontrolled value. Supply a string for multiline text. Later prop changes do not replace user edits.' },
      { name: 'placeholder', type: 'string', description: 'Native placeholder in either mode; use label for the accessible name.' },
      { name: 'required', type: 'boolean', description: 'Native required constraint and visible asterisk in either mode.' },
      { name: 'maxLength', type: 'number', description: 'Native maximum character count in either mode.' },
      { name: 'disabled', type: 'boolean', description: 'Disables the native control in either mode. Disabled values are excluded from FormData.' },
    ],
    nativeProps: 'The complete React.InputHTMLAttributes<HTMLInputElement> API is forwarded only when multiline is false: type, value/onChange, readOnly, id, min, max, step, pattern, aria-* and others. The textarea does not forward value, onChange, readOnly, id, rows, aria-* or arbitrary input props despite the shared TypeScript input type. Use the main Textarea component when those are required.',
    tokens: ['--t98-surface', '--t98-muted', '--t98-control-md'],
    accessibility: ['A wrapping label gives the native control its accessible name.', 'Native required, type and numeric constraints participate in normal browser form validation.', 'For input errors, forward aria-invalid and aria-describedby and render a visible message. The adapter provides no custom error state styling or message slot.', 'Input/textarea focus is native and visible. Disabled controls leave the tab order.'], related: ['Field', 'Input', 'Textarea', 'AppSelect'],
    example: appExample(['AppField'], '<AppField label="Campaign name" name="name" defaultValue="Summer launch" required maxLength={120} />'),
    states: [
      { name: 'Empty input', description: 'Native text input with a visible label and placeholder.', preview: <AppField label="Campaign name" name="name" placeholder="Name your campaign" />, code: appExample(['AppField'], '<AppField label="Campaign name" name="name" placeholder="Name your campaign" />') },
      { name: 'Initial value', description: 'Uncontrolled value. Edit the specimen; later defaultValue changes do not replace the current native value.', preview: <AppField label="Campaign name" name="name" defaultValue="Summer launch" />, code: appExample(['AppField'], '<AppField label="Campaign name" name="name" defaultValue="Summer launch" />') },
      { name: 'Controlled input', description: 'Input mode forwards value/onChange. Multiline mode does not support this contract.', preview: <ControlledField />, code: appExample(['AppField'], '<AppField label="Campaign name" name="campaign" value={name} onChange={event => setName(event.target.value)} />', 'const [name, setName] = useState("Summer launch");', ['useState']) },
      { name: 'Required / browser validation', description: 'Submit empty or enter an invalid email to inspect native validation; a valid address is read from FormData.', preview: <NativeForm />, code: appExample(['AppField'], '<form onSubmit={event => {\n  event.preventDefault();\n  setResult(`Ready to save: ${new FormData(event.currentTarget).get("email")}`);\n}}>\n  <AppField label="Email" name="email" type="email" required placeholder="name@example.com" />\n  <button type="submit" className="button primary">Check email</button>\n  <output aria-live="polite">{result}</output>\n</form>', 'const [result, setResult] = useState("");', ['useState']) },
      { name: 'Disabled input', description: 'The native disabled input cannot be edited or submitted.', preview: <AppField label="Managed account" name="account" defaultValue="Agency account" disabled />, code: appExample(['AppField'], '<AppField label="Managed account" name="account" defaultValue="Agency account" disabled />') },
      { name: 'Read-only input', description: 'Focusable and submitted, but not editable. This prop is supported in input mode only.', preview: <AppField label="Campaign ID" name="id" defaultValue="campaign-124" readOnly />, code: appExample(['AppField'], '<AppField label="Campaign ID" name="id" defaultValue="campaign-124" readOnly />') },
      { name: 'Accessible input error', description: 'The app owns the error text and validation. aria-invalid conveys the error; no bespoke red border is added by this adapter.', preview: <div><AppField label="Email" name="email" type="email" defaultValue="invalid" aria-invalid="true" aria-describedby="adapter-email-error" /><p id="adapter-email-error">Enter a complete email address.</p></div>, code: appExample(['AppField'], '<div>\n  <AppField label="Email" name="email" type="email" defaultValue="invalid" aria-invalid="true" aria-describedby="email-error" />\n  <p id="email-error">Enter a complete email address.</p>\n</div>') },
      { name: 'Native number constraints', description: 'Input mode preserves min, step and numeric browser behavior.', preview: <AppField label="Budget" name="budget" type="number" min={0} step="any" defaultValue="250" />, code: appExample(['AppField'], '<AppField label="Budget" name="budget" type="number" min={0} step="any" defaultValue="250" />') },
      { name: 'Native file input', description: 'No custom upload behavior: accept and multiple are forwarded to the native input.', preview: <AppField label="Images" name="images" type="file" accept="image/*" multiple />, code: appExample(['AppField'], '<AppField label="Images" name="images" type="file" accept="image/*" multiple />') },
      { name: 'Uncontrolled textarea', description: 'Only the documented multiline props are forwarded. Resize the textarea and edit its initial content.', preview: <AppField label="Post text" name="content" multiline defaultValue="Tell your audience what is new." required maxLength={500} placeholder="Write a post" />, code: appExample(['AppField'], '<AppField label="Post text" name="content" multiline defaultValue="Tell your audience what is new." required maxLength={500} placeholder="Write a post" />') },
      { name: 'Disabled textarea', description: 'Disabled is one of the supported multiline props.', preview: <AppField label="Approved copy" name="copy" multiline defaultValue="This approved copy is locked." disabled />, code: appExample(['AppField'], '<AppField label="Approved copy" name="copy" multiline defaultValue="This approved copy is locked." disabled />') },
      { name: 'Hover and focus', description: 'Hover and Tab/click the actual control. Focus receives the compatibility outline; there is no separate hover prop or hover-only input styling.', preview: <AppField label="Try keyboard focus" name="focus-example" placeholder="Tab or click here" />, code: appExample(['AppField'], '<AppField label="Try keyboard focus" name="focus-example" placeholder="Tab or click here" />') },
    ],
  },
  {
    name: 'AppSelect', category: 'Application adapters', importPath: '@ten98/ui/app',
    description: 'An uncontrolled native select whose options already contain the app’s domain labels.',
    usage: 'Use with native forms and read the selected value from FormData. Load @ten98/ui/app-tokens.css, then @ten98/ui/app.css once at the app entry. The prop called value is the initial defaultValue, not a controlled value. Reset the form or remount with a key when replacing the initial record.',
    props: [
      { name: 'label', type: 'string', required: true, description: 'Visible label wrapping the native select.' },
      { name: 'name', type: 'string', required: true, description: 'Native form submission key.' },
      { name: 'value', type: 'string', required: true, description: 'Initial native defaultValue only. Changing this prop does not overwrite the user’s current selection.' },
      { name: 'options', type: 'readonly (readonly [string, string])[]', required: true, description: 'Tuples of [submittedValue, visibleLabel]. Values become React keys and should be unique; formatting belongs to the app.' },
    ],
    nativeProps: 'No additional native props are forwarded: disabled, required, multiple, id, aria-*, onChange and controlled value are unavailable. Use the main Select for these requirements. An empty options array renders an empty select; this adapter adds no placeholder automatically.',
    tokens: ['--t98-surface', '--t98-muted', '--t98-control-md'],
    accessibility: ['The wrapping label names the native select.', 'Native keyboard selection, focus, option announcements and form submission are preserved.', 'Provide meaningful visible labels and an explicit empty-value option when the app needs a placeholder.'], related: ['Select', 'AppField'],
    example: appExample(['AppSelect'], '<AppSelect label="Status" name="status" value="draft" options={[["draft", "Draft"], ["scheduled", "Scheduled"], ["published", "Published"]]} />'),
    states: [
      { name: 'Initial selection / native form', description: 'Change the selection, then read it from FormData. value supplies the initial selection only.', preview: <SelectForm />, code: appExample(['AppSelect'], '<form onSubmit={event => {\n  event.preventDefault();\n  setResult(`Selected: ${new FormData(event.currentTarget).get("status")}`);\n}}>\n  <AppSelect label="Status" name="status" value="draft" options={[["draft", "Draft"], ["scheduled", "Scheduled"], ["published", "Published"]]} />\n  <button type="submit" className="button">Read selection</button>\n  <output aria-live="polite">{result}</output>\n</form>', 'const [result, setResult] = useState("");', ['useState']) },
      { name: 'Explicit placeholder option', description: 'An empty option is supplied by the caller. It is selectable and does not imply a required validation rule.', preview: <AppSelect label="Campaign" name="campaign" value="" options={[["", "Choose a campaign"], ["summer", "Summer launch"]]} />, code: appExample(['AppSelect'], '<AppSelect label="Campaign" name="campaign" value="" options={[["", "Choose a campaign"], ["summer", "Summer launch"]]} />') },
      { name: 'Empty options', description: 'The component renders a native select with no options; the app should explain unavailable data separately.', preview: <div><AppSelect label="Workspace" name="workspace" value="" options={[]} /><p>No workspaces are available.</p></div>, code: appExample(['AppSelect'], '<div>\n  <AppSelect label="Workspace" name="workspace" value="" options={[]} />\n  <p>No workspaces are available.</p>\n</div>') },
      { name: 'Focus / open / selection', description: 'Tab to the control and use native keyboard selection. The open popup is supplied by the browser and operating system.', preview: <AppSelect label="Channel" name="channel" value="email" options={[["email", "Email"], ["social", "Social"], ["search", "Search"]]} />, code: appExample(['AppSelect'], '<AppSelect label="Channel" name="channel" value="email" options={[["email", "Email"], ["social", "Social"], ["search", "Search"]]} />') },
    ],
  },
  {
    name: 'AppBadge', category: 'Application adapters', importPath: '@ten98/ui/app',
    description: 'A static, text-labelled status badge preserving existing domain status classes.',
    usage: 'Use on adopted lists and detail screens. The app supplies real status data and can override its display label. No loading, dismiss, selection or click behavior is implemented. Use Badge when a semantic tone API is needed.',
    props: [
      { name: 'value', type: 'string', required: true, description: 'Status data. Lowercased spaces become hyphens in the CSS class. The default display label capitalizes its first character and replaces underscores with spaces. An empty string displays Draft but does not add the draft CSS class.' },
      { name: 'label', type: 'React.ReactNode', description: 'Custom visible label. Null/undefined use the generated label; an empty string intentionally produces no text and should be avoided.' },
    ],
    nativeProps: 'No remaining span props are forwarded. The dot inherits the text color; the badge is not a button and has no live-region behavior.',
    tokens: ['--t98-muted'],
    accessibility: ['Keep visible status text; color and the small dot must not be the only indication.', 'If a status change requires an announcement, the app owns its surrounding live region.', 'A custom ReactNode label must remain meaningful and readable.'], related: ['Badge', 'Alert'],
    example: appExample(['AppBadge'], '<AppBadge value="published" label="Published" />'),
    states: [
      { name: 'All styled domain statuses', description: 'All status class values defined by app.css, including not-connected produced from a space-separated value.', preview: <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{badgeValues.map(value => <AppBadge key={value} value={value} />)}</div>, code: appExample(['AppBadge'], `<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>\n${badgeValues.map(value => `  <AppBadge value="${value}" />`).join('\n')}\n</div>`) },
      { name: 'Custom display label', description: 'The status class still comes from value; the app controls human-friendly naming.', preview: <AppBadge value="configured" label="Connected to provider" />, code: appExample(['AppBadge'], '<AppBadge value="configured" label="Connected to provider" />') },
      { name: 'Unknown status', description: 'An unrecognized value uses the base badge style. Underscores in the generated text become spaces.', preview: <AppBadge value="awaiting_review" />, code: appExample(['AppBadge'], '<AppBadge value="awaiting_review" />') },
      { name: 'Empty value fallback', description: 'Empty data displays Draft with the base style. Pass value="draft" to get the explicit draft status class.', preview: <AppBadge value="" />, code: appExample(['AppBadge'], '<AppBadge value="" />') },
    ],
  },
  {
    name: 'AppEmpty', category: 'Application adapters', importPath: '@ten98/ui/app',
    description: 'An existing-app empty state with a decorative icon, heading, explanatory paragraph and optional caller-owned action.',
    usage: 'Describe the actual reason a list is empty and offer a useful route when available. Do not use an empty state for data still loading or a failed request. New interfaces can use EmptyState.',
    props: [
      { name: 'icon', type: 'string', defaultValue: 'folder', description: 'AppIcon name; unknown values render its grid fallback. The rendered icon size is 25px.' },
      { name: 'title', type: 'string', required: true, description: 'Visible h3 heading.' },
      { name: 'children', type: 'React.ReactNode', required: true, description: 'Content rendered inside a paragraph. Use text or phrasing elements, not nested blocks.' },
      { name: 'action', type: 'React.ReactNode', description: 'Optional action after the paragraph. The app supplies the real link or button and its behavior.' },
    ],
    nativeProps: 'No additional native div props, className, role or event handlers are forwarded. Error, loading and permission states are app-owned and are not selected by a prop.',
    tokens: ['--t98-muted'],
    accessibility: ['The decorative icon is hidden from assistive technology; the heading and text explain the state.', 'Keep heading levels sensible in the surrounding document; this adapter always uses h3.', 'Use real links for navigation and named buttons for actions.'], related: ['EmptyState', 'AppIcon', 'Alert'],
    example: appExample(['AppEmpty'], '<AppEmpty title="No campaigns yet" action={<a className="button primary" href="/campaigns/new">Create campaign</a>}>\n  Create a campaign to organize your posts and ads.\n</AppEmpty>'),
    states: [
      { name: 'No action', description: 'Default folder icon and a plain explanation.', preview: <AppEmpty title="No activity yet">Activity will appear after the first event is received.</AppEmpty>, code: appExample(['AppEmpty'], '<AppEmpty title="No activity yet">Activity will appear after the first event is received.</AppEmpty>') },
      { name: 'Action / custom icon', description: 'A caller-owned native link points to the next step. This example reaches its instructions anchor.', preview: <div><AppEmpty icon="calendar" title="No scheduled posts" action={<a className="button primary" href="#compose-post">Compose a post</a>}>Schedule your first post to start the calendar.</AppEmpty><p id="compose-post">Open your app’s composer to schedule a post.</p></div>, code: appExample(['AppEmpty'], '<div>\n  <AppEmpty icon="calendar" title="No scheduled posts" action={<a className="button primary" href="#compose-post">Compose a post</a>}>\n    Schedule your first post to start the calendar.\n  </AppEmpty>\n  <p id="compose-post">Open your app’s composer to schedule a post.</p>\n</div>') },
      { name: 'No matching results', description: 'A no-results explanation distinguishes filtering from a dataset with no records.', preview: <AppEmpty icon="search" title="No matching campaigns">Try a broader search or change the active filters.</AppEmpty>, code: appExample(['AppEmpty'], '<AppEmpty icon="search" title="No matching campaigns">Try a broader search or change the active filters.</AppEmpty>') },
    ],
  },
  {
    name: 'AppStat', category: 'Application adapters', importPath: '@ten98/ui/app',
    description: 'A display-only existing-app metric card with a label, formatted value, caption and decorative icon.',
    usage: 'Supply already-formatted strings from the app’s data layer. Show explicit zero when it is known, and an explanatory caption when data is unavailable. The component does not fetch data, calculate trends, animate values or offer loading/error props.',
    props: [
      { name: 'label', type: 'string', required: true, description: 'Visible metric name above the value.' },
      { name: 'value', type: 'string', required: true, description: 'Already-formatted display value, including units or currency where needed.' },
      { name: 'caption', type: 'string', required: true, description: 'Visible context such as time range or data availability; no trend is calculated.' },
      { name: 'icon', type: 'string', required: true, description: 'Decorative AppIcon name. The stat-card CSS overrides the SVG size at its responsive breakpoints.' },
    ],
    nativeProps: 'No additional native section props, click behavior, href, loading, trend, color or children slots are forwarded. Use MetricCard from the main entry when a composable metric pattern is needed.',
    tokens: ['--t98-border', '--t98-surface', '--t98-muted'],
    accessibility: ['Label, value and caption are real text in document order.', 'The icon is aria-hidden. Include units and time context in the visible strings.', 'A section with no accessible name is not a named landmark; do not rely on this card as navigation.'], related: ['MetricCard', 'Skeleton', 'AppIcon'],
    example: appExample(['AppStat'], '<AppStat label="Impressions" value="12,840" caption="Last 30 days" icon="eye" />'),
    states: [
      { name: 'Populated metric', description: 'Formatting and time range are supplied by the app.', preview: <AppStat label="Impressions" value="12,840" caption="Last 30 days" icon="eye" />, code: appExample(['AppStat'], '<AppStat label="Impressions" value="12,840" caption="Last 30 days" icon="eye" />') },
      { name: 'Known zero', description: 'A real measured zero is distinct from missing data.', preview: <AppStat label="Scheduled posts" value="0" caption="No posts scheduled this week" icon="calendar" />, code: appExample(['AppStat'], '<AppStat label="Scheduled posts" value="0" caption="No posts scheduled this week" icon="calendar" />') },
      { name: 'Unavailable data copy', description: 'Display explicit unavailable data without implying a successful zero measurement. This is content, not a loading state.', preview: <AppStat label="Ad spend" value="—" caption="Connect an ad account to receive spend data" icon="money" />, code: appExample(['AppStat'], '<AppStat label="Ad spend" value="—" caption="Connect an ad account to receive spend data" icon="money" />') },
    ],
  },
];
