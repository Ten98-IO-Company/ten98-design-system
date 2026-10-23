import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Heading, ReplayViewer, SandboxedPreview, SegmentedControl, Stack, Text } from '@ten98/ui';
import '@ten98/ui/app-tokens.css';
import '@ten98/ui/app.css';
import '@ten98/ui/product.css';

// Composed the way an application screen must be: library components only, no elements or styles of our own.
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';

// Every network-touching construct below must stay blocked: each points at a probe URL the test watches for.
const email = `<!--<head>--><html><head><meta http-equiv="refresh" content="0;url=/tests/probe-refresh.html"><title>Spring sale</title></head>
<body style="margin:0;font-family:Georgia,serif;color:#222">
<table role="presentation" width="100%"><tr><td style="padding:24px">
<h1 style="font-size:24px">Spring sale starts Monday</h1>
<p>Thirty percent off studio sessions booked this week.</p>
<img alt="Tracking pixel" src="/tests/probe-pixel.png" width="1" height="1">
<img alt="Inline badge" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20'%3E%3Crect width='40' height='20' fill='%23e33'/%3E%3C/svg%3E">
<p><a id="book" href="/tests/probe-link.html">Book a session</a></p>
<form action="/tests/probe-form.html"><button id="submit">Subscribe</button></form>
<script>document.body.dataset.scripted = 'yes'; fetch('/tests/probe-script.json');</script>
</td></tr></table></body></html>`;

function Screen() {
  const [viewport, setViewport] = useState<'mobile' | 'desktop'>('desktop');
  return <Stack as="main" gap={6} id="sandboxed">
    <Heading level={1}>Sandboxed preview</Heading>
    <SegmentedControl label="Preview width" value={viewport} onValueChange={value => setViewport(value as 'mobile' | 'desktop')}
      options={[{ value: 'desktop', label: 'Desktop' }, { value: 'mobile', label: 'Mobile' }]} />
    <SandboxedPreview title="Email preview: Spring sale" html={email} viewport={viewport} notice={<Text>From Studio, to 1,204 subscribers. Approximate rendering.</Text>} />
    <SandboxedPreview title="Empty preview" unavailable="Write the email body to see a preview." />
    <ReplayViewer label="Comment-head replay" context="Bypass check" title="Replay with a commented head" srcDoc={'<!--<head>--><p>Replay</p><img alt="" src="/tests/probe-replay.png">'}
      controls={{ playing: false, onPlayingChange: () => {}, currentTime: 0, duration: 10, onSeek: () => {}, playbackRate: 1, allowedRates: [1], onRateChange: () => {} }} />
  </Stack>;
}

createRoot(document.getElementById('sandboxed-preview-fixture')!).render(<Screen />);
