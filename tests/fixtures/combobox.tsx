import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Combobox, Heading, MultiCombobox, Stack, Text, type ComboboxOption } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';

const airports: ComboboxOption[] = [{ value: 'DXB', label: 'Dubai (DXB)' }, { value: 'DOH', label: 'Doha (DOH)' }, { value: 'RUH', label: 'Riyadh (RUH)' }, { value: 'AUH', label: 'Abu Dhabi (AUH)' }];

/** A controllable stand-in for an app search: each request waits until the test resolves it. */
declare global { interface Window { resolveSearch: () => void; searches: string[] } }
window.searches = [];
function useSearch() {
  const [results, setResults] = useState<ComboboxOption[]>(airports);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const pending = useRef('');
  window.resolveSearch = () => {
    const text = pending.current.toLowerCase();
    setLoading(false);
    if (text === 'zz') { setLoadError('Airports could not load.'); setResults([]); return; }
    setResults(airports.filter(option => option.label.toLowerCase().includes(text)));
  };
  return { results, loading, loadError, search: (text: string) => { window.searches.push(text); pending.current = text; setLoading(true); setLoadError(undefined); } };
}

function Screen() {
  const [airport, setAirport] = useState('');
  const single = useSearch();
  const [values, setValues] = useState<ComboboxOption[]>([airports[0]]);
  const [submitted, setSubmitted] = useState('');
  return <Stack as="main" gap={6} id="combobox">
    <Heading level={1}>Combobox</Heading>
    <Combobox label="Airport" options={single.results} filter={false} loading={single.loading} loadError={single.loadError} onInputChange={single.search}
      value={airport} onValueChange={setAirport} valueLabel={airports.find(option => option.value === airport)?.label} allowCustom={false} name="airport" />
    <Stack as="form" gap={3} onSubmit={event => { event.preventDefault(); setSubmitted(new FormData(event.currentTarget as HTMLFormElement).getAll('to').join(',')); }}>
      <MultiCombobox label="Destinations" options={airports} values={values} onValuesChange={setValues} name="to" required />
      <Button type="submit">Save destinations</Button>
    </Stack>
    <Text id="submitted">{submitted}</Text>
  </Stack>;
}

createRoot(document.getElementById('combobox-fixture')!).render(<Screen />);
