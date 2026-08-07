import { useState, useEffect } from "react";
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
  Loader2,
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

interface DistanceConnectorProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  partnerId?: string;
  partnerName: string;
  partnerAvatar?: string;
  accessToken: string;
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
}: DistanceConnectorProps) {
  const [userLocation, setUserLocation] =
    useState<UserLocation | null>(null);
  const [partnerLocation, setPartnerLocation] =
    useState<UserLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          "Unable to get your location. Please check permissions.",
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
        throw new Error("Failed to save location");

      const locationText = location.city
        ? `${location.city}${location.country ? ", " + location.country : ""}`
        : "your location";

      toast.success(`📍 Location updated to ${locationText}`);
      await loadLocations();
      setShowSettings(false);
    } catch (error) {
      console.error(
        "[DistanceConnector] Error enabling live location:",
        error,
      );
      toast.error("Failed to enable live location");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetManualLocation = async () => {
    if (!manualCity.trim()) {
      toast.error("Please enter a city name");
      return;
    }

    setIsSubmitting(true);
    try {
      const location = await geocodeCity(manualCity);

      if (!location) {
        toast.error(
          "City not found. Please try a different name.",
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
        throw new Error("Failed to save location");

      const locationText = location.city
        ? `${location.city}${location.country ? ", " + location.country : ""}`
        : manualCity;

      toast.success(`📍 Location set to ${locationText}`);
      await loadLocations();
      setShowSettings(false);
      setManualCity("");
    } catch (error) {
      console.error(
        "[DistanceConnector] Error setting manual location:",
        error,
      );
      toast.error("Failed to set location");
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
        throw new Error("Failed to remove location");

      toast.success("Location removed");
      await loadLocations();
      setShowSettings(false);
    } catch (error) {
      console.error(
        "[DistanceConnector] Error removing location:",
        error,
      );
      toast.error("Failed to remove location");
    } finally {
      setIsLoading(false);
    }
  };

  if (!partnerId) return null;

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
                {userLocation?.location && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center z-20"
                    style={{ background: 'var(--success-500)', borderColor: 'var(--card)' }}>
                    <MapPin className="w-2.5 h-2.5" style={{ color: '#fff' }} />
                  </div>
                )}
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
                      <span className="text-xs font-bold" style={{ color: 'var(--foreground)', letterSpacing: '-0.01em' }}>
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
                {partnerLocation?.location && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center z-20"
                    style={{ background: 'var(--success-500)', borderColor: 'var(--card)' }}>
                    <MapPin className="w-2.5 h-2.5" style={{ color: '#fff' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Names / status footer */}
            <div className="grid grid-cols-3 items-center text-center px-1 pt-1">
              <p className="text-left text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                {userLocation?.location?.city || <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Not set</span>}
              </p>
              <div className="flex justify-center">
                {distance !== null ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                    style={{ background: 'var(--primary-50)', color: 'var(--primary-600)', border: '1px solid var(--primary-200)' }}>
                    {getDistanceDescription(distance) || 'Connected'}
                  </span>
                ) : (
                  <span className="text-[10px]" style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                    Awaiting location
                  </span>
                )}
              </div>
              <p className="text-right text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                {partnerLocation?.location?.city || <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Not set</span>}
              </p>
            </div>

            {!userLocation?.location && (
              <div className="text-center">
                <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}
                  className="text-xs font-semibold h-8 px-4 rounded-xl"
                  style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                  <MapPin className="w-3.5 h-3.5 mr-1.5" style={{ color: 'var(--primary-500)' }} />
                  Share Your Location
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Panel Dialog Settings */}
      <Dialog
        open={showSettings}
        onOpenChange={setShowSettings}
      >
        <DialogContent className="max-w-md rounded-2xl p-5 border-none shadow-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
              <MapPin className="w-5 h-5 text-rose-500" />
              Location Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Share your location region with your partner to
              calculate distances.
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
                    Active Location Baseline
                  </h4>
                  <p className="text-sm font-semibold text-slate-950 mt-0.5">
                    {userLocation.location.city}
                    {userLocation.location.country
                      ? `, ${userLocation.location.country}`
                      : ""}
                  </p>
                  <span className="inline-block text-[10px] bg-white border border-emerald-200 text-emerald-700 font-bold px-1.5 py-0.5 rounded mt-1.5">
                    {userLocation.locationType === "live"
                      ? "📍 GPS LIVE Mode"
                      : "📌 Manual Entry"}
                  </span>
                </div>
              </div>
            )}

            {/* GPS Link Option */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-purple-600" />
                Automatic Device GPS
              </h4>
              <Button
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 rounded-xl shadow-sm"
                onClick={handleEnableLiveLocation}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Acquiring satellite data...
                  </>
                ) : (
                  "Sync Live Location"
                )}
              </Button>
            </div>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold text-slate-400 uppercase">
                <span className="bg-white px-2">Or</span>
              </div>
            </div>

            {/* Manual Entry Column */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Manual City Input
              </h4>
              <div className="flex gap-2">
                <Input
                  id="manual-city"
                  placeholder="e.g., Abu Dhabi, UAE"
                  value={manualCity}
                  onChange={(e) =>
                    setManualCity(e.target.value)
                  }
                  className="h-9 text-xs border-slate-200 focus:border-purple-500 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleSetManualLocation();
                  }}
                />
                <Button
                  variant="outline"
                  onClick={handleSetManualLocation}
                  disabled={isSubmitting || !manualCity.trim()}
                  className="h-9 text-xs font-bold px-4 border-slate-200 rounded-xl whitespace-nowrap"
                >
                  {isSubmitting ? "Searching..." : "Set"}
                </Button>
              </div>
            </div>

            {/* Disconnect Location Node */}
            {userLocation?.location && (
              <Button
                variant="ghost"
                className="w-full text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9 rounded-xl border border-transparent hover:border-rose-100"
                onClick={handleRemoveLocation}
                disabled={isLoading}
              >
                Clear Location History
              </Button>
            )}

            <p className="text-[10px] text-slate-400 text-center font-medium pt-1">
              🔒 Private: Location records are shared only
              within your connected partnership.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}