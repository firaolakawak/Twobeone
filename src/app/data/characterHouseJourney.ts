import type { HomeType } from './legacyCharacterHouse';

export const CHARACTER_HOUSE_GOAL = 365;

/** Building milestones are a visual metaphor, never a score for a person's character. */
export const CHARACTER_HOUSE_STAGES = [
  { id: 'foundation', name: 'Foundation', emoji: '🧱', virtue: 'Trust', start: 0, end: 60, purpose: 'Build trust by listening honestly and praying together.' },
  { id: 'walls', name: 'Walls', emoji: '🏗️', virtue: 'Kindness', start: 60, end: 150, purpose: 'Make kindness a habit through small acts of care.' },
  { id: 'windows', name: 'Windows', emoji: '🪟', virtue: 'Understanding', start: 150, end: 220, purpose: 'Understand each other by asking, listening, and sharing.' },
  { id: 'roof', name: 'Roof', emoji: '🏠', virtue: 'Faithfulness', start: 220, end: 300, purpose: 'Practise faithfulness by keeping small promises.' },
  { id: 'home', name: 'Home', emoji: '💗', virtue: 'Love', start: 300, end: 365, purpose: 'Carry patient, practical love into everyday life.' },
] as const;

export function safeHouseBlocks(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(CHARACTER_HOUSE_GOAL, Math.max(0, Math.floor(value))) : 0;
}

export function getHouseJourneyStage(blocks: number) {
  const count = safeHouseBlocks(blocks);
  return CHARACTER_HOUSE_STAGES.find(stage => count < stage.end) ?? CHARACTER_HOUSE_STAGES[4];
}

export const SIMPLE_HOUSE_OPTIONS: Array<{ id: HomeType; label: string; emoji: string }> = [
  { id: 'house', label: 'House', emoji: '🏡' },
  { id: 'villa', label: 'Villa', emoji: '🏠' },
  { id: 'townhouse', label: 'Townhouse', emoji: '🏘️' },
  { id: 'apartment', label: 'Apartment', emoji: '🏢' },
  { id: 'duplex', label: 'Duplex', emoji: '🏘️' },
  { id: 'penthouse', label: 'Penthouse', emoji: '🌇' },
];
