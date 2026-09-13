/* MARKER-MAKE-KIT-DISCOVERY-READ */
import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Heart,
  MessageCircle,
  DollarSign,
  Home,
  Lock,
  AlertTriangle,
} from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";
import { toast } from "sonner";

const DEFAULT_MODULES = [
  {
    id: "module-1",
    title: "God's Design for Marriage",
    subtitle: "Biblical Foundations of Covenant",
    description:
      "Explore the divine blueprint for marriage — from Genesis to Ephesians. Discover why God created marriage as a sacred covenant and how a Christ-centered union reflects His relationship with the Church.",
    scripture:
      '"Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh."',
    scriptureRef: "Genesis 2:24",
    lessons: [
      {
        id: "1a",
        title: "Marriage as Covenant, Not Contract",
        duration: "20 min",
      },
      {
        id: "1b",
        title: "The Trinity's Reflection in Marriage",
        duration: "25 min",
      },
      {
        id: "1c",
        title: "Leaving & Cleaving: Prioritizing Your Spouse",
        duration: "20 min",
      },
      {
        id: "1d",
        title: "Marriage as a Gospel Picture",
        duration: "30 min",
      },
    ],
    iconKey: "book",
    accentColor: "var(--primary-600)",
    accentBg: "var(--primary-50)",
    accentBorder: "var(--primary-200)",
    duration: "1h 35m",
    isLocked: false,
  },
  {
    id: "module-2",
    title: "Communication & Conflict",
    subtitle: "Speaking Truth in Love",
    description:
      "Learn the art of Christ-like communication. Discover how to listen deeply, express vulnerably, and resolve conflict in ways that strengthen your bond rather than erode it.",
    scripture:
      '"Be quick to hear, slow to speak, slow to anger; for the anger of man does not produce the righteousness of God."',
    scriptureRef: "James 1:19–20",
    lessons: [
      {
        id: "2a",
        title: "The Listening Heart",
        duration: "25 min",
      },
      {
        id: "2b",
        title: "Expressing Needs Without Contempt",
        duration: "20 min",
      },
      {
        id: "2c",
        title: "Biblical Conflict Resolution",
        duration: "30 min",
      },
      {
        id: "2d",
        title: "Forgiveness as a Daily Practice",
        duration: "25 min",
      },
    ],
    iconKey: "message",
    accentColor: "var(--secondary-600)",
    accentBg: "var(--secondary-50)",
    accentBorder: "var(--secondary-200)",
    duration: "1h 40m",
    isLocked: false,
  },
  {
    id: "module-3",
    title: "Roles & Servant Leadership",
    subtitle: "Partnership Rooted in Christ",
    description:
      "Discover what Scripture truly teaches about roles in marriage — not hierarchy for dominance, but servant leadership and mutual submission that mirrors Christ's love for the Church.",
    scripture:
      '"Submit to one another out of reverence for Christ… Husbands, love your wives, as Christ loved the church."',
    scriptureRef: "Ephesians 5:21, 25",
    lessons: [
      {
        id: "3a",
        title: "Mutual Submission in Christ",
        duration: "25 min",
      },
      {
        id: "3b",
        title: "The Husband as Servant-Leader",
        duration: "25 min",
      },
      {
        id: "3c",
        title: "The Wife's Strength and Wisdom",
        duration: "20 min",
      },
      {
        id: "3d",
        title: "Decision-Making as a Team",
        duration: "25 min",
      },
    ],
    iconKey: "heart",
    accentColor: "var(--success-700)",
    accentBg: "var(--success-50)",
    accentBorder: "var(--success-200)",
    duration: "1h 35m",
    isLocked: false,
  },
  {
    id: "module-4",
    title: "Finances & Stewardship",
    subtitle: "Managing Money with Biblical Wisdom",
    description:
      "Money is one of the top sources of marital conflict. Build a biblical framework for managing finances together — budgeting, giving, debt, and trusting God as your ultimate provider.",
    scripture:
      '"Bring the full tithe into the storehouse… and thereby put me to the test, says the LORD of hosts."',
    scriptureRef: "Malachi 3:10",
    lessons: [
      {
        id: "4a",
        title: "God as Owner; We Are Stewards",
        duration: "20 min",
      },
      {
        id: "4b",
        title: "Building a Budget as a Team",
        duration: "25 min",
      },
      {
        id: "4c",
        title: "Debt, Saving & Financial Goals",
        duration: "30 min",
      },
      {
        id: "4d",
        title: "Generosity & Tithing Together",
        duration: "20 min",
      },
    ],
    iconKey: "dollar",
    accentColor: "var(--warning-700)",
    accentBg: "var(--warning-50)",
    accentBorder: "var(--warning-200)",
    duration: "1h 35m",
    isLocked: false,
  },
  {
    id: "module-5",
    title: "Building Your Future Together",
    subtitle: "Family, Calling & Community",
    description:
      "Envision and plan your life together — children, extended family, calling, church community, and the legacies you will build. Align your God-given purposes and plant roots that last.",
    scripture:
      '"Unless the LORD builds the house, those who build it labor in vain."',
    scriptureRef: "Psalm 127:1",
    lessons: [
      {
        id: "5a",
        title: "Navigating In-Laws & Healthy Boundaries",
        duration: "25 min",
      },
      {
        id: "5b",
        title: "Children & Parenting Philosophy",
        duration: "30 min",
      },
      {
        id: "5c",
        title: "Your Shared Calling & Vocation",
        duration: "25 min",
      },
      {
        id: "5d",
        title: "Planting Roots in a Church Home",
        duration: "20 min",
      },
    ],
    iconKey: "home",
    accentColor: "var(--neutral-700)",
    accentBg: "var(--neutral-100)",
    accentBorder: "var(--neutral-200)",
    duration: "1h 40m",
    isLocked: false,
  },
];

