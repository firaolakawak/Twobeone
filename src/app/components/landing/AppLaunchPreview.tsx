import { useEffect, useState } from "react";
import {
  ArrowRight,
  BatteryFull,
  BookOpen,
  Check,
  CheckCheck,
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
        // The interactive preview remains available when uploaded images cannot load.
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
      <div className="alp-orbit" aria-hidden="true" />
      <div className="alp-orbit-leaf" aria-hidden="true">
        <Leaf size={23} strokeWidth={1.3} />
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
            <div className="alp-status" aria-hidden="true">
              <span>9:41</span>
              <div className="alp-camera" />
              <span className="alp-status-icons">
                <Signal size={12} />
                <Wifi size={12} />
                <BatteryFull size={16} />
              </span>
            </div>
            <div className="alp-screen-content">
              <div className="alp-greeting">
                <div>
                  <span className="alp-eyebrow">
                    YOUR LITTLE SPACE, TOGETHER
                  </span>
                  <h3>
                    {preview === "devotional"
                      ? "Good morning, you two."
                      : preview === "prayer"
                        ? "Bring it all to prayer."
                        : "Closer, one day at a time."}
                  </h3>
                </div>
                <span className="alp-profile" aria-hidden="true">
                  <Heart size={17} strokeWidth={1.7} />
                </span>
              </div>

              {preview === "devotional" && (
                <>
                  <div className="alp-devotional-card">
                    <div className="alp-landscape" aria-hidden="true">
                      <span className="alp-sun" />
                      <span className="alp-hill alp-hill-back" />
                      <span className="alp-hill alp-hill-front" />
                      <span className="alp-landscape-caption">
                        ROOTED IN LOVE
                      </span>
                    </div>
                    <div className="alp-devotional-copy">
                      <span className="alp-card-eyebrow">
                        TODAY’S DEVOTIONAL · 5 MIN
                      </span>
                      <h4>Love in the little things</h4>
                      <button type="button" onClick={onGetStarted}>
                        Read together <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="alp-verse">
                    <span className="alp-card-eyebrow">
                      A WORD TO CARRY WITH YOU
                    </span>
                    <p>“Let all that you do be done in love.”</p>
                    <span>1 Corinthians 16:14</span>
                  </div>
                  <div className="alp-rhythm">
                    <div>
                      <span className="alp-rhythm-icon">
                        <Sun size={16} />
                      </span>
                      <span>
                        <strong>Today’s rhythm</strong>
                        <small>A little intention. A little closer.</small>
                      </span>
                    </div>
                    <Check size={16} />
                  </div>
                </>
              )}

              {preview === "prayer" && (
                <>
                  <div className="alp-prayer-card">
                    <span className="alp-card-eyebrow">
                      YOUR SHARED PRAYER SPACE
                    </span>
                    <Heart size={30} strokeWidth={1.2} />
                    <h4>
                      Two hearts.
                      <br />
                      One prayer.
                    </h4>
                    <p>
                      For the hopes, the hard days,
                      <br />
                      and everything in between.
                    </p>
                  </div>
                  <div className="alp-prayer-item">
                    <span className="alp-small-heart">
                      <Heart size={15} />
                    </span>
                    <div>
                      <strong>Peace in this new season</strong>
                      <span>Praying for one another</span>
                    </div>
                    <CheckCheck size={16} />
                  </div>
                  <div className="alp-prayer-item">
                    <span className="alp-small-heart alp-small-heart-sage">
                      <Leaf size={15} />
                    </span>
                    <div>
                      <strong>Grateful for us</strong>
                      <span>A moment of gratitude</span>
                    </div>
                    <Check size={15} />
                  </div>
                  <button
                    className="alp-screen-button"
                    type="button"
                    onClick={onGetStarted}
                  >
                    <Plus size={14} /> Add a prayer together
                  </button>
                </>
              )}

              {preview === "sync" && (
                <>
                  <div className="alp-together-card">
                    <span className="alp-card-eyebrow">
                      A MOMENT FOR THE TWO OF YOU
                    </span>
                    <div className="alp-avatar-pair" aria-hidden="true">
                      <span>J</span>
                      <Heart size={16} />
                      <span>A</span>
                    </div>
                    <h4>How is your heart today?</h4>
                    <p>Make room for an honest answer.</p>
                    <button type="button" onClick={onGetStarted}>
                      Check in together <ArrowRight size={13} />
                    </button>
                  </div>
                  <div className="alp-conversation">
                    <span className="alp-card-eyebrow">
                      <MessageCircle size={12} /> START A CONVERSATION
                    </span>
                    <p>
                      What is one small thing that made you feel loved this
                      week?
                    </p>
                    <button type="button" onClick={onGetStarted}>
                      Share your answer <ArrowRight size={12} />
                    </button>
                  </div>
                  <div className="alp-together-note">
                    <Leaf size={15} />
                    <span>Small moments make a meaningful story.</span>
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
                <Home size={17} />
                <span>Today</span>
              </button>
              <button
                type="button"
                aria-pressed={preview === "prayer"}
                onClick={() => setPreview("prayer")}
              >
                <Heart size={17} />
                <span>Prayer</span>
              </button>
              <button
                type="button"
                aria-pressed={preview === "sync"}
                onClick={() => setPreview("sync")}
              >
                <Sparkles size={17} />
                <span>Together</span>
              </button>
            </div>
            <div className="alp-home-indicator" aria-hidden="true" />
          </>
        )}
      </div>

      <div className="alp-float-card alp-float-rhythm">
        <div className="alp-float-card-heading">
          <span className="alp-float-icon alp-float-icon-sage">
            <Sun size={17} strokeWidth={1.6} />
          </span>
          <div>
            <strong>A little closer, daily</strong>
            <span>Your shared rhythm</span>
          </div>
        </div>
        <div className="alp-week" aria-label="Illustrative weekly activity">
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
          <span>S</span>
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <i key={day} className={day < 5 ? "alp-day-done" : "alp-day-next"}>
              {day < 5 ? <Check size={10} strokeWidth={2.5} /> : null}
            </i>
          ))}
        </div>
      </div>
      <div className="alp-float-card alp-float-prayer">
        <span className="alp-float-icon">
          <Heart size={18} strokeWidth={1.6} />
        </span>
        <div>
          <strong>You’re in my prayers.</strong>
          <span>A shared moment of care</span>
          <small>
            <CheckCheck size={12} /> Connected through faith
          </small>
        </div>
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
          APP PREVIEW <span aria-hidden="true">·</span> MADE FOR YOUR EVERYDAY
        </span>
      </div>
    </div>
  );
}
