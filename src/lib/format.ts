/* Internal display formatters shared by components. Not exported from the package entry; apps use the display
 * formatter (`useDisplayFormat().fileSize`), which delegates here with the viewer's locale.
 * Each returns an empty string for a missing or invalid input, so callers omit the value rather than show 0. */

const fileUnits = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
const englishNumber = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });

/** Bytes as B, KB, MB, GB or TB (1024 steps) with at most one decimal place. The number follows `number` (English by
 * default; the display formatter passes the viewer's locale); the unit symbols stay the same in every locale. */
export function formatFileSize(bytes: number, number: (value: number) => string = value => englishNumber.format(value)): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  // Whole bytes, one decimal above. Rounded before choosing the unit, so 1023.96 KB reads 1 MB rather than 1,024 KB.
  const rounded = (value: number, step: number) => step === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  let value = bytes, step = 0;
  while (step < fileUnits.length - 1 && rounded(value, step) >= 1024) { value /= 1024; step += 1; }
  return `${number(rounded(value, step))} ${fileUnits[step]}`;
}

/** Seconds as m:ss, or h:mm:ss from one hour. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  const total = Math.round(seconds);
  const [h, m, s] = [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60];
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