type DefaultModule = (typeof DEFAULT_MODULES)[number];

const ACCENT_PALETTES = [
  {
    accentColor: "#e11d48",
    accentBg: "#fff1f2",
    accentBorder: "#ffe4e6",
  }, // Rose / Primary
  {
    accentColor: "#7c3aed",
    accentBg: "#f5f3ff",
    accentBorder: "#ede9fe",
  }, // Violet / Secondary
  {
    accentColor: "#15803d",
    accentBg: "#f0fdf4",
    accentBorder: "#dcfce7",
  }, // Green / Success
  {
    accentColor: "#b45309",
    accentBg: "#fffbeb",
    accentBorder: "#fef3c7",
  }, // Amber / Warning
  {
    accentColor: "#475569",
    accentBg: "#f8fafc",
    accentBorder: "#e2e8f0",
  }, // Slate / Neutral
];

function normaliseModule(m: any, index: number): DefaultModule {
  const pal = ACCENT_PALETTES[index % ACCENT_PALETTES.length];

  // Clean duration formatting suffix safely
  let cleanDuration = m.duration || "";
  if (cleanDuration && !isNaN(Number(cleanDuration))) {
    cleanDuration = `${cleanDuration} min`;
  } else if (!cleanDuration) {
    cleanDuration = `${(m.lessons?.length || 1) * 20} min`;
  }

  // Handle fallback quote since scripture elements aren't in your root exported JSON object structure
  const fallbackScripture =
    m.scripture ||
    m.verse ||
    "“Unless the Lord builds the house, those who build it labor in vain.”";
  const fallbackRef =
    m.scriptureRef ||
    m.verseReference ||
    m.reference ||
    "Psalm 127:1";

  return {
    id: m.id,
    title: m.title || "",
    subtitle: m.subtitle || "",
    description: m.description || "",
    scripture: fallbackScripture,
    scriptureRef: fallbackRef,
    iconKey: m.icon || m.iconKey || "book", // Reads the explicit "icon" variable from uploaded JSON database rows
    duration: cleanDuration,
    isLocked: false,
    lessons: (m.lessons || []).map((l: any) => ({
      id: l.id,
      title: l.title,
      duration:
        l.duration && !isNaN(Number(l.duration))
          ? `${l.duration} min`
          : l.duration || "20 min",
      content: l.content || "",
    })),
    accentColor:
      m.color && m.color.includes("var")
        ? m.color
        : pal.accentColor,
    accentBg: pal.accentBg,
    accentBorder: pal.accentBorder,
  } as DefaultModule;
}

interface PreMarriageHubProps {
  onModuleClick: (moduleId: string) => void;
  accessToken?: string;
  onBack?: () => void;
  onViewReadiness?: () => void;
}

