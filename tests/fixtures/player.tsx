import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Heading, IsolatedPlayerFrame, Stack, Text, type IsolatedPlayerHandle } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';
import playerScript from './player-script.ts?worker&url';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
function Player({ mode, name = mode, timeoutMs, payload = { events: 2 } }: { mode: string; name?: string; timeoutMs?: number; payload?: unknown }) {
  const handle = useRef<IsolatedPlayerHandle>(null);
  const [log, setLog] = useState<string[]>([]);
  const add = (entry: string) => setLog(current => [...current, entry]);
  return <Stack gap={2} data-mode={name}>
    <IsolatedPlayerFrame ref={handle} title={`Player ${name}`} playerSrc={`${playerScript}?mode=${mode}`} payload={payload} timeoutMs={timeoutMs}
      onReady={duration => add(`ready ${duration}`)} onTick={(time, playing) => add(`tick ${time} ${playing}`)} onFail={() => add('failed')} />
    <Button onClick={() => add(`sent ${handle.current?.send({ type: 'play', offset: 250 })}`)}>Play {name}</Button>
    <Button onClick={() => add(`sent ${handle.current?.send({ type: 'play', offset: 5000 })}`)}>Play past end {name}</Button>
    <Text data-log={name}>{log.join(' | ')}</Text>
  </Stack>;
}

createRoot(document.getElementById('player-fixture')!).render(<Stack as="main" gap={6}>
  <Heading level={1}>Isolated player</Heading>
  <Player mode="ok" />
  <Player mode="wrong-token" />
  <Player mode="silent" timeoutMs={1500} />
  <Player mode="chatty" />
  <Player mode="ok" name="bytes" payload={new TextEncoder().encode('{"events":2}')} />
</Stack>);
