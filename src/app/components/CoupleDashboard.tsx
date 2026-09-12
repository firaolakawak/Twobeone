import { useLanguage } from "../contexts/LanguageContext";
import { useState, useEffect, useMemo } from "react";
import {
  Heart,
  BookOpen,
  PenLine,
  MessageCircleHeart,
  Calendar,
  Users,
  ArrowRight,
  Shuffle,
  Brain,
  ChevronDown,
  Hammer,
  Smile,
  Laugh,
  Meh,
  Frown,
} from "lucide-react";
import { ComprehensiveBibleReader } from "./ComprehensiveBibleReader";
import { PushNotificationSetup } from "./PushNotificationSetup";
import { LoveJourneyHeader } from "./LoveJourneyHeader";
import { parseRelationshipStart } from "../utils/relationshipJourney";
export {
  parseRelationshipStart,
  getElapsedRelationshipTime,
} from "../utils/relationshipJourney";
export { JourneyCounter } from "./LoveJourneyHeader";
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import type {
  User,
  JournalEntry,
  PrayerRequest,
  Progress as ProgressType,
  QuestionResponse,
} from "../types";
import {
  moods as moodsApi,
  milestones as milestonesApi,
  questions as questionsApi,
} from "../utils/api";
import {
  fetchAmharicChapter,
  getAmharicBookName,
} from "../utils/amharicBibleApi";
import { ChampionsCard } from "./ChampionsCard";
import { coupleCalendarCopy } from "../data/couple-calendar";
import { dashboardJourneyCopy } from "../data/dashboard-journey";
import "./dashboard-journey.css";

type DashboardUser = User & {
  name?: string;
  profilePicture?: string;
  relationshipStart?: string;
};

