'use client';

import { useId, type ReactNode } from 'react';
import { Button, Checkbox, Field, Select, cx } from './primitives.js';

export type VisualEvidenceAlignment = 'aligned' | 'unknown' | 'mismatch' | 'unavailable';
export interface VisualEvidenceFrameProps {
  label: string;
  /** Visible app-owned page, scope, captured viewport, timestamp, units and coverage. */
  context: ReactNode;
  background?: ReactNode;
  overlay?: ReactNode;
  /** Supply only a separately authorized, keyboard-accessible element/count list. */
  rankedList?: ReactNode;
  alignment: VisualEvidenceAlignment;
  reason?: ReactNode;
  loading?: boolean;
  expired?: boolean;
  forbidden?: boolean;
  actions?: ReactNode;
  className?: string;
}

const alignmentLabels: Record<VisualEvidenceAlignment, string> = {
  aligned: 'Aligned capture', unknown: 'Alignment unknown', mismatch: 'Page or viewport mismatch', unavailable: 'Capture unavailable',
};
const alignmentReasons: Record<VisualEvidenceAlignment, string> = {
  aligned: 'The app reports alignment for the supplied page and captured viewport.',
  unknown: 'Spatial overlay hidden because alignment has not been established.',
  mismatch: 'Spatial overlay hidden because the captured page or viewport differs from the evidence.',
  unavailable: 'Spatial overlay hidden because capture alignment is unavailable.',
};

/** Presentation only: the app owns capture, access, retention, alignment and rendering. */
export function VisualEvidenceFrame({ label, context, background, overlay, rankedList, alignment, reason, loading, expired, forbidden, actions, className }: VisualEvidenceFrameProps) {
  const canShowCapture = !expired && !forbidden;
  const canShowOverlay = canShowCapture && alignment === 'aligned' && background != null;
  return <section className={cx('t98-visual-frame', className)} aria-label={label} aria-busy={loading || undefined} data-alignment={alignment}>
    <div className="t98-visual-header"><h3 className="t98-visual-title">{label}</h3>{actions != null && <div className="t98-visual-actions">{actions}</div>}</div>
    <div className="t98-visual-context">{context}</div>
    <p className="t98-visual-status" role="status">{forbidden ? 'Access revoked' : expired ? 'Capture expired' : alignmentLabels[alignment]}{loading && ' · Loading'}</p>
    <div className="t98-visual-reason">{reason ?? (forbidden ? 'Evidence is hidden because access is not authorized.' : expired ? 'The expired capture and spatial overlay are hidden.' : alignmentReasons[alignment])}</div>
    {canShowCapture && background != null ? <div className="t98-visual-canvas">
      <div className="t98-visual-background">{background}</div>
      {canShowOverlay && overlay != null && <div className="t98-visual-overlay">{overlay}</div>}
    </div> : <p className="t98-visual-empty">{forbidden ? 'Visual evidence is not authorized.' : expired ? 'Captured page is expired.' : 'No captured background is available.'}</p>}
    {!forbidden && <section className="t98-visual-ranked" aria-label={`${label} ranked elements`}><h4 className="t98-visual-ranked-title">Ranked elements</h4>
      {rankedList ?? <p className="t98-visual-empty">No authorized ranked element list is available.</p>}
    </section>}
  </section>;
}

export interface ReplayFitOption { value: string; label: string }
export interface ReplayControlsProps {
  label?: string;
  context?: ReactNode;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  currentTime: number | null;
  duration: number | null;
  onSeek: (seconds: number) => void;
  /** Optional app-formatted elapsed/duration text, also exposed to the seek control. */
  timeLabel?: string;
  playbackRate: number;
  allowedRates: readonly number[];
  onRateChange: (rate: number) => void;
  skipInactive: boolean;
  onSkipInactiveChange: (skip: boolean) => void;
  fit?: string;
  fitOptions?: readonly ReplayFitOption[];
  onFitChange?: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  reason?: ReactNode;
  className?: string;
}

