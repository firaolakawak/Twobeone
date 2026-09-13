type UiLocales = Intl.LocalesArgument;
type UiDateTimeOptions = Intl.DateTimeFormatOptions;
export type UiDateTimeFormatter = Pick<Intl.DateTimeFormat, 'format' | 'formatToParts' | 'resolvedOptions'>;

// Oromo Gregorian labels from the CLDR data exposed by Node 24's native om-ET
// formatter. Some browsers ship Intl without Oromo locale data. Restrict this
// fallback to UI date labels; never change the global Intl implementation.
const OROMO_MONTHS = {
  long: ['Amajjii', 'Guraandhala', 'Bitootessa', 'Eebila', 'Caamsaa', 'Waxabajjii', 'Adoolessa', 'Hagayya', 'Fulbaana', 'Onkoloolessa', 'Sadaasa', 'Mudde'],
  short: ['Ama', 'Gur', 'Bitootessa', 'Elb', 'Cam', 'Wax', 'Ado', 'Hag', 'Ful', 'Onk', 'Sadaasa', 'Mud'],
  narrow: ['A', 'G', 'B', 'E', 'C', 'W', 'A', 'H', 'F', 'O', 'S', 'M'],
} as const;
const OROMO_WEEKDAYS = {
  long: ['Dilbata', 'Wiixata', 'Kibxata', 'Roobii', 'Kamisa', 'Jimaata', 'Sanbata'],
  short: ['Dil', 'Wix', 'Kib', 'Rob', 'Kam', 'Jim', 'San'],
  narrow: ['D', 'W', 'K', 'R', 'K', 'J', 'S'],
} as const;
const ENGLISH_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function unsupportedOromoLocale(locales?: UiLocales): string | undefined {
  const localeNames = locales instanceof Intl.Locale ? locales.toString()
    : Array.isArray(locales) ? locales.map(locale => String(locale)) : locales;
  const first = Intl.getCanonicalLocales(localeNames as string | string[] | undefined)[0];
  return first && new Intl.Locale(first).language === 'om'
    && Intl.DateTimeFormat.supportedLocalesOf(first).length === 0 ? first : undefined;
}

/** Native Intl when available, with a small Oromo fallback for browsers lacking it. */
export function createUiDateTimeFormat(locales?: UiLocales, options?: UiDateTimeOptions): UiDateTimeFormatter {
  const oromoLocale = unsupportedOromoLocale(locales);
  if (!oromoLocale) return new Intl.DateTimeFormat(locales, options);

  // en-US uses Oromo's Gregorian field order and 12-hour clock. Keep requested
  // Unicode options (calendar, numbering system, hour cycle) and explicit options.
  const extensionStart = oromoLocale.indexOf('-u-');
  const base = new Intl.DateTimeFormat(`en-US${extensionStart < 0 ? '' : oromoLocale.slice(extensionStart)}`, options);
  const resolved = base.resolvedOptions();
  const monthWidth = resolved.month ?? (resolved.dateStyle === 'full' || resolved.dateStyle === 'long'
    ? 'long' : resolved.dateStyle === 'medium' ? 'short' : undefined);
  const weekdayWidth = resolved.weekday ?? (resolved.dateStyle === 'full' ? 'long' : undefined);
  const gregorian = resolved.calendar === 'gregory' || resolved.calendar === 'iso8601';
  const localFields = new Intl.DateTimeFormat('en-US', {
    timeZone: resolved.timeZone,
    calendar: resolved.calendar,
    numberingSystem: 'latn',
    month: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    hourCycle: 'h23',
  });

  const formatToParts: Intl.DateTimeFormat['formatToParts'] = (value) => {
    // Capture "now" once so separate formatters cannot cross a date boundary.
    const date = value === undefined ? Date.now() : value;
    const parts = base.formatToParts(date);
    const fields = localFields.formatToParts(date);
    const month = Number(fields.find(part => part.type === 'month')?.value) - 1;
    const weekday = ENGLISH_WEEKDAYS.indexOf(fields.find(part => part.type === 'weekday')?.value ?? '');
    const hour = Number(fields.find(part => part.type === 'hour')?.value);
    let appendDateTimeSuffix = false;
    const translated = parts.map(part => {
      if (part.type === 'month' && gregorian && monthWidth && monthWidth in OROMO_MONTHS && month >= 0 && month < 12) {
        return { ...part, value: OROMO_MONTHS[monthWidth as keyof typeof OROMO_MONTHS][month] };
      }
      if (part.type === 'weekday' && weekdayWidth && weekdayWidth in OROMO_WEEKDAYS && weekday >= 0) {
        return { ...part, value: OROMO_WEEKDAYS[weekdayWidth as keyof typeof OROMO_WEEKDAYS][weekday] };
      }
      if (part.type === 'dayPeriod') return { ...part, value: hour < 12 ? 'WD' : 'WB' };
      if (part.type === 'literal' && part.value === ' at ') {
        appendDateTimeSuffix = true;
        return { ...part, value: ' ' };
      }
      return part;
    });
    if (appendDateTimeSuffix) translated.push({ type: 'literal', value: ' tti' });
    return translated;
  };

  return {
    // Intl's display string uses a regular space where formatToParts exposes a
    // narrow no-break space before the day period. Match that display behavior.
    format: value => formatToParts(value).map(part => part.value).join('').replace(/\u202f/g, ' '),
    formatToParts,
    resolvedOptions: () => ({ ...base.resolvedOptions(), locale: oromoLocale }),
  };
}

