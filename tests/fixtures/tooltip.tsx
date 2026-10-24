import { createRoot } from 'react-dom/client';
import { Button, Inline, Stack, Text, Tooltip } from '@ten98/ui';
import '@ten98/ui/styles.css';

// Composed the way an application screen must be: library components only. The Send button sits at the far right edge,
// like Campaign's email editor, with a long tooltip.
createRoot(document.getElementById('tooltip-fixture')!).render(<Stack as="main" gap={4}>
  <Text>Email editor</Text>
  <Inline justify="end">
    <Tooltip content="Sends to every contact in the selected audience once the schedule starts; you can cancel until then."><Button>Send</Button></Tooltip>
  </Inline>
</Stack>);
