import type { UiMessages } from '../utils/uiTranslation';
import { guidanceQuizMessages } from './guidanceQuiz';
import { guidanceResultMessages } from './guidanceResults';
import { guidanceLearningMessages } from './guidanceLearning';
import { guidanceHouseMessages } from './guidanceHouse';
import { guidanceCompatibilityMessages } from './guidanceCompatibility';

export const guidanceMessages: UiMessages = { ...guidanceQuizMessages, ...guidanceResultMessages, ...guidanceLearningMessages, ...guidanceHouseMessages, ...guidanceCompatibilityMessages };

type Copy = (source: string, params?: Record<string, string | number>) => string;
const stableFields = new Set(['id', 'type', 'category', 'status', 'compatibility', 'color', 'iconKey', 'icon', 'verse', 'scripture', 'scriptureRef', 'reference', 'content']);

/** Translate built-in presentation data while preserving scoring codes and reading text. */
export function localizeGuidanceData<T>(tr: Copy, value: T, field = ''): T {
  if (stableFields.has(field)) return value;
  if (typeof value === 'string') return tr(value) as T;
  if (Array.isArray(value)) return value.map((item) => localizeGuidanceData(tr, item, field)) as T;
  if (value && typeof value === 'object' && !('$$typeof' in value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeGuidanceData(tr, item, key)])) as T;
  }
  return value;
}

export function guidanceLabel(tr: Copy, source: string): string {
  const room = /^(Bedroom|Bathroom) (\d+)$/.exec(source);
  if (room) return tr(`${room[1]} {number}`, { number: room[2] });
  const duration = /^(\d+) min$/.exec(source);
  if (duration) return tr('{count} min', { count: duration[1] });
  return tr(source);
}

export function quizResultLabel(tr: Copy, code: string | undefined): string {
  const names: Record<string, string> = {
    WA: 'Words of Affirmation', QT: 'Quality Time', GT: 'Receiving Gifts', AS: 'Acts of Service', PT: 'Physical Touch',
    competing: 'Competing', collaborating: 'Collaborating', avoiding: 'Avoiding', compromising: 'Compromising', accommodating: 'Accommodating',
    seeking: 'Seeking Seeker', growing: 'Growing Believer', maturing: 'Maturing Disciple', leading: 'Spiritual Leader',
  };
  return tr(names[code || ''] || code || 'Completed');
}
