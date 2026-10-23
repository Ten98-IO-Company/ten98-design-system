import { createRoot } from 'react-dom/client';
import { Button, PageHeader, Stack } from '@ten98/ui';
import '@ten98/ui/styles.css';

// Composed the way an application screen must be: library components only. The title and description carry a user-supplied
// name and an unbroken origin, isolated with <bdi> as Discover needs.
function Screen() {
  return <Stack as="main" gap={4}>
    <PageHeader eyebrow="Settings" title={<>Analytics for <bdi>Spring launch microsite</bdi></>}
      description={<>Unavailable analytics · <bdi>https://springlaunchmicrositewithalongunbrokenorigin.example.com</bdi></>}
      actions={<Button variant="secondary">Retry</Button>} />
  </Stack>;
}
createRoot(document.getElementById('page-header-fixture')!).render(<Screen />);
