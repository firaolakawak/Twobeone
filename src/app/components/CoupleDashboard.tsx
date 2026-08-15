import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect, useMemo, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import {
  Heart,
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
  BarChart3,
  BookHeart,
  HandHeart,
  Gift,
  Star,
  PartyPopper,
  Brain,
  Trash2,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ComprehensiveBibleReader } from './ComprehensiveBibleReader';
import { LearningModulesCard } from './LearningModulesCard';
import { PushNotificationSetup } from './PushNotificationSetup';
import { DistanceConnector } from './DistanceConnector';
import { projectId } from '../utils/supabase/info';
import { sendNotification } from '../utils/notifications';
import { toast } from 'sonner';
import type { User, JournalEntry, PrayerRequest, Progress as ProgressType, QuestionResponse } from '../types';
import { moods as moodsApi, milestones as milestonesApi, questions as questionsApi } from '../utils/api';
import { AddMilestoneDialog } from './AddMilestoneDialog';
import { fetchAmharicChapter, getAmharicBookName } from '../utils/amharicBibleApi';

export interface CoupleDashboardProps {
  profile?: User;
  partner?: User;
  journalEntries: JournalEntry[];
  prayers: PrayerRequest[];
  progress?: ProgressType;
  responses: { user: QuestionResponse[]; partner: QuestionResponse[] };
  onNavigate?: (tab: string) => void;
  onScreenNavigate?: (screen: string) => void;
  accessToken?: string;
  devotionalStreak?: number;
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

interface Milestone {
  id: string;
  title: string;
  date: string;
  description: string;
  icon: string;
}

interface MoodEntry {
  userId: string;
  mood: 'great' | 'good' | 'okay' | 'sad';
  date: string;
  note?: string;
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

// Fancy SVG mood face illustrations
const MoodFace = ({ mood, size = 44 }: { mood: string; size?: number }) => {
  if (mood === 'great') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mf-great" cx="42%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FFFDE7"/>
          <stop offset="55%" stopColor="#FFD600"/>
          <stop offset="100%" stopColor="#FF8F00"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#mf-great)"/>
      <circle cx="24" cy="24" r="22" fill="none" stroke="#F9A825" strokeWidth="1.5"/>
      {/* Excitement brows */}
      <path d="M11 16 Q15 11 19 14" stroke="#7B5800" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M29 14 Q33 11 37 16" stroke="#7B5800" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Star eyes */}
      <path d="M16 24 L17.2 20.8 L18.4 24 L21.6 24 L19 26.2 L19.9 29.4 L16 27.2 L12.1 29.4 L13 26.2 L10.4 24 L13.6 24 Z" fill="#E65100"/>
      <path d="M32 24 L33.2 20.8 L34.4 24 L37.6 24 L35 26.2 L35.9 29.4 L32 27.2 L28.1 29.4 L29 26.2 L26.4 24 L29.6 24 Z" fill="#E65100"/>
      {/* Big open grin */}
      <path d="M11 31 Q24 45 37 31" fill="white" stroke="#C17900" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M11 31 Q24 38 37 31" fill="#C17900"/>
      <ellipse cx="24" cy="39" rx="5.5" ry="3.5" fill="#FF5252" opacity="0.65"/>
      {/* Rosy cheeks */}
      <ellipse cx="9" cy="31" rx="5.5" ry="3.5" fill="#FF8A65" opacity="0.5"/>
      <ellipse cx="39" cy="31" rx="5.5" ry="3.5" fill="#FF8A65" opacity="0.5"/>
      {/* Sparkles */}
      <path d="M4 8 L4 12 M2 10 L6 10" stroke="#FFD600" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M44 6 L44 10 M42 8 L46 8" stroke="#FFD600" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="5" cy="10" r="1.2" fill="#FFD600"/>
      <circle cx="44" cy="8" r="1" fill="#FFD600"/>
    </svg>
  );
  if (mood === 'good') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mf-good" cx="42%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#FFFDE7"/>
          <stop offset="55%" stopColor="#FFD54F"/>
          <stop offset="100%" stopColor="#FFA000"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#mf-good)"/>
      <circle cx="24" cy="24" r="22" fill="none" stroke="#FFB300" strokeWidth="1.5"/>
      {/* Gentle brows */}
      <path d="M11 17 Q15.5 13.5 20 16" stroke="#7B5800" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M28 16 Q32.5 13.5 37 17" stroke="#7B5800" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Happy crescent eyes */}
      <path d="M11 23 Q16 18 21 23" stroke="#4E342E" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M27 23 Q32 18 37 23" stroke="#4E342E" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Warm smile */}
      <path d="M14 31 Q24 42 34 31" fill="none" stroke="#7B5800" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Cheeks */}
      <ellipse cx="10" cy="29" rx="5.5" ry="3.5" fill="#FF8A65" opacity="0.45"/>
      <ellipse cx="38" cy="29" rx="5.5" ry="3.5" fill="#FF8A65" opacity="0.45"/>
    </svg>
  );
  if (mood === 'okay') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mf-okay" cx="42%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#EDE7F6"/>
          <stop offset="55%" stopColor="#B39DDB"/>
          <stop offset="100%" stopColor="#673AB7"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#mf-okay)"/>
      <circle cx="24" cy="24" r="22" fill="none" stroke="#9575CD" strokeWidth="1.5"/>
      {/* Flat brows */}
      <path d="M11 17 L20 17" stroke="#311B92" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M28 17 L37 17" stroke="#311B92" strokeWidth="2.2" strokeLinecap="round"/>
      {/* Round eyes with pupils */}
      <ellipse cx="16" cy="23" rx="4.5" ry="5" fill="white"/>
      <circle cx="16" cy="24" r="2.8" fill="#1A237E"/>
      <circle cx="17.2" cy="22.5" r="1.1" fill="white" opacity="0.7"/>
      <ellipse cx="32" cy="23" rx="4.5" ry="5" fill="white"/>
      <circle cx="32" cy="24" r="2.8" fill="#1A237E"/>
      <circle cx="33.2" cy="22.5" r="1.1" fill="white" opacity="0.7"/>
      {/* Neutral mouth */}
      <path d="M17 34 Q24 31 31 34" fill="none" stroke="#311B92" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
  if (mood === 'sad') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mf-sad" cx="42%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#E3F2FD"/>
          <stop offset="55%" stopColor="#90CAF9"/>
          <stop offset="100%" stopColor="#1565C0"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#mf-sad)"/>
      <circle cx="24" cy="24" r="22" fill="none" stroke="#42A5F5" strokeWidth="1.5"/>
      {/* Sad brows — drooping inward */}
      <path d="M11 16 Q15 19.5 19 17" stroke="#0D47A1" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M29 17 Q33 19.5 37 16" stroke="#0D47A1" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Watery eyes */}
      <ellipse cx="16" cy="23" rx="4.5" ry="5" fill="white" opacity="0.9"/>
      <circle cx="16" cy="24" r="2.8" fill="#0D47A1"/>
      <circle cx="17.2" cy="22.5" r="1.1" fill="white" opacity="0.6"/>
      <ellipse cx="32" cy="23" rx="4.5" ry="5" fill="white" opacity="0.9"/>
      <circle cx="32" cy="24" r="2.8" fill="#0D47A1"/>
      <circle cx="33.2" cy="22.5" r="1.1" fill="white" opacity="0.6"/>
      {/* Frown */}
      <path d="M15 36 Q24 29 33 36" fill="none" stroke="#0D47A1" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Teardrop */}
      <ellipse cx="32" cy="31.5" rx="2.2" ry="3.5" fill="#64B5F6" opacity="0.8"/>
      <path d="M29.8 29.5 Q32 26 34.2 29.5" fill="#64B5F6" opacity="0.6"/>
    </svg>
  );
  return null;
};

