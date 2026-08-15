import { describe, expect, it } from 'vitest';
import { calculateCategoryProgress } from '../CategorySelection';

describe('calculateCategoryProgress', () => {
  const questions = [
    { id: 'daily-1', category: 'daily-life' },
    { id: 'daily-2', category: 'daily-life' },
    { id: 'daily-3', category: 'daily-life' },
    { id: 'trust-1', category: 'trust' },
  ];

  it('returns answered, remaining, and percentage for one category', () => {
    expect(calculateCategoryProgress(questions, [
      { questionId: 'daily-1' },
      { questionId: 'daily-2:prompt:0' },
    ], 'daily-life')).toEqual({
      total: 3,
      answered: 2,
      remaining: 1,
      percentage: 67,
    });
  });

  it('does not count multiple prompt responses more than once', () => {
    expect(calculateCategoryProgress(questions, [
      { questionId: 'daily-1:prompt:0' },
      { questionId: 'daily-1:prompt:1' },
    ], 'daily-life')).toEqual({
      total: 3,
      answered: 1,
      remaining: 2,
      percentage: 33,
    });
  });
});
