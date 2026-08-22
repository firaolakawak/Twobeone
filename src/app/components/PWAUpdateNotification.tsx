import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function PWAUpdateNotification() {
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
      <Card className="bg-gradient-to-r from-sky-600 to-sky-600 border-0 shadow-2xl">
        <div className="p-4 text-white">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Update Available</h3>
              <p className="text-sm text-sky-100">
                A new version of TwoBeOne is ready to install with improvements and bug fixes.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleUpdate}
              className="flex-1 bg-card text-sky-600 hover:bg-sky-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Now
            </Button>
            <Button
              onClick={() => setShowUpdate(false)}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              Later
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
