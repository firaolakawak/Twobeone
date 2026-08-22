import { useEffect, useState } from 'react';
import { X, Share, Plus, Heart } from 'lucide-react';
import { Button } from './ui/button';

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Detect if already installed (running in standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://');
    
    setIsIOS(isIOSDevice);
    setIsInStandaloneMode(isStandalone);

    // Only show prompt if:
    // 1. It's an iOS device
    // 2. Not already in standalone mode
    // 3. User hasn't dismissed it before (check localStorage)
    const hasSeenPrompt = localStorage.getItem('ios-install-prompt-seen');
    
    if (isIOSDevice && !isStandalone && !hasSeenPrompt) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompt-seen', 'true');
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Don't set localStorage so it shows again next time
  };

  if (!isIOS || isInStandaloneMode || !showPrompt) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleRemindLater}
      />
      
      {/* Modal - Centered */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-card  rounded-3xl shadow-2xl w-full max-w-md mx-auto animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-br from-primary-600 to-primary-600 rounded-t-3xl">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            <div className="flex flex-col items-center text-center text-white">
              {/* App Icon */}
              <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mb-4 shadow-lg">
                <Heart className="w-8 h-8 text-primary-600 fill-primary-600" />
              </div>
              
              {/* Title */}
              <h2 className="text-white mb-2">Install TwoBeOne</h2>
              <p className="text-white/90 text-sm">
                Add to your home screen for the best experience
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-6 space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-sm text-primary-600 dark:text-primary-400">1</span>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-foreground dark:text-neutral-100 text-sm leading-relaxed">
                  Tap the <strong>Share</strong> button <Share className="inline w-4 h-4 mb-0.5 text-sky-500" /> in your browser's toolbar
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-sm text-primary-600 dark:text-primary-400">2</span>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-foreground dark:text-neutral-100 text-sm leading-relaxed">
                  Scroll down and tap <strong>"Add to Home Screen"</strong> <Plus className="inline w-4 h-4 mb-0.5" />
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-sm text-primary-600 dark:text-primary-400">3</span>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-foreground dark:text-neutral-100 text-sm leading-relaxed">
                  Tap <strong>"Add"</strong> to install the app on your home screen
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-4 border-t border-border ">
              <Button
                onClick={handleRemindLater}
                variant="outline"
                className="w-full"
              >
                Remind Me Later
              </Button>
              <button
                onClick={handleDismiss}
                className="text-sm text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground py-2"
              >
                Don't Show Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
