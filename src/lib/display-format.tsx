'use client';

/* Shared display formatting (#158): one formatter per viewer locale and time zone for numbers, percentages, counts,
 * exact money and dates, with one marker for a missing value. Missing (null, undefined, NaN) is never shown as 0. */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createDateFormatter, type DateFormatter, type DateFormatterOptions } from './date-format.js';

type Num = number | null | undefined;
type DateInput = string | number | Date | null | undefined;
export interface DisplayFormatOptions extends DateFormatterOptions {
  /** Shown for a missing value. Defaults to "Unavailable". */
  missing?: string;
}
export interface DisplayFormatter {
  missing: string;
  /** Grouped number, for example "12,345.6". */
  number: (value: Num, options?: { maximumFractionDigits?: number }) => string;
  /** Short form for large numbers, for example "12K". */
  compact: (value: Num) => string;
  /** A ratio as a percentage: 0.256 gives "25.6%". */
  percent: (value: Num, options?: { maximumFractionDigits?: number }) => string;
  /** A number with its plural noun, for example count(3, { one: 'post', other: 'posts' }) gives "3 posts". */
  count: (value: Num, noun: { one: string; other: string }) => string;
  /** Money from an exact decimal string (or a number), never through float arithmetic: "0.000123" USD gives
   * "$0.000123", not "$0.00". `wholeUnits` rounds to whole currency units. */
  currency: (value: string | Num, code: string, options?: { wholeUnits?: boolean }) => string;
  date: (value: DateInput) => string;
  dateTime: (value: DateInput) => string;
  relative: (value: DateInput, now?: Date) => string;
}

const decimal = /^-?\d+(\.\d+)?$/;
const absent = (value: unknown): value is null | undefined => value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value));

export function createDisplayFormatter({ locale, timeZone, missing = 'Unavailable' }: DisplayFormatOptions = {}): DisplayFormatter {
  const dates: DateFormatter = createDateFormatter({ locale, timeZone });
  const grouped = new Map<number | undefined, Intl.NumberFormat>();
  const numberFormat = (digits?: number) => {
    if (!grouped.has(digits)) grouped.set(digits, new Intl.NumberFormat(locale, digits === undefined ? undefined : { maximumFractionDigits: digits }));
    return grouped.get(digits)!;
  };
  const compact = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
  const plural = new Intl.PluralRules(locale);
  const orMissing = <T,>(format: (value: T) => string) => (value: T | null | undefined) => absent(value) ? missing : format(value as T);
  return {
    missing,
    number: (value, options) => absent(value) ? missing : numberFormat(options?.maximumFractionDigits).format(value),
    compact: orMissing<number>(value => compact.format(value)),
    percent: (value, options) => absent(value) ? missing : new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: options?.maximumFractionDigits ?? 1 }).format(value),
    count: (value, noun) => absent(value) ? missing : `${numberFormat().format(value)} ${plural.select(value) === 'one' ? noun.one : noun.other}`,
    currency: (value, code, options) => {
      if (absent(value)) return missing;
      const text = typeof value === 'number' ? String(value) : value.trim();
      if (typeof value === 'string' && !decimal.test(text)) return missing;
      try {
        const base = new Intl.NumberFormat(locale, { style: 'currency', currency: code });
        const whole = { minimumFractionDigits: 0, maximumFractionDigits: 0 };
        // A number keeps the currency's usual digits, so 0.1 + 0.2 reads $0.30. Only an exact decimal string widens to
        // show every digit it carries, and Intl formats such a string exactly (ECMA-402 NumberFormat v3).
        if (typeof value === 'number') return (options?.wholeUnits ? new Intl.NumberFormat(locale, { style: 'currency', currency: code, ...whole }) : base).format(value);
        const digits = Math.min(20, Math.max(base.resolvedOptions().maximumFractionDigits ?? 2, text.split('.')[1]?.length ?? 0));
        return new Intl.NumberFormat(locale, { style: 'currency', currency: code, ...(options?.wholeUnits ? whole : { maximumFractionDigits: digits }) })
          .format(text as unknown as number);
      } catch (error) {
        // A malformed currency code: still show the amount and the code rather than failing the whole screen.
        if (error instanceof RangeError) return `${text} ${code.toUpperCase()}`;
        throw error;
      }
    },
    date: orMissing(dates.date),
    dateTime: orMissing(dates.dateTime),
    relative: (value, now) => absent(value) ? missing : dates.relative(value, now),
  };
}

// Without a provider: English and UTC, the same deterministic output on the server and in every browser.
const fallback = createDisplayFormatter({ locale: 'en', timeZone: 'UTC' });
const DisplayFormatContext = createContext<DisplayFormatter>(fallback);
/** Supplies the viewer's locale, time zone and missing-value marker to every flow's default dates and to useDisplayFormat. */
export function DisplayFormatProvider({ locale, timeZone, missing, children }: DisplayFormatOptions & { children: ReactNode }) {
  const formatter = useMemo(() => createDisplayFormatter({ locale, timeZone, missing }), [locale, timeZone, missing]);
  return <DisplayFormatContext.Provider value={formatter}>{children}</DisplayFormatContext.Provider>;
}
export const useDisplayFormat = () => useContext(DisplayFormatContext);
