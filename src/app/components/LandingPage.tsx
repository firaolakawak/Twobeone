import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  Globe2,
  Heart,
  Link2,
  Loader2,
  Mail,
  Menu,
  MessageCircle,
  NotebookPen,
  Plus,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  STATIC_PAGE_PATHS,
  staticPageFromPath,
  type PublicStaticPage,
  type StaticPage,
} from "../utils/publicRoutes";
import { AppLaunchPreview } from "./landing/AppLaunchPreview";
import { StoreDownloadButtons } from "./landing/StoreDownloadButtons";
import {
  BlogPage,
  HelpCenterPage,
  CommunityPage,
  ContactPage,
  CookiePolicyPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
} from "./StaticPages";
import "../styles/launch-landing.css";

const NAV_LINKS = [
  { label: "The app", id: "features" },
  { label: "How it works", id: "how-it-works" },
  { label: "Our heart", id: "why-us" },
  { label: "FAQs", id: "faq" },
];
const FAQS = [
  {
    question: "Who is TwoBeOne for?",
    answer:
      "TwoBeOne is made for Christian couples who want to be intentional about their relationship. Whether you’re dating, preparing for marriage, or have been married for years, you can build a shared rhythm of faith and connection.",
  },
  {
    question: "How do I connect with my partner?",
    answer:
      "Create your account, then share your unique invite code with your partner. Once they join and connect, you can share prayers, reflections, conversations, and milestones in your couple space.",
  },
  {
    question: "Is TwoBeOne free to use?",
    answer:
      "Yes, you can get started for free and explore daily devotionals, shared prayer, journaling, and conversation questions with your partner.",
  },
  {
    question: "Can I use it on my phone?",
    answer:
      "Yes. Open TwoBeOne in your browser or get the Android app on Google Play. On iPhone and iPad, use the installation guide to add TwoBeOne to your Home Screen for easy access.",
  },
  {
    question: "Do we need to be in the same place?",
    answer:
      "You can grow together wherever you are. Each partner uses their own account, so you can share a prayer, answer a question, or leave a reflection even when your schedules or time zones are different.",
  },
  {
    question: "What can my partner see?",
    answer:
      "Your couple space includes the content you choose to share. Journals and prayers have sharing controls, so you can keep personal reflections private or share them with your partner. Read our privacy policy for more about how information is handled.",
  },
];

function Brand() {
  return (
    <span className="ll-brand">
      <span className="ll-brand-mark" aria-hidden="true">
        <Heart />
        <Heart />
      </span>
      <span>
        TwoBeOne<span className="ll-brand-dot">.</span>
      </span>
    </span>
  );
}

interface LandingPageProps {
  onGetStarted: () => void;
  initialPage?: StaticPage;
}

