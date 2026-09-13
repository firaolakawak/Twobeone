import { useUiCopy } from '../utils/uiTranslation';
import { systemMessages } from '../locales/system';
import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { X, Download, Heart, Smartphone } from 'lucide-react';
import { isInstalledPWA, isIOS, isAndroid, getDeviceType } from '../utils/pwa';
import { isAppShellEnvironment } from '../utils/appShell';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const tr = useUiCopy(systemMessages);
  const { t } = useLanguage();
  const [appShell] = useState(isAppShellEnvironment);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    if (appShell) return;
    // Check if already installed
    setIsInstalled(isInstalledPWA());
    setDeviceType(getDeviceType());

    // Listen for the beforeinstallprompt event (Chrome, Edge, Samsung)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      console.log('[PWA] Install prompt available');
      setDeferredPrompt(event);
      
      // Show install prompt after 10 seconds (first time only)
      const hasSeenPrompt = localStorage.getItem('twobeone-install-prompt-seen');
      if (!hasSeenPrompt) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 10000); // 10 seconds
      }
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('twobeone-installed', 'true');
      localStorage.setItem('twobeone_app_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [appShell]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.warn('[PWA] No install prompt available');
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }
    
    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('twobeone-install-prompt-seen', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('twobeone-install-prompt-seen', 'true');
    
    // Show again in 7 days
    const dismissedAt = new Date().toISOString();
    localStorage.setItem('twobeone-install-prompt-dismissed', dismissedAt);
  };

  // Don't show if already installed
  if (appShell || isInstalled) {
    return null;
  }

  // Don't show if dismissed and 7 days haven't passed
  const dismissedAt = localStorage.getItem('twobeone-install-prompt-dismissed');
  if (dismissedAt) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (new Date(dismissedAt) > sevenDaysAgo) {
      return null;
    }
  }

  // iOS Instructions Card
  if (deviceType === 'ios' && showPrompt) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
        <Card className="w-full max-w-md bg-card  shadow-2xl animate-in slide-in-from-bottom duration-300 sm:animate-in sm:zoom-in">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="tbo-card-title text-foreground dark:text-white">{t.install.title}</h3>
                  <p className="tbo-supporting text-muted-foreground dark:text-muted-foreground">{t.install.subtitle}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="tbo-supporting text-muted-foreground">
                 {tr("For the best experience, install TwoBeOne on your iPhone:")} </p>

              <div className="space-y-3 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="tbo-caption flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                    1
                  </div>
                  <p className="tbo-supporting text-foreground">
                     {tr("Tap the")} <span className="tbo-label">{tr("Share")}</span>  {tr("button in Safari (bottom bar)")} </p>
                </div>
                <div className="flex gap-3">
                  <div className="tbo-caption flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                    2
                  </div>
                  <p className="tbo-supporting text-foreground">
                     {tr("Scroll down and tap")} <span className="tbo-label">{tr("\"Add to Home Screen\"")}</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="tbo-caption flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                    3
                  </div>
                  <p className="tbo-supporting text-foreground">
                     {tr("Tap")} <span className="tbo-label">{tr("\"Add\"")}</span>  {tr("in the top right corner")} </p>
                </div>
              </div>

              <div className="tbo-caption flex items-center gap-2 text-muted-foreground dark:text-muted-foreground">
                <Smartphone className="w-4 h-4" />
                <span>{t.install.benefit1Desc}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                 {tr("Maybe Later")} </Button>
              <Button
                onClick={handleDismiss}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
              >
                 {tr("Got It")} </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Android/Desktop Install Prompt
  if (deferredPrompt && showPrompt) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
        <Card className="w-full max-w-md bg-card  shadow-2xl animate-in slide-in-from-bottom duration-300 sm:animate-in sm:zoom-in">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="tbo-card-title text-foreground dark:text-white">{t.install.title}</h3>
                  <p className="tbo-supporting text-muted-foreground dark:text-muted-foreground">{tr("Install on your device")}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="tbo-supporting text-muted-foreground">
                {t.install.title}  {tr("to your device for quick access and a better experience:")} </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-card  flex items-center justify-center">
                    <Download className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="tbo-caption text-foreground dark:text-white">{tr("Fast Access")}</p>
                    <p className="tbo-caption text-muted-foreground dark:text-muted-foreground">{tr("One tap")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-card  flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="tbo-caption text-foreground dark:text-white">{tr("Full Screen")}</p>
                    <p className="tbo-caption text-muted-foreground dark:text-muted-foreground">{tr("App-like")}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-4">
                <p className="tbo-caption text-muted-foreground mb-2">
                   {tr("✨ Works offline")} </p>
                <p className="tbo-caption text-muted-foreground mb-2">
                   {tr("🔔 Get notifications")} </p>
                <p className="tbo-caption text-muted-foreground">
                   {tr("💜 Access from home screen")} </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                 {tr("Not Now")} </Button>
              <Button
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                 {tr("Install")} </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

// Compact Install Banner (shown in settings or header)
export function InstallBanner() {
  const tr = useUiCopy(systemMessages);
  const { t } = useLanguage();
  const [appShell] = useState(isAppShellEnvironment);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    setIsInstalled(isInstalledPWA());
    setDeviceType(getDeviceType());
  }, []);

  if (appShell || isInstalled) {
    return null;
  }

  return (
    <>
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex min-w-0 flex-wrap items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 basis-40 grow break-words">
            <p className="tbo-label text-foreground mb-1">{t.install.title}</p>
            <p className="tbo-supporting text-muted-foreground dark:text-muted-foreground mb-3">
              {deviceType === 'ios' 
                ? tr("Add to home screen for quick access")
                : tr("Install for a better experience")}
            </p>
            <Button
              onClick={() => window.dispatchEvent(new Event('twobeone:open-install'))}
              size="sm"
              className="h-auto min-h-9 max-w-full whitespace-normal break-words px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {deviceType === 'ios' ? tr("Show Me How") : tr("Install App")}
            </Button>
          </div>
        </div>
      </div>

    </>
  );
}
