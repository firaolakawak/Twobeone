import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  lazy,
  Suspense,
  startTransition,
} from "react";

// ── Critical path — loaded eagerly (needed before/at first paint) ──────────
import { SEOHead } from "./components/SEOHead";
import { LanguageProvider } from "./contexts/LanguageContext";
import { LanguageSelector } from "./components/LanguageSelector";
import { SplashScreen } from "./components/SplashScreen";
import { AuthPage } from "./components/AuthPage";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { NewsletterPreferencePage } from "./components/NewsletterPreferencePage";
import { LandingPage } from "./components/LandingPage";
import { staticPageFromPath } from "./utils/publicRoutes";
import { BottomNavigation } from "./components/BottomNavigation";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { CalendarAlarmManager } from "./components/CalendarAlarmManager";
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
import { Toaster } from "./components/ui/sonner";

// ── Deferred — lazy-loaded after auth / on first navigation ───────────────
const CoupleDashboard      = lazy(() => import("./components/CoupleDashboard").then(m => ({ default: m.CoupleDashboard })));
const CoupleCalendar       = lazy(() => import("./components/CoupleCalendar").then(m => ({ default: m.CoupleCalendar })));
const NotificationCenter   = lazy(() => import("./components/NotificationCenter").then(m => ({ default: m.NotificationCenter })));
const QuizzesHub           = lazy(() => import("./components/QuizzesHub").then(m => ({ default: m.QuizzesHub })));
const PreMarriageHub       = lazy(() => import("./components/PreMarriageHub").then(m => ({ default: m.PreMarriageHub })));
const LessonScreen         = lazy(() => import("./components/LessonScreen").then(m => ({ default: m.LessonScreen })));
const DailyDevotionsFeed   = lazy(() => import("./components/DailyDevotionsFeed").then(m => ({ default: m.DailyDevotionsFeed })));
const EnhancedJournal      = lazy(() => import("./components/EnhancedJournal").then(m => ({ default: m.EnhancedJournal })));
const PrayerBoard          = lazy(() => import("./components/PrayerBoard").then(m => ({ default: m.PrayerBoard })));
const CommunityGroups      = lazy(() => import("./components/CommunityGroups").then(m => ({ default: m.CommunityGroups })));
const GroupDetailScreen    = lazy(() => import("./components/GroupDetailScreen").then(m => ({ default: m.GroupDetailScreen })));
const SettingsScreen       = lazy(() => import("./components/SettingsScreen").then(m => ({ default: m.SettingsScreen })));
const QuestionsSection     = lazy(() => import("./components/QuestionsSection").then(m => ({ default: m.QuestionsSection })));
const ProgressSection      = lazy(() => import("./components/ProgressSection").then(m => ({ default: m.ProgressSection })));
const FloatingActionButtons= lazy(() => import("./components/FloatingActionButtons").then(m => ({ default: m.FloatingActionButtons })));
const DevotionalDialog     = lazy(() => import("./components/DevotionalDialog").then(m => ({ default: m.DevotionalDialog })));
const RelationshipTimeline = lazy(() => import("./components/RelationshipTimeline").then(m => ({ default: m.RelationshipTimeline })));
const AdminPanel           = lazy(() => import("./components/AdminPanel").then(m => ({ default: m.AdminPanel })));
const CategorySelection    = lazy(() => import("./components/CategorySelection").then(m => ({ default: m.CategorySelection })));
const QADiscussionHub      = lazy(() => import("./components/QADiscussionHub").then(m => ({ default: m.QADiscussionHub })));
const DebugQuestions       = lazy(() => import("./components/DebugQuestions").then(m => ({ default: m.DebugQuestions })));
const ScriptureMemory      = lazy(() => import("./components/ScriptureMemory").then(m => ({ default: m.ScriptureMemory })));
const CoupleProfile        = lazy(() => import("./components/CoupleProfile").then(m => ({ default: m.CoupleProfile })));
const CoupleHeader         = lazy(() => import("./components/CoupleHeader").then(m => ({ default: m.CoupleHeader })));
const DailyVerseCard       = lazy(() => import("./components/DailyVerseCard").then(m => ({ default: m.DailyVerseCard })));
const TodaysReflection     = lazy(() => import("./components/TodaysReflection").then(m => ({ default: m.TodaysReflection })));
const RecentMilestones     = lazy(() => import("./components/RecentMilestones").then(m => ({ default: m.RecentMilestones })));
const PreMarriageGuidance  = lazy(() => import("./components/PreMarriageGuidance").then(m => ({ default: m.PreMarriageGuidance })));
const MoodTracker          = lazy(() => import("./components/MoodTracker").then(m => ({ default: m.MoodTracker })));
const MoodAnalytics        = lazy(() => import("./components/MoodAnalytics").then(m => ({ default: m.MoodAnalytics })));
const MarriageReadinessReport = lazy(() => import("./components/MarriageReadinessReport").then(m => ({ default: m.MarriageReadinessReport })));
const DailyQuestion        = lazy(() => import("./components/DailyQuestion").then(m => ({ default: m.DailyQuestion })));
const PWAUpdateNotification= lazy(() => import("./components/PWAUpdateNotification").then(m => ({ default: m.PWAUpdateNotification })));
const PWADebugInfo         = lazy(() => import("./components/PWADebugInfo").then(m => ({ default: m.PWADebugInfo })));
const IconsMissingNotice   = lazy(() => import("./components/IconsMissingNotice").then(m => ({ default: m.IconsMissingNotice })));
const PWAUpdateAvailable   = lazy(() => import("./components/PWAUpdateAvailable").then(m => ({ default: m.PWAUpdateAvailable })));
const LegalFooter          = lazy(() => import("./components/LegalFooter").then(m => ({ default: m.LegalFooter })));

