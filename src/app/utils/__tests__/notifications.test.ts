import { describe, expect, it } from 'vitest';
import { getDevotionalNotificationId } from '../notifications';

describe('getDevotionalNotificationId', () => {
  it('returns the devotional selected by a prayer-message notification', () => {
    expect(
      getDevotionalNotificationId({
        type: 'devotional',
        data: { devotionId: 'devotion-123' },
      }),
    ).toBe('devotion-123');
  });

  it('supports legacy snake-case notification data', () => {
    expect(
      getDevotionalNotificationId({
        type: 'devotional',
        data: { devotion_id: 'legacy-devotion' },
      }),
    ).toBe('legacy-devotion');
  });

  it('does not route unrelated or malformed notifications', () => {
    expect(
      getDevotionalNotificationId({
        type: 'prayer',
        data: { devotionId: 'devotion-123' },
      }),
    ).toBeNull();
    expect(
      getDevotionalNotificationId({
        type: 'devotional',
        data: { devotionId: '' },
      }),
    ).toBeNull();
  });
});
