import { useEffect, useState } from "react";
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
  LockKeyhole,
} from "lucide-react";
import { toast } from "sonner";
import { projectId } from "../utils/supabase/info";
import {
  STATIC_PAGE_PATHS,
  staticPageFromPath,
  type PublicStaticPage,
  type StaticPage,
} from "../utils/publicRoutes";
import "../styles/launch-hero.css";
import {
  BlogPage,
  HelpCenterPage,
  CommunityPage,
  ContactPage,
  CookiePolicyPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
} from "./StaticPages";

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

const APP_STORE_URL = (import.meta as any).env?.VITE_APP_STORE_URL as string | undefined;
const GOOGLE_PLAY_URL = (import.meta as any).env?.VITE_GOOGLE_PLAY_URL as string | undefined;

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */

interface LandingPageProps {
  onGetStarted: () => void;
  initialPage?: StaticPage;
}

export function LandingPage({ onGetStarted, initialPage = null }: LandingPageProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePage, setActivePage] = useState<StaticPage>(initialPage);
  const [heroPreview, setHeroPreview] = useState<"devotional" | "prayer" | "sync">("devotional");

  useEffect(() => {
    const handlePopState = () => setActivePage(staticPageFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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

  const openStore = (url?: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    onGetStarted();
  };

  /* ─── STATIC PAGE ROUTER ─── */
  const sharedPageProps = {
    onBack: () => {
      setActivePage(null);
      if (staticPageFromPath(window.location.pathname)) {
        window.history.pushState({}, '', '/');
      }
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

  const navigate = (page: PublicStaticPage) => {
    setActivePage(page);
    window.history.pushState({}, '', STATIC_PAGE_PATHS[page]);
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
      <section className="launch-hero" aria-labelledby="launch-hero-title">
        <div className="launch-hero__orb launch-hero__orb--one" aria-hidden="true" />
        <div className="launch-hero__orb launch-hero__orb--two" aria-hidden="true" />

        <div className="launch-hero__inner">
          <div className="launch-hero__copy">
            <div className="launch-hero__eyebrow">
              <span className="launch-hero__eyebrow-mark" aria-hidden="true">†</span>
              Built for Christ-centered couples
            </div>

            <h1 id="launch-hero-title">
              Where Faith Meets Love —{" "}
              <span className="launch-hero__headline-accent">In One Beautiful App</span>
            </h1>

            <p className="launch-hero__subtext">
              Strengthen your covenant bond through daily devotionals, shared prayer,
              and meaningful conversations.
            </p>

            <div className="launch-hero__stores" aria-label="Download TwoBeOne">
              <button className="launch-store-button" onClick={() => openStore(APP_STORE_URL)} type="button">
                <svg className="launch-store-button__apple" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.79 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.1ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25Z" />
                </svg>
                <span>
                  <small>Download on the</small>
                  <strong>App Store</strong>
                </span>
              </button>

              <button className="launch-store-button" onClick={() => openStore(GOOGLE_PLAY_URL)} type="button">
                <svg className="launch-store-button__play" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M4.8 3.9 19 16 4.8 28.1c-.5-.5-.8-1.2-.8-2V5.9c0-.8.3-1.5.8-2Z" fill="#54c6f1" />
                  <path d="m19 16 4-3.4 4.8 2.7c.9.5.9 1.9 0 2.4L23 20.4 19 16Z" fill="#ffd45a" />
                  <path d="M4.8 3.9c.7-.7 1.7-.8 2.5-.3L23 12.6 19 16 4.8 3.9Z" fill="#72d68b" />
                  <path d="M4.8 28.1 19 16l4 4.4-15.7 9c-.8.5-1.8.4-2.5-.3Z" fill="#f46f6f" />
                </svg>
                <span>
                  <small>Get it on</small>
                  <strong>Google Play</strong>
                </span>
              </button>
            </div>

            <div className="launch-hero__free-note">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              Free to start · Private by design · Made for two
            </div>

            <div className="launch-hero__features" aria-label="Key features">
              <span className="launch-feature-pill"><BookOpen aria-hidden="true" />Daily Devotionals</span>
              <span className="launch-feature-pill"><Heart aria-hidden="true" />Shared Prayer</span>
              <span className="launch-feature-pill"><MessageSquare aria-hidden="true" />Conversation Questions</span>
            </div>

            <div className="launch-hero__proof">
              <span className="launch-hero__stars" aria-label="4.9 out of 5 stars">
                {[...Array(5)].map((_, index) => <Star key={index} aria-hidden="true" />)}
              </span>
              <span><strong>4.9</strong> · Loved by <strong>10,000+</strong> Christian couples</span>
            </div>
          </div>

          <div className="launch-device-stage" aria-label="Interactive preview of the TwoBeOne app">
            <div className="launch-device-stage__ring" aria-hidden="true" />

            <div className="launch-heart-particle launch-heart-particle--one" aria-hidden="true"><Heart /></div>
            <div className="launch-heart-particle launch-heart-particle--two" aria-hidden="true"><Heart /></div>
            <div className="launch-heart-particle launch-heart-particle--three" aria-hidden="true"><Heart /></div>

            <div className="launch-float-card launch-float-card--left" aria-hidden="true">
              <div className="launch-float-card__top">
                <span className="launch-float-card__icon"><Heart /></span>
                <span><strong>Shared prayer</strong><small>Both prayed today</small></span>
              </div>
              <div className="launch-float-card__bar"><i /></div>
            </div>

            <div className="launch-float-card launch-float-card--right" aria-hidden="true">
              <div className="launch-float-card__top">
                <span className="launch-float-card__icon launch-float-card__icon--rose"><Users /></span>
                <span><strong>Couple Sync</strong><small>Connected in real time</small></span>
              </div>
            </div>

            <div className="launch-phone">
              <div className="launch-phone__screen">
                <div className="launch-phone__island" aria-hidden="true" />
                <div className="launch-phone__status" aria-hidden="true">
                  <span>9:41</span>
                  <span className="launch-phone__status-icons">
                    <span className="launch-phone__signal"><i /><i /><i /></span>
                    <span>●</span><span>▰</span>
                  </span>
                </div>

                <div className="launch-phone__topbar">
                  <div className="launch-phone__brand">
                    <span className="launch-phone__brand-mark"><Heart /></span>
                    TwoBeOne
                  </div>
                  <span className="launch-phone__avatar" aria-label="Couple profile">A+B</span>
                </div>

                <div className="launch-phone__content">
                  <span className="launch-phone__greeting">
                    {heroPreview === "devotional" ? "Good morning, together" : heroPreview === "prayer" ? "Your shared prayer space" : "Growing closer every day"}
                  </span>
                  <h2 className="launch-phone__title">
                    {heroPreview === "devotional" ? "Today’s Devotional" : heroPreview === "prayer" ? "Pray as One" : "Your Couple Sync"}
                  </h2>

                  {heroPreview === "devotional" && (
                    <article className="launch-screen-card" key="devotional">
                      <div className="launch-screen-card__art">
                        <span className="launch-screen-card__label">Day 18 · Covenant Love</span>
                        <h3>A Cord of Three Strands</h3>
                      </div>
                      <div className="launch-screen-card__body">
                        <p className="launch-screen-card__verse">
                          “A cord of three strands is not quickly broken.”
                        </p>
                        <span className="launch-screen-card__reference">ECCLESIASTES 4:12</span>
                        <button className="launch-screen-card__button" type="button" onClick={onGetStarted}>Begin together →</button>
                      </div>
                    </article>
                  )}

                  {heroPreview === "prayer" && (
                    <article className="launch-screen-card launch-prayer-card" key="prayer">
                      <div className="launch-prayer-card__header">
                        <span className="launch-prayer-card__icon"><Heart /></span>
                        <span className="launch-prayer-card__live"><i />Partner is here</span>
                      </div>
                      <h3>Prayer for Our Future</h3>
                      <p>Invite God into your hopes, decisions, and dreams—together.</p>
                      <div className="launch-prayer-card__couple">
                        <div className="launch-prayer-card__faces"><span>A</span><span>B</span></div>
                        <span><strong>2 hearts, one prayer</strong><small>Synced just now</small></span>
                      </div>
                      <button className="launch-screen-card__button" type="button" onClick={onGetStarted}>Pray together →</button>
                    </article>
                  )}

                  {heroPreview === "sync" && (
                    <article className="launch-screen-card launch-sync-card" key="sync">
                      <div className="launch-sync-card__visual">
                        <span className="launch-sync-card__halo" />
                        <div className="launch-sync-card__pair">
                          <span>AB</span><span>JM</span>
                          <i className="launch-sync-card__heart"><Heart /></i>
                        </div>
                      </div>
                      <h3>Walking in Faith Together</h3>
                      <p>Your shared spiritual rhythm, beautifully in sync.</p>
                      <div className="launch-sync-card__stats">
                        <span><strong>18</strong>day streak</span>
                        <span><strong>42</strong>prayers</span>
                        <span><strong>76%</strong>in sync</span>
                      </div>
                    </article>
                  )}
                </div>

                <div className="launch-phone__tabs" role="tablist" aria-label="Preview app screens">
                  <button className={`launch-preview-tab ${heroPreview === "devotional" ? "is-active" : ""}`} onClick={() => setHeroPreview("devotional")} type="button" role="tab" aria-selected={heroPreview === "devotional"}>
                    <BookOpen />Devotional
                  </button>
                  <button className={`launch-preview-tab ${heroPreview === "prayer" ? "is-active" : ""}`} onClick={() => setHeroPreview("prayer")} type="button" role="tab" aria-selected={heroPreview === "prayer"}>
                    <Heart />Prayer
                  </button>
                  <button className={`launch-preview-tab ${heroPreview === "sync" ? "is-active" : ""}`} onClick={() => setHeroPreview("sync")} type="button" role="tab" aria-selected={heroPreview === "sync"}>
                    <Users />Couple Sync
                  </button>
                </div>
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
                  { label: "Blog", page: "blog" as PublicStaticPage },
                  { label: "Help Center", page: "help-center" as PublicStaticPage },
                  { label: "Community", page: "community" as PublicStaticPage },
                  { label: "Contact Us", page: "contact" as PublicStaticPage },
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={STATIC_PAGE_PATHS[item.page]}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(item.page);
                      }}
                      className="text-sm transition-colors"
                      style={{ color: "var(--neutral-400)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--neutral-400)")}
                    >
                      {item.label}
                    </a>
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
                  { label: "Privacy Policy", page: "privacy-policy" as PublicStaticPage },
                  { label: "Terms of Service", page: "terms-of-service" as PublicStaticPage },
                  { label: "Cookie Policy", page: "cookie-policy" as PublicStaticPage },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={STATIC_PAGE_PATHS[item.page]}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(item.page);
                    }}
                    className="block text-sm transition-colors text-left"
                    style={{ color: "var(--neutral-400)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--neutral-400)")}
                  >
                    {item.label}
                  </a>
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
