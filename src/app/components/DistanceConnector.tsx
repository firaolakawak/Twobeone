import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  MapPin,
  Navigation,
  Loader2,
  Settings,
  Check,
  X,
  Heart,
  Wifi,
  WifiOff,
  Route,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  calculateDistance,
  formatDistance,
  getCurrentLocation,
  geocodeCity,
  getDistanceDescription,
  type Location,
} from "../utils/location";
import { projectId } from "../utils/supabase/info";
import { createClient } from "../utils/supabase/client";
import { useLanguage } from "../contexts/LanguageContext";
import "../styles/distance-journey.css";

interface DistanceConnectorProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  partnerId?: string;
  partnerName: string;
  partnerAvatar?: string;
  accessToken: string;
  userOnline?: boolean;
  partnerOnline?: boolean;
  embedded?: boolean;
  variant?: "default" | "journey";
  centerContent?: ReactNode;
}

interface UserLocation {
  userId: string;
  location: Location | null;
  locationType: "live" | "manual" | null;
  updatedAt?: string;
}

const LOCATION_COPY = {
  en: {
    coupleLocations: "Your shared locations",
    notShared: "Not shared",
    locationShared: "Location shared",
    sameCity: "Same city",
    distanceUnavailable: "Distance unavailable",
    approximate: "Approximate straight-line distance",
    cityBaseline: "Based on your selected city",
    manual: "City set manually",
    device: "Saved device location",
    bothManual: "Both cities set manually",
    bothDevice: "Both device locations saved",
    mixedSources: "Shared city and device locations",
    ownManual: "Your city set manually",
    ownDevice: "Your device location saved",
    ownNotShared: "Your location is not shared",
    kmApart: " km apart",
    updated: "Updated",
    settings: "Location settings",
    description: "Choose the location you want to share with your partner.",
    savedLocation: "Your shared location",
    deviceHeading: "Use your device location",
    deviceButton: "Update current location",
    deviceHint:
      "Saves your current location once. It does not track your movements.",
    locating: "Getting your location…",
    manualHeading: "Set your city",
    cityPlaceholder: "City and country",
    set: "Set city",
    searching: "Searching…",
    remove: "Remove shared location",
    privacy: "Your shared location is visible to your connected partner.",
    or: "Or",
    permissionError: "Unable to get your location. Please check permissions.",
    updateError: "Could not update your location. Please try again.",
    updateSuccess: "Location updated.",
    cityRequired: "Please enter a city name.",
    cityNotFound: "City not found. Try adding the country.",
    cityError: "Could not save your city. Please try again.",
    citySuccess: "City saved.",
    removeSuccess: "Shared location removed.",
    removeError: "Could not remove your location. Please try again.",
  },
  am: {
    coupleLocations: "ያጋራችሁት አካባቢ",
    notShared: "አልተጋራም",
    locationShared: "አካባቢ ተጋርቷል",
    sameCity: "በአንድ ከተማ",
    distanceUnavailable: "ርቀት አይገኝም",
    approximate: "ግምታዊ የቀጥታ መስመር ርቀት",
    cityBaseline: "በመረጣችሁት ከተማ መሠረት",
    manual: "በእጅ የተመረጠ ከተማ",
    device: "የተቀመጠ የመሣሪያ አካባቢ",
    bothManual: "ሁለቱም ከተሞች በእጅ ተመርጠዋል",
    bothDevice: "የሁለቱም መሣሪያዎች አካባቢ ተቀምጧል",
    mixedSources: "የተጋሩ የከተማ እና የመሣሪያ አካባቢዎች",
    ownManual: "ከተማዎ በእጅ ተመርጧል",
    ownDevice: "የመሣሪያዎ አካባቢ ተቀምጧል",
    ownNotShared: "አካባቢዎ አልተጋራም",
    kmApart: " ኪ.ሜ ርቀት",
    updated: "የታደሰው",
    settings: "የአካባቢ ቅንብሮች",
    description: "ለባልደረባዎ ማጋራት የሚፈልጉትን አካባቢ ይምረጡ።",
    savedLocation: "ያጋሩት አካባቢ",
    deviceHeading: "የመሣሪያዎን አካባቢ ይጠቀሙ",
    deviceButton: "የአሁኑን አካባቢ ያድሱ",
    deviceHint: "የአሁኑን አካባቢ አንድ ጊዜ ያስቀምጣል። እንቅስቃሴዎን አይከታተልም።",
    locating: "አካባቢዎን በማግኘት ላይ…",
    manualHeading: "ከተማዎን ይምረጡ",
    cityPlaceholder: "ከተማ እና አገር",
    set: "ከተማ አስቀምጥ",
    searching: "በመፈለግ ላይ…",
    remove: "የተጋራውን አካባቢ ያስወግዱ",
    privacy: "ያጋሩት አካባቢ ለተገናኙት ባልደረባዎ ይታያል።",
    or: "ወይም",
    permissionError: "አካባቢዎን ማግኘት አልተቻለም። ፈቃዶችን ያረጋግጡ።",
    updateError: "አካባቢዎን ማደስ አልተቻለም። እንደገና ይሞክሩ።",
    updateSuccess: "አካባቢዎ ታድሷል።",
    cityRequired: "የከተማ ስም ያስገቡ።",
    cityNotFound: "ከተማው አልተገኘም። የአገሩን ስም ጨምረው ይሞክሩ።",
    cityError: "ከተማዎን ማስቀመጥ አልተቻለም። እንደገና ይሞክሩ።",
    citySuccess: "ከተማዎ ተቀምጧል።",
    removeSuccess: "የተጋራው አካባቢ ተወግዷል።",
    removeError: "አካባቢዎን ማስወገድ አልተቻለም። እንደገና ይሞክሩ።",
  },
  om: {
    coupleLocations: "Bakkeewwan waliin qooddan",
    notShared: "Hin qoodamne",
    locationShared: "Bakki qoodameera",
    sameCity: "Magaalaa tokko keessa",
    distanceUnavailable: "Fageenyi hin argamne",
    approximate: "Fageenya tilmaamaa sarara qajeelaa",
    cityBaseline: "Magaalaa filattan irratti hundaa'a",
    manual: "Magaalaa harkaan filatame",
    device: "Bakka meeshaa irraa galmaa'e",
    bothManual: "Magaalonni lamaanuu harkaan filataman",
    bothDevice: "Bakki meeshaalee lamaanii galmaa'eera",
    mixedSources: "Bakka magaalaa fi meeshaa irraa qoodame",
    ownManual: "Magaalaan keessan harkaan filatame",
    ownDevice: "Bakki meeshaa keessanii galmaa'eera",
    ownNotShared: "Bakki keessan hin qoodamne",
    kmApart: " km wal irraa fagaattu",
    updated: "Haaromfame",
    settings: "Qindaa'ina bakka",
    description: "Bakka hiriyaa keessan waliin qooduu barbaaddan filadhaa.",
    savedLocation: "Bakka qooddan",
    deviceHeading: "Bakka meeshaa keessanii fayyadamaa",
    deviceButton: "Bakka ammaa haaromsaa",
    deviceHint:
      "Bakka ammaa keessan yeroo tokko galmeessa. Sochii keessan hin hordofu.",
    locating: "Bakka keessan barbaadaa jira…",
    manualHeading: "Magaalaa keessan filadhaa",
    cityPlaceholder: "Magaalaa fi biyya",
    set: "Magaalaa galmeessi",
    searching: "Barbaadaa jira…",
    remove: "Bakka qoodame haqi",
    privacy:
      "Bakki qooddan hiriyaa keessan waliin walitti hidhamtaniif ni mul'ata.",
    or: "Yookaan",
    permissionError:
      "Bakka keessan argachuun hin danda'amne. Eeyyama isaa mirkaneessaa.",
    updateError:
      "Bakka keessan haaromsuun hin danda'amne. Irra deebi'aa yaalaa.",
    updateSuccess: "Bakki haaromfameera.",
    cityRequired: "Maqaa magaalaa galchaa.",
    cityNotFound: "Magaalaan hin argamne. Maqaa biyyaas dabalaa yaalaa.",
    cityError:
      "Magaalaa keessan galmeessuun hin danda'amne. Irra deebi'aa yaalaa.",
    citySuccess: "Magaalaan galmaa'eera.",
    removeSuccess: "Bakki qoodame haqameera.",
    removeError: "Bakka keessan haquun hin danda'amne. Irra deebi'aa yaalaa.",
  },
};

