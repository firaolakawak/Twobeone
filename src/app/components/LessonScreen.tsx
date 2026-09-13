import { useState, useEffect } from "react";

const mdToHtml = (md: string): string => {
  if (!md) return '';
  const lines = md.split('\n');
  const out: string[] = [];
  let inUl = false, inOl = false;
  const closeList = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };
  for (const raw of lines) {
    const l = raw
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    if (/^### (.+)/.test(l)) { closeList(); out.push(`<h3 style="font-size:1em;font-weight:700;margin:8px 0 3px;color:var(--foreground)">${l.replace(/^### /, '')}</h3>`); }
    else if (/^## (.+)/.test(l)) { closeList(); out.push(`<h2 style="font-size:1.2em;font-weight:700;margin:10px 0 4px;color:var(--foreground)">${l.replace(/^## /, '')}</h2>`); }
    else if (/^> (.+)/.test(l)) { closeList(); out.push(`<blockquote style="border-left:3px solid var(--border);padding-left:12px;color:var(--muted-foreground);margin:6px 0;font-style:italic">${l.replace(/^> /, '')}</blockquote>`); }
    else if (/^---$/.test(l.trim())) { closeList(); out.push(`<hr style="border:none;border-top:1px solid var(--border);margin:12px 0">`); }
    else if (/^- (.+)/.test(l)) { if (!inUl) { if (inOl) { out.push('</ol>'); inOl = false; } out.push('<ul style="list-style:disc;padding-left:20px;margin:6px 0">'); inUl = true; } out.push(`<li style="margin:2px 0">${l.replace(/^- /, '')}</li>`); }
    else if (/^\d+\. (.+)/.test(l)) { if (!inOl) { if (inUl) { out.push('</ul>'); inUl = false; } out.push('<ol style="list-style:decimal;padding-left:20px;margin:6px 0">'); inOl = true; } out.push(`<li style="margin:2px 0">${l.replace(/^\d+\. /, '')}</li>`); }
    else if (l.trim() === '') { closeList(); out.push('<br>'); }
    else { closeList(); out.push(`<p style="margin:3px 0;color:var(--foreground)">${l}</p>`); }
  }
  closeList();
  return out.join('');
};
import { useLanguage } from "../contexts/LanguageContext";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Quote,
  Loader2,
  Lock,
} from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";
import { toast } from "sonner";
import {
  getStaticModule,
  type StaticModule,
} from "../data/modules";

interface LessonScreenProps {
  moduleId: string;
  lessonId?: string;
  onBack: () => void;
  accessToken?: string;
}

// Global dictionary map to dynamically repair missing database scriptures based on language detection
const SCRIPTURE_FALLBACKS: Record<
  string,
  Record<string, { text: string; ref: string }>
