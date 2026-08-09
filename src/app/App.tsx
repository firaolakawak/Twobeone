import { useState } from "react";
import {
  Heart, BookOpen, MessageSquare, Users, Sparkles,
  ArrowRight, Star, ChevronDown, Shield, Zap,
  TrendingUp, LogIn, CheckCircle2,
} from "lucide-react";

/* ── Data ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: BookOpen,
    title: "Daily Devotionals",
    desc: "Scripture-based devotions written for couples to strengthen your spiritual foundation together.",
    from: "var(--primary-500)",
    to:   "var(--primary-700)",
  },
  {
    icon: MessageSquare,
    title: "Shared Journaling",
    desc: "Express your hearts, reflect on your journey, and share intimate thoughts in a private, secure space.",
    from: "var(--secondary-400)",
    to:   "var(--secondary-700)",
  },
  {
    icon: Heart,
    title: "Prayer Together",
    desc: "Create prayer requests, pray for each other daily, and celebrate when God answers.",
    from: "var(--primary-400)",
    to:   "var(--primary-600)",
  },
  {
    icon: Users,
    title: "Conversation Questions",
    desc: "Deep, faith-based starters across 12 categories to truly know each other.",
    from: "var(--primary-500)",
    to:   "var(--secondary-600)",
  },
  {
    icon: Sparkles,
    title: "Learning Modules",
    desc: "Biblical guidance on communication, conflict resolution, intimacy, and spiritual growth.",
    from: "var(--success-500)",
    to:   "var(--success-700)",
  },
  {
    icon: TrendingUp,
    title: "Emotional Analytics",
    desc: "Identify emotional patterns over time with charts and collaborative sync trends.",
    from: "var(--warning-500)",
    to:   "var(--warning-700)",
  },
] as const;

const STATS = [
  { value: "10k+",  label: "Active Couples" },
  { value: "500k+", label: "Devotionals Read" },
  { value: "250k+", label: "Prayers Shared" },
  { value: "4.9★",  label: "App Rating" },
] as const;

const TRUST = [
  { icon: Shield, title: "Private & Secure", desc: "Bank-level encryption keeps data strictly between you and your partner." },
  { icon: Zap,    title: "Real-Time Sync",   desc: "Instant sync across all devices so you stay connected anywhere." },
] as const;

const FAQS = [
  { q: "Is TwoBeOne completely free?",          a: "Yes! All core features — devotionals, prayer boards, journaling, and profile syncing — are free forever with no hidden fees." },
  { q: "How does partner syncing work?",        a: "After creating your profile you receive a unique invite code. Sharing it links your profiles instantly for real-time notifications and collaborative spaces." },
  { q: "Is my relationship data secure?",       a: "Absolutely. We enforce strict encryption and database isolation. Your entries are accessible only by you and your connected partner." },
  { q: "What makes TwoBeOne different?",        a: "TwoBeOne is purpose-built for Christian couples with faith at the center. Every feature is rooted in Biblical principles." },
  { q: "Can we use it if we're not married yet?", a: "Yes! TwoBeOne is perfect for engaged, dating, newlywed, and married couples. If you're in a committed Christian relationship, this is for you." },
  { q: "How much time does it take daily?",     a: "As little as 5–10 minutes for a devotional. Questions and journaling are flexible. Consistency matters more than perfection." },
] as const;

/* ── Phone mockup — no external asset ────────────────────── */

