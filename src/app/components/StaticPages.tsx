import { formatUiDate } from '../utils/uiDateTime';
import { useCurrentLanguage } from '../utils/languageStore';
import { UI_LOCALES, useUiCopy } from '../utils/uiTranslation';
import { publicStaticMessages } from '../locales/publicStatic';
import { LanguageSelector } from './LanguageSelector';
import { LoadingMark } from './BrandLoader';
import { useState } from "react";
import {
  Heart,
  BookOpen,
  HelpCircle,
  Users,
  Mail,
  Send,
  Cookie,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  Phone,
  MapPin,
} from "lucide-react";
import { Input } from "./ui/input";
import { BackButton } from "./BackButton";
import { PrivacyPolicy } from "../legal/privacy-policy";
import { TermsOfService } from "../legal/terms-of-service";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────────
   SHARED LAYOUT WRAPPER
───────────────────────────────────────────────────────── */

interface PageShellProps {
  onBack: () => void;
  onGetStarted: () => void;
  children: React.ReactNode;
}

function PageShell({ onBack, onGetStarted, children }: PageShellProps) {
  const tr = useUiCopy(publicStaticMessages);
  return (
    <div
      className="tbo-glass-app min-h-screen antialiased"
      style={{ color: "var(--foreground)", overflowWrap: "anywhere" }}
    >
      {/* Sticky nav */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          background: "var(--glass-raised-surface)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "var(--primary-100)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 min-h-16 py-2">
          {/* Back + logo */}
          <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
            <BackButton onClick={onBack} label={tr("Back")} />
            <div
              className="w-px h-5"
              style={{ background: "var(--neutral-200)" }}
            />
            <div className="flex items-center gap-2 min-w-0 max-w-full select-none">
              <Heart
                className="w-5 h-5 fill-current"
                style={{ color: "var(--primary-500)" }}
              />
              <span
                className="tbo-wordmark bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--primary-600), var(--primary-400))",
                }}
              >
                TwoBeOne
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-end gap-2 max-w-full ml-auto">
          <button
            onClick={onGetStarted}
            className="tbo-action min-h-9 px-5 py-2 max-w-full rounded-xl text-white transition-all"
            style={{
              background:
                "var(--glass-primary-paint)",
              boxShadow: "0 4px 15px rgba(244,63,94,0.30)",
            }}
          > {tr("Get Started")} </button>
          <LanguageSelector />
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {children}
      </div>

      {/* Minimal footer */}
      <footer
        className="border-t py-8 mt-16"
        style={{
          background: "var(--glass-solid)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart
              className="w-4 h-4 fill-current"
              style={{ color: "var(--primary-500)" }}
            />
            <span className="tbo-supporting text-foreground">TwoBeOne</span>
          </div>
          <p className="tbo-caption " style={{ color: "var(--glass-muted)" }}>
            © {new Date().getFullYear()} {tr("TwoBeOne. All rights reserved.")} </p>
          <button
            onClick={onGetStarted}
            className="tbo-action transition-colors"
            style={{ color: "var(--primary-400)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-300)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--primary-400)")}
          > {tr("Join Free →")} </button>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION HEADER HELPER
───────────────────────────────────────────────────────── */

function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  iconGradientFrom = "var(--primary-500)",
  iconGradientTo = "var(--primary-600)",
}: {
  icon: React.ElementType;
  eyebrow: string;
  title: string;
  subtitle: string;
  iconGradientFrom?: string;
  iconGradientTo?: string;
}) {
  const tr = useUiCopy(publicStaticMessages);
  return (
    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
      <div className="flex justify-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-4"
          style={{
            background: `linear-gradient(135deg, ${iconGradientFrom}, ${iconGradientTo})`,
            boxShadow: `0 8px 24px rgba(244,63,94,0.25)`,
          }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
      <span
        className="tbo-caption inline-flex items-center px-4 py-1.5 rounded-full border"
        style={{
          background: "var(--accent)",
          color: "var(--glass-accent)",
          borderColor: "var(--primary-200)",
        }}
      >
        {tr(eyebrow)}
      </span>
      <h1
        className="tbo-page-title "
        style={{ color: "var(--glass-foreground)" }}
      >
        {tr(title)}
      </h1>
      <p
        className="tbo-body "
        style={{ color: "var(--glass-muted)" }}
      >
        {tr(subtitle)}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BLOG PAGE
───────────────────────────────────────────────────────── */

const BLOG_POSTS = [
  {
    category: "Devotionals",
    categoryColor: "var(--primary-600)",
    categoryBg: "var(--primary-50)",
    date: "August 5, 2026",
    readTime: "5 min read",
    title: "How Daily Devotionals Transformed Our Marriage",
    excerpt:
      "When we started spending just 10 minutes each morning in Scripture together, we noticed something shift. Not just in our spiritual lives, but in how we listened to each other throughout the day.",
    author: "Sarah & Mike",
    emoji: "💑",
  },
  {
    category: "Communication",
    categoryColor: "var(--secondary-600)",
    categoryBg: "var(--secondary-50)",
    date: "July 28, 2026",
    readTime: "7 min read",
    title: "5 Biblical Principles for Conflict Resolution",
    excerpt:
      "Every couple disagrees. The question isn't whether conflict happens — it's how you navigate it. Scripture offers a profound framework for resolving disputes with grace and love.",
    author: "TwoBeOne Editorial",
    emoji: "📖",
  },
  {
    category: "Prayer",
    categoryColor: "var(--primary-500)",
    categoryBg: "var(--primary-50)",
    date: "July 14, 2026",
    readTime: "4 min read",
    title: "Praying Together: Why It Changes Everything",
    excerpt:
      "Studies consistently show that couples who pray together report higher marital satisfaction. But beyond statistics, there's something spiritually profound about joining hearts before God.",
    author: "TwoBeOne Editorial",
    emoji: "🙏",
  },
  {
    category: "Growth",
    categoryColor: "var(--success-700)",
    categoryBg: "var(--success-50)",
    date: "July 3, 2026",
    readTime: "6 min read",
    title: "Building Spiritual Intimacy in Your Relationship",
    excerpt:
      "Physical and emotional intimacy get a lot of attention in relationship advice. But spiritual intimacy — sharing your faith journey, doubts, and encounters with God — may be the deepest bond of all.",
    author: "Emily & David",
    emoji: "👫",
  },
  {
    category: "Milestones",
    categoryColor: "var(--warning-700)",
    categoryBg: "var(--warning-50)",
    date: "June 20, 2026",
    readTime: "3 min read",
    title: "Celebrating Your Relationship Milestones Intentionally",
    excerpt:
      "Milestones are more than dates on a calendar. They are anchors of gratitude — opportunities to pause, reflect on God's faithfulness, and renew your commitment to each other.",
    author: "Rachel & Jonathan",
    emoji: "💏",
  },
  {
    category: "Engagement",
    categoryColor: "var(--primary-600)",
    categoryBg: "var(--primary-50)",
    date: "June 8, 2026",
    readTime: "8 min read",
    title: "Pre-Marriage Preparation: A Faith-Centered Guide",
    excerpt:
      "Getting engaged is one of life's most joyful seasons. But beneath the excitement lies an opportunity to do the important, unglamorous work of preparing your hearts and home for marriage.",
    author: "TwoBeOne Editorial",
    emoji: "💍",
  },
];

interface BlogPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export function BlogPage({ onBack, onGetStarted }: BlogPageProps) {
  const tr = useUiCopy(publicStaticMessages);
  const language = useCurrentLanguage();
  return (
    <PageShell onBack={onBack} onGetStarted={onGetStarted}>
      <PageHeader
        icon={BookOpen}
        eyebrow="TwoBeOne Blog"
        title="Stories & Wisdom for Couples"
        subtitle="Practical insights, biblical reflections, and real couple stories to strengthen your faith-centered relationship."
        iconGradientFrom="var(--primary-500)"
        iconGradientTo="var(--primary-700)"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BLOG_POSTS.map((post, idx) => (
          <article
            key={idx}
            className="rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col"
            style={{
              background: "var(--glass-surface)",
              borderColor: "var(--neutral-200)",
              boxShadow: "var(--glass-shadow)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(-3px)";
              el.style.boxShadow = "0 12px 40px rgba(244,63,94,0.12)";
              el.style.borderColor = "var(--primary-200)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(0)";
              el.style.boxShadow = "var(--glass-shadow)";
              el.style.borderColor = "var(--neutral-200)";
            }}
          >
            {/* Card top color band */}
            <div
              className="h-2 w-full"
              style={{
                background: `linear-gradient(90deg, ${post.categoryColor}, var(--primary-300))`,
              }}
            />
            <div className="p-6 flex flex-col flex-1 space-y-3">
              {/* Category + meta */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className="tbo-caption px-2.5 py-1 rounded-full"
                  style={{
                    background: post.categoryBg,
                    color: post.categoryColor,
                  }}
                >
                  {tr(post.category)}
                </span>
                <div
                  className="tbo-caption flex items-center gap-1"
                  style={{ color: "var(--glass-muted)" }}
                >
                  <Clock className="w-3 h-3" />
                  {tr('{count} min read', { count: Number.parseInt(post.readTime, 10) })}
                </div>
              </div>

              {/* Title */}
              <h2
                className="tbo-card-title "
                style={{ color: "var(--glass-foreground)" }}
              >
                {tr(post.title)}
              </h2>

              {/* Excerpt */}
              <p
                className="tbo-supporting flex-1"
                style={{ color: "var(--glass-muted)" }}
              >
                {tr(post.excerpt)}
              </p>

              {/* Author + date */}
              <div
                className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t"
                style={{ borderColor: "var(--neutral-100)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base select-none">{post.emoji}</span>
                  <span
                    className="tbo-caption "
                    style={{ color: "var(--glass-foreground)" }}
                  >
                    {tr(post.author)}
                  </span>
                </div>
                <div
                  className="tbo-caption flex items-center gap-1"
                  style={{ color: "var(--glass-muted)" }}
                >
                  <Calendar className="w-3 h-3" />
                  {formatUiDate(new Date(post.date), UI_LOCALES[language], { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Load more placeholder */}
      <div className="text-center mt-12">
        <button
          className="tbo-action inline-flex items-center gap-2 min-h-12 py-3 px-6 max-w-full rounded-xl border-2 transition-all"
          style={{
            borderColor: "var(--primary-300)",
            color: "var(--glass-accent)",
            background: "var(--accent)",
          }}
        > {tr("Load More Articles")} <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </PageShell>
  );
}

/* ─────────────────────────────────────────────────────────
   HELP CENTER PAGE
───────────────────────────────────────────────────────── */

const HELP_CATEGORIES = [
  {
    icon: Sparkles,
    title: "Getting Started",
    description: "Set up your account, connect with your partner, and start your first devotional.",
    articles: ["Creating your account", "Inviting your partner", "Your first devotional", "Setting up your profile"],
    color: "var(--primary-500)",
    bg: "var(--primary-50)",
    border: "var(--primary-200)",
  },
  {
    icon: Heart,
    title: "Features Guide",
    description: "Deep dives into devotionals, journaling, prayer boards, and conversation questions.",
    articles: ["How devotionals work", "Shared journaling guide", "Prayer board overview", "Conversation questions"],
    color: "var(--secondary-600)",
    bg: "var(--secondary-50)",
    border: "var(--secondary-200)",
  },
  {
    icon: Users,
    title: "Account & Partner",
    description: "Manage your account settings, partner connection, and notification preferences.",
    articles: ["Connecting with your partner", "Changing your password", "Notification settings", "Deleting your account"],
    color: "var(--success-700)",
    bg: "var(--success-50)",
    border: "var(--success-50)",
  },
  {
    icon: MessageSquare,
    title: "Troubleshooting",
    description: "Common issues and how to fix them quickly so you can get back to your partner.",
    articles: ["Partner sync not working", "App won't load", "Forgot my password", "Lost devotional streak"],
    color: "var(--warning-700)",
    bg: "var(--warning-50)",
    border: "var(--warning-50)",
  },
];

const POPULAR_ARTICLES = [
  "How do I connect with my partner?",
  "Can I use TwoBeOne without my partner for a while?",
  "How do streaks work?",
  "Is TwoBeOne available offline?",
  "How do I share a journal entry privately?",
  "What languages does TwoBeOne support?",
];

interface HelpCenterPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export function HelpCenterPage({ onBack, onGetStarted }: HelpCenterPageProps) {
  const tr = useUiCopy(publicStaticMessages);
  const [search, setSearch] = useState("");

  return (
    <PageShell onBack={onBack} onGetStarted={onGetStarted}>
      <PageHeader
        icon={HelpCircle}
        eyebrow="Help Center"
        title="How Can We Help?"
        subtitle="Find answers to your questions, or reach out to our team. We're here for you."
        iconGradientFrom="var(--secondary-500)"
        iconGradientTo="var(--secondary-700)"
      />

      {/* Search bar */}
      <div className="max-w-xl mx-auto mb-14 relative">
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
          style={{ color: "var(--glass-muted)" }}
        >
          <HelpCircle className="w-5 h-5" />
        </div>
        <Input
          type="text"
          placeholder={tr("Search help articles…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-13 pl-12 rounded-2xl text-base border shadow-sm"
          style={{
            borderColor: "var(--primary-200)",
            background: "var(--input-background)",
            color: "var(--glass-foreground)",
          }}
        />
      </div>

      {/* Category cards */}
      <div className="grid sm:grid-cols-2 gap-6 mb-14">
        {HELP_CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border p-6 space-y-4 transition-all duration-200"
              style={{
                background: "var(--glass-surface)",
                borderColor: "var(--neutral-200)",
                boxShadow: "var(--glass-shadow)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = cat.border;
                el.style.boxShadow = "0 8px 30px rgba(244,63,94,0.08)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--neutral-200)";
                el.style.boxShadow = "var(--glass-shadow)";
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)`,
                    boxShadow: `0 4px 12px ${cat.color}40`,
                  }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3
                    className="tbo-card-title mb-1"
                    style={{ color: "var(--glass-foreground)" }}
                  >
                    {tr(cat.title)}
                  </h3>
                  <p
                    className="tbo-supporting "
                    style={{ color: "var(--glass-muted)" }}
                  >
                    {tr(cat.description)}
                  </p>
                </div>
              </div>
              <ul className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--neutral-100)" }}>
                {cat.articles.map((article, i) => (
                  <li key={i}>
                    <button
                      className="tbo-action w-full text-left py-1.5 flex items-center gap-2 transition-colors group"
                      style={{ color: "var(--glass-muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = cat.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--neutral-600)")}
                    >
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ background: cat.color }}
                      />
                      {tr(article)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Popular articles */}
      <div className="max-w-2xl mx-auto">
        <h2
          className="tbo-section-title mb-6 text-center"
          style={{ color: "var(--glass-foreground)" }}
        > {tr("Popular Articles")} </h2>
        <div className="space-y-2.5">
          {POPULAR_ARTICLES.map((article, idx) => (
            <button
              key={idx}
              className="w-full text-left flex flex-wrap items-center justify-between gap-2 p-4 rounded-xl border transition-all duration-150"
              style={{
                background: "var(--glass-surface)",
                borderColor: "var(--neutral-200)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--primary-300)";
                el.style.background = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--neutral-200)";
                el.style.background = "var(--glass-surface)";
              }}
            >
              <span
                className="tbo-supporting "
                style={{ color: "var(--glass-foreground)" }}
              >
                {tr(article)}
              </span>
              <ExternalLink
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "var(--primary-500)" }}
              />
            </button>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

/* ─────────────────────────────────────────────────────────
   COMMUNITY PAGE
───────────────────────────────────────────────────────── */

const COMMUNITY_HIGHLIGHTS = [
  {
    emoji: "🙏",
    title: "Prayer Circles",
    description: "Join small groups of couples who pray for each other's relationships and families every week.",
    members: "2,400+ members",
  },
  {
    emoji: "📖",
    title: "Bible Study Groups",
    description: "Deepen your understanding of Scripture together with like-minded couples in guided studies.",
    members: "1,800+ members",
  },
  {
    emoji: "💬",
    title: "Couples Forum",
    description: "A safe, moderated space to ask questions, share wins, and encourage other couples on their journey.",
    members: "5,200+ members",
  },
  {
    emoji: "🌍",
    title: "Global Connections",
    description: "Connect with Christian couples from over 40 countries who are growing in faith together.",
    members: "10,000+ couples",
  },
];

const COMMUNITY_VALUES = [
  { icon: CheckCircle2, text: "Moderated by Christian leaders" },
  { icon: CheckCircle2, text: "Safe, private, and ad-free" },
  { icon: CheckCircle2, text: "Rooted in biblical principles" },
  { icon: CheckCircle2, text: "Welcoming to all relationship stages" },
];

interface CommunityPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export function CommunityPage({ onBack, onGetStarted }: CommunityPageProps) {
  const tr = useUiCopy(publicStaticMessages);
  return (
    <PageShell onBack={onBack} onGetStarted={onGetStarted}>
      <PageHeader
        icon={Users}
        eyebrow="Community"
        title="You're Not Alone on This Journey"
        subtitle="Join thousands of Christian couples growing in faith together. Share, encourage, and be encouraged."
        iconGradientFrom="var(--secondary-500)"
        iconGradientTo="var(--primary-500)"
      />

      {/* Community highlights */}
      <div className="grid sm:grid-cols-2 gap-6 mb-16">
        {COMMUNITY_HIGHLIGHTS.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl border p-6 space-y-3 transition-all duration-200"
            style={{
              background: "var(--glass-surface)",
              borderColor: "var(--neutral-200)",
              boxShadow: "var(--glass-shadow)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(-2px)";
              el.style.borderColor = "var(--primary-200)";
              el.style.boxShadow = "0 12px 40px rgba(244,63,94,0.10)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(0)";
              el.style.borderColor = "var(--neutral-200)";
              el.style.boxShadow = "var(--glass-shadow)";
            }}
          >
            <div className="text-4xl select-none">{item.emoji}</div>
            <h3
              className="tbo-card-title "
              style={{ color: "var(--glass-foreground)" }}
            >
              {tr(item.title)}
            </h3>
            <p
              className="tbo-supporting "
              style={{ color: "var(--glass-muted)" }}
            >
              {tr(item.description)}
            </p>
            <span
              className="tbo-caption inline-block px-3 py-1 rounded-full"
              style={{
                background: "var(--accent)",
                color: "var(--glass-accent)",
              }}
            >
              {tr(item.members.endsWith('couples') ? '{count}+ couples' : '{count}+ members', { count: item.members.split('+')[0] })}
            </span>
          </div>
        ))}
      </div>

      {/* Community values + CTA */}
      <div
        className="max-w-3xl mx-auto rounded-3xl p-6 sm:p-10 text-center border space-y-6"
        style={{
          background:
            "var(--glass-journey-surface)",
          borderColor: "var(--primary-200)",
          boxShadow: "var(--glass-shadow)",
        }}
      >
        <h2
          className="tbo-section-title "
          style={{ color: "var(--glass-foreground)" }}
        > {tr("A Community Built on Christ")} </h2>
        <p
          className="tbo-body max-w-xl mx-auto"
          style={{ color: "var(--glass-muted)" }}
        > {tr("Our community is carefully maintained to be a safe, encouraging, and biblical space. Every group is led by experienced Christian couples who understand what it means to walk in covenant love.")} </p>
        <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto">
          {COMMUNITY_VALUES.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div
                key={idx}
                className="tbo-supporting flex items-center gap-2"
                style={{ color: "var(--glass-foreground)" }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "var(--success-500)" }}
                />
                {tr(val.text)}
              </div>
            );
          })}
        </div>
        <button
          onClick={onGetStarted}
          className="tbo-action inline-flex items-center gap-2 min-h-12 py-3 px-6 max-w-full rounded-xl text-white transition-all"
          style={{
            background:
              "var(--glass-primary-paint)",
            boxShadow: "0 8px 24px rgba(244,63,94,0.35)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 12px 32px rgba(244,63,94,0.50)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(244,63,94,0.35)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        > {tr("Join the Community Free")} <Heart className="w-4 h-4 fill-white text-white" />
        </button>
      </div>
    </PageShell>
  );
}

/* ─────────────────────────────────────────────────────────
   CONTACT US PAGE
───────────────────────────────────────────────────────── */

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: "Email Support",
    description: "twobeoneapp@gmail.com",
    detail: "We reply within 24 hours",
    color: "var(--primary-500)",
    colorBg: "var(--primary-50)",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Chat with our team",
    detail: "Available Mon–Fri, 9am–6pm ET",
    color: "var(--secondary-600)",
    colorBg: "var(--secondary-50)",
  },
  {
    icon: MapPin,
    title: "Our Location",
    description: "Abu Dhabi, UAE",
    detail: "Serving couples worldwide",
    color: "var(--success-700)",
    colorBg: "var(--success-50)",
  },
];

interface ContactPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export function ContactPage({ onBack, onGetStarted }: ContactPageProps) {
  const tr = useUiCopy(publicStaticMessages);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(tr("Message sent! We'll get back to you within 24 hours. 💕"));
    setForm({ name: "", email: "", subject: "", message: "" });
    setSending(false);
  };

  return (
    <PageShell onBack={onBack} onGetStarted={onGetStarted}>
      <PageHeader
        icon={Mail}
        eyebrow="Contact Us"
        title="We'd Love to Hear from You"
        subtitle="Have a question, feedback, or just want to say hi? Our team is here and happy to help."
        iconGradientFrom="var(--primary-400)"
        iconGradientTo="var(--secondary-600)"
      />

      <div className="grid lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
        {/* Left — contact methods */}
        <div className="lg:col-span-2 space-y-5">
          <h2
            className="tbo-section-title mb-6"
            style={{ color: "var(--glass-foreground)" }}
          > {tr("Get in Touch")} </h2>
          {CONTACT_METHODS.map((method, idx) => {
            const Icon = method.icon;
            return (
              <div
                key={idx}
                className="flex gap-4 items-start p-4 rounded-2xl border transition-all duration-150"
                style={{
                  background: "var(--glass-surface)",
                  borderColor: "var(--neutral-200)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = method.color;
                  el.style.background = method.colorBg;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "var(--neutral-200)";
                  el.style.background = "var(--glass-surface)";
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${method.color}, ${method.color}cc)`,
                  }}
                >
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p
                    className="tbo-label "
                    style={{ color: "var(--glass-foreground)" }}
                  >
                    {tr(method.title)}
                  </p>
                  <p
                    className="tbo-label "
                    style={{ color: method.color }}
                  >
                    {tr(method.description)}
                  </p>
                  <p
                    className="tbo-caption mt-0.5"
                    style={{ color: "var(--glass-muted)" }}
                  >
                    {tr(method.detail)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right — contact form */}
        <div className="lg:col-span-3">
          <div
            className="rounded-2xl border p-8"
            style={{
              background: "var(--glass-raised-surface)",
              borderColor: "var(--neutral-200)",
              boxShadow: "var(--glass-shadow-raised)",
            }}
          >
            <h2
              className="tbo-section-title mb-6"
              style={{ color: "var(--glass-foreground)" }}
            > {tr("Send a Message")} </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    className="tbo-label block"
                    style={{ color: "var(--glass-muted)" }}
                  > {tr("Full Name *")} </label>
                  <Input
                    type="text"
                    placeholder={tr("Your name")}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="h-11 rounded-xl text-sm border"
                    style={{
                      borderColor: "var(--neutral-200)",
                      background: "var(--input-background)",
                      color: "var(--glass-foreground)",
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="tbo-label block"
                    style={{ color: "var(--glass-muted)" }}
                  > {tr("Email Address *")} </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="h-11 rounded-xl text-sm border"
                    style={{
                      borderColor: "var(--neutral-200)",
                      background: "var(--input-background)",
                      color: "var(--glass-foreground)",
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label
                  className="tbo-label block"
                  style={{ color: "var(--glass-muted)" }}
                > {tr("Subject")} </label>
                <Input
                  type="text"
                  placeholder={tr("What's this about?")}
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="h-11 rounded-xl text-sm border"
                  style={{
                    borderColor: "var(--neutral-200)",
                    background: "var(--input-background)",
                    color: "var(--glass-foreground)",
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="tbo-label block"
                  style={{ color: "var(--glass-muted)" }}
                > {tr("Message *")} </label>
                <textarea
                  placeholder={tr("Tell us how we can help…")}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={5}
                  className="w-full rounded-xl text-sm border p-3 resize-none outline-none transition-colors"
                  style={{
                    borderColor: "var(--neutral-200)",
                    background: "var(--input-background)",
                    color: "var(--glass-foreground)",
                    fontFamily: "inherit",
                    lineHeight: 1.6,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary-400)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--neutral-200)")}
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="tbo-action w-full min-h-12 py-3 rounded-xl text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  background:
                    "var(--glass-primary-paint)",
                  boxShadow: "0 8px 24px rgba(244,63,94,0.35)",
                }}
              >
                {tr(sending ? "Sending…" : "Send Message")}
                {sending ? <LoadingMark /> : <Send className="w-4 h-4 flex-shrink-0" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/* ─────────────────────────────────────────────────────────
   COOKIE POLICY PAGE
───────────────────────────────────────────────────────── */

const COOKIE_SECTIONS = [
  {
    title: "What Are Cookies?",
    content:
      "Cookies are small text files placed on your device when you visit TwoBeOne. They help us remember your preferences, keep you signed in, and understand how you use the app — so we can continue to improve your experience.",
  },
  {
    title: "Essential Cookies",
    content:
      "These cookies are strictly necessary for TwoBeOne to function. They manage your login session, keep your partner connection active, and maintain security. You cannot opt out of essential cookies without losing core functionality.",
    examples: ["Session authentication token", "Partner connection state", "Security CSRF protection", "Language preference"],
  },
  {
    title: "Analytics Cookies",
    content:
      "We use privacy-respecting analytics to understand which features are most helpful and where couples encounter difficulty. All data is aggregated and anonymized — we never track individual users for advertising purposes.",
    examples: ["Feature usage frequency", "App performance metrics", "Error reporting", "Aggregate engagement signals"],
  },
  {
    title: "Preference Cookies",
    content:
      "These cookies remember your choices so you don't have to reconfigure the app every visit — things like your language setting, notification preferences, and devotional reading pace.",
    examples: ["Language selection", "Notification settings", "Theme preferences", "Devotional progress bookmarks"],
  },
  {
    title: "What We Don't Use Cookies For",
    content:
      "We do not sell cookie data to third parties. We do not use tracking cookies for targeted advertising. We do not share your activity data with advertisers. TwoBeOne is ad-free by design.",
  },
  {
    title: "Managing Your Cookies",
    content:
      "You can control and delete cookies through your browser settings at any time. Please note that disabling essential cookies will prevent you from logging in. For preference-only cookies, you can manage settings directly in your TwoBeOne profile under Settings → Privacy.",
  },
  {
    title: "Contact Us",
    content:
      "If you have any questions about our use of cookies or this policy, please email us at privacy@twobeone.app. We're committed to transparency and will respond to all inquiries within 48 hours.",
  },
];

interface CookiePolicyPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export function CookiePolicyPage({ onBack, onGetStarted }: CookiePolicyPageProps) {
  const tr = useUiCopy(publicStaticMessages);
  const [openSection, setOpenSection] = useState<number | null>(0);

  return (
    <PageShell onBack={onBack} onGetStarted={onGetStarted}>
      <PageHeader
        icon={Cookie}
        eyebrow="Cookie Policy"
        title="Our Cookie Policy"
        subtitle="We believe in full transparency. Here's exactly how and why TwoBeOne uses cookies — no jargon, no surprises."
        iconGradientFrom="var(--warning-500)"
        iconGradientTo="var(--warning-700)"
      />

      {/* Last updated badge */}
      <div className="max-w-3xl mx-auto mb-8 flex flex-wrap items-center justify-between gap-2">
        <span
          className="tbo-caption inline-flex items-center gap-1.5"
          style={{ color: "var(--glass-muted)" }}
        >
          <Calendar className="w-3.5 h-3.5" /> {tr("Last updated: August 1, 2026")} </span>
        <span
          className="tbo-caption inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
          style={{
            background: "var(--success-50)",
            color: "var(--success-700)",
            borderColor: "var(--success-50)",
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> {tr("GDPR Compliant")} </span>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {COOKIE_SECTIONS.map((section, idx) => {
          const isOpen = openSection === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border overflow-hidden transition-all duration-200"
              style={{
                background: "var(--glass-raised-surface)",
                borderColor: isOpen ? "var(--warning-500)" : "var(--neutral-200)",
                boxShadow: isOpen
                  ? "0 8px 32px rgba(245,158,11,0.12)"
                  : "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <button
                className="w-full flex justify-between items-center px-6 py-5 text-left gap-4"
                onClick={() => setOpenSection(isOpen ? null : idx)}
                aria-expanded={isOpen}
              >
                <h3
                  className="tbo-card-title "
                  style={{ color: "var(--glass-foreground)" }}
                >
                  {tr(section.title)}
                </h3>
                <ChevronDown
                  className="w-5 h-5 flex-shrink-0 transition-transform duration-300"
                  style={{
                    color: isOpen ? "var(--warning-500)" : "var(--neutral-400)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  display: isOpen ? "block" : "none",
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div className="px-6 pb-6">
                  <div
                    className="pl-4 border-l-2 space-y-3"
                    style={{ borderColor: "var(--warning-400)" }}
                  >
                    <p
                      className="tbo-supporting "
                      style={{ color: "var(--glass-muted)" }}
                    >
                      {tr(section.content)}
                    </p>
                    {section.examples && (
                      <ul className="space-y-1.5">
                        {section.examples.map((ex, i) => (
                          <li
                            key={i}
                            className="tbo-supporting flex items-center gap-2"
                            style={{ color: "var(--glass-muted)" }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: "var(--warning-500)" }}
                            />
                            {tr(ex)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}

/* ─────────────────────────────────────────────────────────
   PRIVACY POLICY WRAPPER PAGE
───────────────────────────────────────────────────────── */

interface PrivacyPolicyPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export function PrivacyPolicyPage({ onBack, onGetStarted }: PrivacyPolicyPageProps) {
  return (
    <PageShell onBack={onBack} onGetStarted={onGetStarted}>
      <div className="max-w-4xl mx-auto">
        <PrivacyPolicy />
      </div>
    </PageShell>
  );
}

/* ─────────────────────────────────────────────────────────
   TERMS OF SERVICE WRAPPER PAGE
───────────────────────────────────────────────────────── */

interface TermsOfServicePageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export function TermsOfServicePage({ onBack, onGetStarted }: TermsOfServicePageProps) {
  return (
    <PageShell onBack={onBack} onGetStarted={onGetStarted}>
      <div className="max-w-4xl mx-auto">
        <TermsOfService />
      </div>
    </PageShell>
  );
}
