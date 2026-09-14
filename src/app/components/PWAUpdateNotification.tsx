import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useLanguage } from '../contexts/LanguageContext';

export function PWAUpdateNotification() {
  const { t } = useLanguage();
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // Check for updates every hour
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);

        // Listen for update found
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Listen for controller change (new service worker activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell the service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top duration-500 md:left-auto md:right-4 md:max-w-md">
      <Card className="tbo-glass-raised">
        <div className="p-4 text-foreground">
          <div className="flex items-start gap-3 mb-3">
            <div className="tbo-glass-orb w-10 h-10">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="tbo-card-title mb-1">{t.pwaUpdate.title}</h3>
              <p className="tbo-supporting text-muted-foreground">
                {t.pwaUpdate.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleUpdate}
              variant="glass-primary"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t.pwaUpdate.updateNow}
            </Button>
            <Button
              onClick={() => setShowUpdate(false)}
              variant="glass"
            >
              {t.pwaUpdate.later}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
