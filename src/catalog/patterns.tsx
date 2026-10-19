import { useId, useState } from 'react';
import {
  ActivityFeed, Alert, AppShell, AuthLayout, Badge, Button, ConfirmDialog, CopyButton, DataTable,
  DateRangeField, EmptyState, Field, Input, MetricCard, PageHeader, PermissionMatrix, ProductSwitcher,
  ResourceCard, SecretField, SettingsSection, Sparkline, Stepper, Switch, ToastProvider, useToast,
  type ActivityItem, type DataColumn, type Tone,
} from '../lib/index.js';
import { tsx, type ComponentEntry, type ComponentProp } from './model.js';
import { AppBrand } from '../lib/app.js';
import { campaignStory, campaignStoryCode } from './BrandReference.js';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, required, defaultValue });
const surfaceTokens = ['--t98-surface', '--t98-text', '--t98-muted', '--t98-border', '--t98-radius', '--t98-font'];
const toneTokens = ['--t98-success', '--t98-success-soft', '--t98-warning', '--t98-warning-soft', '--t98-danger', '--t98-danger-soft', '--t98-info', '--t98-info-soft'];
const rowSetup = `type Row = { id: string; name: string; visits: number; status: string };
const rows: Row[] = [
  { id: 'campaign', name: 'Campaign', visits: 2400, status: 'Active' },
  { id: 'discover', name: 'Discover', visits: 1800, status: 'Active' },
  { id: 'construction', name: 'Construction', visits: 120, status: 'Draft' },
  { id: 'connect', name: 'Connect', visits: 75, status: 'Draft' },
  { id: 'monitor', name: 'Monitor', visits: 900, status: 'Active' },
  { id: 'auth', name: 'Auth', visits: 650, status: 'Active' },
];
const columns: DataColumn<Row>[] = [
  { key: 'name', header: 'Product' },
  { key: 'visits', header: 'Visits', render: row => row.visits.toLocaleString(), sortValue: row => row.visits },
  { key: 'status', header: 'Status', render: row => <Badge tone={row.status === 'Active' ? 'success' : 'neutral'}>{row.status}</Badge>, sortValue: row => row.status },
];`;
type Row = { id: string; name: string; visits: number; status: string };
const rows: Row[] = [
  { id: 'campaign', name: 'Campaign', visits: 2400, status: 'Active' },
  { id: 'discover', name: 'Discover', visits: 1800, status: 'Active' },
  { id: 'construction', name: 'Construction', visits: 120, status: 'Draft' },
  { id: 'connect', name: 'Connect', visits: 75, status: 'Draft' },
  { id: 'monitor', name: 'Monitor', visits: 900, status: 'Active' },
  { id: 'auth', name: 'Auth', visits: 650, status: 'Active' },
];
const columns: DataColumn<Row>[] = [
  { key: 'name', header: 'Product' },
  { key: 'visits', header: 'Visits', render: row => row.visits.toLocaleString(), sortValue: row => row.visits },
  { key: 'status', header: 'Status', render: row => <Badge tone={row.status === 'Active' ? 'success' : 'neutral'}>{row.status}</Badge>, sortValue: row => row.status },
];

