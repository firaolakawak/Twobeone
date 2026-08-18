import { useState, useEffect } from "react";
import {
  BookOpen,
  ArrowRight,
  MessageCircle,
  Heart,
  DollarSign,
  Home,
  CheckCircle2,
} from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";

/* ── Same 5 module stubs used for the dashboard preview ── */
const PREVIEW_MODULES = [
  {
    id: "module-1",
    iconKey: "book",
    accentColor: "var(--primary-600)",
    accentBg: "var(--primary-50)",
  },
  {
    id: "module-2",
    iconKey: "message",
    accentColor: "var(--secondary-600)",
    accentBg: "var(--secondary-50)",
  },
  {
    id: "module-3",
    iconKey: "heart",
    accentColor: "var(--success-700)",
    accentBg: "var(--success-50)",
  },
  {
    id: "module-4",
    iconKey: "dollar",
    accentColor: "var(--warning-700)",
    accentBg: "var(--warning-50)",
  },
  {
    id: "module-5",
    iconKey: "home",
    accentColor: "var(--neutral-700)",
    accentBg: "var(--neutral-100)",
  },
];

const LEARNING_MODULES_I18N = {
  en: {
    title: "Pre-Marriage Guidance",
    modulesCount: (count: number) => `${count} modules`,
    completedCount: (done: number, total: number) =>
      `${done} of ${total} complete`,
    done: "Done ✓",
    viewAll: (count: number) => `View All ${count} Modules`,
    moduleTitles: {
      "module-1": "God's Design for Marriage",
      "module-2": "Communication & Conflict",
      "module-3": "Roles & Servant Leadership",
      "module-4": "Finances & Stewardship",
      "module-5": "Building Your Future Together",
    },
  },

  am: {
    title: "የቅድመ-ጋብቻ መመሪያ",
    modulesCount: (count: number) => `${count} ሞጁሎች`,
    completedCount: (done: number, total: number) =>
      `ከ${total} ውስጥ ${done} ተጠናቋል`,
    done: "ተጠናቋል ✓",
    viewAll: (count: number) => `ሁሉንም ${count} ሞጁሎች ይመልከቱ`,
    moduleTitles: {
      "module-1": "እግዚአብሔር ለጋብቻ ያዘጋጀው ዓላማ",
      "module-2": "ግንኙነት እና ግጭት",
      "module-3": "ሚናዎች እና አገልጋይ መሪነት",
      "module-4": "ፋይናንስ እና ባለአደራነት",
      "module-5": "የወደፊታችሁን አብራችሁ መገንባት",
    },
  },

  om: {
    title: "Qajeelfama Gaa'ila Duraa",
    modulesCount: (count: number) => `Moojuloota ${count}`,
    completedCount: (done: number, total: number) =>
      `${total} keessaa ${done} xumurame`,
    done: "Xumurame ✓",
    viewAll: (count: number) =>
      `Moojuloota ${count} hunda ilaali`,
    moduleTitles: {
      "module-1": "Kaayyoo Waaqayyoo Gaa'ilaaf",
      "module-2": "Walqunnamtii fi Waldhabdee",
      "module-3": "Gahee fi Geggeessummaa Tajaajilaa",
      "module-4": "Maallaqa fi Amanamummaadhaan Bulchuu",
      "module-5": "Fuuldura Keessan Waliin Ijaaruu",
    },
  },
} as const;

function SmallIcon({
  iconKey,
  color,
}: {
  iconKey: string;
  color: string;
}) {
  const s = {
    color,
    width: 18,
    height: 18,
  } as React.CSSProperties;
  if (iconKey === "message") return <MessageCircle style={s} />;
  if (iconKey === "heart") return <Heart style={s} />;
  if (iconKey === "dollar") return <DollarSign style={s} />;
  if (iconKey === "home") return <Home style={s} />;
  return <BookOpen style={s} />;
}

interface LearningModulesCardProps {
  onViewAll?: () => void;
  accessToken?: string;
}

