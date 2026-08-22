import { useState, useEffect } from 'react';
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
  Smile,
  Meh,
  Frown,
  Gift,
  Star,
  PartyPopper,
  Brain
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { BibleReader } from './BibleReader';
import { BibleReaderDialog } from './BibleReaderDialog';
import { LearningModulesCard } from './LearningModulesCard';
import { getTodaysDevotional } from '../data/devotionals';
import { projectId } from '../utils/supabase/info';
import { sendNotification } from '../utils/notifications';
import { toast } from 'sonner';
import type { User, JournalEntry, PrayerRequest, Progress as ProgressType, QuestionResponse } from '../types';
import { moods as moodsApi, milestones as milestonesApi, questions as questionsApi } from '../utils/api';
import { AddMilestoneDialog } from './AddMilestoneDialog';

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
  const [coupleData, setCoupleData] = useState<CoupleData>({});
  const [dailyVerse, setDailyVerse] = useState<BibleVerse | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [todaysMood, setTodaysMood] = useState<MoodEntry | null>(null);
  const [partnerMood, setPartnerMood] = useState<MoodEntry | null>(null);
  const [isBibleReaderOpen, setIsBibleReaderOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [actualQuestionsAnswered, setActualQuestionsAnswered] = useState(0);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);

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

  const calculateTimeTogether = () => {
    let startDate: Date | null = null;
    
    // First check profile.relationshipStart (set when partners link)
    if (profile?.relationshipStart) {
      startDate = new Date(profile.relationshipStart);
    }
    // Then check coupleData.relationshipStartDate (legacy)
    else if (coupleData.relationshipStartDate) {
      startDate = new Date(coupleData.relationshipStartDate);
    }
    // Fallback to account creation date
    else if (profile?.createdAt) {
      startDate = new Date(profile.createdAt);
    }
    
    if (!startDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  };

  // Add state for time together that updates every second
  const [timeTogether, setTimeTogether] = useState(calculateTimeTogether());

  // Recalculate time together when profile or coupleData changes
  useEffect(() => {
    setTimeTogether(calculateTimeTogether());
  }, [profile?.relationshipStart, coupleData.relationshipStartDate, profile?.createdAt]);

  useEffect(() => {
    // Update time together every second
    const interval = setInterval(() => {
      setTimeTogether(calculateTimeTogether());
    }, 1000);
    return () => clearInterval(interval);
  }, [profile?.relationshipStart, coupleData.relationshipStartDate, profile?.createdAt]);

  // Fetch total questions count from backend
  useEffect(() => {
    const fetchQuestionsData = async () => {
      try {
        // Fetch all questions from backend
        const { questions: allQuestions } = await questionsApi.list();
        setTotalQuestionsCount(allQuestions.length);
        
        // Calculate answered count for logging
        const uniqueQuestions = new Set(
          responses.user.map(r => r.questionId.split(':prompt:')[0])
        );
        const answeredCount = uniqueQuestions.size;
        
        console.log('[CoupleDashboard] Questions data synced:', {
          totalQuestions: allQuestions.length,
          answeredByUser: answeredCount
        });
      } catch (error) {
        console.error('Error fetching questions count:', error);
      }
    };

    if (profile?.id) {
      fetchQuestionsData();
      // Poll for new questions every 30 seconds
      const interval = setInterval(fetchQuestionsData, 30000);
      return () => clearInterval(interval);
    }
  }, [profile?.id, responses.user]);

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
      } catch (error) {
        console.error('Error fetching milestones:', error);
      }
    };

    if (profile?.id) {
      fetchMilestones();
      // Poll for partner milestone updates every 15 seconds
      const interval = setInterval(fetchMilestones, 15000);
      return () => clearInterval(interval);
    }
  }, [profile?.id, partner?.id]);

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
      } catch (error) {
        console.warn('Could not fetch moods - non-critical feature:', error);
        // Silently fail for moods - this is a nice-to-have feature
      }
    };

    if (profile?.id) {
      fetchMoods();
      // Poll for partner mood updates every 10 seconds
      const interval = setInterval(fetchMoods, 10000);
      return () => clearInterval(interval);
    }
  }, [profile?.id, partner?.id]);

  // Auto-check for weekly mood report (only if user has a partner)
  useEffect(() => {
    const checkWeeklyReport = async () => {
      if (!profile?.id || !partner?.id) return;
      
      try {
        // Check if we've sent a report in the last 7 days
        const lastReportCheck = localStorage.getItem(`lastMoodReport:${profile.id}`);
        const now = Date.now();
        
        // If no previous report or last report was more than 7 days ago
        if (!lastReportCheck || now - parseInt(lastReportCheck) > 7 * 24 * 60 * 60 * 1000) {
          console.log('[WeeklyMoodReport] Auto-generating weekly mood report...');
          
          // Try to generate the report
          await moodsApi.generateWeeklyReport();
          
          // Store the timestamp
          localStorage.setItem(`lastMoodReport:${profile.id}`, now.toString());
          
          console.log('[WeeklyMoodReport] Weekly report generated successfully!');
        }
      } catch (error: any) {
        // Silently fail - this is a background task
        console.log('[WeeklyMoodReport] Could not auto-generate report:', error.message);
      }
    };

    // Check on mount and then once per day
    checkWeeklyReport();
    const interval = setInterval(checkWeeklyReport, 24 * 60 * 60 * 1000); // Check once per day
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
    <div className="space-y-6">
      {/* Couple Header */}
      <Card className="overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 opacity-50" />
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
              <Avatar className="w-20 h-20 border-4 border-white shadow-xl ring-2 ring-rose-200">
                <AvatarImage src={profile?.profilePicture} alt={profile?.name} />
                <AvatarFallback className="bg-gradient-to-br from-rose-400 to-pink-500 text-white text-xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium mt-2">{profile?.name || 'You'}</p>
            </div>

            {/* Heart Connector */}
            <div className="relative">
              <div className="flex flex-col items-center">
                <Heart className={`w-10 h-10 ${partner ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-gray-300'} transition-all mb-2`} />
                {partner && timeTogether.days > 0 && (
                  <div className="bg-white px-3 py-2 rounded-lg shadow-md border border-rose-200">
                    <div className="text-center">
                      <p className="text-base font-bold text-rose-600">
                        {timeTogether.days}
                      </p>
                      <p className="text-xs text-rose-500">
                        {timeTogether.days === 1 ? 'day' : 'days'}
                      </p>
                      <Separator className="my-1" />
                      <p className="text-xs font-semibold text-rose-600">
                        {String(timeTogether.hours).padStart(2, '0')}:{String(timeTogether.minutes).padStart(2, '0')}:{String(timeTogether.seconds).padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Partner Avatar */}
            <div className="flex flex-col items-center">
              <Avatar className="w-20 h-20 border-4 border-white shadow-xl ring-2 ring-blue-200">
                {partner ? (
                  <>
                    <AvatarImage src={partner.profilePicture} alt={partner.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xl">
                      {partnerInitials}
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-gray-100 text-gray-400">
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
              <h2 className="text-xl font-semibold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                {profile?.name} & {partner.name}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Growing together in faith
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">Connect with your partner to begin your journey together</p>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onNavigate?.('profile')}
                className="bg-white/80 backdrop-blur-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Add Partner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Devotional Streak */}
        <Card 
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate?.('devotions')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-purple-700">Devotional Streak</p>
                <p className="text-3xl font-bold text-purple-900">{devotionalStreakValue}</p>
                <p className="text-xs text-purple-600">{devotionalStreakValue === 1 ? 'day' : 'days'}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Journal Entries */}
        <Card 
          className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate?.('journal')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-rose-700">Journal Entries</p>
                <p className="text-3xl font-bold text-rose-900">{sharedJournalEntries}</p>
                <p className="text-xs text-rose-600">shared</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-rose-200 flex items-center justify-center">
                <BookHeart className="w-6 h-6 text-rose-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prayers */}
        <Card 
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onNavigate?.('prayer')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-blue-700">Prayers</p>
                <p className="text-3xl font-bold text-blue-900">{answeredPrayers}/{totalPrayers}</p>
                <p className="text-xs text-blue-600">answered</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                <HandHeart className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card 
          className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onScreenNavigate?.('category-selection')}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-green-700">Questions</p>
                <p className="text-3xl font-bold text-green-900">{questionsAnswered}/{totalQuestionsCount}</p>
                <p className="text-xs text-green-600">answered</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                <MessageCircleHeart className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Bible Verse */}
      <Card 
        className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-200 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setIsBibleReaderOpen(true)}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            Daily Verse
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingVerse ? (
            <div className="text-center py-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-amber-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-amber-200 rounded w-full"></div>
                <div className="h-4 bg-amber-200 rounded w-2/3 mx-auto"></div>
              </div>
            </div>
          ) : dailyVerse ? (
            <div className="space-y-3">
              <blockquote className="text-base italic text-gray-700 leading-relaxed border-l-4 border-amber-400 pl-4">
                "{dailyVerse.text}"
              </blockquote>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-amber-700">{dailyVerse.reference}</span>
                <span className="text-xs text-muted-foreground">{dailyVerse.translation}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('[CoupleDashboard] Read Full Chapter clicked, opening Bible reader');
                  console.log('[CoupleDashboard] Daily verse:', dailyVerse);
                  setIsBibleReaderOpen(true);
                }}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Read Full Chapter
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No verse available today</p>
          )}
        </CardContent>
      </Card>

      {/* Bible Reader Dialog */}
      {dailyVerse && (
        <BibleReaderDialog
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
                  <Heart className="w-5 h-5 text-pink-600" />
                  Today's Mood
                </CardTitle>
                <CardDescription>Share how you're feeling with your partner</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onScreenNavigate?.('mood-analytics')}
                className="gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                View Analytics
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Your Mood */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Your Mood</p>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-14 w-full ${todaysMood?.mood === 'great' ? 'bg-green-100 border-green-400' : ''}`}
                    onClick={() => handleMoodUpdate('great')}
                  >
                    <Smile className={`w-6 h-6 ${todaysMood?.mood === 'great' ? 'text-green-600' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-14 w-full ${todaysMood?.mood === 'good' ? 'bg-blue-100 border-blue-400' : ''}`}
                    onClick={() => handleMoodUpdate('good')}
                  >
                    <Smile className={`w-6 h-6 ${todaysMood?.mood === 'good' ? 'text-blue-600' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-14 w-full ${todaysMood?.mood === 'okay' ? 'bg-yellow-100 border-yellow-400' : ''}`}
                    onClick={() => handleMoodUpdate('okay')}
                  >
                    <Meh className={`w-6 h-6 ${todaysMood?.mood === 'okay' ? 'text-yellow-600' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-14 w-full ${todaysMood?.mood === 'sad' ? 'bg-gray-100 border-gray-400' : ''}`}
                    onClick={() => handleMoodUpdate('sad')}
                  >
                    <Frown className={`w-6 h-6 ${todaysMood?.mood === 'sad' ? 'text-gray-600' : 'text-gray-400'}`} />
                  </Button>
                </div>
                {!todaysMood && (
                  <p className="text-xs text-muted-foreground">Tap an emoji to set your mood</p>
                )}
              </div>

              {/* Partner's Mood */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">{partner.name}'s Mood</p>
                {partnerMood ? (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg h-14">
                    {partnerMood.mood === 'great' && <Smile className="w-8 h-8 text-green-600" />}
                    {partnerMood.mood === 'good' && <Smile className="w-8 h-8 text-blue-600" />}
                    {partnerMood.mood === 'okay' && <Meh className="w-8 h-8 text-yellow-600" />}
                    {partnerMood.mood === 'sad' && <Frown className="w-8 h-8 text-gray-600" />}
                    <div>
                      <p className="text-sm font-medium capitalize">{partnerMood.mood}</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-14 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Not set yet</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relationship Milestones */}
      {partner && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                Relationship Milestones
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
                    className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                      {milestone.icon === 'gift' && <Gift className="w-5 h-5 text-purple-600" />}
                      {milestone.icon === 'party' && <PartyPopper className="w-5 h-5 text-purple-600" />}
                      {milestone.icon === 'heart' && <Heart className="w-5 h-5 text-purple-600 fill-purple-600" />}
                      {milestone.icon === 'star' && <Star className="w-5 h-5 text-purple-600 fill-yellow-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{milestone.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{milestone.description}</p>
                      <p className="text-xs text-purple-600 mt-1">
                        {new Date(milestone.date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Your Journey Together
            </CardTitle>
            <CardDescription>Building a strong foundation in faith</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Devotionals Progress */}
            <div 
              className="space-y-2 cursor-pointer hover:bg-purple-50/50 p-2 rounded-lg transition-colors"
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
              className="space-y-2 cursor-pointer hover:bg-green-50/50 p-2 rounded-lg transition-colors"
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
              className="space-y-2 cursor-pointer hover:bg-rose-50/50 p-2 rounded-lg transition-colors"
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
                <BookHeart className="w-5 h-5 text-rose-600" />
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
                    ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50' 
                    : 'bg-rose-50/50 border-rose-200 hover:bg-rose-50'
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
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Continue your spiritual journey</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-auto flex-col gap-2 py-4"
            onClick={() => onNavigate?.('devotions')}
          >
            <Calendar className="w-6 h-6 text-purple-600" />
            <span className="text-sm">Daily Devotional</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto flex-col gap-2 py-4"
            onClick={() => onNavigate?.('journal')}
          >
            <BookHeart className="w-6 h-6 text-rose-600" />
            <span className="text-sm">Write Journal</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto flex-col gap-2 py-4"
            onClick={() => onNavigate?.('prayer')}
          >
            <HandHeart className="w-6 h-6 text-blue-600" />
            <span className="text-sm">Pray Together</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto flex-col gap-2 py-4"
            onClick={() => onNavigate?.('home')}
          >
            <MessageCircleHeart className="w-6 h-6 text-green-600" />
            <span className="text-sm">Answer Question</span>
          </Button>
        </CardContent>
      </Card>

      {/* Learning Modules */}
      <LearningModulesCard 
        onViewAll={() => onScreenNavigate?.('guidance')}
        accessToken={accessToken}
      />

      {/* Scripture Memory - NEW! */}
      <Card className="hover:shadow-md transition-shadow border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base">Scripture Memory</CardTitle>
            </div>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>
          <CardDescription>Memorize God's Word together</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Featured Verse</p>
            <p className="text-sm mb-2">"Love is patient and kind..."</p>
            <p className="text-xs text-purple-600">1 Corinthians 13:4</p>
          </div>
          <Button 
            variant="outline" 
            className="w-full border-purple-300 hover:bg-purple-50"
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