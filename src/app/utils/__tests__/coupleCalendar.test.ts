import { describe, expect, it } from 'vitest';
import {
  buildPrayerFallback,
  CoupleCalendarItem,
  coupleCalendarCopy,
  getMonthGridDays,
  getWeekDays,
  getYearMonths,
  occursOnDay,
} from '../../data/couple-calendar';

const routine: CoupleCalendarItem = {
  id: 'cal-1', userId: 'user-1', title: 'Pray together', description: '',
  type: 'routine', category: 'faith', startsAt: '2026-08-17T18:00:00.000Z',
  allDay: false, recurrence: 'weekly', reminderMinutes: 60, status: 'upcoming',
  createPrayer: true, createdAt: '2026-08-17T12:00:00.000Z', updatedAt: '2026-08-17T12:00:00.000Z',
};

describe('Couple Calendar', () => {
  it('builds a Monday-to-Sunday weekly planner', () => {
    const days = getWeekDays(new Date('2026-08-20T12:00:00'));
    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(1);
    expect(days[6].getDay()).toBe(0);
  });

  it('builds complete monthly and yearly calendar views', () => {
    const monthDays = getMonthGridDays(new Date('2026-08-18T12:00:00'));
    expect(monthDays).toHaveLength(42);
    expect(monthDays[0].getDay()).toBe(1);
    expect(monthDays[41].getDay()).toBe(0);

    const months = getYearMonths(new Date('2026-08-18T12:00:00'));
    expect(months).toHaveLength(12);
    expect(months[0].getMonth()).toBe(0);
    expect(months[11].getMonth()).toBe(11);
  });

  it('places weekly routines only on their recurring weekday', () => {
    expect(occursOnDay(routine, new Date('2026-08-24T12:00:00.000Z'))).toBe(true);
    expect(occursOnDay(routine, new Date('2026-08-25T12:00:00.000Z'))).toBe(false);
  });

  it('prepares faith-aware prayer fallbacks in all three UI languages', () => {
    expect(buildPrayerFallback('Marriage retreat', 'relationship', 'en').title).toContain('Marriage retreat');
    expect(buildPrayerFallback('የቤተሰብ ጊዜ', 'family', 'am').text).toContain('ጌታ');
    expect(buildPrayerFallback('Karoora maatii', 'family', 'om').text).toContain('Gooftaa');
  });

  it('keeps every calendar UI key translated in English, Amharic, and Afaan Oromo', () => {
    const englishKeys = Object.keys(coupleCalendarCopy.en).sort();
    expect(Object.keys(coupleCalendarCopy.am).sort()).toEqual(englishKeys);
    expect(Object.keys(coupleCalendarCopy.om).sort()).toEqual(englishKeys);
    for (const language of ['en', 'am', 'om'] as const) {
      expect(Object.values(coupleCalendarCopy[language]).every(Boolean)).toBe(true);
    }
  });
});
