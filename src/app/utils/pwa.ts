export const VAPID_PUBLIC_KEY = 'BAdWiIHDCd4oOdO9eejIk8YSBR50keH7YQACTNEBlVBJvgQrqBd9OIJ6DdSAJ-wJQ5iSXKzVkDOx8qSfDr0uNos';

export function pushSubscriptionMatchesCurrentKey(subscription: PushSubscription): boolean {
  if (!subscription.options.applicationServerKey) return false;
  const currentKey = new Uint8Array(subscription.options.applicationServerKey);
  const expectedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  return currentKey.length === expectedKey.length && currentKey.every((value, index) => value === expectedKey[index]);
}

/**
 * Register the service worker and ensure it activates immediately.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Workers not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registered:', registration.scope);

    // Tell a waiting SW to skip waiting and become active immediately
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Also handle the case where a new SW installs after this point
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      }
    });

    // Check for updates
    registration.update();

    return registration;
  } catch (error) {
    // Only log if it's not the expected MIME-type error (already guarded by probe in App.tsx)
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg.includes('MIME')) {
      console.warn('[PWA] Service Worker registration failed:', error);
    }
    return null;
  }
}

/**
 * Unregister the service worker (for debugging)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    return await registration.unregister();
  }
  return false;
}

/**
 * Request permission for push notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    // A subscription is tied to the public key used to create it. Recreate it
    // automatically after an intentional VAPID key rotation.
    if (subscription && !pushSubscriptionMatchesCurrentKey(subscription)) {
      await subscription.unsubscribe();
      subscription = null;
    }
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      
      console.log('[PWA] Push subscription created:', subscription);
    } else {
      console.log('[PWA] Already subscribed to push notifications');
    }
    
    return subscription;
  } catch (error) {
    console.error('[PWA] Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[PWA] Push subscription removed');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[PWA] Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Check if app is running as installed PWA
 */
export function isInstalledPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if device is iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Check if device is Android
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Get device type
 */
export function getDeviceType(): 'ios' | 'android' | 'desktop' | 'unknown' {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  if (/Windows|Macintosh|Linux/.test(navigator.userAgent)) return 'desktop';
  return 'unknown';
}

/**
 * Register background sync
 */
export async function registerBackgroundSync(tag: string): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log(`[PWA] Background sync registered: ${tag}`);
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
    }
  }
}

/**
 * Register periodic background sync (for daily devotionals)
 */
export async function registerPeriodicSync(tag: string, minInterval: number): Promise<void> {
  if ('serviceWorker' in navigator && 'periodicSync' in (window as any).ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).periodicSync.register(tag, {
        minInterval: minInterval,
      });
      console.log(`[PWA] Periodic sync registered: ${tag}`);
    } catch (error) {
      console.error('[PWA] Periodic sync registration failed:', error);
    }
  }
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Add online/offline event listeners
 */
export function addNetworkListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Show local notification
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications not supported');
    return;
  }
  
  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    });
  }
}

/**
 * Helper function to convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Get app install prompt status
 */
export function canShowInstallPrompt(): boolean {
  return !isInstalledPWA() && !isIOS();
}

/**
 * Cache important data for offline use
 */
export async function cacheImportantData(urls: string[]): Promise<void> {
  if ('caches' in window) {
    try {
      const cache = await caches.open('twobeone-runtime');
      await cache.addAll(urls);
      console.log('[PWA] Data cached for offline use');
    } catch (error) {
      console.error('[PWA] Failed to cache data:', error);
    }
  }
}

/**
 * Clear all caches (for debugging)
 */
export async function clearAllCaches(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[PWA] All caches cleared');
  }
}

/**
 * Get cache size (approximate)
 */
export async function getCacheSize(): Promise<number> {
  if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}
