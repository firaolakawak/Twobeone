import { isSameLocalDay } from '../data/couple-calendar';

export const MOOD_EMOJI = {
  great: '🤩',
  good: '😊',
  okay: '😐',
  sad: '😔',
} as const;

export type MoodValue = keyof typeof MOOD_EMOJI;

export interface DailyMoodEntry {
  userId: string;
  mood: MoodValue;
  createdAt: string;
  note?: string;
}

export function getMoodDayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getTodaysMood(
  entries: unknown[],
  userId: string | undefined,
  now = new Date(),
): DailyMoodEntry | null {
  if (!userId) return null;
  let latest: DailyMoodEntry | null = null;
  for (const value of entries) {
    if (!value || typeof value !== 'object') continue;
    const entry = value as DailyMoodEntry;
    if (entry.userId !== userId || typeof entry.mood !== 'string' || !Object.prototype.hasOwnProperty.call(MOOD_EMOJI, entry.mood) || typeof entry.createdAt !== 'string') continue;
    const createdAt = new Date(entry.createdAt);
    if (!Number.isFinite(createdAt.getTime()) || !isSameLocalDay(createdAt, now)) continue;
    if (!latest || createdAt.getTime() > new Date(latest.createdAt).getTime()) latest = entry;
  }
  return latest;
}
