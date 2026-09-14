import { ArrowRight, CalendarDays, ChevronRight, Heart } from 'lucide-react';
import { useUiCopy } from '../utils/uiTranslation';
import { dashboardFeatureMessages } from '../locales/dashboardFeatures';
import { DashboardGrowthCard } from './DashboardGrowthCard';
import scriptureLandscape from '../../assets/glass-scripture-landscape.webp';
import '../styles/dashboard-reference.css';

function OpenBook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M3.1 4.8C5.8 3.6 8.8 4 11.2 5.5v14.7c-2.4-1.5-5.4-1.9-8.1-.7V4.8Z" />
      <path d="M20.9 4.8C18.2 3.6 15.2 4 12.8 5.5v14.7c2.4-1.5 5.4-1.9 8.1-.7V4.8Z" />
    </svg>
  );
}

function PrayerHands() {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M14.1 3.2c-.9 0-1.6.8-1.6 1.8v7.3l-3.6 6c-.5.9-1.2 1.6-2 2.2l-1.5 1.2 5.5 5.5 2.6-2.3c1.4-1.3 2.1-3.1 2.1-5V5c0-1-.6-1.8-1.5-1.8Z" />
      <path d="M14.1 3.2c-.9 0-1.6.8-1.6 1.8v7.3l-3.6 6c-.5.9-1.2 1.6-2 2.2l-1.5 1.2 5.5 5.5 2.6-2.3c1.4-1.3 2.1-3.1 2.1-5V5c0-1-.6-1.8-1.5-1.8Z" transform="translate(32 0) scale(-1 1)" />
      <path d="m4.2 22.5 5.5 5.5-2 2-5.5-5.5 2-2Zm23.6 0L22.3 28l2 2 5.5-5.5-2-2Z" />
    </svg>
  );
}

interface DashboardFeatureSectionProps {
  startDate?: string;
  showGrowth: boolean;
  onBibleStudy: () => void;
  onJournal: () => void;
  onPrayer: () => void;
  onCalendar: () => void;
}

export function DashboardFeatureSection({ startDate, showGrowth, onBibleStudy, onJournal, onPrayer, onCalendar }: DashboardFeatureSectionProps) {
  const tr = useUiCopy(dashboardFeatureMessages);
  const features = [
    { id: 'bible', title: 'Bible Study', subtitle: 'Grow in His Word', icon: OpenBook, onClick: onBibleStudy },
    { id: 'journal', title: 'Couple Journal', subtitle: 'Share & Be Real', icon: Heart, onClick: onJournal },
    { id: 'prayer', title: 'Prayer Tracker', subtitle: 'Pray Together', icon: PrayerHands, onClick: onPrayer },
    { id: 'calendar', title: 'Dates & Plans', subtitle: 'Build Your Future', icon: CalendarDays, onClick: onCalendar },
  ];

  return (
    <div className="dashboard-reference-section">
      {showGrowth && <DashboardGrowthCard startDate={startDate} />}

      <div className="dashboard-feature-grid">
        {features.map(({ id, title, subtitle, icon: Icon, onClick }) => (
          <button type="button" key={id} data-feature={id} className="dashboard-feature-tile" onClick={onClick}>
            <span className="dashboard-feature-orb" aria-hidden="true"><Icon /></span>
            <span className="dashboard-feature-title tbo-action">{tr(title)}</span>
            <span className="dashboard-feature-description tbo-caption">{tr(subtitle)}</span>
            <span className="dashboard-feature-arrow" aria-hidden="true"><ChevronRight /></span>
          </button>
        ))}
      </div>

      <section className="dashboard-scripture-banner" aria-label={tr('Ecclesiastes 4:9')}>
        <img className="dashboard-scripture-landscape" src={scriptureLandscape} alt="" aria-hidden="true" width={1200} height={402} />
        <svg className="dashboard-scripture-cross" viewBox="0 0 24 32" fill="none" aria-hidden="true">
          <path d="M12 3v26M4 12h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="dashboard-scripture-copy">
          <blockquote className="tbo-label">{tr('“Two are better than one...”')}</blockquote>
          <p className="tbo-caption">{tr('Ecclesiastes 4:9')}</p>
        </div>
        <button type="button" className="dashboard-scripture-action tbo-action" onClick={onBibleStudy}>
          {tr('Read More')} <ArrowRight aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