export function LearningModulesCard({
  onViewAll,
  accessToken,
}: LearningModulesCardProps) {
  const [progressMap, setProgressMap] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic language check fallback
  const currentLang =
    localStorage.getItem("twobeone_language") || "en";
  const vocab =
    LEARNING_MODULES_I18N[
      currentLang as keyof typeof LEARNING_MODULES_I18N
    ] || LEARNING_MODULES_I18N.en;

  useEffect(() => {
    const fetchProgress = async () => {
      setIsLoading(true);
      const map: Record<string, number> = {};
      await Promise.allSettled(
        PREVIEW_MODULES.map(async (m) => {
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
      setIsLoading(false);
    };
    fetchProgress();
  }, [accessToken]);

  const overallProgress = PREVIEW_MODULES.length
    ? Math.round(
        PREVIEW_MODULES.reduce(
          (acc, m) => acc + (progressMap[m.id] || 0),
          0,
        ) / PREVIEW_MODULES.length,
      )
    : 0;

  const completedCount = PREVIEW_MODULES.filter(
    (m) => (progressMap[m.id] || 0) === 100,
  ).length;

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #ffffff 0%, #fff7f9 58%, #f8f5ff 100%)",
        borderRadius: "28px",
        border: "1px solid #ffe4e6",
        boxShadow: "0 18px 48px -34px rgba(190,24,93,.32)",
        overflow: "hidden",
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #e11d48 0%, #be123c 58%, #9f1239 100%)",
          padding: "20px",
          borderBottom: "1px solid rgba(159,18,57,.28)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-2)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "16px",
                backgroundColor: "rgba(255,255,255,.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen
                style={{ width: 16, height: 16, color: "#ffffff" }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-callout)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "#ffffff",
                  margin: 0,
                }}
              >
                {vocab.title}
              </p>
              <p
                style={{
                  fontSize: "var(--text-label)",
                  color: "rgba(255,255,255,.78)",
                  margin: 0,
                }}
              >
                {vocab.modulesCount(PREVIEW_MODULES.length)}
              </p>
            </div>
          </div>
          <span
            style={{
              fontSize: "var(--text-label)",
              fontWeight: "var(--font-weight-semibold)",
              color: "#ffffff",
              backgroundColor: "rgba(255,255,255,.16)",
              borderRadius: "var(--radius-full)",
              padding: "2px 10px",
            }}
          >
            {isLoading ? "–" : `${overallProgress}%`}
          </span>
        </div>

        {/* Progress Bar underlay */}
        <div
          style={{
            marginTop: "var(--spacing-2)",
            height: 5,
            borderRadius: "var(--radius-full)",
            backgroundColor: "rgba(255,255,255,.24)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${overallProgress}%`,
              background: "#ffffff",
              borderRadius: "var(--radius-full)",
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <p
          style={{
            fontSize: "var(--text-label)",
            color: "rgba(255,255,255,.78)",
            margin: "var(--spacing-1) 0 0 0",
          }}
        >
          {vocab.completedCount(
            completedCount,
            PREVIEW_MODULES.length,
          )}
        </p>
      </div>

      {/* Module Rows mapping layout array loops */}
      <div style={{ padding: "10px 12px" }}>
        {PREVIEW_MODULES.map((m, idx) => {
          const prog = progressMap[m.id] || 0;
          const done = prog === 100;

          // Fallback title safety check if index parameter missing mapping key fields
          const displayTitle =
            vocab.moduleTitles[
              m.id as keyof typeof vocab.moduleTitles
            ] || m.id;

          return (
            <button
              key={m.id}
              onClick={onViewAll}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-3)",
                width: "100%",
                padding: "12px",
                background: "rgba(255,255,255,.72)",
                border: "1px solid transparent",
                borderRadius: "16px",
                margin: "2px 0",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (
                  e.currentTarget as HTMLButtonElement
                ).style.backgroundColor = "#ffffff";
              }}
              onMouseLeave={(e) => {
                (
                  e.currentTarget as HTMLButtonElement
                ).style.backgroundColor = "rgba(255,255,255,.72)";
              }}
            >
              {/* Icon badges */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  backgroundColor: done
                    ? "var(--success-50)"
                    : m.accentBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {done ? (
                  <CheckCircle2
                    style={{
                      width: 18,
                      height: 18,
                      color: "var(--success-500)",
                    }}
                  />
                ) : (
                  <SmallIcon
                    iconKey={m.iconKey}
                    color={m.accentColor}
                  />
                )}
              </div>

              {/* Title parameters block rows */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "var(--text-callout)",
                    fontWeight: "var(--font-weight-medium)",
                    color: "var(--neutral-900)",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayTitle}
                </p>
                {prog > 0 && !done && (
                  <div
                    style={{
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--spacing-2)",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 3,
                        borderRadius: "var(--radius-full)",
                        backgroundColor: "var(--neutral-200)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${prog}%`,
                          backgroundColor: m.accentColor,
                          borderRadius: "var(--radius-full)",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "var(--text-label)",
                        color: m.accentColor,
                        fontWeight:
                          "var(--font-weight-semibold)",
                        flexShrink: 0,
                      }}
                    >
                      {prog}%
                    </span>
                  </div>
                )}
              </div>

              {/* Right State Indicator anchors */}
              {done ? (
                <span
                  style={{
                    fontSize: "var(--text-label)",
                    color: "var(--success-500)",
                    fontWeight: "var(--font-weight-semibold)",
                    flexShrink: 0,
                  }}
                >
                  {vocab.done}
                </span>
              ) : (
                <ArrowRight
                  style={{
                    width: 16,
                    height: 16,
                    color: "var(--neutral-400)",
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* View All CTA Footer segment block link */}
      <div
        style={{
          padding: "var(--spacing-3) var(--spacing-4)",
          borderTop: "1px solid #ffe4e6",
        }}
      >
        <button
          onClick={onViewAll}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-2)",
            width: "100%",
            padding: "var(--spacing-3)",
            borderRadius: "14px",
            border: `1px solid var(--primary-200, #ffc7d7)`,
            backgroundColor: "rgba(255,255,255,.82)",
            color: "var(--primary-600)",
            fontSize: "var(--text-callout)",
            fontWeight: "var(--font-weight-semibold)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (
              e.currentTarget as HTMLButtonElement
            ).style.backgroundColor =
              "#ffffff";
          }}
          onMouseLeave={(e) => {
            (
              e.currentTarget as HTMLButtonElement
            ).style.backgroundColor = "rgba(255,255,255,.82)";
          }}
        >
          {vocab.viewAll(PREVIEW_MODULES.length)}
          <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}