// Isolated timer component — owns its own 1-second interval so the parent never re-renders from it
const TimerDisplay = memo(function TimerDisplay({
  profile,
  coupleData,
  partner,
}: {
  profile: any;
  coupleData: any;
  partner: any;
}) {
  function calc() {
    let startDate: Date | null = null;
    if (profile?.relationshipStart) startDate = new Date(profile.relationshipStart);
    else if (coupleData?.relationshipStartDate) startDate = new Date(coupleData.relationshipStartDate);
    else if (profile?.createdAt) startDate = new Date(profile.createdAt);
    if (!startDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const diffMs = Date.now() - startDate.getTime();
    return {
      days: Math.floor(diffMs / 86400000),
      hours: Math.floor((diffMs % 86400000) / 3600000),
      minutes: Math.floor((diffMs % 3600000) / 60000),
      seconds: Math.floor((diffMs % 60000) / 1000),
    };
  }

  const [time, setTime] = useState(calc);
  useEffect(() => {
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [profile?.relationshipStart, coupleData?.relationshipStartDate, profile?.createdAt]);

  if (!partner || time.days === 0) return null;

  return (
    <div style={{ background: 'var(--card)', padding: 'var(--spacing-2) var(--spacing-3)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--primary-200)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--font-weight-bold)', color: 'var(--primary-600)', margin: 0 }}>
          {time.days}
        </p>
        <p style={{ fontSize: 'var(--text-caption-small)', color: 'var(--primary-500)', margin: 0 }}>
          {time.days === 1 ? 'day' : 'days'}
        </p>
        <div style={{ height: '1px', background: 'var(--border)', margin: 'var(--spacing-1) 0' }} />
        <p style={{ fontSize: 'var(--text-caption-small)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary-600)', margin: 0 }}>
          {String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}
        </p>
      </div>
    </div>
  );
});

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
  devotionals = [],
  onOpenDevotional,
  onStartQuestion,
}: CoupleDashboardProps) {
  const { t, language } = useLanguage();
  // timeTogether state moved into TimerDisplay to prevent 60 re-renders/min on this component
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);

  const [showPushNotificationSetup, setShowPushNotificationSetup] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [partnerLocation, setPartnerLocation] = useState<any>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [coupleData, setCoupleData] = useState<CoupleData>({});
  const [dailyVerse, setDailyVerse] = useState<BibleVerse | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);
  const [isBibleReaderOpen, setIsBibleReaderOpen] = useState(false);
  const [verseLanguage, setVerseLanguage] = useState<'en' | 'am'>(() => language === 'en' ? 'en' : 'am');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [todaysMood, setTodaysMood] = useState<MoodEntry | null>(null);
  const [partnerMood, setPartnerMood] = useState<MoodEntry | null>(null);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [stageExpanded, setStageExpanded] = useState(false);
  const [countdownExpanded, setCountdownExpanded] = useState(false);
  const [spotlightQuestions, setSpotlightQuestions] = useState<DashboardQuestion[]>([]);
  const [spotlightKind, setSpotlightKind] = useState<HomeSpotlightKind>(() => pickRandomHomeSpotlight());
  const [spotlightShuffle, setSpotlightShuffle] = useState(0);

  // Keep verse language in sync with the app language switcher
  useEffect(() => {
    setVerseLanguage(language === 'en' ? 'en' : 'am');
  }, [language]);

  const userInitials = profile?.name?.split(' ').map(n => n[0]).join('') || '?';
  const partnerInitials = partner?.name?.split(' ').map(n => n[0]).join('') || '?';
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const calculateDaysTogether = () => {
    // First check profile.relationshipStart (set when partners link)
    if (profile?.relationshipStart) {
      const start = new Date(profile.relationshipStart);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Then check coupleData.relationshipStartDate (legacy)
    if (coupleData.relationshipStartDate) {
      const start = new Date(coupleData.relationshipStartDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Fallback to account creation date
    if (profile?.createdAt) {
      const start = new Date(profile.createdAt);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return 0;
  };

  // 1-second timer is handled by TimerDisplay — removed from here

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

  useEffect(() => {
    // Fetch milestones from backend
    const fetchMilestones = async () => {
      try {
        const { milestones: fetchedMilestones } = await milestonesApi.list();
        setMilestones(fetchedMilestones.map((m: any) => ({
          id: m.id,
          title: m.title,
          date: m.date || m.createdAt,
          description: m.description || '',
          icon: 'heart'
        })));
      } catch (error: any) {
        const isNetworkErr = error?.message?.includes('Unable to connect') ||
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('Unauthorized') ||
          error?.message?.includes('timeout');
        if (!isNetworkErr) {
          console.error('Error fetching milestones:', error);
        }
      }
    };

    if (profile?.id) {
      // Defer 1s so it doesn't compete with the critical first render
      const t = setTimeout(() => {
        fetchMilestones();
        // Poll for partner milestone updates every 30 seconds (reduced from 15s)
      }, 1000);
      const interval = setInterval(fetchMilestones, 30000);
      return () => { clearTimeout(t); clearInterval(interval); };
    }
  }, [profile?.id, partner?.id]);

  // Delete a milestone by ID
  const handleMilestoneDelete = async (milestoneId: string) => {
    try {
      await milestonesApi.delete(milestoneId);
      setMilestones(prev => prev.filter(m => m.id !== milestoneId));
      toast.success('Milestone removed');
    } catch (error: any) {
      console.error('Error deleting milestone:', error);
      toast.error('Failed to remove milestone');
    }
  };

  // Helper function to handle milestone addition and refetch
  const handleMilestoneAdd = async (milestone: Milestone) => {
    // Add to local state for immediate UI feedback
    setMilestones([milestone, ...milestones]);
    toast.success('Milestone added!');
    
    // Refetch from backend to ensure consistency
    try {
      const { milestones: fetchedMilestones } = await milestonesApi.list();
      setMilestones(fetchedMilestones.map((m: any) => ({
        id: m.id,
        title: m.title,
        date: m.date || m.createdAt,
        description: m.description || '',
        icon: 'heart'
      })));
    } catch (error) {
      console.error('Error refetching milestones:', error);
    }
  };

  useEffect(() => {
    // Fetch moods from backend
    const fetchMoods = async () => {
      try {
        const { moods: fetchedMoods } = await moodsApi.list();
        
        // Get today's date string
        const today = new Date().toISOString().split('T')[0];
        
        // Find today's mood for user and partner
        const userTodayMood = fetchedMoods.find((m: any) => 
          m.userId === profile?.id && m.createdAt.startsWith(today)
        );
        const partnerTodayMood = fetchedMoods.find((m: any) => 
          m.userId === partner?.id && m.createdAt.startsWith(today)
        );
        
        if (userTodayMood) {
          setTodaysMood({
            userId: userTodayMood.userId,
            mood: userTodayMood.mood,
            date: userTodayMood.createdAt,
            note: userTodayMood.note
          });
        }
        
        if (partnerTodayMood) {
          setPartnerMood({
            userId: partnerTodayMood.userId,
            mood: partnerTodayMood.mood,
            date: partnerTodayMood.createdAt,
            note: partnerTodayMood.note
          });
        }
      } catch (error: any) {
        // Suppress expected network errors — moods polling is non-critical
        const isNetworkErr = error?.message?.includes('Unable to connect') ||
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('Unauthorized') ||
          error?.message?.includes('timeout');
        if (!isNetworkErr) {
          console.warn('Could not fetch moods - non-critical feature:', error);
        }
      }
    };

    if (profile?.id) {
      // Defer 1.5s — mood data is non-critical for initial render
      setTimeout(() => fetchMoods(), 1500);
      // Poll for partner mood updates every 60 seconds (reduced from 10s to ease cold-start pressure)
      const interval = setInterval(fetchMoods, 60000);
      return () => clearInterval(interval);
    }
  }, [profile?.id, partner?.id]);

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

  // Helper function to save mood and refetch
  const handleMoodUpdate = async (moodValue: 'great' | 'good' | 'okay' | 'sad') => {
    try {
      await moodsApi.save(moodValue);
      setTodaysMood({ userId: profile?.id || '', mood: moodValue, date: new Date().toISOString() });
      toast.success('Mood saved!');
      
      // Refetch to get the saved mood from backend
      const { moods: fetchedMoods } = await moodsApi.list();
      const today = new Date().toISOString().split('T')[0];
      const userTodayMood = fetchedMoods.find((m: any) => 
        m.userId === profile?.id && m.createdAt.startsWith(today)
      );
      if (userTodayMood) {
        setTodaysMood({
          userId: userTodayMood.userId,
          mood: userTodayMood.mood,
          date: userTodayMood.createdAt,
          note: userTodayMood.note
        });
      }
    } catch (error) {
      console.error('Error saving mood:', error);
      toast.error('Failed to save mood');
    }
  };

  // Calculate stats
  const totalJournalEntries = journalEntries.length;
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

  const recentEntries = journalEntries.slice(-3).map(entry => ({
    id: entry.id,
    title: entry.title,
    content: entry.content,
    createdAt: entry.createdAt,
    isPartner: entry.userId === partner?.id
  }));

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
      const devotional = choose(languageDevotionals.length ? languageDevotionals : devotionals);
      return {
        kind: 'devotion' as const,
        itemId: devotional?.id,
        category: undefined,
        eyebrow: 'A quiet moment',
        title: devotional?.title || 'A devotion for the two of you',
        description: devotional?.reflection || devotional?.body || devotional?.verse || devotional?.verseText || 'Pause together, reflect on Scripture, and carry one truth into your day.',
        actionLabel: 'Read devotion',
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
        eyebrow: 'Talk about this',
        title: question?.title || question?.question || question?.prompts?.[0]?.text || 'What would help you feel more loved this week?',
        description: 'Take a few honest minutes to answer separately, then discover where your hearts meet.',
        actionLabel: 'Start Q&A',
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
      eyebrow: entry ? 'From your story' : 'Make space for your story',
      title: entry?.title || (entry ? 'A journal memory worth revisiting' : 'Capture a moment you want to remember'),
      description: entry?.content || 'Write down what is happening in your relationship today—small moments become a shared story.',
      actionLabel: entry ? 'Read journal' : 'Open journal',
      icon: PenLine,
      iconClass: 'bg-sky-100 text-sky-700',
      surfaceClass: 'from-sky-50 via-white to-cyan-50/80 border-sky-100',
      accentClass: 'text-sky-800',
    };
  }, [devotionals, journalEntries, language, spotlightKind, spotlightQuestions, spotlightShuffle]);

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
    <div className="space-y-6 relative">
      {/* Page-level ambient radial glow */}
      <div className="pointer-events-none absolute -top-8 left-0 right-0 overflow-hidden" style={{ height: 260, zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 480, height: 260,
          background: 'radial-gradient(ellipse at top, rgba(244,63,94,0.10) 0%, rgba(139,92,246,0.06) 45%, transparent 72%)',
          filter: 'blur(2px)',
        }} />
      </div>

      {/* Couple Header */}
      <Card className="overflow-hidden relative" style={{ zIndex: 1 }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-primary-50 to-primary-100 opacity-50" />
        {coupleData.couplePicture && (
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src={coupleData.couplePicture} 
              alt="Couple" 
              className="w-full h-full object-cover opacity-10 blur-sm"
            />
          </div>
        )}

        <CardContent className="relative pt-8 pb-6">

          {/* Unconnected profile fallback; connected couples render through the unified distance profile below */}
          {(!partner || !profile?.id || !accessToken) && (
          <div className="flex items-center justify-center gap-6 mb-4">
            {/* User Avatar */}
            <div className="flex flex-col items-center">
              <Avatar className="w-20 h-20 border-4 border-white shadow-xl ring-2 ring-primary-200">
                <AvatarImage src={profile?.profilePicture} alt={profile?.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-500 text-white text-xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium mt-2">{profile?.name || 'You'}</p>
            </div>

            {/* Heart Connector */}
            <div className="relative">
              <div className="flex flex-col items-center">
                <Heart className={`w-10 h-10 ${partner ? 'text-primary-500 fill-primary-500 animate-pulse' : 'text-muted-foreground'} transition-all mb-2`} />
                <TimerDisplay profile={profile} coupleData={coupleData} partner={partner} />
              </div>
            </div>

            {/* Partner Avatar */}
            <div className="flex flex-col items-center">
              <Avatar className="w-20 h-20 border-4 border-white shadow-xl ring-2 ring-sky-200">
                {partner ? (
                  <>
                    <AvatarImage src={partner.profilePicture} alt={partner.name} />
                    <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-500 text-white text-xl">
                      {partnerInitials}
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <Users className="w-8 h-8" />
                  </AvatarFallback>
                )}
              </Avatar>
              <p className="text-sm font-medium mt-2">{partner?.name || 'Partner'}</p>
            </div>
          </div>
          )}

          {/* Location and distance now live inside the couple profile card */}
          {partner && profile?.id && accessToken && (
            <DistanceConnector
              embedded
              userId={profile.id}
              userName={profile.name || 'You'}
              userAvatar={profile.profilePicture}
              partnerId={partner.id}
              partnerName={partner.name || 'Partner'}
              partnerAvatar={partner.profilePicture}
              accessToken={accessToken}
              centerContent={(
                <div className="flex flex-col items-center">
                  <Heart className="mb-2 h-10 w-10 animate-pulse fill-primary-500 text-primary-500" />
                  <TimerDisplay profile={profile} coupleData={coupleData} partner={partner} />
                </div>
              )}
            />
          )}

          {/* Status Message */}
          {partner ? (
            <div className="mt-4 text-center space-y-1">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-primary-600 bg-clip-text text-transparent">
                {profile?.name} & {partner.name}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-warning-500" />
                {t.dashboard.growingTogetherInFaith}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">{t.dashboard.connectWithPartner} to begin your journey together</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate?.('profile')}
                className="bg-card/80 backdrop-blur-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Add Partner
              </Button>
            </div>
          )}

          {/* Readiness Stage Badge — only shown when connected with a partner */}
          {partner && (() => {
            const STAGES = [
              { label: 'Seed',       emoji: '🌱', minDays: 0   },
              { label: 'Growth',     emoji: '🌿', minDays: 90  },
              { label: 'Unity',      emoji: '💞', minDays: 180 },
              { label: 'Commitment', emoji: '🤝', minDays: 250 },
              { label: 'Covenant',   emoji: '👑', minDays: 360 },
            ];
            // Days together — mirrors calculateDaysTogether() logic
            let daysTogether = 0;
            const startStr = profile?.relationshipStart || coupleData?.relationshipStartDate || profile?.createdAt;
            if (startStr) {
              daysTogether = Math.floor((Date.now() - new Date(startStr).getTime()) / 86_400_000);
            }
            // Activity boost: up to +30 days equivalent so engaged couples can nudge forward
            const streak = devotionalStreak ?? 0;
            const activityBoost =
              Math.min(10, streak * 1.5) +
              Math.min(10, (responses?.user?.length ?? 0) * 0.5) +
              Math.min(10, (prayers?.length ?? 0) * 0.5);
            const effectiveDays = daysTogether + Math.round(activityBoost);
            let idx = 0;
            for (let i = STAGES.length - 1; i >= 0; i--) {
              if (effectiveDays >= STAGES[i].minDays) { idx = i; break; }
            }
            const stage = STAGES[idx];
            const accent =
              idx === 4 ? 'var(--success-600, #16a34a)' :
              idx === 3 ? 'var(--primary)' :
              idx === 2 ? 'var(--info-600, #0284c7)' :
              idx === 1 ? 'var(--warning-600, #d97706)' :
                          'var(--muted-foreground)';
            const nextStage = STAGES[idx + 1];
            const pct = nextStage
              ? Math.min(100, Math.round(((effectiveDays - stage.minDays) / (nextStage.minDays - stage.minDays)) * 100))
              : 100;
            return (
              <div style={{
                margin: '14px 0 0',
                borderRadius: 'var(--radius-lg, 14px)',
                border: `1.5px solid ${accent}`,
                background: 'var(--background)',
                overflow: 'hidden',
              }}>
                {/* Tap-to-toggle header — always visible */}
                <button
                  onClick={() => setStageExpanded(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '10px 14px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{stage.emoji}</span>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: 'var(--text-caption)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: 1.2 }}>
                        {stage.label} Stage
                      </p>
                      <p style={{ margin: 0, fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>
                        {daysTogether} days together
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Mini progress pill — visible in collapsed state */}
                    {!stageExpanded && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '3px 8px', borderRadius: 'var(--radius-full)',
                        background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                      }}>
                        <div style={{ width: 48, height: 3, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: accent, borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-semibold)', color: accent }}>
                          {pct}%
                        </span>
                      </div>
                    )}
                    {nextStage && !stageExpanded && (
                      <span style={{ fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>
                        {nextStage.minDays - daysTogether}d left
                      </span>
                    )}
                    <ChevronDown
                      style={{
                        width: 15, height: 15, color: 'var(--muted-foreground)',
                        transform: stageExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.22s ease',
                        flexShrink: 0,
                      }}
                    />
                  </div>
                </button>

                {/* Expandable body */}
                <div style={{
                  overflow: 'hidden',
                  maxHeight: stageExpanded ? 160 : 0,
                  transition: 'max-height 0.28s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <div style={{ padding: '0 14px 12px' }}>
                    {/* Progress bar */}
                    <div style={{ height: 5, borderRadius: 999, background: 'var(--border)', overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: accent, borderRadius: 999, transition: 'width 1s ease' }} />
                    </div>
                    {/* Next stage label */}
                    {nextStage && (
                      <p style={{ margin: '0 0 10px', fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', textAlign: 'right' }}>
                        {nextStage.emoji} Next: <strong style={{ color: accent }}>{nextStage.label}</strong> in {nextStage.minDays - daysTogether} days
                      </p>
                    )}
                    {/* 5 stage nodes */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {STAGES.map((s, i) => {
                        const done = i < idx;
                        const active = i === idx;
                        return (
                          <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                            <div style={{
                              width: active ? 30 : 22, height: active ? 30 : 22,
                              borderRadius: '50%',
                              fontSize: active ? 15 : 11,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: active ? accent : done ? 'var(--muted-foreground)' : 'var(--muted)',
                              opacity: i > idx ? 0.35 : 1,
                              transition: 'all 0.3s ease',
                              boxShadow: active ? `0 0 0 3px color-mix(in srgb, ${accent} 25%, transparent)` : 'none',
                            }}>
                              {s.emoji}
                            </div>
                            <span style={{
                              fontSize: 9, fontWeight: active ? 700 : 500,
                              color: active ? accent : i < idx ? 'var(--foreground)' : 'var(--muted-foreground)',
                              whiteSpace: 'nowrap',
                            }}>{s.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Upcoming Event Countdown */}
          {(() => {
            const now = new Date();
            const upcoming = milestones
              .filter(m => m.date && new Date(m.date) > now)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
            if (!upcoming) return null;
            const diff = new Date(upcoming.date).getTime() - now.getTime();
            const days = Math.floor(diff / 86_400_000);
            const hours = Math.floor((diff % 86_400_000) / 3_600_000);
            const mins = Math.floor((diff % 3_600_000) / 60_000);
            return (
              <div
                style={{
                  marginTop: 'var(--spacing-4)',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  maxWidth: 320,
                  borderRadius: 'var(--radius-xl)',
                  border: '1.5px solid var(--primary-200)',
                  background: 'var(--primary-50)',
                  overflow: 'hidden',
                }}
              >
                {/* Tap-to-toggle header — always visible */}
                <button
                  onClick={() => setCountdownExpanded(v => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    
                    <span style={{
                      fontSize: 'var(--text-caption)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--primary-700)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      {upcoming.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    {/* Compact pill shown when collapsed */}
                    {!countdownExpanded && (
                      <span style={{
                        fontSize: 'var(--text-label)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--primary-600)',
                        background: 'color-mix(in srgb, var(--primary-600) 10%, transparent)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {days}d {String(hours).padStart(2, '0')}h
                      </span>
                    )}
                    <ChevronDown style={{
                      width: 15,
                      height: 15,
                      color: 'var(--primary-500)',
                      transform: countdownExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.22s ease',
                      flexShrink: 0,
                    }} />
                  </div>
                </button>

                {/* Expandable countdown body */}
                <div style={{
                  overflow: 'hidden',
                  maxHeight: countdownExpanded ? 120 : 0,
                  transition: 'max-height 0.28s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--spacing-1)',
                    padding: '0 var(--spacing-4) var(--spacing-3)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-3)' }}>
                      {[
                        { val: days,  label: 'days' },
                        { val: hours, label: 'hrs'  },
                        { val: mins,  label: 'min'  },
                      ].map(({ val, label }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{
                            fontSize: 'var(--text-2xl)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--primary-700)',
                            fontVariantNumeric: 'tabular-nums',
                            lineHeight: 1,
                          }}>
                            {String(val).padStart(2, '0')}
                          </span>
                          <span style={{
                            fontSize: 10,
                            color: 'var(--muted-foreground)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                          }}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: 'var(--text-label)', color: 'var(--muted-foreground)' }}>
                      {new Date(upcoming.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Randomized next step — devotion, conversation, or journal */}
      <section className={`relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br p-5 shadow-[0_16px_46px_rgba(83,45,67,0.09)] ${spotlight.surfaceClass}`} aria-labelledby="home-spotlight-title">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/70 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${spotlight.iconClass}`}>
                <SpotlightIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${spotlight.accentClass}`}>For you today</p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">{spotlight.eyebrow}</p>
              </div>
            </div>
            <button type="button" onClick={shuffleSpotlight} aria-label="Show another suggestion" title="Show another" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/90 bg-white/70 text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-95">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <h2 id="home-spotlight-title" className="mt-5 text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl">{spotlight.title}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{spotlight.description}</p>

          <button type="button" onClick={openSpotlight} className="group mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 text-sm font-semibold text-background shadow-[0_10px_24px_rgba(30,25,28,0.16)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(30,25,28,0.20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 active:scale-[0.985] motion-reduce:transform-none sm:w-auto">
            {spotlight.actionLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Quick Stats Grid — neumorphic soft-shadow cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: t.dashboard.devotionalStreak,
            value: devotionalStreakValue,
            sub: devotionalStreakValue === 1 ? 'day' : 'days',
            icon: Calendar,
            onClick: () => onNavigate?.('devotions'),
            accent: 'var(--primary-500)',
            bg: 'linear-gradient(135deg, var(--primary-50) 0%, #fff0f5 100%)',
            iconBg: 'var(--primary-100)',
            textColor: 'var(--primary-700)',
            numColor: 'var(--primary-900)',
          },
          {
            label: t.dashboard.journalEntries,
            value: sharedJournalEntries,
            sub: 'shared',
            icon: BookHeart,
            onClick: () => onNavigate?.('journal'),
            accent: 'var(--secondary-500)',
            bg: 'linear-gradient(135deg, var(--secondary-50) 0%, #f0f9ff 100%)',
            iconBg: 'var(--secondary-100)',
            textColor: 'var(--secondary-700)',
            numColor: 'var(--secondary-700)',
          },
          {
            label: t.dashboard.prayers,
            value: `${answeredPrayers}/${totalPrayers}`,
            sub: 'answered',
            icon: HandHeart,
            onClick: () => onNavigate?.('prayer'),
            accent: '#8b5cf6',
            bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
            iconBg: '#ede9fe',
            textColor: '#6d28d9',
            numColor: '#5b21b6',
          },
          {
            label: t.dashboard.questions,
            value: `${questionsAnswered}/${totalQuestionsCount}`,
            sub: 'answered',
            icon: MessageCircleHeart,
            onClick: () => onScreenNavigate?.('category-selection'),
            accent: 'var(--success-500)',
            bg: 'linear-gradient(135deg, var(--success-50) 0%, #dcfce7 100%)',
            iconBg: '#bbf7d0',
            textColor: 'var(--success-700)',
            numColor: 'var(--success-700)',
          },
        ].map(({ label, value, sub, icon: Icon, onClick, accent, bg, iconBg, textColor, numColor }) => (
          <button
            key={label}
            onClick={onClick}
            className="text-left rounded-2xl p-4 transition-all duration-200 active:scale-[0.97]"
            style={{
              background: bg,
              border: 'none',
              boxShadow: `0 2px 0 0 var(--neutral-200), 0 8px 24px -4px ${accent}22, 0 1px 3px 0 ${accent}18`,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium" style={{ color: textColor }}>{label}</p>
                <p className="text-3xl font-bold leading-none mt-1" style={{ color: numColor }}>{value}</p>
                <p className="text-xs" style={{ color: textColor, opacity: 0.75 }}>{sub}</p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: iconBg }}>
                <Icon className="w-5 h-5" style={{ color: accent }} />
              </div>
            </div>
            {/* Subtle bottom accent bar */}
            <div className="mt-3 h-0.5 rounded-full w-full opacity-30" style={{ background: accent }} />
          </button>
        ))}
      </div>

      {/* Daily Bible Verse */}
      <Card 
        className="bg-gradient-to-br from-warning-50 via-warning-50 to-warning-50 border-warning-500/30 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setIsBibleReaderOpen(true)}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-warning-500" />
            Daily Verse
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingVerse ? (
            <div className="text-center py-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-warning-50 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-warning-50 rounded w-full"></div>
                <div className="h-4 bg-warning-50 rounded w-2/3 mx-auto"></div>
              </div>
            </div>
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
                  <button
                    key={lang}
                    onClick={() => setVerseLanguage(lang)}
                    style={{
                      background: verseLanguage === lang ? 'var(--card)' : 'transparent',
                      color: verseLanguage === lang ? 'var(--foreground)' : 'var(--muted-foreground)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-caption-small)',
                      fontWeight: verseLanguage === lang ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
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

              {verseLanguage === 'am' && dailyVerse.amharicText ? (
                <>
                  <blockquote lang="am" style={{ fontSize: 'var(--text-base)', color: 'var(--foreground)', lineHeight: 1.9, borderLeft: '4px solid var(--primary)', paddingLeft: 'var(--spacing-3)', margin: 0, opacity: 0.9 }}>
                    "{dailyVerse.amharicText}"
                  </blockquote>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)' }}>{dailyVerse.amharicReference}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>አማርኛ መጽሐፍ ቅዱስ</span>
                  </div>
                </>
              ) : (
                <>
                  <blockquote style={{ fontSize: 'var(--text-base)', fontStyle: 'italic', color: 'var(--foreground)', lineHeight: 1.6, borderLeft: '4px solid var(--primary)', paddingLeft: 'var(--spacing-3)', margin: 0, opacity: 0.85 }}>
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
                className="w-full border-warning-500/50 text-warning-700 hover:bg-warning-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBibleReaderOpen(true);
                }}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Read Full Chapter
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
                throw new Error('Failed to save highlight');
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
                throw new Error('Failed to share verse');
              }
            } catch (error) {
              console.error('Error sharing verse:', error);
              throw error;
            }
          }}
        />
      )}

      {/* Mood Tracker */}
      {partner && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary-600" />
                  {t.dashboard.todaysMood}
                </CardTitle>
                <CardDescription>{t.mood.shareEmotionalState}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onScreenNavigate?.('mood-analytics')}
                className="h-8 w-8 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                title="View Analytics"
              >
                <BarChart3 className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* {t.dashboard.yourMood} */}
              <div className="space-y-3">
                <p style={{ fontSize: 'var(--text-callout)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>{t.dashboard.yourMood}</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { mood: 'great', label: 'Great', bg: 'linear-gradient(135deg, var(--success-50), var(--warning-50))', border: 'var(--success-400)', labelColor: 'var(--success-700)', glow: 'var(--success-200)' },
                    { mood: 'good',  label: 'Good',  bg: 'linear-gradient(135deg, var(--warning-50), var(--secondary-50))', border: 'var(--warning-400)', labelColor: 'var(--warning-700)', glow: 'var(--warning-200)' },
                    { mood: 'okay',  label: 'Okay',  bg: 'linear-gradient(135deg, var(--secondary-50), var(--primary-50))', border: 'var(--secondary-400)', labelColor: 'var(--secondary-700)', glow: 'var(--secondary-200)' },
                    { mood: 'sad',   label: 'Sad',   bg: 'linear-gradient(135deg, var(--primary-50), var(--neutral-100))', border: 'var(--primary-300)', labelColor: 'var(--primary-700)', glow: 'var(--primary-100)' },
                  ] as const).map(({ mood, label, bg, border, labelColor, glow }) => {
                    const isSelected = todaysMood?.mood === mood;
                    return (
                      <button
                        key={mood}
                        onClick={() => handleMoodUpdate(mood)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          gap: 'var(--spacing-1)',
                          paddingTop: 'var(--spacing-3)',
                          paddingBottom: 'var(--spacing-2)',
                          borderRadius: 'var(--radius-lg)',
                          border: `2px solid ${isSelected ? border : 'var(--neutral-200)'}`,
                          background: isSelected ? bg : 'var(--card)',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          boxShadow: isSelected ? `0 4px 16px ${glow}, 0 0 0 3px ${glow}` : '0 1px 3px rgba(0,0,0,0.06)',
                        }}
                      >
                        <MoodFace mood={mood} size={44} />
                        <span style={{ fontSize: 'var(--text-label)', fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)', color: isSelected ? labelColor : 'var(--neutral-500)' }}>{label}</span>
                      </button>
                    );
                  })}
                </div>
                {!todaysMood && (
                  <p style={{ fontSize: 'var(--text-caption-small)', color: 'var(--muted-foreground)' }}>Tap to share how you feel</p>
                )}
              </div>

              {/* {t.dashboard.partnersMood} */}
              <div className="space-y-3">
                <p style={{ fontSize: 'var(--text-callout)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>{partner.name}'s Mood</p>
                {partnerMood ? (() => {
                  const moodMap: Record<string, { label: string; bg: string; border: string; color: string; glow: string }> = {
                    great: { label: 'Feeling great!', bg: 'linear-gradient(135deg, var(--success-50), var(--warning-50))', border: 'var(--success-400)', color: 'var(--success-700)', glow: 'var(--success-100)' },
                    good:  { label: 'Feeling good',   bg: 'linear-gradient(135deg, var(--warning-50), var(--secondary-50))', border: 'var(--warning-400)', color: 'var(--warning-700)', glow: 'var(--warning-100)' },
                    okay:  { label: 'Feeling okay',   bg: 'linear-gradient(135deg, var(--secondary-50), var(--primary-50))', border: 'var(--secondary-400)', color: 'var(--secondary-700)', glow: 'var(--secondary-100)' },
                    sad:   { label: 'Feeling sad',    bg: 'linear-gradient(135deg, var(--primary-50), var(--neutral-100))', border: 'var(--primary-300)', color: 'var(--primary-700)', glow: 'var(--primary-50)' },
                  };
                  const m = moodMap[partnerMood.mood] ?? moodMap.okay;
                  return (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)',
                      padding: 'var(--spacing-3) var(--spacing-4)',
                      background: m.bg,
                      border: `1.5px solid ${m.border}`,
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: `0 2px 12px ${m.glow}`,
                    }}>
                      <MoodFace mood={partnerMood.mood} size={52} />
                      <div>
                        <p style={{ fontSize: 'var(--text-callout)', fontWeight: 'var(--font-weight-semibold)', color: m.color, margin: 0 }}>{m.label}</p>
                        <p style={{ fontSize: 'var(--text-caption-small)', color: 'var(--muted-foreground)', margin: 0 }}>Today</p>
                      </div>
                    </div>
                  );
                })() : (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: 'var(--touch-target-comfortable)',
                    background: 'var(--neutral-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px dashed var(--neutral-300)',
                  }}>
                    <p style={{ fontSize: 'var(--text-caption-small)', color: 'var(--muted-foreground)', margin: 0 }}>Not shared yet</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* {t.dashboard.relationshipMilestones} */}
      {partner && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-warning-500" />
                {t.dashboard.relationshipMilestones}
              </CardTitle>
              <AddMilestoneDialog
                onAddMilestone={handleMilestoneAdd}
              />
            </div>
            <CardDescription>Celebrate your journey together</CardDescription>
          </CardHeader>
          <CardContent>
            {milestones.length > 0 ? (
              <div className="space-y-3">
                {milestones.slice(0, 3).map((milestone) => (
                  <div
                    key={milestone.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-3)',
                      background: 'linear-gradient(to right, var(--primary-50), var(--secondary-50, #f0f9ff))',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--primary-200, #ffc7d7)',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--primary-100, #ffe0e8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {milestone.icon === 'gift' && <Gift style={{ width: 18, height: 18, color: 'var(--primary-600)' }} />}
                      {milestone.icon === 'party' && <PartyPopper style={{ width: 18, height: 18, color: 'var(--primary-600)' }} />}
                      {milestone.icon === 'heart' && <Heart style={{ width: 18, height: 18, color: 'var(--primary-600)' }} />}
                      {milestone.icon === 'star' && <Star style={{ width: 18, height: 18, color: 'var(--warning-500, #f59e0b)' }} />}
                      {!['gift','party','heart','star'].includes(milestone.icon) && <Star style={{ width: 18, height: 18, color: 'var(--primary-600)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 'var(--text-callout)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {milestone.title}
                      </p>
                      {milestone.description && (
                        <p style={{ fontSize: 'var(--text-label)', color: 'var(--neutral-500)', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {milestone.description}
                        </p>
                      )}
                      <p style={{ fontSize: 'var(--text-label)', color: 'var(--primary-600)', margin: 'var(--spacing-1) 0 0 0', fontWeight: 'var(--font-weight-medium)' }}>
                        {new Date(milestone.date).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMilestoneDelete(milestone.id)}
                      title="Remove milestone"
                      style={{
                        flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
                        padding: 4, borderRadius: 'var(--radius-sm)',
                        color: 'var(--neutral-400)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--error-500, #ef4444)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--neutral-400)')}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No milestones yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      // Add first milestone via API
                      const firstDate = profile?.relationshipStart || new Date().toISOString();
                      const { milestone } = await milestonesApi.create({
                        title: 'First Day Together',
                        description: 'The beginning of your beautiful journey',
                        date: firstDate,
                        category: 'relationship'
                      });
                      
                      // Add to local state
                      setMilestones([{
                        id: milestone.id,
                        title: milestone.title,
                        date: milestone.date,
                        description: milestone.description || '',
                        icon: 'heart'
                      }]);
                      toast.success('First milestone added!');
                    } catch (error) {
                      console.error('Error adding first milestone:', error);
                      toast.error('Failed to add milestone');
                    }
                  }}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Add Your First Milestone
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Journey Progress */}
      {partner && (
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate?.('devotions')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              {t.dashboard.yourJourneyTogether}
            </CardTitle>
            <CardDescription>{t.dashboard.buildingFoundation}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Devotionals Progress */}
            <div 
              className="space-y-2 cursor-pointer hover:bg-primary-50/50 p-2 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.('devotions');
              }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily Devotionals</span>
                <span className="font-medium">{devotionalStreakValue} {devotionalStreakValue === 1 ? 'day' : 'days'}</span>
              </div>
              <Progress value={Math.min((devotionalStreakValue / 30) * 100, 100)} className="h-2" />
            </div>

            {/* Questions Progress */}
            <div 
              className="space-y-2 cursor-pointer hover:bg-success-50/50 p-2 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onScreenNavigate?.('category-selection');
              }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Know Each Other Questions</span>
                <span className="font-medium">{questionsAnswered}/{totalQuestionsCount}</span>
              </div>
              <Progress value={(questionsAnswered / totalQuestionsCount) * 100} className="h-2" />
            </div>

            {/* Journal Progress */}
            <div 
              className="space-y-2 cursor-pointer hover:bg-primary-50/50 p-2 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.('journal');
              }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shared Journal Entries</span>
                <span className="font-medium">{sharedJournalEntries}/50</span>
              </div>
              <Progress value={Math.min((sharedJournalEntries / 50) * 100, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookHeart className="w-5 h-5 text-primary-600" />
                Recent Journal Entries
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate?.('journal')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentEntries.map((entry) => (
              <div 
                key={entry.id} 
                className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                  entry.isPartner 
                    ? 'bg-sky-50/50 border-sky-200 hover:bg-sky-50' 
                    : 'bg-primary-50/50 border-primary-200 hover:bg-primary-50'
                }`}
                onClick={() => onNavigate?.('journal')}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm line-clamp-1">{entry.title}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  by {entry.isPartner ? partner?.name : profile?.name}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Continue your spiritual journey</CardDescription>
            </div>
            {profile?.id && accessToken && (
              <PushNotificationSetup
                userId={profile.id}
                accessToken={accessToken}
              />
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Learning Modules */}
      <LearningModulesCard 
        onViewAll={() => onScreenNavigate?.('guidance')}
        accessToken={accessToken}
      />

      {/* Scripture Memory - NEW! */}
      <Card className="hover:shadow-md transition-shadow border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary-600" />
              <CardTitle className="text-base">Scripture Memory</CardTitle>
            </div>
            <Sparkles className="w-4 h-4 text-warning-500" />
          </div>
          <CardDescription>Memorize God's Word together</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-card  rounded-lg p-3 border border-primary-200">
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-2">Featured Verse</p>
            <p className="text-sm mb-2">"Love is patient and kind..."</p>
            <p className="text-xs text-primary-600">1 Corinthians 13:4</p>
          </div>
          <Button 
            variant="outline" 
            className="w-full border-primary-300 hover:bg-primary-50"
            onClick={() => onScreenNavigate?.('scripture-memory')}
          >
            <Brain className="w-4 h-4 mr-2" />
            Start Learning
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
