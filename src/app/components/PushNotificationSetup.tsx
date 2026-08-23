import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Bell, BellOff, Check, X, Smartphone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';
import { pushSubscriptionMatchesCurrentKey, requestNotificationPermission, subscribeToPushNotifications, VAPID_PUBLIC_KEY } from '../utils/pwa';
import { projectId } from '../utils/supabase/info';
import { isApkUrlEnvironment } from '../utils/appShell';

interface PushNotificationSetupProps {
  userId: string;
  accessToken: string;
  onComplete?: () => void;
  reminderOnly?: boolean;
}

export function PushNotificationSetup({ userId, accessToken, onComplete, reminderOnly = false }: PushNotificationSetupProps) {
  const { t } = useLanguage();
  const isApkUrl = isApkUrlEnvironment();
  const [showDialog, setShowDialog] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isApkUrl) return;
    checkNotificationStatus();
  }, [isApkUrl]);

  useEffect(() => {
    // Wait for the full subscription check before deciding whether to remind.
    // This allows a reminder for every genuinely disabled state without flashing
    // a dialog while an enabled subscription is still loading.
    if (isApkUrl || !reminderOnly || !hasCheckedSubscription || notificationStatus === 'unknown' || isSubscribed) return;
    const reminderKey = `twobeone_push_reminder:${userId}`;
    if (sessionStorage.getItem(reminderKey)) return;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(reminderKey, 'shown');
      setShowDialog(true);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [hasCheckedSubscription, isApkUrl, isSubscribed, notificationStatus, reminderOnly, userId]);

  const checkNotificationStatus = async () => {
    if (!('Notification' in window)) {
      setNotificationStatus('denied');
      setHasCheckedSubscription(true);
      return;
    }

    const permission = Notification.permission;
    setNotificationStatus(permission === 'default' ? 'prompt' : permission);

    // Check if already subscribed
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (subscription && !pushSubscriptionMatchesCurrentKey(subscription)) {
          await subscription.unsubscribe();
          // Permission is already granted, so repair a subscription created
          // before a VAPID rotation without requiring another user prompt.
          subscription = await subscribeToPushNotifications();
        }

        // Re-sync the browser's current subscription on every signed-in app
        // load. This repairs a missing or stale server-side KV record.
        if (subscription) {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/push-subscription`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ subscription: subscription.toJSON() })
            }
          );
          if (!response.ok) throw new Error('Failed to synchronize push subscription');
        }
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('[PushNotification] Error checking subscription:', error);
      }
    }
    setHasCheckedSubscription(true);
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);

    try {
      // Check if Service Worker is supported
      if (!('serviceWorker' in navigator)) {
        toast.error(t.notifications.pushNotifications + ' — ' + t.notifications.enableInSettings);
        setIsLoading(false);
        return;
      }

      // Resolve the active SW registration — three paths in priority order:
      // 1. Already controlling (fast path for installed PWA)
      // 2. Existing registration in any state (installing / waiting / active)
      // 3. Register fresh after confirming the file is real JS
      let swRegistration: ServiceWorkerRegistration | null = null;

      if (navigator.serviceWorker.controller) {
        // Fast path — SW is already controlling this page
        swRegistration = await navigator.serviceWorker.ready;
      } else {
        // Check for any existing registration first
        const existing = await navigator.serviceWorker.getRegistration('/');
        if (existing) {
          swRegistration = existing;
        } else {
          // No registration — verify the file is actually JS before registering
          try {
            const probe = await fetch('/service-worker.js', { method: 'HEAD' });
            const ct = probe.headers.get('content-type') || '';
            const isJs = ct.includes('javascript') || ct.includes('text/js') || probe.url.endsWith('.js');
            if (!probe.ok || (!isJs && ct.includes('html'))) {
              toast.error(t.notifications.enableInSettings);
              setIsLoading(false);
              return;
            }
          } catch { /* fetch failed — proceed and let register() surface the real error */ }

          try {
            swRegistration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
          } catch (regErr: any) {
            const msg = String(regErr?.message || regErr);
            console.error('[PushNotification] SW register failed:', msg);
            toast.error(t.notifications.enableInSettings);
            setIsLoading(false);
            return;
          }
        }
      }

      if (!swRegistration) {
        toast.error(t.messages.tryAgainLater);
        setIsLoading(false);
        return;
      }

      // Request permission
      const permission = await requestNotificationPermission();
      
      if (permission !== 'granted') {
        toast.error(t.notifications.permissionRequired + ' — ' + t.notifications.enableInSettings);
        setNotificationStatus('denied');
        setIsLoading(false);
        return;
      }

      setNotificationStatus('granted');

      // Subscribe to push notifications using the resolved registration directly
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
        return outputArray;
      };

      let subscription: PushSubscription | null = null;
      try {
        subscription = await swRegistration.pushManager.getSubscription();
        if (subscription && !pushSubscriptionMatchesCurrentKey(subscription)) {
          await subscription.unsubscribe();
          subscription = null;
        }
        if (!subscription) {
          subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }
      } catch (subErr: any) {
        console.error('[PushNotification] Subscribe failed:', subErr);
        toast.error(t.messages.errorOccurred + ': ' + (subErr?.message || subErr));
        setIsLoading(false);
        return;
      }

      if (!subscription) {
        toast.error(t.messages.errorOccurred);
        setIsLoading(false);
        return;
      }

      // Send subscription to backend
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/push-subscription`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              subscription: subscription.toJSON()
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[PushNotification] Backend error:', errorData);
          throw new Error(errorData.error || 'Failed to save subscription');
        }

        const result = await response.json();
        console.log('[PushNotification] Subscription saved:', result);
      } catch (apiError) {
        console.error('[PushNotification] API error:', apiError);
        // Continue anyway - subscription is local, backend can be updated later
      }

      setIsSubscribed(true);

      setShowDialog(false);
      onComplete?.();
    } catch (error) {
      console.error('[PushNotification] Setup error:', error);
      toast.error(t.messages.errorOccurred);
    } finally {
      setIsLoading(false);
    }
  };

  if (isApkUrl) return null;

  return (
    <>
      {/* Status indicator button */}
      {!reminderOnly && <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDialog(true)}
        className={`h-8 w-8 ${isSubscribed ? 'text-success-700 hover:bg-success-50' : 'text-muted-foreground hover:bg-muted'}`}
        title={isSubscribed ? t.notifications.notificationsOn : t.notifications.enableNotifications}
      >
        {isSubscribed ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </Button>}

      {/* Setup Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              {t.notifications.pushNotifications}
            </DialogTitle>
            <DialogDescription>
              {t.notifications.stayConnected}
            </DialogDescription>
          </DialogHeader>

          {reminderOnly && !isSubscribed ? (
            <div className="space-y-4 py-3">
              <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-primary-50 to-rose-50 p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white shadow-sm">
                  <Bell className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t.notifications.enableNotifications}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {notificationStatus === 'denied' ? t.notifications.enableInSettings : t.notifications.stayConnected}
                  </p>
                </div>
              </div>
              {notificationStatus === 'denied' ? (
                <Button variant="outline" className="w-full" onClick={() => setShowDialog(false)}>
                  {t.common.close}
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                    {t.common.cancel}
                  </Button>
                  <Button
                    className="flex-1"
                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    onClick={handleEnableNotifications}
                    disabled={isLoading}
                  >
                    {isLoading ? t.common.loading : t.notifications.enableNotifications}
                  </Button>
                </div>
              )}
            </div>
          ) : (
          <div className="space-y-4 py-4">
            {/* Status Card */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    {isSubscribed ? (
                      <Check className="w-5 h-5" style={{ color: 'var(--success-500)' }} />
                    ) : notificationStatus === 'denied' ? (
                      <X className="w-5 h-5" style={{ color: 'var(--error-500)' }} />
                    ) : (
                      <Bell className="w-5 h-5 text-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">
                      {isSubscribed ? t.notifications.notificationsOn :
                       notificationStatus === 'denied' ? t.notifications.permissionRequired :
                       t.notifications.enableNotifications}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isSubscribed ? t.notifications.youllBeNotified :
                       notificationStatus === 'denied' ? t.notifications.enableInSettings :
                       t.notifications.stayConnected}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">{t.notifications.youllBeNotified}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <span>{t.notifications.sharedVerse}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <span>{t.notifications.newPrayer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <span>{t.notifications.journalEntry}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <span>{t.notifications.devotionalComplete}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  <span>{t.notifications.milestone}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {isSubscribed ? (
                <Button variant="outline" className="w-full" onClick={() => setShowDialog(false)}>
                  {t.common.close}
                </Button>
              ) : notificationStatus === 'denied' ? (
                <div className="w-full">
                  <p className="text-sm text-muted-foreground mb-3">
                    {t.notifications.enableInSettings}
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowDialog(false)}>
                    {t.common.close}
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                    {t.common.cancel}
                  </Button>
                  <Button
                    className="flex-1"
                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    onClick={handleEnableNotifications}
                    disabled={isLoading}
                  >
                    {isLoading ? t.common.loading : t.notifications.enableNotifications}
                  </Button>
                </>
              )}
            </div>
          </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
