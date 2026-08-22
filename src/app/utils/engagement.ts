export const ENGAGEMENT_CATEGORIES = ['reading', 'answering', 'journaling', 'praying', 'other'] as const;

export type EngagementCategory = typeof ENGAGEMENT_CATEGORIES[number];

const READING_SCREENS = new Set(['lesson', 'scripture-memory', 'guidance']);
const ANSWERING_SCREENS = new Set([
  'qa-hub', 'quizzes', 'marriage-readiness', 'daily-question',
  'category-selection', 'qa-discussion',
]);

export function getEngagementCategory(activeTab: string, selectedScreen?: string | null): EngagementCategory {
  if (activeTab === 'devotions') return 'reading';
  if (activeTab === 'journal') return 'journaling';
  if (activeTab === 'prayer') return 'praying';
  if (activeTab === 'questions') return 'answering';
  if (activeTab === 'home' && selectedScreen && READING_SCREENS.has(selectedScreen)) return 'reading';
  if (activeTab === 'home' && selectedScreen && ANSWERING_SCREENS.has(selectedScreen)) return 'answering';
  return 'other';
}

export function formatEngagementTime(seconds: number, language: 'en' | 'am' | 'om' = 'en'): string {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return language === 'am' ? '<1 ደቂቃ' : language === 'om' ? '<1 daqiiqaa' : '<1 min';
}
