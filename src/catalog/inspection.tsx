import { useState } from 'react';
import { Button } from '../lib/primitives.js';
import { VisualEvidenceFrame, ReplayControls, type VisualEvidenceFrameProps, type ReplayControlsProps } from '../lib/inspection.js';
import { tsx, type ComponentEntry, type ComponentProp } from './model.js';

const prop = (name: string, type: string, description: string, required = false): ComponentProp => ({ name, type, description, required });
const surfaceTokens = ['--t98-font', '--t98-text', '--t98-muted', '--t98-surface', '--t98-subtle', '--t98-border', '--t98-radius', '--t98-space-2', '--t98-space-3', '--t98-space-4'];
const controlTokens = ['--t98-accent', '--t98-accent-soft', '--t98-focus', '--t98-control-touch', '--t98-control-border'];
type VisualMode = 'aligned' | 'unknown' | 'mismatch' | 'unavailable' | 'loading' | 'expired' | 'revoked' | 'empty' | 'coordinates';
const visualModes: VisualMode[] = ['aligned', 'unknown', 'mismatch', 'unavailable', 'loading', 'expired', 'revoked', 'empty', 'coordinates'];
const visualReasons: Record<VisualMode, string> = {
  aligned: 'Synthetic capture and click evidence use the same page version and 640 × 360 viewport. Choose a ranked element to change only local selection.',
  unknown: 'Page-version alignment has not been verified. The spatial overlay is hidden; the separately authorized ranked list remains available.',
  mismatch: 'Evidence belongs to a different captured viewport. The spatial overlay is hidden; ranked counts retain their original scope.',
  unavailable: 'The captured background is unavailable. No spatial placement is claimed; authorized ranked counts remain readable.',
  loading: 'A replacement capture is loading. The retained aligned capture and its original timestamp remain visible.',
  expired: 'The capture has expired and its background/overlay are hidden. The app separately authorizes these aggregate ranked counts.',
  revoked: 'Access to this evidence has been revoked. All evidence slots, including ranked elements, are hidden.',
  empty: 'No click samples match the selected scope. A retained background does not imply a measured click count.',
  coordinates: 'Coordinate groups and cumulative depth bands describe numeric evidence without DOM element identities. Alignment is unknown, so no spatial overlay is shown.',
};
function visualFixture(mode: VisualMode): VisualEvidenceFrameProps {
  if (mode === 'coordinates') return {
    label: 'Numeric evidence · synthetic page', rankedListLabel: 'Coordinate groups and depth bands',
    context: 'Scope: example.test/product · 1–18 October 2026 · UTC · captured viewport 640 × 360 · capture as of 18 October, 08:00 UTC · 20 observed clicks grouped in captured-viewport pixels; cumulative reach from 20 captured documents. Synthetic demonstration only.',
    alignment: 'unknown', reason: visualReasons[mode],
  };
  return {
    label: 'Click evidence · synthetic page',
    context: `Scope: example.test/product · click map · 1–18 October 2026 · UTC · captured viewport 640 × 360 · page version demo-v1 · capture as of 18 October, 08:00 UTC · ${mode === 'empty' ? 'no click samples in this scope' : '20 accepted click samples in this demonstration'}.`,
    alignment: mode === 'unknown' || mode === 'mismatch' || mode === 'unavailable' ? mode : 'aligned',
    reason: visualReasons[mode], loading: mode === 'loading', expired: mode === 'expired', forbidden: mode === 'revoked',
  };
}
const backgroundCode = `<svg viewBox="0 0 640 360" role="img" aria-label="Synthetic storefront captured at 640 by 360 pixels">
  <rect width="640" height="360" fill="var(--t98-subtle)" />
  <rect x="24" y="24" width="592" height="56" rx="8" fill="var(--t98-surface)" />
  <text x="48" y="58" fill="var(--t98-text)">Demo storefront</text>
  <rect x="48" y="128" width="352" height="168" rx="8" fill="var(--t98-surface)" />
  <text x="72" y="162" fill="var(--t98-text)">Product details</text>
  <rect x="432" y="128" width="160" height="56" rx="8" fill="var(--t98-accent-soft)" />
  <text x="448" y="162" fill="var(--t98-text)">Add to cart</text>
</svg>`;
function SampleBackground() {
  return <svg viewBox="0 0 640 360" role="img" aria-label="Synthetic storefront captured at 640 by 360 pixels">
    <rect width="640" height="360" fill="var(--t98-subtle)" />
    <rect x="24" y="24" width="592" height="56" rx="8" fill="var(--t98-surface)" />
    <text x="48" y="58" fill="var(--t98-text)">Demo storefront</text>
    <rect x="48" y="128" width="352" height="168" rx="8" fill="var(--t98-surface)" />
    <text x="72" y="162" fill="var(--t98-text)">Product details</text>
    <rect x="432" y="128" width="160" height="56" rx="8" fill="var(--t98-accent-soft)" />
    <text x="448" y="162" fill="var(--t98-text)">Add to cart</text>
  </svg>;
}
function VisualDemo({ mode }: { mode: VisualMode }) {
  const [selected, setSelected] = useState('cart');
  if (mode === 'coordinates') return <VisualEvidenceFrame {...visualFixture(mode)} background={<SampleBackground />} rankedList={<>
    <ul><li>x 480–540 px, y 140–180 px · 12 observed clicks</li><li>x 200–250 px, y 140–180 px · 8 observed clicks</li></ul>
    <h5>Cumulative depth bands</h5><ul><li>25% document depth · 18 of 20 captured documents reached</li><li>75% document depth · 10 of 20 captured documents reached</li></ul>
  </>} />;
  return <VisualEvidenceFrame {...visualFixture(mode)} background={mode === 'unavailable' ? undefined : <SampleBackground />}
    overlay={mode === 'empty' ? undefined : <svg viewBox="0 0 640 360" role="img" aria-label={`Synthetic click location for ${selected === 'cart' ? 'Add to cart' : 'Product details'}`}><circle cx={selected === 'cart' ? 512 : 224} cy="156" r="28" fill="var(--t98-accent)" opacity="0.65" /></svg>}
    rankedList={mode === 'empty' ? <p>No samples in this scope.</p> : <ol><li><Button variant="ghost" aria-pressed={selected === 'cart'} onClick={() => setSelected('cart')}>Add to cart · 12 clicks</Button></li><li><Button variant="ghost" aria-pressed={selected === 'details'} onClick={() => setSelected('details')}>Product details · 8 clicks</Button></li></ol>}
    actions={<Button variant="ghost" onClick={() => setSelected('cart')}>Reset local selection</Button>} />;
}
function visualCode(mode: VisualMode = 'aligned') {
  if (mode === 'coordinates') return tsx(['VisualEvidenceFrame', 'type VisualEvidenceFrameProps'], `<VisualEvidenceFrame {...props}
  background={${backgroundCode}}
  rankedList={<>
    <ul><li>x 480–540 px, y 140–180 px · 12 observed clicks</li><li>x 200–250 px, y 140–180 px · 8 observed clicks</li></ul>
    <h5>Cumulative depth bands</h5><ul><li>25% document depth · 18 of 20 captured documents reached</li><li>75% document depth · 10 of 20 captured documents reached</li></ul>
  </>} />`, `const props: VisualEvidenceFrameProps = ${JSON.stringify(visualFixture(mode), null, 2)};`);
  return tsx(['VisualEvidenceFrame', 'Button', 'type VisualEvidenceFrameProps'], `<VisualEvidenceFrame {...props}
  background={${mode === 'unavailable' ? 'undefined' : backgroundCode}}
  overlay={${mode === 'empty' ? 'undefined' : '<svg viewBox="0 0 640 360" role="img" aria-label={`Synthetic click location for ${selected === \'cart\' ? \'Add to cart\' : \'Product details\'}`}><circle cx={selected === \'cart\' ? 512 : 224} cy="156" r="28" fill="var(--t98-accent)" opacity="0.65" /></svg>'}}
  rankedList={${mode === 'empty' ? '<p>No samples in this scope.</p>' : `<ol>
    <li><Button variant="ghost" aria-pressed={selected === 'cart'} onClick={() => setSelected('cart')}>Add to cart · 12 clicks</Button></li>
    <li><Button variant="ghost" aria-pressed={selected === 'details'} onClick={() => setSelected('details')}>Product details · 8 clicks</Button></li>
  </ol>`}}
  actions={<Button variant="ghost" onClick={() => setSelected('cart')}>Reset local selection</Button>} />`, `const props: VisualEvidenceFrameProps = ${JSON.stringify(visualFixture(mode), null, 2)};
const [selected, setSelected] = useState('cart');`, ['useState']);
}

type ReplayMode = 'unloaded' | 'loading' | 'paused' | 'playing' | 'gaps' | 'ended' | 'error' | 'disabled' | 'skip-unsupported' | 'skip-readonly';
const replayModes: ReplayMode[] = ['unloaded', 'loading', 'paused', 'playing', 'gaps', 'ended', 'error', 'disabled', 'skip-unsupported', 'skip-readonly'];
type ReplayFixture = Omit<ReplayControlsProps, 'onPlayingChange' | 'onSeek' | 'onRateChange' | 'onSkipInactiveChange' | 'onFitChange'>;
const replayReasons: Record<ReplayMode, string> = {
  unloaded: 'No recording has been loaded. Use the application’s explicit Load recording action before enabling playback.',
  loading: 'The app is loading a recording after an explicit user request. Playback requests are disabled.',
  paused: 'Synthetic control values only. This demonstration loads no recording and advances no playback timer.',
  playing: 'The app reports playing. These controls issue requests only; a player controller owns actual time progression.',
  gaps: 'Capture gap: 35–48 seconds contains no recorded frames. Skipping inactivity does not reconstruct missing evidence.',
  ended: 'The app reports the supplied end position. It owns whether a new play request restarts the recording.',
  error: 'The recording prefix could not be read. No playable timeline is available; the app owns retry and error recovery.',
  disabled: 'Playback interaction is disabled by the application. Existing timeline values remain readable.',
  'skip-unsupported': 'This player does not support changing inactivity skipping. Omit the preference and callback to hide the control; playback, seeking and speed remain available.',
  'skip-readonly': 'The app reports inactivity skipping is off and supplies no change callback. The disabled preference remains readable; playback, seeking and speed remain available.',
};
function replayFixture(mode: ReplayMode): ReplayFixture {
  return {
    label: 'Session replay · synthetic controls',
    context: 'Session demo-018 · example.test/checkout · captured 18 October 2026, 08:00 UTC · viewport 1280 × 720. The app owns masking, access, expiry and recording completeness.',
    playing: mode === 'playing', currentTime: mode === 'unloaded' || mode === 'loading' || mode === 'error' ? null : mode === 'ended' ? 90 : mode === 'gaps' ? 35 : 12,
    duration: mode === 'unloaded' || mode === 'loading' ? null : 90,
    playbackRate: 1, allowedRates: [0.5, 1, 2], skipInactive: mode === 'skip-unsupported' ? undefined : false,
    fit: 'viewer', fitOptions: [{ value: 'viewer', label: 'Fit viewer' }, { value: 'capture', label: 'Captured size' }],
    disabled: mode === 'disabled' || mode === 'error', loading: mode === 'loading', reason: replayReasons[mode],
  };
}
function ReplayDemo({ mode }: { mode: ReplayMode }) {
  const props = replayFixture(mode);
  const [playing, setPlaying] = useState(props.playing);
  const [currentTime, setCurrentTime] = useState(props.currentTime);
  const [playbackRate, setPlaybackRate] = useState(props.playbackRate);
  const [skipInactive, setSkipInactive] = useState(props.skipInactive);
  const [fit, setFit] = useState(props.fit);
  return <><ReplayControls {...props} playing={playing} onPlayingChange={setPlaying} currentTime={currentTime} onSeek={setCurrentTime}
    playbackRate={playbackRate} onRateChange={setPlaybackRate} skipInactive={skipInactive} onSkipInactiveChange={mode === 'skip-unsupported' || mode === 'skip-readonly' ? undefined : setSkipInactive}
    fit={fit} onFitChange={setFit} />
    <p>Changing controls updates local demonstration values. No recording is loaded or played.</p></>;
}
function replayCode(mode: ReplayMode = 'paused') {
  const editableSkip = mode !== 'skip-unsupported' && mode !== 'skip-readonly';
  return tsx(['ReplayControls', 'type ReplayControlsProps'], `<>
  <ReplayControls {...props} playing={playing} onPlayingChange={setPlaying} currentTime={currentTime} onSeek={setCurrentTime}
    playbackRate={playbackRate} onRateChange={setPlaybackRate}${editableSkip ? ' skipInactive={skipInactive} onSkipInactiveChange={setSkipInactive}' : ''}
    fit={fit} onFitChange={setFit} />
  <p>Changing controls updates local demonstration values. No recording is loaded or played.</p>
</>`, `const props: Omit<ReplayControlsProps, 'onPlayingChange' | 'onSeek' | 'onRateChange' | 'onSkipInactiveChange' | 'onFitChange'> = ${JSON.stringify(replayFixture(mode), null, 2)};
const [playing, setPlaying] = useState(props.playing);
const [currentTime, setCurrentTime] = useState(props.currentTime);
const [playbackRate, setPlaybackRate] = useState(props.playbackRate);${editableSkip ? '\nconst [skipInactive, setSkipInactive] = useState(props.skipInactive);' : ''}
const [fit, setFit] = useState(props.fit);`, ['useState']);
}

export const inspectionEntries: ComponentEntry[] = [
  {
    name: 'VisualEvidenceFrame', category: 'Data display', description: 'App-rendered capture and overlay slots with strict spatial alignment gating and an authorized ranked-list alternative.',
    usage: 'Use for Discover D7 heatmap investigation. The app supplies page, viewport, version, timestamp, scope and authorized evidence. An overlay renders only with an aligned, present background while access is allowed and the capture is unexpired. Expired capture backgrounds are hidden; separately authorized aggregate ranked data may remain. Set rankedListLabel for coordinate groups or depth bands, and supply the actual list or its empty state through rankedList. Revoked access hides every evidence slot. The component never fetches, transforms, redacts or aligns snapshots.',
    props: [prop('label', 'string', 'Visible heading and accessible region name.', true), prop('context', 'ReactNode', 'Visible page, applied scope, captured viewport, snapshot time, units and coverage supplied by the app.', true), prop('alignment', 'VisualEvidenceAlignment', 'aligned | unknown | mismatch | unavailable. Only aligned can display a supplied spatial overlay.', true), prop('background / overlay', 'ReactNode', 'Consumer-rendered capture and spatial overlay. The overlay is also hidden without a background, after expiry or after access revocation.'), prop('rankedList', 'ReactNode', 'Separately authorized accessible evidence list. Supply its actual content or custom empty state; the default empty state describes ranked elements. Remains available when alignment is uncertain or capture expired; hidden when forbidden.'), prop('rankedListLabel', 'string', 'Optional visible list heading and accessible region-name suffix. Defaults to Ranked elements with the existing lowercase ranked elements region suffix. Set a truthful label for coordinate groups or cumulative depth bands.'), prop('reason', 'ReactNode', 'App-owned explanation of alignment, coverage, capture failure, no samples or access state.'), prop('loading', 'boolean', 'Sets aria-busy and loading text; an aligned retained capture keeps its supplied original context.'), prop('expired / forbidden', 'boolean', 'Expired hides background and overlay. Forbidden additionally hides the ranked list. These flags never perform policy checks.'), prop('actions', 'ReactNode', 'App-owned actions; displaying the frame never initiates a request.'), prop('className', 'string', 'Additional class on the frame section.')],
    tokens: [...surfaceTokens, ...controlTokens],
    accessibility: ['Visible alignment/access text and reasons convey state without color; precise-looking overlays are omitted from the DOM when alignment cannot be trusted.', 'The ranked-list slot must provide accessible labels, counts and native keyboard controls. It is the alternative to spatial inspection.', 'The app supplies accessible names for capture/overlay graphics and manages selection/focus across slots.', 'Capture graphics fit the available width; the ranked list and context remain readable on narrow screens. No hover-only information is required.'],
    related: ['EvidenceSummary', 'DataTable', 'ReplayControls'], example: visualCode(),
    states: visualModes.map(mode => ({ name: mode === 'coordinates' ? 'Coordinate groups' : mode === 'empty' ? 'No samples' : mode === 'revoked' ? 'Access revoked' : mode === 'loading' ? 'Loading retained capture' : mode[0].toUpperCase() + mode.slice(1), description: visualReasons[mode], preview: <VisualDemo mode={mode} />, code: visualCode(mode) })),
  },
  {
    name: 'ReplayControls', category: 'Controls', description: 'Controlled native play/pause, finite seek, speed, inactivity skip and optional display-fit requests around an app-owned replay player.',
    usage: 'Use for Discover D8 only after the app explicitly loads authorized replay evidence. Null, non-finite or invalid timelines disable requests; unloaded values are labelled unavailable, never represented as an observed zero. The range thumb is bounded to a finite nonnegative duration. Omit skipInactive when the player does not support the preference; provide a boolean without onSkipInactiveChange to show a disabled readable preference. The app owns playback, loaded payloads, gap semantics, consent, masking, retention and controller error handling. No timer, seek-on-render or automatic download runs.',
    props: [prop('label / context', 'string / ReactNode', 'Accessible/visible heading (default Replay controls) and optional app-supplied session/scope/expiry context.'), prop('playing / onPlayingChange', 'boolean / (playing: boolean) => void', 'Controlled play state and requested next state. No player or restart behavior is implemented.', true), prop('currentTime / duration', 'number | null', 'Elapsed and duration seconds. Null/non-finite/negative values disable controls; zero duration is unplayable.', true), prop('onSeek', '(seconds: number) => void', 'Requests a finite seek between zero and supplied duration; never called during render.', true), prop('timeLabel', 'string', 'Optional already formatted elapsed/duration label for output and seek aria-valuetext.'), prop('playbackRate / allowedRates / onRateChange', 'number / readonly number[] / (rate: number) => void', 'Controlled speed and app-authorized choices. Only distinct finite positive choices render and can be requested.', true), prop('skipInactive / onSkipInactiveChange', 'boolean / (skip: boolean) => void', 'Optional inactivity preference: undefined hides the control; a boolean without a callback shows it disabled; both enable controlled requests. Does not infer gaps or reconstruct missing capture.'), prop('fit / fitOptions / onFitChange', 'string / readonly ReplayFitOption[] / (value: string) => void', 'Optional app-defined display-fit values and labels. Fit select is read-only without a callback.'), prop('disabled / loading', 'boolean', 'Disable every playback request; loading also marks the section busy.'), prop('reason', 'ReactNode', 'Visible app-owned explanation for loading, gaps, expiry, error or restricted access, associated with controls.'), prop('className', 'string', 'Additional class on the replay section.')],
    tokens: [...surfaceTokens, ...controlTokens],
    accessibility: ['Native named Play recording/Pause recording buttons, range input, selects and checkbox support platform keyboard interaction.', 'Seek, speed and fit have explicit labels and stable per-instance ids. Seek exposes elapsed/duration as text; elapsed output is not a noisy live region.', 'Unavailable time remains explicit text. Disabled or unloaded controls cannot request playback, seek, rate, skip or fit through user interaction.', 'Controls and labels wrap on narrow screens. Gap/access/error reasons remain readable and associated through aria-describedby.'],
    related: ['VisualEvidenceFrame', 'EvidenceSummary', 'Button', 'Select', 'Checkbox'], example: replayCode(),
    states: replayModes.map(mode => ({ name: mode === 'gaps' ? 'Capture gaps' : mode === 'error' ? 'Unavailable prefix / error' : mode === 'skip-unsupported' ? 'Unsupported inactivity skip' : mode === 'skip-readonly' ? 'Read-only inactivity skip' : mode[0].toUpperCase() + mode.slice(1), description: replayReasons[mode], preview: <ReplayDemo mode={mode} />, code: replayCode(mode) })),
  },
];
