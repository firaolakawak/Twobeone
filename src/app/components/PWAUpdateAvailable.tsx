import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function PWAUpdateAvailable() {
  const { t } = useLanguage();
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
      <Card className="tbo-glass-raised">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="tbo-glass-orb w-10 h-10">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="tbo-card-title text-foreground dark:text-white mb-1">
                {t.pwaUpdate.title}
              </h3>
              <p className="tbo-supporting text-muted-foreground dark:text-muted-foreground mb-3">
                {t.pwaUpdate.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-1" />
                  {t.pwaUpdate.later}
                </Button>
                <Button
                  onClick={handleUpdate}
                  variant="glass-primary"
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {t.pwaUpdate.updateNow}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
