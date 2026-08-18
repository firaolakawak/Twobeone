import { describe, expect, it } from 'vitest';
import {
  getElapsedRelationshipTime,
  getRelationshipStageProgress,
  pickRandomHomeSpotlight,
} from '../CoupleDashboard';

describe('home spotlight selection', () => {
  it('can deterministically select each spotlight type', () => {
    expect(pickRandomHomeSpotlight(undefined, () => 0)).toBe('devotion');
    expect(pickRandomHomeSpotlight(undefined, () => 0.34)).toBe('question');
    expect(pickRandomHomeSpotlight(undefined, () => 0.99)).toBe('journal');
  });

  it('does not repeat the current type when the user shuffles', () => {
    expect(pickRandomHomeSpotlight('devotion', () => 0)).toBe('question');
    expect(pickRandomHomeSpotlight('question', () => 0.99)).toBe('journal');
    expect(pickRandomHomeSpotlight('journal', () => 0.99)).toBe('question');
  });
});

describe('relationship growth stage calculation', () => {
  it('keeps day 76 in Seed with exactly 14 days remaining', () => {
    expect(getRelationshipStageProgress(76)).toEqual({
      daysTogether: 76,
      stageIndex: 0,
      daysLeft: 14,
      progressPercent: 84,
    });
  });

  it.each([
    [0, 0, 90],
    [89, 0, 1],
    [90, 1, 90],
    [179, 1, 1],
    [180, 2, 70],
    [249, 2, 1],
    [250, 3, 110],
    [359, 3, 1],
    [360, 4, null],
  ])('maps day %i to stage %i with %s days left', (days, stageIndex, daysLeft) => {
    const result = getRelationshipStageProgress(days);
    expect(result.stageIndex).toBe(stageIndex);
    expect(result.daysLeft).toBe(daysLeft);
  });

  it('uses complete elapsed 24-hour periods and clamps future dates to zero', () => {
    const now = Date.parse('2026-08-18T12:00:00.000Z');
    expect(getElapsedRelationshipTime('2026-08-17T11:59:59.000Z', now).days).toBe(1);
    expect(getElapsedRelationshipTime('2026-08-18T13:00:00.000Z', now).days).toBe(0);
  });
});