export interface CoupleDashboardProps {
  profile?: DashboardUser;
  partner?: DashboardUser;
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

export type HomeSpotlightKind = "devotion" | "question" | "journal";

const QA_CATEGORY_IDS = new Set([
  "daily-life",
  "intimacy",
  "love-balance",
  "dream-wedding",
  "travel",
  "boundaries",
  "trust",
  "kids-future",
  "finance",
  "family",
  "bible",
]);

export function pickRandomHomeSpotlight(
  previous?: HomeSpotlightKind,
  random: () => number = Math.random,
): HomeSpotlightKind {
  const allKinds: HomeSpotlightKind[] = ["devotion", "question", "journal"];
  const choices = previous
    ? allKinds.filter((kind) => kind !== previous)
    : allKinds;
  return choices[Math.floor(random() * choices.length)] || "devotion";
}

export const RELATIONSHIP_STAGE_START_DAYS = [0, 90, 180, 250, 360] as const;

export function getRelationshipStageProgress(daysTogetherInput: number) {
  const daysTogether = Number.isFinite(daysTogetherInput)
    ? Math.max(0, Math.floor(daysTogetherInput))
    : 0;
  let stageIndex = 0;

  for (
    let index = RELATIONSHIP_STAGE_START_DAYS.length - 1;
    index >= 0;
    index--
  ) {
    if (daysTogether >= RELATIONSHIP_STAGE_START_DAYS[index]) {
      stageIndex = index;
      break;
    }
  }

  const stageStart = RELATIONSHIP_STAGE_START_DAYS[stageIndex];
  const nextStageStart = RELATIONSHIP_STAGE_START_DAYS[stageIndex + 1];
  const daysLeft =
    nextStageStart === undefined
      ? null
      : Math.max(0, nextStageStart - daysTogether);
  const progressPercent =
    nextStageStart === undefined
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            Math.floor(
              ((daysTogether - stageStart) / (nextStageStart - stageStart)) *
                100,
            ),
          ),
        );

  return { daysTogether, stageIndex, daysLeft, progressPercent };
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
  mood: "great" | "good" | "okay" | "sad";
  date: string;
  note?: string;
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
  devotionals = [],
  onOpenDevotional,
  onStartQuestion,
}: CoupleDashboardProps) {
  const { t, language } = useLanguage();
  const calendarCopy = coupleCalendarCopy[language];
  const copy = dashboardJourneyCopy[language];
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [championsExpanded, setChampionsExpanded] = useState(false);
  const [progressExpanded, setProgressExpanded] = useState(false);
  const [dailyVerse, setDailyVerse] = useState<BibleVerse | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);
  const [isBibleReaderOpen, setIsBibleReaderOpen] = useState(false);
  const [verseLanguage, setVerseLanguage] = useState<"en" | "am">(() =>
    language === "en" ? "en" : "am",
  );
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [todaysMood, setTodaysMood] = useState<MoodEntry | null>(null);
  const [partnerMood, setPartnerMood] = useState<MoodEntry | null>(null);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [spotlightQuestions, setSpotlightQuestions] = useState<
    DashboardQuestion[]
  >([]);
  const [spotlightKind, setSpotlightKind] = useState<HomeSpotlightKind>(() =>
    pickRandomHomeSpotlight(),
  );
  const [spotlightShuffle, setSpotlightShuffle] = useState(0);

  // Keep verse language in sync with the app language switcher
  useEffect(() => {
    setVerseLanguage(language === "en" ? "en" : "am");
  }, [language]);

  // Fetch total questions count once on mount — uses lightweight /questions/count endpoint
  useEffect(() => {
    if (!profile?.id) return;
    questionsApi
      .count()
      .then(({ count }) => setTotalQuestionsCount(count))
      .catch(() => {
        // Show the actual answered count without inventing a total.
        setTotalQuestionsCount(0);
      });
  }, [profile?.id]);

  useEffect(() => {
    let cancelled = false;
    questionsApi
      .list(undefined, language)
      .then((data) => {
        if (!cancelled) setSpotlightQuestions(data.questions || []);
      })
      .catch(() => {
        if (!cancelled) setSpotlightQuestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    // Fetch daily Bible verse from Bible API
    const fetchDailyVerse = async () => {
      try {
        // 365-verse pool spanning all 66 books of the Bible (OT + NT)
        const verses = [
          // Genesis – Deuteronomy
          "genesis 1:1",
          "genesis 1:27",
          "genesis 2:24",
          "genesis 12:1-2",
          "genesis 15:6",
          "genesis 28:15",
          "genesis 50:20",
          "exodus 14:14",
          "exodus 20:1-3",
          "exodus 33:14",
          "leviticus 19:18",
          "numbers 6:24-26",
          "deuteronomy 6:5",
          "deuteronomy 7:9",
          "deuteronomy 31:6",
          "deuteronomy 31:8",
          // Joshua – Esther
          "joshua 1:8",
          "joshua 1:9",
          "joshua 24:15",
          "judges 6:12",
          "ruth 1:16",
          "1 samuel 16:7",
          "2 samuel 22:3",
          "1 kings 3:12",
          "1 chronicles 16:11",
          "2 chronicles 7:14",
          "ezra 8:22",
          "nehemiah 8:10",
          "esther 4:14",
          // Job – Song of Solomon
          "job 19:25",
          "job 23:10",
          "job 42:2",
          "psalm 1:1-2",
          "psalm 4:8",
          "psalm 9:1",
          "psalm 16:8",
          "psalm 18:2",
          "psalm 19:1",
          "psalm 23:1",
          "psalm 23:4",
          "psalm 27:1",
          "psalm 27:4",
          "psalm 28:7",
          "psalm 29:11",
          "psalm 31:3",
          "psalm 32:8",
          "psalm 34:8",
          "psalm 34:18",
          "psalm 37:4",
          "psalm 37:5",
          "psalm 40:1-3",
          "psalm 42:1",
          "psalm 46:1",
          "psalm 46:10",
          "psalm 51:10",
          "psalm 55:22",
          "psalm 56:3",
          "psalm 62:5",
          "psalm 63:1",
          "psalm 63:3",
          "psalm 71:5",
          "psalm 73:26",
          "psalm 84:2",
          "psalm 86:5",
          "psalm 90:2",
          "psalm 91:1-2",
          "psalm 91:4",
          "psalm 94:19",
          "psalm 100:4-5",
          "psalm 103:1-2",
          "psalm 103:12",
          "psalm 107:1",
          "psalm 111:10",
          "psalm 118:14",
          "psalm 118:24",
          "psalm 119:9",
          "psalm 119:11",
          "psalm 119:105",
          "psalm 119:114",
          "psalm 121:1-2",
          "psalm 121:7-8",
          "psalm 127:1",
          "psalm 128:1",
          "psalm 133:1",
          "psalm 136:1",
          "psalm 139:14",
          "psalm 139:23-24",
          "psalm 143:10",
          "psalm 145:18",
          "psalm 147:3",
          "proverbs 1:7",
          "proverbs 2:6",
          "proverbs 3:5-6",
          "proverbs 3:9-10",
          "proverbs 4:7",
          "proverbs 4:23",
          "proverbs 10:12",
          "proverbs 12:15",
          "proverbs 13:20",
          "proverbs 14:29",
          "proverbs 15:1",
          "proverbs 16:3",
          "proverbs 16:9",
          "proverbs 17:17",
          "proverbs 18:10",
          "proverbs 18:24",
          "proverbs 19:20",
          "proverbs 22:6",
          "proverbs 27:17",
          "proverbs 28:13",
          "proverbs 31:25",
          "ecclesiastes 3:1",
          "ecclesiastes 3:11",
          "ecclesiastes 4:9-10",
          "song of solomon 2:16",
          "song of solomon 8:6-7",
          // Isaiah – Daniel
          "isaiah 9:6",
          "isaiah 26:3",
          "isaiah 30:15",
          "isaiah 40:8",
          "isaiah 40:29",
          "isaiah 40:31",
          "isaiah 41:10",
          "isaiah 43:1-2",
          "isaiah 43:19",
          "isaiah 46:4",
          "isaiah 48:17",
          "isaiah 53:5",
          "isaiah 54:10",
          "isaiah 55:8-9",
          "isaiah 55:10-11",
          "isaiah 58:11",
          "isaiah 61:1",
          "isaiah 64:8",
          "jeremiah 17:7-8",
          "jeremiah 29:11",
          "jeremiah 29:13",
          "jeremiah 31:3",
          "jeremiah 33:3",
          "lamentations 3:22-23",
          "lamentations 3:25",
          "ezekiel 36:26",
          "daniel 2:20",
          "daniel 6:10",
          // Hosea – Malachi
          "hosea 2:19-20",
          "hosea 6:6",
          "joel 2:25",
          "joel 2:28",
          "amos 5:24",
          "micah 6:8",
          "micah 7:18",
          "nahum 1:7",
          "habakkuk 2:4",
          "habakkuk 3:19",
          "zephaniah 3:17",
          "haggai 2:4",
          "zechariah 4:6",
          "malachi 3:10",
          // Matthew – John
          "matthew 5:3",
          "matthew 5:6",
          "matthew 5:8",
          "matthew 5:9",
          "matthew 5:14-15",
          "matthew 5:44",
          "matthew 6:9-10",
          "matthew 6:20-21",
          "matthew 6:33",
          "matthew 7:7",
          "matthew 7:12",
          "matthew 11:28-30",
          "matthew 17:20",
          "matthew 18:20",
          "matthew 19:26",
          "matthew 22:37-39",
          "matthew 25:40",
          "matthew 28:19-20",
          "mark 10:27",
          "mark 10:45",
          "mark 11:24",
          "mark 12:30-31",
          "mark 16:15",
          "luke 1:37",
          "luke 6:38",
          "luke 10:27",
          "luke 11:9",
          "luke 15:7",
          "luke 17:21",
          "luke 18:27",
          "john 1:1",
          "john 1:14",
          "john 3:16",
          "john 3:17",
          "john 4:14",
          "john 6:35",
          "john 8:12",
          "john 8:32",
          "john 10:10",
          "john 11:25",
          "john 13:34-35",
          "john 14:1-2",
          "john 14:6",
          "john 14:13",
          "john 14:27",
          "john 15:5",
          "john 15:9-10",
          "john 15:12-13",
          "john 16:33",
          "john 17:17",
          // Acts – Galatians
          "acts 1:8",
          "acts 2:38",
          "acts 4:12",
          "acts 5:29",
          "acts 16:31",
          "acts 17:28",
          "romans 1:16",
          "romans 3:23",
          "romans 5:1",
          "romans 5:3-5",
          "romans 5:8",
          "romans 6:23",
          "romans 8:1",
          "romans 8:11",
          "romans 8:18",
          "romans 8:26",
          "romans 8:28",
          "romans 8:37",
          "romans 8:38-39",
          "romans 10:9-10",
          "romans 12:1-2",
          "romans 12:10",
          "romans 12:12",
          "romans 15:4",
          "romans 15:13",
          "1 corinthians 1:18",
          "1 corinthians 2:9",
          "1 corinthians 10:13",
          "1 corinthians 13:4-8",
          "1 corinthians 15:10",
          "1 corinthians 15:55",
          "1 corinthians 16:13-14",
          "2 corinthians 1:3-4",
          "2 corinthians 4:17",
          "2 corinthians 5:7",
          "2 corinthians 5:17",
          "2 corinthians 9:8",
          "2 corinthians 12:9",
          "galatians 2:20",
          "galatians 5:22-23",
          "galatians 6:2",
          "galatians 6:9",
          // Ephesians – Colossians
          "ephesians 1:3",
          "ephesians 2:8-9",
          "ephesians 2:10",
          "ephesians 3:17-19",
          "ephesians 3:20",
          "ephesians 4:2-3",
          "ephesians 4:29",
          "ephesians 4:32",
          "ephesians 5:25",
          "ephesians 6:10-11",
          "philippians 1:6",
          "philippians 2:3-4",
          "philippians 2:13",
          "philippians 3:13-14",
          "philippians 4:6-7",
          "philippians 4:8",
          "philippians 4:11",
          "philippians 4:13",
          "philippians 4:19",
          "colossians 1:17",
          "colossians 3:12-13",
          "colossians 3:15",
          "colossians 3:17",
          "colossians 3:23",
          // 1 Thessalonians – Hebrews
          "1 thessalonians 5:16-18",
          "1 thessalonians 5:23",
          "2 thessalonians 3:3",
          "1 timothy 4:12",
          "1 timothy 6:6",
          "1 timothy 6:12",
          "2 timothy 1:7",
          "2 timothy 2:15",
          "2 timothy 3:16-17",
          "titus 3:5",
          "hebrews 4:12",
          "hebrews 4:16",
          "hebrews 10:23",
          "hebrews 11:1",
          "hebrews 11:6",
          "hebrews 12:1-2",
          "hebrews 13:5",
          "hebrews 13:8",
          // James – Revelation
          "james 1:2-3",
          "james 1:5",
          "james 1:17",
          "james 1:19",
          "james 1:22",
          "james 4:7",
          "james 4:8",
          "james 5:16",
          "1 peter 1:3-4",
          "1 peter 2:9",
          "1 peter 3:15",
          "1 peter 4:8",
          "1 peter 5:7",
          "1 peter 5:8",
          "2 peter 1:3",
          "2 peter 3:9",
          "1 john 1:7",
          "1 john 1:9",
          "1 john 4:7-8",
          "1 john 4:10",
          "1 john 4:18",
          "1 john 4:19",
          "1 john 5:14",
          "jude 1:24-25",
          "revelation 1:8",
          "revelation 3:20",
          "revelation 21:4",
          "revelation 21:5",
          "revelation 22:20",
        ];

        const now = new Date();
        const dayOfYear = Math.floor(
          (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
            86400000,
        );
        // Spread across 2 years so consecutive years don't repeat identically
        const seed = (now.getFullYear() * 1000 + dayOfYear) % verses.length;
        const selectedVerse = verses[seed];

        const response = await fetch(
          `https://bible-api.com/${selectedVerse}?translation=kjv`,
        );
        if (!response.ok) throw new Error("Failed to fetch verse");
        const data = await response.json();

        const engText = data.text.replace(/\n/g, " ").trim();
        const engRef: string = data.reference;

        // Fetch the same passage from the Amharic XML Bible
        let amharicText = "";
        let amharicReference = "";
        try {
          const firstVerse = data.verses?.[0];
          const bookName: string = firstVerse?.book_name ?? "";
          const chapterNum: number = firstVerse?.chapter ?? 0;
          if (bookName && chapterNum) {
            const verseNumbers: number[] = data.verses.map(
              (v: any) => v.verse as number,
            );
            const amChapter = await fetchAmharicChapter(bookName, chapterNum);
            const parts = verseNumbers
              .map(
                (vn) =>
                  amChapter.verses.find((v) => v.number === vn)?.text ?? "",
              )
              .filter(Boolean);
            amharicText = parts.join(" ");
            const amBook = getAmharicBookName(bookName);
            const range =
              verseNumbers.length > 1
                ? `${verseNumbers[0]}-${verseNumbers[verseNumbers.length - 1]}`
                : `${verseNumbers[0]}`;
            amharicReference = `${amBook} ${chapterNum}:${range}`;
          }
        } catch (amErr) {
          console.warn(
            "[DailyVerse] Amharic fetch failed, will show English only:",
            amErr,
          );
        }

        setDailyVerse({
          reference: engRef,
          text: engText,
          translation: data.translation_name,
          amharicText: amharicText || undefined,
          amharicReference: amharicReference || undefined,
        });
      } catch (error) {
        console.error("Error fetching daily verse:", error);
        // Fallback verse
        setDailyVerse({
          reference: "John 3:16",
          text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
          translation: "KJV",
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
        setMilestones(
          fetchedMilestones.map((m: any) => ({
            id: m.id,
            title: m.title,
            date: m.date || m.createdAt,
            description: m.description || "",
            icon: "heart",
          })),
        );
      } catch (error: any) {
        const isNetworkErr =
          error?.message?.includes("Unable to connect") ||
          error?.message?.includes("Failed to fetch") ||
          error?.message?.includes("Unauthorized") ||
          error?.message?.includes("timeout");
        if (!isNetworkErr) {
          console.error("Error fetching milestones:", error);
        }
      }
    };

    if (profile?.id) {
      // Defer 1s so it doesn't compete with the critical first render
      const t = setTimeout(() => {
        fetchMilestones();
        // Polling is deliberately infrequent; writes already update the local UI.
      }, 1000);
      const interval = setInterval(() => {
        if (document.visibilityState === "visible") void fetchMilestones();
      }, 5 * 60_000);
      return () => {
        clearTimeout(t);
        clearInterval(interval);
      };
    }
  }, [profile?.id, partner?.id]);

  useEffect(() => {
    // Fetch moods from backend
    const fetchMoods = async () => {
      try {
        const { moods: fetchedMoods } = await moodsApi.list();

        // Get today's date string
        const today = new Date().toISOString().split("T")[0];

        // Find today's mood for user and partner
        const userTodayMood = fetchedMoods.find(
          (m: any) => m.userId === profile?.id && m.createdAt.startsWith(today),
        );
        const partnerTodayMood = fetchedMoods.find(
          (m: any) => m.userId === partner?.id && m.createdAt.startsWith(today),
        );

        if (userTodayMood) {
          setTodaysMood({
            userId: userTodayMood.userId,
            mood: userTodayMood.mood,
            date: userTodayMood.createdAt,
            note: userTodayMood.note,
          });
        }

        if (partnerTodayMood) {
          setPartnerMood({
            userId: partnerTodayMood.userId,
            mood: partnerTodayMood.mood,
            date: partnerTodayMood.createdAt,
            note: partnerTodayMood.note,
          });
        }
      } catch (error: any) {
        // Suppress expected network errors — moods polling is non-critical
        const isNetworkErr =
          error?.message?.includes("Unable to connect") ||
          error?.message?.includes("Failed to fetch") ||
          error?.message?.includes("Unauthorized") ||
          error?.message?.includes("timeout");
        if (!isNetworkErr) {
          console.warn("Could not fetch moods - non-critical feature:", error);
        }
      }
    };

    if (profile?.id) {
      // Defer 1.5s — mood data is non-critical for initial render
      const timeout = setTimeout(() => fetchMoods(), 1500);
      const interval = setInterval(() => {
        if (document.visibilityState === "visible") void fetchMoods();
      }, 5 * 60_000);
      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [profile?.id, partner?.id]);

  // Auto-check for weekly mood report (only if user has a partner)
  useEffect(() => {
    /** Returns "YYYY-Www" ISO week string so the key is unambiguous. */
    const isoWeekKey = (d: Date): string => {
      const tmp = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
      );
      const dayNum = tmp.getUTCDay() || 7; // Mon=1 … Sun=7
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum); // nearest Thursday
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const week = Math.ceil(
        ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
      );
      return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
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
          console.log(
            "[WeeklyMoodReport] Report already sent this week:",
            weekKey,
          );
          return;
        }

        console.log(
          "[WeeklyMoodReport] 🎯 Saturday — generating weekly mood report for",
          weekKey,
        );

        await moodsApi.generateWeeklyReport();

        // Mark this ISO week as done so no duplicate fires later in the day
        localStorage.setItem(storageKey, "1");

        console.log("[WeeklyMoodReport] ✅ Report generated for", weekKey);
      } catch (error: any) {
        console.log(
          "[WeeklyMoodReport] ⚠️ Could not auto-generate report:",
          error.message,
        );
      }
    };

    // Check on mount then every 6 hours (to catch Saturday if the app was already open)
    checkWeeklyReport();
    const interval = setInterval(checkWeeklyReport, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [profile?.id, partner?.id]);

  // Helper function to save mood and refetch
  const handleMoodUpdate = async (
    moodValue: "great" | "good" | "okay" | "sad",
  ) => {
    if (isSavingMood) return;
    setIsSavingMood(true);
    try {
      await moodsApi.save(moodValue);
      setTodaysMood({
        userId: profile?.id || "",
        mood: moodValue,
        date: new Date().toISOString(),
      });
      toast.success(t.mood.moodSaved);

      // Refetch to get the saved mood from backend
      const { moods: fetchedMoods } = await moodsApi.list();
      const today = new Date().toISOString().split("T")[0];
      const userTodayMood = fetchedMoods.find(
        (m: any) => m.userId === profile?.id && m.createdAt.startsWith(today),
      );
      if (userTodayMood) {
        setTodaysMood({
          userId: userTodayMood.userId,
          mood: userTodayMood.mood,
          date: userTodayMood.createdAt,
          note: userTodayMood.note,
        });
      }
    } catch (error) {
      console.error("Error saving mood:", error);
      toast.error(t.messages.errorOccurred);
    } finally {
      setIsSavingMood(false);
    }
  };

  // Calculate stats
  const sharedJournalEntries = journalEntries.filter((e) => e.isShared).length;
  const totalPrayers = prayers.length;
  const answeredPrayers = prayers.filter((p) => p.isAnswered).length;

  // Count actual unique questions answered from responses
  // Each response has a questionId, count unique base question IDs (before :prompt: suffix)
  const uniqueQuestions = new Set(
    responses.user.map((r) => r.questionId.split(":prompt:")[0]),
  );
  const questionsAnswered = uniqueQuestions.size;

  const devotionalStreakValue = devotionalStreak || 0;

  const spotlight = useMemo(() => {
    const choose = <T,>(items: T[]): T | undefined =>
      items.length
        ? items[Math.floor(Math.random() * items.length)]
        : undefined;

    if (spotlightKind === "devotion") {
      const languageDevotionals = devotionals.filter((devotional) =>
        language === "en"
          ? !devotional.language || devotional.language === "en"
          : devotional.language === language,
      );
      const devotional = choose(
        languageDevotionals.length ? languageDevotionals : devotionals,
      );
      return {
        kind: "devotion" as const,
        itemId: devotional?.id,
        category: undefined,
        eyebrow: "A quiet moment",
        title: devotional?.title || copy.devotionTitle,
        description:
          devotional?.reflection ||
          devotional?.body ||
          devotional?.verse ||
          devotional?.verseText ||
          copy.devotionDescription,
        actionLabel: copy.readDevotion,
        icon: BookOpen,
        iconClass: "bg-amber-100 text-amber-700",
        surfaceClass:
          "from-amber-50 via-white to-orange-50/80 border-amber-100",
        accentClass: "text-amber-800",
      };
    }

    if (spotlightKind === "question") {
      const question = choose(spotlightQuestions);
      return {
        kind: "question" as const,
        itemId: question?.id,
        category:
          question?.category && QA_CATEGORY_IDS.has(question.category)
            ? question.category
            : undefined,
        eyebrow: "Talk about this",
        title:
          question?.title ||
          question?.question ||
          question?.prompts?.[0]?.text ||
          copy.questionTitle,
        description: copy.questionDescription,
        actionLabel: copy.startQuestions,
        icon: MessageCircleHeart,
        iconClass: "bg-primary-100 text-primary-700",
        surfaceClass:
          "from-primary-50 via-white to-rose-50/80 border-primary-100",
        accentClass: "text-primary-700",
      };
    }

    const entry = choose(journalEntries);
    return {
      kind: "journal" as const,
      itemId: entry?.id,
      category: undefined,
      eyebrow: entry ? "From your story" : "Make space for your story",
      title: entry?.title || (entry ? copy.journalMemory : copy.journalTitle),
      description: entry?.content || copy.journalDescription,
      actionLabel: copy.openJournal,
      icon: PenLine,
      iconClass: "bg-sky-100 text-sky-700",
      surfaceClass: "from-sky-50 via-white to-cyan-50/80 border-sky-100",
      accentClass: "text-sky-800",
    };
  }, [
    copy,
    devotionals,
    journalEntries,
    language,
    spotlightKind,
    spotlightQuestions,
    spotlightShuffle,
  ]);

  const openSpotlight = () => {
    if (spotlight.kind === "devotion") {
      if (spotlight.itemId && onOpenDevotional)
        onOpenDevotional(spotlight.itemId);
      else onNavigate?.("devotions");
      return;
    }
    if (spotlight.kind === "question") {
      if (onStartQuestion) onStartQuestion(spotlight.category);
      else onScreenNavigate?.("category-selection");
      return;
    }
    onNavigate?.("journal");
  };

  const shuffleSpotlight = () => {
    setSpotlightKind((current) => pickRandomHomeSpotlight(current));
    setSpotlightShuffle((current) => current + 1);
  };
  const SpotlightIcon = spotlight.icon;

  const relationshipStart = [
    profile?.relationshipStart,
    profile?.relationship_start,
    partner?.relationshipStart,
    partner?.relationship_start,
  ].find((value) => value && parseRelationshipStart(value));
  const upcomingMilestone = milestones
    .filter((milestone) => new Date(milestone.date).getTime() > Date.now())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const moodChoices = [
    { value: "great", label: t.mood.great, icon: Laugh },
    { value: "good", label: t.mood.good, icon: Smile },
    { value: "okay", label: t.mood.okay, icon: Meh },
    { value: "sad", label: t.mood.sad, icon: Frown },
  ] as const;
  const userName = profile?.name || profile?.full_name || copy.you;
  const partnerName = partner?.name || partner?.full_name || copy.partner;
  const activityLabel =
    spotlight.kind === "devotion"
      ? t.nav.devotions
      : spotlight.kind === "question"
        ? t.dashboard.questions
        : t.nav.journal;

  return (
    <div className="journey-dashboard">
      <LoveJourneyHeader
        user={{
          id: profile?.id || "",
          name: userName,
          avatar: profile?.profilePicture || profile?.avatar_url || undefined,
        }}
        partner={
          partner
            ? {
                id: partner.id,
                name: partnerName,
                avatar:
                  partner.profilePicture || partner.avatar_url || undefined,
              }
            : undefined
        }
        start={relationshipStart || undefined}
        accessToken={accessToken}
        milestones={milestones}
        onEdit={() => onNavigate?.("profile")}
        onViewMemories={() => onScreenNavigate?.("milestones")}
      />

      <section
        className="journey-card journey-spotlight"
        data-spotlight-kind={spotlight.kind}
        aria-labelledby="home-spotlight-title"
      >
        <div className="journey-spotlight-top">
          <span className="journey-spotlight-label">
            <SpotlightIcon size={16} aria-hidden="true" />
            {copy.forToday} · {activityLabel}
          </span>
          <button
            type="button"
            onClick={shuffleSpotlight}
            className="journey-icon-button journey-shuffle"
            aria-label={copy.shuffle}
          >
            <Shuffle size={14} aria-hidden="true" />
          </button>
        </div>
        <h2 id="home-spotlight-title">{spotlight.title}</h2>
        <p>{spotlight.description}</p>
        <div className="journey-daily-footer">
          <button
            type="button"
            className="journey-primary"
            onClick={openSpotlight}
          >
            {spotlight.actionLabel}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </section>

      {partner && (
        <section
          className="journey-mood-section"
          aria-labelledby="journey-mood-title"
        >
          <div className="journey-section-title">
            <h2 id="journey-mood-title">{copy.moodTitle}</h2>
            <button
              type="button"
              onClick={() => onScreenNavigate?.("mood-analytics")}
              aria-label={copy.moodAnalytics}
            >
              {copy.checkIn}
            </button>
          </div>
          <div
            className="journey-moods"
            role="group"
            aria-label={t.dashboard.yourMood}
          >
            {moodChoices.map(({ value, label, icon: Icon }) => (
              <button
                type="button"
                key={value}
                aria-pressed={todaysMood?.mood === value}
                disabled={isSavingMood}
                onClick={() => handleMoodUpdate(value)}
              >
                <Icon size={25} strokeWidth={1.5} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <p className="journey-partner-mood">
            <Heart size={13} aria-hidden="true" />
            <span>
              {partnerName} {t.dashboard.shared.toLocaleLowerCase()}:{" "}
              <strong>
                {partnerMood
                  ? moodChoices.find((mood) => mood.value === partnerMood.mood)
                      ?.label
                  : t.dashboard.notSharedYet}
              </strong>
            </span>
          </p>
          <span className="sr-only" role="status">
            {todaysMood ? copy.moodSaved : ""}
          </span>
        </section>
      )}

      <div
        className="journey-shortcuts"
        role="group"
        aria-label={t.dashboard.quickActions}
      >
        <button type="button" onClick={() => onNavigate?.("chat")}>
          <MessageCircleHeart size={17} aria-hidden="true" />
          {t.nav.chat}
        </button>
        <button type="button" onClick={() => onNavigate?.("journal")}>
          <PenLine size={17} aria-hidden="true" />
          {t.nav.journal}
        </button>
        <button
          type="button"
          onClick={() => onScreenNavigate?.("couple-calendar")}
        >
          <Calendar size={17} aria-hidden="true" />
          {copy.calendar}
        </button>
      </div>

      <section className="journey-plans" aria-labelledby="journey-plans-title">
        <div className="journey-section-title">
          <h2 id="journey-plans-title">{copy.plans}</h2>
          <button
            type="button"
            onClick={() => onScreenNavigate?.("couple-calendar")}
          >
            {t.dashboard.viewAll}
          </button>
        </div>
        {upcomingMilestone ? (
          <button
            type="button"
            className="journey-plan"
            onClick={() => onScreenNavigate?.("milestones")}
          >
            <span className="journey-plan-date">
              <small>
                {new Date(upcomingMilestone.date).toLocaleDateString(language, {
                  month: "short",
                })}
              </small>
              <b>{new Date(upcomingMilestone.date).getDate()}</b>
            </span>
            <span className="journey-plan-copy">
              <strong>{upcomingMilestone.title}</strong>
              <small>
                {new Date(upcomingMilestone.date).toLocaleDateString(language, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </small>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className="journey-plan"
            onClick={() => onScreenNavigate?.("couple-calendar")}
          >
            <span className="journey-plan-date">
              <Calendar size={20} aria-hidden="true" />
            </span>
            <span className="journey-plan-copy">
              <strong>{calendarCopy.calendarCta}</strong>
              <small>{calendarCopy.calendarCtaHint}</small>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </section>

      <section
        className="journey-card journey-rhythm"
        aria-labelledby="journey-rhythm-title"
      >
        <div className="journey-section-title">
          <h2 id="journey-rhythm-title">{copy.rhythm}</h2>
          <button
            type="button"
            onClick={() => setProgressExpanded((value) => !value)}
            aria-expanded={progressExpanded}
            aria-controls="journey-progress-detail"
          >
            {copy.viewProgress}
          </button>
        </div>
        <p>
          <strong>
            {devotionalStreakValue} {copy.streak}.
          </strong>{" "}
          {copy.rhythmHint}
        </p>
        <div className="journey-metrics">
          <button type="button" onClick={() => onNavigate?.("devotions")}>
            <strong>{devotionalCompletedCount}</strong>
            <span>{copy.read}</span>
          </button>
          <button type="button" onClick={() => onNavigate?.("prayer")}>
            <strong>
              {answeredPrayers} / {totalPrayers}
            </strong>
            <span>{copy.answeredPrayers}</span>
          </button>
          <button type="button" onClick={() => onNavigate?.("journal")}>
            <strong>{sharedJournalEntries}</strong>
            <span>{copy.sharedJournals}</span>
          </button>
        </div>
        <div
          id="journey-progress-detail"
          className="journey-progress-detail"
          hidden={!progressExpanded}
        >
          <button
            type="button"
            onClick={() => onScreenNavigate?.("category-selection")}
          >
            <strong>
              {questionsAnswered}
              {totalQuestionsCount > 0 ? " / " + totalQuestionsCount : ""}
            </strong>
            <span>
              {t.dashboard.questions} · {t.dashboard.answered}
            </span>
          </button>
        </div>
      </section>

      <details
        className="journey-card journey-explore"
        onToggle={(event) => {
          if (!event.currentTarget.open) setChampionsExpanded(false);
        }}
      >
        <summary>
          <span>
            <strong>{copy.explore}</strong>
          </span>
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
        <div className="journey-tools">
          {[
            { label: copy.learning, icon: BookOpen, screen: "guidance" },
            { label: copy.character, icon: Hammer, screen: "character-house" },
            { label: copy.scripture, icon: Brain, screen: "scripture-memory" },
            { label: copy.milestones, icon: Calendar, screen: "milestones" },
          ].map(({ label, icon: Icon, screen }) => (
            <button
              key={screen}
              type="button"
              onClick={() => onScreenNavigate?.(screen)}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setChampionsExpanded((value) => !value)}
            aria-expanded={championsExpanded}
          >
            {copy.champions}
          </button>
          <button type="button" onClick={() => onNavigate?.("community")}>
            <Users size={17} aria-hidden="true" />
            {t.nav.community}
          </button>
        </div>
        {championsExpanded && (
          <div className="journey-extras">
            <ChampionsCard />
          </div>
        )}
      </details>

      <section
        className="journey-card journey-verse"
        aria-labelledby="journey-verse-title"
      >
        <h2 id="journey-verse-title" className="sr-only">
          {t.dashboard.dailyVerse}
        </h2>
        {isLoadingVerse ? (
          <p className="journey-verse-reference" role="status">
            {t.common.loading}
          </p>
        ) : (
          dailyVerse && (
            <>
              <blockquote
                lang={
                  verseLanguage === "am" && dailyVerse.amharicText ? "am" : "en"
                }
              >
                {verseLanguage === "am" && dailyVerse.amharicText
                  ? dailyVerse.amharicText
                  : dailyVerse.text}
              </blockquote>
              <p className="journey-verse-reference">
                {verseLanguage === "am" && dailyVerse.amharicReference
                  ? dailyVerse.amharicReference
                  : dailyVerse.reference}
              </p>
              <button
                type="button"
                className="journey-primary"
                onClick={() => setIsBibleReaderOpen(true)}
              >
                <BookOpen size={15} aria-hidden="true" />
                {t.dashboard.readFullChapter} <span aria-hidden="true">→</span>
              </button>
            </>
          )
        )}
        <div
          className="journey-verse-languages"
          role="group"
          aria-label={t.language.select}
        >
          {(["en", "am"] as const).map((lang) => (
            <button
              type="button"
              key={lang}
              aria-pressed={verseLanguage === lang}
              onClick={() => setVerseLanguage(lang)}
            >
              {lang === "en" ? "English" : "አማርኛ"}
            </button>
          ))}
        </div>
      </section>

      {profile?.id && accessToken && (
        <PushNotificationSetup
          userId={profile.id}
          accessToken={accessToken}
          reminderOnly
        />
      )}

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
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify(data),
                },
              );

              if (!response.ok) {
                throw new Error("Failed to save highlight");
              }
            } catch (error) {
              console.error("Error saving highlight:", error);
              throw error;
            }
          }}
          onShareWithPartner={async (data) => {
            try {
              const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/share-verse`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify(data),
                },
              );

              if (!response.ok) {
                throw new Error("Failed to share verse");
              }
            } catch (error) {
              console.error("Error sharing verse:", error);
              throw error;
            }
          }}
        />
      )}
    </div>
  );
}
