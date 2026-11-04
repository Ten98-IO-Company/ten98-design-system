import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DescriptionList, Heading, Link, SettingsLayout, Stack, Text, type DescriptionItem, type SettingsNavItem } from '@ten98/ui';
import '@ten98/ui/styles.css';

document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') === 'dark' ? 'dark' : 'light';

const sourceUrl = 'https://example.com/research/organic-search-visibility/retained-observations?country=ae&device=mobile';
const metadata: DescriptionItem[] = [
  { key: 'owner', term: 'Owner', description: 'Search team' },
  { key: 'scope', term: 'Scope', description: 'United Arab Emirates · mobile' },
  { key: 'zero', term: 'Measured results', description: 0 },
  { key: 'unknown', term: 'Visitor history', description: 'No observation supplied' },
  { key: 'url', term: 'Source URL', description: <Link href={sourceUrl}>{sourceUrl}</Link> },
  { key: 'long', term: 'CanonicalCollectionIdentifierWithoutWordBreaks012345678901234567890123456789', description: 'Retained source identity; no collection request is made.' },
];
const settings: SettingsNavItem[] = [
  { id: 'profile', label: 'Profile', group: 'account' },
  { id: 'security', label: 'Security', group: 'account' },
];

function SettingsProbe({ id, title }: { id: string; title: string }) {
  const [current, setCurrent] = useState('profile');
  return <section id={id} aria-label={title}>
    <SettingsLayout title={title} navigationLabel={title} items={settings} current={current} onNavigate={item => setCurrent(item.id)}>
      <Text>Selected setting: {current}</Text>
    </SettingsLayout>
  </section>;
}

function Screen() {
  return <main style={{ maxWidth: 1120, padding: 16, marginInline: 'auto', minWidth: 0, boxSizing: 'border-box' }}>
    <Stack gap={6}>
      <Heading level={1}>Record details</Heading>
      <section aria-label="Metadata layouts" style={{ minWidth: 0 }}>
        <Stack gap={5}>
          <div style={{ maxWidth: '48rem', minWidth: 0 }}><DescriptionList aria-label="Default metadata" items={metadata} /></div>
          <div style={{ maxWidth: '48rem', minWidth: 0 }}><DescriptionList aria-label="Explicit default metadata" orientation="vertical" density="comfortable" items={metadata} /></div>
          <div style={{ maxWidth: '48rem', minWidth: 0 }}><DescriptionList aria-label="Horizontal metadata" orientation="horizontal" items={metadata} /></div>
          <div style={{ maxWidth: '48rem', minWidth: 0 }}><DescriptionList aria-label="Compact metadata" orientation="horizontal" density="compact" items={metadata} /></div>
          <DescriptionList aria-label="Two-column metadata" columns={2} orientation="horizontal" items={metadata} />
          <DescriptionList aria-label="Three-column metadata" columns={3} orientation="horizontal" density="compact" items={metadata} />
        </Stack>
      </section>
      <SettingsProbe id="settings-root" title="Root settings" />
      <div className="t98-theme"><SettingsProbe id="settings-nested" title="Nested settings" /></div>
    </Stack>
  </main>;
}

createRoot(document.getElementById('information-design-fixture')!).render(<Screen />);
