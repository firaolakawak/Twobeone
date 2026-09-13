import { useUiCopy } from '../utils/uiTranslation';
import { BrandLoader } from './BrandLoader';
import { coupleUiMessages } from '../locales/coupleUi';
import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import {
  BookOpen,
  PenLine,
  MessageCircleHeart,
  Calendar,
  TrendingUp,
  Sparkles,
  Users,
  Award,
  Target,
  ArrowRight,
  Clock,
  CheckCircle,
  Plus,
  Settings,
  Share2,
  BookHeart,
  HandHeart,
  Brain,
  RefreshCw,
  Hammer,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ComprehensiveBibleReader } from './ComprehensiveBibleReader';
import { LearningModulesCard } from './LearningModulesCard';
import { PushNotificationSetup } from './PushNotificationSetup';
import { DistanceConnector } from './DistanceConnector';
import { DailyMoodCheckIn } from './DailyMoodCheckIn';
import { CoupleNameHeading, PartnerMoodEmoji } from './CoupleMoodHeading';
import { RelationshipSummary, RelationshipGrowth } from './RelationshipJourney';
import { CoupleAvatarStack } from './CoupleAvatarStack';
import { useDailyMoods } from '../hooks/useDailyMoods';
import { projectId } from '../utils/supabase/info';
import { sendNotification } from '../utils/notifications';
import { toast } from 'sonner';
import type { User, JournalEntry, PrayerRequest, Progress as ProgressType, QuestionResponse } from '../types';
import { moods as moodsApi, questions as questionsApi } from '../utils/api';
import { fetchAmharicChapter, getAmharicBookName } from '../utils/amharicBibleApi';
import { ChampionsCard } from './ChampionsCard';
import { coupleCalendarCopy } from '../data/couple-calendar';

export interface CoupleDashboardProps {
  profile?: User & {
    notificationSettings?: { pushNotifications?: boolean };
  };
  partner?: User;
  journalEntries: JournalEntry[];
  prayers: PrayerRequest[];
  progress?: ProgressType;
  responses: { user: QuestionResponse[]; partner: QuestionResponse[] };
  onNavigate?: (tab: string) => void;
  onScreenNavigate?: (screen: string) => void;
  accessToken?: string;
  devotionalStreak?: number;
  devotionalCompletedCount?: number;
  userOnline?: boolean;
  partnerOnline?: boolean;
  devotionals?: DashboardDevotional[];
  onOpenDevotional?: (id: string) => void;
  onStartQuestion?: (category?: string) => void;
}

interface DashboardDevotional {
  id: string;
  title?: string;
  reflection?: string;
  body?: string;
  verse?: string;
  verseText?: string;
  language?: string;
}

interface DashboardQuestion {
  id: string;
  title?: string;
  question?: string;
  category?: string;
  prompts?: Array<{ text?: string }>;
}

export type HomeSpotlightKind = 'devotion' | 'question' | 'journal';

const QA_CATEGORY_IDS = new Set([
  'daily-life', 'intimacy', 'love-balance', 'dream-wedding', 'travel',
  'boundaries', 'trust', 'kids-future', 'finance', 'family', 'bible',
]);

export function pickRandomHomeSpotlight(
  previous?: HomeSpotlightKind,
  random: () => number = Math.random,
): HomeSpotlightKind {
  const allKinds: HomeSpotlightKind[] = ['devotion', 'question', 'journal'];
  const choices = previous ? allKinds.filter(kind => kind !== previous) : allKinds;
  return choices[Math.floor(random() * choices.length)] || 'devotion';
}

export { RELATIONSHIP_STAGE_START_DAYS, getElapsedRelationshipTime, getRelationshipStageProgress } from '../utils/relationshipJourney';

interface CoupleData {
  relationshipStartDate?: string;
  couplePicture?: string;
  location?: string;
  milestone?: string;
}

interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
  amharicText?: string;
  amharicReference?: string;
}

interface Notification {
  id: string;
  userId: string;
  type: 'verse_shared' | 'journal_shared' | 'milestone_added';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export function CoupleDashboard({
  profile,
  partner,
  journalEntries,
  prayers,
  progress,
  responses,
  onNavigate,
  onScreenNavigate,
  accessToken,
  devotionalStreak,
  devotionalCompletedCount = 0,
  userOnline,
  partnerOnline,
  devotionals = [],
  onOpenDevotional,
  onStartQuestion,
}: CoupleDashboardProps) {
  const tr = useUiCopy(coupleUiMessages);
  const { t, language } = useLanguage();
  const calendarCopy = coupleCalendarCopy[language];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [coupleData, setCoupleData] = useState<CoupleData>({});
  const [dailyVerse, setDailyVerse] = useState<BibleVerse | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);
  const [isBibleReaderOpen, setIsBibleReaderOpen] = useState(false);
  const [verseLanguage, setVerseLanguage] = useState<'en' | 'am'>(() => language === 'am' ? 'am' : 'en');
  const { userMood, partnerMood, loaded: moodsLoaded, saveMood } = useDailyMoods(partner ? profile?.id : undefined, partner?.id);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [spotlightQuestions, setSpotlightQuestions] = useState<DashboardQuestion[]>([]);
  const [spotlightKind, setSpotlightKind] = useState<HomeSpotlightKind>(() => pickRandomHomeSpotlight());
  const [spotlightShuffle, setSpotlightShuffle] = useState(0);

