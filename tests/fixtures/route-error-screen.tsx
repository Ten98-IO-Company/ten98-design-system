import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, AppTopbar, Button, Heading, RouteErrorScreen, Stack, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// A route that fails replaces the page in the shell's content area, the way a router's default error component does.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';

function Screen() {
  const [failed, setFailed] = useState(false);
  const [retries, setRetries] = useState(0);
  return <AppShell sidebar={<Heading level={2}>Discover</Heading>} topbar={<AppTopbar breadcrumb={{ icon: 'home', scope: 'Acme', current: 'Reports' }} />} mainLabel="Page content">
    {failed
      ? <RouteErrorScreen message="The report could not load. Reference: 7F3A-21C9." onRetry={() => { setRetries(count => count + 1); setFailed(false); }} homeHref="/home" />
      : <Stack gap={4}>
        <Heading level={1}>Reports</Heading>
        <Button onClick={() => setFailed(true)}>Open the report</Button>
        <Text id="retries">Retries: {retries}</Text>
      </Stack>}
  </AppShell>;
}
createRoot(document.getElementById('route-error-screen-fixture')!).render(<Screen />);