export function LandingPage({
  onGetStarted,
  initialPage = null,
}: LandingPageProps) {
  const { t } = useLanguage();
  const [activePage, setActivePage] = useState<StaticPage>(initialPage);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterError, setNewsletterError] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setActivePage(staticPageFromPath(window.location.pathname));
      setMenuOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  useEffect(() => {
    setActivePage(initialPage);
  }, [initialPage]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 901px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [menuOpen]);

  const scrollTo = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    setMenuOpen(false);
    const section = document.getElementById(id);
    section?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    section?.focus({ preventScroll: true });
  };
  const navigate = (
    event: MouseEvent<HTMLAnchorElement>,
    page: PublicStaticPage,
  ) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    setActivePage(page);
    setMenuOpen(false);
    window.history.pushState({}, "", STATIC_PAGE_PATHS[page]);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const handleNewsletterSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setNewsletterMessage("");
    setNewsletterError(false);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/newsletter/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            apikey: publicAnonKey,
          },
          body: JSON.stringify({ email: email.trim() }),
        },
      );
      if (!response.ok) throw new Error("Subscription failed");
      setNewsletterMessage(
        "You’re almost in! Check your inbox to confirm your subscription.",
      );
      setEmail("");
    } catch {
      setNewsletterError(true);
      setNewsletterMessage(
        "We couldn’t subscribe you just now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const openAppleInstallGuide = () =>
    window.dispatchEvent(
      new CustomEvent("twobeone:open-install", { detail: { platform: "ios" } }),
    );
  const sharedPageProps = {
    onBack: () => {
      setActivePage(null);
      if (staticPageFromPath(window.location.pathname))
        window.history.pushState({}, "", "/");
      window.scrollTo({ top: 0, behavior: "instant" });
    },
    onGetStarted,
  };
  if (activePage === "blog") return <BlogPage {...sharedPageProps} />;
  if (activePage === "help-center")
    return <HelpCenterPage {...sharedPageProps} />;
  if (activePage === "community") return <CommunityPage {...sharedPageProps} />;
  if (activePage === "contact") return <ContactPage {...sharedPageProps} />;
  if (activePage === "privacy-policy")
    return <PrivacyPolicyPage {...sharedPageProps} />;
  if (activePage === "terms-of-service")
    return <TermsOfServicePage {...sharedPageProps} />;
  if (activePage === "cookie-policy")
    return <CookiePolicyPage {...sharedPageProps} />;

  return (
    <div className="launch-landing">
      <a className="ll-skip" href="#main-content">
        Skip to content
      </a>
      <div className="ll-announcement">
        <span className="ll-announcement-dot" /> A new chapter for your
        relationship.
        <a href="#download" onClick={(event) => scrollTo(event, "download")}>
          Meet TwoBeOne <ArrowUpRight size={13} aria-hidden="true" />
        </a>
      </div>
      <header className="ll-header">
        <nav className="ll-container ll-nav" aria-label="Main navigation">
          <a className="ll-home" href="/" aria-label="TwoBeOne home">
            <Brand />
          </a>
          <div className="ll-desktop-links">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(event) => scrollTo(event, link.id)}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="ll-nav-actions">
            <button className="ll-signin" onClick={onGetStarted}>
              {t.auth.signIn}
            </button>
            <button
              className="ll-button ll-button--small"
              onClick={onGetStarted}
            >
              Get started <ArrowUpRight size={16} aria-hidden="true" />
            </button>
            <button
              ref={menuButton}
              className="ll-menu-toggle"
              type="button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
          {menuOpen && (
            <div id="landing-mobile-menu" className="ll-mobile-menu">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(event) => scrollTo(event, link.id)}
                >
                  {link.label}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              ))}
              <button onClick={onGetStarted}>
                Sign in to your account{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section
          className="ll-container ll-hero"
          aria-labelledby="landing-title"
        >
          <div className="ll-hero-copy">
            <div className="ll-eyebrow">
              <span /> A LITTLE FAITH. A LITTLE TIME. A DEEPER LOVE.
            </div>
            <h1 id="landing-title">
              Love is a journey.
              <br />
              Grow <em>together.</em>
            </h1>
            <p className="ll-hero-description">
              Make room for what matters. A shared space for you and your
              partner to connect, pray, and build a life rooted in faith.
            </p>
            <StoreDownloadButtons onInstallIOS={openAppleInstallGuide} />
            <div className="ll-hero-actions ll-hero-actions--web">
              <button className="ll-text-link" onClick={onGetStarted}>
                Open the web app <ArrowUpRight size={16} aria-hidden="true" />
              </button>
              <a
                className="ll-text-link"
                href="#features"
                onClick={(event) => scrollTo(event, "features")}
              >
                <span className="ll-play-icon">
                  <ArrowDown size={16} aria-hidden="true" />
                </span>{" "}
                Explore the app
              </a>
            </div>
            <div className="ll-hero-notes">
              <span>
                <Check size={14} aria-hidden="true" /> Free to get started
              </span>
              <span>
                <Check size={14} aria-hidden="true" /> Made for the two of you
              </span>
            </div>
            <div className="ll-hero-bottom">
              <span className="ll-mini-hearts" aria-hidden="true">
                <Heart />
                <Heart />
                <Heart />
              </span>
              <p>
                For the first chapter.
                <br />
                <strong>And every chapter after.</strong>
              </p>
              <span className="ll-hero-spark" aria-hidden="true">
                <Sparkles />
              </span>
            </div>
          </div>
          <AppLaunchPreview onGetStarted={onGetStarted} />
        </section>
        <div className="ll-beliefs">
          <div className="ll-container ll-beliefs-inner">
            <span>
              Small moments. <em>Lasting connection.</em>
            </span>
            <span>
              <BookOpen />
              Rooted in Scripture
            </span>
            <span>
              <Heart />
              Designed for two
            </span>
            <span>
              <Globe2 />
              Together, wherever you are
            </span>
          </div>
        </div>
        <section
          className="ll-container ll-section"
          id="features"
          tabIndex={-1}
          aria-labelledby="features-title"
        >
          <div className="ll-section-top">
            <div>
              <p className="ll-eyebrow">YOUR EVERYDAY, A LITTLE CLOSER</p>
              <h2 id="features-title">
                Good things grow
                <br />
                with <em>small daily habits.</em>
              </h2>
            </div>
            <p>
              Less scrolling past each other.
              <br />
              More showing up for each other.
              <br />
              Make a little space for the two of you.
            </p>
          </div>
          <div className="ll-feature-grid">
            <article className="ll-feature ll-feature--pink">
              <div
                className="ll-feature-art ll-devotion-art"
                aria-hidden="true"
              >
                <div className="ll-paper ll-paper--back" />
                <div className="ll-paper">
                  <BookOpen size={23} />
                  <small>A MOMENT IN THE WORD</small>
                  <span>
                    Love is patient.
                    <br />
                    Love is kind.
                  </span>
                  <i />
                  <small>1 CORINTHIANS 13:4</small>
                </div>
                <span className="ll-art-spark">✳</span>
              </div>
              <div className="ll-feature-copy">
                <span className="ll-feature-label">01 / GROW IN FAITH</span>
                <h3>
                  One devotion.
                  <br />
                  Two open hearts.
                </h3>
                <p>
                  Bring Scripture into your everyday with devotionals that
                  invite you to reflect and grow together.
                </p>
                <button
                  onClick={onGetStarted}
                  aria-label="Explore daily devotionals"
                >
                  <ArrowUpRight size={20} />
                </button>
              </div>
            </article>
            <article className="ll-feature ll-feature--blush">
              <div
                className="ll-feature-art ll-conversation-art"
                aria-hidden="true"
              >
                <span className="ll-chat-bubble">
                  Let’s go a little deeper. <Heart size={14} />
                </span>
                <div className="ll-question-card">
                  <MessageCircle size={21} />
                  <small>TONIGHT’S CONVERSATION</small>
                  <span>
                    What makes you feel
                    <br />
                    most loved by me?
                  </span>
                  <div>
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
              <div className="ll-feature-copy">
                <span className="ll-feature-label">
                  02 / REALLY KNOW EACH OTHER
                </span>
                <h3>
                  Go beyond
                  <br />
                  “How was your day?”
                </h3>
                <p>
                  Discover thoughtful questions that spark honest conversations,
                  new perspectives, and deeper connection.
                </p>
                <button
                  onClick={onGetStarted}
                  aria-label="Explore conversation questions"
                >
                  <ArrowUpRight size={20} />
                </button>
              </div>
            </article>
            <article className="ll-feature ll-feature--lilac">
              <div className="ll-feature-art ll-prayer-art" aria-hidden="true">
                <div className="ll-prayer-orbit">
                  <span>A</span>
                  <span>J</span>
                  <i>
                    <Heart size={21} />
                  </i>
                </div>
                <div className="ll-prayer-note">
                  <span>
                    <Check size={13} />
                  </span>{" "}
                  A prayer shared. A heart held.
                </div>
              </div>
              <div className="ll-feature-copy">
                <span className="ll-feature-label">
                  03 / KEEP FAITH AT THE CENTER
                </span>
                <h3>
                  Your hopes.
                  <br />
                  Your prayers. Together.
                </h3>
                <p>
                  Share what’s on your heart, pray for one another, and remember
                  the answers along the way.
                </p>
                <button
                  onClick={onGetStarted}
                  aria-label="Explore shared prayer"
                >
                  <ArrowUpRight size={20} />
                </button>
              </div>
            </article>
          </div>
          <div className="ll-more-features">
            <span>And room for so much more</span>
            <span>
              <NotebookPen size={17} /> Shared journals
            </span>
            <span>
              <Heart size={17} /> Mood check-ins
            </span>
            <span>
              <Sprout size={17} /> Learning together
            </span>
            <span>
              <Sparkles size={17} /> Your milestones
            </span>
          </div>
        </section>
        <section
          className="ll-how-section"
          id="how-it-works"
          tabIndex={-1}
          aria-labelledby="how-title"
        >
          <div className="ll-container ll-how-grid">
            <div className="ll-how-visual">
              <span className="ll-eyebrow">
                A SHARED SPACE. A SHARED DIRECTION.
              </span>
              <div className="ll-connection-art" aria-hidden="true">
                <span className="ll-connection-ring" />
                <span className="ll-connection-person">You</span>
                <span className="ll-connection-plus">
                  <Plus />
                </span>
                <span className="ll-connection-person">
                  Your
                  <br />
                  person
                </span>
                <Heart className="ll-connection-heart" />
              </div>
              <p>
                Two people.
                <br />
                <em>One beautiful journey.</em>
              </p>
              <span className="ll-how-caption">
                <Link2 size={15} /> Connected by your own invite code
              </span>
            </div>
            <div className="ll-how-copy">
              <p className="ll-eyebrow">LESS SETUP. MORE TOGETHER.</p>
              <h2 id="how-title">
                Your next chapter
                <br />
                starts <em>right here.</em>
              </h2>
              <ol className="ll-steps">
                <li>
                  <span>01</span>
                  <div>
                    <h3>Make yourself at home</h3>
                    <p>
                      Create your free account. Bring your story, just as it is.
                    </p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <h3>Invite your favorite person</h3>
                    <p>
                      Share your unique code and connect your accounts in a
                      space made for you both.
                    </p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <h3>Find your daily rhythm</h3>
                    <p>
                      A devotion, a question, a prayer. Start with one small
                      moment and keep growing.
                    </p>
                  </div>
                </li>
              </ol>
              <button className="ll-text-link" onClick={onGetStarted}>
                Let’s begin <ArrowUpRight size={19} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
        <section
          className="ll-container ll-mission"
          id="why-us"
          tabIndex={-1}
          aria-labelledby="mission-title"
        >
          <span className="ll-mission-flower" aria-hidden="true">
            ✳
          </span>
          <p className="ll-eyebrow">THE HEART BEHIND TWOBEONE</p>
          <h2 id="mission-title">
            A stronger “us” starts with
            <br />
            <em>the little things.</em>
          </h2>
          <p className="ll-mission-description">
            We believe a Christ-centered relationship is built in everyday
            moments. The prayer before a big day. The question you’ve never
            asked. The choice to listen a little longer. TwoBeOne helps you make
            more of those moments.
          </p>
          <div className="ll-chapters">
            <span>Dating with intention</span>
            <i />
            <span>Preparing for marriage</span>
            <i />
            <span>Growing through marriage</span>
          </div>
          <blockquote>
            “Two are better than one.”<cite>ECCLESIASTES 4:9</cite>
          </blockquote>
        </section>
        <section
          className="ll-faq-section"
          id="faq"
          tabIndex={-1}
          aria-labelledby="faq-title"
        >
          <div className="ll-container ll-faq-grid">
            <div className="ll-faq-intro">
              <p className="ll-eyebrow">A FEW THINGS YOU MIGHT WONDER</p>
              <h2 id="faq-title">
                Good questions.
                <br />
                <em>Honest answers.</em>
              </h2>
              <p>
                Something else on your mind?
                <br />
                We’d love to help.
              </p>
              <a
                className="ll-text-link"
                href={STATIC_PAGE_PATHS.contact}
                onClick={(event) => navigate(event, "contact")}
              >
                Get in touch <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </div>
            <div className="ll-faq-list">
              {FAQS.map((faq, index) => (
                <div
                  className={`ll-faq-item${openFaq === index ? " is-open" : ""}`}
                  key={faq.question}
                >
                  <h3>
                    <button
                      type="button"
                      id={`faq-question-${index}`}
                      aria-expanded={openFaq === index}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() =>
                        setOpenFaq(openFaq === index ? null : index)
                      }
                    >
                      {faq.question}
                      <ChevronDown size={18} aria-hidden="true" />
                    </button>
                  </h3>
                  <div
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    hidden={openFaq !== index}
                  >
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          className="ll-container ll-download-wrap"
          id="download"
          tabIndex={-1}
          aria-labelledby="download-title"
        >
          <div className="ll-download">
            <div className="ll-download-rings" aria-hidden="true">
              <span />
              <span />
            </div>
            <span className="ll-download-icon">
              <Heart aria-hidden="true" />
            </span>
            <p className="ll-eyebrow">YOUR STORY IS STILL BEING WRITTEN</p>
            <h2 id="download-title">
              Make the next chapter
              <br />
              <em>your closest yet.</em>
            </h2>
            <p>
              A little time for each other. A little space for God.
              <br />A beautiful place to begin.
            </p>
            <button
              className="ll-button ll-button--light"
              onClick={onGetStarted}
            >
              Get started for free <ArrowUpRight size={19} aria-hidden="true" />
            </button>
            <StoreDownloadButtons onInstallIOS={openAppleInstallGuide} />
          </div>
        </section>
        <section
          className="ll-container ll-newsletter"
          aria-labelledby="newsletter-title"
        >
          <div>
            <span className="ll-newsletter-icon">
              <Mail size={23} aria-hidden="true" />
            </span>
            <div>
              <h2 id="newsletter-title">
                A little encouragement in your inbox.
              </h2>
              <p>
                Shabbat Shalom. Faith, reflection, and a moment to reconnect.
              </p>
            </div>
          </div>
          <form onSubmit={handleNewsletterSignup}>
            <label className="ll-sr-only" htmlFor="landing-email">
              Your email address
            </label>
            <div className="ll-email-field">
              <input
                id="landing-email"
                type="email"
                autoComplete="email"
                placeholder="Your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isSubmitting}
                aria-describedby="newsletter-note newsletter-status"
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="ll-spinner"
                      size={16}
                      aria-hidden="true"
                    />{" "}
                    Joining…
                  </>
                ) : (
                  <>
                    Count me in <ArrowUpRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
            <p id="newsletter-note">
              By subscribing, you agree to our{" "}
              <a
                href={STATIC_PAGE_PATHS["privacy-policy"]}
                onClick={(event) => navigate(event, "privacy-policy")}
              >
                privacy policy
              </a>
              . Unsubscribe anytime.
            </p>
            <p
              id="newsletter-status"
              className={newsletterError ? "ll-form-error" : "ll-form-success"}
              role="status"
              aria-live="polite"
            >
              {newsletterMessage}
            </p>
          </form>
        </section>
      </main>
      <footer className="ll-footer">
        <div className="ll-container">
          <div className="ll-footer-top">
            <div className="ll-footer-brand">
              <a className="ll-home" href="/" aria-label="TwoBeOne home">
                <Brand />
              </a>
              <p>
                A little closer to each other.
                <br />A little closer to God.
              </p>
              <span>Made with faith. Built for love.</span>
            </div>
            <div className="ll-footer-column">
              <h3>Explore</h3>
              {NAV_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(event) => scrollTo(event, link.id)}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="ll-footer-column">
              <h3>Stay connected</h3>
              {(
                [
                  ["blog", "Our journal"],
                  ["community", "Community"],
                  ["help-center", "Help center"],
                  ["contact", "Contact us"],
                ] as const
              ).map(([page, label]) => (
                <a
                  key={page}
                  href={STATIC_PAGE_PATHS[page]}
                  onClick={(event) => navigate(event, page)}
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="ll-footer-note">
              <Globe2 size={21} aria-hidden="true" />
              <h3>Love speaks your language.</h3>
              <p>English · አማርኛ · Afaan Oromo</p>
              <button className="ll-text-link" onClick={onGetStarted}>
                Find your shared rhythm{" "}
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="ll-footer-bottom">
            <p>© {new Date().getFullYear()} TwoBeOne. All rights reserved.</p>
            <div>
              {(
                [
                  ["privacy-policy", "Privacy"],
                  ["terms-of-service", "Terms"],
                  ["cookie-policy", "Cookies"],
                ] as const
              ).map(([page, label]) => (
                <a
                  key={page}
                  href={STATIC_PAGE_PATHS[page]}
                  onClick={(event) => navigate(event, page)}
                >
                  {label}
                </a>
              ))}
            </div>
            <span>
              Two hearts. One purpose. <Heart size={13} aria-hidden="true" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