function ModuleIcon({
  iconKey,
  color,
}: {
  iconKey: string;
  color: string;
}) {
  const s = {
    color,
    width: 22,
    height: 22,
  } as React.CSSProperties;
  // Support both Lucide keys and raw emoji strings gracefully
  if (iconKey === "message" || iconKey === "😊")
    return <MessageCircle style={s} />;
  if (iconKey === "heart" || iconKey === "❤️")
    return <Heart style={s} />;
  if (iconKey === "dollar" || iconKey === "💍")
    return <DollarSign style={s} />;
  if (iconKey === "home" || iconKey === "🏠")
    return <Home style={s} />;
  return <BookOpen style={s} />;
}

function LinearProgress({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        height: 6,
        borderRadius: "9999px",
        backgroundColor: "#e2e8f0",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          backgroundColor: color,
          borderRadius: "9999px",
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

function ModuleCard({
  module,
  index,
  progress,
  onModuleClick,
}: {
  module: DefaultModule;
  index: number;
  progress: number;
  onModuleClick: (id: string) => void;
}) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);
  const isComplete = progress === 100;
  const hasStarted = progress > 0 && !isComplete;

  const ctaLabel = isComplete
    ? t?.common?.previous || "Review"
    : hasStarted
      ? t?.common?.next || "Continue"
      : t?.common?.ok || "Start";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() =>
        !module.isLocked && onModuleClick(module.id)
      }
      onKeyDown={(e) =>
        e.key === "Enter" &&
        !module.isLocked &&
        onModuleClick(module.id)
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: `1px solid ${hovered && !module.isLocked ? module.accentColor : "#e2e8f0"}`,
        boxShadow:
          hovered && !module.isLocked
            ? "0 4px 6px -1px rgba(0,0,0,0.1)"
            : "0 1px 3px rgba(0,0,0,0.05)",
        padding: "16px",
        cursor: module.isLocked ? "not-allowed" : "pointer",
        opacity: module.isLocked ? 0.55 : 1,
        transform:
          hovered && !module.isLocked
            ? "translateY(-2px)"
            : "translateY(0)",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "8px",
            backgroundColor: module.accentBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isComplete ? (
            <CheckCircle2
              style={{
                width: 24,
                height: 24,
                color: "#16a34a",
              }}
            />
          ) : module.isLocked ? (
            <Lock
              style={{
                width: 22,
                height: 22,
                color: "#94a3b8",
              }}
            />
          ) : (
            <ModuleIcon
              iconKey={module.iconKey}
              color={module.accentColor}
            />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#0f172a",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {module.title}
            </p>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: module.accentColor,
                backgroundColor: module.accentBg,
                borderRadius: "9999px",
                padding: "2px 10px",
                flexShrink: 0,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: module.accentColor,
              fontWeight: 500,
              margin: "2px 0 0 0",
            }}
          >
            {module.subtitle}
          </p>
        </div>
      </div>

      <div
        style={{
          padding: "12px",
          backgroundColor: module.accentBg,
          borderRadius: "8px",
          borderLeft: `4px solid ${module.accentColor}`,
        }}
      >
        <p
          style={{
            fontSize: "13px",
            color: "#334155",
            fontStyle: "italic",
            margin: "0 0 4px 0",
            lineHeight: 1.5,
          }}
        >
          {module.scripture}
        </p>
        <p
          style={{
            fontSize: "12px",
            color: module.accentColor,
            fontWeight: 600,
            margin: 0,
          }}
        >
          — {module.scriptureRef}
        </p>
      </div>

      <p
        style={{
          fontSize: "14px",
          color: "#475569",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {module.description}
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {(module.lessons || []).slice(0, 3).map((lesson) => (
          <div
            key={lesson.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: module.accentColor,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "13px",
                color: "#475569",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {lesson.title}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                flexShrink: 0,
              }}
            >
              {lesson.duration}
            </span>
          </div>
        ))}
        {module.lessons && module.lessons.length > 3 && (
          <span
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              paddingLeft: 14,
            }}
          >
            +{module.lessons.length - 3} more lessons
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyBetween: "space-between",
          gap: "12px",
          marginTop: "4px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span
              style={{ fontSize: "12px", color: "#64748b" }}
            >
              {module.lessons?.length || 0} lessons ·{" "}
              {module.duration}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: isComplete ? "#16a34a" : "#64748b",
                fontWeight: 500,
              }}
            >
              {isComplete
                ? "✓ Complete"
                : hasStarted
                  ? `${progress}%`
                  : "Not started"}
            </span>
          </div>
          <LinearProgress
            value={progress}
            color={isComplete ? "#16a34a" : module.accentColor}
          />
        </div>

        {!module.isLocked && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              backgroundColor: module.accentColor,
              color: "#ffffff",
              borderRadius: "9999px",
              padding: "6px 14px",
              fontSize: "13px",
              fontWeight: 600,
              flexShrink: 0,
              minWidth: 90,
              justifyContent: "center",
            }}
          >
            {ctaLabel}
            <ChevronRight style={{ width: 14, height: 14 }} />
          </div>
        )}
      </div>
    </div>
  );
}

