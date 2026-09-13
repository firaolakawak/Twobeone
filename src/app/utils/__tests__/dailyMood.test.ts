import { describe, expect, it } from 'vitest';
import { getMoodDayKey, getTodaysMood, type DailyMoodEntry } from '../dailyMood';

describe('daily mood selection', () => {
  it('selects the latest valid entry for each user regardless of entry order', () => {
    const now = new Date(2026, 8, 14, 18);
    const earlier: DailyMoodEntry = {
      userId: 'keti', mood: 'okay', createdAt: new Date(2026, 8, 14, 9).toISOString(),
    };
    const latest: DailyMoodEntry = {
      userId: 'keti', mood: 'good', createdAt: new Date(2026, 8, 14, 15).toISOString(),
    };
    const otherUser: DailyMoodEntry = {
      userId: 'firaol', mood: 'sad', createdAt: new Date(2026, 8, 14, 17).toISOString(),
    };
    const entries = [latest, otherUser, earlier, { ...latest, mood: 'unset', createdAt: now.toISOString() }];

    expect(getTodaysMood(entries, 'keti', now)).toEqual(latest);
    expect(getTodaysMood(entries, 'firaol', now)).toEqual(otherUser);
  });

  it('returns no mood for absent, invalid, or previous-day data', () => {
    const now = new Date(2026, 8, 14, 12);
    const valid = { userId: 'keti', mood: 'good', createdAt: now.toISOString() };
    const invalidEntries = [
      null, undefined, 'good', {},
      { ...valid, mood: 'toString' },
      { ...valid, mood: null },
      { ...valid, createdAt: 'invalid-date' },
      { ...valid, createdAt: now.getTime() },
      { ...valid, createdAt: new Date(2026, 8, 13, 23, 59).toISOString() },
    ];

    expect(getTodaysMood(invalidEntries, 'keti', now)).toBeNull();
    expect(getTodaysMood([], 'keti', now)).toBeNull();
    expect(getTodaysMood([valid], undefined, now)).toBeNull();
  });

  it('uses local calendar dates across midnight and across the full day', () => {
    const justAfterMidnight = new Date(2026, 8, 14, 0, 15);
    const lastNight: DailyMoodEntry = {
      userId: 'keti', mood: 'sad', createdAt: new Date(2026, 8, 13, 23, 55).toISOString(),
    };
    const thisMorning: DailyMoodEntry = {
      userId: 'keti', mood: 'good', createdAt: new Date(2026, 8, 14, 0, 5).toISOString(),
    };

    expect(getMoodDayKey(justAfterMidnight)).toBe('2026-09-14');
    expect(getTodaysMood([lastNight], 'keti', justAfterMidnight)).toBeNull();
    expect(getTodaysMood([thisMorning], 'keti', new Date(2026, 8, 14, 23, 55))).toEqual(thisMorning);
  });
});
