import { describe, expect, it } from 'vitest';
import {
  FAITH_QUEST_CHAPTERS,
  FAITH_QUEST_MISSIONS,
  getFaithQuestMission,
} from '../faithQuest';
import { faithQuestContentMessages } from '../../locales/faithQuestContent';
import { translateUi, type UiMessages } from '../../utils/uiTranslation';

const contentMessages: UiMessages = faithQuestContentMessages;
const visibleContent = new Set([
  ...FAITH_QUEST_CHAPTERS.flatMap(({ title, virtue, description, scripture }) => [title, virtue, description, scripture]),
  ...FAITH_QUEST_MISSIONS.flatMap(({ title, prompt, options, followUps, action, reflection, scripture }) => [title, prompt, ...options, ...(followUps ?? []), action, reflection, scripture]),
]);
const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe('Together in Faith mission content', () => {
  it('keeps thirty stable, unique mission IDs for persisted progress', () => {
    expect(FAITH_QUEST_MISSIONS.map(({ id }) => id)).toEqual(
      Array.from({ length: 30 }, (_, index) => `quest-${String(index + 1).padStart(2, '0')}`),
    );
    expect(new Set(FAITH_QUEST_MISSIONS.map(({ title }) => title)).size).toBe(30);
  });

  it('provides five missions and all three game modes in each of the six chapters', () => {
    expect(FAITH_QUEST_CHAPTERS.map(({ id }) => id)).toEqual(['love', 'patience', 'kindness', 'peace', 'faithfulness', 'joy']);
    for (const chapter of FAITH_QUEST_CHAPTERS) {
      const missions = FAITH_QUEST_MISSIONS.filter(({ chapterId }) => chapterId === chapter.id);
      expect(missions, chapter.id).toHaveLength(5);
      expect(new Set(missions.map(({ mode }) => mode)), chapter.id).toEqual(new Set(['heart', 'grace', 'kindness']));
      expect(missions.every(({ scripture }) => scripture === chapter.scripture)).toBe(true);
    }
    for (const mode of ['heart', 'grace', 'kindness']) {
      expect(FAITH_QUEST_MISSIONS.filter((mission) => mission.mode === mode), mode).toHaveLength(10);
    }
  });

  it('offers three distinct choices and complete activity guidance without scored answers', () => {
    for (const mission of FAITH_QUEST_MISSIONS) {
      expect(mission.options, mission.id).toHaveLength(3);
      expect(new Set(mission.options).size, mission.id).toBe(3);
      expect(FAITH_QUEST_CHAPTERS.some(({ id }) => id === mission.chapterId), mission.id).toBe(true);
      for (const copy of [mission.title, mission.prompt, ...mission.options, mission.action, mission.reflection, mission.scripture]) {
        expect(copy.trim().length, mission.id).toBeGreaterThan(0);
      }
      expect(mission.minutes).toBeGreaterThan(0);
      expect(mission.minutes).toBeLessThanOrEqual(7);
      expect(mission).not.toHaveProperty('correctAnswer');
      expect(mission).not.toHaveProperty('score');
    }
  });

  it('returns the requested stable mission and leaves an unknown ID unresolved', () => {
    expect(getFaithQuestMission('quest-01')).toBe(FAITH_QUEST_MISSIONS[0]);
    expect(getFaithQuestMission('quest-30')).toBe(FAITH_QUEST_MISSIONS[29]);
    expect(getFaithQuestMission('quest-31')).toBeUndefined();
    expect(getFaithQuestMission('constructor')).toBeUndefined();
  });

  it('gives each grace choice a distinct concise roleplay response, only for scenario missions', () => {
    for (const mission of FAITH_QUEST_MISSIONS) {
      if (mission.mode === 'grace') {
        expect(mission.followUps, mission.id).toHaveLength(3);
        expect(new Set(mission.followUps).size, mission.id).toBe(3);
        for (const sample of mission.followUps!) {
          expect(sample.trim().length, mission.id).toBeGreaterThan(0);
          expect(sample.trim().split(/\s+/).length, mission.id).toBeLessThanOrEqual(15);
        }
      } else {
        expect(mission, mission.id).not.toHaveProperty('followUps');
      }
    }
  });

  it('supplies Amharic and Oromo translations for every displayed activity string', () => {
    expect(Object.keys(contentMessages).sort()).toEqual([...visibleContent].sort());
    for (const source of visibleContent) {
      const pair = contentMessages[source];
      expect(pair, source).toHaveLength(2);
      expect(pair[0], source).toMatch(/[\u1200-\u137f]/);
      for (const language of ['am', 'om'] as const) {
        const translated = translateUi(language, contentMessages, source);
        expect(translated.trim(), `${language}: ${source}`).not.toBe('');
        expect(translated, `${language}: ${source}`).not.toBe(source);
        expect(translated, `${language}: ${source}`).not.toContain('\uFFFD');
        expect(placeholders(translated), `${language}: ${source}`).toEqual(placeholders(source));
      }
      expect(translateUi('en', contentMessages, source)).toBe(source);
    }
  });
});
