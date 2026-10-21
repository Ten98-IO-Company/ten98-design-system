import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarList, Heading, ProportionBar, ShareChart, Stack, Text, TimeSeriesChart, type ChartSeries, type ShareSegment } from '@ten98/ui';
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
const dense: ChartSeries = { id: 'dense', label: 'Daily', points: Array.from({ length: 60 }, (_, index) => ({ x: index, xLabel: `Day number ${index + 1} of the campaign`, y: 10 + (index * 7) % 23 })) };
const segments: ShareSegment[] = [{ id: 'a', label: 'Opened', count: 30, tone: 1 }, { id: 'b', label: 'Clicked', count: 8, tone: 2 }, { id: 'c', label: 'Unopened', count: 12, tone: 3 }];

function Screen() {
  const [inspected, setInspected] = useState(-1);
  const [chosen, setChosen] = useState('search');
  return <Stack as="main" gap={6} id="charts">
    <Heading level={1}>Charts</Heading>
    <TimeSeriesChart label="Weekly visits" context="Eight weeks" summary="Visits grew to 30; week three is unavailable." kind="bars" series={[visits]} baselineLabel="Zero" onInspect={setInspected} tableColumns={[{ header: 'Source', values: labels.map((_, index) => `Source ${index + 1}`) }]} />
    <Text id="inspected">Inspected: {inspected}</Text>
    <TimeSeriesChart label="Sixty days" summary="A dense series scrolls inside its region." kind="line" series={[dense]} formatXTick={(_, index) => `D${index + 1}`} />
    <TimeSeriesChart label="Visits and sign-ups" summary="Sign-ups follow visits." kind="line" series={[visits, signups]} />
    <TimeSeriesChart label="Visits against target" summary="Visits missed the target in most weeks." kind="grouped-bars" series={[signups, target]} />
    <TimeSeriesChart label="Visits trend" summary="Area of visits." kind="area" series={[signups, target]} />
    <TimeSeriesChart label="Visits and sign-ups stacked" summary="Stacked with a negative week." kind="stacked-bars" series={[visits, signups]} />
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

createRoot(document.getElementById('charts-fixture')!).render(<Screen />);
