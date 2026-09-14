import { useEffect, useState } from 'react';
import { BookOpen, Clock3, Crown, HandHeart, MessageCircleQuestion, PenLine } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { engagement, type EngagementSummary } from '../utils/api';
import { formatEngagementTime, type EngagementCategory } from '../utils/engagement';
import '../styles/dashboard-support.css';

const copy = {
  en: { title: 'TwoBeOne Champions', subtitle: 'Your intentional time together', today: 'Today', week: '7 days', month: '30 days', reading: 'Reading', answering: 'Answering', journaling: 'Journaling', praying: 'Praying', other: 'Together', starting: 'Starting Strong', growing: 'Growing Together', devoted: 'Devoted Couple', champion: 'TwoBeOne Champions', next: 'toward the next level', empty: 'Your active time will appear here as you read, answer, journal, and pray.' },
  am: { title: 'የTwoBeOne ሻምፒዮኖች', subtitle: 'በዓላማ አብራችሁ ያሳለፋችሁት ጊዜ', today: 'ዛሬ', week: '7 ቀናት', month: '30 ቀናት', reading: 'ንባብ', answering: 'መመለስ', journaling: 'ማስታወሻ', praying: 'ጸሎት', other: 'አብሮነት', starting: 'ጥሩ ጅምር', growing: 'አብሮ ማደግ', devoted: 'ታማኝ ጥንዶች', champion: 'የTwoBeOne ሻምፒዮኖች', next: 'ወደ ቀጣዩ ደረጃ', empty: 'ስታነቡ፣ ስትመልሱ፣ ስትጽፉና ስትጸልዩ ንቁ ጊዜያችሁ እዚህ ይታያል።' },
  om: { title: 'Shaampiyoonaa TwoBeOne', subtitle: 'Yeroo kaayyoodhaan waliin dabarsitan', today: 'Har’a', week: 'Guyyaa 7', month: 'Guyyaa 30', reading: 'Dubbisuu', answering: 'Deebisuu', journaling: 'Yaadannoo', praying: 'Kadhachuu', other: 'Waliin', starting: 'Jalqaba Gaarii', growing: 'Waliin Guddachuu', devoted: 'Michuu Amanamaa', champion: 'Shaampiyoonaa TwoBeOne', next: 'sadarkaa itti aanutti', empty: 'Yeroon isin dubbisaa, deebisaa, barreessaa fi kadhachaa dabarsitan asitti mul’ata.' },
} as const;

const categoryIcons: Record<EngagementCategory, typeof BookOpen> = {
  reading: BookOpen, answering: MessageCircleQuestion, journaling: PenLine, praying: HandHeart, other: Clock3,
};

export function ChampionsCard() {
  const { language } = useLanguage();
  const labels = copy[language] || copy.en;
  const [summary, setSummary] = useState<EngagementSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = () => engagement.summary().then(result => mounted && setSummary(result.summary)).catch(() => undefined);
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 5 * 60_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

  if (!summary) return null;
  const categories = (['reading', 'answering', 'journaling', 'praying'] as EngagementCategory[]);
  const levelLabel = labels[summary.champion.level];

  return (
    <section className="tbo-glass tbo-support-card tbo-champions-card relative overflow-hidden rounded-[1.75rem] p-5" aria-label={labels.title}>
      <div className="relative">
        <div className="tbo-champions-heading flex items-center gap-3">
          <span className="tbo-glass-orb flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"><Crown aria-hidden="true" className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="tbo-eyebrow tbo-support-accent">{labels.title}</p>
            <h3 className="tbo-card-title tbo-support-title">{levelLabel}</h3>
            <p className="tbo-caption tbo-support-muted">{labels.subtitle}</p>
          </div>
        </div>

        <div className="tbo-champions-periods mt-4 grid gap-2">
          {([['today', summary.today], ['week', summary.week], ['month', summary.month]] as const).map(([key, period]) => (
            <div key={key} className="tbo-glass-inset min-w-0 rounded-2xl px-2 py-3 text-center">
              <p className="tbo-eyebrow tbo-support-muted">{labels[key]}</p>
              <p className="tbo-supporting tbo-support-title mt-1 tabular-nums">{formatEngagementTime(period.totalSeconds, language)}</p>
            </div>
          ))}
        </div>

        {summary.month.totalSeconds === 0 ? <p className="tbo-caption tbo-support-muted mt-4 text-center">{labels.empty}</p> : (
          <>
            <div className="tbo-champions-categories mt-4 grid gap-x-4 gap-y-3">
              {categories.map(category => {
                const Icon = categoryIcons[category];
                return (
                  <div key={category} className="tbo-champions-category">
                    <Icon aria-hidden="true" className="tbo-support-accent h-4 w-4 shrink-0" />
                    <span className="tbo-caption tbo-support-muted min-w-0">{labels[category]}</span>
                    <strong className="tbo-caption tbo-support-title tabular-nums">{formatEngagementTime(summary.week.byCategory[category], language)}</strong>
                  </div>
                );
              })}
            </div>
            <div className="tbo-support-progress tbo-champions-progress mt-4"><div className="tbo-support-progress-fill" style={{ width: `${summary.champion.progress}%` }} /></div>
            {summary.champion.nextTargetSeconds && <p className="tbo-caption tbo-support-muted mt-1.5 text-right">{summary.champion.progress}% {labels.next}</p>}
          </>
        )}
      </div>
    </section>
  );
}
