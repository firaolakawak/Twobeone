import type { ReactNode } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTodaysMood, MOOD_EMOJI, type DailyMoodEntry } from '../utils/dailyMood';

interface CoupleMoodHeadingProps {
  userName: string;
  partnerName: string;
  partnerId: string;
  partnerMood: DailyMoodEntry | null;
}

export function CoupleNameHeading({ userName, partnerName, partnerMood }: { userName: string; partnerName: string; partnerMood?: ReactNode }) {
  const { t } = useLanguage();
  const userFirstName = userName.trim().split(/\s+/)[0] || t.mood.you;
  const partnerFirstName = partnerName.trim().split(/\s+/)[0] || t.mood.partner;

  return (
    <h2 className="min-w-0 break-words text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[32px]" data-couple-name>
      <span>{userFirstName}</span> &amp;{' '}
      <span className="inline-block">
        <span>{partnerFirstName}</span>
        {partnerMood && <span className="ml-1 inline-block align-middle">{partnerMood}</span>}
      </span>
    </h2>
  );
}

export function PartnerMoodEmoji({ partnerName, partnerId, partnerMood }: Omit<CoupleMoodHeadingProps, 'userName'>) {
  const { t } = useLanguage();
  const todayMood = getTodaysMood(partnerMood ? [partnerMood] : [], partnerId);
  const moodLabel = todayMood ? `${partnerName}: ${t.mood[todayMood.mood]} · ${t.common.today}` : undefined;

  if (!todayMood) return null;

  return (
    <span role="img" aria-label={moodLabel} title={moodLabel} className="inline-block shrink-0 text-[1.25em] leading-none">
      {MOOD_EMOJI[todayMood.mood]}
    </span>
  );
}

export function CoupleMoodHeading({ userName, partnerName, partnerId, partnerMood }: CoupleMoodHeadingProps) {
  return (
    <h2 className="flex flex-wrap items-center justify-center gap-x-2 text-[1.35rem] font-bold tracking-[-0.025em]">
      <span className="bg-gradient-to-r from-rose-700 via-primary-600 to-violet-700 bg-clip-text text-transparent">
        {userName} & {partnerName}
      </span>
      <PartnerMoodEmoji partnerName={partnerName} partnerId={partnerId} partnerMood={partnerMood} />
    </h2>
  );
}
