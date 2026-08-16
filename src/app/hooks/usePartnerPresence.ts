import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

const ANNOUNCEMENT_COOLDOWN_MS = 30 * 60 * 1000;
const INCOMING_COOLDOWN_MS = 30 * 1000;

interface PartnerPresenceOptions {
  userId?: string | null;
  userName?: string | null;
  partnerId?: string | null;
  partnerName?: string | null;
  accessToken?: string | null;
  shareOnlineStatus?: boolean;
  notifyOnPartnerOnline?: boolean;
  sendPartnerNotification?: boolean;
}

export function shouldNotifyPartnerOnline(
  hasInitialSync: boolean,
  wasOnline: boolean,
  isOnline: boolean,
) {
  return hasInitialSync && !wasOnline && isOnline;
}

function claimCooldown(key: string, cooldownMs: number) {
  try {
    const lastClaim = Number(localStorage.getItem(key) || 0);
    const now = Date.now();
    if (now - lastClaim < cooldownMs) return false;
    localStorage.setItem(key, String(now));
    return true;
  } catch {
    return true;
  }
}

async function showSystemNotification(partnerId: string, partnerName: string) {
  if (
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted' ||
    !('serviceWorker' in navigator)
  ) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(`${partnerName} is online`, {
      body: 'Your partner is active on TwoBeOne now.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `partner-online-${partnerId}`,
      data: { type: 'partner_online', url: '/' },
    });
  } catch (error) {
    console.warn('[Presence] System notification unavailable:', error);
  }
}

export function usePartnerPresence({
  userId,
  userName,
  partnerId,
  partnerName,
  accessToken,
  shareOnlineStatus = true,
  notifyOnPartnerOnline = true,
  sendPartnerNotification = true,
}: PartnerPresenceOptions) {
  const [partnerOnline, setPartnerOnline] = useState(false);
  const partnerOnlineRef = useRef(false);
  const hasInitialSyncRef = useRef(false);

  useEffect(() => {
    if (!userId || !partnerId || !accessToken) {
      partnerOnlineRef.current = false;
      hasInitialSyncRef.current = false;
      setPartnerOnline(false);
      return;
    }

    const supabase = createClient();
    const roomId = [userId, partnerId].sort().join(':');
    const resolvedUserName = userName?.trim() || 'Your partner';
    const resolvedPartnerName = partnerName?.trim() || 'Your partner';
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const notifyPartnerIsOnline = () => {
      if (!notifyOnPartnerOnline) return;
      const cooldownKey = `twobeone:partner-online-received:${userId}:${partnerId}`;
      if (!claimCooldown(cooldownKey, INCOMING_COOLDOWN_MS)) return;

      toast.success(`${resolvedPartnerName} is online`, {
        description: 'Your partner is active on TwoBeOne now.',
        duration: 6000,
      });
      void showSystemNotification(partnerId, resolvedPartnerName);
    };

    const syncPartnerPresence = () => {
      if (!channel) return;
      const state = channel.presenceState<Record<string, unknown>>();
      const isOnline = Boolean(state[partnerId]?.length);
      const shouldNotify = shouldNotifyPartnerOnline(
        hasInitialSyncRef.current,
        partnerOnlineRef.current,
        isOnline,
      );

      partnerOnlineRef.current = isOnline;
      setPartnerOnline(isOnline);
      if (shouldNotify) notifyPartnerIsOnline();
      hasInitialSyncRef.current = true;
    };

    const announceOwnPresence = async () => {
      if (!sendPartnerNotification) return;
      const cooldownKey = `twobeone:partner-online-sent:${userId}:${partnerId}`;
      if (!claimCooldown(cooldownKey, ANNOUNCEMENT_COOLDOWN_MS)) return;

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/send-push-to-partner`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: `${resolvedUserName} is online`,
              body: 'Your partner is active on TwoBeOne now.',
              data: {
                type: 'partner_online',
                url: '/',
                tag: `partner-online-${userId}`,
              },
            }),
          },
        );
        if (!response.ok) {
          console.warn('[Presence] Partner push was not delivered:', response.status);
        }
      } catch (error) {
        console.warn('[Presence] Partner push unavailable:', error);
      }
    };

    const syncOwnPresence = () => {
      if (!channel) return;
      const active = shareOnlineStatus && navigator.onLine && document.visibilityState === 'visible';
      const request = active
        ? channel.track({ userId, userName: resolvedUserName, onlineAt: new Date().toISOString() })
        : channel.untrack();

      void request
        .then(() => {
          if (active) void announceOwnPresence();
        })
        .catch(() => {
          // Presence must never interrupt normal app use.
        });
    };

    try {
      channel = supabase.channel(`couple-presence:${roomId}`, {
        config: { presence: { key: userId } },
      });
      channel
        .on('presence', { event: 'sync' }, syncPartnerPresence)
        .on('presence', { event: 'join' }, syncPartnerPresence)
        .on('presence', { event: 'leave' }, syncPartnerPresence)
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            hasInitialSyncRef.current = false;
            syncOwnPresence();
          }
        });
    } catch (error) {
      console.warn('[Presence] Realtime unavailable:', error);
    }

    window.addEventListener('online', syncOwnPresence);
    window.addEventListener('offline', syncOwnPresence);
    document.addEventListener('visibilitychange', syncOwnPresence);

    return () => {
      window.removeEventListener('online', syncOwnPresence);
      window.removeEventListener('offline', syncOwnPresence);
      document.removeEventListener('visibilitychange', syncOwnPresence);
      partnerOnlineRef.current = false;
      hasInitialSyncRef.current = false;
      setPartnerOnline(false);
      if (channel) {
        void channel.untrack().catch(() => undefined);
        void supabase.removeChannel(channel).catch(() => undefined);
      }
    };
  }, [
    accessToken,
    notifyOnPartnerOnline,
    partnerId,
    partnerName,
    sendPartnerNotification,
    shareOnlineStatus,
    userId,
    userName,
  ]);

  return { partnerOnline };
}
