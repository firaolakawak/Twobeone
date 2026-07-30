import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { SEOHead } from "./components/SEOHead";
import { LanguageProvider } from "./contexts/LanguageContext";
import { LanguageSelector } from "./components/LanguageSelector";
import { SplashScreen } from "./components/SplashScreen";
import { AuthPage } from "./components/AuthPage";
import { CoupleDashboard } from "./components/CoupleDashboard";
import { NotificationCenter } from "./components/NotificationCenter";
import { QuizzesHub } from "./components/QuizzesHub";
import { PreMarriageHub } from "./components/PreMarriageHub";
import { LessonScreen } from "./components/LessonScreen";
import { DailyDevotionsFeed } from "./components/DailyDevotionsFeed";
import { EnhancedJournal } from "./components/EnhancedJournal";
import { PrayerBoard } from "./components/PrayerBoard";
import { CommunityGroups } from "./components/CommunityGroups";
import { GroupDetailScreen } from "./components/GroupDetailScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { QuestionsSection } from "./components/QuestionsSection";
import { ProgressSection } from "./components/ProgressSection";
import { BottomNavigation } from "./components/BottomNavigation";
import { FloatingActionButtons } from "./components/FloatingActionButtons";
import { DevotionalDialog } from "./components/DevotionalDialog";
import { RelationshipTimeline } from "./components/RelationshipTimeline";
import { AdminPanel } from "./components/AdminPanel";
import { CategorySelection } from "./components/CategorySelection";
import { QADiscussionHub } from "./components/QADiscussionHub";
import { DebugQuestions } from "./components/DebugQuestions";
import { DebugResponses } from "./components/DebugResponses";
import { TestingDashboard } from "./components/TestingDashboard";
import { ScriptureMemory } from "./components/ScriptureMemory";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { PWAUpdateNotification } from "./components/PWAUpdateNotification";
import { IOSInstallPrompt } from "./components/IOSInstallPrompt";
import { PWADebugInfo } from "./components/PWADebugInfo";
import { IconsMissingNotice } from "./components/IconsMissingNotice";
import { InstallBanner } from "./components/InstallBanner";
import { Button } from "./components/ui/button";
import {
  Heart,
  Loader2,
  AlertCircle,
  BookOpen,
  HandHeart,
  MessageCircleHeart,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import { CoupleProfile } from "./components/CoupleProfile";
import { CoupleHeader } from "./components/CoupleHeader";
import { DailyVerseCard } from "./components/DailyVerseCard";
import { TodaysReflection } from "./components/TodaysReflection";
import { RecentMilestones } from "./components/RecentMilestones";
import { PreMarriageGuidance } from "./components/PreMarriageGuidance";
import { MoodTracker } from "./components/MoodTracker";
import { MoodAnalytics } from "./components/MoodAnalytics";
import { MarriageReadinessReport } from "./components/MarriageReadinessReport";
import { DailyQuestion } from "./components/DailyQuestion";
import { createClient } from "./utils/supabase/client";
import {
  projectId,
  publicAnonKey,
} from "./utils/supabase/info";
import { sendNotification } from "./utils/notifications";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";
import api, {
  warmUpServer,
  admin as adminApi,
} from "./utils/api";
import { registerServiceWorker } from "./utils/pwa";
import { InstallPrompt } from "./components/InstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { PWAWelcome } from "./components/PWAWelcome";
import { PWAUpdateAvailable } from "./components/PWAUpdateAvailable";
import { LegalFooter } from "./components/LegalFooter";
import { LandingPage } from "./components/LandingPage";
import type {
  JournalEntry,
  PrayerRequest,
  Progress,
  QuestionResponse,
  User as UserType,
} from "./types";

const QA_CATEGORY_LABELS: Record<string, string> = {
  "daily-life": "Daily Life & Habits",
  intimacy: "Intimacy & Lifestyle",
  "love-balance": "Love & Balance",
  "dream-wedding": "Dream Wedding / Dream Home",
  travel: "Travel & Adventure",
  boundaries: "Relationship Boundaries",
  trust: "Trust & Truth",
  "kids-future": "Kids & Future",
  finance: "Finance & Goals",
  family: "Family Relations",
  bible: "Bible Convictions",
} as const;

const GUIDANCE_MODULES = [
  {
    id: "1",
    title: "God's Design for Marriage",
    subtitle: "Biblical Foundations",
    progress: 85,
  },
  {
    id: "2",
    title: "Communication & Conflict",
    subtitle: "Active Listening",
    progress: 60,
  },
  {
    id: "3",
    title: "Roles & Responsibility",
    subtitle: "Partnership in Christ",
    progress: 25,
  },
] as const;

const REFLECTION_PROMPTS = [
  "What is one way you can show Christ's love to your partner today?",
  "How has God been working in your relationship this week?",
  "What are you most grateful for about your partner?",
] as const;

const APP_TRANSLATIONS: Record<
  string,
  Record<string, string>
> = {
  en: {
    loading: "Loading...",
    errorTitle: "Error Loading Profile",
    retry: "Retry",
    openingPrayer: "Opening Prayer Together... 🙏",
    prayerTime: "Prayer time! 🙏",
    profileSyncSuccess: "Profile updated! Syncing complete. 💕",
    profileSuccess: "Profile updated successfully!",
  },
  am: {
    loading: "በመጫን ላይ...",
    errorTitle: "መገለጫን መጫን አልተሳካም",
    retry: "እንደገና ሞክር",
    openingPrayer: "የጋራ ጸሎት በመክፈት ላይ... 🙏",
    prayerTime: "የጸሎት ጊዜ! 🙏",
    profileSyncSuccess: "መገለጫ ተዘምኗል! ማመሳሰል ተጠናቆአል። 💕",
    profileSuccess: "መገለጫ በትክክል ተዘምኗል!",
  },
  om: {
    loading: "Fe'amaa jira...",
    errorTitle: "Profaayilii fiduun hin danda'amne",
    retry: "Deebisii yaali",
    openingPrayer: "Kadhannaa waliinii banamaa jira... 🙏",
    prayerTime: "Yeroo kadhannaa! 🙏",
    profileSyncSuccess:
      "Profaayilii haaromeera! Syncing xumurameera. 💕",
    profileSuccess: "Profaayilii milkaa'inaan haaromeera!",
  },
};

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedScreen, setSelectedScreen] = useState<
    string | null
  >("dashboard");
  const [user, setUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    null,
  );
  const [profile, setProfile] = useState<UserType | null>(null);
  const [partner, setPartner] = useState<UserType | null>(null);
  const [journalEntries, setJournalEntries] = useState<
    JournalEntry[]
  >([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [progress, setProgress] = useState<Progress | null>(
    null,
  );
  const [selectedGroupId, setSelectedGroupId] = useState<
    string | null
  >(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(
    null,
  );
  const [responses, setResponses] = useState<{
    user: QuestionResponse[];
    partner: QuestionResponse[];
  }>({ user: [], partner: [] });
  const [devotionalStreak, setDevotionalStreak] = useState(0);
  const [
    isDevotionalCompletedToday,
    setIsDevotionalCompletedToday,
  ] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<
    string | null
  >(null);
  const [selectedLessonId, setSelectedLessonId] = useState<
    string | null
  >(null);
  const [selectedDevotionalId, setSelectedDevotionalId] =
    useState<string | null>(null);
  const [isDevotionalOpen, setIsDevotionalOpen] =
    useState(false);
  const [selectedQACategory, setSelectedQACategory] = useState<
    string | null
  >(null);
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [todaysDevotional, setTodaysDevotional] = useState<
    any | null
  >(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const currentLangCode =
    localStorage.getItem("twobeone_language") || "en";
  const vocabulary =
    APP_TRANSLATIONS[currentLangCode] || APP_TRANSLATIONS.en;

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .then((reg) => {
        console.log(
          "[PWA] Service Worker registered:",
          reg.scope,
        );
        if (reg.waiting)
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        reg.addEventListener("updatefound", () => {
          const w = reg.installing;
          if (w)
            w.addEventListener("statechange", () => {
              if (
                w.state === "installed" &&
                navigator.serviceWorker.controller
              )
                w.postMessage({ type: "SKIP_WAITING" });
            });
        });
      })
      .catch((err) => {
        if (!String(err).includes("SecurityError"))
          console.warn(
            "[PWA] Service Worker registration failed:",
            err,
          );
      });
  }, []);

  useEffect(() => {
    warmUpServer();
  }, []);

  useEffect(() => {
    const lang = localStorage.getItem("twobeone_language");
    if (lang === "am" || lang === "om") {
      const id = "ethiopic-font";
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href =
          "https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wdth,wght@75..125,100..900&display=swap";
        document.head.appendChild(link);
      }
    }
  }, []);

  const loadUserDataRef = useRef<
    ((token?: string) => Promise<void>) | null
  >(null);

  useEffect(() => {
    const supabase = createClient();

    const initAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("[App] Session error:", error);
          setIsInitializing(false);
          return;
        }
        if (session?.access_token) {
          console.log("[App] Restoring existing session");
          setUser(session.user);
          setAccessToken(session.access_token);
          setShowLanding(false);
          await loadUserDataRef.current?.(session.access_token);
        } else {
          console.log("[App] No existing session");
        }
      } catch (err) {
        console.error("[App] Init auth error:", err);
        setLoadError("Failed to initialize authentication");
      } finally {
        setIsInitializing(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(
          "[App] Auth state changed:",
          event,
          "has session:",
          !!session,
        );

        if (event === "SIGNED_IN" && session?.access_token) {
          setUser(session.user);
          setAccessToken(session.access_token);
          setShowLanding(false);
        } else if (
          event === "TOKEN_REFRESHED" &&
          session?.access_token
        ) {
          setUser(session.user);
          setAccessToken(session.access_token);
        } else if (event === "SIGNED_OUT") {
          const {
            data: { session: current },
          } = await supabase.auth.getSession();
          if (current?.access_token) {
            setUser(current.user);
            setAccessToken(current.access_token);
          } else {
            setUser(null);
            setAccessToken(null);
          }
        }
      },
    );

    initAuth();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadUserDataRef.current = loadUserData;
  });

  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (user && accessToken && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadUserData();
    }
    if (!user) {
      hasLoadedRef.current = false;
    }
  }, [user, accessToken]);

  // Scroll to top on every tab / screen change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab, selectedScreen]);

  useEffect(() => {
    if (activeTab === "questions" && accessToken) {
      api.questions
        .getResponses()
        .then((data) =>
          setResponses({
            user: data.userResponses || [],
            partner: data.partnerResponses || [],
          }),
        )
        .catch(() => {});
    }
  }, [activeTab]);

  const lastNotificationCheckRef = useRef(
    new Date().toISOString(),
  );
  const lastProfileCheckRef = useRef<string | null>(null);
  const lastPartnerCheckRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !accessToken) return;

    const checkForNewNotifications = async () => {
      try {
        const { notifications } =
          await api.notifications.list();
        const newNotifications = notifications.filter(
          (n: any) =>
            !n.read &&
            new Date(n.createdAt) >
              new Date(lastNotificationCheckRef.current),
        );

        newNotifications.forEach((notification: any) => {
          if (notification.type === "question_answered") {
            const categoryLabel =
              notification.data?.categoryLabel ?? "a question";
            const categoryId = notification.data?.categoryId;
            toast.success(
              notification.title || "💬 Your partner answered!",
              {
                description: `They answered in "${categoryLabel}". Tap to view.`,
                duration: 8000,
                action: categoryId
                  ? {
                      label: "Go there",
                      onClick: () => {
                        setActiveTab("home");
                        setSelectedQACategory(categoryId);
                        setSelectedScreen("qa-discussion");
                      },
                    }
                  : undefined,
              },
            );
          } else if (notification.type === "verse_shared") {
            toast.success(
              `${notification.data?.sharedBy || "Your partner"} shared a verse with you!`,
              {
                description: notification.data?.reference,
                duration: 5000,
              },
            );
          } else if (
            notification.type === "profile_update" &&
            notification.data?.relationshipStart
          ) {
            const date = new Date(
              notification.data.relationshipStart,
            ).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
            toast.success("💕 Relationship Date Set!", {
              description: `Your partner set your relationship start date to ${date}`,
              duration: 6000,
            });
          } else if (notification.type === "mood_report") {
            toast.success(notification.title, {
              description: `${notification.data?.period || "Your weekly mood report is ready!"}`,
              duration: 8000,
            });
          } else {
            toast.info(notification.title, {
              description: notification.message.substring(
                0,
                100,
              ),
              duration: 4000,
            });
          }
        });

        if (newNotifications.length > 0) {
          lastNotificationCheckRef.current =
            new Date().toISOString();
        }
      } catch (err: any) {
        if (
          err.message?.includes("timeout") ||
          err.message?.includes("Failed to fetch") ||
          err.message?.includes("Unable to connect") ||
          err.message?.includes("Unauthorized")
        ) {
          console.log(
            "[App] Notification check skipped:",
            err.message,
          );
        } else {
          console.error(
            "[App] Failed to check notifications:",
            err,
          );
        }
      }
    };

    const checkForProfileUpdates = async () => {
      if (selectedScreen === "admin") return;

      try {
        const {
          profile: updatedProfile,
          partner: updatedPartner,
        } = await api.profile.get();
        let needsReload = false;

        if (updatedProfile?.updatedAt) {
          if (
            lastProfileCheckRef.current &&
            lastProfileCheckRef.current !==
              updatedProfile.updatedAt
          ) {
            needsReload = true;
          }
          lastProfileCheckRef.current =
            updatedProfile.updatedAt;
        }

        if (updatedPartner?.updatedAt) {
          if (
            lastPartnerCheckRef.current &&
            lastPartnerCheckRef.current !==
              updatedPartner.updatedAt
          ) {
            needsReload = true;
          }
          lastPartnerCheckRef.current =
            updatedPartner.updatedAt;
        }

        if (needsReload) {
          await loadUserData();
        }
      } catch (err: any) {
        const isNetworkErr =
          err.message?.includes("Failed to fetch") ||
          err.message?.includes("Unable to connect") ||
          err.message?.includes("Unauthorized") ||
          err.message?.includes("timeout");
        if (!isNetworkErr) {
          console.error(
            "[App] Failed to check for updates:",
            err,
          );
        }
      }
    };

    checkForNewNotifications();
    checkForProfileUpdates();

    const interval = setInterval(() => {
      checkForNewNotifications();
      checkForProfileUpdates();
    }, 15000);
    return () => clearInterval(interval);
  }, [user, accessToken, selectedScreen]);

  const loadUserData = async (token?: string) => {
    const authToken = token || accessToken;

    if (!authToken || !user) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const profileData = await api.profile.get();
      setProfile(profileData.profile || null);
      setPartner(profileData.partner || null);

      adminApi
        .checkPrivileges()
        .then((d) => {
          const admin = d.isAdmin || false;
          setIsAdmin(admin);
          if (admin) setSelectedScreen("admin");
        })
        .catch(() => setIsAdmin(false));

      const [
        journalResult,
        prayerResult,
        milestonesResult,
        responsesResult,
        devotionalsResult,
        streaksResult,
      ] = await Promise.allSettled([
        api.journal.list(),
        api.prayer.list(),
        api.milestones.list(),
        api.questions.getResponses(),
        api.devotionals.list(),
        api.streaks.get(),
      ]);

      if (journalResult.status === "fulfilled")
        setJournalEntries(journalResult.value.entries || []);
      if (prayerResult.status === "fulfilled")
        setPrayers(prayerResult.value.prayers || []);
      if (milestonesResult.status === "fulfilled")
        setMilestones(milestonesResult.value.milestones || []);

      if (responsesResult.status === "fulfilled") {
        setResponses({
          user: responsesResult.value.userResponses || [],
          partner: responsesResult.value.partnerResponses || [],
        });
      }

      if (devotionalsResult.status === "fulfilled")
        setDevotionals(devotionalsResult.value.devotions || []);

      if (streaksResult.status === "fulfilled") {
        const devotionalStreakData =
          streaksResult.value.streaks?.find(
            (s: any) => s.streak_type === "devotional",
          );
        setDevotionalStreak(
          devotionalStreakData?.current_streak || 0,
        );
      }
    } catch (error: any) {
      const errorMsg: string =
        error?.message || "Failed to load user data";
      if (
        errorMsg.includes("401") ||
        errorMsg.includes("Unauthorized")
      ) {
        // Safe to ignore
      } else if (errorMsg.includes("BLOCKED_BY_CLIENT")) {
        setLoadError(
          "Your ad blocker is blocking the app. Please whitelist this site.",
        );
      } else {
        setLoadError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = useCallback(async () => {
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
      setLoadError(`Sign out error: ${error}`);
      toast.error(`Sign out error: ${error}`);
    }
  }, []);

  const handleAddJournalEntry = useCallback(
    async (entry: {
      title: string;
      content: string;
      isShared: boolean;
    }) => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/journal`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(entry),
          },
        );

        if (!response.ok)
          throw new Error("Failed to add journal entry");
        const { entry: newEntry } = await response.json();
        setJournalEntries((prev) => [newEntry, ...prev]);

        if (
          entry.isShared &&
          profile?.partnerId &&
          accessToken
        ) {
          await sendNotification({
            recipientId: profile.partnerId,
            type: "journal",
            title: `${profile.name} added a new journal entry`,
            message: `"${entry.title}" - Check it out in the Journal tab!`,
            data: { entryTitle: entry.title },
            accessToken,
            projectId,
          });
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [accessToken, profile, progress],
  );

  const handleUpdateJournalEntry = useCallback(
    async (id: string, updates: any) => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/journal/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updates),
          },
        );
        if (!response.ok)
          throw new Error("Failed to update entry");
        const { entry: updatedEntry } = await response.json();
        setJournalEntries((prev) =>
          prev.map((e) => (e.id === id ? updatedEntry : e)),
        );
      } catch (error) {
        throw error;
      }
    },
    [accessToken],
  );

  const handleDeleteJournalEntry = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/journal/${id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!response.ok) throw new Error("Delete failed");
        setJournalEntries((prev) =>
          prev.filter((entry) => entry.id !== id),
        );
        toast.success("Entry deleted!");
      } catch (error) {
        toast.error("Failed to delete entry");
      }
    },
    [accessToken],
  );

  const handleAddPrayer = useCallback(
    async (prayer: any) => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/prayer`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(prayer),
          },
        );
        if (!response.ok)
          throw new Error("Failed to add prayer");
        await loadUserData();
      } catch (error) {
        throw error;
      }
    },
    [accessToken, profile],
  );

  const handleUpdatePrayer = useCallback(
    async (id: string, updates: any) => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/prayer/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updates),
          },
        );
        if (!response.ok)
          throw new Error("Failed to update prayer");
        await loadUserData();
      } catch (error) {
        throw error;
      }
    },
    [accessToken],
  );

  const handleDeletePrayer = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/prayer/${id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!response.ok)
          throw new Error("Failed to delete prayer");
        await loadUserData();
      } catch (error) {
        throw error;
      }
    },
    [accessToken],
  );

  const handleMarkPrayed = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/prayer/${id}/pray`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!response.ok)
          throw new Error("Failed to mark as prayed");
        await loadUserData();
        toast.success("Marked as prayed! 🙏");
      } catch (error) {
        throw error;
      }
    },
    [accessToken],
  );

  const handleAddMilestone = useCallback(
    async (milestone: any) => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/milestone`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(milestone),
          },
        );
        if (!response.ok)
          throw new Error("Failed to add milestone");
        await loadUserData();
      } catch (error) {
        throw error;
      }
    },
    [accessToken],
  );

  const handleUpdateMilestone = useCallback(
    async (id: string, updates: any) => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/milestone/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updates),
          },
        );
        if (!response.ok)
          throw new Error("Failed to update milestone");
        await loadUserData();
      } catch (error) {
        throw error;
      }
    },
    [accessToken],
  );

  const handleDeleteMilestone = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/milestone/${id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!response.ok)
          throw new Error("Failed to delete milestone");
        await loadUserData();
      } catch (error) {
        throw error;
      }
    },
    [accessToken],
  );

  const handleSaveQuestionResponse = useCallback(
    async (
      questionId: string,
      answers: Record<string, string | string[] | number>,
      categoryId?: string,
    ) => {
      try {
        const responseData = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/questions/${questionId}/responses`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ answers }),
          },
        );

        if (!responseData.ok)
          throw new Error("Failed to save response");
        toast.success("Answer saved!");

        api.questions
          .getResponses()
          .then((data) =>
            setResponses({
              user: data.userResponses || [],
              partner: data.partnerResponses || [],
            }),
          )
          .catch(() => {});
      } catch (error: any) {
        toast.error("Failed to save answer");
        throw error;
      }
    },
    [accessToken, profile],
  );

  useEffect(() => {
    if (
      !isDevotionalOpen ||
      !selectedDevotionalId ||
      !accessToken
    ) {
      if (!isDevotionalOpen)
        setIsDevotionalCompletedToday(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotional-completions`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.completions) return;
        const alreadyDone = data.completions.some((c: any) => {
          try {
            const completionDate = new Date(c.completedAt)
              .toISOString()
              .split("T")[0];
            return (
              completionDate === today &&
              (c.devotionId === selectedDevotionalId ||
                c.devotion_id === selectedDevotionalId)
            );
          } catch {
            return false;
          }
        });
        setIsDevotionalCompletedToday(alreadyDone);
      })
      .catch(() => {});
  }, [isDevotionalOpen, selectedDevotionalId, accessToken]);

  const handleCompleteDevotional = useCallback(async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotional-completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            devotion_id: selectedDevotionalId,
            notes: null,
          }),
        },
      );

      if (!response.ok)
        throw new Error("Failed to complete devotional");
      setIsDevotionalCompletedToday(true);

      toast.success("Devotional completed! 🎉");
    } catch (error) {
      toast.error("Failed to mark as complete");
    }
  }, [accessToken, selectedDevotionalId]);

  const updateProgress = useCallback(
    async (updates: Partial<Progress>) => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/progress`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(updates),
          },
        );
        if (!response.ok)
          throw new Error("Failed to update progress");
        await loadUserData();
      } catch (error) {
        console.error(error);
      }
    },
    [accessToken],
  );

  const handleMoodSelect = useCallback((mood: string) => {
    toast.success("Mood recorded!");
  }, []);

  const handlePrayClick = useCallback(
    () => setActiveTab("prayer"),
    [],
  );

  if (isInitializing) {
    return (
      <LanguageProvider>
        <SEOHead />
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              {vocabulary.loading}
            </p>
          </div>
        </div>
      </LanguageProvider>
    );
  }

  if (showLanding && !user) {
    return (
      <LanguageProvider>
        <SEOHead />
        <Toaster />
        <LandingPage
          onGetStarted={() => setShowLanding(false)}
        />
      </LanguageProvider>
    );
  }

  if (!user) {
    return (
      <LanguageProvider>
        <SEOHead />
        <AuthPage
          onAuthSuccess={(token, userObj) => {
            setUser(userObj);
            setAccessToken(token);
            setShowLanding(false);
          }}
        />
      </LanguageProvider>
    );
  }

  const todaysPrompt =
    REFLECTION_PROMPTS[
      new Date().getDate() % REFLECTION_PROMPTS.length
    ];

  if (selectedScreen === "testing") {
    return (
      <LanguageProvider>
        <TestingDashboard
          onBack={() => setSelectedScreen("dashboard")}
        />
      </LanguageProvider>
    );
  }

  if (isAdmin && selectedScreen === "admin") {
    return (
      <LanguageProvider>
        <AdminPanel
          onSignOut={handleSignOut}
          accessToken={accessToken || undefined}
          onBackToHome={() => setSelectedScreen("dashboard")}
        />
      </LanguageProvider>
    );
  }

  if (selectedScreen === "debug-questions") {
    return (
      <LanguageProvider>
        <div className="min-h-screen bg-background">
          <div className="pt-11 pb-28">
            <div className="max-w-6xl mx-auto px-4">
              <Button
                onClick={() => setSelectedScreen("dashboard")}
                variant="outline"
                className="mb-4"
              >
                ← Back to Dashboard
              </Button>
              <DebugQuestions />
            </div>
          </div>
        </div>
      </LanguageProvider>
    );
  }

  if (selectedScreen === "debug-responses") {
    return (
      <LanguageProvider>
        <div className="min-h-screen bg-background">
          <div className="pt-11 pb-28">
            <div className="max-w-6xl mx-auto px-4">
              <Button
                onClick={() => setSelectedScreen("dashboard")}
                variant="outline"
                className="mb-4"
              >
                ← Back to Dashboard
              </Button>
              <DebugResponses />
            </div>
          </div>
        </div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <SEOHead />
      <div className="min-h-screen bg-background flex flex-col">
        {/* SOLID OPAQUE HEADER TRUNK BAR CONTAINER */}
        <header className="sticky top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 shadow-sm flex items-center">
          <div className="w-full max-w-2xl mx-auto px-4 flex items-center justify-between">
            {/* Platform Brand Title Identification */}
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                TwoBeOne
              </span>
            </div>

            {/* Consolidated Switcher Operations Header End Block */}
            <div className="flex items-center gap-2">
              <LanguageSelector
                variant="dropdown"
                showLabel={true}
                accessToken={accessToken || undefined}
                userId={profile?.id}
              />
              {user && (
                <NotificationCenter
                  accessToken={accessToken}
                  projectId={projectId}
                  publicAnonKey={publicAnonKey}
                  onNotificationClick={(notification) => {
                    if (notification.type === "devotional") {
                      setActiveTab("devotions");
                      if (notification.data?.devotionId) {
                        setTimeout(() => {
                          setIsDevotionalOpen(true);
                        }, 100);
                      }
                    } else if (
                      notification.type === "journal"
                    ) {
                      setActiveTab("journal");
                    } else if (notification.type === "prayer") {
                      setActiveTab("prayer");
                    } else if (
                      notification.type === "question"
                    ) {
                      setActiveTab("home");
                      setSelectedScreen("category-selection");
                    } else if (
                      notification.type === "question_answered"
                    ) {
                      setActiveTab("home");
                      if (notification.data?.categoryId) {
                        setSelectedQACategory(
                          notification.data.categoryId,
                        );
                        setSelectedScreen("qa-discussion");
                      } else {
                        setSelectedScreen("category-selection");
                      }
                    } else if (
                      notification.type === "mood_report"
                    ) {
                      setActiveTab("home");
                      setSelectedScreen("mood-analytics");
                    }
                  }}
                />
              )}
            </div>
          </div>
        </header>

        {/* Content Flow Layout Window Context */}
        <div className="flex-1 w-full pt-4 pb-28">
          <div className="max-w-6xl mx-auto px-4">
            <Toaster />
            <PWAWelcome />
            <InstallBanner />
            <OfflineIndicator />
            <InstallPrompt />
            <PWAUpdateAvailable />
            <IconsMissingNotice />
            <PWAInstallPrompt />
            <IOSInstallPrompt />
            <PWAUpdateNotification />
            <PWADebugInfo />

            {/* Error Banner */}
            {loadError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-rose-800">
                      {vocabulary.errorTitle}
                    </h3>
                    <p className="text-xs text-rose-700 mt-1">
                      {loadError}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-xs bg-white border-rose-200"
                      onClick={() => loadUserData()}
                    >
                      {vocabulary.retry}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Application Interface Core Components Render Frame */}
            <main className="container mx-auto px-2 max-w-2xl">
              {activeTab === "home" &&
                selectedScreen === "dashboard" && (
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
                    user={user}
                  />
                )}

              {activeTab === "home" &&
                selectedScreen === "qa-hub" && (
                  <DailyQuestion
                    accessToken={accessToken || ""}
                    projectId={projectId}
                    userProfile={profile}
                    partner={partner}
                    onPrayTogether={async () => {
                      setActiveTab("prayer");
                      setSelectedScreen("dashboard");
                      toast.success(vocabulary.openingPrayer);
                    }}
                    onBack={() =>
                      setSelectedScreen("dashboard")
                    }
                  />
                )}

              {activeTab === "home" &&
                selectedScreen === "quizzes" &&
                user &&
                profile && (
                  <QuizzesHub
                    profile={profile}
                    partner={partner || undefined}
                    accessToken={accessToken}
                    onBack={() =>
                      setSelectedScreen("dashboard")
                    }
                  />
                )}

              {activeTab === "home" &&
                selectedScreen === "guidance" && (
                  <PreMarriageHub
                    onModuleClick={(id) => {
                      setSelectedModuleId(id);
                      setSelectedLessonId(null);
                      setSelectedScreen("lesson");
                    }}
                    accessToken={accessToken}
                    onBack={() =>
                      setSelectedScreen("dashboard")
                    }
                    onViewReadiness={() =>
                      setSelectedScreen("marriage-readiness")
                    }
                  />
                )}

              {activeTab === "home" &&
                selectedScreen === "lesson" &&
                selectedModuleId && (
                  <LessonScreen
                    moduleId={selectedModuleId}
                    lessonId={selectedLessonId ?? undefined}
                    onBack={() => setSelectedScreen("guidance")}
                    accessToken={accessToken}
                  />
                )}

              {activeTab === "home" &&
                selectedScreen === "milestones" && (
                  <RelationshipTimeline
                    milestones={milestones}
                    onAddMilestone={handleAddMilestone}
                    onUpdateMilestone={handleUpdateMilestone}
                    onDeleteMilestone={handleDeleteMilestone}
                    userName={profile?.name}
                    partnerName={partner?.name}
                  />
                )}

              {activeTab === "home" &&
                selectedScreen === "scripture-memory" && (
                  <ScriptureMemory
                    onBack={() =>
                      setSelectedScreen("dashboard")
                    }
                    accessToken={accessToken || undefined}
                    userName={profile?.name}
                    partnerName={partner?.name}
                  />
                )}

              {activeTab === "home" &&
                selectedScreen === "mood-analytics" && (
                  <MoodAnalytics
                    profile={profile || undefined}
                    partner={partner || undefined}
                    onClose={() =>
                      setSelectedScreen("dashboard")
                    }
                  />
                )}

              {activeTab === "home" &&
                selectedScreen === "marriage-readiness" && (
                  <MarriageReadinessReport
                    onBack={() => setSelectedScreen("guidance")}
                  />
                )}

              {activeTab === "home" &&
                selectedScreen === "daily-question" &&
                user &&
                profile && (
                  <DailyQuestion
                    accessToken={accessToken}
                    projectId={projectId}
                    userProfile={profile}
                    partner={partner || undefined}
                    onPrayTogether={async () => {
                      setActiveTab("prayer");
                      toast.success(vocabulary.prayerTime);
                    }}
                    onBack={() =>
                      setSelectedScreen("dashboard")
                    }
                  />
                )}

              {activeTab === "home" &&
                selectedScreen === "category-selection" && (
                  <CategorySelection
                    onSelectCategory={(categoryId) => {
                      setSelectedQACategory(categoryId);
                      setSelectedScreen("qa-discussion");
                    }}
                    onBack={() =>
                      setSelectedScreen("dashboard")
                    }
                  />
                )}

              {activeTab === "home" &&
                selectedScreen === "qa-discussion" &&
                selectedQACategory && (
                  <QADiscussionHub
                    selectedCategory={selectedQACategory}
                    onSaveAnswer={handleSaveQuestionResponse}
                    onPrayTogether={async () => {
                      setActiveTab("prayer");
                      toast.success(vocabulary.openingPrayer);
                    }}
                    onBack={() => {
                      setSelectedScreen("category-selection");
                      setSelectedQACategory(null);
                    }}
                    userName={profile?.name}
                    partnerName={partner?.name}
                  />
                )}

              {activeTab === "devotions" && (
                <DailyDevotionsFeed
                  onDevotionalClick={(id) => {
                    setSelectedDevotionalId(id);
                    setIsDevotionalOpen(true);
                  }}
                  accessToken={accessToken || undefined}
                  projectId={projectId}
                  onBackToHome={() => {
                    setActiveTab("home");
                    setSelectedScreen("dashboard");
                  }}
                />
              )}

              {activeTab === "journal" && (
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
                    setActiveTab("home");
                    setSelectedScreen("dashboard");
                  }}
                />
              )}

              {activeTab === "prayer" && (
                <PrayerBoard
                  prayers={prayers}
                  onAddPrayer={handleAddPrayer}
                  onUpdatePrayer={handleUpdatePrayer}
                  onDeletePrayer={handleDeletePrayer}
                  onMarkPrayed={handleMarkPrayed}
                  onBackToHome={() => {
                    setActiveTab("home");
                    setSelectedScreen("dashboard");
                  }}
                />
              )}

              {activeTab === "community" &&
                !selectedGroupId && <CommunityGroups />}

              {activeTab === "community" && selectedGroupId && (
                <GroupDetailScreen
                  groupId={selectedGroupId}
                  onBack={() => setSelectedGroupId(null)}
                />
              )}

              {activeTab === "profile" && (
                <SettingsScreen
                  profile={profile || undefined}
                  partner={partner || undefined}
                  onSignOut={handleSignOut}
                  onUpdateProfile={async (data) => {
                    try {
                      const response = await fetch(
                        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile`,
                        {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`,
                          },
                          body: JSON.stringify(data),
                        },
                      );

                      if (!response.ok)
                        throw new Error(
                          "Failed to update profile",
                        );
                      await loadUserData();

                      if (data.relationshipStart && partner) {
                        toast.success(
                          vocabulary.profileSyncSuccess,
                        );
                      } else {
                        toast.success(
                          vocabulary.profileSuccess,
                        );
                      }
                    } catch (error: any) {
                      toast.error(
                        error.message ||
                          "Failed to update profile",
                      );
                      throw error;
                    }
                  }}
                  accessToken={accessToken || ""}
                  onRefresh={loadUserData}
                  onNavigateToAdmin={
                    isAdmin
                      ? () => setSelectedScreen("admin")
                      : undefined
                  }
                  onNavigateToDebug={() =>
                    setSelectedScreen("debug-questions")
                  }
                  onNavigateToDebugResponses={() =>
                    setSelectedScreen("debug-responses")
                  }
                  onNavigateToTesting={() =>
                    setSelectedScreen("testing")
                  }
                />
              )}

              {activeTab === "questions" && (
                <QuestionsSection
                  responses={responses}
                  onSaveResponse={handleSaveQuestionResponse}
                />
              )}

              {activeTab === "progress" && progress && (
                <ProgressSection progress={progress} />
              )}
            </main>

            <BottomNavigation
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                if (tab === "home") {
                  setSelectedScreen("dashboard");
                }
              }}
            />
            <FloatingActionButtons
              onPrayClick={handlePrayClick}
            />

            <DevotionalDialog
              devotional={(() => {
                if (
                  selectedDevotionalId &&
                  devotionals.length > 0
                ) {
                  const found = devotionals.find(
                    (d) => d.id === selectedDevotionalId,
                  );
                  if (found) {
                    return {
                      id: found.id,
                      title: found.title || "Daily Devotion",
                      verse: found.verse || "",
                      reference:
                        found.reference ||
                        found.verseReference ||
                        "",
                      reflection:
                        found.reflection || found.content || "",
                      prayer: found.prayerPrompt || "",
                      audioUrl: found.audioUrl,
                      language: found.language,
                    };
                  }
                }
                return {
                  title: "Daily Devotion",
                  verse: "",
                  reference: "",
                  reflection: "",
                  prayer: "",
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

            <LegalFooter
              language={
                (profile?.language as "en" | "am") || "en"
              }
            />
          </div>
        </div>
      </div>
    </LanguageProvider>
  );
}