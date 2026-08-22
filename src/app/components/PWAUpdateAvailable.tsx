import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, X } from 'lucide-react';

export function PWAUpdateAvailable() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check for updates on page load
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Check for updates every hour
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);
      });

      // Listen for new service worker waiting
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Controller changed - new version active');
        // Optionally reload the page
        // window.location.reload();
      });

      // Listen for service worker updates
      const handleUpdateFound = () => {
        navigator.serviceWorker.ready.then((reg) => {
          if (reg.waiting) {
            console.log('[PWA] New version available');
            setShowUpdate(true);
          }
          
          if (reg.installing) {
            const installingWorker = reg.installing;
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version installed');
                setShowUpdate(true);
              }
            });
          }
        });
      };

      navigator.serviceWorker.addEventListener('updatefound', handleUpdateFound);
      
      return () => {
        navigator.serviceWorker.removeEventListener('updatefound', handleUpdateFound);
      };
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell the waiting service worker to skip waiting and become active
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Listen for the controlling service worker to change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload to get the new version
        window.location.reload();
      });
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Show again in 1 hour
    setTimeout(() => {
      if (registration && registration.waiting) {
        setShowUpdate(true);
      }
    }, 60 * 60 * 1000);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[200] animate-in slide-in-from-bottom duration-300 sm:left-auto sm:right-4 sm:w-96">
      <Card className="bg-card  shadow-2xl border-2 border-primary-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground dark:text-white mb-1">
                Update Available
              </h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                A new version of TwoBeOne is ready. Update now for the latest features and improvements!
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-1" />
                  Later
                </Button>
                <Button
                  onClick={handleUpdate}
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Update Now
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
