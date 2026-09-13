import { afterEach, describe, expect, it, vi } from 'vitest';
import { createUiDateTimeFormat, formatUiDate, formatUiDateTime, formatUiTime } from '../uiDateTime';

const nativeSupportedLocalesOf = Intl.DateTimeFormat.supportedLocalesOf.bind(Intl.DateTimeFormat);
const monday = new Date('2026-09-14T03:04:05Z');
const utc = { timeZone: 'UTC' };

function omitOromoSupport() {
  vi.spyOn(Intl.DateTimeFormat, 'supportedLocalesOf').mockImplementation((locales, options) =>
    nativeSupportedLocalesOf(locales, options).filter(locale => !locale.startsWith('om')));
}

afterEach(() => vi.restoreAllMocks());

describe('localized UI date formatting', () => {
  it('preserves native formatters and Date behavior for supported English, Amharic and Oromo', () => {
    for (const locale of ['en-US', 'am-ET', 'om-ET']) {
      const options = { ...utc, dateStyle: 'full', timeStyle: 'short' } as const;
      const native = new Intl.DateTimeFormat(locale, options);
      const formatter = createUiDateTimeFormat(locale, options);
      expect(formatter).toBeInstanceOf(Intl.DateTimeFormat);
      expect(formatter.format(monday)).toBe(native.format(monday));
      expect(formatter.formatToParts(monday)).toEqual(native.formatToParts(monday));
      expect(formatter.resolvedOptions()).toEqual(native.resolvedOptions());
      expect(formatUiDate(monday, locale, utc)).toBe(monday.toLocaleDateString(locale, utc));
      expect(formatUiTime(monday, locale, utc)).toBe(monday.toLocaleTimeString(locale, utc));
      expect(formatUiDateTime(monday, locale, utc)).toBe(monday.toLocaleString(locale, utc));
    }
  });

  it('uses Oromo labels even when the browser reports no Oromo locale support', () => {
    omitOromoSupport();
    const formatter = createUiDateTimeFormat('om-ET', { ...utc, dateStyle: 'full', timeStyle: 'short' });
    expect(formatter.format(monday)).toBe('Wiixata, Fulbaana 14, 2026 3:04 WD tti');
    expect(formatter.resolvedOptions()).toMatchObject({ locale: 'om-ET', timeZone: 'UTC', hour12: true });
    expect(formatter.formatToParts(monday)).toContainEqual({ type: 'weekday', value: 'Wiixata' });
  });

  it('matches native Oromo month and weekday labels at every requested width', () => {
    const cases: { date: Date; options: Intl.DateTimeFormatOptions; expected: string; parts: Intl.DateTimeFormatPart[] }[] = [];
    for (const width of ['long', 'short', 'narrow'] as const) {
      for (let month = 0; month < 12; month += 1) {
        const date = new Date(Date.UTC(2026, month, 12));
        const options = { ...utc, month: width };
        const formatter = new Intl.DateTimeFormat('om-ET', options);
        cases.push({ date, options, expected: formatter.format(date), parts: formatter.formatToParts(date) });
      }
      for (let day = 13; day < 20; day += 1) {
        const date = new Date(Date.UTC(2026, 8, day));
        const options = { ...utc, weekday: width };
        const formatter = new Intl.DateTimeFormat('om-ET', options);
        cases.push({ date, options, expected: formatter.format(date), parts: formatter.formatToParts(date) });
      }
    }
    omitOromoSupport();
    for (const { date, options, expected, parts } of cases) {
      const fallback = createUiDateTimeFormat('om-ET', options);
      expect(fallback.format(date), JSON.stringify(options)).toBe(expected);
      expect(fallback.formatToParts(date)).toEqual(parts);
    }
    // Initials must come from the actual date, not an ambiguous English initial.
    expect(createUiDateTimeFormat('om-ET', { ...utc, weekday: 'narrow' }).format(monday)).toBe('W');
  });

  it('respects the requested timezone across weekday, month and year rollover', () => {
    omitOromoSupport();
    const date = new Date('2026-12-31T23:30:00Z');
    const options = { dateStyle: 'full', timeStyle: 'short' } as const;
    expect(createUiDateTimeFormat('om-ET', { ...options, timeZone: 'UTC' }).format(date))
      .toBe('Kamisa, Mudde 31, 2026 11:30 WB tti');
    expect(createUiDateTimeFormat('om-ET', { ...options, timeZone: 'Asia/Dubai' }).format(date))
      .toBe('Jimaata, Amajjii 1, 2027 3:30 WD tti');
  });

  it('formats morning and afternoon periods, including explicitly requested flexible day periods', () => {
    omitOromoSupport();
    for (const dayPeriod of ['long', 'short', 'narrow'] as const) {
      const formatter = createUiDateTimeFormat('om-ET', { ...utc, hour: 'numeric', minute: '2-digit', dayPeriod });
      expect(formatter.format(new Date('2026-09-14T00:00:00Z'))).toBe('12:00 WD');
      expect(formatter.format(new Date('2026-09-14T11:59:00Z'))).toBe('11:59 WD');
      expect(formatter.format(new Date('2026-09-14T12:00:00Z'))).toBe('12:00 WB');
      expect(formatter.format(new Date('2026-09-14T23:59:00Z'))).toBe('11:59 WB');
    }
  });

  it('keeps numeric fields, 24-hour options and locale numbering extensions', () => {
    const options = { ...utc, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false } as const;
    const expected = new Intl.DateTimeFormat('om-ET', options).format(monday);
    const extendedLocale = 'om-ET-u-hc-h23-nu-arab';
    const extendedOptions = { ...utc, hour: 'numeric', minute: '2-digit' } as const;
    const extendedExpected = new Intl.DateTimeFormat(extendedLocale, extendedOptions).format(monday);
    omitOromoSupport();
    expect(createUiDateTimeFormat('om-ET', options).format(monday)).toBe(expected);
    const extended = createUiDateTimeFormat(extendedLocale, extendedOptions);
    expect(extended.format(monday)).toBe(extendedExpected);
    expect(extended.resolvedOptions()).toMatchObject({ numberingSystem: 'arab', hourCycle: 'h23' });
  });

  it('preserves Date date/time defaults instead of Intl date-only defaults', () => {
    const options: Intl.DateTimeFormatOptions[] = [utc, { ...utc, hour: 'numeric' }, { ...utc, weekday: 'long' }, { ...utc, year: 'numeric' }, { ...utc, dayPeriod: 'long' }];
    const cases = options.map(value => ({
      options: value,
      date: monday.toLocaleDateString('om-ET', value),
      time: monday.toLocaleTimeString('om-ET', value),
      both: monday.toLocaleString('om-ET', value),
    }));
    omitOromoSupport();
    for (const value of cases) {
      expect(formatUiDate(monday, 'om-ET', value.options)).toBe(value.date);
      expect(formatUiTime(monday, 'om-ET', value.options)).toBe(value.time);
      expect(formatUiDateTime(monday, 'om-ET', value.options)).toBe(value.both);
    }
  });

  it('supports style shorthand, locale preference lists and inherited options', () => {
    const styleCases = (['full', 'long', 'medium', 'short'] as const).map(dateStyle => {
      const options = { ...utc, dateStyle, timeStyle: 'short' } as const;
      return { options, expected: monday.toLocaleString('om-ET', options) };
    });
    const inherited = Object.create({ ...utc, month: 'long', day: 'numeric' });
    const inheritedExpected = monday.toLocaleDateString('om-ET', inherited);
    omitOromoSupport();
    for (const { options, expected } of styleCases) expect(formatUiDateTime(monday, ['om-ET', 'en-US'], options)).toBe(expected);
    expect(formatUiDate(monday, 'om-ET', inherited)).toBe(inheritedExpected);
    expect(formatUiDate(monday, ['en-US', 'om-ET'], utc)).toBe(monday.toLocaleDateString('en-US', utc));
  });

  it('retains invalid-Date and invalid-option behavior', () => {
    omitOromoSupport();
    const invalid = new Date(NaN);
    expect(formatUiDate(invalid, 'om-ET')).toBe('Invalid Date');
    expect(formatUiTime(invalid, 'om-ET')).toBe('Invalid Date');
    expect(formatUiDateTime(invalid, 'om-ET')).toBe('Invalid Date');
    expect(() => createUiDateTimeFormat('om-ET').format(invalid)).toThrow(RangeError);
    expect(() => formatUiDate(monday, 'om-ET', { timeStyle: 'short' })).toThrow(TypeError);
    expect(() => formatUiTime(monday, 'om-ET', { dateStyle: 'short' })).toThrow(TypeError);
    expect(() => createUiDateTimeFormat('om-ET', { timeZone: 'Invalid/Zone' })).toThrow(RangeError);
  });
});
