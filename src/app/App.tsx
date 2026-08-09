import { useState, useCallback } from "react";
import {
  Heart, ArrowRight, ChevronLeft,
  Mail, Lock, User, Eye, EyeOff, Loader2,
  BookOpen, MessageSquare, Sparkles, TrendingUp,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════
   ONBOARDING SLIDES
════════════════════════════════════════════════════════════ */

const SLIDES = [
  {
    gradientFrom: "var(--primary-400)",
    gradientTo:   "var(--primary-700)",
    glowColor:    "rgba(244,63,94,0.35)",
    icon:         Heart,
    iconFill:     true,
    badge:        "Welcome to TwoBeOne",
    title:        "Grow Together\nin Christ",
    body:         "Strengthen your covenant bond through faith-based tools built for Christian couples.",
  },
  {
    gradientFrom: "var(--secondary-400)",
    gradientTo:   "var(--secondary-700)",
    glowColor:    "rgba(14,165,233,0.35)",
    icon:         BookOpen,
    iconFill:     false,
    badge:        "Daily Devotions & Prayer",
    title:        "Pray & Worship\nTogether Daily",
    body:         "Share prayer requests, track devotionals, and build a daily spiritual rhythm as one.",
  },
  {
    gradientFrom: "var(--primary-500)",
    gradientTo:   "var(--secondary-600)",
    glowColor:    "rgba(244,63,94,0.28)",
    icon:         MessageSquare,
    iconFill:     false,
    badge:        "Shared Journal",
    title:        "Reflect & Write\nYour Story Together",
    body:         "Capture thoughts, milestones, and answered prayers in a private shared space.",
  },
  {
    gradientFrom: "var(--primary-600)",
    gradientTo:   "var(--primary-400)",
    glowColor:    "rgba(244,63,94,0.40)",
    icon:         Sparkles,
    iconFill:     false,
    badge:        "Join 10,000+ Couples",
    title:        "Ready to Begin\nYour Journey?",
    body:         "Join thousands of Christian couples building stronger, faith-centered relationships.",
    isLast:       true,
  },
] as const;

/* ════════════════════════════════════════════════════════════
   SHARED STYLES (CSS-variable-driven, no hardcoded colours)
════════════════════════════════════════════════════════════ */

const inputBase: React.CSSProperties = {
  width: "100%",
  height: "var(--button-md)",
  padding: "0 var(--spacing-4) 0 44px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--color-border)",
  background: "var(--neutral-50)",
  fontSize: "var(--text-callout)",
  fontFamily: "inherit",
  color: "var(--color-foreground)",
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const inputFocus = (el: HTMLInputElement) => {
  el.style.borderColor = "var(--primary-400)";
  el.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--primary-400) 15%, transparent)";
};
const inputBlur = (el: HTMLInputElement) => {
  el.style.borderColor = "var(--color-border)";
  el.style.boxShadow = "none";
};

/* ════════════════════════════════════════════════════════════
   MOBILE SHELL — centres content in a phone-sized card
════════════════════════════════════════════════════════════ */

function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--neutral-100)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-4)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          minHeight: "min(812px, 100dvh - 32px)",
          background: "var(--color-background)",
          borderRadius: "var(--radius-2xl)",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ONBOARDING SCREEN
════════════════════════════════════════════════════════════ */

interface OnboardingProps {
  onSignIn:  () => void;
  onSignUp:  () => void;
}