> = {
  am: {
    "module-1": {
      text: "“ስለዚህ ሰው አባቱንና እናቱን ይተዋል፥ ከሚስቱም ጋር ይጣበቃል፥ ሁለቱም አንድ ሥጋ ይሆናሉ ።”",
      ref: "ዘፍጥረት 2:24",
    },
    "module-2": {
      text: "“የተወደዳችሁ ወንድሞቼ ሆይ፥ ሰው ሁሉ ለመስማት የፈጠነ ለመናገርም የዘገየ ለቁጣም የዘገየ ይሁን ።”",
      ref: "ያዕቆብ 1:19",
    },
    "module-3": {
      text: "“ለክርስቶስ መፍራት እርስ በርሳችሁ ተገዙ… ባሎች ሆይ፥ ክርስቶስ ደግሞ ቤተ ክርስቲያንን እንደ ወደዳትና ስለ እርስዋ ራሱን አሳልፎ እንደ ሰጠ፥ ሚስቶቻችሁን ውደዱ”",
      ref: "ኤፌሶን 5:21, 25",
    },
    "module-4": {
      text: "“በቤቴ ውስጥ መብል እንዲሆን አሥራቱን ሁሉ ወደ ጎተራ አግቡ፤ የሰማይንም መስኮት ባልከፍትላችሁ፥ በረከትንም እስከ ትርፍ ድረስ ባላፈስስላችሁ በዚህ ፈትኑኝ”",
      ref: "ሚልክያስ 3:10",
    },
    "module-5": {
      text: "“እግዚአብሔር ቤትን ካልሠራ፥ ሰሪዎች በከንቱ ይደክማሉ።”",
      ref: "መዝሙር 127:1",
    },
  },
  om: {
    "module-1": {
      text: "“Saba kanaaf namni abbaa isaa fi haadha isaa ni dhiisa, haadha manaa isaattis ni maxxana, lamaanuu foon tokko ni ta’u.”",
      ref: "Uumama 2:24",
    },
    "module-2": {
      text: "“Michoota kiyya warra jaallatamoohay: nama hundi dhaggeeffachuuf kan ariifate, dubbachuuf kan lafa bira ga'e, dheekamsaafis kan lafa bira ga'e haa ta’u.”",
      ref: "Ya'eeqob 1:19",
    },
    "module-3": {
      text: "“Isin warri haftee jirtan hundi walii abboomamaa… Dhiironni gaa'elaa, akkuma Kiristoos mana kiristaanaa jaallate, haadhotan manaa keessan jaalladha.”",
      ref: "Efesoon 5:21, 25",
    },
    "module-4": {
      text: "“Mana kiyya keessa nyaanni akka jiraatuuf kurnoo keessan guutuu gara kuusaa mana qulqullummaatti fidaa.”",
      ref: "Miilkiyaas 3:10",
    },
    "module-5": {
      text: "“Eenyumni iyyuu yoo mana ijaare, Waaqayyo yoo gargaaruu baate ijaarsi sun cal'isanii dha.”",
      ref: "Maastarrii 127:1",
    },
  },
};

// Normalise an API/KV module to the StaticModule shape with cross-language safe checks
function toStaticModule(
  m: any,
  currentLang: string,
): StaticModule {
  const modId = m.id || "module-1";
  const langKey =
    currentLang === "am" || currentLang === "om"
      ? currentLang
      : "am";
  const localFallback = SCRIPTURE_FALLBACKS[langKey]?.[
    modId
  ] || { text: m.description || "", ref: "" };

  return {
    id: m.id,
    title: m.title || "",
    subtitle: m.subtitle || "",
    description: m.description || "",
    scripture: m.scripture || m.verse || localFallback.text,
    scriptureRef:
      m.scriptureRef ||
      m.verseReference ||
      m.reference ||
      localFallback.ref,
    iconKey: m.iconKey || m.icon || "book",
    accentColor: m.accentColor || m.color || "#e11d48",
    accentBg: m.accentBg || "#fff1f2",
    accentBorder: m.accentBorder || "#ffe4e6",
    duration:
      m.duration || `${(m.lessons?.length || 1) * 20} min`,
    isLocked: false,
    lessons: (m.lessons || []).map((l: any) => ({
      id: String(l.id),
      title: l.title || "",
      duration:
        l.duration && !isNaN(Number(l.duration))
          ? `${l.duration} min`
          : l.duration || "20 min",
      content: l.content || "",
    })),
  } as StaticModule;
}