  // Keep verse language in sync with the app language switcher
  useEffect(() => {
    setVerseLanguage(language === 'am' ? 'am' : 'en');
  }, [language]);

  const relationshipStart = profile?.relationshipStart || coupleData.relationshipStartDate || profile?.createdAt;

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch total questions count once on mount — uses lightweight /questions/count endpoint
  useEffect(() => {
    if (!profile?.id) return;
    questionsApi.count()
      .then(({ count }) => setTotalQuestionsCount(count))
      .catch(() => {
        // Non-critical — silently fall back to a sensible default
        setTotalQuestionsCount(1000);
      });
  }, [profile?.id]);

  useEffect(() => {
    let cancelled = false;
    questionsApi.list(undefined, language)
      .then(data => {
        if (!cancelled) setSpotlightQuestions(data.questions || []);
      })
      .catch(() => {
        if (!cancelled) setSpotlightQuestions([]);
      });
    return () => { cancelled = true; };
  }, [language]);

  useEffect(() => {
    // Fetch daily Bible verse from Bible API
    const fetchDailyVerse = async () => {
      try {
        // 365-verse pool spanning all 66 books of the Bible (OT + NT)
        const verses = [
          // Genesis – Deuteronomy
          'genesis 1:1','genesis 1:27','genesis 2:24','genesis 12:1-2','genesis 15:6',
          'genesis 28:15','genesis 50:20','exodus 14:14','exodus 20:1-3','exodus 33:14',
          'leviticus 19:18','numbers 6:24-26','deuteronomy 6:5','deuteronomy 7:9',
          'deuteronomy 31:6','deuteronomy 31:8',
          // Joshua – Esther
          'joshua 1:8','joshua 1:9','joshua 24:15','judges 6:12','ruth 1:16',
          '1 samuel 16:7','2 samuel 22:3','1 kings 3:12','1 chronicles 16:11',
          '2 chronicles 7:14','ezra 8:22','nehemiah 8:10','esther 4:14',
          // Job – Song of Solomon
          'job 19:25','job 23:10','job 42:2','psalm 1:1-2','psalm 4:8','psalm 9:1',
          'psalm 16:8','psalm 18:2','psalm 19:1','psalm 23:1','psalm 23:4','psalm 27:1',
          'psalm 27:4','psalm 28:7','psalm 29:11','psalm 31:3','psalm 32:8','psalm 34:8',
          'psalm 34:18','psalm 37:4','psalm 37:5','psalm 40:1-3','psalm 42:1','psalm 46:1',
          'psalm 46:10','psalm 51:10','psalm 55:22','psalm 56:3','psalm 62:5','psalm 63:1',
          'psalm 63:3','psalm 71:5','psalm 73:26','psalm 84:2','psalm 86:5','psalm 90:2',
          'psalm 91:1-2','psalm 91:4','psalm 94:19','psalm 100:4-5','psalm 103:1-2',
          'psalm 103:12','psalm 107:1','psalm 111:10','psalm 118:14','psalm 118:24',
          'psalm 119:9','psalm 119:11','psalm 119:105','psalm 119:114','psalm 121:1-2',
          'psalm 121:7-8','psalm 127:1','psalm 128:1','psalm 133:1','psalm 136:1',
          'psalm 139:14','psalm 139:23-24','psalm 143:10','psalm 145:18','psalm 147:3',
          'proverbs 1:7','proverbs 2:6','proverbs 3:5-6','proverbs 3:9-10','proverbs 4:7',
          'proverbs 4:23','proverbs 10:12','proverbs 12:15','proverbs 13:20','proverbs 14:29',
          'proverbs 15:1','proverbs 16:3','proverbs 16:9','proverbs 17:17','proverbs 18:10',
          'proverbs 18:24','proverbs 19:20','proverbs 22:6','proverbs 27:17','proverbs 28:13',
          'proverbs 31:25','ecclesiastes 3:1','ecclesiastes 3:11','ecclesiastes 4:9-10',
          'song of solomon 2:16','song of solomon 8:6-7',
          // Isaiah – Daniel
          'isaiah 9:6','isaiah 26:3','isaiah 30:15','isaiah 40:8','isaiah 40:29',
          'isaiah 40:31','isaiah 41:10','isaiah 43:1-2','isaiah 43:19','isaiah 46:4',
          'isaiah 48:17','isaiah 53:5','isaiah 54:10','isaiah 55:8-9','isaiah 55:10-11',
          'isaiah 58:11','isaiah 61:1','isaiah 64:8','jeremiah 17:7-8','jeremiah 29:11',
          'jeremiah 29:13','jeremiah 31:3','jeremiah 33:3','lamentations 3:22-23',
          'lamentations 3:25','ezekiel 36:26','daniel 2:20','daniel 6:10',
          // Hosea – Malachi
          'hosea 2:19-20','hosea 6:6','joel 2:25','joel 2:28','amos 5:24',
          'micah 6:8','micah 7:18','nahum 1:7','habakkuk 2:4','habakkuk 3:19',
          'zephaniah 3:17','haggai 2:4','zechariah 4:6','malachi 3:10',
          // Matthew – John
          'matthew 5:3','matthew 5:6','matthew 5:8','matthew 5:9','matthew 5:14-15',
          'matthew 5:44','matthew 6:9-10','matthew 6:20-21','matthew 6:33','matthew 7:7',
          'matthew 7:12','matthew 11:28-30','matthew 17:20','matthew 18:20','matthew 19:26',
          'matthew 22:37-39','matthew 25:40','matthew 28:19-20','mark 10:27','mark 10:45',
          'mark 11:24','mark 12:30-31','mark 16:15','luke 1:37','luke 6:38','luke 10:27',
          'luke 11:9','luke 15:7','luke 17:21','luke 18:27','john 1:1','john 1:14',
          'john 3:16','john 3:17','john 4:14','john 6:35','john 8:12','john 8:32',
          'john 10:10','john 11:25','john 13:34-35','john 14:1-2','john 14:6',
          'john 14:13','john 14:27','john 15:5','john 15:9-10','john 15:12-13',
          'john 16:33','john 17:17',
          // Acts – Galatians
          'acts 1:8','acts 2:38','acts 4:12','acts 5:29','acts 16:31','acts 17:28',
          'romans 1:16','romans 3:23','romans 5:1','romans 5:3-5','romans 5:8',
          'romans 6:23','romans 8:1','romans 8:11','romans 8:18','romans 8:26',
          'romans 8:28','romans 8:37','romans 8:38-39','romans 10:9-10','romans 12:1-2',
          'romans 12:10','romans 12:12','romans 15:4','romans 15:13','1 corinthians 1:18',
          '1 corinthians 2:9','1 corinthians 10:13','1 corinthians 13:4-8','1 corinthians 15:10',
          '1 corinthians 15:55','1 corinthians 16:13-14','2 corinthians 1:3-4','2 corinthians 4:17',
          '2 corinthians 5:7','2 corinthians 5:17','2 corinthians 9:8','2 corinthians 12:9',
          'galatians 2:20','galatians 5:22-23','galatians 6:2','galatians 6:9',
          // Ephesians – Colossians
          'ephesians 1:3','ephesians 2:8-9','ephesians 2:10','ephesians 3:17-19',
          'ephesians 3:20','ephesians 4:2-3','ephesians 4:29','ephesians 4:32',
          'ephesians 5:25','ephesians 6:10-11','philippians 1:6','philippians 2:3-4',
          'philippians 2:13','philippians 3:13-14','philippians 4:6-7','philippians 4:8',
          'philippians 4:11','philippians 4:13','philippians 4:19','colossians 1:17',
          'colossians 3:12-13','colossians 3:15','colossians 3:17','colossians 3:23',
          // 1 Thessalonians – Hebrews
          '1 thessalonians 5:16-18','1 thessalonians 5:23','2 thessalonians 3:3',
          '1 timothy 4:12','1 timothy 6:6','1 timothy 6:12','2 timothy 1:7',
          '2 timothy 2:15','2 timothy 3:16-17','titus 3:5','hebrews 4:12',
          'hebrews 4:16','hebrews 10:23','hebrews 11:1','hebrews 11:6','hebrews 12:1-2',
          'hebrews 13:5','hebrews 13:8',
          // James – Revelation
          'james 1:2-3','james 1:5','james 1:17','james 1:19','james 1:22',
          'james 4:7','james 4:8','james 5:16','1 peter 1:3-4','1 peter 2:9',
          '1 peter 3:15','1 peter 4:8','1 peter 5:7','1 peter 5:8','2 peter 1:3',
          '2 peter 3:9','1 john 1:7','1 john 1:9','1 john 4:7-8','1 john 4:10',
          '1 john 4:18','1 john 4:19','1 john 5:14','jude 1:24-25',
          'revelation 1:8','revelation 3:20','revelation 21:4','revelation 21:5',
          'revelation 22:20'
        ];

        const now = new Date();
        const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
        // Spread across 2 years so consecutive years don't repeat identically
        const seed = (now.getFullYear() * 1000 + dayOfYear) % verses.length;
        const selectedVerse = verses[seed];

        const response = await fetch(`https://bible-api.com/${selectedVerse}?translation=kjv`);
        if (!response.ok) throw new Error('Failed to fetch verse');
        const data = await response.json();

        const engText = data.text.replace(/\n/g, ' ').trim();
        const engRef: string = data.reference;

        // Fetch the same passage from the Amharic XML Bible
        let amharicText = '';
        let amharicReference = '';
        try {
          const firstVerse = data.verses?.[0];
          const bookName: string = firstVerse?.book_name ?? '';
          const chapterNum: number = firstVerse?.chapter ?? 0;
          if (bookName && chapterNum) {
            const verseNumbers: number[] = data.verses.map((v: any) => v.verse as number);
            const amChapter = await fetchAmharicChapter(bookName, chapterNum);
            const parts = verseNumbers
              .map((vn) => amChapter.verses.find((v) => v.number === vn)?.text ?? '')
              .filter(Boolean);
            amharicText = parts.join(' ');
            const amBook = getAmharicBookName(bookName);
            const range = verseNumbers.length > 1
              ? `${verseNumbers[0]}-${verseNumbers[verseNumbers.length - 1]}`
              : `${verseNumbers[0]}`;
            amharicReference = `${amBook} ${chapterNum}:${range}`;
          }
        } catch (amErr) {
          console.warn('[DailyVerse] Amharic fetch failed, will show English only:', amErr);
        }

        setDailyVerse({
          reference: engRef,
          text: engText,
          translation: data.translation_name,
          amharicText: amharicText || undefined,
          amharicReference: amharicReference || undefined,
        });
      } catch (error) {
        console.error('Error fetching daily verse:', error);
        // Fallback verse
        setDailyVerse({
          reference: 'John 3:16',
          text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
          translation: 'KJV'
        });
      } finally {
        setIsLoadingVerse(false);
      }
    };

    fetchDailyVerse();
  }, []);

