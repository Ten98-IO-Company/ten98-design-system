import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Blockquote, Button, ConversationThread, Heading, MediaPlayer, Stack, Text, type ConversationMessage } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
if (params.get('dir') === 'rtl') document.documentElement.dir = 'rtl';

/** One second of silent 8 kHz WAV, so the audio player loads real media without a fixture file. */
function silentWav() {
  const samples = 8000;
  const view = new DataView(new ArrayBuffer(44 + samples));
  const text = (offset: number, value: string) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + samples, true); text(8, 'WAVEfmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true); view.setUint32(28, 8000, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true); text(36, 'data'); view.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) view.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([view], { type: 'audio/wav' }));
}
const voice = silentWav();

function Screen() {
  const [hidden, setHidden] = useState(false);
  const messages: ConversationMessage[] = [
    { id: 'in-1', author: 'Studio visitor', time: '19 October, 13:00', dateTime: '2026-10-19T09:00:00Z', visibility: 'public', direction: 'inbound',
      content: 'What time does the studio open? Averyveryverylongunbrokenwordthatmustwrapinsidethemessageatthreehundredtwentypixels.',
      attachments: <MediaPlayer kind="audio" label="Voice note from Studio visitor, 0:01" src={voice} type="audio/wav" transcript="What time does the studio open?" />,
      actions: <Button variant="secondary" onClick={() => setHidden(true)}>Hide</Button>,
      removed: hidden, removedReason: hidden ? 'Hidden by Studio teammate.' : undefined },
    { id: 'out-1', author: 'Studio team', time: '19 October, 13:05', dateTime: '2026-10-19T09:05:00Z', visibility: 'public', direction: 'outbound',
      content: <Stack gap={2}><Blockquote source="Studio visitor">What time does the studio open?</Blockquote><Text>We open at 10:00 every day.</Text></Stack>,
      attachments: <MediaPlayer kind="video" label="Video reply" src="/tests/missing-video.mp4" type="video/mp4" downloadHref="/tests/missing-video.mp4" />,
      actions: <Button variant="secondary">Copy link</Button> },
  ];
  return <Stack as="main" gap={6} id="conversation">
    <Heading level={1}>Conversation</Heading>
    <ConversationThread label="Studio comments" messages={messages} status={<Text role="status">{hidden ? 'Comment hidden.' : 'History supplied by the app.'}</Text>} />
  </Stack>;
}

createRoot(document.getElementById('conversation-fixture')!).render(<Screen />);
