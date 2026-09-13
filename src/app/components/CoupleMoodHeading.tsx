import { useLanguage } from '../contexts/LanguageContext';
import { getTodaysMood, MOOD_EMOJI, type DailyMoodEntry } from '../utils/dailyMood';

interface CoupleMoodHeadingProps {
  userName: string;
  partnerName: string;
  partnerId: string;
  partnerMood: DailyMoodEntry | null;
}

export function CoupleMoodHeading({ userName, partnerName, partnerId, partnerMood }: CoupleMoodHeadingProps) {
  const { t } = useLanguage();
  const todayMood = getTodaysMood(partnerMood ? [partnerMood] : [], partnerId);
  const moodLabel = todayMood ? `${partnerName}: ${t.mood[todayMood.mood]} · ${t.common.today}` : undefined;

  return (
    <h2 className="flex flex-wrap items-center justify-center gap-x-2 text-[1.35rem] font-bold tracking-[-0.025em]">
      <span className="bg-gradient-to-r from-rose-700 via-primary-600 to-violet-700 bg-clip-text text-transparent">
        {userName} & {partnerName}
      </span>
      {todayMood && (
        <span role="img" aria-label={moodLabel} title={moodLabel} className="text-[1.6rem] leading-none">
          {MOOD_EMOJI[todayMood.mood]}
        </span>
      )}
    </h2>
  );
}
