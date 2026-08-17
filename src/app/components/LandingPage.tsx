import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Heart,
  BookOpen,
  MessageSquare,
  Users,
  Sparkles,
  ArrowRight,
  Star,
  ChevronDown,
  Shield,
  Zap,
  TrendingUp,
  LogIn,
  Twitter,
  Instagram,
  Facebook,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { projectId } from "../utils/supabase/info";
import appScreenshot from "figma:asset/d5fde893add01b8ea5bf3527897567c586c24a70.png";
import {
  BlogPage,
  HelpCenterPage,
  CommunityPage,
  ContactPage,
  CookiePolicyPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
} from "./StaticPages";

type StaticPage =
  | "blog"
  | "help-center"
  | "community"
  | "contact"
  | "privacy-policy"
  | "terms-of-service"
  | "cookie-policy"
  | null;

/* ─────────────────────────────────────────────
   DATA CONSTANTS
───────────────────────────────────────────── */

const FEATURES = [
  {
    icon: BookOpen,
    title: "Daily Devotionals",
    description:
      "Scripture-based devotions written specifically for couples to strengthen your spiritual foundation together.",
    gradientFrom: "var(--primary-500)",
    gradientTo: "var(--primary-700)",
    glowColor: "rgba(244,63,94,0.18)",
  },
  {
    icon: MessageSquare,
    title: "Shared Journaling",
    description:
      "Express your hearts, reflect on your journey, and share intimate thoughts in a private, secure space.",
    gradientFrom: "var(--secondary-400)",
    gradientTo: "var(--secondary-700)",
    glowColor: "rgba(14,165,233,0.15)",
  },
  {
    icon: Heart,
    title: "Prayer Together",
    description:
      "Create prayer requests, pray for each other daily, and celebrate when God answers. Build faith together.",
    gradientFrom: "var(--primary-400)",
    gradientTo: "var(--primary-600)",
    glowColor: "rgba(244,63,94,0.15)",
  },
  {
    icon: Users,
    title: "Conversation Questions",
    description:
      "Deep, faith-based conversation starters across 12 categories to help you truly know each other.",
    gradientFrom: "var(--primary-500)",
    gradientTo: "var(--secondary-600)",
    glowColor: "rgba(14,165,233,0.12)",
  },
  {
    icon: Sparkles,
    title: "Learning Modules",
    description:
      "Biblical guidance on communication, conflict resolution, intimacy, and spiritual growth.",
    gradientFrom: "var(--success-500)",
    gradientTo: "var(--success-700)",
    glowColor: "rgba(34,197,94,0.15)",
  },
  {
    icon: TrendingUp,
    title: "Emotional Analytics",
    description:
      "Identify emotional patterns over time with detailed charts and collaborative sync trends.",
    gradientFrom: "var(--warning-500)",
    gradientTo: "var(--warning-700)",
    glowColor: "rgba(245,158,11,0.15)",
  },
];

const STATS = [
  { value: "10k+", label: "Active Couples", colorVar: "var(--primary-600)" },
  { value: "500k+", label: "Devotionals Read", colorVar: "var(--secondary-600)" },
  { value: "250k+", label: "Prayers Shared", colorVar: "var(--primary-500)" },
  { value: "4.9★", label: "App Store Rating", colorVar: "var(--warning-500)" },
];

const FAQS = [
  {
    question: "Is TwoBeOne completely free?",
    answer:
      "Yes! TwoBeOne is built to serve couples unconditionally. All core features — shared devotionals, prayer boards, journaling, and profile syncing — are free forever with no hidden fees.",
  },
  {
    question: "How does partner syncing work?",
    answer:
      "After creating your profile you receive a unique partner link token. Sharing this code links your profiles instantly, enabling real-time notifications, joint timeline tracking, and collaborative journal spaces.",
  },
  {
    question: "Is my relationship data secure?",
    answer:
      "Absolutely. We enforce strict end-to-end encryption and database isolation. Your personal entries, mood reports, and conversation dynamics are accessible exclusively by you and your connected partner.",
  },
  {
    question: "What makes TwoBeOne different?",
    answer:
      "TwoBeOne is purpose-built for Christian couples with faith at the center. Every feature is rooted in biblical principles, and all content is crafted with a Christ-centered perspective.",
  },
  {
    question: "Can we use it if we're not married yet?",
    answer:
      "Absolutely! TwoBeOne is perfect for engaged couples, dating couples, newlyweds, and married couples of any duration. If you're in a committed Christian relationship, this is for you!",
  },
  {
    question: "How much time does it take daily?",
    answer:
      "As little or as much as you want. A daily devotional takes 5–10 minutes. Questions and journaling are flexible. The key is consistency, not perfection.",
  },
];

