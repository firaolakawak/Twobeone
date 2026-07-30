import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Bell, BellOff, Check, X, Smartphone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner@2.0.3';
import { requestNotificationPermission, subscribeToPushNotifications } from '../utils/pwa';
import { projectId } from '../utils/supabase/info';

interface PushNotificationSetupProps {
  userId: string;
  accessToken: string;
  onComplete?: () => void;
}

export function PushNotificationSetup({ userId, accessToken, onComplete }: PushNotificationSetupProps) {
  const { t } = useLanguage();
  const [showDialog, setShowDialog] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    if (!('Notification' in window)) {
      setNotificationStatus('denied');
      return;
    }

    const permission = Notification.permission;
    setNotificationStatus(permission === 'default' ? 'prompt' : permission);

    // Check if already subscribed
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('[PushNotification] Error checking subscription:', error);
      }
    }
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
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDCoXjbK3s9gE8ZCXzp8zQJZs8qI67y_NvZy7p3kk0z0';
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
        if (!subscription) {
          subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
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
        toast.success(t.notifications.notificationsOn);
      }

      setIsSubscribed(true);
      toast.success(t.notifications.notificationsOn);
      
      // Show a test notification
      setTimeout(() => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('TwoBeOne', {
              body: 'Notifications are now enabled! Stay connected with your partner.',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
              tag: 'welcome-notification'
            });
          }).catch(err => {
            console.error('[PushNotification] Test notification error:', err);
          });
        }
      }, 1000);

      setShowDialog(false);
      onComplete?.();
    } catch (error) {
      console.error('[PushNotification] Setup error:', error);
      toast.error(t.messages.errorOccurred);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);

    try {
      // Unsubscribe from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/push-subscription`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove subscription');
      }

      // Unsubscribe locally
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      setIsSubscribed(false);
      toast.success(t.notifications.notificationsOff);
      setShowDialog(false);
    } catch (error) {
      console.error('[PushNotification] Disable error:', error);
      toast.error(t.messages.errorOccurred);
    } finally {
      setIsLoading(false);
    }
  };

  // Show prompt if not subscribed and permission is not denied
  const shouldShowPrompt = notificationStatus === 'prompt' || (notificationStatus === 'granted' && !isSubscribed);

  return (
    <>
      {/* Status indicator button */}
      <Button
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
      </Button>

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
                <>
                  <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                    {t.common.close}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDisableNotifications}
                    disabled={isLoading}
                  >
                    {isLoading ? t.common.loading : t.notifications.disableNotifications}
                  </Button>
                </>
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

            {/* Privacy note */}
            <p className="text-xs text-muted-foreground text-center">
              {t.notifications.disableNotifications}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}