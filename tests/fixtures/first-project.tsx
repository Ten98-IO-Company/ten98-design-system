import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PageHeader, ProjectCreateFlow, Stack, Text } from '@ten98/ui';
import '@ten98/ui/styles.css';

// The in-shell first-project step both apps share: PageHeader plus ProjectCreateFlow, with the sample-data opt-in and a
// "Skip for now" action beside the submit. Library components only.
function Screen() {
  const [log, setLog] = useState('');
  return <Stack as="main" gap={4}>
    <PageHeader title="Create your first project" />
    <ProjectCreateFlow mode="create" defaultValues={{ name: '' }} showOrigin={false} sampleOptIn={{ label: 'Add sample data' }}
      cancel={{ label: 'Skip for now', onClick: () => setLog('skipped') }} onSubmit={values => setLog(JSON.stringify(values))} />
    <Text id="log">{log}</Text>
  </Stack>;
}
createRoot(document.getElementById('first-project-fixture')!).render(<Screen />);
