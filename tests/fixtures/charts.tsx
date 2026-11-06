import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarList, Heading, ProportionBar, ShareChart, Stack, Text, TimeSeriesChart, WeekdayHourGrid, type ChartSeries, type ShareSegment } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles.
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
document.documentElement.dir = params.get('dir') === 'rtl' ? 'rtl' : 'ltr';

const labels = ['Week one of the launch', 'Week two of the launch', 'Week three of the launch', 'Week four of the launch', 'Week five of the launch', 'Week six of the launch', 'Week seven of the launch', 'Week eight of the launch'];
const make = (values: (number | null)[], states: Record<number, 'partial'> = {}) => values.map((y, index) => ({ x: index, xLabel: labels[index], y, ...(states[index] ? { state: states[index] } : {}) }));
const visits: ChartSeries = { id: 'visits', label: 'Visits', points: make([12, 18, null, 25, 21, -4, 30, 28], { 4: 'partial' }) };
const signups: ChartSeries = { id: 'signups', label: 'Sign-ups', points: make([5, 9, 7, 12, 10, 8, 14, 13]) };
const target: ChartSeries = { id: 'target', label: 'Target', role: 'comparison', points: make([15, 15, 20, 20, 25, 25, 30, 30]) };
const dailyLabels = ['October 30, 2026: the full recorded UTC day, including all available page views and custom event observations', 'October 31, 2026: a partially collected UTC day', 'November 1, 2026: the full recorded UTC day'];
const daily = (values: (number | null)[]) => values.map((y, x) => ({ x, xLabel: dailyLabels[x], y }));
const dailyViews: ChartSeries = { id: 'pageViews', label: 'Page views', points: daily([0, 12, 8]) };
const dailyEvents: ChartSeries = { id: 'customEvents', label: 'Events', points: daily([null, 3, 2]).map((point, i) => i === 1 ? { ...point, state: 'partial' as const } : point) };
const dailyPrevious: ChartSeries = { id: 'previous', label: 'Previous page views', role: 'comparison', points: daily([14, 10, 9]) };
const statisticPoints = (values: (number | null)[]) => values.map((y, x) => ({ x, xLabel: `Day ${x + 1}${x === 2 ? ' (skipped local date)' : ''}`, y }));
const statisticSeries: ChartSeries[] = [
  { id: 'views', label: 'Page views', points: statisticPoints([3, 0, null, 2, null, 5]).map((point, index) => ({ ...point, state: index === 3 ? 'partial' : index === 5 ? 'unavailable' : 'observed' })) },
  { id: 'events', label: 'Custom events', points: statisticPoints([6, 0, null, 1, 4, 2]) },
];
const signedStatisticSeries: ChartSeries[] = [
  { id: 'a', label: 'A', points: statisticPoints([3, -4, null]) },
  { id: 'b', label: 'B', points: statisticPoints([6, -2, null]) },
];
const dense: ChartSeries = { id: 'dense', label: 'Daily', points: Array.from({ length: 60 }, (_, index) => ({ x: index, xLabel: `Day number ${index + 1} of the campaign`, y: 10 + (index * 7) % 23 })) };
const segments: ShareSegment[] = [{ id: 'a', label: 'Opened', count: 30, tone: 1 }, { id: 'b', label: 'Clicked', count: 8, tone: 2 }, { id: 'c', label: 'Unopened', count: 12, tone: 3 }];

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hourValues = weekdays.map((_, day) => Array.from({ length: 24 }, (__, hour) => day === 6 && hour === 3 ? null : Math.round(40 * Math.exp(-((hour - 10) ** 2) / 18))));
function Screen() {
  const [inspected, setInspected] = useState(-1);
  const [chosen, setChosen] = useState('search');
  const [dailyInspections, setDailyInspections] = useState(0);
  return <Stack as="main" gap={6} id="charts">
    <TimeSeriesChart label="Ninety days compressed" summary="Every day fits in the figure." kind="bars" fit="compress" series={[{ id: 'days', label: 'Visits', points: Array.from({ length: 90 }, (_, i) => ({ x: i, xLabel: `Day ${i + 1}`, y: i % 11 === 0 ? null : 20 + (i % 9) * 5 })) }]} />
    <WeekdayHourGrid label="Sessions by hour" context="Asia/Dubai" summary="Weekday mornings are busiest." weekdays={weekdays} values={hourValues} />
    <Heading level={1}>Charts</Heading>
    <TimeSeriesChart label="Weekly visits" context="Eight weeks" summary="Visits grew to 30; week three is unavailable." kind="bars" series={[visits]} baselineLabel="Zero" onInspect={setInspected} tableColumns={[{ header: 'Source', values: labels.map((_, index) => `Source ${index + 1}`) }]} />
    <Text id="inspected">Inspected: {inspected}</Text>
    <TimeSeriesChart label="Sixty days" summary="A dense series scrolls inside its region." kind="line" series={[dense]} formatXTick={(_, index) => `D${index + 1}`} />
    <TimeSeriesChart label="Visits and sign-ups" summary="Sign-ups follow visits." kind="line" series={[visits, signups]} />
    <TimeSeriesChart label="Visits against target" summary="Visits missed the target in most weeks." kind="grouped-bars" series={[signups, target]} />
    <TimeSeriesChart label="Visits trend" summary="Area of visits." kind="area" series={[signups, target]} />
    <TimeSeriesChart label="Visits and sign-ups stacked" summary="Stacked with a negative week." kind="stacked-bars" series={[visits, signups]} />
    <TimeSeriesChart label="Embedded page views" summary="Page views include a day with zero." kind="line" fit="compress" bare height={144} series={[dailyViews]} />
    <TimeSeriesChart label="Daily event comparison" summary="Events have one unavailable day and one partial day; the previous period stays separate." kind="line" fit="compress" height={320} series={[dailyViews, dailyEvents, dailyPrevious]} onInspect={() => setDailyInspections(count => count + 1)} />
    <Text id="daily-inspections">Daily inspections: {dailyInspections}</Text>
    <TimeSeriesChart label="Stacked daily statistics" summary="Explicit app summary stays visible beside accurate computed statistics." kind="stacked-bars" series={statisticSeries} />
    <TimeSeriesChart label="Signed stack statistics" summary="Positive and negative observations remain separate stacks." kind="stacked-bars" series={signedStatisticSeries} />
    <TimeSeriesChart label="Grouped daily statistics" summary="Individual series retain their observed values." kind="grouped-bars" series={statisticSeries} />
    <BarList label="Spend by channel" items={[
      { id: 'search', label: 'Search', value: 90, valueText: 'AED 90', share: 0.9, secondary: { label: 'Remaining', valueText: 'AED 10', share: 0.1 }, onSelect: () => setChosen('search'), selected: chosen === 'search' },
      { id: 'social', label: 'Social', value: 40, valueText: 'AED 40', share: 0.4, onSelect: () => setChosen('social'), selected: chosen === 'social' },
      { id: 'email', label: 'Email', value: null, valueText: '', reason: 'No spend report yet.' },
    ]} />
    <ProportionBar label="Delivery outcome" segments={segments} total={50} />
    <ShareChart label="Delivery share" segments={segments} total={50} />
    <ShareChart label="Unavailable share" segments={segments} total={null} />
  </Stack>;
}

