/* Internal display formatters shared by components. Not exported from the package entry.
 * Each returns an empty string for a missing or invalid input, so callers omit the value rather than show 0. */

/** Bytes as B, KB or MB with at most one decimal place. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const [value, unit] = bytes < 1024 * 1024 ? [bytes / 1024, 'KB'] : [bytes / (1024 * 1024), 'MB'];
  return `${value.toFixed(1).replace(/\.0$/, '')} ${unit}`;
}

/** Seconds as m:ss, or h:mm:ss from one hour. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  const total = Math.round(seconds);
  const [h, m, s] = [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60];
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
