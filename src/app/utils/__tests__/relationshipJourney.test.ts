import { describe, expect, it } from 'vitest';
import { getElapsedRelationshipTime, getRelationshipStageProgress, getUpcomingRelationshipMilestone } from '../relationshipJourney';

describe('relationship journey calculations', () => {
  it.each([undefined, '', 'invalid-date', new Date(NaN)])('treats an invalid start date as no elapsed time (%s)', start => {
    expect(getElapsedRelationshipTime(start)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it('clamps dates in the future to zero elapsed time', () => {
    expect(getElapsedRelationshipTime('2026-09-14T00:00:00Z', Date.parse('2026-09-13T00:00:00Z'))).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it.each([NaN, Infinity, -1])('clamps invalid day counts to the initial stage (%s)', days => {
    expect(getRelationshipStageProgress(days)).toEqual({ daysTogether: 0, stageIndex: 0, daysLeft: 90, progressPercent: 0 });
  });

  it('uses whole completed days for stage progress', () => {
    expect(getRelationshipStageProgress(102.9)).toEqual({ daysTogether: 102, stageIndex: 1, daysLeft: 78, progressPercent: 13 });
  });

  it('ignores invalid or already reached milestone dates without changing the input order', () => {
    const now = Date.parse('2026-09-13T00:00:00Z');
    const milestones = [
      { id: 'later', title: 'Later', date: '2026-09-15T00:00:00Z' },
      { id: 'now', title: 'Now', date: '2026-09-13T00:00:00Z' },
      { id: 'invalid', title: 'Invalid', date: '' },
      { id: 'next', title: 'Next', date: '2026-09-14T09:00:00Z' },
    ];
    expect(getUpcomingRelationshipMilestone(milestones, now)).toEqual({ milestone: milestones[3], days: 1, hours: 9 });
    expect(milestones[0].id).toBe('later');
  });
});
