'use client';

import { useId, useState } from 'react';
import { Alert, Button, EvidenceSummary, Field, FlowSection, Select } from '../../lib';

export default function MeasurementConfidence() {
  const id = useId();
  const [mode, setMode] = useState('Measured');
  const [failedRefresh, setFailedRefresh] = useState(false);
  const unavailable = mode === 'Unknown';
  const estimated = mode === 'Estimated';
  return <FlowSection title="Understand a measurement" description="Synthetic local quality examples · Atlas · UTC" scope={<p>Applied interval: 12–18 October 2026. Retained interval: 1–18 October 2026. Missing capture has no known traffic denominator.</p>}>
    <div className="t98-feature-controls">{<Field label="Measurement example" htmlFor={`${id}-mode`}><Select value={mode} onChange={e => { setMode(e.target.value); setFailedRefresh(false); }}>{['Measured', 'Measured zero', 'Estimated', 'Partial', 'Unknown', 'Loading'].map(s => <option key={s}>{s}</option>)}</Select></Field>}</div>
    {failedRefresh && <Alert tone="warning" title="Refresh failed; previous observation retained">The original as-of time below has not changed. No new measurement was confirmed.</Alert>}
    <EvidenceSummary variant="compact" title="Metric measurement quality" source={estimated ? 'DataForSEO synthetic provider estimate' : 'Synthetic native page-view events'}
      availability={unavailable ? 'unavailable' : mode === 'Loading' ? 'loading' : 'ready'}
      value={mode === 'Measured zero' ? 0 : estimated ? '1,200 estimated monthly searches' : mode === 'Partial' ? '32 known page views' : '418 page views'}
      observedAt={{ label: 'As of 18 October 2026, 23:00 UTC', dateTime: '2026-10-18T23:00:00Z' }}
      reason={unavailable ? 'Capture was refused or dropped; a missing-traffic count cannot be inferred.' : mode === 'Loading' ? 'Awaiting a new local result. No zero or new as-of time is implied.' : estimated ? 'Provider estimate; this is not observed visits or Search Console clicks.' : mode === 'Measured zero' ? 'A confirmed zero within this synthetic measured scope.' : 'Measured only within the stated captured scope.'}
      freshness={{ status: 'unknown', reason: estimated ? 'Provider index refresh time was not supplied. Retrieval time is separate.' : 'No freshness threshold was supplied by the application.' }}
      coverage={{ status: mode === 'Partial' ? 'partial' : unavailable ? 'unavailable' : 'complete', reason: mode === 'Partial' ? 'Only one of two configured pages supplied counts. The full denominator is unknown.' : unavailable ? 'Collection coverage is not established.' : 'Complete only for this synthetic returned interval and stated source.' }}
      basis={<p>{estimated ? 'Estimated search demand' : 'Measured page-view events'} · timezone UTC · applied and retained intervals shown above.</p>}
      details={<p>Do not compare event counts with estimated unique people. Compatible collection definitions, retained intervals and population are required before the application supplies a comparison.</p>} />
    <div className="t98-form-actions"><Button variant="secondary" disabled={mode === 'Loading' || unavailable} onClick={() => setFailedRefresh(true)}>Simulate failed local refresh</Button></div>
    <p>Measurement details only explain the supplied evidence. Opening them starts no collection or paid research.</p>

  </FlowSection>;
}
