import { memo, useEffect, useState } from "react";
import { ArrowRight, Calendar, Heart, Sparkles, Users, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { dashboardJourneyCopy } from "../data/dashboard-journey";
import { loveJourneyCopy } from "../data/love-journey";
import { moodCheckInCopy } from "../data/mood-check-in";
import { MOOD_EMOJI, type MoodValue } from "../utils/moodCheckIn";
import {
  getElapsedRelationshipTime,
  getNextRelationshipAnniversary,
  parseRelationshipStart,
} from "../utils/relationshipJourney";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { DistanceConnector } from "./DistanceConnector";
import "./love-journey.css";

interface JourneyPerson {
  id: string;
  name: string;
  avatar?: string;
}

interface JourneyMilestone {
  id: string;
  title: string;
  date: string;
  description?: string;
}

interface LoveJourneyHeaderProps {
  user: JourneyPerson;
  partner?: JourneyPerson;
  partnerMood?: MoodValue;
  start?: string;
  accessToken?: string;
  milestones: JourneyMilestone[];
  onEdit: () => void;
  onViewMemories: () => void;
}

// Only this small component renders every second, leaving dashboard data alone.
export const JourneyCounter = memo(function JourneyCounter({
  start,
}: {
  start: string;
}) {
  const { t, language } = useLanguage();
  const [time, setTime] = useState(() => getElapsedRelationshipTime(start));
  useEffect(() => {
    const update = () => setTime(getElapsedRelationshipTime(start));
    const onVisible = () => {
      if (!document.hidden) update();
    };
    update();
    const interval = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [start]);
  return (
    <div
      className="love-journey__elapsed"
      role="timer"
      aria-live="off"
      aria-label={t.dashboard.daysTogether}
    >
      <span className="love-journey__elapsed-mark">
        <Heart size={24} aria-hidden="true" />
      </span>
      <div className="love-journey__elapsed-content">
        <p className="love-journey__elapsed-primary">
          <strong data-unit="days">{time.days}</strong>
          <span>{loveJourneyCopy[language].daysTogether}</span>
        </p>
        <div className="love-journey__clock">
          <span className="love-journey__clock-digits" aria-hidden="true">
            {(
              [
                ["hours", time.hours],
                ["minutes", time.minutes],
                ["seconds", time.seconds],
              ] as const
            ).map(([unit, value], index) => (
              <span className="love-journey__clock-unit" key={unit}>
                {index > 0 && ":"}
                <b data-unit={unit}>{String(value).padStart(2, "0")}</b>
              </span>
            ))}
          </span>
          <span className="sr-only">
            {time.hours} {t.time.hours}, {time.minutes} {t.time.minutes},{" "}
            {time.seconds} {t.time.seconds}
          </span>
        </div>
      </div>
    </div>
  );
});

export function LoveJourneyHeader({
  user,
  partner,
  partnerMood,
  start,
  accessToken,
  milestones,
  onEdit,
  onViewMemories,
}: LoveJourneyHeaderProps) {
  const { t, language } = useLanguage();
  const copy = loveJourneyCopy[language];
  const dashboardCopy = dashboardJourneyCopy[language];
  const [now, setNow] = useState(Date.now);
  const [storyOpen, setStoryOpen] = useState(false);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const onVisible = () => {
      if (!document.hidden) update();
    };
    const interval = window.setInterval(update, 60000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  const startDate = parseRelationshipStart(start);
  const hasStarted = startDate !== null && startDate.getTime() <= now;
  const anniversary = getNextRelationshipAnniversary(start, now);
  const locale = language === "en" ? "en-GB" : `${language}-ET`;
  const formatDate = (date: Date) =>
    date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const anniversaryLabel = anniversary?.isToday
    ? copy.anniversaryToday
    : anniversary?.daysUntil === 1
      ? copy.inOneDay
      : copy.inDays.replace("{days}", String(anniversary?.daysUntil ?? ""));
  const firstName = (name: string) =>
    name.trim().split(/\s+/)[0] || dashboardCopy.partner;
  const savedMoments = milestones
    .filter((milestone) => {
      const date = parseRelationshipStart(milestone.date);
      return date && date.getTime() <= now;
    })
    .sort(
      (a, b) =>
        parseRelationshipStart(b.date)!.getTime() -
        parseRelationshipStart(a.date)!.getTime(),
    )
    .slice(0, 5);
  const navigateFromStory = (action: () => void) => {
    setStoryOpen(false);
    action();
  };

  return (
    <>
      <section className="love-journey" aria-labelledby="journey-couple-title">
        <div className="love-journey__body">
          <div className="love-journey__identity">
            <div className="love-journey__names">
              <p className="love-journey__eyebrow">{copy.title}</p>
              <h2
                id="journey-couple-title"
                title={partner ? `${user.name} & ${partner.name}` : user.name}
              >
                {firstName(user.name)}
                {partner && (
                  <>
                    {" "}
                    <span className="love-journey__ampersand">&amp;</span>{" "}
                    <span className="love-journey__partner-label">
                      {firstName(partner.name)}
                      {partnerMood && (
                        <>
                          {" "}
                          <span
                            className="love-journey__mood"
                            role="img"
                            aria-label={moodCheckInCopy[language].partnerMood
                              .replace("{name}", firstName(partner.name))
                              .replace("{mood}", t.mood[partnerMood])}
                            title={`${firstName(partner.name)}: ${t.mood[partnerMood]}`}
                          >
                            {MOOD_EMOJI[partnerMood]}
                          </span>
                        </>
                      )}
                    </span>
                  </>
                )}
              </h2>
            </div>
            <button
              type="button"
              className="love-journey__portraits"
              onClick={onEdit}
              aria-label={dashboardCopy.editJourney}
            >
              {[user, ...(partner ? [partner] : [])].map((person, index) => (
                <Avatar
                  key={person.id}
                  className={`love-journey__portrait${index ? " love-journey__portrait--partner" : ""}`}
                >
                  <AvatarImage src={person.avatar} alt={person.name} />
                  <AvatarFallback>
                    {firstName(person.name).slice(0, 1).toLocaleUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </button>
          </div>
          {partner ? (
            <>
              {hasStarted && start ? (
                <JourneyCounter start={start} />
              ) : (
                <button
                  type="button"
                  className="love-journey__set-date"
                  onClick={onEdit}
                >
                  <Calendar size={16} aria-hidden="true" />
                  {startDate
                    ? copy.startsOn.replace("{date}", formatDate(startDate))
                    : dashboardCopy.setDate}
                </button>
              )}
              <div className="love-journey__locations">
                {user.id && accessToken ? (
                  <DistanceConnector
                    embedded
                    variant="love-journey"
                    userId={user.id}
                    userName={user.name}
                    partnerId={partner.id}
                    partnerName={partner.name}
                    accessToken={accessToken}
                  />
                ) : (
                  <p className="love-journey__location-empty">
                    {t.dashboard.locationNotSet}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="love-journey__unlinked">
              <p>{t.dashboard.connectWithPartner}</p>
              <button type="button" onClick={onEdit}>
                <Users size={16} aria-hidden="true" />
                {t.dashboard.addPartner}
              </button>
            </div>
          )}
        </div>
        {partner && (
          <div className="love-journey__footer">
            <div className="love-journey__occasion">
              <Calendar size={15} aria-hidden="true" />
              <p>
                {anniversary ? copy.nextAnniversary : copy.beginning}
                <strong>
                  {anniversary
                    ? anniversaryLabel
                    : startDate
                      ? formatDate(startDate)
                      : copy.addDate}
                </strong>
              </p>
            </div>
            <Dialog open={storyOpen} onOpenChange={setStoryOpen}>
              <DialogTrigger asChild>
                <button className="love-journey__story-button" type="button">
                  {copy.ourStory}
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </DialogTrigger>
              <DialogContent
                className="love-journey-story"
                showCloseButton={false}
              >
                <div className="love-journey-story__top">
                  <p className="love-journey__eyebrow">
                    {firstName(user.name)} &amp; {firstName(partner.name)}
                  </p>
                  <DialogClose asChild>
                    <button
                      className="love-journey-story__close"
                      type="button"
                      aria-label={t.common.close}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </DialogClose>
                </div>
                <DialogTitle className="love-journey-story__title">
                  {copy.storyTitle}
                </DialogTitle>
                <DialogDescription className="love-journey-story__intro">
                  {copy.storyDescription}
                </DialogDescription>
                <ol className="love-journey-story__timeline">
                  <li>
                    <h3>{copy.beginning}</h3>
                    {startDate ? (
                      <p>
                        <time dateTime={start}>{formatDate(startDate)}</time>
                      </p>
                    ) : (
                      <button
                        type="button"
                        className="love-journey-story__text-button"
                        onClick={() => navigateFromStory(onEdit)}
                      >
                        {dashboardCopy.setDate}
                      </button>
                    )}
                  </li>
                  {hasStarted && (
                    <li className="is-current">
                      <h3>
                        {t.common.today} ·{" "}
                        {getElapsedRelationshipTime(start, now).days}{" "}
                        {copy.daysTogether}
                      </h3>
                      <p>{t.dashboard.growingTogetherInFaith}</p>
                    </li>
                  )}
                  {anniversary && (
                    <li>
                      <h3>{copy.nextAnniversary}</h3>
                      <p>
                        <time dateTime={anniversary.date.toISOString()}>
                          {formatDate(anniversary.date)}
                        </time>{" "}
                        · {anniversaryLabel}
                      </p>
                    </li>
                  )}
                </ol>
                <div className="love-journey-story__memories">
                  <h3>{copy.memories}</h3>
                  {savedMoments.length ? (
                    <ul>
                      {savedMoments.map((milestone) => (
                        <li key={milestone.id}>
                          <strong>{milestone.title}</strong>
                          <time dateTime={milestone.date}>
                            {formatDate(
                              parseRelationshipStart(milestone.date)!,
                            )}
                          </time>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{copy.emptyMemories}</p>
                  )}
                </div>
                <div className="love-journey-story__actions">
                  <button
                    type="button"
                    className="love-journey-story__primary"
                    onClick={() => navigateFromStory(onViewMemories)}
                  >
                    {dashboardCopy.milestones}
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="love-journey-story__text-button"
                    onClick={() => navigateFromStory(onEdit)}
                  >
                    {dashboardCopy.editJourney}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </section>
      <p className="love-journey__faith">
        <Sparkles size={12} aria-hidden="true" />
        {t.dashboard.growingTogetherInFaith}
      </p>
    </>
  );
}
