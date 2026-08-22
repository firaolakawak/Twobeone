import { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { AuthPage } from './components/AuthPage';
import { CoupleDashboard } from './components/CoupleDashboard';
import { NotificationCenter } from './components/NotificationCenter';
import { QuizzesHub } from './components/QuizzesHub';
import { PreMarriageHub } from './components/PreMarriageHub';
import { LessonScreen } from './components/LessonScreen';
import { DailyDevotionsFeed } from './components/DailyDevotionsFeed';
import { EnhancedJournal } from './components/EnhancedJournal';
import { PrayerBoard } from './components/PrayerBoard';
import { CommunityGroups } from './components/CommunityGroups';
import { GroupDetailScreen } from './components/GroupDetailScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { QuestionsSection } from './components/QuestionsSection';
import { ProgressSection } from './components/ProgressSection';
import { BottomNavigation } from './components/BottomNavigation';
import { FloatingActionButtons } from './components/FloatingActionButtons';
import { DevotionalDialog } from './components/DevotionalDialog';
import { RelationshipTimeline } from './components/RelationshipTimeline';
import { AdminPanel } from './components/AdminPanel';
import { CategorySelection } from './components/CategorySelection';
import { QADiscussionHub } from './components/QADiscussionHub';
import { DebugQuestions } from './components/DebugQuestions';
import { DebugResponses } from './components/DebugResponses';
import { TestingDashboard } from './components/TestingDashboard';
import { ScriptureMemory } from './components/ScriptureMemory';
import { Button } from './components/ui/button';
import { Heart, Loader2, AlertCircle } from 'lucide-react';
import { DailyQuestion } from './components/DailyQuestion';
import { createClient } from './utils/supabase/client';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { sendNotification } from './utils/notifications';
import { toast } from 'sonner@2.0.3';
import { Toaster } from './components/ui/sonner';
import api from './utils/api';
import type { JournalEntry, PrayerRequest, Progress, QuestionResponse, User as UserType } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedScreen, setSelectedScreen] = useState<string | null>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserType | null>(null);
  const [partner, setPartner] = useState<UserType | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [responses, setResponses] = useState<{ user: QuestionResponse[], partner: QuestionResponse[] }>({ user: [], partner: [] });
  const [devotionalStreak, setDevotionalStreak] = useState(0);
  const [isDevotionalCompletedToday, setIsDevotionalCompletedToday] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedDevotionalId, setSelectedDevotionalId] = useState<string | null>(null);
  const [isDevotionalOpen, setIsDevotionalOpen] = useState(false);
  const [selectedQACategory, setSelectedQACategory] = useState<string | null>(null);
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [todaysDevotional, setTodaysDevotional] = useState<any | null>(null);
  
  // TEMPORARILY DISABLED - devotional system being migrated to API
  // const devotional = getTodaysDevotional();

  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        const supabase = createClient();
        
        // Try to get existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setIsLoading(false);
          return;
        }

        if (session?.access_token) {
          console.log('Found existing session, access token length:', session.access_token.length);
          setUser(session.user);
          setAccessToken(session.access_token);
          await loadUserData(session.access_token);
        } else {
          console.log('No existing session found');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Init auth error:', error);
        setLoadError('Failed to initialize authentication');
        setIsLoading(false);
      }
    };

    // Initialize auth
    initAuth();

    // Set up token refresh listener
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[App] Auth state changed:', event, 'Session exists:', !!session);
      
      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        console.log('[App] Token refreshed, updating access token');
        setUser(session.user);
        setAccessToken(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        console.log('[App] User signed out');
        setUser(null);
        setAccessToken(null);
      } else if (event === 'SIGNED_IN' && session?.access_token) {
        console.log('[App] User signed in');
        setUser(session.user);
        setAccessToken(session.access_token);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && accessToken) {
      loadUserData();
    }
  }, [user, accessToken]);

  // Poll for notifications to show real-time toasts
  useEffect(() => {
    if (!user || !accessToken) return;

    let lastNotificationCheck = new Date().toISOString();
    let lastProfileCheck: string | null = null;
    
    const checkForNewNotifications = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/notifications`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        // Silently handle auth errors (user might be logged out)
        if (response.status === 401) {
          console.log('[App] Notifications check: Not authorized (user may be logged out)');
          return;
        }

        if (response.ok) {
          const { notifications } = await response.json();
          
          // Find new unread notifications since last check
          const newNotifications = notifications.filter((n: any) => 
            !n.read && 
            new Date(n.createdAt) > new Date(lastNotificationCheck)
          );

          // Show toast for each new notification
          newNotifications.forEach((notification: any) => {
            if (notification.type === 'verse_shared') {
              toast.success(
                `${notification.data?.sharedBy || 'Your partner'} shared a verse with you!`,
                {
                  description: notification.data?.reference,
                  duration: 5000
                }
              );
            } else if (notification.type === 'profile_update' && notification.data?.relationshipStart) {
              // Handle relationship start date notification
              const date = new Date(notification.data.relationshipStart).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              });
              toast.success(
                '💕 Relationship Date Set!',
                {
                  description: `Your partner set your relationship start date to ${date}`,
                  duration: 6000
                }
              );
            } else if (notification.type === 'mood_report') {
              // Handle weekly mood report notification
              toast.success(
                notification.title,
                {
                  description: `${notification.data?.period || 'Your weekly mood report is ready!'}`,
                  duration: 8000
                }
              );
            } else {
              toast.info(notification.title, {
                description: notification.message.substring(0, 100),
                duration: 4000
              });
            }
          });

          // Update last check time
          if (newNotifications.length > 0) {
            lastNotificationCheck = new Date().toISOString();
          }
        }
      } catch (err: any) {
        // Only log actual errors, not auth/network issues
        if (err.message !== 'Failed to fetch') {
          console.error('[App] Failed to check notifications:', err);
        }
      }
    };

    const checkForProfileUpdates = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.status === 401) {
          return; // User logged out
        }

        if (response.ok) {
          const { profile: updatedProfile } = await response.json();
          
          // Check if profile.updatedAt has changed (indicating a profile update)
          if (updatedProfile?.updatedAt) {
            if (lastProfileCheck && lastProfileCheck !== updatedProfile.updatedAt) {
              console.log('[App] Profile updated detected, reloading data...');
              
              // Check if relationshipStart specifically changed
              const oldRelationshipStart = profile?.relationshipStart;
              const newRelationshipStart = updatedProfile.relationshipStart;
              
              if (oldRelationshipStart !== newRelationshipStart && newRelationshipStart) {
                console.log('[App] 💕 Relationship start date changed!', {
                  old: oldRelationshipStart,
                  new: newRelationshipStart
                });
              }
              
              // Reload all user data to get the latest profile including relationshipStart
              await loadUserData();
            }
            lastProfileCheck = updatedProfile.updatedAt;
          }
        }
      } catch (err: any) {
        // Silently fail - this is background polling
        if (err.message !== 'Failed to fetch') {
          console.error('[App] Failed to check profile updates:', err);
        }
      }
    };

    // Check immediately
    checkForNewNotifications();
    checkForProfileUpdates();

    // Poll every 15 seconds
    const interval = setInterval(() => {
      checkForNewNotifications();
      checkForProfileUpdates();
    }, 15000);
    return () => clearInterval(interval);
  }, [user, accessToken]);

  const loadUserData = async (token?: string) => {
    const authToken = token || accessToken;
    
    if (!authToken || !user) {
      console.log('[App] No access token or user available, skipping data load');
      return;
    }
    
    try {
      console.log('[App] Loading user data with new API service...');
      
      // Load profile using API service
      const profileData = await api.profile.get();
      console.log('[App] Profile data loaded successfully:', profileData);
      setProfile(profileData.profile || null);
      setPartner(profileData.partner || null);
      setLoadError(null);

      // Load journal entries
      try {
        console.log('[App] Loading journal entries...');
        const journalData = await api.journal.list();
        console.log('[App] Journal data received:', journalData);
        setJournalEntries(journalData.entries || []);
      } catch (err: any) {
        console.error('[App] Failed to load journal:', err);
        // Show a toast notification with the specific error
        if (err.message?.includes('timeout')) {
          toast.error('Journal loading timed out. You may have a lot of entries. Trying to load them in the background...');
          // Retry in the background with a delay
          setTimeout(async () => {
            try {
              const journalData = await api.journal.list();
              setJournalEntries(journalData.entries || []);
              toast.success('Journal entries loaded successfully!');
            } catch (retryErr) {
              console.error('[App] Retry failed to load journal:', retryErr);
            }
          }, 2000);
        } else {
          toast.error(`Failed to load journal: ${err.message || 'Unknown error'}`);
        }
        // Don't throw - continue loading other data
      }

      // Load prayers
      try {
        const prayerData = await api.prayer.list();
        setPrayers(prayerData.prayers || []);
      } catch (err) {
        console.error('[App] Failed to load prayers:', err);
        // Don't throw - continue loading other data
      }

      // Load milestones
      try {
        const milestonesData = await api.milestones.list();
        setMilestones(milestonesData.milestones || []);
      } catch (err) {
        console.error('[App] Failed to load milestones:', err);
        // Don't throw - continue loading other data
      }

      // Load question responses
      try {
        const responsesData = await api.questions.getResponses();
        setResponses({
          user: responsesData.userResponses || [],
          partner: responsesData.partnerResponses || []
        });
      } catch (err) {
        console.error('[App] Failed to load responses:', err);
        // Don't throw - continue loading other data
      }

      // Load devotionals from backend
      try {
        const devotionsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotions`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );
        
        if (devotionsResponse.ok) {
          const { devotions } = await devotionsResponse.json();
          console.log('[App] Devotionals loaded:', devotions?.length || 0);
          setDevotionals(devotions || []);
        }
      } catch (err) {
        console.error('[App] Failed to load devotionals:', err);
        // Don't throw - continue loading other data
      }

      // Load devotional streak
      try {
        const streaksResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/streaks`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );
        
        if (streaksResponse.ok) {
          const { streaks } = await streaksResponse.json();
          console.log('[App] Streaks loaded:', streaks);
          const devotionalStreakData = streaks?.find((s: any) => s.streak_type === 'devotional');
          console.log('[App] Devotional streak data:', devotionalStreakData);
          const streakValue = devotionalStreakData?.current_streak || 0;
          console.log('[App] Setting devotional streak to:', streakValue);
          setDevotionalStreak(streakValue);
        }
      } catch (err) {
        console.error('[App] Failed to load streaks:', err);
        // Don't throw - continue loading other data
      }

      // Check if today's devotional is completed
      // TEMPORARILY DISABLED - awaiting full devotional API migration
      /*
      try {
        const completionsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotional-completions`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );
        
        console.log('[App] Devotional completions response status:', completionsResponse.status);
        
        if (completionsResponse.ok) {
          const { completions } = await completionsResponse.json();
          console.log('[App] Devotional completions loaded:', completions);
          console.log('[App] Current devotional ID:', devotional.id);
          
          const today = new Date().toISOString().split('T')[0];
          console.log('[App] Today date:', today);
          
          // Check if there's a completion for today with any devotional
          // The key format is now: completion:${userId}:${today}:${devotion_id}
          const todayCompletion = completions?.find((c: any) => {
            if (!c.completedAt) return false;
            try {
              const completionDate = new Date(c.completedAt).toISOString().split('T')[0];
              const matchesDate = completionDate === today;
              const matchesDevotional = c.devotionId === devotional.id;
              console.log('[App] Checking completion:', { 
                devotionId: c.devotionId, 
                completionDate, 
                matchesDate,
                matchesDevotional,
                matches: matchesDate && matchesDevotional
              });
              return matchesDate && matchesDevotional;
            } catch (err) {
              console.error('[App] Invalid completion date:', c.completedAt);
              return false;
            }
          });
          
          console.log('[App] Today completion found:', !!todayCompletion);
          console.log('[App] Setting isDevotionalCompletedToday to:', !!todayCompletion);
          setIsDevotionalCompletedToday(!!todayCompletion);
        } else {
          console.error('[App] Completions fetch failed with status:', completionsResponse.status);
          // On error, default to false (not completed)
          setIsDevotionalCompletedToday(false);
        }
      } catch (err) {
        console.error('[App] Failed to load devotional completions:', err);
        // On error, default to false (not completed)
        setIsDevotionalCompletedToday(false);
      }
      */

      // Note: Progress and user groups routes don't exist yet in backend
      // We'll add them later or use mock data for now
      
    } catch (error: any) {
      console.error('[App] Failed to load user data:', error);
      const errorMsg = error.message || 'Failed to load user data';
      setLoadError(errorMsg);
      
      // Don't show error toast for auth errors - these are expected during initial load
      if (!errorMsg.includes('401') && !errorMsg.includes('Unauthorized')) {
        toast.error(errorMsg);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
      setProfile(null);
      setPartner(null);
      setJournalEntries([]);
      setPrayers([]);
      setProgress(null);
      setResponses({ user: [], partner: [] });
      setShowAdmin(false);
    } catch (error) {
      console.error('Sign out error:', error);
      setLoadError(`Sign out error: ${error}`);
      toast.error(`Sign out error: ${error}`);
    }
  };

  const handleAddJournalEntry = async (entry: { title: string; content: string; isShared: boolean }) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/journal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(entry)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Journal entry creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to add journal entry');
      }

      const { entry: newEntry } = await response.json();
      
      // Add the new entry to local state immediately for instant UI feedback
      setJournalEntries(prev => [newEntry, ...prev]);
      
      // Refetch only journal entries (not all data) for consistency
      try {
        const journalData = await api.journal.list();
        setJournalEntries(journalData.entries || []);
      } catch (err) {
        console.error('[App] Failed to refetch journal entries:', err);
      }
      
      // Update progress
      if (progress) {
        await updateProgress({ journalEntries: progress.journalEntries + 1 });
      }

      // Notify partner if entry is shared
      if (entry.isShared && profile?.partnerId && accessToken) {
        await sendNotification({
          recipientId: profile.partnerId,
          type: 'journal',
          title: `${profile.name} added a new journal entry`,
          message: `"${entry.title}" - Check it out in the Journal tab!`,
          data: { entryTitle: entry.title },
          accessToken,
          projectId
        });
      }
    } catch (error) {
      console.error('Failed to add journal entry:', error);
      throw error;
    }
  };

  const handleUpdateJournalEntry = async (id: string, updates: any) => {
    try {
      console.log('[App] Updating journal entry:', id, updates);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/journal/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[App] Journal update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update journal entry');
      }

      const { entry: updatedEntry } = await response.json();
      console.log('[App] Journal entry updated successfully:', updatedEntry);
      
      // Update local state immediately
      setJournalEntries(prev => 
        prev.map(e => e.id === id ? updatedEntry : e)
      );

      // Refetch only journal entries for consistency
      try {
        const journalData = await api.journal.list();
        setJournalEntries(journalData.entries || []);
      } catch (err) {
        console.error('[App] Failed to refetch journal entries:', err);
      }
    } catch (error: any) {
      console.error('[App] Failed to update journal entry:', error);
      toast.error(error.message || 'Failed to update journal entry');
      throw error;
    }
  };

  const handleDeleteJournalEntry = async (id: string) => {
    try {
      console.log('[App] Starting delete for entry:', id);
      console.log('[App] Current entries before delete:', journalEntries.length);
      
      // Check if this is a partner's entry
      const entryToDelete = journalEntries.find(e => e.id === id);
      if (entryToDelete && (entryToDelete as any).isPartner) {
        console.error('[App] Cannot delete partner entry');
        toast.error("You can't delete your partner's entries");
        return;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/journal/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const result = await response.json();
      console.log('[App] Delete response:', { ok: response.ok, status: response.status, result });

      if (!response.ok) {
        console.error('[App] Delete failed:', result);
        
        // Show user-friendly error message
        if (result.error === 'Entry not found') {
          toast.error("This entry cannot be deleted. It may belong to your partner.");
        } else {
          toast.error(result.error || 'Failed to delete journal entry');
        }
        return;
      }

      console.log('[App] Delete successful, updating local state...');

      // Immediately remove from local state for instant feedback
      setJournalEntries(prev => {
        const filtered = prev.filter(entry => entry.id !== id);
        console.log('[App] Filtered entries:', filtered.length, 'removed:', prev.length - filtered.length);
        return filtered;
      });
      
      toast.success('Entry deleted!');
      
      // Wait a bit before refetching to ensure backend is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then refetch to ensure consistency
      console.log('[App] Refetching journal entries...');
      try {
        const journalData = await api.journal.list();
        console.log('[App] Refetched entries:', journalData.entries?.length || 0);
        
        // Double check the deleted entry is not in the refetched data
        const stillExists = journalData.entries?.find((e: any) => e.id === id);
        if (stillExists) {
          console.error('[App] ⚠️ WARNING: Deleted entry still exists in refetched data!', stillExists);
        } else {
          console.log('[App] ✅ Confirmed: Entry successfully deleted');
        }
        
        setJournalEntries(journalData.entries || []);
      } catch (err) {
        console.error('[App] Failed to refetch journal entries after delete:', err);
        // Don't update state if refetch fails - keep the optimistic update
      }
    } catch (error: any) {
      console.error('[App] Failed to delete journal entry:', error);
      toast.error(error.message || 'Failed to delete journal entry');
      // Refetch to restore correct state
      try {
        const journalData = await api.journal.list();
        setJournalEntries(journalData.entries || []);
      } catch (err) {
        console.error('[App] Failed to restore state after delete error:', err);
      }
    }
  };

  const handleAddPrayer = async (prayer: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/prayer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(prayer)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add prayer');
      }

      await loadUserData();
      
      // Update progress
      if (progress) {
        await updateProgress({ prayerRequests: progress.prayerRequests + 1 });
      }

      // Notify partner
      if (profile?.partnerId && accessToken) {
        await sendNotification({
          recipientId: profile.partnerId,
          type: 'prayer',
          title: `${profile.name} added a prayer request`,
          message: `"${prayer.title}" - Join them in prayer!`,
          data: { prayerTitle: prayer.title },
          accessToken,
          projectId
        });
      }
    } catch (error) {
      console.error('Failed to add prayer:', error);
      throw error;
    }
  };

  const handleUpdatePrayer = async (id: string, updates: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/prayer/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update prayer error response:', errorData);
        throw new Error(errorData.error || 'Failed to update prayer');
      }

      await loadUserData();
    } catch (error) {
      console.error('Failed to update prayer:', error);
      throw error;
    }
  };

  const handleDeletePrayer = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/prayer/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete prayer');
      }

      await loadUserData();
    } catch (error) {
      console.error('Failed to delete prayer:', error);
      throw error;
    }
  };

  const handleMarkPrayed = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/prayer/${id}/pray`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark prayer as prayed');
      }

      await loadUserData();
      toast.success('Marked as prayed! 🙏');
    } catch (error) {
      console.error('Failed to mark prayer as prayed:', error);
      toast.error('Failed to mark as prayed');
      throw error;
    }
  };

  const handleAddMilestone = async (milestone: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/milestone`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(milestone)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add milestone');
      }

      await loadUserData();
    } catch (error) {
      console.error('Failed to add milestone:', error);
      throw error;
    }
  };

  const handleUpdateMilestone = async (id: string, updates: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/milestone/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update milestone');
      }

      await loadUserData();
    } catch (error) {
      console.error('Failed to update milestone:', error);
      throw error;
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/milestone/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete milestone');
      }

      await loadUserData();
    } catch (error) {
      console.error('Failed to delete milestone:', error);
      throw error;
    }
  };

  const handleSaveQuestionResponse = async (questionId: string, answers: Record<string, string | string[] | number>) => {
    try {
      console.log('[App] Saving question response:', { questionId, answers });
      
      const responseData = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/questions/${questionId}/responses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ answers })
        }
      );

      console.log('[App] Question response save status:', responseData.status);

      if (!responseData.ok) {
        const errorText = await responseData.text();
        console.error('[App] Failed to save response - Status:', responseData.status);
        console.error('[App] Failed to save response - Error:', errorText);
        throw new Error(`Failed to save response (${responseData.status}): ${errorText}`);
      }

      const result = await responseData.json();
      console.log('[App] Question response saved successfully:', result);
      toast.success('Answer saved successfully!');
    } catch (error: any) {
      console.error('[App] Failed to save response:', error);
      toast.error('Failed to save answer');
      throw error;
    }
  };

  const handleCompleteDevotional = async () => {
    // TEMPORARILY DISABLED - devotional completion tracking needs API migration
    toast.info('Devotional completion tracking is being updated. Check back soon!');
    return;
    /*
    try {
      console.log('[App] Marking devotional as complete:', devotional.id);
      console.log('[App] Current streak before completion:', devotionalStreak);
      console.log('[App] Current isDevotionalCompletedToday:', isDevotionalCompletedToday);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotional-completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            devotion_id: devotional.id,
            notes: null
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[App] Failed to mark complete - Status:', response.status);
        console.error('[App] Failed to mark complete - Error:', errorText);
        throw new Error('Failed to mark devotional as complete');
      }

      const result = await response.json();
      console.log('[App] Devotional marked complete:', result);

      // Immediately update completion status
      setIsDevotionalCompletedToday(true);

      // Wait a moment for the backend to update the streak
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch the updated streak directly
      try {
        const streaksResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/streaks`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
        
        if (streaksResponse.ok) {
          const { streaks } = await streaksResponse.json();
          console.log('[App] Updated streaks loaded:', streaks);
          const devotionalStreakData = streaks?.find((s: any) => s.streak_type === 'devotional');
          console.log('[App] Updated devotional streak data:', devotionalStreakData);
          const streakValue = devotionalStreakData?.current_streak || 0;
          console.log('[App] Setting devotional streak to:', streakValue);
          setDevotionalStreak(streakValue);
        }
      } catch (err) {
        console.error('[App] Failed to reload streak:', err);
      }

      // Reload all user data
      console.log('[App] Reloading user data to get updated streak...');
      await loadUserData();
      
      console.log('[App] After reload - new streak:', devotionalStreak);
      
      toast.success('Devotional completed! 🎉');
    } catch (error) {
      console.error('[App] Failed to complete devotional:', error);
      toast.error('Failed to mark as complete');
    }
    */
  };

  const updateProgress = async (updates: Partial<Progress>) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/progress`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      await loadUserData();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  if (isLoading) {
    return (
      <SplashScreen 
        onComplete={() => setShowSplash(false)}
        checkingAuth={true}
        authStatus="checking"
      />
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={(token) => {
      setUser(token);
      setShowSplash(true);
    }} />;
  }

  const isDevotionalCompleted = progress && progress.lastActiveDate && 
    new Date(progress.lastActiveDate).toDateString() === new Date().toDateString();

  // Sample data for new components
  const guidanceModules = [
    { id: '1', title: "God's Design for Marriage", subtitle: 'Biblical Foundations', progress: 85 },
    { id: '2', title: 'Communication & Conflict', subtitle: 'Active Listening', progress: 60 },
    { id: '3', title: 'Roles & Responsibility', subtitle: 'Partnership in Christ', progress: 25 },
  ];

  const reflectionPrompts = [
    "What is one way you can show Christ's love to your partner today?",
    "How has God been working in your relationship this week?",
    "What are you most grateful for about your partner?",
  ];

  const todaysPrompt = reflectionPrompts[new Date().getDate() % reflectionPrompts.length];

  const handleMoodSelect = (mood: string) => {
    console.log('Mood selected:', mood);
    toast.success('Mood recorded!');
  };

  // Check if user is admin (you can change this to any admin email)
  const isAdmin = profile?.email === 'admin@twobeone.com' || profile?.email?.includes('admin');

  // Testing Dashboard - accessible via URL parameter or settings
  if (selectedScreen === 'testing') {
    return <TestingDashboard onBack={() => setSelectedScreen('home')} />;
  }

  // If user is admin and navigating to admin panel
  if (isAdmin && selectedScreen === 'admin') {
    return (
      <AdminPanel 
        onSignOut={handleSignOut} 
        accessToken={accessToken || undefined}
        onBackToHome={() => setSelectedScreen('dashboard')}
      />
    );
  }

  // Debug screen for troubleshooting questions
  if (selectedScreen === 'debug-questions') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="pt-11 pb-28">
          <div className="max-w-6xl mx-auto px-4">
            <Button
              onClick={() => setSelectedScreen('dashboard')}
              variant="outline"
              className="mb-4"
            >
              ← Back to Dashboard
            </Button>
            <DebugQuestions />
          </div>
        </div>
      </div>
    );
  }

  // Debug screen for troubleshooting responses
  if (selectedScreen === 'debug-responses') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="pt-11 pb-28">
          <div className="max-w-6xl mx-auto px-4">
            <Button
              onClick={() => setSelectedScreen('dashboard')}
              variant="outline"
              className="mb-4"
            >
              ← Back to Dashboard
            </Button>
            <DebugResponses />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Safe area top: 44px iOS / 32px Android */}
      <div className="pt-11 pb-28">
        {/* Max content width 90% with 16dp horizontal padding */}
        <div className="max-w-6xl mx-auto px-4">
          <Toaster />

          {/* Notification Center - Fixed position */}
          {user && (
            <div className="fixed top-4 right-4 z-50">
              <NotificationCenter
                accessToken={accessToken}
                projectId={projectId}
                publicAnonKey={publicAnonKey}
                onNotificationClick={(notification) => {
                  // Handle notification clicks - navigate to relevant screen
                  if (notification.type === 'devotional') {
                    // If it's a prayer chat notification, open the specific devotional
                    if (notification.data?.devotionId) {
                      setActiveTab('devotions');
                      // Small delay to ensure tab is switched before opening devotional
                      setTimeout(() => {
                        setIsDevotionalOpen(true);
                      }, 100);
                    } else {
                      setActiveTab('devotions');
                    }
                  } else if (notification.type === 'journal') {
                    setActiveTab('journal');
                  } else if (notification.type === 'prayer') {
                    setActiveTab('prayer');
                  } else if (notification.type === 'question' || notification.type === 'question_answered') {
                    setActiveTab('home');
                    setSelectedScreen('qa-hub');
                  } else if (notification.type === 'mood_report') {
                    setActiveTab('home');
                    setSelectedScreen('mood-analytics');
                  }
                }}
              />
            </div>
          )}

          {/* Error Banner */}
          {loadError && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-3">
              <div className="container mx-auto max-w-6xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm text-red-900">Error Loading Profile</h3>
                    <p className="text-xs text-red-700 mt-1">{loadError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 text-xs" 
                      onClick={() => loadUserData()}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="container mx-auto px-4 py-6 max-w-2xl pb-24">
            {activeTab === 'home' && selectedScreen === 'dashboard' && (
              <CoupleDashboard 
                profile={profile || undefined}
                partner={partner || undefined}
                journalEntries={journalEntries}
                prayers={prayers}
                progress={progress || undefined}
                responses={responses}
                onNavigate={setActiveTab}
                onScreenNavigate={setSelectedScreen}
                accessToken={accessToken || undefined}
                devotionalStreak={devotionalStreak}
              />
            )}

            {activeTab === 'home' && selectedScreen === 'qa-hub' && (
              <DailyQuestion 
                accessToken={accessToken || ''}
                projectId={projectId}
                userProfile={profile}
                partner={partner}
                onPrayTogether={async () => {
                  try {
                    // Switch to prayer tab
                    setActiveTab('prayer');
                    setSelectedScreen('dashboard');
                    
                    toast.success('Opening Prayer Together...');
                  } catch (error) {
                    console.error('Failed to open prayer:', error);
                    toast.error('Failed to open prayer');
                  }
                }}
                onBack={() => setSelectedScreen('dashboard')}
              />
            )}

            {activeTab === 'home' && selectedScreen === 'quizzes' && user && profile && (
              <QuizzesHub 
                profile={profile}
                partner={partner || undefined}
                accessToken={accessToken}
                onBack={() => setSelectedScreen('dashboard')}
              />
            )}

            {activeTab === 'home' && selectedScreen === 'guidance' && (
              <PreMarriageHub 
                onModuleClick={(id) => {
                  setSelectedModuleId(id);
                  setSelectedLessonId('1');
                  setSelectedScreen('lesson');
                }}
                accessToken={accessToken}
              />
            )}

            {activeTab === 'home' && selectedScreen === 'lesson' && selectedModuleId && selectedLessonId && (
              <LessonScreen 
                moduleId={selectedModuleId}
                lessonId={selectedLessonId}
                onBack={() => setSelectedScreen('guidance')}
                accessToken={accessToken}
              />
            )}

            {activeTab === 'home' && selectedScreen === 'milestones' && (
              <RelationshipTimeline
                milestones={milestones}
                onAddMilestone={handleAddMilestone}
                onUpdateMilestone={handleUpdateMilestone}
                onDeleteMilestone={handleDeleteMilestone}
                userName={profile?.name}
                partnerName={partner?.name}
              />
            )}

            {/* Scripture Memory Screen */}
            {activeTab === 'home' && selectedScreen === 'scripture-memory' && (
              <ScriptureMemory
                onBack={() => setSelectedScreen('dashboard')}
                accessToken={accessToken || undefined}
                userName={profile?.name}
                partnerName={partner?.name}
              />
            )}

            {/* Mood Analytics Screen */}
            {activeTab === 'home' && selectedScreen === 'mood-analytics' && (
              <MoodAnalytics
                profile={profile || undefined}
                partner={partner || undefined}
                onClose={() => setSelectedScreen('dashboard')}
              />
            )}

            {activeTab === 'home' && selectedScreen === 'daily-question' && user && profile && (
              <DailyQuestion
                accessToken={accessToken}
                projectId={projectId}
                userProfile={profile}
                partner={partner || undefined}
                onPrayTogether={async () => {
                  // Add to prayer list
                  setActiveTab('prayer');
                  toast.success('Prayer time! 🙏');
                }}
                onBack={() => setSelectedScreen('dashboard')}
              />
            )}

            {/* Category Selection Screen */}
            {activeTab === 'home' && selectedScreen === 'category-selection' && (
              <CategorySelection
                onSelectCategory={(categoryId) => {
                  setSelectedQACategory(categoryId);
                  setSelectedScreen('qa-discussion');
                }}
                onBack={() => setSelectedScreen('dashboard')}
              />
            )}

            {/* Q&A Discussion Hub */}
            {activeTab === 'home' && selectedScreen === 'qa-discussion' && selectedQACategory && (
              <QADiscussionHub
                selectedCategory={selectedQACategory}
                onSaveAnswer={handleSaveQuestionResponse}
                onPrayTogether={async (question) => {
                  try {
                    // Switch to prayer tab
                    setActiveTab('prayer');
                    toast.success('Opening Prayer Together...');
                  } catch (error) {
                    console.error('Failed to open prayer:', error);
                    toast.error('Failed to open prayer');
                  }
                }}
                onBack={() => {
                  setSelectedScreen('category-selection');
                  setSelectedQACategory(null);
                }}
                userName={profile?.name}
                partnerName={partner?.name}
              />
            )}

            {activeTab === 'devotions' && (
              <DailyDevotionsFeed 
                onDevotionalClick={(id) => {
                  setSelectedDevotionalId(id);
                  setIsDevotionalOpen(true);
                }}
                accessToken={accessToken || undefined}
                projectId={projectId}
                onBackToHome={() => {
                  setActiveTab('home');
                  setSelectedScreen('dashboard');
                }}
              />
            )}

            {activeTab === 'journal' && (
              <EnhancedJournal 
                entries={journalEntries}
                onAddEntry={handleAddJournalEntry}
                onUpdateEntry={handleUpdateJournalEntry}
                onDeleteEntry={handleDeleteJournalEntry}
                userName={profile?.name}
                partnerName={partner?.name}
                userAvatar={profile?.profilePicture}
                partnerAvatar={partner?.profilePicture}
                accessToken={accessToken!}
                onBackToHome={() => {
                  setActiveTab('home');
                  setSelectedScreen('dashboard');
                }}
              />
            )}

            {activeTab === 'prayer' && (
              <PrayerBoard 
                prayers={prayers}
                onAddPrayer={handleAddPrayer}
                onUpdatePrayer={handleUpdatePrayer}
                onDeletePrayer={handleDeletePrayer}
                onMarkPrayed={handleMarkPrayed}
                onBackToHome={() => {
                  setActiveTab('home');
                  setSelectedScreen('dashboard');
                }}
              />
            )}

            {activeTab === 'community' && !selectedGroupId && (
              <CommunityGroups />
            )}

            {activeTab === 'community' && selectedGroupId && (
              <GroupDetailScreen 
                groupId={selectedGroupId}
                onBack={() => setSelectedGroupId(null)}
              />
            )}

            {activeTab === 'profile' && (
              <SettingsScreen
                profile={profile || undefined}
                partner={partner || undefined}
                onSignOut={handleSignOut}
                onUpdateProfile={async (data) => {
                  try {
                    console.log('[App] Updating profile with data:', data);
                    
                    const response = await fetch(
                      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile`,
                      {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${accessToken}`
                        },
                        body: JSON.stringify(data)
                      }
                    );

                    console.log('[App] Profile update response status:', response.status);

                    if (!response.ok) {
                      const errorData = await response.json();
                      console.error('[App] Profile update failed:', errorData);
                      throw new Error(errorData.error || 'Failed to update profile');
                    }

                    const result = await response.json();
                    console.log('[App] Profile update result:', result);

                    // Immediately reload to get the latest data
                    await loadUserData();
                    
                    // Show special message if relationshipStart was updated and user has a partner
                    if (data.relationshipStart && partner) {
                      toast.success('Profile updated! Your partner\'s relationship start date has been synced too. 💕');
                      console.log('[App] Relationship start date synced to partner:', data.relationshipStart);
                    } else {
                      toast.success('Profile updated successfully!');
                    }
                  } catch (error: any) {
                    console.error('Update profile error:', error);
                    toast.error(error.message || 'Failed to update profile');
                    throw error;
                  }
                }}
                accessToken={accessToken || ''}
                onRefresh={loadUserData}
                onNavigateToAdmin={isAdmin ? () => setSelectedScreen('admin') : undefined}
                onNavigateToDebug={() => setSelectedScreen('debug-questions')}
                onNavigateToDebugResponses={() => setSelectedScreen('debug-responses')}
                onNavigateToTesting={() => setSelectedScreen('testing')}
              />
            )}

            {activeTab === 'questions' && (
              <QuestionsSection
                responses={responses}
                onSaveResponse={handleSaveQuestionResponse}
              />
            )}

            {activeTab === 'progress' && progress && (
              <ProgressSection progress={progress} />
            )}
          </main>

          {/* Bottom Navigation */}
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Floating Action Buttons */}
          <FloatingActionButtons 
            onPrayClick={() => setActiveTab('prayer')}
          />

          {/* Devotional Dialog */}
          <DevotionalDialog
            devotional={(() => {
              // Find the selected devotional from the loaded devotionals
              if (selectedDevotionalId && devotionals.length > 0) {
                const found = devotionals.find(d => d.id === selectedDevotionalId);
                if (found) {
                  return {
                    id: found.id,
                    title: found.title || 'Daily Devotion',
                    verse: found.verse || '',
                    reference: found.reference || found.verseReference || '',
                    reflection: found.reflection || found.content || '',
                    prayer: found.prayerPrompt || '',
                    audioUrl: found.audioUrl
                  };
                }
              }
              // Fallback if no devotional found
              return {
                title: 'Daily Devotion',
                verse: '',
                reference: '',
                reflection: '',
                prayer: ''
              };
            })()}
            isOpen={isDevotionalOpen}
            onClose={() => setIsDevotionalOpen(false)}
            onComplete={handleCompleteDevotional}
            isCompleted={isDevotionalCompletedToday}
            accessToken={accessToken || undefined}
            projectId={projectId}
            currentUserId={profile?.id}
            currentUserName={profile?.name}
            partnerName={partner?.name}
          />
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { BookOpen, HandHeart, MessageCircleHeart, TrendingUp } from 'lucide-react';
import { CoupleProfile } from './components/CoupleProfile';
import { CoupleHeader } from './components/CoupleHeader';
import { DailyVerseCard } from './components/DailyVerseCard';
import { TodaysReflection } from './components/TodaysReflection';
import { RecentMilestones } from './components/RecentMilestones';
import { PreMarriageGuidance } from './components/PreMarriageGuidance';
import { MoodTracker } from './components/MoodTracker';
import { MoodAnalytics } from './components/MoodAnalytics';
import { QuestionsSection } from './components/QuestionsSection';
import { ProgressSection } from './components/ProgressSection';