function AppScreenMockup() {
  return (
    <div style={{
      width: "100%",
      background: "var(--color-background)",
      fontFamily: "inherit",
      padding: "var(--spacing-4)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--spacing-3)",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary-400), var(--primary-600))",
          }} />
          <div>
            <div style={{ fontSize: "var(--text-caption-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--color-foreground)" }}>
              Sarah & Mike
            </div>
            <div style={{ fontSize: "var(--text-label)", color: "var(--color-muted-foreground)" }}>
              Day 847 together 💕
            </div>
          </div>
        </div>
        <div style={{ fontSize: "var(--text-label)", color: "var(--primary-600)", fontWeight: "var(--font-weight-semibold)" }}>
          🔥 14 days
        </div>
      </div>

      {/* Devotional card */}
      <div style={{
        borderRadius: "var(--radius-md)",
        background: "linear-gradient(135deg, var(--primary-500), var(--primary-700))",
        padding: "var(--spacing-3)",
        color: "#fff",
      }}>
        <div style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-semibold)", opacity: 0.8, marginBottom: 4, letterSpacing: "0.06em" }}>
          TODAY'S DEVOTION
        </div>
        <div style={{ fontSize: "var(--text-callout)", fontWeight: "var(--font-weight-bold)", lineHeight: 1.4, marginBottom: 6 }}>
          Walking in Faith Together
        </div>
        <div style={{ fontSize: "var(--text-label)", opacity: 0.85, lineHeight: 1.5, fontStyle: "italic" }}>
          "Trust in the Lord with all your heart..." — Prov 3:5
        </div>
        <div style={{
          marginTop: "var(--spacing-2)",
          display: "inline-block",
          background: "rgba(255,255,255,0.2)",
          borderRadius: 6,
          padding: "3px 10px",
          fontSize: "var(--text-label)",
          fontWeight: "var(--font-weight-semibold)",
        }}>
          Read Together →
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--spacing-2)" }}>
        {([
          { label: "Prayers", value: "128", color: "var(--secondary-500)" },
          { label: "Journal", value: "34",  color: "var(--success-500)" },
          { label: "Streak",  value: "14🔥", color: "var(--primary-600)" },
        ] as const).map(s => (
          <div key={s.label} style={{
            borderRadius: "var(--radius-sm)",
            background: "var(--color-muted)",
            padding: "var(--spacing-2)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "var(--text-heading)", fontWeight: "var(--font-weight-bold)", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "var(--text-label)", color: "var(--color-muted-foreground)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Notification card */}
      <div style={{
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
        padding: "var(--spacing-2) var(--spacing-3)",
        background: "var(--color-card)",
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-3)",
      }}>
        <div style={{ fontSize: 18 }}>🙏</div>
        <div>
          <div style={{ fontSize: "var(--text-caption-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-foreground)" }}>
            Mike is praying for you
          </div>
          <div style={{ fontSize: "var(--text-label)", color: "var(--color-muted-foreground)" }}>2 mins ago</div>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        display: "flex",
        justifyContent: "space-around",
        paddingTop: "var(--spacing-2)",
        borderTop: "1px solid var(--color-border)",
      }}>
        {(["🏠","📖","🙏","💬","👤"] as const).map((icon, i) => (
          <div key={i} style={{ fontSize: i === 0 ? 20 : 15, opacity: i === 0 ? 1 : 0.35 }}>{icon}</div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */

export default function App() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">

      {/* Ambient blobs — fixed, behind everything */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(circle, var(--primary-100) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-35"
          style={{ background: "radial-gradient(circle, var(--secondary-100) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(circle, var(--primary-100) 0%, transparent 70%)" }}
        />
      </div>

      {/* ═══ NAV ══════════════════════════════════════════════ */}
      <nav
        className="sticky top-0 z-50 border-b border-border"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 select-none">
            <div className="relative w-8 h-7 flex items-end">
              <Heart className="w-6 h-6 fill-current absolute bottom-0 left-0" style={{ color: "var(--primary-500)" }} />
              <Heart className="w-4 h-4 fill-current absolute top-0 right-0" style={{ color: "var(--primary-300)" }} />
            </div>
            <span
              className="text-lg font-bold ml-1 bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, var(--primary-600), var(--primary-400))" }}
            >
              TwoBeOne
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {(["Features", "Vision", "FAQ"] as const).map(label => (
              <button
                key={label}
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--neutral-600)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--primary-600)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--neutral-600)")}
              >
                {label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <button
            className="h-10 px-5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all"
            style={{
              background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
              color: "var(--color-primary-foreground)",
              boxShadow: "0 4px 14px rgba(244,63,94,0.35)",
            }}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
        </div>
      </nav>

      {/* ═══ HERO ═════════════════════════════════════════════ */}
      <section className="pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-14 items-center">

          {/* Left — text */}
          <div className="space-y-7 text-center lg:text-left">
            <span
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border"
              style={{ background: "var(--primary-50)", color: "var(--primary-700)", borderColor: "var(--primary-200)" }}
            >
              <Sparkles className="w-3 h-3 fill-current" style={{ color: "var(--primary-500)" }} />
              Where Faith Meets Love
            </span>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
              style={{ color: "var(--neutral-900)", fontWeight: "var(--font-weight-bold)" }}
            >
              Grow Together in{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, var(--primary-500) 0%, var(--primary-400) 50%, var(--secondary-500) 100%)" }}
              >
                Christ-Centered Love
              </span>
            </h1>

            <p
              className="text-base leading-relaxed max-w-lg mx-auto lg:mx-0"
              style={{ color: "var(--neutral-600)", fontSize: "var(--text-body)", fontWeight: "var(--font-weight-normal)" }}
            >
              Strengthen your covenant bond through intentional daily devotions,
              synchronized prayer tracking, and meaningful conversations built on
              Biblical foundations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl text-sm font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                  color: "var(--color-primary-foreground)",
                  boxShadow: "0 8px 24px rgba(244,63,94,0.40)",
                  fontSize: "var(--text-callout)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(244,63,94,0.55)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(244,63,94,0.40)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
              >
                Create Account <ArrowRight className="w-4 h-4" />
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl text-sm font-bold border-2 transition-all"
                style={{
                  borderColor: "var(--primary-200)",
                  color: "var(--primary-700)",
                  background: "rgba(255,255,255,0.75)",
                  fontSize: "var(--text-callout)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary-400)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-50)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary-200)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.75)"; }}
              >
                Explore Features
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <div className="flex -space-x-2.5">
                {(["💑","👫","💏","👩‍❤️‍👨"] as const).map((emoji, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 border-white shadow-sm select-none"
                    style={{ background: "linear-gradient(135deg, var(--primary-50), var(--primary-100))" }}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: "var(--warning-500)" }} />
                  ))}
                </div>
                <p className="text-xs font-medium" style={{ color: "var(--neutral-600)", fontSize: "var(--text-caption)" }}>
                  Loved by <strong style={{ color: "var(--neutral-900)" }}>10,000+</strong> couples worldwide
                </p>
              </div>
            </div>

            {/* Scripture card */}
            <div
              className="max-w-lg mx-auto lg:mx-0 p-4 rounded-2xl border"
              style={{
                background: "linear-gradient(135deg, var(--primary-50), rgba(255,255,255,0.92))",
                borderColor: "var(--primary-200)",
                boxShadow: "0 4px 24px rgba(244,63,94,0.07)",
              }}
            >
              <div className="flex gap-3 items-start">
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ background: "linear-gradient(180deg, var(--primary-400), var(--primary-600))" }}
                />
                <div>
                  <p
                    className="text-sm italic font-medium leading-relaxed"
                    style={{ color: "var(--neutral-800)", fontSize: "var(--text-caption)", fontStyle: "italic" }}
                  >
                    "Therefore a man shall leave his father and his mother and hold fast to his wife,
                    and they shall become one flesh."
                  </p>
                  <p
                    className="text-xs font-bold mt-2"
                    style={{ color: "var(--primary-600)", fontSize: "var(--text-caption)", fontWeight: "var(--font-weight-bold)" }}
                  >
                    — Genesis 2:24
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — phone mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div
              className="absolute inset-0 rounded-full blur-3xl scale-75 opacity-55"
              style={{ background: "radial-gradient(circle, var(--primary-200), var(--secondary-100) 60%, transparent 80%)" }}
            />
            <div className="relative w-full max-w-[260px]">
              {/* Floating badges */}
              <div
                className="absolute -top-4 -right-4 w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl z-20 animate-bounce"
                style={{ background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))" }}
              >
                <Heart className="w-5 h-5 fill-current" style={{ color: "var(--color-primary-foreground)" }} />
              </div>
              <div
                className="absolute -bottom-4 -left-4 w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl z-20 animate-bounce"
                style={{ background: "linear-gradient(135deg, var(--secondary-400), var(--secondary-600))", animationDelay: "1.2s" }}
              >
                <Sparkles className="w-5 h-5" style={{ color: "var(--color-primary-foreground)" }} />
              </div>

              {/* Phone frame */}
              <div
                className="relative rounded-[2.5rem] overflow-hidden border-[6px] z-10"
                style={{ borderColor: "var(--neutral-900)", boxShadow: "0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)" }}
              >
                <AppScreenMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═════════════════════════════════════════ */}
      <section
        id="features"
        className="py-20"
        style={{ background: "linear-gradient(180deg, var(--primary-50) 0%, rgba(255,255,255,0) 100%)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span
              className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border"
              style={{ background: "var(--primary-50)", color: "var(--primary-700)", borderColor: "var(--primary-200)" }}
            >
              Everything You Need
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ color: "var(--neutral-900)", fontWeight: "var(--font-weight-bold)" }}
            >
              Built for{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, var(--primary-500), var(--secondary-500))" }}
              >
                Christian Couples
              </span>
            </h2>
            <p style={{ color: "var(--neutral-600)", fontSize: "var(--text-body)", fontWeight: "var(--font-weight-normal)" }}>
              Every feature is designed to help you grow closer to God and each other.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-5 border transition-all duration-300 cursor-default"
                  style={{
                    background: "rgba(255,255,255,0.78)",
                    borderColor: "var(--primary-100)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "translateY(-3px)";
                    el.style.borderColor = "var(--primary-200)";
                    el.style.boxShadow = "var(--shadow-lg)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "translateY(0)";
                    el.style.borderColor = "var(--primary-100)";
                    el.style.boxShadow = "none";
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${f.from}, ${f.to})`,
                      boxShadow: "var(--shadow-md)",
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "var(--color-primary-foreground)" }} />
                  </div>
                  <h3
                    className="text-sm font-bold mb-1.5"
                    style={{ color: "var(--neutral-900)", fontSize: "var(--text-callout)", fontWeight: "var(--font-weight-bold)" }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--neutral-600)", fontSize: "var(--text-caption)", fontWeight: "var(--font-weight-normal)" }}
                  >
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ STATS ════════════════════════════════════════════ */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 text-center border"
                style={{
                  background: "rgba(255,255,255,0.82)",
                  borderColor: "var(--primary-100)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 4px 20px rgba(244,63,94,0.06)",
                }}
              >
                <p
                  className="text-3xl font-black tracking-tight mb-1"
                  style={{ color: "var(--primary-600)", fontWeight: "var(--font-weight-bold)" }}
                >
                  {s.value}
                </p>
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--neutral-500)", fontSize: "var(--text-label)" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VISION / TRUST ═══════════════════════════════════ */}
      <section id="vision" className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="space-y-6">
            <span
              className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border"
              style={{ background: "var(--secondary-50)", color: "var(--secondary-700)", borderColor: "var(--secondary-200)" }}
            >
              Our Foundational Vision
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ color: "var(--neutral-900)", fontWeight: "var(--font-weight-bold)" }}
            >
              More Than Just Another App
            </h2>
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--neutral-600)", fontSize: "var(--text-body)" }}
            >
              We believe that when Christ is at the center of a relationship, that
              relationship becomes unbreakable. But staying connected spiritually
              requires intentionality — and that's exactly what TwoBeOne provides.
            </p>
            <div className="space-y-5">
              {TRUST.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex gap-4 items-start">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                        boxShadow: "0 4px 12px rgba(244,63,94,0.30)",
                      }}
                    >
                      <Icon className="w-4.5 h-4.5" style={{ color: "var(--color-primary-foreground)" }} />
                    </div>
                    <div>
                      <h4
                        className="text-sm font-bold mb-0.5"
                        style={{ color: "var(--neutral-900)", fontSize: "var(--text-callout)", fontWeight: "var(--font-weight-bold)" }}
                      >
                        {item.title}
                      </h4>
                      <p
                        className="text-sm"
                        style={{ color: "var(--neutral-600)", fontSize: "var(--text-caption)" }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — testimonial */}
          <div
            className="relative rounded-3xl p-8 border overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--primary-50) 0%, rgba(255,255,255,0.92) 100%)",
              borderColor: "var(--primary-200)",
              boxShadow: "0 20px 60px rgba(244,63,94,0.09)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-40"
              style={{ background: "radial-gradient(circle, var(--primary-200), transparent 70%)" }}
            />
            <div className="relative space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" style={{ color: "var(--warning-500)" }} />
                ))}
              </div>
              <p
                className="text-base italic font-medium leading-relaxed"
                style={{ color: "var(--neutral-800)", fontSize: "var(--text-body)", fontStyle: "italic" }}
              >
                "TwoBeOne transformed our marriage! We pray together daily now and our
                conversations have never been deeper. This app brought us closer to God
                and each other."
              </p>
              <div
                className="flex items-center gap-3 pt-2 border-t"
                style={{ borderColor: "var(--primary-100)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg select-none border"
                  style={{ background: "var(--primary-100)", borderColor: "var(--primary-200)" }}
                >
                  💑
                </div>
                <div>
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--neutral-900)", fontWeight: "var(--font-weight-bold)" }}
                  >
                    Sarah & Mike
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--neutral-500)", fontSize: "var(--text-caption)" }}
                  >
                    Austin, TX · 3 years married
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ══════════════════════════════════════════════ */}
      <section
        id="faq"
        className="py-20"
        style={{ background: "linear-gradient(180deg, white 0%, var(--primary-50) 100%)" }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <span
              className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border"
              style={{ background: "var(--neutral-100)", color: "var(--neutral-700)", borderColor: "var(--neutral-200)" }}
            >
              Got Questions?
            </span>
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--neutral-900)", fontWeight: "var(--font-weight-bold)" }}
            >
              Frequently Asked Questions
            </h2>
            <p style={{ color: "var(--neutral-600)", fontSize: "var(--text-body)" }}>
              Everything you need to know about TwoBeOne
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl border overflow-hidden transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.88)",
                    backdropFilter: "blur(8px)",
                    borderColor: isOpen ? "var(--primary-300)" : "var(--neutral-200)",
                    boxShadow: isOpen ? "0 8px 32px rgba(244,63,94,0.09)" : "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: "var(--neutral-900)", fontSize: "var(--text-callout)", fontWeight: "var(--font-weight-semibold)" }}
                    >
                      {faq.q}
                    </span>
                    <ChevronDown
                      className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                      style={{
                        color: isOpen ? "var(--primary-500)" : "var(--neutral-400)",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: isOpen ? "200px" : "0px", opacity: isOpen ? 1 : 0 }}
                  >
                    <div className="px-5 pb-5 pt-0">
                      <div className="pl-4 border-l-2" style={{ borderColor: "var(--primary-300)" }}>
                        <p
                          className="text-sm leading-relaxed"
                          style={{ color: "var(--neutral-600)", fontSize: "var(--text-caption)", fontWeight: "var(--font-weight-normal)" }}
                        >
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ CTA ══════════════════════════════════════════════ */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: "var(--neutral-950)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(var(--primary-400) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-3xl"
          style={{ background: "radial-gradient(ellipse at 50% 30%, var(--primary-600) 0%, var(--secondary-600) 50%, transparent 70%)", opacity: 0.16 }}
        />

        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <span
            className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border"
            style={{ background: "rgba(244,63,94,0.12)", color: "var(--primary-300)", borderColor: "rgba(244,63,94,0.25)" }}
          >
            Start Today — It's Free
          </span>

          <h2
            className="text-3xl md:text-4xl font-bold text-white tracking-tight"
            style={{ fontWeight: "var(--font-weight-bold)" }}
          >
            Ready to Build a{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, var(--primary-400), var(--secondary-300))" }}
            >
              Legacy Together?
            </span>
          </h2>

          <p
            className="text-sm leading-relaxed max-w-md mx-auto"
            style={{ color: "var(--neutral-400)", fontSize: "var(--text-body)" }}
          >
            Join thousands of Christian couples building stronger, faith-centered
            relationships. Free forever, fully private, no ads.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                color: "var(--color-primary-foreground)",
                boxShadow: "0 8px 24px rgba(244,63,94,0.40)",
                fontSize: "var(--text-callout)",
                fontWeight: "var(--font-weight-semibold)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(244,63,94,0.55)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(244,63,94,0.40)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
            >
              <LogIn className="w-4 h-4" /> Join TwoBeOne Free
            </button>
          </div>

          <p
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--neutral-600)", fontSize: "var(--text-label)" }}
          >
            ✨ Free forever · Fully private · No ads ✨
          </p>
        </div>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════════ */}
      <footer
        className="py-12 border-t"
        style={{ background: "var(--neutral-900)", borderColor: "var(--neutral-800)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 select-none">
            <Heart className="w-5 h-5 fill-current" style={{ color: "var(--primary-500)" }} />
            <span
              className="text-sm font-bold text-white"
              style={{ fontWeight: "var(--font-weight-bold)" }}
            >
              TwoBeOne
            </span>
          </div>
          <p
            className="text-xs text-center"
            style={{ color: "var(--neutral-500)", fontSize: "var(--text-caption)" }}
          >
            © {new Date().getFullYear()} TwoBeOne. Made with 💕 for Christ-centered couples.
          </p>
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--neutral-500)", fontSize: "var(--text-caption)" }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--success-500)" }} />
            100% Secure &amp; Private
          </div>
        </div>
      </footer>
    </div>
  );
}
