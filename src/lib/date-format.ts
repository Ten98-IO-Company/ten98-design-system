/* Shared date display (cross-app audit, #151): both apps pass the viewer's locale and time zone, so the same timestamp
 * reads the same everywhere. Pass `formatter.date` or `formatter.dateTime` as a flow's `formatDate`. */

export interface DateFormatterOptions {
  /** BCP 47 locale, for example the viewer's saved preference; defaults to the browser's. */
  locale?: string;
  /** IANA time zone, for example "Asia/Dubai"; defaults to the browser's. */
  timeZone?: string;
}
export interface DateFormatter {
  /** "30 Oct 2026" style. */
  date: (value: string | number | Date) => string;
  /** "30 Oct 2026, 14:05" style. */
  dateTime: (value: string | number | Date) => string;
  /** Elapsed time such as "in 3 days" or "2 hours ago", relative to `now`. Never calendar words ("tomorrow"), which elapsed
   * time cannot honestly give; show `date` beside it when the exact day matters. */
  relative: (value: string | number | Date, now?: Date) => string;
}

const units: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31_536_000], ['month', 2_592_000], ['week', 604_800], ['day', 86_400], ['hour', 3_600], ['minute', 60], ['second', 1]];

/** Date formatters for one locale and time zone. An invalid value is returned as its original text rather than "Invalid Date". */
export function createDateFormatter({ locale, timeZone }: DateFormatterOptions = {}): DateFormatter {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone });
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone });
  // A date-only value such as "2026-11-01" is a calendar day, not an instant: show that day in every time zone.
  const calendarDay = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const dateOnly = (value: string | number | Date) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'always' });
  const parse = (value: string | number | Date) => value instanceof Date ? value : new Date(value);
  const safe = (format: (when: Date) => string) => (value: string | number | Date) => {
    const when = parse(value);
    return Number.isNaN(when.getTime()) ? String(value) : format(when);
  };
  return {
    date: value => dateOnly(value) ? safe(when => calendarDay.format(when))(value) : safe(when => date.format(when))(value),
    dateTime: value => dateOnly(value) ? safe(when => calendarDay.format(when))(value) : safe(when => dateTime.format(when))(value),
    relative: (value, now = new Date()) => safe(when => {
      const seconds = (when.getTime() - now.getTime()) / 1000;
      let index = units.findIndex(([, length]) => Math.abs(seconds) >= length);
      if (index < 0) index = units.length - 1;
      // Choose the unit after rounding, so 59.6 minutes reads "in 1 hour" and 359 days "in 1 year", not 60 minutes or 12 months.
      if (index > 0 && Math.abs(Math.round(seconds / units[index][1])) >= Math.round(units[index - 1][1] / units[index][1])) index -= 1;
      const [unit, size] = units[index];
      return relative.format(Math.round(seconds / size), unit);
    })(value),
  };
}
