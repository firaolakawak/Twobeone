/** Original encouragement for the daily game; these are not Scripture quotations. */
export const DAILY_FAITH_ENCOURAGEMENTS = [
  { emoji: '💜', text: 'Let love lead your next small step.' },
  { emoji: '🕊️', text: 'Make room for grace today.' },
  { emoji: '💬', text: 'A gentle answer can bring you closer.' },
  { emoji: '🌱', text: 'Choose kindness, even in the little things.' },
  { emoji: '🙏', text: 'Bring this moment to God together.' },
  { emoji: '🤝', text: 'Faith grows as you show up for each other.' },
] as const;

export function getDailyFaithEncouragement(missionId: string): { emoji: string; text: string } {
  const match = /^quest-(\d+)$/.exec(missionId);
  const missionNumber = match ? Number(match[1]) : 1;
  const index = Number.isSafeInteger(missionNumber) && missionNumber > 0
    ? (missionNumber - 1) % DAILY_FAITH_ENCOURAGEMENTS.length
    : 0;
  return DAILY_FAITH_ENCOURAGEMENTS[index];
}