function TableDemo({ selectable = false, empty = false, simple = false }: { selectable?: boolean; empty?: boolean; simple?: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  return <div><DataTable columns={columns} rows={empty ? [] : rows} rowKey={row => row.id} caption="Product traffic" pageSize={simple ? 10 : 3} searchable={!simple} selectable={selectable} onSelectionChange={setSelected} />
    {selectable && <p role="status">Selected IDs: {selected.join(', ') || 'none'}</p>}</div>;
}
function tableCode({ selectable = false, empty = false, simple = false } = {}) {
  return tsx(['DataTable', 'Badge', 'type DataColumn'], `<>
  <DataTable columns={columns} rows={${empty ? '[]' : 'rows'}} rowKey={row => row.id} caption="Product traffic" pageSize={${simple ? 10 : 3}}${simple ? ' searchable={false}' : ''}${selectable ? ' selectable onSelectionChange={setSelected}' : ''} />${selectable ? '\n  <p role="status">Selected IDs: {selected.join(\', \') || \'none\'}</p>' : ''}
</>`, rowSetup + (selectable ? '\nconst [selected, setSelected] = useState<string[]>([]);' : ''), selectable ? ['useState'] : []);
}

function ProductDemo({ disabled = false, empty = false }: { disabled?: boolean; empty?: boolean }) {
  const [product, setProduct] = useState(empty ? '' : 'campaign');
  return <ProductSwitcher products={empty ? [] : [{ id: 'campaign', name: 'Campaign', description: 'Publishing' }, { id: 'discover', name: 'Discover', description: 'Analytics' }]} value={product} onValueChange={setProduct} disabled={disabled} />;
}
const productCode = (disabled = false, empty = false) => tsx(['ProductSwitcher', 'type ProductOption'], `<ProductSwitcher products={products} value={product} onValueChange={setProduct}${disabled ? ' disabled' : ''} />`, `const products: ProductOption[] = ${empty ? '[]' : "[{ id: 'campaign', name: 'Campaign', description: 'Publishing' }, { id: 'discover', name: 'Discover', description: 'Analytics' }]"};\nconst [product, setProduct] = useState(${empty ? "''" : "'campaign'"});`, ['useState']);

function DateDemo({ disabled = false, empty = false }: { disabled?: boolean; empty?: boolean }) {
  const [range, setRange] = useState(empty ? { start: '', end: '' } : { start: '2026-10-01', end: '2026-10-19' });
  return <div><DateRangeField label="Reporting period" {...range} onChange={setRange} disabled={disabled} /><p role="status">{range.start || 'No start'} → {range.end || 'No end'}</p></div>;
}
const dateCode = (disabled = false, empty = false) => tsx(['DateRangeField'], `<>
  <DateRangeField label="Reporting period" {...range} onChange={setRange}${disabled ? ' disabled' : ''} />
  <p role="status">{range.start || 'No start'} → {range.end || 'No end'}</p>
</>`, `const [range, setRange] = useState({ start: '${empty ? '' : '2026-10-01'}', end: '${empty ? '' : '2026-10-19'}' });`, ['useState']);

function SettingsDemo({ error = false, disabled = false }: { error?: boolean; disabled?: boolean }) {
  const id = useId(); const [email, setEmail] = useState('team@example.test'); const [enabled, setEnabled] = useState(true);
  return <SettingsSection title="Notifications" description="Control the destination for workspace updates."><Field htmlFor={id} label="Email" description="Only invited workspace members receive updates." error={error ? 'Enter a valid email address.' : undefined}><Input type="email" value={email} disabled={disabled} onChange={event => setEmail(event.target.value)} /></Field><Switch label="Weekly digest" checked={enabled} onCheckedChange={setEnabled} disabled={disabled} /></SettingsSection>;
}
const settingsCode = (error = false, disabled = false) => tsx(['SettingsSection', 'Field', 'Input', 'Switch'], `<SettingsSection title="Notifications" description="Control the destination for workspace updates.">
  <Field htmlFor={id} label="Email" description="Only invited workspace members receive updates."${error ? ' error="Enter a valid email address."' : ''}>
    <Input type="email" value={email}${disabled ? ' disabled' : ''} onChange={event => setEmail(event.target.value)} />
  </Field>
  <Switch label="Weekly digest" checked={enabled} onCheckedChange={setEnabled}${disabled ? ' disabled' : ''} />
</SettingsSection>`, "const id = useId();\nconst [email, setEmail] = useState('team@example.test');\nconst [enabled, setEnabled] = useState(true);", ['useId', 'useState']);

function StepDemo() {
  const [current, setCurrent] = useState(0);
  return <div><Stepper steps={['Install snippet', 'Receive event', 'View report']} current={current} /><p>Demo progress is local and does not verify installation.</p><div style={{ display: 'flex', gap: 8 }}><Button variant="secondary" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Previous</Button><Button disabled={current === 3} onClick={() => setCurrent(current + 1)}>Advance demo</Button></div></div>;
}
const stepCode = tsx(['Stepper', 'Button'], `<>
  <Stepper steps={['Install snippet', 'Receive event', 'View report']} current={current} />
  <p>Demo progress is local and does not verify installation.</p>
  <Button variant="secondary" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Previous</Button>
  <Button disabled={current === 3} onClick={() => setCurrent(current + 1)}>Advance demo</Button>
</>`, 'const [current, setCurrent] = useState(0);', ['useState']);

type ConfirmMode = 'default' | 'danger' | 'typed' | 'pending' | 'error';
function ConfirmDemo({ mode = 'default' }: { mode?: ConfirmMode }) {
  const [open, setOpen] = useState(false); const [result, setResult] = useState('No action confirmed.');
  async function confirm() {
    if (mode === 'pending') await new Promise(resolve => setTimeout(resolve, 1800));
    if (mode === 'error') throw new Error('Demonstration rejection');
    setResult('Demo action confirmed. No server data changed.');
  }
  return <div><Button variant={mode === 'danger' || mode === 'typed' ? 'danger' : 'secondary'} onClick={() => setOpen(true)}>Open {mode} confirmation</Button><p role="status">{result}</p><ConfirmDialog open={open} onOpenChange={setOpen} title="Remove demo resource?" description="This example changes only local demonstration state." onConfirm={confirm} danger={mode === 'danger' || mode === 'typed'} confirmationText={mode === 'typed' ? 'REMOVE' : undefined} confirmLabel="Confirm demo" /></div>;
}
const confirmCode = (mode: ConfirmMode = 'default') => tsx(['Button', 'ConfirmDialog'], `<>
  <Button${mode === 'danger' || mode === 'typed' ? ' variant="danger"' : ' variant="secondary"'} onClick={() => setOpen(true)}>Open confirmation</Button>
  <p role="status">{result}</p>
  <ConfirmDialog open={open} onOpenChange={setOpen} title="Remove demo resource?"
    description="This example changes only local demonstration state." onConfirm={confirm}
    confirmLabel="Confirm demo"${mode === 'danger' || mode === 'typed' ? ' danger' : ''}${mode === 'typed' ? ' confirmationText="REMOVE"' : ''} />
</>`, `const [open, setOpen] = useState(false);
const [result, setResult] = useState('No action confirmed.');
async function confirm() {
${mode === 'pending' ? '  await new Promise(resolve => setTimeout(resolve, 1800));\n' : ''}${mode === 'error' ? "  throw new Error('Demonstration rejection');" : "  setResult('Demo action confirmed. No server data changed.');"}
}`, ['useState']);

function ToastActions({ tone }: { tone?: Tone }) {
  const { toast } = useToast();
  return tone ? <Button variant="secondary" onClick={() => toast(`Demo ${tone} message`, tone)}>Show {tone} toast</Button> : <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const).map(item => <Button key={item} variant="secondary" onClick={() => toast(`Demo ${item} message`, item)}>{item}</Button>)}</div>;
}
const toastCode = (tone?: Tone) => tsx(['ToastProvider', 'useToast', 'Button'], '<ToastProvider><ToastActions /></ToastProvider>', `function ToastActions() {
  const { toast } = useToast();
  return ${tone ? `<Button onClick={() => toast('Demo ${tone} message', '${tone}')}>Show ${tone} toast</Button>` : `<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {(['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const).map(tone =>
      <Button key={tone} variant="secondary" onClick={() => toast('Demo ' + tone + ' message', tone)}>{tone}</Button>
    )}
  </div>`};
}`);

const permissionSetup = `const roles = ['Editor', 'Administrator'];
const permissions = [
  { id: 'read', label: 'View reports', description: 'Read workspace reports.' },
  { id: 'publish', label: 'Publish content', description: 'Publish approved content.' },
];
const [value, setValue] = useState<Record<string, string[]>>({ Editor: ['read'], Administrator: ['read', 'publish'] });
function update(role: string, permissionId: string, allowed: boolean) {
  setValue(current => ({ ...current, [role]: allowed
    ? [...new Set([...(current[role] ?? []), permissionId])]
    : (current[role] ?? []).filter(id => id !== permissionId) }));
}`;
function PermissionDemo({ disabled = false, empty = false }: { disabled?: boolean; empty?: boolean }) {
  const [value, setValue] = useState<Record<string, string[]>>({ Editor: ['read'], Administrator: ['read', 'publish'] });
  return <PermissionMatrix roles={['Editor', 'Administrator']} permissions={empty ? [] : [{ id: 'read', label: 'View reports', description: 'Read workspace reports.' }, { id: 'publish', label: 'Publish content', description: 'Publish approved content.' }]} value={value} disabled={disabled} onChange={(role, permissionId, allowed) => setValue(current => ({ ...current, [role]: allowed ? [...new Set([...(current[role] ?? []), permissionId])] : (current[role] ?? []).filter(id => id !== permissionId) }))} />;
}
const permissionCode = (disabled = false, empty = false) => tsx(['PermissionMatrix'], `<PermissionMatrix roles={roles} permissions={${empty ? '[]' : 'permissions'}} value={value} onChange={update}${disabled ? ' disabled' : ''} />`, permissionSetup, ['useState']);

function AuthDemo({ split = false, error = false }: { split?: boolean; error?: boolean }) {
  const id = useId(); const [message, setMessage] = useState(error ? 'Demo credentials were rejected. Try again.' : '');
  return <AuthLayout brand={<AppBrand product="Campaign" />} title="Sign in" description="Access your workspace." aside={split ? campaignStory : undefined} footer="Layout demonstration. Preserve the app’s existing authentication flow."><form style={{ display: 'grid', gap: 16 }} onSubmit={event => { event.preventDefault(); setMessage('Demo form validated. No authentication request was sent.'); }}><Field htmlFor={`${id}-email`} label="Email"><Input type="email" name="email" autoComplete="username" required /></Field><Field htmlFor={`${id}-password`} label="Password"><Input type="password" name="password" autoComplete="current-password" required /></Field>{message && <Alert tone={message.startsWith('Demo credentials') ? 'danger' : 'info'} title={message} />}<Button type="submit">Sign in to demo</Button></form></AuthLayout>;
}
const authCode = (split = false, error = false) => withAppBrand(tsx(['AuthLayout', 'Field', 'Input', 'Button', 'Alert'], `<AuthLayout brand={<AppBrand product="Campaign" />} title="Sign in" description="Access your workspace."${split ? ` aside={${campaignStoryCode}}` : ''}
  footer="Layout demonstration. Preserve the app’s existing authentication flow.">
  <form style={{ display: 'grid', gap: 16 }} onSubmit={event => {
    event.preventDefault();
    setMessage('Demo form validated. No authentication request was sent.');
  }}>
    <Field htmlFor={id + '-email'} label="Email"><Input type="email" name="email" autoComplete="username" required /></Field>
    <Field htmlFor={id + '-password'} label="Password"><Input type="password" name="password" autoComplete="current-password" required /></Field>
    {message && <Alert tone={message.startsWith('Demo credentials') ? 'danger' : 'info'} title={message} />}
    <Button type="submit">Sign in to demo</Button>
  </form>
</AuthLayout>`, `const id = useId();\nconst [message, setMessage] = useState('${error ? 'Demo credentials were rejected. Try again.' : ''}');`, ['useId', 'useState']), split ? 'AppBrand, AppIcon' : 'AppBrand');

function withAppBrand(code: string, imports = 'AppBrand') {
  return code.replace("'use client';", `'use client';\n\nimport { ${imports} } from '@ten98/ui/app';\n// Load @ten98/ui/styles.css once at the application root.`);
}

function ShellDemo({ header = true }: { header?: boolean }) {
  const id = useId();
  return <AppShell sidebar={<nav aria-label="Demo workspace" style={{ padding: 20 }}><AppBrand product="Campaign" /><p><a href={`#${id}`}>Overview</a></p></nav>} header={header ? <span>Demo workspace</span> : undefined}><section id={id}><PageHeader title="Overview" description="Resize the viewport to see the sidebar stack above the workspace." /><p>Press Tab to find the built-in skip link.</p></section></AppShell>;
}
const shellCode = (header = true) => withAppBrand(tsx(['AppShell', 'PageHeader'], `<AppShell sidebar={<nav aria-label="Workspace" style={{ padding: 20 }}>
  <AppBrand product="Campaign" /><p><a href={'#' + id}>Overview</a></p>
</nav>}${header ? ' header={<span>Demo workspace</span>}' : ''}>
  <section id={id}>
    <PageHeader title="Overview" description="The sidebar stacks above the workspace below 760px." />
    <p>Press Tab to find the built-in skip link.</p>
  </section>
</AppShell>`, 'const id = useId();', ['useId']));

const activityItems: ActivityItem[] = [
  { id: 'neutral', title: 'Workspace opened', time: '09:00', tone: 'neutral' },
  { id: 'success', title: 'Publish succeeded', description: 'Approved content is now available.', time: '09:01', tone: 'success', icon: 'check' },
  { id: 'warning', title: 'Review needed', description: 'A teammate requested a review.', time: '09:02', tone: 'warning', icon: 'bell' },
  { id: 'danger', title: 'Delivery failed', description: 'Open the resource to retry.', time: '09:03', tone: 'danger', icon: 'shield' },
  { id: 'info', title: 'Report available', description: 'The latest report is ready.', time: '09:04', tone: 'info', icon: 'activity' },
];
const activityCode = (items: ActivityItem[]) => tsx(['ActivityFeed', 'type ActivityItem'], '<ActivityFeed items={items} />', `const items: ActivityItem[] = ${JSON.stringify(items, null, 2)};`);

export const patternEntries: ComponentEntry[] = [
  {
    name: 'DataTable', category: 'Data display', description: 'A local-data table with search, two-way sorting, page selection and pagination.',
    usage: 'Use stable unique row keys. Provide sortValue for custom cells; search and sort use it rather than rendered JSX. This component owns query, sorting, pagination and selection internally. It has no loading, remote-data, controlled-sort or row-click API; compose Skeleton/Alert around it when needed. Local operations suit small datasets; use application-owned server pagination for large collections.',
    props: [prop('columns', 'readonly DataColumn<T>[]', 'Column definitions: key and header are required; render?: (row: T) => ReactNode; sortValue?: (row: T) => string | number.', true), prop('rows', 'readonly T[]', 'Source rows; filtering and sorting do not mutate this array.', true), prop('rowKey', '(row: T) => string', 'A unique stable key for each row.', true), prop('caption', 'string', 'Accessible table caption and search-region name.', true), prop('searchable', 'boolean', 'Display the local search field.', false, 'true'), prop('searchPlaceholder', 'string', 'Search input placeholder; the input also has a persistent hidden label.', false, 'Search records…'), prop('pageSize', 'number', 'Positive finite size, floored to an integer. Invalid sizes fall back to 5.', false, '5'), prop('selectable', 'boolean', 'Display native row and current-page selection checkboxes.', false, 'false'), prop('onSelectionChange', '(keys: string[]) => void', 'Receives keys after selection changes and when removed rows are pruned.'), prop('emptyTitle', 'string', 'Heading when source rows or current search results are empty.', false, 'No records found')],
    tokens: [...surfaceTokens, '--t98-subtle', '--t98-accent', '--t98-accent-soft', '--t98-cell-padding'], accessibility: ['Semantic table/caption/column headers; aria-sort follows the selected column.', 'Keyboard-accessible search, sorting and pagination; the horizontal scroll region is focusable.', 'Select-all affects the visible page and becomes indeterminate for a partial page selection. Selection persists across pages and filters.', 'Records, selected count and current page are announced politely.'], related: ['EmptyState', 'Badge', 'Skeleton', 'Alert'], example: tableCode({ selectable: true }),
    states: [
      { name: 'Default', description: 'Search and ascending/descending column sorting are available.', preview: <TableDemo />, code: tableCode() },
      { name: 'Filtered and no results', description: 'Type “Wiki” in Search to filter; type an unmatched word to inspect the clear-search empty state. Query state is internal, so this preview starts unfiltered.', preview: <TableDemo />, code: tableCode() },
      { name: 'Sorted ascending / descending', description: 'Click Visits once for ascending and again for descending. Numeric sortValue keeps 75 before 120 despite formatted cells. Sorting state is internal.', preview: <TableDemo />, code: tableCode() },
      { name: 'Selected / partial / select page', description: 'Check one row for the indeterminate header, then select the page. The output shows the real callback keys. Selection state starts empty.', preview: <TableDemo selectable />, code: tableCode({ selectable: true }) },
      { name: 'Pagination', description: 'Use Next page and Previous page. The boundary button is disabled; changing search or sort returns to page 1.', preview: <TableDemo />, code: tableCode() },
      { name: 'Empty source', description: 'No source records: zero count, empty explanation, and disabled page controls.', preview: <TableDemo empty />, code: tableCode({ empty: true }) },
      { name: 'Search hidden', description: 'Use searchable=false for a small fixed list. Column sorting is still available.', preview: <TableDemo simple />, code: tableCode({ simple: true }) },
    ],
  },
  {
    name: 'MetricCard', category: 'Data display', description: 'A numeric or formatted KPI with an optional change label and sparkline.',
    usage: 'Supply an honest value and comparison period in change. Trend describes direction, not business value: “down” always uses danger color. Do not use trend=up to imply a decrease is positive. Loading/error content belongs to the consuming app; this component has no loading prop.',
    props: [prop('label', 'string', 'Readable metric name.', true), prop('value', 'ReactNode', 'Formatted metric value or meaningful no-data text.', true), prop('change', 'string', 'Optional comparison text.'), prop('trend', "'up' | 'down' | 'neutral'", 'Direction icon and semantic change color.', false, 'neutral'), prop('chart', 'readonly number[]', 'Optional values passed to Sparkline; non-finite points are omitted.')],
    tokens: [...surfaceTokens, '--t98-accent', '--t98-success', '--t98-danger'], accessibility: ['Direction includes hidden Increasing/Decreasing text, so color is not the only cue.', 'Sparkline includes a numeric text summary; give the metric and comparison a clear label.'], related: ['Sparkline', 'Skeleton'], example: tsx(['MetricCard'], '<MetricCard label="Visits" value="12,480" change="12% vs previous 28 days" trend="up" chart={[4, 7, 6, 12, 15]} />'),
    states: [
      { name: 'Value only', description: 'No change label or chart.', preview: <MetricCard label="Visits" value="12,480" />, code: tsx(['MetricCard'], '<MetricCard label="Visits" value="12,480" />') },
      { name: 'Increasing', description: 'Up icon, success change label, and accent chart.', preview: <MetricCard label="Visits" value="12,480" change="12% vs previous 28 days" trend="up" chart={[4, 7, 6, 12, 15]} />, code: tsx(['MetricCard'], '<MetricCard label="Visits" value="12,480" change="12% vs previous 28 days" trend="up" chart={[4, 7, 6, 12, 15]} />') },
      { name: 'Decreasing', description: 'Down icon and danger chart; direction is announced.', preview: <MetricCard label="Visits" value="9,100" change="8% vs previous 28 days" trend="down" chart={[15, 12, 13, 7, 4]} />, code: tsx(['MetricCard'], '<MetricCard label="Visits" value="9,100" change="8% vs previous 28 days" trend="down" chart={[15, 12, 13, 7, 4]} />') },
      { name: 'Neutral / zero', description: 'Zero is a real numeric value, with neutral comparison.', preview: <MetricCard label="New events" value={0} change="No change in this period" chart={[0, 0, 0]} />, code: tsx(['MetricCard'], '<MetricCard label="New events" value={0} change="No change in this period" chart={[0, 0, 0]} />') },
      { name: 'No data', description: 'Explicit unavailable value with an empty chart; never represent missing data as zero.', preview: <MetricCard label="Conversion rate" value="No data" chart={[]} />, code: tsx(['MetricCard'], '<MetricCard label="Conversion rate" value="No data" chart={[]} />') },
    ],
  },
  {
    name: 'Sparkline', category: 'Data display', description: 'A compact SVG trend with an accessible numeric summary.',
    usage: 'Use for a quick trend, not a precise chart with axes. Finite values are plotted in their original order; non-finite values are removed. Empty data produces an empty SVG announced as “no data”.',
    props: [prop('values', 'readonly number[]', 'Ordered samples; finite values only are plotted.', true), prop('label', 'string', 'Summary prefix for point count, first/last/minimum/maximum values.', true), prop('color', 'string', 'CSS color, preferably a canonical token reference.', false, 'var(--t98-accent)')], tokens: ['--t98-accent'], accessibility: ['SVG has role=img and a calculated aria-label summarizing the plotted values.', 'Do not rely on the line color alone to explain a comparison.'], related: ['MetricCard'], example: tsx(['Sparkline'], '<Sparkline values={[2, 4, 3, 7, 9]} label="Daily visits" />'),
    states: [
      ...([{ name: 'Multiple points', description: 'Line connecting a normal finite series.', values: [2, 4, 3, 7, 9] }, { name: 'Single point', description: 'A centered dot, without a fabricated trend.', values: [42] }, { name: 'Flat / zero', description: 'Equal values form a horizontal line.', values: [0, 0, 0] }, { name: 'Negative values', description: 'Negative and positive values share the scaled range.', values: [-20, -4, 0, 8] }, { name: 'No data', description: 'No line; the SVG summary explicitly announces no data.', values: [] }, { name: 'Non-finite samples', description: 'NaN and infinities are omitted before plotting and summarizing.', values: [2, Number.NaN, 4, Number.POSITIVE_INFINITY, 3] }] as const).map(item => ({ name: item.name, description: item.description, preview: <Sparkline values={item.values} label="Daily visits" />, code: tsx(['Sparkline'], `<Sparkline values={[${item.values.map(value => Number.isNaN(value) ? 'Number.NaN' : value === Infinity ? 'Number.POSITIVE_INFINITY' : value).join(', ')}]} label="Daily visits" />`) })),
      { name: 'Semantic color', description: 'Use a canonical token for a chart with meaningful direction.', preview: <Sparkline values={[9, 6, 3]} label="Daily failures" color="var(--t98-danger)" />, code: tsx(['Sparkline'], '<Sparkline values={[9, 6, 3]} label="Daily failures" color="var(--t98-danger)" />') },
    ],
  },
  {
    name: 'PageHeader', category: 'Layout', description: 'Page title, context, description and optional action area.',
    usage: 'Use once for the primary page heading. Put real action controls in actions. The layout stacks below 760px; app routing and asynchronous action state remain consumer-owned.',
    props: [prop('eyebrow', 'string', 'Optional short section label.'), prop('title', 'string', 'Page h1 heading.', true), prop('description', 'string', 'Optional concise page explanation.'), prop('actions', 'ReactNode', 'Action buttons or links; wraps on narrow screens.')], tokens: ['--t98-text', '--t98-muted', '--t98-font', '--t98-heading', '--t98-mono'], accessibility: ['Renders an h1; avoid multiple top-level page headings in one page.', 'Actions retain their native button/link semantics.'], related: ['Button', 'Breadcrumb', 'AppShell'], example: tsx(['PageHeader', 'Button'], '<><PageHeader eyebrow="Discover" title="Overview" description="Review workspace traffic." actions={<Button onClick={() => setNotice(\'Demo report requested.\')}>Create report</Button>} /><p role="status">{notice}</p></>', "const [notice, setNotice] = useState('');", ['useState']),
    states: [
      { name: 'Title only', description: 'Minimal page heading.', preview: <PageHeader title="Overview" />, code: tsx(['PageHeader'], '<PageHeader title="Overview" />') },
      { name: 'Context and description', description: 'Eyebrow and optional explanatory content.', preview: <PageHeader eyebrow="Discover" title="Overview" description="Review workspace traffic." />, code: tsx(['PageHeader'], '<PageHeader eyebrow="Discover" title="Overview" description="Review workspace traffic." />') },
      { name: 'Actions / responsive', description: 'Action controls wrap; the header stacks on small viewports. Click Create report to update local demo feedback.', preview: <HeaderActionDemo />, code: tsx(['PageHeader', 'Button'], '<><PageHeader title="Overview" description="Review workspace traffic." actions={<Button onClick={() => setNotice(\'Demo report requested.\')}>Create report</Button>} /><p role="status">{notice}</p></>', "const [notice, setNotice] = useState('');", ['useState']) },
    ],
  },
  {
    name: 'EmptyState', category: 'Feedback', description: 'An explanatory empty panel with an icon and optional next action.',
    usage: 'Explain why the list is empty and offer one relevant next step when available. Loading and failure are distinct states; compose Skeleton or Alert instead of presenting a failed fetch as an empty result.',
    props: [prop('title', 'string', 'Short empty-state heading.', true), prop('description', 'string', 'Explain the absence and next step.', true), prop('icon', 'string', 'Shared Icon name; unknown names use the Icon fallback.', false, 'inbox'), prop('action', 'ReactNode', 'Optional native action or link.')], tokens: ['--t98-text', '--t98-muted', '--t98-border', '--t98-radius', '--t98-font', '--t98-subtle'], accessibility: ['The title is an h3; place this panel under an appropriate page/section heading.', 'Describe the state in text; decorative icon alone does not convey meaning.'], related: ['DataTable', 'Alert', 'Skeleton'], example: tsx(['EmptyState', 'Button'], '<>{created ? <p role="status">Demo report created.</p> : <EmptyState title="No saved reports" description="Create a report to see it here." action={<Button onClick={() => setCreated(true)}>Create demo report</Button>} />}</>', 'const [created, setCreated] = useState(false);', ['useState']),
    states: [
      { name: 'Informational', description: 'No action is needed.', preview: <EmptyState title="No activity yet" description="New workspace activity will appear here." />, code: tsx(['EmptyState'], '<EmptyState title="No activity yet" description="New workspace activity will appear here." />') },
      { name: 'Search empty', description: 'A specific explanation for an empty search.', preview: <EmptyState title="No matching reports" description="Try a broader search or remove a filter." icon="search" />, code: tsx(['EmptyState'], '<EmptyState title="No matching reports" description="Try a broader search or remove a filter." icon="search" />') },
      { name: 'Actionable', description: 'The action is supplied by the consumer.', preview: <EmptyActionDemo />, code: tsx(['EmptyState', 'Button'], `<>{created ? <p role="status">Demo report created.</p> : <EmptyState title="No saved reports" description="Create a report to see it here." action={<Button onClick={() => setCreated(true)}>Create demo report</Button>} />}</>`, 'const [created, setCreated] = useState(false);', ['useState']) },
    ],
  },
  {
    name: 'ActivityFeed', category: 'Data display', description: 'A chronological ordered list of application events.', usage: 'Supply time labels in the user’s locale. Preserve the intended order in items; the component does not sort, fetch or retain event history. It has no built-in empty panel or loading API.',
    props: [prop('items', 'readonly ActivityItem[]', "Each item requires id, title and time. Optional description, icon and tone ('neutral' | 'success' | 'warning' | 'danger' | 'info'); tone defaults to neutral and icon to activity.", true)], tokens: ['--t98-text', '--t98-muted', '--t98-border', '--t98-font', '--t98-subtle', '--t98-mono', ...toneTokens], accessibility: ['Events are a semantic ordered list.', 'State must appear in the title/description, not just its tone. Times are supplied text, not automatically generated datetime elements.'], related: ['EmptyState', 'ToastProvider'], example: activityCode(activityItems),
    states: [
      { name: 'All supported tones', description: 'Neutral, success, warning, danger and info event icons.', preview: <ActivityFeed items={activityItems} />, code: activityCode(activityItems) },
      { name: 'Minimal event', description: 'Default neutral tone/activity icon; no description.', preview: <ActivityFeed items={[activityItems[0]]} />, code: activityCode([activityItems[0]]) },
      { name: 'Empty list composition', description: 'The app supplies the empty explanation because an empty array renders an empty list.', preview: <EmptyState title="No workspace activity" description="New events will appear here." />, code: tsx(['ActivityFeed', 'EmptyState', 'type ActivityItem'], '<>{items.length ? <ActivityFeed items={items} /> : <EmptyState title="No workspace activity" description="New events will appear here." />}</>', 'const items: ActivityItem[] = [];') },
    ],
  },
  {
    name: 'ResourceCard', category: 'Data display', description: 'A resource summary with a status slot, content and actions.', usage: 'Use status for confirmed resource state. A copied snippet is not evidence that a tracker is receiving events. The card itself is not clickable and has no pending/disabled state; supply actual controls and status badges through its slots.',
    props: [prop('title', 'string', 'Resource h3 heading.', true), prop('description', 'string', 'Resource explanation.', true), prop('icon', 'string', 'Shared icon name.', false, 'box'), prop('status', 'ReactNode', 'A string becomes a neutral Badge; pass a Badge to specify tone.'), prop('children', 'ReactNode', 'Optional resource details.'), prop('actions', 'ReactNode', 'Optional consumer-owned controls.')], tokens: [...surfaceTokens, '--t98-subtle'], accessibility: ['Article and h3 preserve the content hierarchy.', 'Give each action a meaningful name; do not rely on making the entire card an unlabelled click target.'], related: ['Badge', 'Alert', 'Stepper'], example: tsx(['ResourceCard', 'Badge', 'CopyButton'], '<ResourceCard title="Website tracker" description="Install the snippet on your website." status={<Badge tone="warning">Awaiting first event</Badge>} actions={<CopyButton value="<!-- demo snippet -->" label="Copy demo snippet" />}><p>Copying the snippet does not verify event receipt.</p></ResourceCard>'),
    states: [
      { name: 'Summary only', description: 'Default box icon and no slots.', preview: <ResourceCard title="Website tracker" description="Connect your website to Discover." />, code: tsx(['ResourceCard'], '<ResourceCard title="Website tracker" description="Connect your website to Discover." />') },
      { name: 'String status', description: 'A supplied string is wrapped in a neutral Badge.', preview: <ResourceCard title="Demo workspace" description="A resource with a simple label." status="Draft" />, code: tsx(['ResourceCard'], '<ResourceCard title="Demo workspace" description="A resource with a simple label." status="Draft" />') },
      { name: 'Pending verification', description: 'Copy works independently of verification; the badge remains awaiting an event.', preview: <ResourceCard title="Website tracker" description="Install the snippet on your website." status={<Badge tone="warning">Awaiting first event</Badge>} actions={<CopyButton value="<!-- demo snippet -->" label="Copy demo snippet" />}><p>Copying the snippet does not verify event receipt.</p></ResourceCard>, code: tsx(['ResourceCard', 'Badge', 'CopyButton'], '<ResourceCard title="Website tracker" description="Install the snippet on your website." status={<Badge tone="warning">Awaiting first event</Badge>} actions={<CopyButton value="<!-- demo snippet -->" label="Copy demo snippet" />}><p>Copying the snippet does not verify event receipt.</p></ResourceCard>') },
      { name: 'Confirmed status composition', description: 'Synthetic confirmed status demonstrates the slot; apps must base it on real event evidence.', preview: <ResourceCard title="Demo website" description="Synthetic preview data." status={<Badge tone="success">Event received</Badge>}><p>Last demo event: 09:14</p></ResourceCard>, code: tsx(['ResourceCard', 'Badge'], '<ResourceCard title="Demo website" description="Synthetic preview data." status={<Badge tone="success">Event received</Badge>}><p>Last demo event: 09:14</p></ResourceCard>') },
      { name: 'Error composition', description: 'A real failure message belongs in text; retry behavior belongs to the app.', preview: <ResourceCard title="Demo connector" description="Synthetic preview data." status={<Badge tone="danger">Connection failed</Badge>}><Alert tone="danger" title="Demo connection unavailable">Check the connection before trying again.</Alert></ResourceCard>, code: tsx(['ResourceCard', 'Badge', 'Alert'], '<ResourceCard title="Demo connector" description="Synthetic preview data." status={<Badge tone="danger">Connection failed</Badge>}><Alert tone="danger" title="Demo connection unavailable">Check the connection before trying again.</Alert></ResourceCard>') },
    ],
  },
  {
    name: 'SettingsSection', category: 'Layout', description: 'A labelled settings group with an explanatory column and control stack.', usage: 'Compose native labelled controls in children. Below 760px the columns stack. Form state, validation and saving are owned by the app; the layout itself has no disabled, error or saving prop.',
    props: [prop('title', 'string', 'Section h2 and accessible name.', true), prop('description', 'string', 'Explain what these settings affect.', true), prop('children', 'ReactNode', 'Settings fields and controls.', true)], tokens: ['--t98-text', '--t98-muted', '--t98-border', '--t98-font'], accessibility: ['Generated heading ID labels the section.', 'Use Field with matching htmlFor or self-labelled controls for each setting.'], related: ['Field', 'Switch', 'Input'], example: settingsCode(),
    states: [{ name: 'Editable / responsive', description: 'Try the email and digest controls; narrow viewports stack the section.', preview: <SettingsDemo />, code: settingsCode() }, { name: 'Validation composition', description: 'Field owns its error and associates the message with the input.', preview: <SettingsDemo error />, code: settingsCode(true) }, { name: 'Disabled controls composition', description: 'Disable controls individually; SettingsSection remains a semantic container.', preview: <SettingsDemo disabled />, code: settingsCode(false, true) }],
  },
  {
    name: 'Stepper', category: 'Navigation', description: 'Read-only progress through a sequence of named steps.', usage: 'current is zero-based. Set it from observed workflow state; copying a snippet cannot advance an installation to event verification. Steps are not buttons and do not navigate. A current value equal to steps.length marks all steps complete; values are not clamped.',
    props: [prop('steps', 'readonly string[]', 'Ordered unique-in-context step labels.', true), prop('current', 'number', 'Zero-based active index; prior steps are marked complete.', true)], tokens: ['--t98-muted', '--t98-text', '--t98-font', '--t98-mono', '--t98-border', '--t98-control-border', '--t98-accent', '--t98-accent-soft', '--t98-on-accent'], accessibility: ['Ordered list has Progress label; active step uses aria-current=step.', 'Completed and current status are included in hidden text.', 'Below 760px steps stack vertically.'], related: ['Progress', 'ResourceCard'], example: stepCode,
    states: [
      ...[{ name: 'First step', description: 'First current step; later steps are upcoming.', current: 0 }, { name: 'In progress', description: 'Completed, current and upcoming states together.', current: 1 }, { name: 'Final step', description: 'Last current step; all prior steps complete.', current: 2 }, { name: 'All complete', description: 'current=steps.length produces all completed markers and no active step.', current: 3 }].map(item => ({ name: item.name, description: item.description, preview: <Stepper steps={['Install snippet', 'Receive event', 'View report']} current={item.current} />, code: tsx(['Stepper'], `<Stepper steps={['Install snippet', 'Receive event', 'View report']} current={${item.current}} />`) })),
      { name: 'Interactive local demo', description: 'Use Previous/Advance to inspect progress. No installation is actually verified.', preview: <StepDemo />, code: stepCode },
      { name: 'Empty sequence', description: 'An empty steps array renders an empty Progress list; prefer hiding irrelevant progress in the app.', preview: <Stepper steps={[]} current={0} />, code: tsx(['Stepper'], '<Stepper steps={[]} current={0} />') },
    ],
  },
  {
    name: 'AppShell', category: 'Layout', description: 'Shared sidebar, optional header, content landmark and keyboard skip link.', usage: 'Use as the outer page shell once per app page; keep routing and sidebar contents app-owned. The sidebar stacks above content below 760px. This component has no mobile drawer, collapsed state or built-in navigation selection.',
    props: [prop('sidebar', 'ReactNode', 'Sidebar content inside an aside.', true), prop('header', 'ReactNode', 'Optional workspace header content.'), prop('children', 'ReactNode', 'Page content inside the main landmark.', true)], tokens: ['--t98-sidebar-width', '--t98-header-height', '--t98-text', '--t98-bg', '--t98-font', '--t98-border', '--t98-surface', '--t98-accent', '--t98-on-accent', '--t98-radius'], accessibility: ['Includes a skip link to a generated focusable main landmark.', 'Label navigation inside sidebar; avoid nesting an additional main in children.', 'Responsive stacking preserves the sidebar and its controls.'], related: ['ProductSwitcher', 'PageHeader', 'Breadcrumb'], example: shellCode(),
    states: [{ name: 'Sidebar / header / content', description: 'Use Tab to expose Skip to content. Resize the viewport below 760px for the stacked layout.', preview: <ShellDemo />, code: shellCode() }, { name: 'Header omitted', description: 'The optional header region is not rendered.', preview: <ShellDemo header={false} />, code: shellCode(false) }],
  },
  {
    name: 'ProductSwitcher', category: 'Navigation', description: 'A controlled native select for choosing the active product or scope.', usage: 'Supply value and update it in onValueChange. The app handles navigation, permissions and data changes. Product descriptions appear as option text. There is no fetching/loading or per-option disabled prop.',
    props: [prop('products', 'readonly ProductOption[]', 'Options require id and name; description is optional.', true), prop('value', 'string', 'ID of the selected option.', true), prop('onValueChange', '(value: string) => void', 'Receives the selected option ID; the app must update value.', true), prop('label', 'string', 'Visible select label.', false, 'Product'), prop('disabled', 'boolean', 'Native disabled select.', false, 'undefined')], tokens: ['--t98-font', '--t98-text', '--t98-muted', '--t98-surface', '--t98-control-border', '--t98-radius', '--t98-accent'], accessibility: ['Field generates and associates a visible label with the native select.', 'Keyboard and mobile option selection use native platform behavior.'], related: ['Select', 'AppShell'], example: productCode(),
    states: [{ name: 'Controlled selection', description: 'Select another product; local value changes without navigation.', preview: <ProductDemo />, code: productCode() }, { name: 'Disabled', description: 'The native select cannot be changed.', preview: <ProductDemo disabled />, code: productCode(true) }, { name: 'No available products', description: 'An empty product array has no selectable options. The app should explain missing access outside this control.', preview: <ProductDemo empty disabled />, code: productCode(true, true) }],
  },
  {
    name: 'DateRangeField', category: 'Controls', description: 'A controlled pair of native date inputs using ISO date-only strings.', usage: 'Keep YYYY-MM-DD values or empty strings. The start input max is end, and the end input min is start. Invalid ordering is rejected without calling onChange and shows an alert if an out-of-range change reaches the handler. Browser date-entry behavior varies. No timezone conversion, presets, required prop or external error prop is provided.',
    props: [prop('label', 'string', 'Fieldset legend naming the date range.', true), prop('start', 'string', 'Controlled ISO date-only start, or empty string.', true), prop('end', 'string', 'Controlled ISO date-only end, or empty string.', true), prop('onChange', '(range: DateRange) => void', 'Receives { start: string; end: string } after ordering validation.', true), prop('disabled', 'boolean', 'Disable both native date inputs.', false, 'undefined')], tokens: ['--t98-font', '--t98-text', '--t98-muted', '--t98-surface', '--t98-control-border', '--t98-radius', '--t98-accent', '--t98-danger'], accessibility: ['Fieldset/legend groups labelled Start date and End date controls.', 'Ordering errors are announced and referenced by both date inputs.', 'Inputs stack below 600px.'], related: ['Field', 'Input'], example: dateCode(),
    states: [{ name: 'Populated range / constraints', description: 'Try changing either date. Start is constrained by end and end by start; callbacks update the visible range.', preview: <DateDemo />, code: dateCode() }, { name: 'Empty / partial range', description: 'Empty strings are supported. Set one date to inspect a partial range and the remaining constraint.', preview: <DateDemo empty />, code: dateCode(false, true) }, { name: 'Same-day range', description: 'A start equal to end is valid.', preview: <SameDayDemo />, code: tsx(['DateRangeField'], '<DateRangeField label="Reporting day" {...range} onChange={setRange} />', "const [range, setRange] = useState({ start: '2026-10-19', end: '2026-10-19' });", ['useState']) }, { name: 'Invalid ordering / error', description: 'Try typing an end date earlier than the start. Native min/max may prevent selection; if the browser emits an out-of-range change, the real alert appears and the valid controlled range is retained. Error state cannot be forced by a prop.', preview: <DateDemo />, code: dateCode() }, { name: 'Disabled', description: 'The current range remains visible and neither control can change.', preview: <DateDemo disabled />, code: dateCode(true) }],
  },
  {
    name: 'CopyButton', category: 'Controls', description: 'Copy a supplied string with temporary success or failure feedback.', usage: 'Use for snippets and identifiers. A user click calls navigator.clipboard.writeText; secure-context/clipboard permission failure is reported in the same control. Success and failure clear after 2.5 seconds. Copying does not verify installation or delivery. There is no disabled, loading, onCopy or controlled-status prop.',
    props: [prop('value', 'string', 'Exact text sent to the clipboard.', true), prop('label', 'string', 'Visible button label; unchanged by status feedback.', false, 'Copy')], tokens: ['--t98-font', '--t98-muted', '--t98-surface', '--t98-text', '--t98-control-border', '--t98-radius', '--t98-accent', '--t98-subtle', '--t98-control-height'], accessibility: ['Text feedback is in a status region; copied state also changes the icon.', 'The label should describe what will be copied; keep sensitive content out of public examples.'], related: ['SecretField', 'ResourceCard'], example: tsx(['CopyButton'], '<CopyButton value="demo_workspace_id" label="Copy workspace ID" />'),
    states: [{ name: 'Ready / copied / reset', description: 'Click Copy workspace ID. A successful browser operation announces Copied, then resets after 2.5 seconds.', preview: <CopyButton value="demo_workspace_id" label="Copy workspace ID" />, code: tsx(['CopyButton'], '<CopyButton value="demo_workspace_id" label="Copy workspace ID" />') }, { name: 'Clipboard failure', description: 'This uses the same real clipboard call. A denied or unavailable clipboard announces Copy failed; the catalogue does not fake a permission failure or overwrite the browser API.', preview: <CopyButton value="demo_failure_check" label="Try clipboard access" />, code: tsx(['CopyButton'], '<CopyButton value="demo_failure_check" label="Try clipboard access" />') }, { name: 'Default label / empty text', description: 'An empty string is a supported clipboard value; default button label is Copy.', preview: <CopyButton value="" />, code: tsx(['CopyButton'], '<CopyButton value="" />') }],
  },
  {
    name: 'SecretField', category: 'Controls', description: 'A read-only value with a labelled Show/Hide toggle.', usage: 'Presentation only: hiding a value does not encrypt it or protect a secret already delivered to the browser. Supply authorized data from the app. The input is read-only; there is no disabled, editable, initial-visible or copy prop.',
    props: [prop('label', 'string', 'Visible field label and toggle accessible-name suffix.', true), prop('value', 'string', 'Read-only browser-visible value.', true)], tokens: ['--t98-font', '--t98-mono', '--t98-text', '--t98-muted', '--t98-surface', '--t98-control-border', '--t98-radius', '--t98-accent'], accessibility: ['Generated label/input association.', 'Toggle has an explicit Show/Hide label and aria-pressed reflecting visibility.'], related: ['CopyButton', 'Input'], example: tsx(['SecretField'], '<SecretField label="Demo API key" value="demo_key_not_a_real_secret" />'),
    states: [{ name: 'Hidden / revealed', description: 'Initially masked. Click Show and Hide to inspect both genuine visibility states and the pressed state.', preview: <SecretField label="Demo API key" value="demo_key_not_a_real_secret" />, code: tsx(['SecretField'], '<SecretField label="Demo API key" value="demo_key_not_a_real_secret" />') }, { name: 'Empty value', description: 'The labelled read-only input and visibility toggle remain available for an empty value.', preview: <SecretField label="No demo key configured" value="" />, code: tsx(['SecretField'], '<SecretField label="No demo key configured" value="" />') }],
  },
  {
    name: 'ConfirmDialog', category: 'Feedback', description: 'A native modal confirmation with async pending, retryable errors and optional typed confirmation.', usage: 'The consumer controls open. Return a promise from onConfirm for async work; only successful resolution closes the dialog. Rejection stays open with a generic retry message. While pending, closing, Cancel and repeated confirmation are blocked. This presentation does not authorize server mutations.',
    props: [prop('open', 'boolean', 'Controlled modal visibility.', true), prop('onOpenChange', '(open: boolean) => void', 'Consumer must update open in response to close requests.', true), prop('title', 'string', 'Modal heading.', true), prop('description', 'string', 'Explain consequences before confirmation.', true), prop('onConfirm', '() => void | Promise<void>', 'Successful completion closes; thrown/rejected work leaves the dialog open for retry.', true), prop('confirmLabel', 'string', 'Confirmation button label.', false, 'Confirm'), prop('danger', 'boolean', 'Use the danger button variant.', false, 'false'), prop('confirmationText', 'string', 'Optional exact, case-sensitive required string; input resets on open.')], tokens: ['--t98-font', '--t98-text', '--t98-muted', '--t98-surface', '--t98-border', '--t98-radius', '--t98-danger', '--t98-danger-soft', '--t98-accent', '--t98-overlay', '--t98-bg', '--t98-control-border', '--t98-on-accent'], accessibility: ['Native dialog provides modal semantics and focus containment; Dialog labels and describes it.', 'Typed field is visibly labelled. Errors are announced by Alert.', 'Escape, backdrop and close controls are disabled while confirmation is pending; trigger focus is restored when it closes.'], related: ['Dialog', 'Button', 'Alert'], example: confirmCode('typed'),
    states: ([{ mode: 'default', name: 'Closed / open / cancelled / confirmed', description: 'Open the dialog, then Cancel or Confirm. Success closes it and updates the demo status.' }, { mode: 'danger', name: 'Danger', description: 'A destructive action uses the danger button styling.' }, { mode: 'typed', name: 'Typed / matching / mismatched', description: 'Confirm stays disabled until the exact case-sensitive word REMOVE is entered. Reopening resets the field.' }, { mode: 'pending', name: 'Pending', description: 'Open and Confirm: a local 1.8-second promise shows loading and prevents dismissal, then completes.' }, { mode: 'error', name: 'Rejected / retry', description: 'Open and Confirm: the local rejected promise produces the real retryable error. The dialog stays open; this demo keeps rejecting.' }] as const).map(item => ({ name: item.name, description: item.description, preview: <ConfirmDemo mode={item.mode} />, code: confirmCode(item.mode) })),
  },
  {
    name: 'ToastProvider', category: 'Feedback', description: 'One transient, dismissible notification exposed through useToast.', usage: 'Mount one provider around the app and call useToast inside its descendants. toast(message, tone?) defaults to success. The latest message replaces the previous one and automatically clears after 5 seconds; persistent histories belong in ActivityFeed. useToast throws outside a provider. There is no queue, position, duration or controlled-message prop.',
    props: [prop('children', 'ReactNode', 'App subtree whose consumers may call useToast.', true)], tokens: ['--t98-z-toast', '--t98-border', '--t98-radius', '--t98-surface', '--t98-text', '--t98-shadow-raised', '--t98-font', '--t98-muted', '--t98-accent', ...toneTokens], accessibility: ['A polite atomic live region announces the latest notification.', 'Dismiss notification has an accessible button label; notifications do not take focus.'], related: ['Alert', 'ActivityFeed'], example: toastCode(),
    states: [
      { name: 'Idle / default success', description: 'No toast appears until the consumer calls toast(). Click to show it, then wait 5 seconds or dismiss it.', preview: <ToastProvider><ToastActions tone="success" /></ToastProvider>, code: tsx(['ToastProvider', 'useToast', 'Button'], '<ToastProvider><Notify /></ToastProvider>', "function Notify() {\n  const { toast } = useToast();\n  return <Button onClick={() => toast('Demo settings saved')}>Show notification</Button>;\n}") },
      ...(['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const).map(tone => ({ name: `${tone[0].toUpperCase() + tone.slice(1)} tone`, description: 'Click the button to show this real toast; repeated calls replace the latest notification.', preview: <ToastProvider><ToastActions tone={tone} /></ToastProvider>, code: toastCode(tone) })),
      { name: 'Replace / dismiss / timeout', description: 'Show one tone, then another before it expires. Only the latest appears; Dismiss clears it immediately.', preview: <ToastProvider><ToastActions /></ToastProvider>, code: toastCode() },
    ],
  },
  {
    name: 'AuthLayout', category: 'Layout', description: 'Branded authentication presentation with optional explanatory side panel.', usage: 'Compose real native forms inside children. Authentication, validation, submission, recovery and redirect behavior remain app-owned. Reuse AppBrand and the Campaign login presentation. A side panel stacks above the form below 760px. Load styles.css once; no compatibility stylesheet is required. No login, error, loading or disabled props are built in.',
    props: [prop('brand', 'ReactNode', 'Brand content shown in the aside or above the form.', true), prop('title', 'string', 'Authentication-page h1.', true), prop('description', 'string', 'Optional supporting copy.'), prop('aside', 'ReactNode', 'Optional content enabling the split layout.'), prop('children', 'ReactNode', 'Consumer-owned form and feedback.', true), prop('footer', 'ReactNode', 'Optional legal, recovery or supporting content.')], tokens: ['--t98-surface', '--t98-subtle', '--t98-surface-raised', '--t98-text', '--t98-font', '--t98-accent', '--t98-muted'], accessibility: ['Layout includes an h1; native form validation, labels and autocomplete are shown in the complete example.', 'Associate errors with their relevant controls in real app forms.'], related: ['Field', 'Input', 'Alert', 'Button'], example: authCode(true),
    states: [{ name: 'Single panel / native validation', description: 'Submit the demo form empty to inspect native required-field validation. Filling it only updates a demo message.', preview: <AuthDemo />, code: authCode() }, { name: 'Split / responsive', description: 'The familiar Campaign story and form become one column below 760px.', preview: <AuthDemo split />, code: authCode(true) }, { name: 'App-owned error composition', description: 'Alert represents an app-provided rejection; this synthetic demo does not call an authentication service.', preview: <AuthDemo error />, code: authCode(false, true) }],
  },
  {
    name: 'PermissionMatrix', category: 'Controls', description: 'A controlled role-by-permission table with native checkboxes.', usage: 'The app owns grants, persistence, inherited permissions and authorization. value maps exact role strings to allowed permission IDs. onChange reports intent; update value to reflect it. Unknown role entries behave as unchecked. The matrix cannot secure a server operation and has no per-cell disabled or loading API.',
    props: [prop('roles', 'readonly string[]', 'Ordered unique role labels, also used as value keys.', true), prop('permissions', 'readonly Permission[]', 'Each permission requires id and label; description is optional.', true), prop('value', 'Readonly<Record<string, readonly string[]>>', 'Allowed permission IDs keyed by role.', true), prop('onChange', '(role: string, permissionId: string, allowed: boolean) => void', 'Consumer updates the controlled permission map.', true), prop('disabled', 'boolean', 'Disable every checkbox while retaining visible grants.', false, 'false')], tokens: [...surfaceTokens, '--t98-subtle', '--t98-accent', '--t98-cell-padding'], accessibility: ['Semantic table with caption, column headers and row headers.', 'Each checkbox is labelled with permission and role; a focusable scroll region supports wide tables.', 'Checkbox targets grow to 44px below 600px.'], related: ['Checkbox', 'SettingsSection', 'Alert'], example: permissionCode(),
    states: [{ name: 'Allowed / denied / editable', description: 'Toggle a checkbox to update controlled local grants; allowed and denied states remain visibly distinct.', preview: <PermissionDemo />, code: permissionCode() }, { name: 'Disabled / read-only', description: 'All current grants remain visible, with disabled native controls.', preview: <PermissionDemo disabled />, code: permissionCode(true) }, { name: 'No permissions', description: 'An empty permissions list leaves the caption and role headers; the app may supply an explanation outside it.', preview: <PermissionDemo empty />, code: permissionCode(false, true) }],
  },
];

function EmptyActionDemo() {
  const [created, setCreated] = useState(false);
  return created ? <p role="status">Demo report created.</p> : <EmptyState title="No saved reports" description="Create a report to see it here." action={<Button onClick={() => setCreated(true)}>Create demo report</Button>} />;
}
function HeaderActionDemo() {
  const [notice, setNotice] = useState('');
  return <div><PageHeader title="Overview" description="Review workspace traffic." actions={<Button onClick={() => setNotice('Demo report requested.')}>Create report</Button>} /><p role="status">{notice}</p></div>;
}
function SameDayDemo() {
  const [range, setRange] = useState({ start: '2026-10-19', end: '2026-10-19' });
  return <DateRangeField label="Reporting day" {...range} onChange={setRange} />;
}