function OnboardingScreen({ onSignIn, onSignUp }: OnboardingProps) {
  const [current, setCurrent] = useState(0);
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const next = useCallback(() => {
    if (isLast) { onSignUp(); return; }
    setCurrent(c => c + 1);
  }, [isLast, onSignUp]);

  const skip = useCallback(() => onSignIn(), [onSignIn]);

  const Icon = slide.icon;

  return (
    <MobileShell>
      {/* ── Illustration area ── */}
      <div
        style={{
          flex: "0 0 52%",
          background: `linear-gradient(160deg, ${slide.gradientFrom}, ${slide.gradientTo})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          transition: "background 0.5s ease",
        }}
      >
        {/* Dot texture overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            pointerEvents: "none",
          }}
        />

        {/* Glow circle behind icon */}
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            filter: "blur(32px)",
            pointerEvents: "none",
          }}
        />

        {/* Icon container */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            position: "relative",
            zIndex: 1,
            boxShadow: `0 24px 48px ${slide.glowColor}`,
          }}
        >
          <Icon
            style={{
              width: 56,
              height: 56,
              color: "#fff",
              fill: slide.iconFill ? "#fff" : "none",
              strokeWidth: slide.iconFill ? 0 : 1.5,
            }}
          />
        </div>

        {/* Slide number */}
        <div
          style={{
            position: "absolute",
            bottom: "var(--spacing-5)",
            right: "var(--spacing-5)",
            fontSize: "var(--text-label)",
            fontWeight: "var(--font-weight-semibold)",
            color: "rgba(255,255,255,0.6)",
            fontFamily: "inherit",
          }}
        >
          {current + 1} / {SLIDES.length}
        </div>

        {/* Skip button */}
        {!isLast && (
          <button
            onClick={skip}
            style={{
              position: "absolute",
              top: "var(--spacing-5)",
              right: "var(--spacing-5)",
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "var(--radius-full)",
              padding: "var(--spacing-1) var(--spacing-3)",
              fontSize: "var(--text-caption)",
              fontWeight: "var(--font-weight-medium)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "inherit",
              backdropFilter: "blur(4px)",
            }}
          >
            Skip
          </button>
        )}
      </div>

      {/* ── Content area ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "var(--spacing-8) var(--spacing-6) var(--spacing-6)",
          gap: "var(--spacing-5)",
        }}
      >
        {/* Badge */}
        <span
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            alignItems: "center",
            padding: "var(--spacing-1) var(--spacing-3)",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--text-label)",
            fontWeight: "var(--font-weight-semibold)",
            background: "var(--primary-50)",
            color: "var(--primary-700)",
            border: "1px solid var(--primary-200)",
            fontFamily: "inherit",
          }}
        >
          {slide.badge}
        </span>

        {/* Title */}
        <h1
          style={{
            margin: 0,
            fontSize: "var(--text-large-title)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-foreground)",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            fontFamily: "inherit",
            whiteSpace: "pre-line",
          }}
        >
          {slide.title}
        </h1>

        {/* Body */}
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-body)",
            fontWeight: "var(--font-weight-normal)",
            color: "var(--neutral-500)",
            lineHeight: 1.6,
            fontFamily: "inherit",
          }}
        >
          {slide.body}
        </p>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Dot indicators */}
        <div style={{ display: "flex", justifyContent: "center", gap: "var(--spacing-2)" }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: "var(--radius-full)",
                background: i === current ? "var(--primary-600)" : "var(--neutral-200)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "width 0.3s ease, background 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Primary CTA */}
        <button
          onClick={next}
          style={{
            width: "100%",
            height: "var(--button-lg)",
            borderRadius: "var(--radius-lg)",
            border: "none",
            background: `linear-gradient(135deg, ${slide.gradientFrom}, ${slide.gradientTo})`,
            color: "#fff",
            fontSize: "var(--text-callout)",
            fontWeight: "var(--font-weight-semibold)",
            fontFamily: "inherit",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-2)",
            boxShadow: `0 8px 24px ${slide.glowColor}`,
            transition: "box-shadow 0.2s, transform 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget).style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { (e.currentTarget).style.transform = "translateY(0)"; }}
        >
          {isLast ? "Create Your Account" : "Continue"}
          <ArrowRight style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
        </button>

        {/* Sign in link */}
        <p
          style={{
            margin: 0,
            textAlign: "center",
            fontSize: "var(--text-caption)",
            color: "var(--neutral-500)",
            fontFamily: "inherit",
          }}
        >
          Already have an account?{" "}
          <button
            onClick={onSignIn}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: "inherit",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--primary-600)",
              fontFamily: "inherit",
            }}
          >
            Sign in
          </button>
        </p>
      </div>
    </MobileShell>
  );
}

/* ════════════════════════════════════════════════════════════
   AUTH SCREEN  (sign in / sign up)
════════════════════════════════════════════════════════════ */

type AuthMode = "signin" | "signup";

interface AuthScreenProps {
  initialMode: AuthMode;
  onBack: () => void;
}

function AuthScreen({ initialMode, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    // Auth logic wires in here via Supabase / API
    await new Promise(r => setTimeout(r, 900)); // placeholder
    setLoading(false);
  };

  return (
    <MobileShell>
      {/* Header strip */}
      <div
        style={{
          padding: "var(--spacing-5) var(--spacing-5) 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-1)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "var(--spacing-2)",
            marginLeft: "calc(var(--spacing-2) * -1)",
            borderRadius: "var(--radius-md)",
            color: "var(--neutral-600)",
            fontFamily: "inherit",
            fontSize: "var(--text-callout)",
            fontWeight: "var(--font-weight-medium)",
          }}
        >
          <ChevronLeft style={{ width: "var(--icon-sm)", height: "var(--icon-sm)" }} />
          Back
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1)" }}>
          <Heart
            style={{
              width: "var(--icon-sm)",
              height: "var(--icon-sm)",
              fill: "var(--primary-500)",
              color: "var(--primary-500)",
            }}
          />
          <span
            style={{
              fontSize: "var(--text-callout)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-foreground)",
              fontFamily: "inherit",
            }}
          >
            TwoBeOne
          </span>
        </div>
        {/* Spacer */}
        <div style={{ width: 64 }} />
      </div>

      {/* Brand block */}
      <div
        style={{
          padding: "var(--spacing-8) var(--spacing-6) var(--spacing-4)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary-400), var(--primary-600))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto var(--spacing-4)",
            boxShadow: "0 12px 32px rgba(244,63,94,0.35)",
          }}
        >
          <Heart
            style={{ width: 30, height: 30, fill: "#fff", color: "#fff" }}
          />
        </div>
        <h1
          style={{
            margin: "0 0 var(--spacing-1)",
            fontSize: "var(--text-title)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-foreground)",
            fontFamily: "inherit",
            letterSpacing: "-0.02em",
          }}
        >
          {mode === "signin" ? "Welcome Back" : "Create Account"}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-caption)",
            color: "var(--neutral-500)",
            fontFamily: "inherit",
          }}
        >
          {mode === "signin"
            ? "Sign in to continue your journey together"
            : "Start your faith journey as one"}
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ padding: "0 var(--spacing-6)" }}>
        <div
          style={{
            display: "flex",
            background: "var(--neutral-100)",
            borderRadius: "var(--radius-md)",
            padding: 3,
            gap: 3,
          }}
        >
          {(["signin", "signup"] as const).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                height: 38,
                borderRadius: "calc(var(--radius-md) - 3px)",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "var(--text-caption)",
                fontWeight: mode === m ? "var(--font-weight-semibold)" : "var(--font-weight-medium)",
                color: mode === m ? "var(--color-foreground)" : "var(--neutral-500)",
                background: mode === m ? "var(--color-background)" : "transparent",
                boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          flex: 1,
          padding: "var(--spacing-5) var(--spacing-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-4)",
        }}
      >
        {/* Name field — signup only */}
        {mode === "signup" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-1)" }}>
            <label
              style={{
                fontSize: "var(--text-caption)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-foreground)",
                fontFamily: "inherit",
              }}
            >
              Your name
            </label>
            <div style={{ position: "relative" }}>
              <User
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "var(--icon-sm)",
                  height: "var(--icon-sm)",
                  color: "var(--neutral-400)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={inputBase}
                onFocus={e => inputFocus(e.target as HTMLInputElement)}
                onBlur={e => inputBlur(e.target as HTMLInputElement)}
              />
            </div>
          </div>
        )}

        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-1)" }}>
          <label
            style={{
              fontSize: "var(--text-caption)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-foreground)",
              fontFamily: "inherit",
            }}
          >
            Email address
          </label>
          <div style={{ position: "relative" }}>
            <Mail
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                width: "var(--icon-sm)",
                height: "var(--icon-sm)",
                color: "var(--neutral-400)",
                pointerEvents: "none",
              }}
            />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputBase}
              onFocus={e => inputFocus(e.target as HTMLInputElement)}
              onBlur={e => inputBlur(e.target as HTMLInputElement)}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label
              style={{
                fontSize: "var(--text-caption)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-foreground)",
                fontFamily: "inherit",
              }}
            >
              Password
            </label>
            {mode === "signin" && (
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: "var(--text-caption)",
                  fontWeight: "var(--font-weight-medium)",
                  color: "var(--primary-600)",
                  fontFamily: "inherit",
                }}
              >
                Forgot password?
              </button>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <Lock
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                width: "var(--icon-sm)",
                height: "var(--icon-sm)",
                color: "var(--neutral-400)",
                pointerEvents: "none",
              }}
            />
            <input
              type={showPw ? "text" : "password"}
              placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ ...inputBase, paddingRight: 44 }}
              onFocus={e => inputFocus(e.target as HTMLInputElement)}
              onBlur={e => inputBlur(e.target as HTMLInputElement)}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "var(--neutral-400)",
                display: "flex",
              }}
            >
              {showPw
                ? <EyeOff style={{ width: 16, height: 16 }} />
                : <Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "var(--spacing-3) var(--spacing-4)",
              borderRadius: "var(--radius-md)",
              background: "var(--error-50)",
              border: "1px solid color-mix(in srgb, var(--error-500) 25%, transparent)",
              fontSize: "var(--text-caption)",
              color: "var(--error-700)",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            height: "var(--button-lg)",
            borderRadius: "var(--radius-lg)",
            border: "none",
            background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
            color: "#fff",
            fontSize: "var(--text-callout)",
            fontWeight: "var(--font-weight-semibold)",
            fontFamily: "inherit",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.72 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-2)",
            boxShadow: "0 8px 24px rgba(244,63,94,0.35)",
            transition: "opacity 0.15s, transform 0.15s",
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget).style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { (e.currentTarget).style.transform = "translateY(0)"; }}
        >
          {loading && (
            <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
          )}
          {mode === "signin" ? "Sign In" : "Create Account"}
        </button>

        {/* Scripture footer */}
        <p
          style={{
            margin: "var(--spacing-2) 0 0",
            textAlign: "center",
            fontSize: "var(--text-label)",
            color: "var(--neutral-400)",
            fontFamily: "inherit",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          "Two are better than one" — Eccl. 4:9
        </p>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: var(--neutral-400); opacity: 1; }
      `}</style>
    </MobileShell>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════════ */

type Screen = "onboarding" | "signin" | "signup";

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboarding");

  if (screen === "signin" || screen === "signup") {
    return (
      <AuthScreen
        initialMode={screen}
        onBack={() => setScreen("onboarding")}
      />
    );
  }

  return (
    <OnboardingScreen
      onSignIn={() => setScreen("signin")}
      onSignUp={() => setScreen("signup")}
    />
  );
}