const minuteLabels = Array.from({ length: 31 }, (_, index) => `November 6, 2026, 12:${String(index).padStart(2, '0')}:00 UTC`);
const minutePoints = (values: (number | null)[]) => values.map((y, x) => ({ x, xLabel: minuteLabels[x], y }));
const zeroViews: ChartSeries = { id: 'pageViews', label: 'Page views', points: minutePoints(Array.from({ length: 31 }, () => 0)) };
const missingViews: ChartSeries = { id: 'pageViews', label: 'Page views', points: minutePoints(Array.from({ length: 31 }, () => null)) };
const missingVisitors: ChartSeries = { id: 'visitors', label: 'Estimated visitors', role: 'comparison', points: minutePoints(Array.from({ length: 31 }, () => null)) };
const mixedVisitors: ChartSeries = { id: 'visitors', label: 'Estimated visitors', role: 'comparison', points: minutePoints(Array.from({ length: 31 }, (_, index) => [5, 13, 25].includes(index) ? null : index % 7 + 1)) };

function MissingDensityScreen() {
  return <Stack as="main" gap={6} id="dense-missing-charts">
    <Heading level={1}>Dense missing data</Heading>
    <TimeSeriesChart label="Zero page views with unavailable visitors" summary="Thirty-one synthetic minutes contain measured zero page views and no supplied visitor observations." kind="grouped-bars" fit="compress" bare series={[zeroViews, missingVisitors]} />
    <TimeSeriesChart label="Mixed visitor availability" summary="Thirty-one synthetic minutes retain three missing visitor observations among measured values." kind="grouped-bars" fit="compress" bare series={[zeroViews, mixedVisitors]} />
    <TimeSeriesChart label="Wholly unavailable period" summary="Neither series has supplied observations for these thirty-one synthetic minutes." kind="grouped-bars" fit="compress" bare series={[missingViews, missingVisitors]} />
  </Stack>;
}

createRoot(document.getElementById('charts-fixture')!).render(params.get('view') === 'dense-missing' ? <MissingDensityScreen /> : <Screen />);
