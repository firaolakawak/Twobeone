import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { X, Download, Heart, Smartphone } from 'lucide-react';
import { isInstalledPWA, isIOS, isAndroid, getDeviceType } from '../utils/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
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
  }, []);

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
  if (isInstalled) {
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
                  <h3 className="font-semibold text-foreground dark:text-white">{t.install.title}</h3>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">{t.install.subtitle}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground ">
                For the best experience, install TwoBeOne on your iPhone:
              </p>

              <div className="space-y-3 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p className="text-sm text-foreground ">
                    Tap the <span className="font-semibold">Share</span> button in Safari (bottom bar)
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p className="text-sm text-foreground ">
                    Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p className="text-sm text-foreground ">
                    Tap <span className="font-semibold">"Add"</span> in the top right corner
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
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
                Maybe Later
              </Button>
              <Button
                onClick={handleDismiss}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
              >
                Got It
              </Button>
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
                  <h3 className="font-semibold text-foreground dark:text-white">{t.install.title}</h3>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Install on your device</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground ">
                {t.install.title} to your device for quick access and a better experience:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-card  flex items-center justify-center">
                    <Download className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground dark:text-white">Fast Access</p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">One tap</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-card  flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground dark:text-white">Full Screen</p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">App-like</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground  mb-2">
                  ✨ Works offline
                </p>
                <p className="text-xs text-muted-foreground  mb-2">
                  🔔 Get notifications
                </p>
                <p className="text-xs text-muted-foreground ">
                  💜 Access from home screen
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                Not Now
              </Button>
              <Button
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
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
  const { t } = useLanguage();
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    setIsInstalled(isInstalledPWA());
    setDeviceType(getDeviceType());
  }, []);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground dark:text-white mb-1">{t.install.title}</p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
              {deviceType === 'ios' 
                ? 'Add to home screen for quick access'
                : 'Install for a better experience'}
            </p>
            <Button
              onClick={() => window.dispatchEvent(new Event('twobeone:open-install'))}
              size="sm"
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
            >
              {deviceType === 'ios' ? 'Show Me How' : 'Install App'}
            </Button>
          </div>
        </div>
      </div>

    </>
  );
}
