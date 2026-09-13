import { useUiCopy } from '../utils/uiTranslation';
import { systemMessages } from '../locales/system';
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
import { toast } from 'sonner';
import { InstallHelp } from './InstallHelp';

export function PWAStatus() {
  const tr = useUiCopy(systemMessages);
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
    if (!confirm(tr("Clear all cached data? You may need to reload the app."))) {
      return;
    }
    
    setIsClearing(true);
    try {
      await clearAllCaches();
      toast.success(tr("Cache cleared successfully"));
      setCacheSize(0);
      
      // Reload after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error(tr("Failed to clear cache"));
    } finally {
      setIsClearing(false);
    }
  };

  const handleReinstallSW = async () => {
    try {
      // Unregister first
      await unregisterServiceWorker();
      toast.info(tr("Service Worker unregistered"));
      
      // Wait a bit then re-register
      setTimeout(async () => {
        await registerServiceWorker();
        toast.success(tr("Service Worker reinstalled"));
        await checkPWAStatus();
      }, 1000);
    } catch (error) {
      console.error('Failed to reinstall service worker:', error);
      toast.error(tr("Failed to reinstall service worker"));
    }
  };

  const handleRequestNotifications = async () => {
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success(tr("Notifications enabled"));
      } else if (permission === 'denied') {
        toast.error(tr("Notifications denied. Please enable in browser settings."));
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      toast.error(tr("Failed to request notifications"));
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
    <div className="min-w-0 max-w-full break-words space-y-4">
      {/* Installation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex min-w-0 items-center gap-2">
            <Smartphone className="w-5 h-5 shrink-0" />
             {tr("Installation Status")} </CardTitle>
          <CardDescription>{tr("App installation and PWA features")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="flex min-w-0 items-center gap-2">
              {isInstalled ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-success-500" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0 text-muted-foreground" />
              )}
              <span className="tbo-supporting">{tr("App Installed")}</span>
            </div>
            <span className="tbo-label min-w-0 max-w-full break-words text-foreground dark:text-white">
              {isInstalled ? tr("Yes") : tr("No")}
            </span>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="flex min-w-0 items-center gap-2">
              {swRegistration ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-success-500" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0 text-muted-foreground" />
              )}
              <span className="tbo-supporting">{tr("Service Worker")}</span>
            </div>
            <span className="tbo-label min-w-0 max-w-full break-words text-foreground dark:text-white">
              {swRegistration ? tr("Active") : tr("Inactive")}
            </span>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="flex min-w-0 items-center gap-2">
              {online ? (
                <Wifi className="w-5 h-5 shrink-0 text-success-500" />
              ) : (
                <WifiOff className="w-5 h-5 shrink-0 text-warning-500" />
              )}
              <span className="tbo-supporting">{tr("Network Status")}</span>
            </div>
            <span className="tbo-label min-w-0 max-w-full break-words text-foreground dark:text-white">
              {online ? tr("Online") : tr("Offline")}
            </span>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="flex min-w-0 items-center gap-2">
              {notificationPermission === 'granted' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-success-500" />
              ) : notificationPermission === 'denied' ? (
                <XCircle className="w-5 h-5 shrink-0 text-error-500" />
              ) : (
                <Bell className="w-5 h-5 shrink-0 text-muted-foreground" />
              )}
              <span className="tbo-supporting">{tr("Notifications")}</span>
            </div>
            <span className="tbo-label min-w-0 max-w-full break-words text-foreground dark:text-white capitalize">
              {tr(notificationPermission === 'granted' ? 'Allowed' : notificationPermission === 'denied' ? 'Blocked' : 'Not requested')}
            </span>
          </div>

          {notificationPermission !== 'granted' && (
            <Button
              onClick={handleRequestNotifications}
              size="sm"
              variant="outline"
              className="h-auto min-h-9 w-full min-w-0 max-w-full whitespace-normal break-words px-3 py-2"
            >
              <Bell className="w-4 h-4 shrink-0 mr-2" />
               {tr("Enable Notifications")} </Button>
          )}
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex min-w-0 items-center gap-2">
            <HardDrive className="w-5 h-5 shrink-0" />
             {tr("Storage & Cache")} </CardTitle>
          <CardDescription>{tr("Manage offline data and cache")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className="tbo-supporting text-muted-foreground dark:text-muted-foreground">{tr("Cache Size")}</span>
            <span className="tbo-label min-w-0 max-w-full break-words text-foreground dark:text-white">
              {formatBytes(cacheSize)}
            </span>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleClearCache}
              disabled={isClearing || cacheSize === 0}
              size="sm"
              variant="outline"
              className="h-auto min-h-9 w-full min-w-0 max-w-full whitespace-normal break-words px-3 py-2"
            >
              <Trash2 className="w-4 h-4 shrink-0 mr-2" />
              {isClearing ? tr("Clearing...") : tr("Clear Cache")}
            </Button>

            {swRegistration && (
              <Button
                onClick={handleReinstallSW}
                size="sm"
                variant="outline"
                className="h-auto min-h-9 w-full min-w-0 max-w-full whitespace-normal break-words px-3 py-2"
              >
                <RefreshCw className="w-4 h-4 shrink-0 mr-2" />
                 {tr("Reinstall Service Worker")} </Button>
            )}
          </div>

          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-3">
            <p className="tbo-caption text-muted-foreground">
              💡 <strong>{tr("Tip:")}</strong>  {tr("Clearing cache will remove offline data but may improve performance. The app will re-download needed content when you use it.")} </p>
          </div>
        </CardContent>
      </Card>

      {/* PWA Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex min-w-0 items-center gap-2">
            <Download className="w-5 h-5 shrink-0" />
             {tr("PWA Features")} </CardTitle>
          <CardDescription>{tr("Progressive Web App capabilities")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="tbo-supporting space-y-2">
            <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success-500" />
              <span>{tr("Offline access to cached content")}</span>
            </div>
            <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success-500" />
              <span>{tr("Background sync for data")}</span>
            </div>
            <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success-500" />
              <span>{tr("Push notifications")}</span>
            </div>
            <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success-500" />
              <span>{tr("Install to home screen")}</span>
            </div>
            <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success-500" />
              <span>{tr("Full-screen experience")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-3">
              <Smartphone className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="tbo-card-title text-foreground dark:text-white">{tr("TwoBeOne PWA")}</h3>
            <p className="tbo-supporting text-muted-foreground dark:text-muted-foreground">
               {tr("Version 1.0.0")} </p>
            <p className="tbo-caption text-muted-foreground dark:text-muted-foreground">
              {isInstalled ? tr("Running as installed app") : tr("Running in browser")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Install Help */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center mb-3">
              <HelpCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="tbo-card-title text-foreground dark:text-white">{tr("Need Help Installing?")}</h3>
            <p className="tbo-supporting text-muted-foreground dark:text-muted-foreground">
               {tr("Click the button below to get help with installing the app.")} </p>
            <Button
              onClick={() => setShowInstallHelp(true)}
              size="sm"
              variant="outline"
              className="h-auto min-h-9 w-full min-w-0 max-w-full whitespace-normal break-words px-3 py-2"
            >
              <HelpCircle className="w-4 h-4 shrink-0 mr-2" />
               {tr("Get Help")} </Button>
          </div>
        </CardContent>
      </Card>

      {/* Install Help Modal */}
      <InstallHelp open={showInstallHelp} onOpenChange={setShowInstallHelp} />
    </div>
  );
}