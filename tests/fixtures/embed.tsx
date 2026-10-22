import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, EmbedHost, Heading, Stack, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only. The "SDK" below stands in for a third-party
// loader that owns the mount element's children, as Google Maps does.
function fakeSdkMount(host: HTMLElement) {
  const canvas = document.createElement('div');
  canvas.dataset.sdk = 'map';
  canvas.textContent = 'SDK canvas';
  canvas.style.cssText = 'width:100%;height:100%';
  host.append(canvas);
  return () => canvas.remove();
}

function Screen() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (busy || !mapRef.current) return;
    return fakeSdkMount(mapRef.current);
  }, [busy]);
  return <Stack as="main" gap={4}>
    <Heading level={1}>Embed host</Heading>
    <EmbedHost ref={mapRef} label="Billboard locations map" size="lg" narrowSize="md" busy={busy} loadingLabel="Loading map…"
      fallback={failed ? <Text>Map unavailable. Add a Maps key in Integrations.</Text> : undefined} />
    <Button onClick={() => setBusy(false)}>Finish loading</Button>
    <Button variant="secondary" onClick={() => setFailed(true)}>Fail</Button>
    <EmbedHost label="Integration preview map" size="sm" />
    <EmbedHost label="Video embed" aspect="video" />
  </Stack>;
}
createRoot(document.getElementById('embed-fixture')!).render(<Screen />);