export function PreMarriageHub({
  onModuleClick,
  accessToken,
  onBack,
  onViewReadiness,
}: PreMarriageHubProps) {
  const { t, language: appLanguage } = useLanguage();
  const [progressMap, setProgressMap] = useState<
    Record<string, number>
  >({});
  const [isLoadingProgress, setIsLoadingProgress] =
    useState(true);
  const [apiModules, setApiModules] = useState<any[] | null>(
    null,
  );
  const [fetchError, setFetchError] = useState<string | null>(
    null,
  );

  const validLang =
    appLanguage === "am" || appLanguage === "om"
      ? appLanguage
      : "en";
  const [selectedLanguage, setSelectedLanguage] = useState<
    "en" | "am" | "om"
  >(validLang as "en" | "am" | "om");

  useEffect(() => {
    const l =
      appLanguage === "am" || appLanguage === "om"
        ? appLanguage
        : "en";
    setSelectedLanguage(l as "en" | "am" | "om");
  }, [appLanguage]);

  useEffect(() => {
    setApiModules(null);
    setFetchError(null);

    // Explicitly bypass loading online database values for standard English to use default configurations
    if (selectedLanguage === "en") {
      setIsLoadingProgress(false);
      return;
    }

    const token = accessToken || publicAnonKey;
    fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules?language=${selectedLanguage}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
      .then((r) =>
        r.ok
          ? r.json()
          : Promise.reject(`Server returned HTTP ${r.status}`),
      )
      .then((data) => {
        if (data && Array.isArray(data.modules)) {
          if (data.modules.length === 0) {
            setApiModules([]);
          } else {
            const sorted = [...data.modules].sort((a, b) =>
              String(a.id).localeCompare(
                String(b.id),
                undefined,
                { numeric: true },
              ),
            );
            setApiModules(
              sorted.map((m: any, i: number) =>
                normaliseModule(m, i),
              ),
            );
          }
        } else {
          throw new Error(
            "Invalid response format missing modules list configuration array",
          );
        }
      })
      .catch((err) => {
        console.error(
          "[PreMarriageHub] Fetch modules failed:",
          err,
        );
        setFetchError(String(err));
        toast.error(
          `Could not sync language modules: ${String(err)}`,
        );
      });
  }, [accessToken, selectedLanguage]);

  useEffect(() => {
    const modList =
      selectedLanguage === "en" || apiModules === null
        ? DEFAULT_MODULES
        : apiModules;
    if (modList.length === 0) {
      setIsLoadingProgress(false);
      return;
    }

    const fetchProgress = async () => {
      setIsLoadingProgress(true);
      const map: Record<string, number> = {};
      await Promise.allSettled(
        modList.map(async (m: any) => {
          try {
            const res = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules/${m.id}/progress`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken || publicAnonKey}`,
                },
              },
            );
            if (res.ok) {
              const { progress } = await res.json();
              map[m.id] =
                typeof progress === "number" ? progress : 0;
            }
          } catch {}
        }),
      );
      setProgressMap(map);
      setIsLoadingProgress(false);
    };
    fetchProgress();
  }, [accessToken, apiModules, selectedLanguage]);

  const modules: any[] =
    selectedLanguage === "en" || apiModules === null
      ? DEFAULT_MODULES
      : apiModules;
  const completedCount = modules.filter(
    (m) => (progressMap[m.id] || 0) === 100,
  ).length;
  const overallProgress = modules.length
    ? Math.round(
        modules.reduce(
          (acc, m) => acc + (progressMap[m.id] || 0),
          0,
        ) / modules.length,
      )
    : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        paddingBottom: "40px",
        fontFamily: "inherit",
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "14px",
            color: "#475569",
            fontWeight: 500,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          <ChevronLeft style={{ width: 18, height: 18 }} />
          {t?.common?.back || "Back"}
        </button>
      )}

      {/* Hero Banner */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #be123c 0%, #f43f5e 100%)",
          borderRadius: "16px",
          padding: "24px",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "8px",
              backgroundColor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen
              style={{
                width: 24,
                height: 24,
                color: "#ffffff",
              }}
            />
          </div>
          <div>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#ffffff",
                margin: 0,
              }}
            >
              Pre-Marriage Guidance
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.85)",
                margin: "2px 0 0 0",
              }}
            >
              Prepare for a Christ-centered marriage
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: "8px",
            padding: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.9)",
                fontWeight: 500,
              }}
            >
              Overall Progress
            </span>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              {isLoadingProgress ? "–" : `${overallProgress}%`}
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: "9999px",
              backgroundColor: "rgba(255,255,255,0.3)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${overallProgress}%`,
                backgroundColor: "#ffffff",
                transition: "width 0.6s ease",
              }}
            />
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.75)",
              margin: "8px 0 0 0",
            }}
          >
            {completedCount} of {modules.length} modules
            completed
            {completedCount === modules.length &&
              modules.length > 0 &&
              " · Certificate ready! 🎓"}
          </p>
        </div>
      </div>

      {/* Marriage Readiness CTA */}
      {onViewReadiness && (
        <button
          onClick={onViewReadiness}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "16px 20px",
            borderRadius: "14px",
            border: "2px solid var(--primary)",
            background: "color-mix(in srgb, var(--primary) 8%, var(--background))",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 20 }}>💑</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>Marriage Readiness Analysis</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>AI-powered report · Score · Certificate</p>
            </div>
          </div>
          <ChevronLeft style={{ width: 18, height: 18, color: "var(--primary)", transform: "rotate(180deg)" }} />
        </button>
      )}

      {/* Language Toggle Options */}
      

      {/* Segment Header */}
      <div>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#1e293b",
            margin: "0 0 2px 0",
          }}
        >
          Your Learning Path
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "#64748b",
            margin: 0,
          }}
        >
          {modules.length} modules · Work through them in order
        </p>
      </div>

      {/* Explicit Fetch Error Diagnostics Display panel */}
      {fetchError && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            p: "12px",
            backgroundColor: "#fff1f2",
            border: "1px solid #fda4af",
            borderRadius: "12px",
            padding: "12px",
          }}
        >
          <AlertTriangle
            style={{
              color: "#e11d48",
              width: 20,
              height: 20,
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#9f1239",
                margin: 0,
              }}
            >
              Network Sync Failed
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#be123c",
                margin: "2px 0 0 0",
              }}
            >
              {fetchError}
            </p>
          </div>
        </div>
      )}

      {/* Empty State Layout Fallback handler */}
      {modules.length === 0 && !fetchError && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 16px",
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <p
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#334155",
              margin: "0 0 8px 0",
            }}
          >
            No modules yet in this language configuration
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              margin: 0,
            }}
          >
            Upload this language dataset inside Admin → Learning
            Modules → Import
          </p>
        </div>
      )}

      {/* Module Rendering Array Loop — sequential unlock */}
      {modules.map((module, index) => {
        const prevModule = index > 0 ? modules[index - 1] : null;
        const isLocked = prevModule ? (progressMap[prevModule.id] ?? 0) < 100 : false;
        return (
          <ModuleCard
            key={module.id}
            module={{ ...module, isLocked }}
            index={index}
            progress={progressMap[module.id] || 0}
            onModuleClick={onModuleClick}
          />
        );
      })}

      {/* Certificate Confirmation Row */}
      {completedCount === modules.length &&
        modules.length > 0 && (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #22c55e",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#15803d",
                margin: "0 0 4px 0",
              }}
            >
              🎓 All Modules Complete!
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#166534",
                margin: 0,
              }}
            >
              You've earned your Pre-Marriage Certificate. Well
              done!
            </p>
          </div>
        )}
    </div>
  );
}