function dateOptions(options: UiDateTimeOptions | undefined, kind: 'date' | 'time' | 'all'): UiDateTimeOptions {
  if (options === null) throw new TypeError('Date formatting options cannot be null');
  // Preserve inherited Intl options while adding Date.prototype's default fields.
  const normalized = Object.create(options === undefined ? null : Object(options)) as UiDateTimeOptions;
  if (kind === 'date' && normalized.timeStyle !== undefined) throw new TypeError('timeStyle is not allowed for date-only formatting');
  if (kind === 'time' && normalized.dateStyle !== undefined) throw new TypeError('dateStyle is not allowed for time-only formatting');
  const dateFields = ['weekday', 'year', 'month', 'day'] as const;
  const timeFields = ['dayPeriod', 'hour', 'minute', 'second', 'fractionalSecondDigits'] as const;
  const requiredFields = kind === 'date' ? dateFields : kind === 'time' ? timeFields : [...dateFields, ...timeFields];
  const useDefaults = normalized.dateStyle === undefined && normalized.timeStyle === undefined
    && requiredFields.every(field => normalized[field] === undefined);
  if (useDefaults) {
    if (kind !== 'time') Object.assign(normalized, { year: 'numeric', month: 'numeric', day: 'numeric' });
    if (kind !== 'date') Object.assign(normalized, { hour: 'numeric', minute: 'numeric', second: 'numeric' });
  }
  return normalized;
}

/** Equivalent to Date.toLocaleDateString, including its date-only defaults. */
export function formatUiDate(date: Date, locales?: UiLocales, options?: UiDateTimeOptions): string {
  if (Number.isNaN(date.getTime())) return 'Invalid Date';
  if (!unsupportedOromoLocale(locales)) return date.toLocaleDateString(locales, options);
  return createUiDateTimeFormat(locales, dateOptions(options, 'date')).format(date);
}

/** Equivalent to Date.toLocaleTimeString, including its time-only defaults. */
export function formatUiTime(date: Date, locales?: UiLocales, options?: UiDateTimeOptions): string {
  if (Number.isNaN(date.getTime())) return 'Invalid Date';
  if (!unsupportedOromoLocale(locales)) return date.toLocaleTimeString(locales, options);
  return createUiDateTimeFormat(locales, dateOptions(options, 'time')).format(date);
}

/** Equivalent to Date.toLocaleString, including its combined date/time defaults. */
export function formatUiDateTime(date: Date, locales?: UiLocales, options?: UiDateTimeOptions): string {
  if (Number.isNaN(date.getTime())) return 'Invalid Date';
  if (!unsupportedOromoLocale(locales)) return date.toLocaleString(locales, options);
  return createUiDateTimeFormat(locales, dateOptions(options, 'all')).format(date);
}
