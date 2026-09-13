import { useUiCopy } from '../utils/uiTranslation';
import { systemDiagnosticsMessages } from '../locales/systemDiagnostics';
import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Smartphone, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function PWADebugInfo() {
  const tr = useUiCopy(systemDiagnosticsMessages);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const info: any = {};

    // Device detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    info.isIOS = /iphone|ipad|ipod/.test(userAgent);
    info.isAndroid = /android/.test(userAgent);
    info.isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    info.isChrome = /chrome/.test(userAgent);
    
    // PWA status
    info.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    info.isStandaloneNavigator = (window.navigator as any).standalone;
    info.isInstallable = 'BeforeInstallPromptEvent' in window;
    
    // Service Worker
    info.hasServiceWorker = 'serviceWorker' in navigator;
    info.serviceWorkerReady = false;
    
    if (info.hasServiceWorker) {
      navigator.serviceWorker.ready.then(() => {
        info.serviceWorkerReady = true;
        setDebugInfo({ ...info });
      });
    }
    
    // Manifest
    info.hasManifest = document.querySelector('link[rel="manifest"]') !== null;
    
    // Icons
    info.hasAppleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') !== null;
    
    // HTTPS
    info.isHTTPS = window.location.protocol === 'https:';
    info.isLocalhost = window.location.hostname === 'localhost';
    
    // Viewport
    info.viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content');
    
    setDebugInfo(info);
  }, []);

  // Show debug info after 5 taps on the screen corner (for testing)
  useEffect(() => {
    let tapCount = 0;
    let tapTimer: NodeJS.Timeout;

    const handleTap = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Check if tap is in top-right corner
      if (touch.clientX > window.innerWidth - 100 && touch.clientY < 100) {
        tapCount++;
        clearTimeout(tapTimer);
        
        if (tapCount >= 5) {
          setShowDebug(true);
          tapCount = 0;
        }
        
        tapTimer = setTimeout(() => {
          tapCount = 0;
        }, 2000);
      }
    };

    document.addEventListener('touchstart', handleTap);
    return () => {
      document.removeEventListener('touchstart', handleTap);
      clearTimeout(tapTimer);
    };
  }, []);

  if (!showDebug) {
    return null;
  }

  const StatusIcon = ({ value }: { value: boolean }) => {
    return value ? (
      <CheckCircle2 className="w-16 h-16 text-success-700" />
    ) : (
      <XCircle className="w-16 h-16 text-error-500" />
    );
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-16">
      <Card className="bg-card  p-24 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-12 mb-24">
          <Smartphone className="w-24 h-24 text-primary-600" />
          <h2 className="tbo-section-title text-foreground dark:text-white">{tr("PWA Debug Info")}</h2>
        </div>

        <div className="space-y-16">
          <div className="space-y-8">
            <h3 className="tbo-card-title text-foreground flex items-center gap-8">
              <AlertCircle className="w-20 h-20" />
               {tr("Device & Browser")} </h3>
            <div className="tbo-supporting pl-28 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground dark:text-muted-foreground">{tr("iOS Device")}</span>
                <StatusIcon value={debugInfo.isIOS} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground dark:text-muted-foreground">{tr("Android Device")}</span>
                <StatusIcon value={debugInfo.isAndroid} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground dark:text-muted-foreground">{tr("Safari Browser")}</span>
                <StatusIcon value={debugInfo.isSafari} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground dark:text-muted-foreground">{tr("Chrome Browser")}</span>
                <StatusIcon value={debugInfo.isChrome} />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="tbo-card-title text-foreground flex items-center gap-8">
              <AlertCircle className="w-20 h-20" />
               {tr("PWA Status")} </h3>
            <div className="tbo-supporting pl-28 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground dark:text-muted-foreground">{tr("Standalone Mode")}</span>
                <StatusIcon value={debugInfo.isStandalone} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground dark:text-muted-foreground">{tr("Standalone (iOS)")}</span>
                <StatusIcon value={debugInfo.isStandaloneNavigator} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground dark:text-muted-foreground">{tr("Installable")}</span>
                <StatusIcon value={debugInfo.isInstallable} />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="tbo-card-title text-foreground flex items-center gap-8">
              <AlertCircle className="w-20 h-20" />
               {tr("Requirements")} </h3>
            <div className="tbo-supporting pl-28 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground dark:text-muted-foreground">{tr("Service Worker Support")}</span>
                <StatusIcon value={debugInfo.hasServiceWorker} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground dark:text-muted-foreground">{tr("Service Worker Ready")}</span>
                <StatusIcon value={debugInfo.serviceWorkerReady} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground dark:text-muted-foreground">{tr("Manifest Present")}</span>
                <StatusIcon value={debugInfo.hasManifest} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground dark:text-muted-foreground">{tr("Apple Touch Icon")}</span>
                <StatusIcon value={debugInfo.hasAppleTouchIcon} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground dark:text-muted-foreground">HTTPS</span>
                <StatusIcon value={debugInfo.isHTTPS || debugInfo.isLocalhost} />
              </div>
            </div>
          </div>

          {debugInfo.isIOS && !debugInfo.isStandalone && (
            <div className="bg-warning-50 dark:bg-neutral-900/20 border border-warning-500/30 dark:border-warning-700 rounded-lg p-16">
              <h4 className="tbo-label text-warning-700 dark:text-warning-50 mb-8">{tr("iOS Installation Steps")}</h4>
              <ol className="tbo-supporting list-decimal list-inside space-y-4 text-warning-700 dark:text-warning-500">
                <li>{tr("Tap the Share button in Safari")}</li>
                <li>{tr("Scroll down and tap \"Add to Home Screen\"")}</li>
                <li>{tr("Tap \"Add\" to install the app")}</li>
              </ol>
            </div>
          )}

          <div className="tbo-caption bg-muted rounded-lg p-12 font-mono">
            <div className="text-muted-foreground dark:text-muted-foreground">
               {tr("User Agent:")} {window.navigator.userAgent.substring(0, 100)}...
            </div>
          </div>
        </div>

        <div className="mt-24 flex gap-8">
          <Button onClick={() => setShowDebug(false)} className="flex-1">
             {tr("Close")} </Button>
          <Button 
            onClick={() => {
              const debugText = JSON.stringify(debugInfo, null, 2);
              navigator.clipboard?.writeText(debugText);
              alert(tr("Debug info copied to clipboard!"));
            }}
            variant="outline"
            className="flex-1"
          >
             {tr("Copy Info")} </Button>
        </div>
      </Card>
    </div>
  );
}
