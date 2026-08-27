import { useEffect, useState } from 'react';
import { BookOpen, Clock3, Crown, HandHeart, MessageCircleQuestion, PenLine } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { engagement, type EngagementSummary } from '../utils/api';
import { formatEngagementTime, type EngagementCategory } from '../utils/engagement';

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
    <section className="relative overflow-hidden rounded-[1.75rem] border border-amber-100 bg-gradient-to-br from-white via-amber-50/35 to-rose-50/50 p-5 shadow-[0_18px_48px_-34px_rgba(180,83,9,.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_54px_-32px_rgba(180,83,9,.42)]" aria-label={labels.title}>
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200"><Crown className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-700">{labels.title}</p>
            <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">{levelLabel}</h3>
            <p className="text-xs text-slate-500">{labels.subtitle}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {([['today', summary.today], ['week', summary.week], ['month', summary.month]] as const).map(([key, period]) => (
            <div key={key} className="rounded-2xl border border-white/80 bg-white/75 px-2 py-3 text-center shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{labels[key]}</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">{formatEngagementTime(period.totalSeconds, language)}</p>
            </div>
          ))}
        </div>

        {summary.month.totalSeconds === 0 ? <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">{labels.empty}</p> : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              {categories.map(category => {
                const Icon = categoryIcons[category];
                return <div key={category} className="flex items-center gap-2"><Icon className="h-4 w-4 text-rose-500" /><span className="min-w-0 flex-1 truncate text-xs text-slate-600">{labels[category]}</span><strong className="text-xs tabular-nums text-slate-800">{formatEngagementTime(summary.week.byCategory[category], language)}</strong></div>;
              })}
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-amber-100"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-700" style={{ width: `${summary.champion.progress}%` }} /></div>
            {summary.champion.nextTargetSeconds && <p className="mt-1.5 text-right text-[10px] font-medium text-slate-500">{summary.champion.progress}% {labels.next}</p>}
          </>
        )}
      </div>
    </section>
  );
}
