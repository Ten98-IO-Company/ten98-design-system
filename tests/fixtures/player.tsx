import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Heading, IsolatedPlayerFrame, Stack, Text, type IsolatedPlayerHandle } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';
import playerScript from './player-script.ts?worker&url';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
function Player({ mode, timeoutMs }: { mode: string; timeoutMs?: number }) {
  const handle = useRef<IsolatedPlayerHandle>(null);
  const [log, setLog] = useState<string[]>([]);
  const add = (entry: string) => setLog(current => [...current, entry]);
  return <Stack gap={2} data-mode={mode}>
    <IsolatedPlayerFrame ref={handle} title={`Player ${mode}`} playerSrc={`${playerScript}?mode=${mode}`} payload={{ events: 2 }} timeoutMs={timeoutMs}
      onReady={duration => add(`ready ${duration}`)} onTick={(time, playing) => add(`tick ${time} ${playing}`)} onFail={() => add('failed')} />
    <Button onClick={() => add(`sent ${handle.current?.send({ type: 'play', offset: 250 })}`)}>Play {mode}</Button>
    <Button onClick={() => add(`sent ${handle.current?.send({ type: 'play', offset: 5000 })}`)}>Play past end {mode}</Button>
    <Text data-log={mode}>{log.join(' | ')}</Text>
  </Stack>;
}

createRoot(document.getElementById('player-fixture')!).render(<Stack as="main" gap={6}>
  <Heading level={1}>Isolated player</Heading>
  <Player mode="ok" />
  <Player mode="wrong-token" />
  <Player mode="silent" timeoutMs={1500} />
  <Player mode="chatty" />
</Stack>);
