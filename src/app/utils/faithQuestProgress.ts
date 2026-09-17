import { FAITH_QUEST_MISSIONS } from '../data/faithQuest';

export type QuestPlayMode = 'practice' | 'together';
export interface QuestCompletion { id: string; completedAt: string }
export interface QuestProgress { version: 1; completions: QuestCompletion[] }

export const emptyQuestProgress = (): QuestProgress => ({ version: 1, completions: [] });

export function questStorageKey(userId: string | undefined, partnerId: string | undefined, mode: QuestPlayMode) {
  return `twobeone:faith-quest:preview:v1:${encodeURIComponent(JSON.stringify([userId || 'guest', partnerId || 'unlinked', mode]))}`;
}

export function readQuestProgress(key: string): QuestProgress {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    if (value?.version !== 1 || !Array.isArray(value.completions)) return emptyQuestProgress();
    const completions: QuestCompletion[] = [];
    // Only restore a contiguous, valid journey. A malformed record never unlocks later missions.
    for (const mission of FAITH_QUEST_MISSIONS) {
      const record = value.completions.find((item: unknown) => item && typeof item === 'object' && (item as QuestCompletion).id === mission.id);
      if (!record || typeof record.completedAt !== 'string' || !Number.isFinite(Date.parse(record.completedAt))) break;
      completions.push({ id: mission.id, completedAt: record.completedAt });
    }
    return { version: 1, completions };
  } catch { return emptyQuestProgress(); }
}

export function completeQuestMission(progress: QuestProgress, id: string, now = new Date()): QuestProgress {
  if (progress.completions.some(item => item.id === id)) return progress;
  if (FAITH_QUEST_MISSIONS[progress.completions.length]?.id !== id) return progress;
  return { version: 1, completions: [...progress.completions, { id, completedAt: now.toISOString() }] };
}

export function saveQuestProgress(key: string, progress: QuestProgress): boolean {
  try { localStorage.setItem(key, JSON.stringify(progress)); return true; }
  catch { return false; }
}
