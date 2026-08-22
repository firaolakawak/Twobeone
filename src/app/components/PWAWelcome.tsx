import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { X, Smartphone, Download, Wifi, Bell, Heart } from 'lucide-react';
import { isInstalledPWA } from '../utils/pwa';

export function PWAWelcome() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isInstalledPWA());
    
    // Show welcome screen if:
    // 1. Not installed
    // 2. First time visitor (no welcome-seen flag)
    // 3. Not dismissed in last 30 days
    const welcomeSeen = localStorage.getItem('twobeone-pwa-welcome-seen');
    const welcomeDismissed = localStorage.getItem('twobeone-pwa-welcome-dismissed');
    
    if (!isInstalledPWA() && !welcomeSeen) {
      // Show after 3 seconds
      setTimeout(() => {
        setShowWelcome(true);
      }, 3000);
    } else if (welcomeDismissed) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (new Date(welcomeDismissed) < thirtyDaysAgo) {
        // Show again after 30 days
        setTimeout(() => {
          setShowWelcome(true);
        }, 3000);
      }
    }
  }, []);

  const handleGotIt = () => {
    setShowWelcome(false);
    localStorage.setItem('twobeone-pwa-welcome-seen', 'true');
  };

  const handleDismiss = () => {
    setShowWelcome(false);
    localStorage.setItem('twobeone-pwa-welcome-dismissed', new Date().toISOString());
  };

  if (!showWelcome || isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-lg bg-card  shadow-2xl animate-in zoom-in duration-300">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground dark:text-white">Welcome to TwoBeOne!</h2>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Your faith-centered couples app</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <p className="text-muted-foreground ">
              TwoBeOne works best when installed on your device. Get the full app experience!
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-800">
                <div className="w-10 h-10 rounded-full bg-card  flex items-center justify-center mb-3 shadow-sm">
                  <Download className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-semibold text-foreground dark:text-white mb-1">Install App</h3>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  One tap from home screen
                </p>
              </div>

              <div className="bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-900/20 rounded-xl p-4 border border-sky-100 dark:border-sky-700">
                <div className="w-10 h-10 rounded-full bg-card  flex items-center justify-center mb-3 shadow-sm">
                  <Wifi className="w-5 h-5 text-sky-600" />
                </div>
                <h3 className="font-semibold text-foreground dark:text-white mb-1">Works Offline</h3>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Access content anytime
                </p>
              </div>

              <div className="bg-gradient-to-br from-primary-50 to-primary-50 dark:from-primary-900/20 dark:to-primary-900/20 rounded-xl p-4 border border-primary-100 dark:border-primary-800">
                <div className="w-10 h-10 rounded-full bg-card  flex items-center justify-center mb-3 shadow-sm">
                  <Bell className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="font-semibold text-foreground dark:text-white mb-1">Get Notified</h3>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Daily reminders & alerts
                </p>
              </div>

              <div className="bg-gradient-to-br from-success-50 to-success-50 dark:from-success-700/20 dark:to-success-700/20 rounded-xl p-4 border border-success-50 dark:border-success-700">
                <div className="w-10 h-10 rounded-full bg-card  flex items-center justify-center mb-3 shadow-sm">
                  <Smartphone className="w-5 h-5 text-success-700" />
                </div>
                <h3 className="font-semibold text-foreground dark:text-white mb-1">Full Screen</h3>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  App-like experience
                </p>
              </div>
            </div>

            {/* Installation Info */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
              <p className="text-sm text-foreground  mb-2">
                <strong>💡 How to install:</strong>
              </p>
              <ul className="text-xs text-muted-foreground dark:text-muted-foreground space-y-1 ml-4 list-disc">
                <li><strong>Android/Desktop:</strong> Look for the install prompt or button in the address bar</li>
                <li><strong>iOS:</strong> Tap Share → "Add to Home Screen"</li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                onClick={handleGotIt}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg"
              >
                Got It!
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
