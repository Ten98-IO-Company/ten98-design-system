import { createRoot } from 'react-dom/client';
import { Heading, ReplayViewer, SandboxedPreview, Stack } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Hostile documents that try to move the injected content policy out of the head or leave the frame.
// Each network construct points at a /tests/probe- URL that the browser test watches for.
// U+00A0 is whitespace to JavaScript's \s but content to the HTML parser, so it opens <body> before the policy meta.
const lead = '\u00a0';
const controls = { playing: false, onPlayingChange: () => {}, currentTime: 0, duration: 10, onSeek: () => {}, playbackRate: 1, allowedRates: [1], onRateChange: () => {} };

// A fresh, unpredictable nonce for this render, as callers must generate.
const nonce = [...crypto.getRandomValues(new Uint8Array(18))].map(byte => byte.toString(16).padStart(2, '0')).join('');

function Screen() {
  return <Stack as="main" gap={6} id="sandbox-boundary">
    <Heading level={1}>Sandbox boundary</Heading>
    <SandboxedPreview title="Leading-space email" html={`${lead}<!doctype html><p>Email body</p><img alt="Pixel" src="/tests/probe-boundary-pixel.png" width="1" height="1">`} />
    <ReplayViewer label="Leading-space replay" context="Bypass check" title="Leading-space replay frame" controls={controls}
      srcDoc={`${lead}<!doctype html><p>Replay body</p><script>fetch('/tests/probe-boundary-fetch').catch(() => {});</script>`} />
    <ReplayViewer label="Navigating replay" context="Bypass check" title="Navigating replay frame" controls={controls}
      srcDoc={`<!doctype html><p>Navigating replay</p><script>setTimeout(() => { location.href = '/tests/probe-boundary-navigation?recorded=secret'; }, 50);</script>`} />
    <ReplayViewer label="Pinned replay" context="Opt-in check" title="Pinned replay frame" controls={controls} contentPolicy={`default-src 'none'; script-src 'nonce-${nonce}'`}
      srcDoc={`<!doctype html><p>Pinned replay</p><script nonce="${nonce}">document.body.dataset.player = 'ran';</script><script>location.href = '/tests/probe-boundary-optin?recorded=secret';</script>`} />
    <ReplayViewer label="Loose replay" context="Opt-in check" title="Loose replay frame" controls={controls} contentPolicy="default-src 'none'; script-src 'unsafe-inline'"
      srcDoc={`<!doctype html><script>location.href = '/tests/probe-boundary-optin-loose?recorded=secret';</script>`} />
  </Stack>;
}

createRoot(document.getElementById('sandbox-boundary-fixture')!).render(<Screen />);
