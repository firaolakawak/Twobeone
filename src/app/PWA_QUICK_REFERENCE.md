# 🚀 TwoBeOne PWA - Quick Reference

## 📋 Essential Files

```
/public/service-worker.js      - Service Worker (offline, push, sync)
/public/manifest.json           - Web App Manifest (icons, metadata)
/index.html                     - PWA meta tags
/utils/pwa.ts                   - PWA utility functions
/components/InstallPrompt.tsx   - Smart install prompt
/components/OfflineIndicator.tsx - Network status
/components/PWAStatus.tsx       - Status dashboard
/components/InstallHelp.tsx     - Installation guide
/components/PWAWelcome.tsx      - First-time welcome
/components/PWAUpdateAvailable.tsx - Update notifications
```

---

## ⚡ Quick Commands

### **Register Service Worker**
```typescript
import { registerServiceWorker } from './utils/pwa';
await registerServiceWorker();
```

### **Check if Installed**
```typescript
import { isInstalledPWA } from './utils/pwa';
const installed = isInstalledPWA(); // true/false
```

### **Request Notifications**
```typescript
import { requestNotificationPermission } from './utils/pwa';
const permission = await requestNotificationPermission(); // 'granted' | 'denied' | 'default'
```

### **Show Notification**
```typescript
import { showNotification } from './utils/pwa';
await showNotification('Title', {
  body: 'Message',
  icon: '/icons/icon-192x192.png'
});
```

### **Check Network Status**
```typescript
import { isOnline } from './utils/pwa';
const online = isOnline(); // true/false
```

### **Listen to Network Changes**
```typescript
import { addNetworkListeners } from './utils/pwa';
const cleanup = addNetworkListeners(
  () => console.log('Online'),
  () => console.log('Offline')
);
// Later: cleanup();
```

### **Clear Cache**
```typescript
import { clearAllCaches } from './utils/pwa';
await clearAllCaches();
```

### **Get Cache Size**
```typescript
import { getCacheSize } from './utils/pwa';
const bytes = await getCacheSize(); // number
```

---

## 🎨 Component Usage

### **Install Prompt**
```tsx
import { InstallPrompt } from './components/InstallPrompt';

<InstallPrompt /> // Shows automatically after 10s
```

### **Install Banner (Settings)**
```tsx
import { InstallBanner } from './components/InstallPrompt';

<InstallBanner /> // Compact banner for settings
```

### **Offline Indicator**
```tsx
import { OfflineIndicator } from './components/OfflineIndicator';

<OfflineIndicator /> // Fixed top banner when offline
```

### **PWA Status**
```tsx
import { PWAStatus } from './components/PWAStatus';

<PWAStatus /> // Complete status dashboard
```

### **PWA Welcome**
```tsx
import { PWAWelcome } from './components/PWAWelcome';

<PWAWelcome /> // First-time user welcome
```

### **Update Notification**
```tsx
import { PWAUpdateAvailable } from './components/PWAUpdateAvailable';

<PWAUpdateAvailable /> // Shows when update ready
```

### **Install Help Dialog**
```tsx
import { InstallHelp } from './components/InstallHelp';

const [open, setOpen] = useState(false);

<InstallHelp open={open} onOpenChange={setOpen} />
<Button onClick={() => setOpen(true)}>Help</Button>
```

---

## 🔧 Service Worker Events

### **Install Event**
```javascript
self.addEventListener('install', (event) => {
  // Cache app shell
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
  );
});
```

### **Activate Event**
```javascript
self.addEventListener('activate', (event) => {
  // Clean old caches
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => 
          key !== CACHE_NAME && caches.delete(key)
        )
      )
    )
  );
});
```

### **Fetch Event**
```javascript
self.addEventListener('fetch', (event) => {
  // Network-first for API
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  }
  // Cache-first for assets
  else {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
```

### **Push Event**
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png'
    })
  );
});
```

### **Sync Event**
```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});
```

---

## 📱 Platform Detection

### **Detect Device**
```typescript
import { getDeviceType, isIOS, isAndroid } from './utils/pwa';

const device = getDeviceType(); // 'ios' | 'android' | 'desktop' | 'unknown'
const iOS = isIOS(); // boolean
const android = isAndroid(); // boolean
```

### **Show Platform-Specific UI**
```tsx
import { isIOS } from './utils/pwa';

{isIOS() ? (
  <IOSInstallInstructions />
) : (
  <AndroidInstallButton />
)}
```

---

## 🔔 Push Notifications

### **Subscribe**
```typescript
import { subscribeToPushNotifications } from './utils/pwa';

const subscription = await subscribeToPushNotifications();
// Send subscription to backend
await api.post('/notifications/subscribe', { subscription });
```

### **Unsubscribe**
```typescript
import { unsubscribeFromPushNotifications } from './utils/pwa';

const success = await unsubscribeFromPushNotifications();
```

### **Send from Backend (Supabase Edge Function)**
```typescript
// In /supabase/functions/server/index.tsx
import webpush from 'npm:web-push';

webpush.setVapidDetails(
  'mailto:support@twobeone.app',
  vapidPublicKey,
  vapidPrivateKey
);

await webpush.sendNotification(subscription, JSON.stringify({
  title: 'Daily Devotional',
  body: 'Your daily devotional is ready!',
  url: '/devotional'
}));
```

---

## 💾 Caching Strategies

### **Cache-First (Static Assets)**
```javascript
// Fast loading, uses cache if available
caches.match(request)
  .then(response => response || fetch(request))
```

### **Network-First (API Calls)**
```javascript
// Fresh data, falls back to cache offline
fetch(request)
  .catch(() => caches.match(request))
