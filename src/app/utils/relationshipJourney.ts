export const RELATIONSHIP_STAGE_START_DAYS = [0, 90, 180, 250, 360] as const;

export function getElapsedRelationshipTime(start: string | Date | undefined, now = Date.now()) {
  if (!start) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const startTime = start instanceof Date ? start.getTime() : new Date(start).getTime();
  if (!Number.isFinite(startTime)) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const diffMs = Math.max(0, now - startTime);
  return {
    days: Math.floor(diffMs / 86_400_000),
    hours: Math.floor((diffMs % 86_400_000) / 3_600_000),
    minutes: Math.floor((diffMs % 3_600_000) / 60_000),
    seconds: Math.floor((diffMs % 60_000) / 1_000),
  };
}

export function getRelationshipStageProgress(daysTogetherInput: number) {
  const daysTogether = Number.isFinite(daysTogetherInput)
    ? Math.max(0, Math.floor(daysTogetherInput))
    : 0;
  let stageIndex = 0;

  for (let index = RELATIONSHIP_STAGE_START_DAYS.length - 1; index >= 0; index--) {
    if (daysTogether >= RELATIONSHIP_STAGE_START_DAYS[index]) {
      stageIndex = index;
      break;
    }
  }

  const stageStart = RELATIONSHIP_STAGE_START_DAYS[stageIndex];
  const nextStageStart = RELATIONSHIP_STAGE_START_DAYS[stageIndex + 1];
  const daysLeft = nextStageStart === undefined ? null : Math.max(0, nextStageStart - daysTogether);
  const progressPercent = nextStageStart === undefined
    ? 100
    : Math.min(100, Math.max(0, Math.floor(((daysTogether - stageStart) / (nextStageStart - stageStart)) * 100)));

  return { daysTogether, stageIndex, daysLeft, progressPercent };
}

export interface RelationshipMilestone {
  id: string;
  title: string;
  date: string;
}

export function getUpcomingRelationshipMilestone(milestones: RelationshipMilestone[], now = Date.now()) {
  const upcoming = milestones
    .map(milestone => ({ milestone, time: new Date(milestone.date).getTime() }))
    .filter(({ time }) => Number.isFinite(time) && time > now)
    .sort((first, second) => first.time - second.time)[0];

  if (!upcoming) return null;
  const remaining = upcoming.time - now;
  return {
    milestone: upcoming.milestone,
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining % 86_400_000) / 3_600_000),
  };
}
