import { BarList, ProportionBar, ShareChart, TimeSeriesChart, WeekdayHourGrid, type ChartSeries, type ShareSegment } from '../lib';
import { tsx, type ComponentEntry, type ComponentProp, type ComponentState } from './model';

const prop = (name: string, type: string, description: string, required = false, defaultValue?: string): ComponentProp => ({ name, type, description, ...(required && { required }), ...(defaultValue && { defaultValue }) });
const chartTokens = ['--t98-chart-1', '--t98-chart-2', '--t98-chart-3', '--t98-chart-4', '--t98-chart-5', '--t98-surface', '--t98-border', '--t98-text', '--t98-muted'];
const missing = 'Missing data is never drawn as 0: a null or unavailable point becomes a hatched column labelled Unavailable, and a partial point has a dashed outline and a ring.';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const visits: ChartSeries = { id: 'visits', label: 'Visits', points: [4, 7, null, 12, 9].map((y, index) => ({ x: index, xLabel: days[index], y, ...(index === 4 ? { state: 'partial' as const } : {}) })) };
const target: ChartSeries = { id: 'target', label: 'Target', role: 'comparison', points: [6, 6, 8, 10, 10].map((y, index) => ({ x: index, xLabel: days[index], y })) };
const months = ['Jan', 'Feb', 'Mar'];
const net: ChartSeries[] = [
  { id: 'in', label: 'Income', points: [5, 8, 6].map((y, index) => ({ x: index, xLabel: months[index], y })) },
  { id: 'out', label: 'Refunds', points: [-2, -4, -1].map((y, index) => ({ x: index, xLabel: months[index], y })) },
];
const daysCode = "const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];";
const visitsCode = `${daysCode}
const visits: ChartSeries = {
  id: 'visits',
  label: 'Visits',
  points: [4, 7, null, 12, 9].map((y, index) => ({ x: index, xLabel: days[index], y, ...(index === 4 ? { state: 'partial' as const } : {}) })),
};`;
const targetCode = `const target: ChartSeries = {
  id: 'target',
  label: 'Target',
  role: 'comparison',
  points: [6, 6, 8, 10, 10].map((y, index) => ({ x: index, xLabel: days[index], y })),
};`;
const netCode = `const months = ['Jan', 'Feb', 'Mar'];
const net: ChartSeries[] = [
  { id: 'in', label: 'Income', points: [5, 8, 6].map((y, index) => ({ x: index, xLabel: months[index], y })) },
  { id: 'out', label: 'Refunds', points: [-2, -4, -1].map((y, index) => ({ x: index, xLabel: months[index], y })) },
];`;
const chartImports = ['TimeSeriesChart', 'type ChartSeries'];
const chartCode = (kind: string) => tsx(chartImports, `<TimeSeriesChart label="Visits" context="Last five days" summary="Visits rose to 12 on Thursday; Wednesday is unavailable." kind="${kind}" series={[visits]} />`, visitsCode);
const chartState = (name: string, description: string, kind: 'bars' | 'line' | 'area'): ComponentState =>
  ({ name, description, preview: <TimeSeriesChart label="Visits" context="Last five days" summary="Visits rose to 12 on Thursday; Wednesday is unavailable." kind={kind} series={[visits]} />, code: chartCode(kind) });

const shareParts: ShareSegment[] = [{ id: 'opened', label: 'Opened', count: 30, tone: 1 }, { id: 'clicked', label: 'Clicked', count: 8, tone: 2 }, { id: 'unopened', label: 'Unopened', count: 12, tone: 3 }];
const shareCode = `const segments: ShareSegment[] = [
  { id: 'opened', label: 'Opened', count: 30, tone: 1 },
  { id: 'clicked', label: 'Clicked', count: 8, tone: 2 },
  { id: 'unopened', label: 'Unopened', count: 12, tone: 3 },
];`;
const shareState = (component: 'ProportionBar' | 'ShareChart', name: string, description: string, total: number | null, extra = ''): ComponentState => {
  const jsx = `<${component} label="Delivery outcome" segments={segments} total={${total}}${extra} />`;
  const preview = component === 'ProportionBar'
    ? <ProportionBar label="Delivery outcome" segments={shareParts} total={total} {...(extra ? { emptyMessage: 'No recipients yet.' } : {})} />
    : <ShareChart label="Delivery outcome" segments={shareParts} total={total} />;
  return { name, description, preview, code: tsx([component, 'type ShareSegment'], jsx, shareCode) };
};
const barItems = "[\n  { id: 'search', label: 'Search', value: 90, valueText: 'AED 90', share: 0.9, secondary: { label: 'Remaining', valueText: 'AED 10', share: 0.1 } },\n  { id: 'email', label: 'Email', value: null, valueText: '', reason: 'No spend report yet.' },\n]";

const hourWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hourValues = hourWeekdays.map((_, day) => Array.from({ length: 24 }, (__, hour) => day === 6 && hour === 3 ? null : Math.round((day < 5 ? 40 : 15) * Math.exp(-((hour - 10) ** 2) / 18))));
const hourSetup = "const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];\n// One row of 24 hourly values per weekday; null where the hour could not be measured.\nconst values: (number | null)[][] = weekdays.map(() => Array.from({ length: 24 }, () => 0));";

export const chartEntries: ComponentEntry[] = [
  {
    name: 'TimeSeriesChart', category: 'Data display',
    description: 'Bars, grouped or stacked bars, a line or an area over time, with a keyboard-inspectable plot and a data table of every point.',
    usage: `Pass values the application has already computed; the component only draws them. ${missing} Always supply a summary that states what the chart shows.`,
    props: [
      prop('label', 'string', 'Chart name, used as the caption and in accessible names.', true),
      prop('summary', 'ReactNode', "The application's reading of the chart; the SVG references it through aria-describedby.", true),
      prop('kind', "'bars' | 'grouped-bars' | 'stacked-bars' | 'line' | 'area'", 'Drawing style. Stacked negatives extend below the baseline.', true),
      prop('series', 'ChartSeries[]', 'Series with points { x, xLabel, y, state, note }; y may be null. A comparison series is outlined, not filled.', true),
      prop('context', 'ReactNode', 'Date range, filters or units beside the label.'),
      prop('xScale', "'band' | 'linear'", 'Even spacing by position, or placement by x (with xDomain).', false, "'band'"),
      prop('xDomain', 'readonly [number, number]', 'Range of x for a linear scale.'),
      prop('formatY', '(value: number) => string', 'Formats axis ticks, announcements, the table and the computed statistics.'),
      prop('yDomain', "readonly [number, number] | 'nice'", 'Fixed y range, or a rounded extent of the data.', false, "'nice'"),
      prop('baselineLabel', 'string', 'Text on the zero line.'),
      prop('xHeader', 'string', 'Header of the first data-table column.', false, "'Point'"),
      prop('formatXTick', '(point: ChartPoint, index: number) => string', 'Short axis label for a point, for example "W7". The table and announcements keep the full xLabel.'),
      prop('fit', "'scroll' | 'compress'", 'scroll keeps a minimum width per point and scrolls; compress fits every point into the figure with thinned labels.', false, "'scroll'"),
      prop('minStep', 'number', 'Minimum width per point in pixels (48 scrolling, 3 compressing).'),
      prop('tableColumns', '{ header: string; values: ReactNode[] }[]', 'Extra exact columns in the data table, one value per x position.'),
      prop('onInspect', '(index: number) => void', 'Called when the keyboard moves to another x position.'),
      prop('notice', 'ReactNode', 'A note such as a late-data warning.'),
      prop('loading', 'boolean', 'Replaces the plot with a busy status line.'),
      prop('emptyMessage', 'ReactNode', 'Shown when there are no points.'),
    ],
    tokens: chartTokens,
    accessibility: ['The plot is a focusable labelled region: ArrowLeft/Right move between points, Home/End jump to the ends, ArrowUp/Down switch series; a polite live region announces "x · series: value (partial|unavailable)".', 'The plot fills its figure, keeps a minimum width per point and scrolls inside its region without widening the page; it stays left-to-right in right-to-left pages.', 'Axis labels never overlap: ticks are thinned to every Nth point (first and last always shown) and a long label is truncated with the full text in a hover title and the data table.', 'A computed "N points, minimum, maximum, N unavailable" line and a table of every point are always available; the table is a focusable scroll region.', 'Series differ by pattern, dash and marker as well as colour; forced-colors mode uses system colours.'],
    related: ['BarList', 'ShareChart', 'Sparkline', 'DataTable'],
    example: chartCode('bars'),
    states: [
      chartState('Bars', 'One bar per point; Wednesday is unavailable and Friday partial.', 'bars'),
      chartState('Line', 'A null point breaks the line instead of dipping to zero.', 'line'),
      chartState('Area', 'Filled under each run of known values.', 'area'),
      {
        name: 'Comparison series', description: 'The comparison is outlined and dashed; the primary series is filled.',
        preview: <TimeSeriesChart label="Visits against target" summary="Visits met the target on Tuesday and Thursday." kind="bars" series={[visits, target]} />,
        code: tsx(chartImports, '<TimeSeriesChart label="Visits against target" summary="Visits met the target on Tuesday and Thursday." kind="bars" series={[visits, target]} />', `${visitsCode}\n${targetCode}`),
      },
      {
        name: 'Stacked with negatives', description: 'Refunds stack below the baseline.',
        preview: <TimeSeriesChart label="Income and refunds" summary="Income exceeded refunds every month." kind="stacked-bars" series={net} baselineLabel="Zero" />,
        code: tsx(chartImports, '<TimeSeriesChart label="Income and refunds" summary="Income exceeded refunds every month." kind="stacked-bars" series={net} baselineLabel="Zero" />', netCode),
      },
      { name: 'Empty', description: 'No points.', preview: <TimeSeriesChart label="Visits" summary="No visits recorded." kind="line" series={[]} emptyMessage="No visits in this period." />, code: tsx(['TimeSeriesChart'], '<TimeSeriesChart label="Visits" summary="No visits recorded." kind="line" series={[]} emptyMessage="No visits in this period." />') },
      { name: 'Loading', description: 'A busy status line replaces the plot.', preview: <TimeSeriesChart label="Visits" summary="Loading." kind="line" series={[]} loading />, code: tsx(['TimeSeriesChart'], '<TimeSeriesChart label="Visits" summary="Loading." kind="line" series={[]} loading />') },
    ],
  },
  {
    name: 'BarList', category: 'Data display',
    description: 'Ranked horizontal bars with the value always shown as text, optional selection, links and a secondary value.',
    usage: `Use for ranked breakdowns such as spend by channel. Bar length comes from the application's share; the visible value text is the source of truth. ${missing}`,
    props: [
      prop('label', 'string', 'Accessible name of the list.', true),
      prop('items', 'BarListItem[]', 'Items { id, label, value, valueText, share, reason, secondary, href, onSelect, selected }. value null shows Unavailable.', true),
      prop('emptyMessage', 'ReactNode', 'Shown when there are no items.', false, "'No items.'"),
    ],
    tokens: chartTokens,
    accessibility: ['An ordered list; each value is visible text, never only bar length.', 'Items with onSelect are buttons with aria-pressed; items with href are links.', 'A reason explains partial or unavailable values.'],
    related: ['TimeSeriesChart', 'ProportionBar'],
    example: tsx(['BarList'], `<BarList label="Spend by channel" items={${barItems}} />`),
    states: [{
      name: 'Ranked', description: 'A secondary value and an unavailable item.',
      preview: <BarList label="Spend by channel" items={[{ id: 'search', label: 'Search', value: 90, valueText: 'AED 90', share: 0.9, secondary: { label: 'Remaining', valueText: 'AED 10', share: 0.1 } }, { id: 'email', label: 'Email', value: null, valueText: '', reason: 'No spend report yet.' }]} />,
      code: tsx(['BarList'], `<BarList label="Spend by channel" items={${barItems}} />`),
    }],
  },
  {
    name: 'ProportionBar', category: 'Data display',
    description: 'One bar split by count with a legend that states every count and share.',
    usage: `Use for a single total split into a few parts. The application supplies the total. ${missing}`,
    props: [
      prop('label', 'string', 'Name of the measure.', true),
      prop('segments', 'ShareSegment[]', 'Parts { id, label, count, tone }.', true),
      prop('total', 'number | null', 'Total count. null shows Unavailable; 0 shows emptyMessage.', true),
      prop('formatCount', '(count: number) => string', 'Formats counts.'),
      prop('emptyMessage', 'ReactNode', 'Shown when the total is 0.', false, "'No samples'"),
    ],
    tokens: chartTokens, accessibility: ['The bar is decorative; the legend lists each part with its count and percentage.', 'Parts differ by pattern as well as colour.'], related: ['ShareChart', 'BarList'],
    example: tsx(['ProportionBar', 'type ShareSegment'], '<ProportionBar label="Delivery outcome" segments={segments} total={50} />', shareCode),
    states: [
      shareState('ProportionBar', 'Split', 'Three parts.', 50),
      shareState('ProportionBar', 'Unavailable', 'The total could not be obtained.', null),
      shareState('ProportionBar', 'No samples', 'A total of 0 shows the empty message.', 0, ' emptyMessage="No recipients yet."'),
    ],
  },
  {
    name: 'ShareChart', category: 'Data display',
    description: 'A donut with a legend of shares and a data table with a total row.',
    usage: `Use when parts of a whole need a visual shape in addition to the figures. ${missing}`,
    props: [
      prop('label', 'string', 'Name of the measure.', true),
      prop('segments', 'ShareSegment[]', 'Parts { id, label, count, tone }.', true),
      prop('total', 'number | null', 'Total count. null shows Unavailable; 0 shows emptyMessage.', true),
      prop('context', 'ReactNode', 'Date range or filters beside the label.'),
      prop('summary', 'ReactNode', "The application's reading of the chart."),
      prop('formatCount', '(count: number) => string', 'Formats counts.'),
      prop('emptyMessage', 'ReactNode', 'Shown when the total is 0.', false, "'No samples'"),
      prop('notice', 'ReactNode', 'A note such as a late-data warning.'),
    ],
    tokens: chartTokens, accessibility: ['The donut is aria-hidden; the legend and the table (with a total row) carry every figure.', 'Slices differ by pattern as well as colour; forced-colors mode uses outlines.'], related: ['ProportionBar', 'TimeSeriesChart'],
    example: tsx(['ShareChart', 'type ShareSegment'], '<ShareChart label="Delivery outcome" segments={segments} total={50} />', shareCode),
    states: [
      shareState('ShareChart', 'Donut', 'Three parts with a legend and a table.', 50),
      shareState('ShareChart', 'Unavailable', 'The total could not be obtained.', null),
      shareState('ShareChart', 'No samples', 'A total of 0.', 0),
    ],
  },
  {
    name: 'WeekdayHourGrid', category: 'Data display',
    description: 'A weekday by hour density table: every cell states its value, shaded in square-root steps.',
    usage: `Use for when-do-people-act views such as sessions or sends by weekday and hour. Supply seven rows of 24 values in the order of weekdays and say the time zone in context. ${missing}`,
    props: [
      prop('label', 'string', 'Caption and table name.', true),
      prop('context', 'ReactNode', 'Date range, metric and time zone.'),
      prop('summary', 'ReactNode', 'The application\'s own reading of the grid.', true),
      prop('values', '(number | null)[][]', 'One row of 24 values per weekday; null or missing reads Unavailable.', true),
      prop('weekdays', 'string[]', 'Row names in the order of values.', true),
      prop('formatValue', '(value: number) => string', 'Cell text.'),
      prop('hourLabels', 'string[]', 'Column headers; defaults to 00 to 23.'),
    ],
    tokens: [...chartTokens, '--t98-on-accent'],
    accessibility: ['A real table with weekday row headers and hour column headers, inside a focusable scroll region; it stays left to right in RTL.', 'Each cell shows its value as text with at least 4.5:1 contrast at every shade; shading is supplementary.', 'Unavailable cells are hatched and read "Unavailable", never 0.'],
    related: ['TimeSeriesChart', 'HeatmapPlane'],
    example: tsx(['WeekdayHourGrid'], '<WeekdayHourGrid label="Sessions by hour" context="1-21 October 2026 · Asia/Dubai"\n  summary="Weekday mornings are busiest." values={values} weekdays={weekdays} />', hourSetup),
    states: [{ name: 'Week of sessions', description: 'Weekday mornings peak; Sunday 03:00 is unavailable.', preview: <WeekdayHourGrid label="Sessions by hour" context="1-21 October 2026 · Asia/Dubai" summary="Weekday mornings are busiest." values={hourValues} weekdays={hourWeekdays} />, code: tsx(['WeekdayHourGrid'], '<WeekdayHourGrid label="Sessions by hour" context="1-21 October 2026 · Asia/Dubai"\n  summary="Weekday mornings are busiest." values={values} weekdays={weekdays} />', hourSetup) }],
  },
];
