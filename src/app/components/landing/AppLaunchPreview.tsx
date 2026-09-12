import { useEffect, useState } from "react";
import {
  ArrowRight,
  BatteryFull,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Heart,
  Home,
  Leaf,
  MessageCircle,
  Plus,
  Signal,
  Sparkles,
  Sun,
  Wifi,
} from "lucide-react";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import "../../styles/app-launch-preview.css";

type Preview = "devotional" | "prayer" | "sync";

interface LandingScreenshot {
  id: string;
  url: string;
  type: string;
  uploadedAt: string;
}

const PREVIEWS: { id: Preview; label: string; icon: typeof BookOpen }[] = [
  { id: "devotional", label: "Devotional", icon: BookOpen },
  { id: "prayer", label: "Prayer", icon: Heart },
  { id: "sync", label: "Together", icon: Sparkles },
];

function PhoneStatus() {
  return (
    <div className="alp-status" aria-hidden="true">
      <span>9:41</span>
      <span className="alp-camera" />
      <span className="alp-status-icons">
        <Signal size={11} />
        <Wifi size={11} />
        <BatteryFull size={15} />
      </span>
    </div>
  );
}

function AppBrand() {
  return (
    <div className="alp-brand">
      <span>
        <Heart size={13} strokeWidth={2.1} />
      </span>
      TwoBeOne
    </div>
  );
}

function PrayerContent({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <>
      <div className="alp-prayer-feature">
        <span className="alp-prayer-symbol">
          <Heart size={25} strokeWidth={1.4} />
        </span>
        <span className="alp-card-label">A MOMENT OF FAITH</span>
        <h4>
          Two hearts.
          <br />
          One prayer.
        </h4>
        <p>
          Bring your hopes, your thanks,
          <br />
          and your everyday to God.
        </p>
      </div>
      <div className="alp-list-heading">
        <strong>Our prayers</strong>
        <span>2 shared</span>
      </div>
      <div className="alp-prayer-item">
        <span className="alp-item-icon">
          <Leaf size={15} />
        </span>
        <div>
          <strong>Peace in this new season</strong>
          <span>We’re praying together</span>
        </div>
        <CheckCheck size={15} />
      </div>
      <div className="alp-prayer-item">
        <span className="alp-item-icon alp-item-icon-coral">
          <Heart size={15} />
        </span>
        <div>
          <strong>Grateful for us</strong>
          <span>The little things are big things</span>
        </div>
        <Check size={14} />
      </div>
      {onGetStarted ? (
        <button
          type="button"
          className="alp-primary-action"
          onClick={onGetStarted}
        >
          <Plus size={14} /> Add a prayer
        </button>
      ) : (
        <div className="alp-companion-note">
          <CheckCheck size={13} /> A shared space for your faith
        </div>
      )}
    </>
  );
}

