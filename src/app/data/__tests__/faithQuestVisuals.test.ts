import { describe, expect, it } from 'vitest';
import { FAITH_QUEST_MISSIONS } from '../faithQuest';
import { getFaithQuestVisuals } from '../faithQuestVisuals';
import { faithQuestVisualMessages } from '../../locales/faithQuestVisuals';
import { translateUi, type UiMessages } from '../../utils/uiTranslation';

const messages: UiMessages = faithQuestVisualMessages;

describe('Together in Faith visual choices', () => {
  it('provides a scene and three distinct short choices for every playable mission', () => {
    for (const mission of FAITH_QUEST_MISSIONS) {
      const visual = getFaithQuestVisuals(mission.id);
      expect(visual, mission.id).toBeDefined();
      expect(visual!.emoji, mission.id).toMatch(/\p{Extended_Pictographic}/u);
      expect(visual!.prompt.trim(), mission.id).not.toBe('');
      expect(visual!.choices, mission.id).toHaveLength(mission.options.length);
      expect(new Set(visual!.choices.map(({ label }) => label)).size, mission.id).toBe(3);
      for (const choice of visual!.choices) {
        expect(choice.emoji, `${mission.id}: ${choice.label}`).toMatch(/\p{Extended_Pictographic}/u);
        expect(choice.label.trim().split(/\s+/).length, `${mission.id}: ${choice.label}`).toBeLessThanOrEqual(3);
      }
    }
  });

  it('translates every short prompt and choice into both supported non-English languages', () => {
    const sourceCopy = new Set(FAITH_QUEST_MISSIONS.flatMap(({ id }) => {
      const visual = getFaithQuestVisuals(id)!;
      return [visual.prompt, ...visual.choices.map(({ label }) => label)];
    }));
    expect(Object.keys(messages).sort()).toEqual([...sourceCopy].sort());
    for (const source of sourceCopy) {
      expect(messages[source], source).toHaveLength(2);
      expect(messages[source][0], source).toMatch(/[\u1200-\u137f]/);
      for (const language of ['am', 'om'] as const) {
        const translated = translateUi(language, messages, source);
        expect(translated.trim(), `${language}: ${source}`).not.toBe('');
        expect(translated, `${language}: ${source}`).not.toBe(source);
        expect(translated, `${language}: ${source}`).not.toContain('\uFFFD');
      }
      expect(translateUi('en', messages, source)).toBe(source);
    }
  });

  it('leaves missing IDs and inherited object properties unresolved', () => {
    for (const id of ['quest-31', '', 'constructor', 'toString', '__proto__']) {
      expect(getFaithQuestVisuals(id), id).toBeUndefined();
    }
  });
});
