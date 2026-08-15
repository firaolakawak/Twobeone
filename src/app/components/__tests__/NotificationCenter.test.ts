import { describe, expect, it } from 'vitest';
import { deduplicateDailyMoodReports } from '../NotificationCenter';

describe('notification deduplication', () => {
  it('keeps only the newest mood report per UTC day without hiding other notifications', () => {
    const notifications = [
      { id: 'new', type: 'mood_report', createdAt: '2026-08-15T12:30:00.000Z' },
      { id: 'question', type: 'question_answered', createdAt: '2026-08-15T12:00:00.000Z' },
      { id: 'old', type: 'mood_report', createdAt: '2026-08-15T08:00:00.000Z' },
      { id: 'yesterday', type: 'mood_report', createdAt: '2026-08-14T22:00:00.000Z' },
    ];

    expect(
      deduplicateDailyMoodReports(notifications as any).map((notification) => notification.id),
    ).toEqual(['new', 'question', 'yesterday']);
  });
});