import { createClient } from "./utils/supabase/client";
import {
  projectId,
  publicAnonKey,
} from "./utils/supabase/info";
import {
  getDevotionalNotificationId,
  sendNotification,
} from "./utils/notifications";
import { toast } from "sonner@2.0.3";
import api, {
  warmUpServer,
  admin as adminApi,
} from "./utils/api";
import { registerServiceWorker } from "./utils/pwa";
import { useEngagementTracking } from "./hooks/useEngagementTracking";
import { usePartnerPresence } from "./hooks/usePartnerPresence";
import {
  isAppShellEnvironment,
  ONBOARDING_STORAGE_KEY,
} from "./utils/appShell";
import type {
  JournalEntry,
  PrayerRequest,
  Progress,
  QuestionResponse,
  User as UserType,
} from "./types";

// Shared fallback for lazy-loaded screens
function ScreenLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', flexDirection: 'column', gap: 'var(--spacing-3)',
    }}>
      <Loader2 style={{ width: 28, height: 28, color: 'var(--primary-500)', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

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

const PUSH_TABS = new Set(['home', 'devotions', 'prayer', 'journal', 'questions']);

function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function initialTabFromNotification(): string {
  if (typeof window === 'undefined') return 'home';
  const requestedTab = new URLSearchParams(window.location.search).get('tab') || 'home';
  return PUSH_TABS.has(requestedTab) ? requestedTab : 'home';
}

function initialScreenFromNotification(): string {
  if (typeof window === 'undefined') return 'dashboard';
  if (window.location.pathname === '/admin') return 'admin';
  return new URLSearchParams(window.location.search).get('screen') === 'couple-calendar'
    ? 'couple-calendar'
    : 'dashboard';
}

function isDirectAppPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/admin';
}

export default function App() {
  const [isAppShell] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        if (new URLSearchParams(window.location.search).get('onboarding') === 'reset') {
          window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        }
      } catch {
        // Continue into onboarding for the current session when possible.
      }
    }
    return isAppShellEnvironment();
  });
  const [onboardingComplete, setOnboardingComplete] = useState(hasCompletedOnboarding);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin');
  const [showLanding, setShowLanding] = useState(
    () => !isAppShell && !isDirectAppPath(),
  );
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(
    () => typeof window !== 'undefined' && window.location.pathname === '/reset-password',
  );
  const newsletterAction = typeof window === 'undefined'
    ? null
    : window.location.pathname === '/newsletter/confirm'
      ? 'confirm' as const
      : window.location.pathname === '/newsletter/unsubscribe'
        ? 'unsubscribe' as const
        : null;
  const publicPage = typeof window === 'undefined'
    ? null
    : staticPageFromPath(window.location.pathname);
  const [activeTab, setActiveTabRaw] = useState(initialTabFromNotification);
  const [selectedScreen, setSelectedScreenRaw] = useState<
    string | null
  >(initialScreenFromNotification);

  // Wrap navigation setters in startTransition so lazy-loaded screens
  // suspend gracefully instead of blocking synchronous input events.
  const setActiveTab = useCallback((tab: string) => {
    startTransition(() => setActiveTabRaw(tab));
  }, []);
  const setSelectedScreen = useCallback((screen: string | null) => {
    startTransition(() => setSelectedScreenRaw(screen));
  }, []);
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

  useEngagementTracking({
    activeTab,
    selectedScreen,
    enabled: Boolean(user && accessToken && profile && !showLanding),
  });

  const profilePreferences = profile as any;
  const partnerPreferences = partner as any;
  const { userOnline, partnerOnline } = usePartnerPresence({
    userId: profile?.id,
    userName: profilePreferences?.name,
    partnerId: partner?.id,
    partnerName: partnerPreferences?.name,
    accessToken,
    shareOnlineStatus: profilePreferences?.privacySettings?.showOnlineStatus !== false,
    notifyOnPartnerOnline: profilePreferences?.notificationSettings?.partnerActivity !== false,
    sendPartnerNotification:
      partnerPreferences?.notificationSettings?.partnerActivity !== false &&
      partnerPreferences?.notificationSettings?.pushNotifications !== false,
  });

  const [currentLangCode, setCurrentLangCode] = useState<"en" | "am" | "om">(() => {
    const saved = typeof window === "undefined" ? null : window.localStorage.getItem("twobeone_language");
    return saved === "am" || saved === "om" ? saved : "en";
  });
  const vocabulary =
    APP_TRANSLATIONS[currentLangCode] || APP_TRANSLATIONS.en;

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (next === "en" || next === "am" || next === "om") setCurrentLangCode(next);
    };
    window.addEventListener("twobeone:language-change", handleLanguageChange);
    return () => window.removeEventListener("twobeone:language-change", handleLanguageChange);
  }, []);

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
          startTransition(() => {
            setUser(session.user);
            setAccessToken(session.access_token);
            setShowLanding(false);
          });
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
          startTransition(() => {
            setUser(session.user);
            setAccessToken(session.access_token);
            setShowLanding(false);
          });
        } else if (event === "PASSWORD_RECOVERY" && session?.access_token) {
          setIsPasswordRecovery(true);
        } else if (
          event === "TOKEN_REFRESHED" &&
          session?.access_token
        ) {
          startTransition(() => {
            setUser(session.user);
            setAccessToken(session.access_token);
          });
        } else if (event === "SIGNED_OUT") {
          const {
            data: { session: current },
          } = await supabase.auth.getSession();
          if (current?.access_token) {
            startTransition(() => {
              setUser(current.user);
              setAccessToken(current.access_token);
            });
          } else {
            startTransition(() => {
              setUser(null);
              setAccessToken(null);
            });
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
            // Mark read immediately so it never re-surfaces on the next login
            api.notifications.markAsRead(notification.id).catch(() => {});
          } else if (notification.type === "mood_analysis") {
            toast.success(notification.title || "🧠 AI analysis ready", {
              description: notification.data?.summary || "Your AI mood analysis is ready to review.",
              duration: 8000,
            });
            api.notifications.markAsRead(notification.id).catch(() => {});
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
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/milestones`,
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
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/milestones/${id}`,
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
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/milestones/${id}`,
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

  if (isPasswordRecovery) {
    return (
      <LanguageProvider>
        <SEOHead />
        <Toaster />
        <ResetPasswordPage onComplete={() => {
          setIsPasswordRecovery(false);
          setUser(null);
          setAccessToken(null);
          setShowLanding(false);
        }} />
      </LanguageProvider>
    );
  }

  if (newsletterAction) {
    return (
      <LanguageProvider>
        <SEOHead />
        <Toaster />
        <NewsletterPreferencePage
          action={newsletterAction}
          onComplete={() => { window.location.href = '/'; }}
        />
      </LanguageProvider>
    );
  }

  if (publicPage) {
    return (
      <LanguageProvider>
        <SEOHead />
        <Toaster />
        <LandingPage
          initialPage={publicPage}
          onGetStarted={() => {
            window.history.replaceState({}, '', '/');
            setShowLanding(false);
          }}
        />
      </LanguageProvider>
    );
  }

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

  if (isAppShell && !user && !onboardingComplete) {
    return (
      <LanguageProvider>
        <SEOHead />
        <OnboardingScreen
          onComplete={(destination) => {
            try {
              window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
            } catch {
              // The current session still continues even if WebView storage is disabled.
            }
            setAuthInitialMode(destination);
            setOnboardingComplete(true);
            setShowLanding(false);
          }}
        />
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
          initialMode={authInitialMode}
          onAuthSuccess={(token, userObj) => {
            startTransition(() => {
              setUser(userObj);
              setAccessToken(token);
              setShowLanding(false);
            });
          }}
        />
      </LanguageProvider>
    );
  }

  const todaysPrompt =
    REFLECTION_PROMPTS[
      new Date().getDate() % REFLECTION_PROMPTS.length
    ];

  if (isAdmin && selectedScreen === "admin") {
    return (
      <LanguageProvider>
        <Suspense fallback={<ScreenLoader />}>
          <AdminPanel
            onSignOut={handleSignOut}
            accessToken={accessToken || undefined}
            onBackToHome={() => setSelectedScreen("dashboard")}
          />
        </Suspense>
      </LanguageProvider>
    );
  }

  if (selectedScreen === "debug-questions") {
    return (
      <LanguageProvider>
        <Suspense fallback={<ScreenLoader />}>
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
        </Suspense>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <SEOHead />
      {accessToken && (
        <CalendarAlarmManager
          accessToken={accessToken}
          onOpenCalendar={() => {
            setActiveTab("home");
            setSelectedScreen("couple-calendar");
          }}
        />
      )}
      <div className="app-mobile-shell min-h-screen bg-background flex flex-col">
        {/* SOLID OPAQUE HEADER TRUNK BAR CONTAINER */}
        <header className="sticky top-0 left-0 right-0 z-50 flex min-h-16 items-center pt-[env(safe-area-inset-top,0px)]" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 0 0 var(--border)' }}>
          <div className="w-full max-w-2xl mx-auto px-4 flex min-h-16 items-center justify-between">
            {/* Platform Brand Title Identification */}
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 fill-rose-500 text-rose-500 animate-pulse" />
              <span className="text-base font-extrabold text-slate-950 tracking-tight">
                TwoBeOne
              </span>
            </div>

            {/* Consolidated Switcher Operations Header End Block */}
            <div className="flex items-center gap-2">
              {partner && (
                <div
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1"
                  role="status"
                  aria-label={`${partnerPreferences?.name || "Partner"} is ${partnerOnline ? "online" : "offline"}`}
                  title={`${partnerPreferences?.name || "Partner"} is ${partnerOnline ? "online" : "offline"}`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${partnerOnline ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.16)]" : "bg-slate-300"}`}
                    aria-hidden="true"
                  />
                  <span className="hidden text-xs font-semibold text-slate-700 sm:inline">
                    {partnerOnline ? "Online" : "Offline"}
                  </span>
                </div>
              )}
              <LanguageSelector
                accessToken={accessToken || undefined}
                userId={profile?.id}
              />
              {user && (
                <Suspense fallback={null}>
                <NotificationCenter
                  accessToken={accessToken}
                  projectId={projectId}
                  publicAnonKey={publicAnonKey}
                  onNotificationClick={(notification) => {
                    if (notification.type === "devotional") {
                      setActiveTab("devotions");
                      const devotionId =
                        getDevotionalNotificationId(notification);
                      if (devotionId) {
                        setSelectedDevotionalId(devotionId);
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
                </Suspense>
              )}
            </div>
          </div>
        </header>

        {/* Content Flow Layout Window Context */}
        <div className="flex-1 w-full pt-4 pb-28">
          <div className="max-w-6xl mx-auto px-4">
            <Toaster />
            <Suspense fallback={null}>
              <PWAUpdateAvailable />
              <IconsMissingNotice />
              <PWAUpdateNotification />
              <PWADebugInfo />
            </Suspense>

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
              <Suspense fallback={<ScreenLoader />}>
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
                    userOnline={userOnline}
                    partnerOnline={partnerOnline}
                    devotionals={devotionals}
                    onOpenDevotional={(id) => {
                      setSelectedDevotionalId(id);
                      setActiveTab("devotions");
                      setIsDevotionalOpen(true);
                    }}
                    onStartQuestion={(category) => {
                      setActiveTab("home");
                      if (category) {
                        setSelectedQACategory(category);
                        setSelectedScreen("qa-discussion");
                      } else {
                        setSelectedScreen("category-selection");
                      }
                    }}
                    user={user}
                  />
                )}

              {activeTab === "home" &&
                selectedScreen === "couple-calendar" &&
                profile && accessToken && (
                  <CoupleCalendar
                    accessToken={accessToken}
                    userId={profile.id}
                    userName={profile.name}
                    partnerName={partner?.name}
                    milestones={milestones}
                    journalEntries={journalEntries}
                    onBack={() => setSelectedScreen("dashboard")}
                    onPrayerChanged={loadUserData}
                    onDataRefresh={loadUserData}
                    onOpenMilestones={() => setSelectedScreen("milestones")}
                    onOpenJournal={() => setActiveTab("journal")}
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
                    responses={responses}
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
              </Suspense>
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
            <Suspense fallback={null}>
              <FloatingActionButtons
                onPrayClick={handlePrayClick}
              />
            </Suspense>

            <Suspense fallback={null}>
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
              language={currentLangCode}
            />
            </Suspense>
          </div>
        </div>
      </div>
    </LanguageProvider>
  );
}
