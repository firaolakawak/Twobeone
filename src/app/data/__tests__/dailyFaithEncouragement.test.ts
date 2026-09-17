import { describe, expect, it } from 'vitest';
import { DAILY_FAITH_ENCOURAGEMENTS, getDailyFaithEncouragement } from '../dailyFaithEncouragement';
import { FAITH_QUEST_MISSIONS } from '../faithQuest';
import { dailyFaithChallengeMessages } from '../../locales/dailyFaithChallenge';
import { translateUi } from '../../utils/uiTranslation';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe('daily faith encouragement', () => {
  it('provides the same brief encouragement for both partners in every mission', () => {
    const encountered = new Set<string>();
    for (const mission of FAITH_QUEST_MISSIONS) {
      const encouragement = getDailyFaithEncouragement(mission.id);
      expect(encouragement).toEqual(getDailyFaithEncouragement(mission.id));
      expect(encouragement.emoji).not.toBe('');
      expect(encouragement.text.split(/\s+/).length).toBeLessThanOrEqual(12);
      expect(dailyFaithChallengeMessages[encouragement.text], mission.id).toHaveLength(2);
      encountered.add(encouragement.text);
    }
    expect(encountered.size).toBe(DAILY_FAITH_ENCOURAGEMENTS.length);
    for (const invalid of ['', 'unknown', 'quest-0', 'quest-99999999999999999999']) {
      expect(getDailyFaithEncouragement(invalid)).toEqual(DAILY_FAITH_ENCOURAGEMENTS[0]);
    }
  });

  it('keeps complete Amharic and Oromo copy with matching named placeholders', () => {
    for (const [source, editions] of Object.entries(dailyFaithChallengeMessages)) {
      expect(editions, source).toHaveLength(2);
      expect(editions[0], source).toMatch(/[\u1200-\u137f]/);
      for (const language of ['am', 'om'] as const) {
        const translated = translateUi(language, dailyFaithChallengeMessages, source);
        expect(translated.trim(), `${language}: ${source}`).not.toBe('');
        expect(translated, `${language}: ${source}`).not.toBe(source);
        expect(translated, `${language}: ${source}`).not.toContain('\uFFFD');
        expect(placeholders(translated), `${language}: ${source}`).toEqual(placeholders(source));
      }
    }
  });
});
