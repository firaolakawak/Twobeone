import { useUiCopy } from '../utils/uiTranslation';
import { LoadingMark } from './BrandLoader';
import { profileUiMessages } from '../locales/profileUi';
import { useState, useEffect, type ReactNode } from "react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "./ui/avatar";
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
  Settings,
  Check,
  X,
  Heart,
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
import { CoupleAvatarStack, PresenceDot } from "./CoupleAvatarStack";
import { CoupleNameHeading } from "./CoupleMoodHeading";

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
  summaryContent?: (distanceKm: number | null) => ReactNode;
  partnerMood?: ReactNode;
}

interface UserLocation {
  userId: string;
  location: Location | null;
  locationType: "live" | "manual" | null;
  updatedAt?: string;
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
  summaryContent,
  partnerMood,
}: DistanceConnectorProps) {
  const tr = useUiCopy(profileUiMessages);
  const { t } = useLanguage();
  const [userLocation, setUserLocation] =
    useState<UserLocation | null>(null);
  const [partnerLocation, setPartnerLocation] =
    useState<UserLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
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

  useEffect(() => {
    loadLocations();
  }, [userId, partnerId]);

  useEffect(() => {
    // App.tsx owns the single app-wide presence subscription when overrides
    // are supplied. Avoid subscribing twice to the same Realtime topic.
    if (!partnerId || userOnlineOverride !== undefined || partnerOnlineOverride !== undefined) return;

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

  useEffect(() => {
    if (userLocation?.location && partnerLocation?.location) {
      const dist = calculateDistance(
        userLocation.location.latitude,
        userLocation.location.longitude,
        partnerLocation.location.latitude,
        partnerLocation.location.longitude,
      );
      setDistance(dist);
    } else {
      setDistance(null);
    }
  }, [userLocation, partnerLocation]);

  const loadLocations = async () => {
    if (!partnerId) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/couple-locations`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setUserLocation(data.userLocation || null);
        setPartnerLocation(data.partnerLocation || null);
      }
    } catch (error) {
      console.error(
        "[DistanceConnector] Failed to load locations:",
        error,
      );
    }
  };

  const handleEnableLiveLocation = async () => {
    setIsLoading(true);
    try {
      const location = await getCurrentLocation();

      if (!location) {
        toast.error(
          tr("Unable to get your location. Please check permissions."),
        );
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

      if (!response.ok)
        throw new Error(tr("Failed to save location"));

      const locationText = location.city
        ? `${location.city}${location.country ? ", " + location.country : ""}`
        : tr("your location");

      toast.success(tr('📍 Location updated to {location}', { location: locationText }));
      await loadLocations();
      setShowSettings(false);
    } catch (error) {
      console.error(
        "[DistanceConnector] Error enabling live location:",
        error,
      );
      toast.error(tr("Failed to enable live location"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetManualLocation = async () => {
    if (!manualCity.trim()) {
      toast.error(tr("Please enter a city name"));
      return;
    }

    setIsSubmitting(true);
    try {
      const location = await geocodeCity(manualCity);

      if (!location) {
        toast.error(
          tr("City not found. Please try a different name."),
        );
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

      if (!response.ok)
        throw new Error(tr("Failed to save location"));

      const locationText = location.city
        ? `${location.city}${location.country ? ", " + location.country : ""}`
        : manualCity;

      toast.success(tr('📍 Location set to {location}', { location: locationText }));
      await loadLocations();
      setShowSettings(false);
      setManualCity("");
    } catch (error) {
      console.error(
        "[DistanceConnector] Error setting manual location:",
        error,
      );
      toast.error(tr("Failed to set location"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLocation = async () => {
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

      if (!response.ok)
        throw new Error(tr("Failed to remove location"));

      toast.success(tr("Location removed"));
      await loadLocations();
      setShowSettings(false);
    } catch (error) {
      console.error(
        "[DistanceConnector] Error removing location:",
        error,
      );
      toast.error(tr("Failed to remove location"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!partnerId) return null;

  const embeddedDistanceLabel = distance === null
    ? null
    : `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} km`;

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
      `}</style>

      {embedded ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            aria-label={t.dashboard.locationSettings}
            title={t.dashboard.locationSettings}
            className="absolute -right-2 -top-4 z-30 flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <Settings className="h-4 w-4" />
          </button>

          <div className="couple-hero-intro flex items-center justify-between gap-4 sm:gap-6">
            <CoupleNameHeading userName={userName} partnerName={partnerName} partnerMood={partnerMood} />
            <CoupleAvatarStack
              userName={userName}
              userAvatar={userAvatar}
              userOnline={userOnline}
              partnerName={partnerName}
              partnerAvatar={partnerAvatar}
              partnerOnline={partnerOnline}
            />
          </div>

          {summaryContent ? summaryContent(distance) : embeddedDistanceLabel && (
            <p className="tbo-supporting mt-5 text-muted-foreground">{embeddedDistanceLabel}</p>
          )}

          {(!userLocation?.location || distance === null) && <div className="mt-3 flex items-center">
            {!userLocation?.location ? (
              <Button size="sm" variant="outline" onClick={() => setShowSettings(true)} className="h-auto min-h-9 whitespace-normal rounded-xl px-4 py-2">
                <MapPin className="mr-1.5 h-3.5 w-3.5 text-rose-500" /> {t.dashboard.shareLocation}
              </Button>
            ) : distance === null ? (
              <span className="tbo-caption italic text-muted-foreground">{t.dashboard.waitingForPartnerLocation}</span>
            ) : null}
          </div>}
        </div>
      ) : (
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: 'var(--card)',
          boxShadow: '0 2px 0 0 var(--neutral-200), 0 12px 32px -6px rgba(244,63,94,0.12), 0 4px 8px -2px rgba(0,0,0,0.06)',
        }}
      >
        {/* Radial ambient glow — directs focus to avatars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{
            position: 'absolute', top: '10%', left: '8%',
            width: 120, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,63,94,0.18) 0%, transparent 70%)',
            filter: 'blur(12px)',
          }} />
          <div style={{
            position: 'absolute', top: '10%', right: '8%',
            width: 120, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.16) 0%, transparent 70%)',
            filter: 'blur(12px)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: 160, height: 60, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }} />
        </div>

        <div className="relative z-10 p-5">
          {/* Settings button — ghost, no border */}
          <button
            onClick={() => setShowSettings(true)}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: 'var(--muted-foreground)', background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--neutral-100)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="space-y-4">
            {/* Arc connector row */}
            <div className="relative flex items-center justify-between px-3 mt-4">

              {/* User avatar with pulsing ring */}
              <div className="relative">
                {userLocation?.location && (
                  <div style={{
                    position: 'absolute', inset: -4, borderRadius: '50%',
                    border: '2px solid rgba(244,63,94,0.35)',
                    animation: 'pulseRing 2s ease-out infinite',
                  }} />
                )}
                <Avatar className="w-16 h-16 z-10 relative" style={{ border: '3px solid var(--card)', boxShadow: '0 4px 12px rgba(244,63,94,0.25)' }}>
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))', color: '#fff', fontWeight: 600 }}>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <PresenceDot online={userOnline} label={`${userName}: ${userOnline ? t.dashboard.online : t.dashboard.offline}`} />
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
                        background: 'var(--card)',
                        boxShadow: '0 2px 8px rgba(139,92,246,0.18), 0 1px 3px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(139,92,246,0.15)',
                      }}
                    >
                      <Heart className="w-3 h-3" style={{ fill: 'var(--primary-500)', color: 'var(--primary-500)' }} />
                      <span className="tbo-caption" style={{ color: 'var(--foreground)' }}>
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
                    <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--primary-400)" />
                      <stop offset="48%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="var(--secondary-400)" />
                    </linearGradient>
                    <path id="arcPath" d="M 4 40 Q 100 4, 196 40" />
                  </defs>

                  {/* Faint base arc */}
                  <use href="#arcPath" stroke="url(#arcGrad)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.25" />

                  {/* Animated dashed pulse */}
                  <use href="#arcPath" stroke="url(#arcGrad)" strokeWidth="2" fill="none" strokeLinecap="round"
                    strokeDasharray="22 180"
                    style={{ animation: 'arcDash 3s linear infinite', strokeDashoffset: 0 }} />

                  {/* Traveling hearts via offset-path */}
                  {distance !== null && [0, 1.1, 2.2].map((delay, i) => (
                    <g key={i} style={{
                      offsetPath: 'path("M 4 40 Q 100 4, 196 40")',
                      offsetDistance: '0%',
                      animation: `heartFloat 3s ${delay}s linear infinite`,
                    }}>
                      <circle cx="0" cy="0" r="4" fill="var(--primary-500)" opacity="0.9" />
                    </g>
                  ))}
                </svg>
              </div>

              {/* Partner avatar with pulsing ring */}
              <div className="relative">
                {partnerLocation?.location && (
                  <div style={{
                    position: 'absolute', inset: -4, borderRadius: '50%',
                    border: '2px solid rgba(14,165,233,0.35)',
                    animation: 'pulseRing 2s ease-out infinite 0.5s',
                  }} />
                )}
                <Avatar className="w-16 h-16 z-10 relative" style={{ border: '3px solid var(--card)', boxShadow: '0 4px 12px rgba(14,165,233,0.22)' }}>
                  <AvatarImage src={partnerAvatar} alt={partnerName} />
                  <AvatarFallback style={{ background: 'linear-gradient(135deg, var(--secondary-400), var(--secondary-600))', color: '#fff', fontWeight: 600 }}>
                    {partnerInitials}
                  </AvatarFallback>
                </Avatar>
                <PresenceDot online={partnerOnline} label={`${partnerName}: ${partnerOnline ? t.dashboard.online : t.dashboard.offline}`} />
              </div>
            </div>

            {/* Names / status footer */}
            <div className="grid grid-cols-3 items-center text-center px-1 pt-1">
              <p className="tbo-label text-left break-words" style={{ color: 'var(--foreground)' }}>
                {userLocation?.location?.city || <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{tr("Not set")}</span>}
              </p>
              <div className="flex justify-center">
                {distance !== null ? (
                  <span className="tbo-caption px-2.5 py-0.5 rounded-full"
                    style={{ background: 'var(--primary-50)', color: 'var(--primary-600)', border: '1px solid var(--primary-200)' }}>
                    {getDistanceDescription(distance) || tr("Connected")}
                  </span>
                ) : (
                  <span className="tbo-caption" style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>

                    {tr("Awaiting location")}
                  </span>
                )}
              </div>
              <p className="tbo-label text-right break-words" style={{ color: 'var(--foreground)' }}>
                {partnerLocation?.location?.city || <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{tr("Not set")}</span>}
              </p>
            </div>

            {!userLocation?.location && (
              <div className="text-center">
                <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}
                  className="h-auto min-h-9 whitespace-normal px-4 py-2 rounded-xl"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                  <MapPin className="w-3.5 h-3.5 mr-1.5" style={{ color: 'var(--primary-500)' }} />

                  {tr("Share Your Location")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Control Panel Dialog Settings */}
      <Dialog
        open={showSettings}
        onOpenChange={setShowSettings}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl p-5 border-none shadow-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-950">
              <MapPin className="w-5 h-5 text-rose-500" />

              {tr("Location Settings")}
            </DialogTitle>
            <DialogDescription className="text-slate-500">

              {tr("Share your location region with your partner to calculate distances.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {userLocation?.location && (
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 h-8 w-8">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                </div>
                <div className="min-w-0 break-words">
                  <h4 className="tbo-label text-slate-900">

                    {tr("Active Location Baseline")}
                  </h4>
                  <p className="tbo-body text-slate-950 mt-0.5">
                    {userLocation.location.city}
                    {userLocation.location.country
                      ? `, ${userLocation.location.country}`
                      : ""}
                  </p>
                  <span className="tbo-caption inline-block bg-white border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded mt-1.5">
                    {userLocation.locationType === "live"
                      ? tr("📍 GPS LIVE Mode")
                      : tr("📌 Manual Entry")}
                  </span>
                </div>
              </div>
            )}

            {/* GPS Link Option */}
            <div className="space-y-1.5">
              <h4 className="tbo-label text-slate-900 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-purple-600" />

                {tr("Automatic Device GPS")}
              </h4>
              <Button
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-auto min-h-9 whitespace-normal py-2 rounded-xl shadow-sm"
                onClick={handleEnableLiveLocation}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingMark className="mr-2" />

                    {tr("Acquiring satellite data...")}
                  </>
                ) : (
                  tr("Sync Live Location")
                )}
              </Button>
            </div>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="tbo-caption relative flex justify-center text-slate-400">
                <span className="bg-white px-2">{tr("Or")}</span>
              </div>
            </div>

            {/* Manual Entry Column */}
            <div className="space-y-2">
              <h4 className="tbo-label text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />

                {tr("Manual City Input")}
              </h4>
              <div className="flex gap-2">
                <Input
                  id="manual-city"
                  placeholder={tr("e.g., Abu Dhabi, UAE")}
                  value={manualCity}
                  onChange={(e) =>
                    setManualCity(e.target.value)
                  }
                  className="h-9 border-slate-200 focus:border-purple-500 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleSetManualLocation();
                  }}
                />
                <Button
                  variant="outline"
                  onClick={handleSetManualLocation}
                  disabled={isSubmitting || !manualCity.trim()}
                  className="h-auto min-h-9 px-4 py-2 border-slate-200 rounded-xl whitespace-normal"
                >
                  {isSubmitting && <LoadingMark />}
                  {isSubmitting ? tr("Searching...") : tr("Set")}
                </Button>
              </div>
            </div>

            {/* Disconnect Location Node */}
            {userLocation?.location && (
              <Button
                variant="ghost"
                className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-auto min-h-9 whitespace-normal py-2 rounded-xl border border-transparent hover:border-rose-100"
                onClick={handleRemoveLocation}
                disabled={isLoading}
              >

                {tr("Clear Location History")}
              </Button>
            )}

            <p className="tbo-caption text-slate-400 text-center pt-1">

              {tr("🔒 Private: Location records are shared only within your connected partnership.")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