const WHY_ITEMS = [
  {
    icon: Shield,
    title: "Private & Secure",
    desc: "Bank-level encryption keeps your data strictly between you and your partner.",
  },
  {
    icon: Zap,
    title: "Real-Time Sync",
    desc: "Instant synchronization across all devices so you stay connected anywhere.",
  },
];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePage, setActivePage] = useState<StaticPage>(null);

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/newsletter/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        console.error('[Newsletter] subscribe failed:', err);
        toast.error(err?.error || 'Failed to subscribe to newsletter');
      } else {
        toast.success("Check your inbox to confirm Shabbat Shalom.");
        setEmail("");
      }
    } catch {
      toast.error('Failed to subscribe to newsletter');
      console.error('[Newsletter] subscribe request error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  /* ─── STATIC PAGE ROUTER ─── */
  const sharedPageProps = {
    onBack: () => {
      setActivePage(null);
      window.scrollTo({ top: 0, behavior: "instant" });
    },
    onGetStarted,
  };

  if (activePage === "blog") return <BlogPage {...sharedPageProps} />;
  if (activePage === "help-center") return <HelpCenterPage {...sharedPageProps} />;
  if (activePage === "community") return <CommunityPage {...sharedPageProps} />;
  if (activePage === "contact") return <ContactPage {...sharedPageProps} />;
  if (activePage === "privacy-policy") return <PrivacyPolicyPage {...sharedPageProps} />;
  if (activePage === "terms-of-service") return <TermsOfServicePage {...sharedPageProps} />;
  if (activePage === "cookie-policy") return <CookiePolicyPage {...sharedPageProps} />;

  const navigate = (page: StaticPage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  /* ─── NAV ITEMS ─── */
  const navLinks = [
    { label: "Features", id: "features" },
    { label: "Vision", id: "why-us" },
    { label: "FAQ", id: "faq" },
  ];

  return (
    <div className="min-h-screen antialiased overflow-x-hidden" style={{ background: "var(--background)", color: "var(--foreground)" }}>

      {/* ═══════════════════════════════════════
          AMBIENT GRADIENT BLOBS (fixed, behind everything)
      ═══════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Top-right pink bloom */}
        <div
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, var(--primary-200) 0%, var(--primary-100) 45%, transparent 70%)", opacity: 0.55 }}
        />
        {/* Left-mid purple/sky bloom */}
        <div
          className="absolute top-1/3 -left-48 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, var(--secondary-200) 0%, var(--secondary-100) 45%, transparent 70%)", opacity: 0.4 }}
        />
        {/* Bottom center warm pink */}
        <div
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(circle, var(--primary-100) 0%, transparent 70%)", opacity: 0.35 }}
        />
      </div>

      {/* ═══════════════════════════════════════
          NAVIGATION
      ═══════════════════════════════════════ */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "var(--primary-100)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 select-none">
            <div className="relative w-8 h-7 flex items-end">
              <Heart
                className="w-6 h-6 fill-current absolute bottom-0 left-0"
                style={{ color: "var(--primary-500)" }}
              />
              <Heart
                className="w-4 h-4 fill-current absolute top-0 right-0"
                style={{ color: "var(--primary-300)" }}
              />
            </div>
            <span
              className="text-xl font-bold ml-1 bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, var(--primary-600) 0%, var(--primary-400) 100%)" }}
            >
              TwoBeOne
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--neutral-600)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-600)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--neutral-600)")}
              >
                {link.label}
              </button>
            ))}
            <div className="w-px h-5" style={{ background: "var(--neutral-200)" }} />
            <button
              onClick={onGetStarted}
              className="h-9 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5 transition-all"
              style={{
                background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                boxShadow: "0 4px 15px rgba(244,63,94,0.35)",
              }}
            >
              <LogIn className="w-3.5 h-3.5" />
              {t?.auth?.login || "Sign In"}
            </button>
          </div>

          {/* Mobile login */}
          <button
            onClick={onGetStarted}
            className="md:hidden h-8 px-4 rounded-xl text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))" }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section className="relative pt-20 pb-28 md:pt-28 md:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT — Text content */}
          <div className="space-y-8 text-center lg:text-left">

            {/* Faith badge */}
            <div className="flex justify-center lg:justify-start">
              <span
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border"
                style={{
                  background: "var(--primary-50)",
                  color: "var(--primary-700)",
                  borderColor: "var(--primary-200)",
                }}
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" style={{ color: "var(--primary-500)" }} />
                Where Faith Meets Love
              </span>
            </div>

            {/* Main headline */}
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight font-bold"
              style={{ color: "var(--neutral-900)" }}
            >
              Grow Together in{" "}
              <span
                className="bg-clip-text text-transparent block sm:inline"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--primary-500) 0%, var(--primary-400) 40%, var(--secondary-500) 100%)",
                }}
              >
                Christ-Centered Love
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-lg leading-relaxed max-w-xl mx-auto lg:mx-0"
              style={{ color: "var(--neutral-600)" }}
            >
              Strengthen your covenant bond through intentional daily devotions,
              synchronized prayer tracking, and meaningful conversations built on
              Biblical foundations.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {/* Primary — glow effect */}
              <button
                onClick={onGetStarted}
                className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl text-sm font-bold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                  boxShadow: "0 8px 25px rgba(244,63,94,0.40), 0 2px 6px rgba(244,63,94,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 12px 35px rgba(244,63,94,0.55), 0 2px 8px rgba(244,63,94,0.3)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(244,63,94,0.40), 0 2px 6px rgba(244,63,94,0.2)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {t?.auth?.createAccount || "Create Account"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Secondary — outline */}
              <button
                onClick={() => scrollTo("features")}
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl text-sm font-bold border-2 transition-all"
                style={{
                  borderColor: "var(--primary-200)",
                  color: "var(--primary-700)",
                  background: "rgba(255,255,255,0.7)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary-400)";
                  e.currentTarget.style.background = "var(--primary-50)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary-200)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.7)";
                }}
              >
                Explore Features
              </button>
            </div>

            {/* Social proof — avatar stack + stars */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              {/* Stacked avatars */}
              <div className="flex -space-x-3">
                {["💑", "👫", "💏", "👩‍❤️‍👨"].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base border-2 border-white shadow-sm select-none"
                    style={{ background: "linear-gradient(135deg, var(--primary-50), var(--primary-100))" }}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: "var(--warning-500)" }} />
                  ))}
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--neutral-600)" }}>
                  Loved by{" "}
                  <strong style={{ color: "var(--neutral-900)" }}>10,000+</strong>{" "}
                  couples worldwide
                </p>
              </div>
            </div>

            {/* Scripture quote card — glassmorphic */}
            <div
              className="max-w-xl mx-auto lg:mx-0 p-5 rounded-2xl border"
              style={{
                background: "linear-gradient(135deg, var(--primary-50) 0%, rgba(255,255,255,0.85) 100%)",
                borderColor: "var(--primary-200)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 24px rgba(244,63,94,0.08)",
              }}
            >
              <div className="flex gap-3 items-start">
                <div
                  className="flex-shrink-0 w-1 self-stretch rounded-full"
                  style={{ background: "linear-gradient(180deg, var(--primary-400), var(--primary-600))" }}
                />
                <div>
                  <p
                    className="text-sm italic font-medium leading-relaxed"
                    style={{ color: "var(--neutral-800)" }}
                  >
                    "Therefore a man shall leave his father and his mother and hold
                    fast to his wife, and they shall become one flesh."
                  </p>
                  <p className="text-xs font-bold mt-2" style={{ color: "var(--primary-600)" }}>
                    — Genesis 2:24
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Phone mockup */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Radial glow behind phone */}
            <div
              className="absolute inset-0 rounded-full blur-3xl scale-90"
              style={{
                background:
                  "radial-gradient(circle, var(--primary-200) 0%, var(--secondary-100) 55%, transparent 75%)",
                opacity: 0.6,
              }}
            />

            <div className="relative w-full max-w-[290px]">
              {/* Floating decoration — top-right */}
              <div
                className="absolute -top-5 -right-5 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl z-20"
                style={{
                  background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                  animation: "bounce 3s infinite",
                }}
              >
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              {/* Floating decoration — bottom-left */}
              <div
                className="absolute -bottom-4 -left-5 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl z-20"
                style={{
                  background: "linear-gradient(135deg, var(--secondary-400), var(--secondary-600))",
                  animation: "bounce 3s infinite",
                  animationDelay: "1.2s",
                }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </div>

              {/* Phone frame */}
              <div
                className="relative rounded-[2.5rem] overflow-hidden border-[6px] z-10"
                style={{
                  borderColor: "var(--neutral-900)",
                  boxShadow: "0 40px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)",
                }}
              >
                <img
                  src={appScreenshot}
                  alt="TwoBeOne app dashboard showing devotional tracking and couple analytics"
                  className="w-full block select-none"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURE GRID
      ═══════════════════════════════════════ */}
      <section
        id="features"
        className="py-24"
        style={{
          background: "linear-gradient(180deg, var(--primary-50) 0%, rgba(255,255,255,0) 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span
              className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border"
              style={{
                background: "var(--primary-50)",
                color: "var(--primary-700)",
                borderColor: "var(--primary-200)",
              }}
            >
              Everything You Need
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold tracking-tight"
              style={{ color: "var(--neutral-900)" }}
            >
              Built for{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--primary-500), var(--secondary-500))",
                }}
              >
                Christian Couples
              </span>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--neutral-600)" }}>
              Every feature is designed to help you grow closer to God and each other.
              No fluff, just meaningful tools for your relationship.
            </p>
          </div>

          {/* 6-card grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group relative rounded-2xl p-6 border transition-all duration-300 cursor-default space-y-4"
                  style={{
                    background: "rgba(255,255,255,0.72)",
                    borderColor: "var(--primary-100)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: `0 4px 20px ${feature.glowColor}`,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "translateY(-3px)";
                    el.style.boxShadow = `0 16px 48px ${feature.glowColor}, 0 2px 8px rgba(0,0,0,0.04)`;
                    el.style.borderColor = "var(--primary-200)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = `0 4px 20px ${feature.glowColor}`;
                    el.style.borderColor = "var(--primary-100)";
                  }}
                >
                  {/* Translucent gradient icon badge */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${feature.gradientFrom}, ${feature.gradientTo})`,
                      boxShadow: `0 4px 12px ${feature.glowColor}`,
                    }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold" style={{ color: "var(--neutral-900)" }}>
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--neutral-600)" }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SOCIAL PROOF & METRICS
      ═══════════════════════════════════════ */}
      <section id="why-us" className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          {/* Stat cards row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl p-6 text-center border overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  borderColor: "var(--primary-100)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 4px 20px rgba(244,63,94,0.06), 0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <p
                  className="text-3xl font-black tracking-tight leading-none mb-1.5"
                  style={{ color: stat.colorVar }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--neutral-500)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Vision pillars */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span
                className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border"
                style={{
                  background: "var(--secondary-50)",
                  color: "var(--secondary-700)",
                  borderColor: "var(--secondary-200)",
                }}
              >
                Our Foundational Vision
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold tracking-tight"
                style={{ color: "var(--neutral-900)" }}
              >
                More Than Just Another App
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "var(--neutral-600)" }}>
                We believe that when Christ is at the center of a relationship, that
                relationship becomes unbreakable. But staying connected spiritually
                requires intentionality — and that's exactly what TwoBeOne provides.
              </p>
              <div className="space-y-5">
                {WHY_ITEMS.map((item, idx) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={idx} className="flex gap-4 items-start">
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                          boxShadow: "0 4px 12px rgba(244,63,94,0.3)",
                        }}
                      >
                        <ItemIcon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold mb-0.5" style={{ color: "var(--neutral-900)" }}>
                          {item.title}
                        </h4>
                        <p className="text-sm" style={{ color: "var(--neutral-600)" }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Testimonial highlight card */}
            <div
              className="relative rounded-3xl p-8 border overflow-hidden"
              style={{
                background: "linear-gradient(135deg, var(--primary-50) 0%, rgba(255,255,255,0.9) 100%)",
                borderColor: "var(--primary-200)",
                boxShadow: "0 20px 60px rgba(244,63,94,0.10)",
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
                  style={{ color: "var(--neutral-800)" }}
                >
                  "TwoBeOne transformed our marriage! We pray together daily now and our
                  conversations have never been deeper. This app brought us closer to God
                  and each other."
                </p>
                <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--primary-100)" }}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg select-none border"
                    style={{ background: "var(--primary-100)", borderColor: "var(--primary-200)" }}
                  >
                    💑
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--neutral-900)" }}>Sarah & Mike</p>
                    <p className="text-xs" style={{ color: "var(--neutral-500)" }}>Austin, TX · 3 years married</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FAQ ACCORDION
      ═══════════════════════════════════════ */}
      <section
        id="faq"
        className="py-24"
        style={{ background: "linear-gradient(180deg, white 0%, var(--primary-50) 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14 space-y-4">
            <span
              className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border"
              style={{
                background: "var(--neutral-100)",
                color: "var(--neutral-700)",
                borderColor: "var(--neutral-200)",
              }}
            >
              Got Questions?
            </span>
            <h2
              className="text-4xl font-bold tracking-tight"
              style={{ color: "var(--neutral-900)" }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-base" style={{ color: "var(--neutral-600)" }}>
              Everything you need to know about TwoBeOne
            </p>
          </div>

          {/* Accordion items */}
          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border overflow-hidden transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(8px)",
                    borderColor: isOpen ? "var(--primary-300)" : "var(--neutral-200)",
                    boxShadow: isOpen
                      ? "0 8px 32px rgba(244,63,94,0.10)"
                      : "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <button
                    className="w-full flex justify-between items-center px-5 py-4 text-left gap-4"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <h3 className="text-sm font-bold" style={{ color: "var(--neutral-900)" }}>
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className="w-5 h-5 flex-shrink-0 transition-transform duration-300"
                      style={{
                        color: isOpen ? "var(--primary-500)" : "var(--neutral-400)",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: isOpen ? "300px" : "0px", opacity: isOpen ? 1 : 0 }}
                  >
                    <div className="px-5 pb-5 pt-0">
                      <div
                        className="pl-4 border-l-2"
                        style={{ borderColor: "var(--primary-300)" }}
                      >
                        <p className="text-sm leading-relaxed" style={{ color: "var(--neutral-600)" }}>
                          {faq.answer}
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

      {/* ═══════════════════════════════════════
          CTA / NEWSLETTER — Dark hero banner
      ═══════════════════════════════════════ */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "var(--neutral-950)" }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(var(--primary-400) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Top radial glow */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, var(--primary-600) 0%, var(--secondary-600) 45%, transparent 70%)",
            opacity: 0.18,
          }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span
            className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border"
            style={{
              background: "rgba(244,63,94,0.12)",
              color: "var(--primary-300)",
              borderColor: "rgba(244,63,94,0.25)",
            }}
          >
            Start Today
          </span>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Ready to Build a{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--primary-400) 0%, var(--secondary-300) 100%)",
              }}
            >
              Legacy Together?
            </span>
          </h2>
          <p
            className="text-base max-w-xl mx-auto leading-relaxed"
            style={{ color: "var(--neutral-400)" }}
          >
            Join thousands of Christian couples building stronger, faith-centered
            relationships. Get notified about new features and devotional content.
          </p>

          {/* Glass card — email form */}
          <div
            className="max-w-md mx-auto mt-8 rounded-2xl p-6 border"
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderColor: "rgba(255,255,255,0.10)",
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <form onSubmit={handleNewsletterSignup} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="cta-email"
                  className="block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--neutral-400)" }}
                >
                  Newsletter Subscription
                </label>
                <p className="mb-2 text-xs leading-5" style={{ color: "var(--neutral-400)" }}>
                  Shabbat Shalom: one Saturday email with encouragement, relationship guidance, and TwoBeOne updates. Unsubscribe anytime.
                </p>
                <Input
                  id="cta-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl text-sm font-medium border placeholder:text-neutral-500"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    borderColor: "rgba(255,255,255,0.13)",
                    color: "white",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                  boxShadow: "0 8px 24px rgba(244,63,94,0.40)",
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(244,63,94,0.55)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(244,63,94,0.40)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {isSubmitting ? "Subscribing..." : "Subscribe for Free"}
              </button>
            </form>
          </div>

          {/* Join button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl text-sm font-bold border transition-all"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "white",
                borderColor: "rgba(255,255,255,0.18)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
              }}
            >
              <LogIn className="w-4 h-4" />
              {t?.auth?.createAccount || "Join TwoBeOne"}
            </button>
          </div>

          <p
            className="text-xs font-medium uppercase tracking-widest pt-2"
            style={{ color: "var(--neutral-600)" }}
          >
            ✨ Free forever · Fully private · No ads ✨
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer
        className="py-14 border-t"
        style={{ background: "var(--neutral-900)", borderColor: "var(--neutral-800)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 fill-current" style={{ color: "var(--primary-500)" }} />
                <span className="text-base font-bold text-white">TwoBeOne</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--neutral-400)" }}>
                Strengthening Christian relationships through faith-based tools and
                daily spiritual practices.
              </p>
              {/* Social icons */}
              <div className="flex gap-2.5 pt-1">
                {[Twitter, Instagram, Facebook].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: "var(--neutral-800)", color: "var(--neutral-400)" }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.background = "var(--primary-600)";
                      el.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.background = "var(--neutral-800)";
                      el.style.color = "var(--neutral-400)";
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">Product</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Features", action: () => scrollTo("features") },
                  { label: "Vision", action: () => scrollTo("why-us") },
                  { label: "FAQ", action: () => scrollTo("faq") },
                  { label: "Get Started", action: onGetStarted },
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.action}
                      className="text-sm transition-colors"
                      style={{ color: "var(--neutral-400)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--neutral-400)")}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">Resources</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Blog", page: "blog" as StaticPage },
                  { label: "Help Center", page: "help-center" as StaticPage },
                  { label: "Community", page: "community" as StaticPage },
                  { label: "Contact Us", page: "contact" as StaticPage },
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => navigate(item.page)}
                      className="text-sm transition-colors"
                      style={{ color: "var(--neutral-400)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--neutral-400)")}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Language selector pills + Legal */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">Language</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "English", active: true },
                  { label: "አማርኛ", active: false },
                  { label: "Afan Oromo", active: false },
                ].map((lang) => (
                  <span
                    key={lang.label}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer select-none transition-colors"
                    style={
                      lang.active
                        ? {
                            background: "var(--primary-600)",
                            color: "white",
                            borderColor: "var(--primary-500)",
                          }
                        : {
                            background: "var(--neutral-800)",
                            color: "var(--neutral-400)",
                            borderColor: "var(--neutral-700)",
                          }
                    }
                  >
                    {lang.label}
                  </span>
                ))}
              </div>

              <div className="pt-2 space-y-2.5">
                <h4 className="text-sm font-bold text-white">Legal</h4>
                {[
                  { label: "Privacy Policy", page: "privacy-policy" as StaticPage },
                  { label: "Terms of Service", page: "terms-of-service" as StaticPage },
                  { label: "Cookie Policy", page: "cookie-policy" as StaticPage },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.page)}
                    className="block text-sm transition-colors text-left"
                    style={{ color: "var(--neutral-400)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--neutral-400)")}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4"
            style={{ borderColor: "var(--neutral-800)" }}
          >
            <p className="text-xs" style={{ color: "var(--neutral-500)" }}>
              © {new Date().getFullYear()} TwoBeOne. All rights reserved. Made with 💕 for
              Christ-centered couples.
            </p>
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: "var(--neutral-500)" }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--success-500)" }} />
              100% Secure &amp; Private
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
