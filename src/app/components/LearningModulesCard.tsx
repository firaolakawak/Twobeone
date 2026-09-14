import { useCurrentLanguage } from '../utils/languageStore';
import '../styles/dashboard-support.css';
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
    accentColor: "var(--glass-accent)",
  },
  {
    id: "module-2",
    iconKey: "message",
    accentColor: "var(--glass-accent)",
  },
  {
    id: "module-3",
    iconKey: "heart",
    accentColor: "var(--glass-rose)",
  },
  {
    id: "module-4",
    iconKey: "dollar",
    accentColor: "var(--glass-rose)",
  },
  {
    id: "module-5",
    iconKey: "home",
    accentColor: "var(--glass-accent)",
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
  const currentLang = useCurrentLanguage();
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
    <div className="tbo-glass tbo-support-card tbo-learning-card">
      <div className="tbo-glass-inset tbo-learning-header">
        <div className="tbo-learning-heading">
          <div className="tbo-learning-heading-copy">
            <span className="tbo-glass-orb tbo-learning-header-icon">
              <BookOpen aria-hidden="true" size={16} />
            </span>
            <div className="min-w-0">
              <h3 className="tbo-card-title tbo-support-title">{vocab.title}</h3>
              <p className="tbo-caption tbo-support-muted">
                {vocab.modulesCount(PREVIEW_MODULES.length)}
              </p>
            </div>
          </div>
          <span className="tbo-caption tbo-glass-inset tbo-learning-percentage">
            {isLoading ? "–" : `${overallProgress}%`}
          </span>
        </div>

        <div className="tbo-support-progress tbo-learning-overall-progress">
          <div className="tbo-support-progress-fill" style={{ width: `${overallProgress}%` }} />
        </div>
        <p className="tbo-caption tbo-support-muted mt-1">
          {vocab.completedCount(completedCount, PREVIEW_MODULES.length)}
        </p>
      </div>

      <div className="tbo-learning-rows">
        {PREVIEW_MODULES.map((m) => {
          const prog = progressMap[m.id] || 0;
          const done = prog === 100;
          const displayTitle =
            vocab.moduleTitles[m.id as keyof typeof vocab.moduleTitles] || m.id;

          return (
            <button
              type="button"
              key={m.id}
              className="tbo-glass-action tbo-learning-row"
              onClick={onViewAll}
            >
              <span className={`tbo-glass-inset tbo-learning-module-icon${done ? ' tbo-support-complete' : ''}`}>
                {done ? (
                  <CheckCircle2 aria-hidden="true" size={18} />
                ) : (
                  <SmallIcon iconKey={m.iconKey} color={m.accentColor} />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <h4 className="tbo-card-title tbo-support-title">{displayTitle}</h4>
                {prog > 0 && !done && (
                  <div className="tbo-learning-module-progress">
                    <div className="tbo-support-progress">
                      <div
                        className="tbo-support-progress-fill"
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                    <span className="tbo-caption shrink-0" style={{ color: m.accentColor }}>
                      {prog}%
                    </span>
                  </div>
                )}
              </div>

              {done ? (
                <span className="tbo-caption tbo-support-complete tbo-learning-done">{vocab.done}</span>
              ) : (
                <ArrowRight aria-hidden="true" className="tbo-support-muted shrink-0" size={16} />
              )}
            </button>
          );
        })}
      </div>

      <div className="tbo-learning-footer">
        <button type="button" className="tbo-action tbo-glass-action tbo-learning-view-all" onClick={onViewAll}>
          <span>{vocab.viewAll(PREVIEW_MODULES.length)}</span>
          <ArrowRight aria-hidden="true" className="shrink-0" size={16} />
        </button>
      </div>
    </div>
  );
}
