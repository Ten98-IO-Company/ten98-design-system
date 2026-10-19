'use client';

import { useId, useState } from 'react';
import { Alert, Button, Card, FlowSection, Field, Input, ReplayControls, Select } from '../../lib';

export default function ReplayInvestigationExample() {
  const id = useId();
  const [scenario, setScenario] = useState('available');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [skip, setSkip] = useState(false);
  const [fit, setFit] = useState('contain');
  const [name, setName] = useState('Pricing visit');
  const [savedName, setSavedName] = useState('Pricing visit');
  const loadable = scenario === 'available' || scenario === 'gaps';
  const inGap = loaded && scenario === 'gaps' && time >= 14 && time <= 22;
  function chooseScenario(value: string) { setScenario(value); setLoaded(false); setLoading(false); setPlaying(false); setTime(0); }
  const reason = scenario === 'expired' ? 'Recording expired under the seven-day policy. Saving a label cannot extend retention.' : scenario === 'revoked' ? 'Access revoked. Loaded recording and timeline have been removed.' : scenario === 'not-sampled' ? 'Analytics receipt exists, but this session was not sampled for replay.' : scenario === 'incomplete' ? 'Upload is incomplete; no complete playable prefix is available.' : scenario === 'failed' ? 'Authorized payload read failed. Reconcile access and retry an explicit load.' : scenario === 'gaps' ? 'Capture gap from 14–22 seconds. Missing capture is not inactivity and is never reconstructed.' : 'Local player controls only. No replay bytes, timer, iframe or website are loaded.';
  return <FlowSection title="Investigate a recording" description="Synthetic replay library and app player slot" scope="Workspace North · demo-store · session fixture-17 · captured 14 October 2026">
    <div className="t98-control-stack">{<Alert title="Collection and retention policy">Strict masking · separate replay consent · default replay retention seven days. Analytics collection success does not imply replay capture.</Alert>}</div>
    <div className="t98-form-actions">{<Button disabled={!loadable || loading || loaded} onClick={() => { setLoading(true); setPlaying(false); }}>Load recording</Button>}</div>
    <Field label="Local library recording state" htmlFor={`${id}-scenario`}><Select value={scenario} onChange={event => chooseScenario(event.target.value)}>{['available', 'gaps', 'not-sampled', 'incomplete', 'expired', 'failed', 'revoked'].map(value => <option key={value}>{value}</option>)}</Select></Field>
    <p role="status">{reason}</p>
    {loading && <Alert title="Loading is paused until confirmed" actions={<><Button variant="secondary" onClick={() => { setLoading(false); setLoaded(true); setTime(0); }}>Complete local load</Button><Button variant="ghost" onClick={() => setLoading(false)}>Cancel load</Button></>}>No playback starts while loading.</Alert>}
    <ReplayControls label="Recording playback" context={`Session fixture-17 · saved label ${savedName} · ${loaded ? 'explicitly loaded synthetic slot' : 'not loaded'}`} playing={playing} onPlayingChange={setPlaying} currentTime={loaded ? time : null} duration={loaded ? 60 : null} onSeek={value => { setTime(value); setPlaying(false); }} playbackRate={speed} allowedRates={[0.5, 1, 2]} onRateChange={setSpeed} skipInactive={skip} onSkipInactiveChange={setSkip} fit={fit} fitOptions={[{ value: 'contain', label: 'Fit captured viewport' }, { value: 'actual', label: 'Actual recorded size' }]} onFitChange={setFit} disabled={!loaded || !loadable} loading={loading} reason={reason} />
    <Card title="Application player slot">{loaded && loadable ? <><p>Synthetic controller at {time.toFixed(1)} seconds · {speed}× · {fit}. The application owns the isolated renderer and real playback clock.</p>{inGap ? <Alert title="Capture gap">14–22 seconds contain no captured frames. Seek outside this interval to inspect retained context.</Alert> : <p>Retained event context: {time < 30 ? 'Pricing page viewed' : 'Signup control observed'}. This text is a fixture, not a reconstructed recording.</p>}<div className="t98-form-actions"><Button variant="ghost" onClick={() => { setLoaded(false); setPlaying(false); }}>Unload recording</Button></div></> : <p>No recording is loaded. Select an eligible recording, then use Load recording.</p>}</Card>
    <Field label="Recording label draft" htmlFor={`${id}-name`} description="Labels change saved metadata only; they do not extend replay retention."><Input value={name} maxLength={100} onChange={event => setName(event.target.value)} /></Field>
    <div className="t98-form-actions"><Button variant="secondary" disabled={!name.trim() || scenario === 'revoked'} onClick={() => setSavedName(name.trim())}>Save local label</Button></div>

    <section className="t98-control-stack" aria-label="Supporting details">{<Card title="Recording metadata"><p>Saved label: {savedName}</p><p>Duration: {loaded ? '60 seconds' : 'Not loaded'}</p><p>Expiry: 21 October 2026, 09:30 UTC (synthetic policy observation).</p><p>One synthetic captured session; no person identity is inferred.</p></Card>}</section>
  </FlowSection>;
}
