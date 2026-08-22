import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { 
  Smartphone, 
  Download, 
  HardDrive, 
  Wifi,
  WifiOff,
  Bell,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { 
  isInstalledPWA, 
  isOnline, 
  getCacheSize,
  clearAllCaches,
  unregisterServiceWorker,
  registerServiceWorker,
  requestNotificationPermission
} from '../utils/pwa';
import { toast } from 'sonner@2.0.3';
import { InstallHelp } from './InstallHelp';

export function PWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [online, setOnline] = useState(true);
  const [cacheSize, setCacheSize] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    checkPWAStatus();
    
    // Update online status
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPWAStatus = async () => {
    setIsInstalled(isInstalledPWA());
    setOnline(isOnline());
    
    const size = await getCacheSize();
    setCacheSize(size);
    
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      setSwRegistration(registration || null);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Clear all cached data? You may need to reload the app.')) {
      return;
    }
    
    setIsClearing(true);
    try {
      await clearAllCaches();
      toast.success('Cache cleared successfully');
      setCacheSize(0);
      
      // Reload after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    } finally {
      setIsClearing(false);
    }
  };

  const handleReinstallSW = async () => {
    try {
      // Unregister first
      await unregisterServiceWorker();
      toast.info('Service Worker unregistered');
      
      // Wait a bit then re-register
      setTimeout(async () => {
        await registerServiceWorker();
        toast.success('Service Worker reinstalled');
        await checkPWAStatus();
      }, 1000);
    } catch (error) {
      console.error('Failed to reinstall service worker:', error);
      toast.error('Failed to reinstall service worker');
    }
  };

  const handleRequestNotifications = async () => {
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success('Notifications enabled');
      } else if (permission === 'denied') {
        toast.error('Notifications denied. Please enable in browser settings.');
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      toast.error('Failed to request notifications');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Installation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Installation Status
          </CardTitle>
          <CardDescription>App installation and PWA features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isInstalled ? (
                <CheckCircle2 className="w-5 h-5 text-success-500" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm">App Installed</span>
            </div>
            <span className="text-sm font-medium text-foreground dark:text-white">
              {isInstalled ? 'Yes' : 'No'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {swRegistration ? (
                <CheckCircle2 className="w-5 h-5 text-success-500" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm">Service Worker</span>
            </div>
            <span className="text-sm font-medium text-foreground dark:text-white">
              {swRegistration ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {online ? (
                <Wifi className="w-5 h-5 text-success-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-warning-500" />
              )}
              <span className="text-sm">Network Status</span>
            </div>
            <span className="text-sm font-medium text-foreground dark:text-white">
              {online ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notificationPermission === 'granted' ? (
                <CheckCircle2 className="w-5 h-5 text-success-500" />
              ) : notificationPermission === 'denied' ? (
                <XCircle className="w-5 h-5 text-error-500" />
              ) : (
                <Bell className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm">Notifications</span>
            </div>
            <span className="text-sm font-medium text-foreground dark:text-white capitalize">
              {notificationPermission}
            </span>
          </div>

          {notificationPermission !== 'granted' && (
            <Button
              onClick={handleRequestNotifications}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage & Cache
          </CardTitle>
          <CardDescription>Manage offline data and cache</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground dark:text-muted-foreground">Cache Size</span>
            <span className="text-sm font-medium text-foreground dark:text-white">
              {formatBytes(cacheSize)}
            </span>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleClearCache}
              disabled={isClearing || cacheSize === 0}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isClearing ? 'Clearing...' : 'Clear Cache'}
            </Button>

            {swRegistration && (
              <Button
                onClick={handleReinstallSW}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reinstall Service Worker
              </Button>
            )}
          </div>

          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground ">
              💡 <strong>Tip:</strong> Clearing cache will remove offline data but may improve performance.
              The app will re-download needed content when you use it.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PWA Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            PWA Features
          </CardTitle>
          <CardDescription>Progressive Web App capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground ">
              <CheckCircle2 className="w-4 h-4 text-success-500" />
              <span>Offline access to cached content</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground ">
              <CheckCircle2 className="w-4 h-4 text-success-500" />
              <span>Background sync for data</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground ">
              <CheckCircle2 className="w-4 h-4 text-success-500" />
              <span>Push notifications</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground ">
              <CheckCircle2 className="w-4 h-4 text-success-500" />
              <span>Install to home screen</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground ">
              <CheckCircle2 className="w-4 h-4 text-success-500" />
              <span>Full-screen experience</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-3">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-foreground dark:text-white">TwoBeOne PWA</h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Version 1.0.0
            </p>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              {isInstalled ? 'Running as installed app' : 'Running in browser'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Install Help */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-3">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-foreground dark:text-white">Need Help Installing?</h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Click the button below to get help with installing the app.
            </p>
            <Button
              onClick={() => setShowInstallHelp(true)}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Get Help
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Install Help Modal */}
      <InstallHelp open={showInstallHelp} onOpenChange={setShowInstallHelp} />
    </div>
  );
}