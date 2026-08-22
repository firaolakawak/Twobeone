import { useState } from "react";
import {
  Heart,
  ArrowLeft,
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
  return (
    <div
      className="min-h-screen antialiased"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Sticky nav */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "var(--primary-100)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Back + logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: "var(--neutral-500)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-600)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--neutral-500)")}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div
              className="w-px h-5"
              style={{ background: "var(--neutral-200)" }}
            />
            <div className="flex items-center gap-2 select-none">
              <Heart
                className="w-5 h-5 fill-current"
                style={{ color: "var(--primary-500)" }}
              />
              <span
                className="text-base font-bold bg-clip-text text-transparent"
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
          <button
            onClick={onGetStarted}
            className="h-9 px-5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background:
                "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
              boxShadow: "0 4px 15px rgba(244,63,94,0.30)",
            }}
          >
            Get Started
          </button>
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
          background: "var(--neutral-900)",
          borderColor: "var(--neutral-800)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart
              className="w-4 h-4 fill-current"
              style={{ color: "var(--primary-500)" }}
            />
            <span className="text-sm font-bold text-white">TwoBeOne</span>
          </div>
          <p className="text-xs" style={{ color: "var(--neutral-500)" }}>
            © {new Date().getFullYear()} TwoBeOne. All rights reserved.
          </p>
          <button
            onClick={onGetStarted}
            className="text-xs font-semibold transition-colors"
            style={{ color: "var(--primary-400)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-300)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--primary-400)")}
          >
            Join Free →
          </button>
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
        className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border"
        style={{
          background: "var(--primary-50)",
          color: "var(--primary-700)",
          borderColor: "var(--primary-200)",
        }}
      >
        {eyebrow}
      </span>
      <h1
        className="text-4xl md:text-5xl font-bold tracking-tight"
        style={{ color: "var(--neutral-900)" }}
      >
        {title}
      </h1>
      <p
        className="text-lg leading-relaxed"
        style={{ color: "var(--neutral-600)" }}
      >
        {subtitle}
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
              background: "rgba(255,255,255,0.8)",
              borderColor: "var(--neutral-200)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
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
              el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
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
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: post.categoryBg,
                    color: post.categoryColor,
                  }}
                >
                  {post.category}
                </span>
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "var(--neutral-400)" }}
                >
                  <Clock className="w-3 h-3" />
                  {post.readTime}
                </div>
              </div>

              {/* Title */}
              <h2
                className="text-base font-bold leading-snug"
                style={{ color: "var(--neutral-900)" }}
              >
                {post.title}
              </h2>

              {/* Excerpt */}
              <p
                className="text-sm leading-relaxed flex-1"
                style={{ color: "var(--neutral-600)" }}
              >
                {post.excerpt}
              </p>

              {/* Author + date */}
              <div
                className="flex items-center justify-between pt-3 border-t"
                style={{ borderColor: "var(--neutral-100)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base select-none">{post.emoji}</span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--neutral-700)" }}
                  >
                    {post.author}
                  </span>
                </div>
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "var(--neutral-400)" }}
                >
                  <Calendar className="w-3 h-3" />
                  {post.date}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Load more placeholder */}
      <div className="text-center mt-12">
        <button
          className="inline-flex items-center gap-2 h-12 px-8 rounded-xl text-sm font-bold border-2 transition-all"
          style={{
            borderColor: "var(--primary-300)",
            color: "var(--primary-700)",
            background: "var(--primary-50)",
          }}
        >
          Load More Articles
          <ExternalLink className="w-4 h-4" />
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
          style={{ color: "var(--neutral-400)" }}
        >
          <HelpCircle className="w-5 h-5" />
        </div>
        <Input
          type="text"
          placeholder="Search help articles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-13 pl-12 rounded-2xl text-base border shadow-sm"
          style={{
            borderColor: "var(--primary-200)",
            background: "white",
            color: "var(--neutral-900)",
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
                background: "rgba(255,255,255,0.8)",
                borderColor: "var(--neutral-200)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = cat.border;
                el.style.boxShadow = "0 8px 30px rgba(244,63,94,0.08)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--neutral-200)";
                el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
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
                    className="text-base font-bold mb-1"
                    style={{ color: "var(--neutral-900)" }}
                  >
                    {cat.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--neutral-600)" }}
                  >
                    {cat.description}
                  </p>
                </div>
              </div>
              <ul className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--neutral-100)" }}>
                {cat.articles.map((article, i) => (
                  <li key={i}>
                    <button
                      className="w-full text-left text-sm py-1.5 flex items-center gap-2 transition-colors group"
                      style={{ color: "var(--neutral-600)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = cat.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--neutral-600)")}
                    >
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ background: cat.color }}
                      />
                      {article}
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
          className="text-xl font-bold mb-6 text-center"
          style={{ color: "var(--neutral-900)" }}
        >
          Popular Articles
        </h2>
        <div className="space-y-2.5">
          {POPULAR_ARTICLES.map((article, idx) => (
            <button
              key={idx}
              className="w-full text-left flex items-center justify-between p-4 rounded-xl border transition-all duration-150"
              style={{
                background: "rgba(255,255,255,0.8)",
                borderColor: "var(--neutral-200)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--primary-300)";
                el.style.background = "var(--primary-50)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--neutral-200)";
                el.style.background = "rgba(255,255,255,0.8)";
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: "var(--neutral-800)" }}
              >
                {article}
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
              background: "rgba(255,255,255,0.8)",
              borderColor: "var(--neutral-200)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
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
              el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
            }}
          >
            <div className="text-4xl select-none">{item.emoji}</div>
            <h3
              className="text-lg font-bold"
              style={{ color: "var(--neutral-900)" }}
            >
              {item.title}
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--neutral-600)" }}
            >
              {item.description}
            </p>
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: "var(--primary-50)",
                color: "var(--primary-700)",
              }}
            >
              {item.members}
            </span>
          </div>
        ))}
      </div>

      {/* Community values + CTA */}
      <div
        className="max-w-3xl mx-auto rounded-3xl p-10 text-center border space-y-6"
        style={{
          background:
            "linear-gradient(135deg, var(--primary-50) 0%, rgba(255,255,255,0.9) 100%)",
          borderColor: "var(--primary-200)",
          boxShadow: "0 20px 60px rgba(244,63,94,0.08)",
        }}
      >
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--neutral-900)" }}
        >
          A Community Built on Christ
        </h2>
        <p
          className="text-base leading-relaxed max-w-xl mx-auto"
          style={{ color: "var(--neutral-600)" }}
        >
          Our community is carefully maintained to be a safe, encouraging, and
          biblical space. Every group is led by experienced Christian couples who
          understand what it means to walk in covenant love.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto">
          {COMMUNITY_VALUES.map((val, idx) => {
            const Icon = val.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: "var(--neutral-700)" }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "var(--success-500)" }}
                />
                {val.text}
              </div>
            );
          })}
        </div>
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 h-12 px-8 rounded-xl text-sm font-bold text-white transition-all"
          style={{
            background:
              "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
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
        >
          Join the Community Free
          <Heart className="w-4 h-4 fill-white text-white" />
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
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Message sent! We'll get back to you within 24 hours. 💕");
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
            className="text-xl font-bold mb-6"
            style={{ color: "var(--neutral-900)" }}
          >
            Get in Touch
          </h2>
          {CONTACT_METHODS.map((method, idx) => {
            const Icon = method.icon;
            return (
              <div
                key={idx}
                className="flex gap-4 items-start p-4 rounded-2xl border transition-all duration-150"
                style={{
                  background: "rgba(255,255,255,0.8)",
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
                  el.style.background = "rgba(255,255,255,0.8)";
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
                    className="text-sm font-bold"
                    style={{ color: "var(--neutral-900)" }}
                  >
                    {method.title}
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: method.color }}
                  >
                    {method.description}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--neutral-500)" }}
                  >
                    {method.detail}
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
              background: "rgba(255,255,255,0.85)",
              borderColor: "var(--neutral-200)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
            }}
          >
            <h2
              className="text-xl font-bold mb-6"
              style={{ color: "var(--neutral-900)" }}
            >
              Send a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--neutral-500)" }}
                  >
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="h-11 rounded-xl text-sm border"
                    style={{
                      borderColor: "var(--neutral-200)",
                      background: "white",
                      color: "var(--neutral-900)",
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--neutral-500)" }}
                  >
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="h-11 rounded-xl text-sm border"
                    style={{
                      borderColor: "var(--neutral-200)",
                      background: "white",
                      color: "var(--neutral-900)",
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--neutral-500)" }}
                >
                  Subject
                </label>
                <Input
                  type="text"
                  placeholder="What's this about?"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="h-11 rounded-xl text-sm border"
                  style={{
                    borderColor: "var(--neutral-200)",
                    background: "white",
                    color: "var(--neutral-900)",
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--neutral-500)" }}
                >
                  Message *
                </label>
                <textarea
                  placeholder="Tell us how we can help…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={5}
                  className="w-full rounded-xl text-sm border p-3 resize-none outline-none transition-colors"
                  style={{
                    borderColor: "var(--neutral-200)",
                    background: "white",
                    color: "var(--neutral-900)",
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
                className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary-500), var(--primary-600))",
                  boxShadow: "0 8px 24px rgba(244,63,94,0.35)",
                }}
              >
                {sending ? "Sending…" : "Send Message"}
                <Send className="w-4 h-4" />
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
      <div className="max-w-3xl mx-auto mb-8 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--neutral-500)" }}
        >
          <Calendar className="w-3.5 h-3.5" />
          Last updated: August 1, 2026
        </span>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
          style={{
            background: "var(--success-50)",
            color: "var(--success-700)",
            borderColor: "var(--success-50)",
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          GDPR Compliant
        </span>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {COOKIE_SECTIONS.map((section, idx) => {
          const isOpen = openSection === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border overflow-hidden transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.85)",
                borderColor: isOpen ? "var(--warning-500)" : "var(--neutral-200)",
                boxShadow: isOpen
                  ? "0 8px 32px rgba(245,158,11,0.12)"
                  : "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <button
                className="w-full flex justify-between items-center px-6 py-5 text-left gap-4"
                onClick={() => setOpenSection(isOpen ? null : idx)}
              >
                <h3
                  className="text-sm font-bold"
                  style={{ color: "var(--neutral-900)" }}
                >
                  {section.title}
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
                  maxHeight: isOpen ? "500px" : "0px",
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div className="px-6 pb-6">
                  <div
                    className="pl-4 border-l-2 space-y-3"
                    style={{ borderColor: "var(--warning-400)" }}
                  >
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--neutral-600)" }}
                    >
                      {section.content}
                    </p>
                    {section.examples && (
                      <ul className="space-y-1.5">
                        {section.examples.map((ex, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm"
                            style={{ color: "var(--neutral-600)" }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: "var(--warning-500)" }}
                            />
                            {ex}
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
        <PrivacyPolicy language="en" />
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
        <TermsOfService language="en" />
      </div>
    </PageShell>
  );
}
