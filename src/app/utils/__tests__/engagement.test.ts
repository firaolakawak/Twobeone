import { describe, expect, it } from 'vitest';
import { formatEngagementTime, getEngagementCategory } from '../engagement';

describe('engagement categorization', () => {
  it('maps core relationship activities to report categories', () => {
    expect(getEngagementCategory('devotions', null)).toBe('reading');
    expect(getEngagementCategory('journal', null)).toBe('journaling');
    expect(getEngagementCategory('prayer', null)).toBe('praying');
    expect(getEngagementCategory('home', 'daily-question')).toBe('answering');
  });

  it('formats daily, weekly, and monthly totals compactly', () => {
    expect(formatEngagementTime(5_460)).toBe('1h 31m');
    expect(formatEngagementTime(90)).toBe('1m');
  });
});
