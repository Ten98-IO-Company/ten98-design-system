/* Shared date display (cross-app audit, #151): both apps pass the viewer's locale and time zone, so the same timestamp
 * reads the same everywhere. Pass `formatter.date` or `formatter.dateTime` as a flow's `formatDate`.
 * Display text only: machine-readable values (a <time dateTime>, an export, an API payload) stay ISO and never pass
 * through the formatter, and date entry is the app's own parser. */

/** A date written day, month, year in that order whatever the locale, from `Intl` parts joined by `separator`. No
 * pattern string is parsed. English short months are always the three-letter title-case form ("Sep", never "Sept");
 * another language's short month comes from `Intl`, with any trailing period removed (German "Jan." gives "Jan"). */
export interface DayFirstDate {
  /** Always day, month, year; a literal so other orders can be added later. */
  order: 'day-month-year';
  day: 'numeric' | '2-digit';
  month: 'short' | 'long';
  year: '2-digit' | 'numeric';
  separator: '-' | ' ';
}
/** `'medium'` is `Intl` dateStyle medium ("Jan 4, 2026" in en-US), `'long'` is `Intl` dateStyle long ("4 January 2026"
 * in en-GB), `'day-month-year-short'` is "04 Jan 26" in every locale, and a {@link DayFirstDate} builds its own form,
 * for example `{ order: 'day-month-year', day: 'numeric', month: 'short', year: '2-digit', separator: '-' }` gives "4-Jan-26". */
export type DateStyle = 'medium' | 'long' | 'day-month-year-short' | DayFirstDate;

export interface DateFormatterOptions {
  /** BCP 47 locale, for example the viewer's saved preference; defaults to the browser's. Numbers always use it. */
  locale?: string;
  /** IANA time zone, for example "Asia/Dubai"; defaults to the browser's. */
  timeZone?: string;
  /** Language of date text (month names, digits, relative words), set separately from the number `locale`; defaults to
   * `locale`. For example `locale: 'en-US', dateLocale: 'en-GB'` keeps US number grouping with British date text. */
  dateLocale?: string;
  /** How `date`, `dateTime` and `dateRange` write the day. Defaults to `'medium'`, the output before this option existed.
   * An object style is compared by value, so a new but equal object on each render does not rebuild the formatter. */
  dateStyle?: DateStyle;
  /** Word or symbol `dateRange` puts between its two dates, with a space on each side. Defaults to "–" (an en dash), so
   * a range reads "Jan 1, 2026 – Dec 31, 2026"; pass the app's own word, for example "to". */
  rangeConnector?: string;
}
export interface DateFormatter {
  /** The day in `dateStyle`: "Jan 4, 2026" by default, "04 Jan 26" for `'day-month-year-short'`. A date-only string such as
   * "2026-01-04" is a calendar day and shows that day in every time zone. */
  date: (value: string | number | Date) => string;
  /** The day and time. `'medium'` is `Intl` dateStyle medium with timeStyle short, as before ("Jan 4, 2026, 2:05 PM" in
   * en-US). Every other style is the `date` text, then ", ", then a 24-hour time with no seconds in the time zone:
   * "4-Jan-26, 14:05". A date-only string shows only its calendar day. */
  dateTime: (value: string | number | Date) => string;
  /** Elapsed time such as "in 3 days" or "2 hours ago", relative to `now`. Never calendar words ("tomorrow"), which elapsed
   * time cannot honestly give; show `date` beside it when the exact day matters. */
  relative: (value: string | number | Date, now?: Date) => string;
  /** Two `date` texts joined by `rangeConnector`: "1-Jan-26 to 31-Dec-26". */
  dateRange: (start: string | number | Date, end: string | number | Date) => string;
}

const units: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31_536_000], ['month', 2_592_000], ['week', 604_800], ['day', 86_400], ['hour', 3_600], ['minute', 60], ['second', 1]];
const dayMonthYearShort: DayFirstDate = { order: 'day-month-year', day: '2-digit', month: 'short', year: '2-digit', separator: ' ' };

/** One date in `style` for `dateLocale` in `timeZone`. */
function dayFormat(dateLocale: string | undefined, timeZone: string | undefined, style: DateStyle) {
  if (style === 'medium' || style === 'long') {
    const format = new Intl.DateTimeFormat(dateLocale, { dateStyle: style, timeZone });
    return (when: Date) => format.format(when);
  }
  const { day, month, year, separator } = style === 'day-month-year-short' ? dayMonthYearShort : style;
  const parts = new Intl.DateTimeFormat(dateLocale, { day, month, year, timeZone });
  // Some runtimes give en-GB "Sept"; every English locale takes its month name from en-US, which is the fixed form.
  const english = new Intl.Locale(parts.resolvedOptions().locale).language === 'en';
  const months = english ? new Intl.DateTimeFormat('en-US', { month, timeZone }) : undefined;
  return (when: Date) => {
    const found = parts.formatToParts(when);
    const part = (type: Intl.DateTimeFormatPartTypes) => found.find(entry => entry.type === type)?.value ?? '';
    const name = months ? months.format(when) : part('month');
    return [part('day'), month === 'short' ? name.replace(/\.$/u, '') : name, part('year')].join(separator);
  };
}

/** Date formatters for one locale and time zone. An invalid value is returned as its original text rather than "Invalid Date". */
export function createDateFormatter({ locale, timeZone, dateLocale = locale, dateStyle = 'medium', rangeConnector = '–' }: DateFormatterOptions = {}): DateFormatter {
  const date = dayFormat(dateLocale, timeZone, dateStyle);
  // A date-only value such as "2026-11-01" is a calendar day, not an instant: show that day in every time zone.
  const calendarDay = dayFormat(dateLocale, 'UTC', dateStyle);
  let dateTime: (when: Date) => string;
  if (dateStyle === 'medium') {
    const format = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone });
    dateTime = when => format.format(when);
  } else {
    const time = new Intl.DateTimeFormat(dateLocale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone });
    dateTime = when => `${date(when)}, ${time.format(when)}`;
  }
  const dateOnly = (value: string | number | Date) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const relative = new Intl.RelativeTimeFormat(dateLocale, { numeric: 'always' });
  const parse = (value: string | number | Date) => value instanceof Date ? value : new Date(value);
  const safe = (format: (when: Date) => string) => (value: string | number | Date) => {
    const when = parse(value);
    return Number.isNaN(when.getTime()) ? String(value) : format(when);
  };
  const day = (value: string | number | Date) => safe(dateOnly(value) ? calendarDay : date)(value);
  return {
    date: day,
    dateTime: value => safe(dateOnly(value) ? calendarDay : dateTime)(value),
    relative: (value, now = new Date()) => safe(when => {
      const seconds = (when.getTime() - now.getTime()) / 1000;
      let index = units.findIndex(([, length]) => Math.abs(seconds) >= length);
      if (index < 0) index = units.length - 1;
      // Choose the unit after rounding, so 59.6 minutes reads "in 1 hour" and 359 days "in 1 year", not 60 minutes or 12 months.
      if (index > 0 && Math.abs(Math.round(seconds / units[index][1])) >= Math.round(units[index - 1][1] / units[index][1])) index -= 1;
      const [unit, size] = units[index];
      return relative.format(Math.round(seconds / size), unit);
    })(value),
    dateRange: (start, end) => `${day(start)} ${rangeConnector} ${day(end)}`,
  };
}
