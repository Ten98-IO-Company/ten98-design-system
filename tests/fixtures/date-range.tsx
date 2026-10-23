import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, DateRangeField, Heading, Stack, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';

function Screen() {
  // A half-open [start, end) range, as reporting APIs take it.
  const [range, setRange] = useState({ start: '2026-10-01', end: '2026-10-08' });
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState('');
  return <Stack as="main" gap={6} id="date-range">
    <Heading level={1}>Date range</Heading>
    <DateRangeField label="Reporting period" {...range} min="2026-01-01" max="2026-10-21" maxDays={31} endExclusive
      onChange={(next, nextProblem) => { setRange(next); setProblem(nextProblem); }} />
    <Text id="range">{range.start} to {range.end}</Text>
    <Button disabled={problem !== null} onClick={() => setSaved(`${range.start}/${range.end}`)}>Apply range</Button>
    <Text id="saved">{saved}</Text>
  </Stack>;
}

createRoot(document.getElementById('date-range-fixture')!).render(<Screen />);
