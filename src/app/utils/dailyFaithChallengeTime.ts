export const DAILY_FAITH_CHALLENGE_TIME_ZONE = 'Asia/Dubai';

const ABU_DHABI_UTC_OFFSET = '+04:00';
const DAY_IN_MILLISECONDS = 86_400_000;

export const getDailyFaithChallengeResetTime = (day: string) =>
  Date.parse(`${day}T00:00:00.000${ABU_DHABI_UTC_OFFSET}`) + DAY_IN_MILLISECONDS;

export const getLegacyUtcChallengeResetTime = (day: string) =>
  Date.parse(`${day}T00:00:00.000Z`) + DAY_IN_MILLISECONDS;
