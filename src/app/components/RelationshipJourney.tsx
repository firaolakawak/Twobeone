import { memo, useEffect, useState } from 'react';
import { Globe, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/relationship-journey.css';
import {
  RELATIONSHIP_STAGE_START_DAYS,
  getElapsedRelationshipTime,
  getRelationshipStageProgress,
  getUpcomingRelationshipMilestone,
  type RelationshipMilestone,
} from '../utils/relationshipJourney';

function useCurrentTime(refreshMs: number) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const interval = window.setInterval(refresh, refreshMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshMs]);

  return now;
}

export const RelationshipSummary = memo(function RelationshipSummary({
  startDate,
  distanceKm,
}: {
  startDate?: string;
  distanceKm?: number | null;
}) {
  const { t } = useLanguage();
  const now = useCurrentTime(1_000);
  const time = getElapsedRelationshipTime(startDate, now);
  const hasDistance = typeof distanceKm === 'number' && Number.isFinite(distanceKm) && distanceKm >= 0;
  const clock = [time.hours, time.minutes, time.seconds].map(value => String(value).padStart(2, '0')).join(':');

  return (
    <div className="mt-3 text-left" data-relationship-summary>
      <div className="flex items-start gap-2">
        <Heart className="relationship-heartbeat mt-0.5 h-8 w-8 shrink-0 fill-rose-500 text-rose-500" aria-hidden="true" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-foreground" data-relationship-counter>
            <span className="text-[40px] font-bold leading-none tracking-tight tabular-nums sm:text-[44px]">{time.days}</span>{' '}
            <span className="flex min-w-0 flex-col">
              <sup className="static text-xs font-normal leading-4 text-muted-foreground">{t.dashboard.daysTogether}</sup>
              <span className="text-sm font-bold leading-4 tabular-nums text-rose-600 dark:text-rose-400" data-relationship-clock>{clock}</span>
            </span>
          </p>
          {hasDistance && (
            <div className="flex items-center gap-1.5 text-xs leading-4 text-muted-foreground">
              <Globe className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
              <span>{distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km {t.dashboard.distanceApart}</span>
            </div>
          )}
          <p className="text-sm font-bold leading-5 text-foreground">
            {t.dashboard.growingTogetherInFaith}
          </p>
        </div>
      </div>
    </div>
  );
});

export const RelationshipGrowth = memo(function RelationshipGrowth({ startDate }: { startDate?: string }) {
  const { t } = useLanguage();
  const now = useCurrentTime(60_000);
  const { daysTogether, stageIndex, daysLeft, progressPercent } = getRelationshipStageProgress(
    getElapsedRelationshipTime(startDate, now).days,
  );
  const stages = [
    { key: 'seed', label: t.dashboard.stages.seed, emoji: '🌱' },
    { key: 'growth', label: t.dashboard.stages.growth, emoji: '🌿' },
    { key: 'unity', label: t.dashboard.stages.unity, emoji: '💞' },
    { key: 'commitment', label: t.dashboard.stages.commitment, emoji: '🤝' },
    { key: 'covenant', label: t.dashboard.stages.covenant, emoji: '👑' },
  ];
  const stageTitle = `${stages[stageIndex].label} ${t.dashboard.stage}`;
  const progressDescription = `${progressPercent}% · ${daysTogether} ${t.dashboard.daysTogether.toLocaleLowerCase()}${daysLeft !== null ? ` · ${daysLeft} ${t.dashboard.daysLeft}` : ''}`;
  const finalStageDay = RELATIONSHIP_STAGE_START_DAYS[RELATIONSHIP_STAGE_START_DAYS.length - 1];
  const journeyDays = Math.min(daysTogether, finalStageDay);
  const journeyPercent = (journeyDays / finalStageDay) * 100;

  return (
    <section aria-label={stageTitle} className="relationship-growth border-t border-border/70 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold leading-5 text-foreground">
          {stageTitle}
        </h3>
        <div className="flex items-center gap-2 text-xs leading-5">
          <span className="font-semibold tabular-nums text-primary">{progressPercent}%</span>
          {daysLeft !== null && (
            <>
              <span className="text-muted-foreground/60" aria-hidden="true">·</span>
              <span className="whitespace-nowrap text-muted-foreground">{daysLeft} {t.dashboard.daysLeft}</span>
            </>
          )}
        </div>
      </div>
      <div className="relative h-10 w-full sm:h-12" data-stage-track>
        <div
          role="progressbar"
          aria-label={stageTitle}
          aria-valuemin={0}
          aria-valuemax={finalStageDay}
          aria-valuenow={journeyDays}
          aria-valuetext={progressDescription}
          className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-border sm:inset-x-[18px]"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${journeyPercent}%` }} />
        </div>
        <ol className="absolute inset-y-0 inset-x-4 sm:inset-x-[18px]" aria-label={t.dashboard.stage}>
          {stages.map((stage, index) => (
            <li
              key={stage.key}
              aria-current={index === stageIndex ? 'step' : undefined}
              title={stage.label}
              className={`absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border sm:h-9 sm:w-9 ${index === stageIndex ? 'border-rose-400 bg-rose-50 dark:bg-rose-950' : 'border-border/70 bg-card'}`}
              style={{ left: `${(RELATIONSHIP_STAGE_START_DAYS[index] / finalStageDay) * 100}%` }}
            >
              {index === stageIndex && (
                <span className="relationship-stage-pulse pointer-events-none absolute -inset-px rounded-full border border-rose-400" aria-hidden="true" />
              )}
              <span role="img" aria-label={stage.label} className="relative text-[22px] leading-none sm:text-2xl">{stage.emoji}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
});

export const RelationshipCountdown = memo(function RelationshipCountdown({ milestones }: { milestones: RelationshipMilestone[] }) {
  const { t, language } = useLanguage();
  const now = useCurrentTime(60_000);
  const upcoming = getUpcomingRelationshipMilestone(milestones, now);
  if (!upcoming) return null;

  return (
    <section aria-label={upcoming.milestone.title} className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-4 text-center dark:bg-rose-500/10">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-300">{upcoming.milestone.title}</h3>
      <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground" aria-label={`${upcoming.days} ${t.time.days} ${upcoming.hours} ${t.time.hours}`}>
        {upcoming.days}{language === 'en' ? 'd' : ` ${t.time.day}`} {String(upcoming.hours).padStart(2, '0')}{language === 'en' ? 'h' : ` ${t.time.hour}`}
      </p>
    </section>
  );
});
