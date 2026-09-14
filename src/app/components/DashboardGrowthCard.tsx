import { memo, useEffect, useId, useState, type CSSProperties } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { dashboardGrowthMessages } from '../locales/dashboardGrowth';
import { RELATIONSHIP_STAGE_START_DAYS, getElapsedRelationshipTime, getRelationshipStageProgress } from '../utils/relationshipJourney';
import { useUiCopy } from '../utils/uiTranslation';
import '../styles/dashboard-growth.css';

const milestones = [
  { key: 'seed', emoji: '🌱' },
  { key: 'growth', emoji: '🌿' },
  { key: 'unity', emoji: '💕' },
  { key: 'commitment', emoji: '🤝' },
  { key: 'covenant', emoji: '👑' },
] as const;

function GrowthPlantIcon({ variant }: { variant: 'seed' | 'growth' }) {
  const gradientId = useId();
  return (
    <svg className="dashboard-growth-plant" viewBox="0 0 36 40" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="5" y1="3" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b3ef67" />
          <stop offset=".42" stopColor="#69ce38" />
          <stop offset="1" stopColor="#299548" />
        </linearGradient>
      </defs>
      {variant === 'seed' ? (
        <>
          <path d="M17.5 36C22 29 15 25 19.5 16" stroke="#57a745" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M19.5 18C17 8 26 4 34 6C33 14 27 20 19.5 18Z" fill={`url(#${gradientId})`} />
          <path d="M18 22C8 25 2 18 2 13C9 10 17 14 18 22Z" fill={`url(#${gradientId})`} />
          <path d="M19.5 18L28 10M17 21L7 16" stroke="#408f37" strokeWidth=".8" strokeLinecap="round" opacity=".55" />
        </>
      ) : (
        <>
          <path d="M18 37C21 26 15 18 18 7" stroke="#418c4e" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M18 17C11 13 13 5 20 1C26 8 23 14 18 17Z" fill={`url(#${gradientId})`} />
          <path d="M17.5 24C8 25 2 17 3 11C12 11 18 16 17.5 24Z" fill={`url(#${gradientId})`} />
          <path d="M19 30C18 21 25 16 33 17C33 26 26 31 19 30Z" fill={`url(#${gradientId})`} />
          <path d="M18 17L20 7M17 23L7 15M20 29L28 22" stroke="#378c42" strokeWidth=".8" strokeLinecap="round" opacity=".6" />
        </>
      )}
    </svg>
  );
}

export const DashboardGrowthCard = memo(function DashboardGrowthCard({ startDate }: { startDate?: string }) {
  const { t } = useLanguage();
  const tr = useUiCopy(dashboardGrowthMessages);
  const [now, setNow] = useState(Date.now);
  const titleId = useId();
  const leafGradientId = useId();

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const interval = window.setInterval(refresh, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const { stageIndex, daysLeft, progressPercent } = getRelationshipStageProgress(
    getElapsedRelationshipTime(startDate, now).days,
  );
  const stageNames = [t.dashboard.stages.seed, t.dashboard.stages.growth, t.dashboard.stages.unity, t.dashboard.stages.commitment, t.dashboard.stages.covenant];
  const stageTitle = tr('{stage} Stage', { stage: stageNames[stageIndex] });
  const progressDescription = daysLeft === null
    ? tr('{percent}% complete', { percent: progressPercent })
    : tr('{percent}% complete; {days} days left', { percent: progressPercent, days: daysLeft });

  return (
    <section className="dashboard-growth" aria-labelledby={titleId} data-dashboard-growth>
      <div className="dashboard-growth-inner">
        <div className="dashboard-growth-header">
          <div className="dashboard-growth-heading">
            <svg className="dashboard-growth-sprig" viewBox="0 0 36 48" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id={leafGradientId} x1="4" y1="2" x2="31" y2="39" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#d8a5ff" />
                  <stop offset=".45" stopColor="#a36bff" />
                  <stop offset="1" stopColor="#7736e9" />
                </linearGradient>
              </defs>
              <path d="M18.5 45C15.5 29 20.5 16 26 7" stroke="#9b58ef" strokeWidth="2" strokeLinecap="round" />
              <g fill={`url(#${leafGradientId})`}>
                <path d="M23 15C22 7 28 1 34 1C35 8 29 14 23 15Z" />
                <path d="M18 24C10 24 5 17 7 10C14 10 19 17 18 24Z" />
                <path d="M18 29C18 22 24 17 31 18C31 25 25 30 18 29Z" />
                <path d="M16.5 36C8 37 1 32 2 25C10 24 16 29 16.5 36Z" />
                <path d="M17 40C18 32 25 29 32 31C30 38 23 42 17 40Z" />
              </g>
            </svg>
            <div className="dashboard-growth-title-copy">
              <h3 className="tbo-section-title" id={titleId}>{stageTitle}</h3>
              <p className="tbo-caption dashboard-growth-subtitle">{tr('Building a Christ-centered relationship')}</p>
            </div>
          </div>
          <div className="dashboard-growth-status">
            <div className="dashboard-growth-status-copy">
              <p className="tbo-section-title dashboard-growth-percent">{progressPercent}%</p>
              {daysLeft !== null && <p className="tbo-caption dashboard-growth-days">{tr('{days} days left', { days: daysLeft })}</p>}
            </div>
            <div
              className="dashboard-growth-progress"
              role="progressbar"
              aria-labelledby={titleId}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              aria-valuetext={progressDescription}
            >
              <svg viewBox="0 0 56 56" fill="none" aria-hidden="true">
                <circle className="dashboard-growth-progress-track" cx="28" cy="28" r="24" strokeWidth="4" />
                <circle className="dashboard-growth-progress-fill" cx="28" cy="28" r="24" strokeWidth="4" strokeLinecap="round" pathLength="100" strokeDasharray={`${progressPercent} 100`} transform="rotate(-90 28 28)" />
              </svg>
            </div>
          </div>
        </div>
        <ol className="dashboard-growth-milestones" aria-label={tr('Growth milestones')} style={{ '--growth-track-fill': `${stageIndex * 25}%` } as CSSProperties}>
          {milestones.map((milestone, index) => (
            <li key={milestone.key} className="dashboard-growth-milestone" aria-current={index === stageIndex ? 'step' : undefined}>
              <span className="dashboard-growth-orb" aria-hidden="true">
                {index < 2 ? <GrowthPlantIcon variant={index === 0 ? 'seed' : 'growth'} /> : <span>{milestone.emoji}</span>}
              </span>
              <span className="tbo-caption dashboard-growth-milestone-name">{stageNames[index]}</span>
              <span className="tbo-caption dashboard-growth-milestone-range">
                ({RELATIONSHIP_STAGE_START_DAYS[index + 1] === undefined
                  ? tr('{start}+ days', { start: RELATIONSHIP_STAGE_START_DAYS[index] })
                  : tr('{start}–{end} days', { start: RELATIONSHIP_STAGE_START_DAYS[index], end: RELATIONSHIP_STAGE_START_DAYS[index + 1] - 1 })})
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
});
