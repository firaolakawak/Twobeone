import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect, memo } from 'react';
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
import { amharicVerses } from '../data/amharic-verses';

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
  devotionalStreak
}: CoupleDashboardProps) {
  const { t } = useLanguage();
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
  const [verseLanguage, setVerseLanguage] = useState<'en' | 'am'>('am');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [todaysMood, setTodaysMood] = useState<MoodEntry | null>(null);
  const [partnerMood, setPartnerMood] = useState<MoodEntry | null>(null);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [stageExpanded, setStageExpanded] = useState(false);
  const [countdownExpanded, setCountdownExpanded] = useState(false);

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
    // Fetch daily Bible verse from Bible API
    const fetchDailyVerse = async () => {
      try {
        // Using bible-api.com which is free and doesn't require auth
        // Get a verse of the day (rotating through different verses)
        const verses = [
          'john 3:16',
          'philippians 4:13',
          'proverbs 3:5-6',
          'romans 8:28',
          'jeremiah 29:11',
          'psalm 23:1',
          'isaiah 40:31',
          '1 corinthians 13:4-8'
        ];
        
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const verseIndex = dayOfYear % verses.length;
        const selectedVerse = verses[verseIndex];
        
        const response = await fetch(`https://bible-api.com/${selectedVerse}?translation=kjv`);
        if (!response.ok) throw new Error('Failed to fetch verse');
        
        const data = await response.json();
        setDailyVerse({
          reference: data.reference,
          text: data.text.replace(/\\n/g, ' ').trim(),
          translation: data.translation_name
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
    const checkWeeklyReport = async () => {
      if (!profile?.id || !partner?.id) return;
      
      try {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Calculate days until next Saturday
        const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7;
        
        // Only run on Saturdays (day 6)
        if (dayOfWeek !== 6) {
          console.log(`[WeeklyMoodReport] Next auto-report will be generated on Saturday (in ${daysUntilSaturday} days)`);
          return;
        }
        
        // Check if we've already sent a report this week
        const lastReportCheck = localStorage.getItem(`lastMoodReport:${profile.id}`);
        
        if (lastReportCheck) {
          const lastReportDate = new Date(parseInt(lastReportCheck));
          const currentWeekStart = new Date(now);
          currentWeekStart.setDate(now.getDate() - dayOfWeek); // Go back to Sunday
          currentWeekStart.setHours(0, 0, 0, 0);
          
          // If we already sent a report this week, skip
          if (lastReportDate >= currentWeekStart) {
            console.log('[WeeklyMoodReport] Report already sent this week (Saturday)');
            return;
          }
        }
        
        console.log('[WeeklyMoodReport] 🎯 It\'s Saturday! Auto-generating weekly mood report...');
        
        // Try to generate the report
        await moodsApi.generateWeeklyReport();
        
        // Store the timestamp
        localStorage.setItem(`lastMoodReport:${profile.id}`, now.getTime().toString());
        
        console.log('[WeeklyMoodReport] ✅ Weekly report generated successfully and sent to both partners!');
      } catch (error: any) {
        // Silently fail - this is a background task
        console.log('[WeeklyMoodReport] ⚠️ Could not auto-generate report:', error.message);
      }
    };

    // Check on mount
    checkWeeklyReport();
    
    // Check every 6 hours to catch Saturday
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

          {/* Avatars */}
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

          {/* Status Message */}
          {partner ? (
            <div className="text-center space-y-1">
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

      {/* Distance Between Partners */}
      {partner && profile?.id && accessToken && (
        <DistanceConnector
          userId={profile.id}
          userName={profile.name || 'You'}
          userAvatar={profile.profilePicture}
          partnerId={partner.id}
          partnerName={partner.name || 'Partner'}
          partnerAvatar={partner.profilePicture}
          accessToken={accessToken}
        />
      )}

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

              {verseLanguage === 'en' ? (
                <>
                  <blockquote style={{ fontSize: 'var(--text-base)', fontStyle: 'italic', color: 'var(--foreground)', lineHeight: 1.6, borderLeft: '4px solid var(--primary)', paddingLeft: 'var(--spacing-3)', margin: 0, opacity: 0.85 }}>
                    "{dailyVerse.text}"
                  </blockquote>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)' }}>{dailyVerse.reference}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>{dailyVerse.translation}</span>
                  </div>
                </>
              ) : (() => {
                const amVerse = amharicVerses[dailyVerse.reference];
                return amVerse ? (
                  <>
                    <blockquote style={{ fontSize: 'var(--text-base)', color: 'var(--foreground)', lineHeight: 1.8, borderLeft: '4px solid var(--primary)', paddingLeft: 'var(--spacing-3)', margin: 0, opacity: 0.85 }}>
                      "{amVerse.text}"
                    </blockquote>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--primary)' }}>{amVerse.referenceAmharic}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>{amVerse.translation}</span>
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
                );
              })()}

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
                    { mood: 'great', emoji: '🤩', label: 'Great', bg: 'var(--success-50)', border: 'var(--success-500)', labelColor: 'var(--success-700)' },
                    { mood: 'good',  emoji: '😊', label: 'Good',  bg: 'var(--secondary-50)', border: 'var(--secondary-500)', labelColor: 'var(--secondary-700)' },
                    { mood: 'okay',  emoji: '😐', label: 'Okay',  bg: 'var(--warning-50)', border: 'var(--warning-500)', labelColor: 'var(--warning-700)' },
                    { mood: 'sad',   emoji: '😔', label: 'Sad',   bg: 'var(--neutral-100)', border: 'var(--neutral-400)', labelColor: 'var(--neutral-600)' },
                  ] as const).map(({ mood, emoji, label, bg, border, labelColor }) => {
                    const isSelected = todaysMood?.mood === mood;
                    return (
                      <button
                        key={mood}
                        onClick={() => handleMoodUpdate(mood)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          gap: 'var(--spacing-1)',
                          height: 'var(--touch-target-comfortable)',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${isSelected ? border : 'var(--neutral-200)'}`,
                          background: isSelected ? bg : 'var(--card)',
                          cursor: 'pointer',
                          padding: 'var(--spacing-1)',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? `0 0 className="p-[0px] p-[0px] px-[0px] py-[1px] px-[0px] py-[2px] px-[0px] py-[3px] px-[0px] py-[4px] px-[0px] py-[4px] px-[0px] py-[4px] px-[0px] py-[5px] px-[0px] py-[6px] px-[0px] py-[6px] px-[0px] py-[6px] px-[0px] py-[6px] px-[0px] py-[6px] px-[0px] py-[6px] px-[0px] py-[5px] px-[0px] py-[5px] px-[0px] py-[5px] px-[0px] py-[4px] px-[0px] py-[4px] px-[0px] py-[3px] px-[0px] py-[3px] px-[0px] py-[2px] px-[0px] py-[1px] p-[0px] p-[0px] p-[0px] p-[0px] p-[0px] p-[0px] p-[0px]" 0 2px ${border}33` : 'none',
                        }}
                      >
                        <span style={{ fontSize: 'var(--icon-lg)', lineHeight: 1 }}>{emoji}</span>
                        <span style={{ fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-medium)', color: isSelected ? labelColor : 'var(--neutral-500)' }}>{label}</span>
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
                  const moodMap: Record<string, { emoji: string; label: string; bg: string; border: string; color: string }> = {
                    great: { emoji: '🤩', label: 'Feeling great!', bg: 'var(--success-50)', border: 'var(--success-500)', color: 'var(--success-700)' },
                    good:  { emoji: '😊', label: 'Feeling good',   bg: 'var(--secondary-50)', border: 'var(--secondary-500)', color: 'var(--secondary-700)' },
                    okay:  { emoji: '😐', label: 'Feeling okay',   bg: 'var(--warning-50)', border: 'var(--warning-500)', color: 'var(--warning-700)' },
                    sad:   { emoji: '😔', label: 'Feeling sad',    bg: 'var(--neutral-100)', border: 'var(--neutral-400)', color: 'var(--neutral-600)' },
                  };
                  const m = moodMap[partnerMood.mood] ?? moodMap.okay;
                  return (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-3) var(--spacing-4)',
                      background: m.bg,
                      border: `1.5px solid ${m.border}`,
                      borderRadius: 'var(--radius-md)',
                      minHeight: 'var(--touch-target-comfortable)',
                    }}>
                      <span style={{ fontSize: '2rem', lineHeight: 1 }}>{m.emoji}</span>
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