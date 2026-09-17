import { beforeEach, describe, expect, it } from 'vitest';
import { completeQuestMission, emptyQuestProgress, questStorageKey, readQuestProgress } from '../faithQuestProgress';

describe('faith quest preview progress', () => {
  beforeEach(() => localStorage.clear());
  it('prevents skipping locked missions and duplicate completion rewards', () => {
    const initial = emptyQuestProgress();
    expect(completeQuestMission(initial, 'quest-02')).toBe(initial);
    const first = completeQuestMission(initial, 'quest-01');
    expect(completeQuestMission(first, 'quest-01')).toBe(first);
    expect(completeQuestMission(first, 'quest-03')).toBe(first);
    expect(completeQuestMission(first, 'quest-02').completions).toHaveLength(2);
  });
  it('ignores malformed, unknown, and noncontiguous saved progress', () => {
    localStorage.setItem('quest', '{'); expect(readQuestProgress('quest')).toEqual(emptyQuestProgress());
    localStorage.setItem('quest', JSON.stringify({ version: 1, completions: [
      { id: 'quest-01', completedAt: '2026-09-17T10:00:00Z', answers: ['private'] },
      { id: 'quest-03', completedAt: '2026-09-17T10:00:00Z' },
    ] }));
    expect(readQuestProgress('quest').completions).toEqual([{ id: 'quest-01', completedAt: '2026-09-17T10:00:00Z' }]);
  });
  it('isolates guest, account, partner, and play-mode storage', () => {
    expect(new Set([
      questStorageKey(undefined, undefined, 'practice'), questStorageKey('a', 'b', 'practice'),
      questStorageKey('b', 'a', 'practice'), questStorageKey('a', 'c', 'practice'), questStorageKey('a', 'b', 'together'),
    ]).size).toBe(5);
  });
});