/** Controlled requests only; never loads a payload, starts a timer or renders a recording. */
export function ReplayControls({ label = 'Replay controls', context, playing, onPlayingChange, currentTime, duration, onSeek, timeLabel, playbackRate, allowedRates, onRateChange, skipInactive, onSkipInactiveChange, fit, fitOptions, onFitChange, disabled, loading, reason, className }: ReplayControlsProps) {
  const id = useId();
  const validCurrent = currentTime !== null && Number.isFinite(currentTime) && currentTime >= 0;
  const validDuration = duration !== null && Number.isFinite(duration) && duration >= 0;
  const maximum = validDuration ? duration : 0;
  const position = validCurrent ? Math.min(currentTime, maximum) : 0;
  const blocked = disabled || loading || !validCurrent || !validDuration || maximum === 0;
  const rates = [...new Set(allowedRates.filter(rate => Number.isFinite(rate) && rate > 0))];
  const knownRate = rates.includes(playbackRate);
  const knownFit = fitOptions?.some(option => option.value === fit);
  const elapsed = timeLabel ?? `Elapsed ${validCurrent ? `${currentTime} seconds` : 'unavailable'} / duration ${validDuration ? `${duration} seconds` : 'unavailable'}`;
  const describedBy = reason != null ? `${id}-reason` : undefined;
  return <section className={cx('t98-replay-controls', className)} aria-label={label} aria-busy={loading || undefined}>
    <h3 className="t98-replay-title">{label}</h3>
    {context != null && <div className="t98-replay-context">{context}</div>}
    <p className="t98-replay-status">{loading ? 'Loading recording' : !validCurrent || !validDuration ? 'Timeline unavailable' : maximum === 0 ? 'No playable duration' : !playing && position === maximum ? 'Ended' : playing ? 'Playing' : 'Paused'}</p>
    {reason != null && <div className="t98-replay-reason" id={describedBy}>{reason}</div>}
    <div className="t98-replay-transport">
      <Button className="t98-replay-play" variant="secondary" disabled={blocked} aria-describedby={describedBy} onClick={() => onPlayingChange(!playing)}>{playing ? 'Pause recording' : 'Play recording'}</Button>
      <output className="t98-replay-time">{elapsed}</output>
    </div>
    <Field className="t98-replay-position" label="Seek recording" htmlFor={`${id}-seek`}>
      <input className="t98-replay-seek" type="range" min={0} max={maximum} step="any" value={position} disabled={blocked} aria-valuetext={elapsed} aria-describedby={describedBy}
        onChange={event => { const next = event.currentTarget.valueAsNumber; if (!blocked && Number.isFinite(next)) onSeek(Math.min(maximum, Math.max(0, next))); }} />
    </Field>
    <div className="t98-replay-options">
      <Field className="t98-replay-rate" label="Playback speed" htmlFor={`${id}-rate`}>
        <Select value={knownRate ? String(playbackRate) : ''} disabled={blocked || rates.length === 0} aria-describedby={describedBy}
          onChange={event => { const next = Number(event.currentTarget.value); if (!blocked && rates.includes(next)) onRateChange(next); }}>
          {!knownRate && <option value="" disabled>Rate unavailable</option>}
          {rates.map(rate => <option value={rate} key={rate}>{rate}×</option>)}
        </Select>
      </Field>
      <Checkbox className="t98-replay-skip" label="Skip inactive periods" checked={skipInactive} disabled={blocked} aria-describedby={describedBy} onChange={event => onSkipInactiveChange(event.currentTarget.checked)} />
      {fitOptions != null && <Field className="t98-replay-fit" label="Recording display fit" htmlFor={`${id}-fit`}>
        <Select value={knownFit ? fit : ''} disabled={blocked || !onFitChange || fitOptions.length === 0} aria-describedby={describedBy}
          onChange={event => { const next = event.currentTarget.value; if (!blocked && fitOptions.some(option => option.value === next)) onFitChange?.(next); }}>
          {!knownFit && <option value="" disabled>Fit unavailable</option>}
          {fitOptions.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
        </Select>
      </Field>}
    </div>
  </section>;
}
