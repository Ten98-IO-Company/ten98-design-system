import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Heading, MetricTabs, Stack, Text, TimeSeriesChart, type ChartSeries } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
document.documentElement.dir = params.get('dir') === 'rtl' ? 'rtl' : 'ltr';

const dates = ['2026-10-30', '2026-10-31', '2026-11-01'];
const pageViews: ChartSeries = { id: 'pageViews', label: 'Page views', points: [12, 0, 8].map((y, x) => ({ x, xLabel: dates[x], y })) };
const customEvents: ChartSeries = { id: 'customEvents', label: 'Events', points: [1, 0, 2].map((y, x) => ({ x, xLabel: dates[x], y })) };

function Screen() {
  const [value, setValue] = useState('pageViews');
  const [changes, setChanges] = useState(0);
  const [viewsUnavailable, setViewsUnavailable] = useState(false);
  return <Stack as="main" gap={5} id="metric-tabs">
    <Heading level={1}>Daily analytics metrics</Heading>
    <MetricTabs label="Daily metric" value={value} onValueChange={next => { setValue(next); setChanges(count => count + 1); }} items={[
      { value: 'pageViews', label: 'Page views', metric: '20', change: { label: '+10%', tone: 'positive' }, unavailableReason: viewsUnavailable ? 'Page view history is no longer available.' : undefined, content: <TimeSeriesChart label="Daily page views" summary="Page views include a day with zero." kind="line" fit="compress" bare height={160} series={[pageViews]} /> },
      { value: 'sessions', label: 'Sessions and returning visitor history', metric: 'Unavailable', unavailableReason: 'Session history is not supplied by this report.', content: <Text>No session history supplied.</Text> },
      { value: 'customEvents', label: 'Events', metric: '3', content: <TimeSeriesChart label="Daily custom events" summary="Events include a day with zero." kind="bars" fit="compress" bare height={160} series={[customEvents]} /> },
    ]} />
    <Text id="selected-metric">Selected metric: {value}</Text>
    <Text id="metric-changes">Selection changes: {changes}</Text>
    <Button type="button" onClick={() => setViewsUnavailable(true)}>Make page views unavailable</Button>
  </Stack>;
}

createRoot(document.getElementById('metric-tabs-fixture')!).render(<Screen />);
