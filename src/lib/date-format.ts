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
  /** "in 3 days" / "2 hours ago", relative to `now`; pair it with `date` as the element's title. */
  relative: (value: string | number | Date, now?: Date) => string;
}

const units: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31_536_000], ['month', 2_592_000], ['week', 604_800], ['day', 86_400], ['hour', 3_600], ['minute', 60], ['second', 1]];

/** Date formatters for one locale and time zone. An invalid value is returned as its original text rather than "Invalid Date". */
export function createDateFormatter({ locale, timeZone }: DateFormatterOptions = {}): DateFormatter {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone });
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone });
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const parse = (value: string | number | Date) => value instanceof Date ? value : new Date(value);
  const safe = (format: (when: Date) => string) => (value: string | number | Date) => {
    const when = parse(value);
    return Number.isNaN(when.getTime()) ? String(value) : format(when);
  };
  return {
    date: safe(when => date.format(when)),
    dateTime: safe(when => dateTime.format(when)),
    relative: (value, now = new Date()) => safe(when => {
      const seconds = (when.getTime() - now.getTime()) / 1000;
      const [unit, size] = units.find(([, length]) => Math.abs(seconds) >= length) ?? units[units.length - 1];
      return relative.format(Math.round(seconds / size), unit);
    })(value),
  };
}