function validUserLocation(
  value: UserLocation | null | undefined,
  expectedId: string,
): UserLocation | null {
  const location = value?.location;
  if (
    value?.userId !== expectedId ||
    !location ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude) ||
    Math.abs(location.latitude) > 90 ||
    Math.abs(location.longitude) > 180
  )
    return null;
  return value;
}

export function DistanceConnector({
  userId,
  userName,
  userAvatar,
  partnerId,
  partnerName,
  partnerAvatar,
  accessToken,
  userOnline: userOnlineOverride,
  partnerOnline: partnerOnlineOverride,
  embedded = false,
  variant = "default",
  centerContent,
}: DistanceConnectorProps) {
  const { t, language } = useLanguage();
  const copy = LOCATION_COPY[language];
  const locationScope = `${userId}:${partnerId || ""}`;
  const currentScope = useRef(locationScope);
  currentScope.current = locationScope;
  const locationRequest = useRef<AbortController | null>(null);
  const [locations, setLocations] = useState<{
    scope: string;
    user: UserLocation | null;
    partner: UserLocation | null;
  } | null>(null);
  const userLocation =
    locations?.scope === locationScope ? locations.user : null;
  const partnerLocation =
    locations?.scope === locationScope ? locations.partner : null;
  const distance =
    userLocation?.location && partnerLocation?.location
      ? calculateDistance(
          userLocation.location.latitude,
          userLocation.location.longitude,
          partnerLocation.location.latitude,
          partnerLocation.location.longitude,
        )
      : null;
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedUserOnline, setDetectedUserOnline] = useState(
    () => navigator.onLine && document.visibilityState === "visible",
  );
  const [detectedPartnerOnline, setDetectedPartnerOnline] = useState(false);
  const userOnline = userOnlineOverride ?? detectedUserOnline;
  const partnerOnline = partnerOnlineOverride ?? detectedPartnerOnline;

  const userInitials =
    userName
      ?.split(" ")
      .map((n) => n[0])
      .join("") || "?";
  const partnerInitials =
    partnerName
      ?.split(" ")
      .map((n) => n[0])
      .join("") || "?";

  const loadLocations = useCallback(async () => {
    if (!partnerId || currentScope.current !== locationScope) return;
    locationRequest.current?.abort();
    const controller = new AbortController();
    locationRequest.current = controller;
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/couple-locations`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        },
      );
      if (!response.ok) return;
      const data = await response.json();
      if (controller.signal.aborted || currentScope.current !== locationScope)
        return;
      setLocations({
        scope: locationScope,
        user: validUserLocation(data.userLocation, userId),
        partner: validUserLocation(data.partnerLocation, partnerId),
      });
    } catch (error) {
      if (!controller.signal.aborted)
        console.error("[DistanceConnector] Failed to load locations:", error);
    }
  }, [userId, partnerId, accessToken, locationScope]);

  useEffect(() => {
    setLocations(null);
    setShowSettings(false);
    setManualCity("");
    void loadLocations();
    return () => {
      locationRequest.current?.abort();
    };
  }, [loadLocations]);

  useEffect(() => {
    // App.tsx owns the single app-wide presence subscription when overrides
    // are supplied. Avoid subscribing twice to the same Realtime topic.
    setDetectedPartnerOnline(false);
    if (
      !partnerId ||
      userOnlineOverride !== undefined ||
      partnerOnlineOverride !== undefined
    )
      return;

    const supabase = createClient();
    const roomId = [userId, partnerId].sort().join(":");
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const syncPresence = () => {
      if (!channel) return;
      const state = channel.presenceState<Record<string, unknown>>();
      setDetectedPartnerOnline(Boolean(state[partnerId]?.length));
    };

    const syncOwnPresence = () => {
      const active = navigator.onLine && document.visibilityState === "visible";
      setDetectedUserOnline(active);
      if (!channel) return;
      const request = active
        ? channel.track({ userId, activeAt: new Date().toISOString() })
        : channel.untrack();
      void request.catch(() => {
        // Presence is an enhancement. Connectivity or browser restrictions
        // must never interrupt the couple dashboard.
      });
    };

    try {
      channel = supabase.channel(`couple-presence:${roomId}`, {
        config: { presence: { key: userId } },
      });
      channel
        .on("presence", { event: "sync" }, syncPresence)
        .on("presence", { event: "join" }, syncPresence)
        .on("presence", { event: "leave" }, syncPresence)
        .subscribe((status) => {
          if (status === "SUBSCRIBED") syncOwnPresence();
        });
    } catch (error) {
      console.warn("[DistanceConnector] Presence unavailable:", error);
      setDetectedPartnerOnline(false);
    }

    window.addEventListener("online", syncOwnPresence);
    window.addEventListener("offline", syncOwnPresence);
    document.addEventListener("visibilitychange", syncOwnPresence);

    return () => {
      window.removeEventListener("online", syncOwnPresence);
      window.removeEventListener("offline", syncOwnPresence);
      document.removeEventListener("visibilitychange", syncOwnPresence);
      if (channel) {
        void channel.untrack().catch(() => undefined);
        void supabase.removeChannel(channel).catch(() => undefined);
      }
    };
  }, [userId, partnerId, userOnlineOverride, partnerOnlineOverride]);

  const handleEnableLiveLocation = async () => {
    if (isLoading || isSubmitting) return;
    setIsLoading(true);
    try {
      const location = await getCurrentLocation();
      if (currentScope.current !== locationScope) return;

      if (!location) {
        toast.error(copy.permissionError);
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/update-location`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location,
            locationType: "live",
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to save location");

      if (currentScope.current !== locationScope) return;
      toast.success(copy.updateSuccess);
      await loadLocations();
      setShowSettings(false);
    } catch (error) {
      console.error("[DistanceConnector] Error enabling live location:", error);
      toast.error(copy.updateError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetManualLocation = async () => {
    if (isLoading || isSubmitting) return;
    if (!manualCity.trim()) {
      toast.error(copy.cityRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      const location = await geocodeCity(manualCity);
      if (currentScope.current !== locationScope) return;

      if (!location) {
        toast.error(copy.cityNotFound);
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/update-location`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location,
            locationType: "manual",
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to save location");

      if (currentScope.current !== locationScope) return;
      toast.success(copy.citySuccess);
      await loadLocations();
      setShowSettings(false);
      setManualCity("");
    } catch (error) {
      console.error(
        "[DistanceConnector] Error setting manual location:",
        error,
      );
      toast.error(copy.cityError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLocation = async () => {
    if (isLoading || isSubmitting) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/update-location`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to remove location");

      if (currentScope.current !== locationScope) return;
      setLocations((current) =>
        current?.scope === locationScope ? { ...current, user: null } : current,
      );
      toast.success(copy.removeSuccess);
      await loadLocations();
      setShowSettings(false);
    } catch (error) {
      console.error("[DistanceConnector] Error removing location:", error);
      toast.error(copy.removeError);
    } finally {
      setIsLoading(false);
    }
  };

  if (!partnerId) return null;

  const embeddedDistanceLabel =
    distance === null
      ? null
      : `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} km`;
  const sameManualCity =
    userLocation?.locationType === "manual" &&
    partnerLocation?.locationType === "manual" &&
    Boolean(userLocation.location?.city?.trim()) &&
    userLocation.location?.city?.trim().toLocaleLowerCase() ===
      partnerLocation.location?.city?.trim().toLocaleLowerCase() &&
    (userLocation.location?.country && partnerLocation.location?.country
      ? userLocation.location.country.trim().toLocaleLowerCase() ===
        partnerLocation.location.country.trim().toLocaleLowerCase()
      : distance === 0);
  const journeyDistance =
    distance === null
      ? "—"
      : sameManualCity
        ? copy.sameCity
        : `≈ ${new Intl.NumberFormat(
            language === "en" ? "en-US" : `${language}-ET`,
            {
              minimumFractionDigits: distance < 10 ? 1 : 0,
              maximumFractionDigits: distance < 10 ? 1 : 0,
            },
          ).format(distance)}`;
  const sharingSource = !userLocation
    ? copy.ownNotShared
    : !partnerLocation
      ? userLocation.locationType === "manual"
        ? copy.ownManual
        : copy.ownDevice
      : userLocation.locationType === "manual" &&
          partnerLocation.locationType === "manual"
        ? copy.bothManual
        : userLocation.locationType === "live" &&
            partnerLocation.locationType === "live"
          ? copy.bothDevice
          : copy.mixedSources;
  const sourceLabel = (entry: UserLocation) =>
    entry.locationType === "manual" ? copy.manual : copy.device;
  const updateLabel = (entry: UserLocation) => {
    if (!entry.updatedAt || !Number.isFinite(Date.parse(entry.updatedAt)))
      return undefined;
    return `${copy.updated}: ${new Intl.DateTimeFormat(
      language === "en" ? "en-GB" : `${language}-ET`,
      {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(new Date(entry.updatedAt))}`;
  };
  const journeyPerson = (
    name: string,
    avatar: string | undefined,
    initials: string,
    online: boolean,
    entry: UserLocation | null,
    isUser = false,
  ) => (
    <div className="distance-journey__person">
      <div
        className={`distance-journey__avatar ${isUser ? "distance-journey__avatar--user" : "distance-journey__avatar--partner"}`}
      >
        <Avatar className="distance-journey__avatar-image">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="distance-journey__initials">
            {initials.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <span
          className={`distance-journey__presence${online ? "" : " distance-journey__presence--offline"}`}
          role="status"
          aria-label={`${name}: ${online ? t.dashboard.online : t.dashboard.offline}`}
          title={`${name}: ${online ? t.dashboard.online : t.dashboard.offline}`}
        />
      </div>
      <strong>
        {name}
        {isUser && <small>{t.mood.you}</small>}
      </strong>
      <p className="distance-journey__city">
        <MapPin aria-hidden="true" />
        <span>
          {entry?.location?.city ||
            (entry ? copy.locationShared : copy.notShared)}
        </span>
      </p>
      {entry?.location?.country && (
        <p className="distance-journey__country">{entry.location.country}</p>
      )}
    </div>
  );

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes arcDash { to { stroke-dashoffset: -180; } }
        @keyframes heartFloat {
          0%   { offset-distance: 0%;   opacity: 0; transform: scale(0.55); }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; transform: scale(0.55); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes loveFlowRight {
          0%   { left: 0%;   opacity: 0; transform: translate3d(0, 7px, 0) scale(0.45) rotate(-12deg); }
          12%  { opacity: 0.8; }
          48%  { transform: translate3d(-50%, -7px, 0) scale(1) rotate(6deg); }
          88%  { opacity: 0.75; }
          100% { left: 100%; opacity: 0; transform: translate3d(-100%, 5px, 0) scale(0.5) rotate(14deg); }
        }
        @keyframes loveFlowLeft {
          0%   { right: 0%;   opacity: 0; transform: translate3d(0, 5px, 0) scale(0.45) rotate(12deg); }
          12%  { opacity: 0.75; }
          52%  { transform: translate3d(50%, -8px, 0) scale(0.95) rotate(-5deg); }
          88%  { opacity: 0.7; }
          100% { right: 100%; opacity: 0; transform: translate3d(100%, 7px, 0) scale(0.5) rotate(-14deg); }
        }
        .love-flow-heart {
          position: absolute;
          display: block;
          line-height: 0;
          transform-origin: center;
          will-change: left, right, transform, opacity;
          -webkit-transform-origin: center;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        @media (prefers-reduced-motion: reduce) {
          .love-flow-heart {
            animation: none !important;
            right: auto !important;
            opacity: 0.42;
            transform: none;
          }
          .love-flow-heart:nth-child(1) { left: 12%; }
          .love-flow-heart:nth-child(2) { left: 31%; }
          .love-flow-heart:nth-child(3) { left: 50%; }
          .love-flow-heart:nth-child(4) { left: 69%; }
          .love-flow-heart:nth-child(5) { left: 86%; }
        }
      `}</style>

      {variant === "journey" ? (
        <section aria-label={copy.coupleLocations} className="distance-journey">
          <div className="distance-journey__places">
            {journeyPerson(
              userName,
              userAvatar,
              userInitials,
              userOnline,
              userLocation,
              true,
            )}
            <div className="distance-journey__connection" aria-hidden="true">
              <span className="distance-journey__connection-line" />
              <span className="distance-journey__connection-heart">
                <Heart />
              </span>
              <span className="distance-journey__connection-line" />
            </div>
            {journeyPerson(
              partnerName,
              partnerAvatar,
              partnerInitials,
              partnerOnline,
              partnerLocation,
            )}
          </div>
          <div
            className="distance-journey__distance"
            role="status"
            aria-live="polite"
          >
            <Route aria-hidden="true" />
            <div>
              <p className="distance-journey__distance-primary">
                <strong>{journeyDistance}</strong>
                {distance !== null && !sameManualCity && (
                  <span>{copy.kmApart}</span>
                )}
              </p>
              <p className="distance-journey__distance-caption">
                {distance === null
                  ? copy.distanceUnavailable
                  : sameManualCity
                    ? copy.cityBaseline
                    : copy.approximate}
              </p>
            </div>
          </div>
          <div className="distance-journey__sharing-footer">
            <span
              title={[
                userLocation &&
                  `${userName}: ${updateLabel(userLocation) || sourceLabel(userLocation)}`,
                partnerLocation &&
                  `${partnerName}: ${updateLabel(partnerLocation) || sourceLabel(partnerLocation)}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            >
              {sharingSource}
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label={t.dashboard.locationSettings}
              title={t.dashboard.locationSettings}
            >
              {t.dashboard.locationSettings} <span aria-hidden="true">↗</span>
            </button>
          </div>
          {!userLocation ? (
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="min-h-11 w-full rounded-xl px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              {t.dashboard.shareLocation}
            </button>
          ) : !partnerLocation ? (
            <p className="text-center text-[10px] leading-4 text-slate-500">
              {t.dashboard.waitingForPartnerLocation}
            </p>
          ) : null}
        </section>
      ) : embedded ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            aria-label={t.dashboard.locationSettings}
            title={t.dashboard.locationSettings}
            className="absolute -right-1 -top-1 z-30 flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Settings className="h-4 w-4" />
          </button>

          <div
            data-testid="love-flow"
            aria-hidden="true"
            className="pointer-events-none absolute left-[25%] right-[25%] top-4 z-20 h-14 overflow-hidden sm:left-[24%] sm:right-[24%]"
          >
            {[
              {
                direction: "right",
                top: 12,
                size: 10,
                duration: 4.8,
                delay: 0,
              },
              {
                direction: "left",
                top: 25,
                size: 8,
                duration: 5.6,
                delay: 1.1,
              },
              {
                direction: "right",
                top: 32,
                size: 7,
                duration: 6.2,
                delay: 2.4,
              },
              { direction: "left", top: 7, size: 6, duration: 5.1, delay: 3.3 },
              {
                direction: "right",
                top: 21,
                size: 6,
                duration: 5.8,
                delay: 4.2,
              },
            ].map((heart, index) => (
              <span
                key={`${heart.direction}-${index}`}
                className="love-flow-heart"
                style={{
                  top: heart.top,
                  width: heart.size,
                  height: heart.size,
                  animation: `loveFlow${heart.direction === "right" ? "Right" : "Left"} ${heart.duration}s ${heart.delay}s ease-in-out infinite`,
                  WebkitAnimation: `loveFlow${heart.direction === "right" ? "Right" : "Left"} ${heart.duration}s ${heart.delay}s ease-in-out infinite`,
                }}
              >
                <Heart className="h-full w-full fill-rose-400 text-rose-400 drop-shadow-[0_2px_3px_rgba(244,63,94,0.25)]" />
              </span>
            ))}
          </div>

          <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] items-start gap-2 px-3 text-center sm:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col items-center">
              <div className="relative">
                {userLocation?.location && (
                  <span className="absolute -inset-1 rounded-full border-2 border-primary-300/50 [animation:pulseRing_2s_ease-out_infinite]" />
                )}
                <Avatar className="relative h-18 w-18 border-4 border-white shadow-xl ring-2 ring-primary-200 sm:h-20 sm:w-20">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-600 text-lg font-semibold text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <PresenceBadge
                  online={userOnline}
                  label={`${userName}: ${userOnline ? t.dashboard.online : t.dashboard.offline}`}
                />
              </div>
              <p className="mt-2 max-w-full truncate text-sm font-semibold text-foreground">
                {userName}
              </p>
              <p className="mt-0.5 flex max-w-full items-center justify-center gap-1 truncate text-[11px] font-medium text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0 text-primary-500" />
                {userLocation?.location?.city || (
                  <span className="font-normal italic">
                    {t.dashboard.locationNotSet}
                  </span>
                )}
              </p>
            </div>

            <div className="flex min-h-28 flex-col items-center justify-start pt-1">
              {centerContent}
              <AnimatePresence>
                {embeddedDistanceLabel && (
                  <motion.div
                    initial={{ scale: 0.75, opacity: 0, y: 4 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.75, opacity: 0 }}
                    className="mt-1 flex items-center gap-1 whitespace-nowrap rounded-full border border-primary-100 bg-white/90 px-2.5 py-1 shadow-[0_4px_14px_rgba(139,92,246,0.14)] backdrop-blur"
                  >
                    <Heart className="h-3 w-3 fill-primary-500 text-primary-500" />
                    <span className="text-xs font-bold text-foreground">
                      {embeddedDistanceLabel}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex min-w-0 flex-col items-center">
              <div className="relative">
                {partnerLocation?.location && (
                  <span className="absolute -inset-1 rounded-full border-2 border-sky-300/50 [animation:pulseRing_2s_ease-out_infinite_0.5s]" />
                )}
                <Avatar className="relative h-18 w-18 border-4 border-white shadow-xl ring-2 ring-sky-200 sm:h-20 sm:w-20">
                  <AvatarImage src={partnerAvatar} alt={partnerName} />
                  <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-600 text-lg font-semibold text-white">
                    {partnerInitials}
                  </AvatarFallback>
                </Avatar>
                <PresenceBadge
                  online={partnerOnline}
                  label={`${partnerName}: ${partnerOnline ? t.dashboard.online : t.dashboard.offline}`}
                />
              </div>
              <p className="mt-2 max-w-full truncate text-sm font-semibold text-foreground">
                {partnerName}
              </p>
              <p className="mt-0.5 flex max-w-full items-center justify-center gap-1 truncate text-[11px] font-medium text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0 text-sky-500" />
                {partnerLocation?.location?.city || (
                  <span className="font-normal italic">
                    {t.dashboard.locationNotSet}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div
            className="mt-1 flex items-center justify-center"
            aria-label={
              embeddedDistanceLabel
                ? `${embeddedDistanceLabel} between you`
                : "Couple distance unavailable"
            }
          >
            {!userLocation?.location ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSettings(true)}
                className="h-8 rounded-xl px-4 text-xs font-semibold"
              >
                <MapPin className="mr-1.5 h-3.5 w-3.5 text-primary-500" />{" "}
                {t.dashboard.shareLocation}
              </Button>
            ) : distance === null ? (
              <span className="text-[10px] italic text-muted-foreground">
                {t.dashboard.waitingForPartnerLocation}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "var(--card)",
            boxShadow:
              "0 2px 0 0 var(--neutral-200), 0 12px 32px -6px rgba(244,63,94,0.12), 0 4px 8px -2px rgba(0,0,0,0.06)",
          }}
        >
          {/* Radial ambient glow — directs focus to avatars */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              style={{
                position: "absolute",
                top: "10%",
                left: "8%",
                width: 120,
                height: 120,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(244,63,94,0.18) 0%, transparent 70%)",
                filter: "blur(12px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "10%",
                right: "8%",
                width: 120,
                height: 120,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(14,165,233,0.16) 0%, transparent 70%)",
                filter: "blur(12px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 160,
                height: 60,
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
          </div>

          <div className="relative z-10 p-5">
            {/* Settings button — ghost, no border */}
            <button
              onClick={() => setShowSettings(true)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
              style={{
                color: "var(--muted-foreground)",
                background: "transparent",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--neutral-100)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              {/* Arc connector row */}
              <div className="relative flex items-center justify-between px-3 mt-4">
                {/* User avatar with pulsing ring */}
                <div className="relative">
                  {userLocation?.location && (
                    <div
                      style={{
                        position: "absolute",
                        inset: -4,
                        borderRadius: "50%",
                        border: "2px solid rgba(244,63,94,0.35)",
                        animation: "pulseRing 2s ease-out infinite",
                      }}
                    />
                  )}
                  <Avatar
                    className="w-16 h-16 z-10 relative"
                    style={{
                      border: "3px solid var(--card)",
                      boxShadow: "0 4px 12px rgba(244,63,94,0.25)",
                    }}
                  >
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback
                      style={{
                        background:
                          "linear-gradient(135deg, var(--primary-400), var(--primary-600))",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    >
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <PresenceBadge
                    online={userOnline}
                    label={`${userName}: ${userOnline ? t.dashboard.online : t.dashboard.offline}`}
                  />
                </div>

                {/* Bezier arc SVG canvas */}
                <div className="absolute left-[4.5rem] right-[4.5rem] top-0 bottom-0 flex items-center justify-center">
                  {/* Distance badge floating above arc midpoint */}
                  <AnimatePresence>
                    {distance !== null && (
                      <motion.div
                        initial={{ scale: 0.7, opacity: 0, y: 6 }}
                        animate={{ scale: 1, opacity: 1, y: -14 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        className="absolute z-20 flex items-center gap-1 px-2.5 py-1 rounded-full"
                        style={{
                          background: "var(--card)",
                          boxShadow:
                            "0 2px 8px rgba(139,92,246,0.18), 0 1px 3px rgba(0,0,0,0.08)",
                          border: "1px solid rgba(139,92,246,0.15)",
                        }}
                      >
                        <Heart
                          className="w-3 h-3"
                          style={{
                            fill: "var(--primary-500)",
                            color: "var(--primary-500)",
                          }}
                        />
                        <span
                          className="text-xs font-bold"
                          style={{
                            color: "var(--foreground)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {formatDistance(distance)}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <svg
                    className="w-full overflow-visible"
                    style={{ height: 48 }}
                    viewBox="0 0 200 48"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="arcGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="var(--primary-400)" />
                        <stop offset="48%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="var(--secondary-400)" />
                      </linearGradient>
                      <path id="arcPath" d="M 4 40 Q 100 4, 196 40" />
                    </defs>

                    {/* Faint base arc */}
                    <use
                      href="#arcPath"
                      stroke="url(#arcGrad)"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.25"
                    />

                    {/* Animated dashed pulse */}
                    <use
                      href="#arcPath"
                      stroke="url(#arcGrad)"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="22 180"
                      style={{
                        animation: "arcDash 3s linear infinite",
                        strokeDashoffset: 0,
                      }}
                    />

                    {/* Traveling hearts via offset-path */}
                    {distance !== null &&
                      [0, 1.1, 2.2].map((delay, i) => (
                        <g
                          key={i}
                          style={{
                            offsetPath: 'path("M 4 40 Q 100 4, 196 40")',
                            offsetDistance: "0%",
                            animation: `heartFloat 3s ${delay}s linear infinite`,
                          }}
                        >
                          <circle
                            cx="0"
                            cy="0"
                            r="4"
                            fill="var(--primary-500)"
                            opacity="0.9"
                          />
                        </g>
                      ))}
                  </svg>
                </div>

                {/* Partner avatar with pulsing ring */}
                <div className="relative">
                  {partnerLocation?.location && (
                    <div
                      style={{
                        position: "absolute",
                        inset: -4,
                        borderRadius: "50%",
                        border: "2px solid rgba(14,165,233,0.35)",
                        animation: "pulseRing 2s ease-out infinite 0.5s",
                      }}
                    />
                  )}
                  <Avatar
                    className="w-16 h-16 z-10 relative"
                    style={{
                      border: "3px solid var(--card)",
                      boxShadow: "0 4px 12px rgba(14,165,233,0.22)",
                    }}
                  >
                    <AvatarImage src={partnerAvatar} alt={partnerName} />
                    <AvatarFallback
                      style={{
                        background:
                          "linear-gradient(135deg, var(--secondary-400), var(--secondary-600))",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    >
                      {partnerInitials}
                    </AvatarFallback>
                  </Avatar>
                  <PresenceBadge
                    online={partnerOnline}
                    label={`${partnerName}: ${partnerOnline ? t.dashboard.online : t.dashboard.offline}`}
                  />
                </div>
              </div>

              {/* Names / status footer */}
              <div className="grid grid-cols-3 items-center text-center px-1 pt-1">
                <p
                  className="text-left text-xs font-semibold truncate"
                  style={{ color: "var(--foreground)" }}
                >
                  {userLocation?.location?.city || (
                    <span
                      style={{
                        color: "var(--muted-foreground)",
                        fontStyle: "italic",
                      }}
                    >
                      Not set
                    </span>
                  )}
                </p>
                <div className="flex justify-center">
                  {distance !== null ? (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                      style={{
                        background: "var(--primary-50)",
                        color: "var(--primary-600)",
                        border: "1px solid var(--primary-200)",
                      }}
                    >
                      {getDistanceDescription(distance) || "Connected"}
                    </span>
                  ) : (
                    <span
                      className="text-[10px]"
                      style={{
                        color: "var(--muted-foreground)",
                        fontStyle: "italic",
                      }}
                    >
                      Awaiting location
                    </span>
                  )}
                </div>
                <p
                  className="text-right text-xs font-semibold truncate"
                  style={{ color: "var(--foreground)" }}
                >
                  {partnerLocation?.location?.city || (
                    <span
                      style={{
                        color: "var(--muted-foreground)",
                        fontStyle: "italic",
                      }}
                    >
                      Not set
                    </span>
                  )}
                </p>
              </div>

              {!userLocation?.location && (
                <div className="text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSettings(true)}
                    className="text-xs font-semibold h-8 px-4 rounded-xl"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  >
                    <MapPin
                      className="w-3.5 h-3.5 mr-1.5"
                      style={{ color: "var(--primary-500)" }}
                    />
                    Share Your Location
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Control Panel Dialog Settings */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md rounded-2xl p-5 border-none shadow-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
              <MapPin className="w-5 h-5 text-rose-500" />
              {copy.settings}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {copy.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {userLocation?.location && (
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 h-8 w-8">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {copy.savedLocation}
                  </h4>
                  <p className="text-sm font-semibold text-slate-950 mt-0.5">
                    {userLocation.location.city}
                    {userLocation.location.country
                      ? `, ${userLocation.location.country}`
                      : ""}
                  </p>
                  <span className="inline-block text-[10px] bg-white border border-emerald-200 text-emerald-700 font-bold px-1.5 py-0.5 rounded mt-1.5">
                    {sourceLabel(userLocation)}
                  </span>
                  {updateLabel(userLocation) && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      {updateLabel(userLocation)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* GPS Link Option */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-rose-600" />
                {copy.deviceHeading}
              </h4>
              <p className="text-xs leading-5 text-slate-500">
                {copy.deviceHint}
              </p>
              <Button
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs min-h-11 rounded-xl shadow-sm"
                onClick={handleEnableLiveLocation}
                disabled={isLoading || isSubmitting}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {copy.locating}
                  </>
                ) : (
                  copy.deviceButton
                )}
              </Button>
            </div>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold text-slate-400 uppercase">
                <span className="bg-white px-2">{copy.or}</span>
              </div>
            </div>

            {/* Manual Entry Column */}
            <div className="space-y-2">
              <Label
                htmlFor="manual-city"
                className="font-bold text-xs text-slate-900 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                {copy.manualHeading}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="manual-city"
                  placeholder={copy.cityPlaceholder}
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  disabled={isLoading || isSubmitting}
                  className="min-h-11 text-xs border-slate-200 focus:border-rose-500 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSetManualLocation();
                  }}
                />
                <Button
                  variant="outline"
                  onClick={handleSetManualLocation}
                  disabled={isLoading || isSubmitting || !manualCity.trim()}
                  className="min-h-11 text-xs font-bold px-4 border-slate-200 rounded-xl whitespace-nowrap"
                >
                  {isSubmitting ? copy.searching : copy.set}
                </Button>
              </div>
            </div>

            {/* Disconnect Location Node */}
            {userLocation?.location && (
              <Button
                variant="ghost"
                className="w-full text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 min-h-11 rounded-xl border border-transparent hover:border-rose-100"
                onClick={handleRemoveLocation}
                disabled={isLoading || isSubmitting}
              >
                {copy.remove}
              </Button>
            )}

            <p className="text-[10px] text-slate-400 text-center font-medium pt-1">
              {copy.privacy}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PresenceBadge({
  online,
  label,
  compact = false,
}: {
  online: boolean;
  label: string;
  compact?: boolean;
}) {
  const Icon = online ? Wifi : WifiOff;
  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className={`absolute -bottom-0.5 -right-0.5 z-20 flex items-center justify-center rounded-full border-white shadow-sm transition-colors duration-300 ${compact ? "h-4 w-4 border-2" : "h-6 w-6 border-[3px]"} ${online ? "bg-emerald-500" : "bg-slate-400"}`}
    >
      <Icon
        className={compact ? "h-2 w-2 text-white" : "h-2.5 w-2.5 text-white"}
        strokeWidth={3}
      />
    </span>
  );
}