export function AppLaunchPreview({
  onGetStarted,
}: {
  onGetStarted: () => void;
}) {
  const [preview, setPreview] = useState<Preview>("devotional");
  const [screenshots, setScreenshots] = useState<LandingScreenshot[]>([]);
  const [failedImages, setFailedImages] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadScreenshots() {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/landing/screenshots`,
          {
            headers: { Authorization: `Bearer ${publicAnonKey}` },
            signal: controller.signal,
          },
        );
        if (!response.ok) return;
        const data = await response.json();
        if (!Array.isArray(data?.screenshots) || controller.signal.aborted)
          return;
        setScreenshots(
          data.screenshots
            .filter(
              (entry: LandingScreenshot) =>
                entry?.id && typeof entry.url === "string" && entry.url,
            )
            .sort(
              (a: LandingScreenshot, b: LandingScreenshot) =>
                (Date.parse(b.uploadedAt) || 0) -
                (Date.parse(a.uploadedAt) || 0),
            ),
        );
      } catch {
        // The built-in preview stays usable when uploaded screenshots are unavailable.
      }
    }
    void loadScreenshots();
    return () => controller.abort();
  }, []);

  const availableScreenshots = screenshots.filter(
    (entry) => !failedImages.includes(entry.url),
  );
  const previewIndex = PREVIEWS.findIndex((entry) => entry.id === preview);
  const screenshot =
    availableScreenshots.find((entry) => entry.type === preview) ??
    availableScreenshots[previewIndex % availableScreenshots.length];
  const previewLabel = PREVIEWS[previewIndex].label;

  return (
    <div className="alp-stage">
      <div className="alp-backdrop" aria-hidden="true" />
      <div className="alp-backdrop-ring" aria-hidden="true" />

      <div className="alp-companion-phone" aria-hidden="true">
        <PhoneStatus />
        <div className="alp-companion-content">
          <AppBrand />
          <div className="alp-companion-heading">
            <span>FAITH, SHARED</span>
            <h3>Our prayer space</h3>
          </div>
          <PrayerContent />
        </div>
        <div className="alp-companion-nav">
          <Home size={15} />
          <Heart size={15} />
          <Sparkles size={15} />
        </div>
        <div className="alp-home-indicator" />
      </div>

      <div className="alp-phone" aria-label={`${previewLabel} app preview`}>
        {screenshot ? (
          <img
            key={screenshot.url}
            className="alp-uploaded-screen"
            src={screenshot.url}
            alt={`TwoBeOne ${previewLabel.toLowerCase()} screen`}
            onError={() =>
              setFailedImages((current) => [...current, screenshot.url])
            }
          />
        ) : (
          <>
            <PhoneStatus />
            <div className={`alp-screen-content alp-screen-content-${preview}`}>
              <div className="alp-app-header">
                <AppBrand />
                <span className="alp-connected">
                  <span /> Connected
                </span>
              </div>
              <div className="alp-greeting">
                <div>
                  <p>Good morning, Jamie &amp; Alex</p>
                  <h3>
                    {preview === "devotional" ? (
                      <>
                        Your space,
                        <br />
                        together.
                      </>
                    ) : preview === "prayer" ? (
                      <>
                        A little prayer.
                        <br />A deeper connection.
                      </>
                    ) : (
                      <>
                        Make time
                        <br />
                        for each other.
                      </>
                    )}
                  </h3>
                </div>
                <div className="alp-couple-avatars" aria-hidden="true">
                  <span>J</span>
                  <span>A</span>
                  <i>
                    <Heart size={9} fill="currentColor" />
                  </i>
                </div>
              </div>

              {preview === "devotional" && (
                <>
                  <div className="alp-devotional-card">
                    <div className="alp-card-topline">
                      <span className="alp-card-label">TODAY’S DEVOTIONAL</span>
                      <BookOpen size={19} strokeWidth={1.4} />
                    </div>
                    <h4>
                      Love in the
                      <br />
                      little things
                    </h4>
                    <p>Small acts. A stronger love.</p>
                    <div className="alp-card-bottomline">
                      <button type="button" onClick={onGetStarted}>
                        Read together <ArrowRight size={13} />
                      </button>
                      <span>5 min read</span>
                    </div>
                    <Leaf
                      className="alp-card-leaf"
                      size={88}
                      strokeWidth={0.65}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="alp-quick-actions">
                    <button type="button" onClick={() => setPreview("prayer")}>
                      <span className="alp-quick-icon">
                        <Heart size={17} strokeWidth={1.6} />
                      </span>
                      <strong>Pray together</strong>
                      <span>
                        Keep faith close <ChevronRight size={11} />
                      </span>
                    </button>
                    <button type="button" onClick={() => setPreview("sync")}>
                      <span className="alp-quick-icon alp-quick-icon-sage">
                        <MessageCircle size={17} strokeWidth={1.6} />
                      </span>
                      <strong>Daily check-in</strong>
                      <span>
                        How’s your heart? <ChevronRight size={11} />
                      </span>
                    </button>
                  </div>
                  <div className="alp-rhythm-card">
                    <div className="alp-rhythm-heading">
                      <span>
                        <Sun size={13} /> Your shared rhythm
                      </span>
                      <strong>5 of 7 days</strong>
                    </div>
                    <div
                      className="alp-week"
                      aria-label="Demo: five days of shared activity this week"
                    >
                      {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                        <div key={index}>
                          <span
                            className={
                              index < 5 ? "alp-day-done" : "alp-day-next"
                            }
                          >
                            {index < 5 ? (
                              <Check size={10} strokeWidth={2.5} />
                            ) : (
                              <span />
                            )}
                          </span>
                          <small>{day}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {preview === "prayer" && (
                <div className="alp-prayer-view">
                  <PrayerContent onGetStarted={onGetStarted} />
                </div>
              )}

              {preview === "sync" && (
                <>
                  <div className="alp-checkin-card">
                    <span className="alp-card-label">YOUR DAILY CHECK-IN</span>
                    <h4>
                      How is your
                      <br />
                      heart today?
                    </h4>
                    <p>There’s room for every feeling here.</p>
                    <div className="alp-feeling-options" aria-hidden="true">
                      <span>
                        <Sun size={21} />
                        <small>Grateful</small>
                      </span>
                      <span>
                        <Leaf size={21} />
                        <small>Peaceful</small>
                      </span>
                      <span>
                        <Heart size={21} />
                        <small>Hopeful</small>
                      </span>
                    </div>
                    <button type="button" onClick={onGetStarted}>
                      Share how you feel <ArrowRight size={13} />
                    </button>
                  </div>
                  <div className="alp-conversation-card">
                    <span className="alp-card-label">
                      <MessageCircle size={12} /> A QUESTION FOR YOU TWO
                    </span>
                    <p>
                      What made you feel
                      <br />
                      loved this week?
                    </p>
                    <button type="button" onClick={onGetStarted}>
                      Start a conversation <ArrowRight size={12} />
                    </button>
                  </div>
                  <div className="alp-together-note">
                    <Leaf size={14} /> Little moments. A meaningful story.
                  </div>
                </>
              )}
            </div>
            <div className="alp-phone-nav" aria-label="App preview navigation">
              <button
                type="button"
                aria-pressed={preview === "devotional"}
                onClick={() => setPreview("devotional")}
              >
                <Home size={18} />
                <span>Today</span>
              </button>
              <button
                type="button"
                aria-pressed={preview === "prayer"}
                onClick={() => setPreview("prayer")}
              >
                <Heart size={18} />
                <span>Prayer</span>
              </button>
              <button
                type="button"
                aria-pressed={preview === "sync"}
                onClick={() => setPreview("sync")}
              >
                <Sparkles size={18} />
                <span>Together</span>
              </button>
            </div>
            <div className="alp-home-indicator" aria-hidden="true" />
          </>
        )}
      </div>

      <div className="alp-preview-controls">
        <div
          className="alp-preview-tabs"
          role="group"
          aria-label="Explore the app preview"
        >
          {PREVIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={preview === id}
              onClick={() => setPreview(id)}
            >
              <Icon size={14} strokeWidth={1.7} />
              {label}
            </button>
          ))}
        </div>
        <span className="alp-preview-caption">
          INTERACTIVE DEMO <span aria-hidden="true">·</span> A PEEK AT LIFE
          TOGETHER
        </span>
      </div>
    </div>
  );
}
