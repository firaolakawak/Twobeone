import { memo, useEffect, useId, useState, type MouseEventHandler } from 'react';
import { Clock, MapPin, Heart } from 'lucide-react';
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
  onLocationClick,
}: {
  startDate?: string;
  distanceKm?: number | null;
  onLocationClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  const { t } = useLanguage();
  const heartGradient = useId();
  const now = useCurrentTime(1_000);
  const time = getElapsedRelationshipTime(startDate, now);
  const hasDistance = typeof distanceKm === 'number' && Number.isFinite(distanceKm) && distanceKm >= 0;
  const distanceLabel = hasDistance
    ? `${distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km ${t.dashboard.distanceApart}`
    : t.dashboard.shareLocation;
  const locationContent = <><MapPin aria-hidden="true" /><span>{distanceLabel}</span></>;
  const clock = [time.hours, time.minutes, time.seconds].map(value => String(value).padStart(2, '0')).join(':');

  return (
    <div className="relationship-summary" data-relationship-summary>
      <div className="relationship-summary-panel">
        <div className="relationship-summary-count-group">
          <Heart className="relationship-heartbeat relationship-summary-heart" fill={`url(#${heartGradient})`} strokeWidth={1.25} aria-hidden="true">
            <defs>
              <linearGradient id={heartGradient} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffe0f6" />
                <stop offset=".35" stopColor="#ff8ed9" />
                <stop offset="1" stopColor="#f43b9e" />
              </linearGradient>
            </defs>
          </Heart>
          <p className="relationship-summary-counter" data-relationship-counter>
            <span className="relationship-summary-days">{time.days}</span>{' '}
            <span className="tbo-caption relationship-summary-label">{t.dashboard.daysTogether}</span>
          </p>
        </div>
        <span className="relationship-summary-panel-divider" aria-hidden="true" />
        <div className="relationship-summary-clock-group">
          <Clock className="relationship-summary-clock-icon" aria-hidden="true" />
          <span className="relationship-summary-clock" data-relationship-clock>{clock}</span>
        </div>
      </div>
      <div className="relationship-summary-context">
        {(hasDistance || onLocationClick) && (
          <>
            {onLocationClick ? (
              <button
                type="button"
                className="tbo-caption relationship-summary-distance"
                onClick={onLocationClick}
                aria-label={`${t.dashboard.locationSettings}: ${distanceLabel}`}
                aria-haspopup="dialog"
                title={t.dashboard.locationSettings}
                data-relationship-location
              >{locationContent}</button>
            ) : <div className="tbo-caption relationship-summary-distance">{locationContent}</div>}
            <span className="relationship-summary-context-divider" aria-hidden="true" />
          </>
        )}
        <p className="tbo-caption relationship-summary-tagline">{t.dashboard.growingTogetherInFaith}</p>
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
