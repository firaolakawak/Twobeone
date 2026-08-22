import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { CoupleCalendarItem } from '../../data/couple-calendar';
import { alarmOccurrence, findDueCalendarAlarm } from '../CalendarAlarmManager';

function event(overrides: Partial<CoupleCalendarItem> = {}): CoupleCalendarItem {
  return {
    id: 'event-1', userId: 'user-1', title: 'Dinner plan', description: '', type: 'event',
    category: 'relationship', startsAt: '2026-08-22T19:00:00.000Z', allDay: false,
    recurrence: 'none', reminderMinutes: 60, status: 'upcoming', createPrayer: false,
    createdAt: '2026-08-20T12:00:00.000Z', updatedAt: '2026-08-20T12:00:00.000Z',
    ...overrides,
  };
}

describe('CalendarAlarmManager', () => {
  afterEach(() => window.localStorage.clear());

  it('raises an event alarm exactly one hour before its start', () => {
    const now = new Date('2026-08-22T18:00:30.000Z');
    expect(findDueCalendarAlarm([event()], now)?.item.id).toBe('event-1');
  });

  it('does not ring for dismissed, locked, or non-hour reminders', () => {
    const now = new Date('2026-08-22T18:00:30.000Z');
    const due = findDueCalendarAlarm([event()], now)!;
    window.localStorage.setItem(due.storageKey, 'dismissed');
    expect(findDueCalendarAlarm([event()], now)).toBeNull();
    expect(findDueCalendarAlarm([event({ isLockedForPartner: true })], now)).toBeNull();
    expect(findDueCalendarAlarm([event({ reminderMinutes: 15 })], now)).toBeNull();
  });

  it('calculates the next weekly occurrence for recurring plans', () => {
    const occurrence = alarmOccurrence(event({ type: 'plan', recurrence: 'weekly' }), new Date('2026-08-29T18:00:00.000Z'));
    expect(occurrence?.toISOString()).toBe('2026-08-29T19:00:00.000Z');
  });

  it('marks one-hour pushes as alarms with a strong vibration pattern', () => {
    const server = readFileSync(join(process.cwd(), 'supabase/functions/server/calendar_routes.tsx'), 'utf8');
    const serviceWorker = readFileSync(join(process.cwd(), 'src/app/public/service-worker.js'), 'utf8');
    expect(server).toContain("isOneHourAlarm ? `⏰ Event in one hour: ${item.title}`");
    expect(server).toContain("Number(item.reminderMinutes) === 60");
    expect(serviceWorker).toContain('notificationData.alarm');
    expect(serviceWorker).toContain('[500, 150, 500, 150, 500, 300, 800]');
  });
});