export function LessonScreen({
  moduleId,
  lessonId,
  onBack,
  accessToken,
}: LessonScreenProps) {
  const [notes, setNotes] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentLessonIndex, setCurrentLessonIndex] =
    useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<
    Set<string>
  >(new Set());
  const [moduleProgress, setModuleProgress] = useState(0);
  const { t, language } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [apiModule, setApiModule] =
    useState<StaticModule | null>(null);
  const [isLoadingModule, setIsLoadingModule] = useState(false);

  const staticModule = getStaticModule(moduleId);
  const module: StaticModule | undefined =
    staticModule ?? apiModule ?? undefined;

  useEffect(() => {
    if (staticModule) return;
    setIsLoadingModule(true);
    fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules/${moduleId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken || publicAnonKey}`,
        },
      },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.module)
          setApiModule(toStaticModule(data.module, language));
      })
      .catch(() => {})
      .finally(() => setIsLoadingModule(false));
  }, [moduleId, accessToken, staticModule, language]);

  useEffect(() => {
    if (module && lessonId) {
      const idx = module.lessons.findIndex(
        (l) => l.id === lessonId || l.id === String(lessonId),
      );
      if (idx >= 0) setCurrentLessonIndex(idx);
    }
  }, [moduleId, lessonId, module]);

  useEffect(() => {
    loadModuleProgress();
  }, [moduleId]);

  useEffect(() => {
    if (module && module.lessons[currentLessonIndex]) {
      const lesson = module.lessons[currentLessonIndex];
      setIsCompleted(completedLessonIds.has(lesson.id));
      loadLessonNotes(lesson.id);
    }
  }, [currentLessonIndex, module, completedLessonIds]);

  const authHeader = () => ({
    Authorization: `Bearer ${accessToken || publicAnonKey}`,
  });

  if (isLoadingModule) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Loader2
          style={{
            width: 32,
            height: 32,
            margin: "0 auto",
            animation: "spin 1s linear infinite",
            color: "#e11d48",
          }}
        />
      </div>
    );
  }

  const loadModuleProgress = async () => {
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules/${moduleId}/progress`,
        { headers: authHeader() },
      );
      if (res.ok) {
        const { progress, completions } = await res.json();
        setModuleProgress(
          typeof progress === "number" ? progress : 0,
        );
        if (Array.isArray(completions)) {
          setCompletedLessonIds(
            new Set(completions.map((c: any) => c.lessonId)),
          );
        }
      }
    } catch (e) {}
  };

  const loadLessonNotes = async (lId: string) => {
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules/${moduleId}/lessons/${lId}/notes`,
        { headers: authHeader() },
      );
      if (res.ok) {
        const { note } = await res.json();
        setNotes(note?.notes ?? "");
      } else {
        setNotes("");
      }
    } catch {
      setNotes("");
    }
  };

  if (!module || module.lessons.length === 0) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#475569",
            fontSize: "14px",
            marginBottom: "24px",
          }}
        >
          <ArrowLeft style={{ width: 18, height: 18 }} />{" "}
          {t?.common?.back || "Back"}
        </button>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          Module not found.
        </p>
      </div>
    );
  }

  const currentLesson = module.lessons[currentLessonIndex];
  const totalLessons = module.lessons.length;

  const goTo = (idx: number) => {
    if (idx >= 0 && idx < totalLessons) {
      // Lessons unlock sequentially — lesson N requires lesson N-1 completed
      const prevLesson = idx > 0 ? module.lessons[idx - 1] : null;
      if (prevLesson && !completedLessonIds.has(prevLesson.id)) {
        toast.error("Complete the previous lesson first.");
        return;
      }
      setCurrentLessonIndex(idx);
      setNotes("");
    }
  };

  const MIN_NOTE_LENGTH = 100;

  const handleMarkComplete = async () => {
    if (notes.trim().length < MIN_NOTE_LENGTH) {
      toast.error(`Please write at least ${MIN_NOTE_LENGTH} characters in your notes before completing this lesson.`);
      return;
    }
    setIsSaving(true);
    try {
      if (notes.trim()) {
        const nr = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules/${moduleId}/lessons/${currentLesson.id}/notes`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeader(),
            },
            body: JSON.stringify({ notes: notes.trim() }),
          },
        );
        if (!nr.ok) {
          const err = await nr.json().catch(() => ({}));
          throw new Error(err.error || "Failed to save notes");
        }
      }

      const cr = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules/${moduleId}/lessons/${currentLesson.id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(),
          },
        },
      );
      if (!cr.ok) {
        const err = await cr.json().catch(() => ({}));
        throw new Error(err.error || "Failed to mark complete");
      }

      setIsCompleted(true);
      setCompletedLessonIds(
        (prev) => new Set([...prev, currentLesson.id]),
      );
      await loadModuleProgress();

      setTimeout(() => {
        if (currentLessonIndex < totalLessons - 1) {
          goTo(currentLessonIndex + 1);
          toast.success(
            "Great work! Moving to the next lesson.",
          );
        } else {
          toast.success("Module complete! Well done. 🎉");
        }
      }, 700);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const accent = module.accentColor;
  const accentBg = module.accentBg;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        paddingBottom: "40px",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ArrowLeft
            style={{ width: 18, height: 18, color: "#475569" }}
          />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: "12px",
              color: accent,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {module.title}
          </p>
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#0f172a",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentLesson.title}
          </p>
        </div>
        <span
          style={{
            fontSize: "12px",
            color: "#64748b",
            flexShrink: 0,
            fontWeight: 500,
          }}
        >
          {currentLessonIndex + 1}/{totalLessons}
        </span>
      </div>

      {/* Module progress bar */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          padding: "12px 16px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
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
              fontSize: "12px",
              color: "#475569",
              fontWeight: 500,
            }}
          >
            Module Progress
          </span>
          <span
            style={{
              fontSize: "12px",
              color: accent,
              fontWeight: 600,
            }}
          >
            {moduleProgress}%
          </span>
        </div>
        <div
          style={{
            height: 5,
            borderRadius: "9999px",
            backgroundColor: "#f1f5f9",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${moduleProgress}%`,
              backgroundColor: accent,
              borderRadius: "9999px",
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <p
          style={{
            fontSize: "12px",
            color: "#64748b",
            margin: "4px 0 0 0",
          }}
        >
          {completedLessonIds.size} of {totalLessons} lessons
          completed
        </p>
      </div>

      {/* Scripture banner */}
      <div
        style={{
          backgroundColor: accentBg,
          border: `1px solid ${module.accentBorder}`,
          borderRadius: "8px",
          padding: "16px",
          display: "flex",
          gap: "12px",
        }}
      >
        <Quote
          style={{
            width: 18,
            height: 18,
            color: accent,
            flexShrink: 0,
            marginTop: 2,
          }}
        />
        <div>
          <p
            style={{
              fontSize: "14px",
              color: "#1e293b",
              fontStyle: "italic",
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            {module.scripture}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: accent,
              fontWeight: 600,
              margin: "4px 0 0 0",
            }}
          >
            — {module.scriptureRef}
          </p>
        </div>
      </div>

      {/* Lesson navigation */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <button
          onClick={() => goTo(currentLessonIndex - 1)}
          disabled={currentLessonIndex === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "none",
            border: "none",
            cursor:
              currentLessonIndex === 0
                ? "not-allowed"
                : "pointer",
            color:
              currentLessonIndex === 0 ? "#cbd5e1" : "#475569",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />{" "}
          {t?.common?.previous || "Previous"}
        </button>

        <span
          style={{
            fontSize: "12px",
            color: "#64748b",
            fontWeight: 500,
          }}
        >
          {currentLesson.duration}
        </span>

        <button
          onClick={() => goTo(currentLessonIndex + 1)}
          disabled={currentLessonIndex === totalLessons - 1}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "none",
            border: "none",
            cursor:
              currentLessonIndex === totalLessons - 1
                ? "not-allowed"
                : "pointer",
            color:
              currentLessonIndex === totalLessons - 1
                ? "#cbd5e1"
                : "#475569",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          {t?.common?.next || "Next"}{" "}
          <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Lesson content */}
      <div
        style={{
          backgroundColor: "var(--background)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "16px",
            borderBottom: "1px solid var(--border)",
            backgroundColor: accentBg,
          }}
        >
          <BookOpen
            style={{ width: 18, height: 18, color: accent }}
          />
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            Lesson Content
          </span>
        </div>
        <div
          style={{
            padding: "20px",
            maxHeight: 480,
            overflowY: "auto",
            fontSize: "14px",
            lineHeight: 1.75,
            color: "var(--foreground)",
          }}
          dangerouslySetInnerHTML={{ __html: mdToHtml(currentLesson.content) }}
        />
      </div>

      {/* Notes */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "16px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <FileText
            style={{ width: 18, height: 18, color: "#7c3aed" }}
          />
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Your Notes
          </span>
        </div>
        <div style={{ padding: "16px" }}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reflect on what you've learned. How will you apply this together? (minimum 100 characters)"
            style={{
              width: "100%",
              minHeight: 120,
              fontSize: "14px",
              color: "var(--foreground)",
              backgroundColor: "var(--muted)",
              border: `1px solid ${notes.trim().length >= 100 ? 'var(--success-500, #22c55e)' : 'var(--border)'}`,
              borderRadius: "6px",
              padding: "12px",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.6,
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => { if (notes.trim().length < 100) e.currentTarget.style.borderColor = accent; }}
            onBlur={(e) => { if (notes.trim().length < 100) e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
          {/* Character counter */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
            <span style={{ fontSize: "11px", color: notes.trim().length >= 100 ? "var(--success-700, #15803d)" : "var(--muted-foreground)" }}>
              {notes.trim().length >= 100 ? "✓ Minimum reached" : `${100 - notes.trim().length} more characters needed`}
            </span>
            <span style={{ fontSize: "11px", color: notes.trim().length >= 100 ? "var(--success-700, #15803d)" : "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>
              {notes.trim().length} / 100
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: "4px", height: "3px", borderRadius: "2px", backgroundColor: "var(--border)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min(100, (notes.trim().length / 100) * 100)}%`,
              backgroundColor: notes.trim().length >= 100 ? "var(--success-500, #22c55e)" : accent,
              borderRadius: "2px",
              transition: "width 0.2s ease, background-color 0.3s ease",
            }} />
          </div>
        </div>
      </div>

      {/* Mark complete */}
      {(() => {
        const notesReady = notes.trim().length >= 100;
        const disabled = isCompleted || isSaving || !notesReady;
        return (
          <button
            onClick={handleMarkComplete}
            disabled={disabled}
            title={!notesReady && !isCompleted ? `Write at least 100 characters in your notes (${notes.trim().length}/100)` : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "16px",
              borderRadius: "6px",
              border: "none",
              cursor: disabled ? "not-allowed" : "pointer",
              backgroundColor: isCompleted ? "var(--success-50, #f0fdf4)" : notesReady ? accent : "var(--muted)",
              color: isCompleted ? "var(--success-700, #166534)" : notesReady ? "#ffffff" : "var(--muted-foreground)",
              fontSize: "14px",
              fontWeight: 600,
              transition: "opacity 0.15s ease, background-color 0.2s ease",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {!notesReady && !isCompleted
              ? <Lock style={{ width: 16, height: 16 }} />
              : <CheckCircle2 style={{ width: 18, height: 18 }} />}
            {isSaving
              ? t?.common?.saving || "Saving..."
              : isCompleted
                ? `${t?.devotionals?.completed || "Completed"} ✓`
                : notesReady
                  ? t?.devotionals?.markComplete || "Mark Complete"
                  : `Notes required (${notes.trim().length}/100)`}
          </button>
        );
      })()}

      {/* All lessons list */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            All Lessons
          </span>
        </div>
        <div style={{ padding: "8px 0" }}>
          {module.lessons.map((lesson, idx) => {
            const done = completedLessonIds.has(lesson.id);
            const active = idx === currentLessonIndex;
            const prevLesson = idx > 0 ? module.lessons[idx - 1] : null;
            const locked = prevLesson ? !completedLessonIds.has(prevLesson.id) : false;
            return (
              <button
                key={lesson.id}
                onClick={() => goTo(idx)}
                disabled={locked}
                title={locked ? "Complete the previous lesson first" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  padding: "12px 16px",
                  background: active ? accentBg : "none",
                  border: "none",
                  cursor: locked ? "not-allowed" : "pointer",
                  textAlign: "left",
                  borderLeft: active
                    ? `3px solid ${accent}`
                    : "3px solid transparent",
                  transition: "background 0.15s ease",
                  opacity: locked ? 0.45 : 1,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: done
                      ? "var(--success-500, #22c55e)"
                      : locked
                        ? "var(--muted)"
                        : active
                          ? accent
                          : "var(--muted)",
                    border: done || active || locked ? "none" : "2px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {done ? (
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#ffffff" }} />
                  ) : locked ? (
                    <Lock style={{ width: 14, height: 14, color: "var(--muted-foreground)" }} />
                  ) : (
                    <span style={{ fontSize: "12px", fontWeight: 600, color: active ? "#ffffff" : "var(--muted-foreground)" }}>
                      {idx + 1}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: active ? 600 : 500,
                      color: done
                        ? "var(--success-700, #166534)"
                        : locked
                          ? "var(--muted-foreground)"
                          : active
                            ? accent
                            : "var(--foreground)",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lesson.title}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0 }}>
                    {locked ? "Locked" : lesson.duration}
                  </p>
                </div>

                {done && (
                  <span style={{ fontSize: "12px", color: "var(--success-700, #16a34a)", fontWeight: 600, flexShrink: 0 }}>
                    Done ✓
                  </span>
                )}
                {locked && (
                  <Lock style={{ width: 14, height: 14, color: "var(--muted-foreground)", flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}