  // Auto-check for weekly mood report (only if user has a partner)
  useEffect(() => {
    /** Returns "YYYY-Www" ISO week string so the key is unambiguous. */
    const isoWeekKey = (d: Date): string => {
      const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = tmp.getUTCDay() || 7; // Mon=1 … Sun=7
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum); // nearest Thursday
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const week = Math.ceil(
        ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
      );
      return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
    };

    const checkWeeklyReport = async () => {
      if (!profile?.id || !partner?.id) return;

      try {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

        // Only trigger on Saturdays
        if (dayOfWeek !== 6) return;

        // Use an ISO-week key so it can never collide across weeks
        const weekKey = isoWeekKey(now);
        const storageKey = `lastMoodReport:${profile.id}:${weekKey}`;

        if (localStorage.getItem(storageKey)) {
          console.log('[WeeklyMoodReport] Report already sent this week:', weekKey);
          return;
        }

        console.log('[WeeklyMoodReport] 🎯 Saturday — generating weekly mood report for', weekKey);

        await moodsApi.generateWeeklyReport();

        // Mark this ISO week as done so no duplicate fires later in the day
        localStorage.setItem(storageKey, '1');

        console.log('[WeeklyMoodReport] ✅ Report generated for', weekKey);
      } catch (error: any) {
        console.log('[WeeklyMoodReport] ⚠️ Could not auto-generate report:', error.message);
      }
    };

    // Check on mount then every 6 hours (to catch Saturday if the app was already open)
    checkWeeklyReport();
    const interval = setInterval(checkWeeklyReport, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [profile?.id, partner?.id]);

  // Calculate stats
  const sharedJournalEntries = journalEntries.filter(e => e.isShared).length;
  const totalPrayers = prayers.length;
  const answeredPrayers = prayers.filter(p => p.isAnswered).length;

  // Count actual unique questions answered from responses
  // Each response has a questionId, count unique base question IDs (before :prompt: suffix)
  const uniqueQuestions = new Set(
    responses.user.map(r => r.questionId.split(':prompt:')[0])
  );
  const questionsAnswered = uniqueQuestions.size;

  // Debug logging
  console.log('[CoupleDashboard] Question stats:', {
    responsesUserLength: responses.user.length,
    responsesPartnerLength: responses.partner.length,
    uniqueQuestions: Array.from(uniqueQuestions),
    questionsAnswered,
    totalQuestionsCount,
    sampleResponse: responses.user[0]
  });

  const devotionalStreakValue = devotionalStreak || 0;

  const spotlight = useMemo(() => {
    const choose = <T,>(items: T[]): T | undefined => items.length
      ? items[Math.floor(Math.random() * items.length)]
      : undefined;

    if (spotlightKind === 'devotion') {
      const languageDevotionals = devotionals.filter(devotional =>
        language === 'en'
          ? !devotional.language || devotional.language === 'en'
          : devotional.language === language,
      );
      const devotional = choose(languageDevotionals);
      return {
        kind: 'devotion' as const,
        itemId: devotional?.id,
        category: undefined,
        eyebrow: tr("A quiet moment"),
        title: devotional?.title || tr("A devotion for the two of you"),
        description: devotional?.reflection || devotional?.body || devotional?.verse || devotional?.verseText || tr("Pause together, reflect on Scripture, and carry one truth into your day."),
        actionLabel: tr("Read devotion"),
        icon: BookOpen,
        iconClass: 'bg-amber-100 text-amber-700',
        surfaceClass: 'from-amber-50 via-white to-orange-50/80 border-amber-100',
        accentClass: 'text-amber-800',
      };
    }

    if (spotlightKind === 'question') {
      const question = choose(spotlightQuestions);
      return {
        kind: 'question' as const,
        itemId: question?.id,
        category: question?.category && QA_CATEGORY_IDS.has(question.category) ? question.category : undefined,
        eyebrow: tr("Talk about this"),
        title: question?.title || question?.question || question?.prompts?.[0]?.text || tr("What would help you feel more loved this week?"),
        description: tr("Take a few honest minutes to answer separately, then discover where your hearts meet."),
        actionLabel: tr("Start Q&A"),
        icon: MessageCircleHeart,
        iconClass: 'bg-primary-100 text-primary-700',
        surfaceClass: 'from-primary-50 via-white to-rose-50/80 border-primary-100',
        accentClass: 'text-primary-700',
      };
    }

    const entry = choose(journalEntries);
    return {
      kind: 'journal' as const,
      itemId: entry?.id,
      category: undefined,
      eyebrow: entry ? tr("From your story") : tr("Make space for your story"),
      title: entry?.title || (entry ? tr("A journal memory worth revisiting") : tr("Capture a moment you want to remember")),
      description: entry?.content || tr("Write down what is happening in your relationship today—small moments become a shared story."),
      actionLabel: entry ? tr("Read journal") : tr("Open journal"),
      icon: PenLine,
      iconClass: 'bg-sky-100 text-sky-700',
      surfaceClass: 'from-sky-50 via-white to-cyan-50/80 border-sky-100',
      accentClass: 'text-sky-800',
    };
  }, [devotionals, journalEntries, language, spotlightKind, spotlightQuestions, spotlightShuffle, tr]);

  const openSpotlight = () => {
    if (spotlight.kind === 'devotion') {
      if (spotlight.itemId && onOpenDevotional) onOpenDevotional(spotlight.itemId);
      else onNavigate?.('devotions');
      return;
    }
    if (spotlight.kind === 'question') {
      if (onStartQuestion) onStartQuestion(spotlight.category);
      else onScreenNavigate?.('category-selection');
      return;
    }
    onNavigate?.('journal');
  };

  const shuffleSpotlight = () => {
    setSpotlightKind(current => pickRandomHomeSpotlight(current));
    setSpotlightShuffle(current => current + 1);
  };
  const SpotlightIcon = spotlight.icon;

  return (
    <div className="couple-dashboard">
      {/* Page-level ambient radial glow */}
      <div className="pointer-events-none absolute -top-8 left-0 right-0 overflow-hidden" style={{ height: 260, zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 480, height: 260,
          background: 'radial-gradient(ellipse at top, rgba(244,63,94,0.10) 0%, rgba(139,92,246,0.06) 45%, transparent 72%)',
          filter: 'blur(2px)',
        }} />
      </div>

      {/* Couple profile and shared journey */}
      <Card className="relative overflow-hidden border-x-0 border-rose-100/80 dark:border-rose-900/30 bg-card pt-4" style={{ zIndex: 1, borderRadius: '0 0 1.75rem 1.75rem' }} data-couple-journey>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-50/70 via-card to-violet-50/40 dark:from-rose-950/20 dark:to-violet-950/20" />
        <div className="pointer-events-none absolute -left-20 -top-28 h-64 w-64 rounded-full bg-rose-200/20 dark:bg-rose-500/5 blur-3xl" />
        {coupleData.couplePicture && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <img src={coupleData.couplePicture} alt="" className="h-full w-full object-cover opacity-10 blur-sm" />
          </div>
        )}

        <CardContent className="couple-hero-content relative px-4 pb-5 pt-6 sm:px-6 sm:pb-6">
          {partner && profile?.id && accessToken ? (
            <DistanceConnector
              embedded
              userId={profile.id}
              userName={profile.name || t.mood.you}
              userAvatar={profile.profilePicture}
              partnerId={partner.id}
              partnerName={partner.name || t.mood.partner}
              partnerAvatar={partner.profilePicture}
              accessToken={accessToken}
              userOnline={userOnline}
              partnerOnline={partnerOnline}
              partnerMood={<PartnerMoodEmoji partnerName={partner.name || t.mood.partner} partnerId={partner.id} partnerMood={partnerMood} />}
              summaryContent={(distanceKm) => <RelationshipSummary startDate={relationshipStart} distanceKm={distanceKm} />}
            />
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 sm:gap-6">
                <CoupleNameHeading
                  userName={profile?.name || t.mood.you}
                  partnerName={partner?.name || t.mood.partner}
                  partnerMood={partner && <PartnerMoodEmoji partnerName={partner.name || t.mood.partner} partnerId={partner.id} partnerMood={partnerMood} />}
                />
                <CoupleAvatarStack
                  userName={profile?.name || t.mood.you}
                  userAvatar={profile?.profilePicture}
                  userOnline={userOnline}
                  partnerName={partner?.name}
                  partnerAvatar={partner?.profilePicture}
                  partnerOnline={partnerOnline}
                />
              </div>
              {partner && <RelationshipSummary startDate={relationshipStart} />}
            </>
          )}

          {partner ? (
            <>
              {profile?.id && (
                <DailyMoodCheckIn
                  showControls={false}
                  userId={profile.id}
                  userName={profile.name || t.mood.you}
                  partnerName={partner.name || t.mood.partner}
                  mood={userMood?.mood || null}
                  loaded={moodsLoaded}
                  onSave={async (mood) => {
                    await saveMood(mood);
                    toast.success(t.mood.moodSaved);
                  }}
                />
              )}
              <div className="mt-4">
                <RelationshipGrowth startDate={relationshipStart} />
              </div>
            </>
          ) : (
            <div className="mt-5 text-center">
              <p className="tbo-supporting mb-3 text-muted-foreground">{t.dashboard.connectWithPartner}</p>
              <Button size="sm" variant="outline" onClick={() => onNavigate?.('profile')} className="tbo-action bg-card/80 backdrop-blur-sm">
                <Users className="mr-2 h-4 w-4" />

                {tr("Add Partner")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Randomized next step — devotion, conversation, or journal */}
      <section className={`relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br p-5 ${spotlight.surfaceClass}`} aria-labelledby="home-spotlight-title">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/70 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${spotlight.iconClass}`}>
                <SpotlightIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className={`tbo-eyebrow ${spotlight.accentClass}`}>{tr("For you today")}</p>
                <p className="tbo-caption mt-0.5 text-muted-foreground">{spotlight.eyebrow}</p>
              </div>
            </div>
            <button type="button" onClick={shuffleSpotlight} aria-label={tr("Show another suggestion")} title={tr("Show another")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/90 bg-white/70 text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-95">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <h2 id="home-spotlight-title" className="tbo-section-title mt-5 text-foreground">{spotlight.title}</h2>
          <p className="tbo-supporting mt-2 line-clamp-3 text-muted-foreground">{spotlight.description}</p>

          <button type="button" onClick={openSpotlight} className="tbo-action group mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-background shadow-[0_10px_24px_rgba(30,25,28,0.16)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(30,25,28,0.20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 active:scale-[0.985] motion-reduce:transform-none sm:w-auto">
            {spotlight.actionLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Couple Calendar — shared plans automatically carried into prayer */}
      <button
        type="button"
        onClick={() => onScreenNavigate?.('couple-calendar')}
        className="group relative w-full overflow-hidden rounded-[1.75rem] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-violet-50 p-5 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      >
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-rose-600 shadow-sm ring-1 ring-rose-100">
            <Calendar className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="tbo-eyebrow block text-rose-600">{calendarCopy.eyebrow}</span>
            <span className="tbo-card-title mt-1 block text-slate-950">{calendarCopy.calendarCta}</span>
            <span className="tbo-supporting mt-0.5 block text-slate-500">{calendarCopy.calendarCtaHint}</span>
          </span>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-white transition-transform group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </button>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: tr("Devotionals Read"),
            value: devotionalCompletedCount,
            sub: tr('{count} day streak', { count: devotionalStreakValue }),
            icon: Calendar,
            onClick: () => onNavigate?.('devotions'),
            surface: 'border-rose-100 bg-gradient-to-br from-white to-rose-50/70',
            iconClass: 'bg-rose-100 text-rose-600', barClass: 'from-rose-400 to-pink-500', labelClass: 'text-rose-700',
          },
          {
            label: t.dashboard.journalEntries,
            value: sharedJournalEntries,
            sub: t.dashboard.shared,
            icon: BookHeart,
            onClick: () => onNavigate?.('journal'),
            surface: 'border-sky-100 bg-gradient-to-br from-white to-sky-50/70',
            iconClass: 'bg-sky-100 text-sky-600', barClass: 'from-sky-400 to-cyan-500', labelClass: 'text-sky-700',
          },
          {
            label: t.dashboard.prayers,
            value: `${answeredPrayers}/${totalPrayers}`,
            sub: t.dashboard.answered,
            icon: HandHeart,
            onClick: () => onNavigate?.('prayer'),
            surface: 'border-violet-100 bg-gradient-to-br from-white to-violet-50/70',
            iconClass: 'bg-violet-100 text-violet-600', barClass: 'from-violet-400 to-purple-500', labelClass: 'text-violet-700',
          },
          {
            label: t.dashboard.questions,
            value: `${questionsAnswered}/${totalQuestionsCount}`,
            sub: t.dashboard.answered,
            icon: MessageCircleHeart,
            onClick: () => onScreenNavigate?.('category-selection'),
            surface: 'border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70',
            iconClass: 'bg-emerald-100 text-emerald-600', barClass: 'from-emerald-400 to-green-500', labelClass: 'text-emerald-700',
          },
        ].map(({ label, value, sub, icon: Icon, onClick, surface, iconClass, barClass, labelClass }) => (
          <button
            key={label}
            onClick={onClick}
            className={`group rounded-[1.5rem] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] ${surface}`}
          >
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0 flex-1 break-words space-y-0.5">
                <p className={`tbo-eyebrow ${labelClass}`}>{label}</p>
                <p className="mt-2 text-2xl font-bold leading-none tracking-tight text-slate-950 sm:text-3xl">{value}</p>
                <p className="tbo-caption mt-1 text-slate-400">{sub}</p>
              </div>
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-transform group-hover:scale-105 ${iconClass}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/90"><div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${barClass}`} /></div>
          </button>
        ))}
      </div>

      {/* Daily Bible Verse */}
      <Card 
        className="cursor-pointer overflow-hidden rounded-[1.75rem] border-amber-100 bg-gradient-to-br from-white via-amber-50/35 to-rose-50/40 transition-all hover:-translate-y-0.5"
        onClick={() => setIsBibleReaderOpen(true)}
      >
        <CardHeader className="p-5 pb-3">
          <CardTitle className="tbo-card-title flex items-center gap-3 text-slate-950">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100 text-amber-700"><BookOpen className="h-5 w-5" /></span>

            {tr("Daily Verse")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {isLoadingVerse ? (
            <BrandLoader className="py-4" />
          ) : dailyVerse ? (
            <div className="space-y-3">
              {/* Language toggle — borderless floating pill */}
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  background: 'var(--neutral-100)',
                  borderRadius: 'var(--radius-full)',
                  padding: '3px',
                  gap: '2px',
                  width: 'fit-content',
                }}
              >
                {(['en', 'am'] as const).map(lang => (
                  <button className="tbo-action"
                    key={lang}
                    onClick={() => setVerseLanguage(lang)}
                    style={{
                      background: verseLanguage === lang ? 'var(--card)' : 'transparent',
                      color: verseLanguage === lang ? 'var(--foreground)' : 'var(--muted-foreground)',
                      borderRadius: 'var(--radius-full)',

                      padding: '4px 12px',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.18s ease',
                      boxShadow: verseLanguage === lang ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {lang === 'en' ? 'English' : 'አማርኛ'}
                  </button>
                ))}
              </div>

              {language === 'om' && <p className="tbo-caption text-muted-foreground">{tr('This reading is not available in the selected language yet.')}</p>}
              {verseLanguage === 'am' && dailyVerse.amharicText ? (
                <>
                  <blockquote lang="am" className="rounded-2xl border border-white bg-white/80 p-4 text-sm leading-8 text-slate-700">
                    "{dailyVerse.amharicText}"
                  </blockquote>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)' }}>{dailyVerse.amharicReference}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>አማርኛ መጽሐፍ ቅዱስ</span>
                  </div>
                </>
              ) : (
                <>
                  <blockquote lang="en" className="rounded-2xl border border-white bg-white/80 p-4 text-sm italic leading-7 text-slate-700">
                    "{dailyVerse.text}"
                  </blockquote>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)' }}>{dailyVerse.reference}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>{dailyVerse.translation}</span>
                  </div>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                className="tbo-action h-11 w-full rounded-xl border-amber-200 bg-white/80 text-amber-800 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBibleReaderOpen(true);
                }}
              >
                <BookOpen className="w-4 h-4 mr-2" />

                {tr("Read Full Chapter")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.dashboard.dailyVerse}</p>
          )}
        </CardContent>
      </Card>

      {/* Bible Reader Dialog */}
      {dailyVerse && (
        <ComprehensiveBibleReader
          isOpen={isBibleReaderOpen}
          onClose={() => setIsBibleReaderOpen(false)}
          reference={dailyVerse.reference}
          verse={dailyVerse.text}
          partnerName={partner?.name}
          onSaveHighlight={async (data) => {
            try {
              const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/highlight`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                  },
                  body: JSON.stringify(data)
                }
              );

              if (!response.ok) {
                throw new Error(tr("Failed to save highlight"));
              }
            } catch (error) {
              console.error('Error saving highlight:', error);
              throw error;
            }
          }}
          onShareWithPartner={async (data) => {
            try {
              const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/share-verse`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                  },
                  body: JSON.stringify(data)
                }
              );

              if (!response.ok) {
                throw new Error(tr("Failed to share verse"));
              }
            } catch (error) {
              console.error('Error sharing verse:', error);
              throw error;
            }
          }}
        />
      )}

      {/* Journey Progress */}
      {partner && (
        <Card className="cursor-pointer overflow-hidden rounded-[1.75rem] border-violet-100 bg-gradient-to-br from-white via-white to-violet-50/45 transition-all hover:-translate-y-0.5" onClick={() => onNavigate?.('devotions')}>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="tbo-card-title flex items-center gap-3 text-slate-950">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 text-violet-600"><TrendingUp className="h-5 w-5" /></span>
              {t.dashboard.yourJourneyTogether}
            </CardTitle>
            <CardDescription className="tbo-supporting">{t.dashboard.buildingFoundation}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-5 pb-5">
            {/* Devotionals Progress */}
            <div 
              className="cursor-pointer space-y-2 rounded-2xl border border-white bg-white/80 p-3 transition-all hover:border-rose-100 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.('devotions');
              }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tr("Daily Devotionals")}</span>
                <span className="font-medium">
                  {devotionalCompletedCount} {tr('read ·')} {tr('{count} day streak', { count: devotionalStreakValue })}
                </span>
              </div>
              <Progress value={Math.min((devotionalStreakValue / 30) * 100, 100)} className="h-2" />
            </div>

            {/* Questions Progress */}
            <div 
              className="cursor-pointer space-y-2 rounded-2xl border border-white bg-white/80 p-3 transition-all hover:border-emerald-100 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                onScreenNavigate?.('category-selection');
              }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tr("Know Each Other Questions")}</span>
                <span className="font-medium">{questionsAnswered}/{totalQuestionsCount}</span>
              </div>
              <Progress value={(questionsAnswered / totalQuestionsCount) * 100} className="h-2" />
            </div>

            {/* Journal Progress */}
            <div 
              className="cursor-pointer space-y-2 rounded-2xl border border-white bg-white/80 p-3 transition-all hover:border-sky-100 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.('journal');
              }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tr("Shared Journal Entries")}</span>
                <span className="font-medium">{sharedJournalEntries}/50</span>
              </div>
              <Progress value={Math.min((sharedJournalEntries / 50) * 100, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {profile?.id && accessToken && (
        <PushNotificationSetup
          userId={profile.id}
          accessToken={accessToken}
          notificationsEnabled={profile.notificationSettings?.pushNotifications !== false}
          reminderOnly
        />
      )}

      {/* Character Development House */}
      <Card
        className="group cursor-pointer overflow-hidden rounded-[1.75rem] border-amber-200 bg-gradient-to-br from-[#fffdf7] via-amber-50/55 to-rose-50/45 transition-all hover:-translate-y-0.5"
        onClick={() => onScreenNavigate?.('character-house')}
      >
        <CardContent className="flex items-center gap-4 p-5">
          <div className="relative grid h-20 w-24 shrink-0 place-items-end overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-b from-sky-100 to-emerald-50 p-3">
            <div className="absolute bottom-2 h-8 w-16 border-2 border-stone-500 bg-stone-200 shadow-sm" />
            <div className="absolute bottom-10 h-10 w-10 rotate-45 border-l-2 border-t-2 border-rose-900/30 bg-gradient-to-br from-rose-600 to-amber-700" />
            <div className="absolute bottom-2 left-1/2 h-6 w-3 -translate-x-1/2 rounded-t bg-amber-900" />
            <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-amber-500 text-white shadow"><Hammer className="h-3.5 w-3.5" /></span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="tbo-eyebrow text-amber-700">{tr("365-day character journey")}</p>
            <h3 className="tbo-card-title mt-1 text-stone-950">{tr("Build the House That Honors God")}</h3>
            <p className="tbo-caption mt-1 text-stone-600">{tr("Choose your dream home, design its rooms, and place one character-building block each day.")}</p>
            <span className="tbo-caption mt-3 inline-flex items-center text-rose-700">{tr("Open house builder")} <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
          </div>
        </CardContent>
      </Card>

      {/* Learning Modules */}
      <LearningModulesCard 
        onViewAll={() => onScreenNavigate?.('guidance')}
        accessToken={accessToken}
      />

      {/* Scripture Memory */}
      <Card className="overflow-hidden rounded-[1.75rem] border-rose-100 bg-gradient-to-br from-white via-rose-50/35 to-violet-50/45 transition-all hover:-translate-y-0.5">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-100 text-rose-600"><Brain className="h-5 w-5" /></span>
              <CardTitle className="tbo-card-title text-slate-950">{tr("Scripture Memory")}</CardTitle>
            </div>
            <Sparkles className="w-4 h-4 text-warning-500" />
          </div>
          <CardDescription className="tbo-supporting">{tr("Memorize God's Word together")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-5 pb-5">
          <div className="rounded-2xl border border-white bg-white/85 p-4">
            <p className="tbo-caption text-muted-foreground dark:text-muted-foreground mb-2">{tr("Featured Verse")}</p>
            <p lang="en" className="tbo-supporting mb-2">"Love is patient and kind..."</p>
            <p lang="en" className="tbo-caption text-primary-600">1 Corinthians 13:4</p>
          </div>
          <Button 
            variant="outline" 
            className="tbo-action h-11 w-full rounded-xl border-rose-200 bg-white/80 text-rose-700 hover:bg-white"
            onClick={() => onScreenNavigate?.('scripture-memory')}
          >
            <Brain className="w-4 h-4 mr-2" />

            {tr("Start Learning")}
          </Button>
        </CardContent>
      </Card>

      {/* Engagement summary closes the dashboard after Scripture Memory. */}
      <ChampionsCard />
    </div>
  );
}
