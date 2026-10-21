/* Internal UTC helpers for ISO date-only strings (YYYY-MM-DD). Not exported from the package entry. */

export const DAY = 86_400_000;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Milliseconds at UTC midnight, or NaN for anything that is not an ISO date. */
export const toTime = (iso: string) => { const m = ISO.exec(iso); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; };
export const toIso = (time: number) => new Date(time).toISOString().slice(0, 10);
export const addDays = (iso: string, days: number) => toIso(toTime(iso) + days * DAY);
/** Days from `start` to `end` counting both ends, or NaN when either is not an ISO date. */
export const inclusiveDays = (start: string, end: string) => Math.round((toTime(end) - toTime(start)) / DAY) + 1;
