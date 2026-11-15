import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ConfirmDialog, Stack, Text } from '@ten98/ui';
import '@ten98/ui/styles.css';

// The only dialog on the page, mounted when it opens, so no dialog was on the page before the press that opens it.
declare global { interface Window { log: string[] } }
window.log = [];
function ArchiveConfirm() {
  const [open, setOpen] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)}>Archive project</Button>
    {open && <ConfirmDialog open onOpenChange={setOpen} title="Archive this project?" description="It moves out of the project list."
      confirmLabel="Archive" initialFocus="confirm" onConfirm={() => { window.log.push('archive'); }} />}
  </>;
}

createRoot(document.getElementById('dialog-first-mount-fixture')!).render(<Stack as="main" gap={2}>
  <ArchiveConfirm />
  <Text>Dialog first mount</Text>
</Stack>);