```

### **Cache-Only (Offline Page)**
```javascript
// Always uses cache, never fetches
caches.match('/offline.html')
```

### **Network-Only (No Cache)**
```javascript
// Always fetches, never caches
fetch(request)
```

---

## 🧪 Testing Checklist

### **Installation**
- [ ] Install prompt appears after 10 seconds
- [ ] iOS: Can add to home screen via Safari
- [ ] Android: Install banner works
- [ ] Desktop: Install icon in address bar
- [ ] App icon appears on home screen
- [ ] Opens full-screen (no browser bars)

### **Offline**
- [ ] "Offline" banner appears when disconnected
- [ ] Previously loaded content accessible
- [ ] App UI remains functional
- [ ] New content shows appropriate message
- [ ] "Back online" toast when reconnected

### **Notifications**
- [ ] Permission request appears
- [ ] Can grant/deny permission
- [ ] Notifications appear when sent
- [ ] Click notification opens app
- [ ] Settings shows notification status

### **Cache**
- [ ] Cache size displayed in Settings
- [ ] Clear cache removes data
- [ ] App reloads after clearing
- [ ] Cache rebuilds on usage

### **Updates**
- [ ] Update notification appears
- [ ] Click "Update" reloads app
- [ ] New version activated
- [ ] Old cache cleaned up

---

## 🐛 Common Issues & Fixes

### **Service Worker Not Registering**
```typescript
// Check browser support
if ('serviceWorker' in navigator) {
  console.log('✅ Service Worker supported');
} else {
  console.log('❌ Service Worker not supported');
}

// Check registration
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW Registration:', reg);
});
```

### **Install Prompt Not Showing**
```typescript
// Listen for beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ Install prompt available');
  e.preventDefault(); // Prevent auto-show
  // Store for later use
  deferredPrompt = e;
});
```

### **Offline Not Working**
```javascript
// Check cache in DevTools
// Application → Cache Storage → twobeone-v1.0.0

// Verify fetch event listener
self.addEventListener('fetch', (event) => {
  console.log('[SW] Fetch:', event.request.url);
  // ... rest of code
});
```

### **Notifications Not Working**
```typescript
// Check permission
console.log('Permission:', Notification.permission);

// Request permission
const permission = await Notification.requestPermission();
console.log('New permission:', permission);

// Verify subscription
const reg = await navigator.serviceWorker.ready;
const sub = await reg.pushManager.getSubscription();
console.log('Subscription:', sub);
```

---

## 📊 Monitoring & Analytics

### **Log Service Worker Events**
```javascript
// In service-worker.js
console.log('[SW] Installing...');
console.log('[SW] Activated');
console.log('[SW] Fetch:', url);
console.log('[SW] Push received');
console.log('[SW] Sync:', tag);
```

### **Track Install Events**
```typescript
// In App.tsx or analytics file
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed');
  // Track in analytics
  analytics.track('pwa_installed');
});
```

### **Monitor Cache Usage**
```typescript
if ('storage' in navigator && 'estimate' in navigator.storage) {
  const estimate = await navigator.storage.estimate();
  console.log('Cache usage:', estimate.usage, 'of', estimate.quota);
}
```

---

## 🎯 Best Practices

### **DO ✅**
- Register Service Worker early (app load)
- Use HTTPS in production
- Provide offline fallbacks
- Cache strategically (don't cache everything)
- Show install prompt after user engagement
- Provide clear offline indicators
- Test on real devices
- Update Service Worker regularly
- Handle failed requests gracefully
- Respect user's notification settings

### **DON'T ❌**
- Don't show install prompt immediately
- Don't cache sensitive data
- Don't cache API responses indefinitely
- Don't ignore network failures
- Don't spam with notifications
- Don't forget iOS testing
- Don't cache large files unnecessarily
- Don't skip HTTPS in production
- Don't ignore browser console errors
- Don't forget to update cache version

---

## 🔄 Update Workflow

### **1. Update Service Worker**
```javascript
// Change CACHE_NAME version
const CACHE_NAME = 'twobeone-v1.0.1'; // Increment version
```

### **2. Deploy New Version**
```bash
# Deploy to production
# Service Worker auto-detects change
```

### **3. User Gets Update Notification**
```tsx
// PWAUpdateAvailable component shows
<PWAUpdateAvailable /> // "Update Available" notification
```

### **4. User Clicks "Update"**
```typescript
// Service Worker receives SKIP_WAITING message
registration.waiting.postMessage({ type: 'SKIP_WAITING' });
// Page reloads with new version
window.location.reload();
```

---

## 📞 Support

### **Check PWA Status**
1. Open app
2. Go to Settings → App tab
3. View complete status
4. Troubleshoot issues

### **Help Documentation**
- `/PWA_SETUP.md` - Developer guide
- `/PWA_USER_GUIDE.md` - User instructions
- `/PWA_IMPLEMENTATION_COMPLETE.md` - Complete summary
- `/PWA_QUICK_REFERENCE.md` - This file

### **Browser DevTools**
- **Application → Service Workers** - SW status
- **Application → Cache Storage** - Cached files
- **Application → Manifest** - Manifest validation
- **Network → Offline** - Test offline mode
- **Console** - SW logs

---

## ✅ Quick Validation

### **Is My PWA Working?**
Run this checklist:
- [ ] Service Worker registered (check DevTools)
- [ ] Manifest file loads (no 404)
- [ ] Icons display correctly
- [ ] Install prompt appears (or manual install works)
- [ ] App works offline (basic UI)
- [ ] Notifications can be enabled
- [ ] Cache management functional
- [ ] Update flow tested

---

**TwoBeOne PWA - Version 1.0.0**
*Progressive Web App for Christian Couples* 💜
