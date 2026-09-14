import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { isOnline, addNetworkListeners } from '../utils/pwa';
import { useLanguage } from '../contexts/LanguageContext';

export function OfflineIndicator() {
  const { t } = useLanguage();
  const [online, setOnline] = useState(isOnline());
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const cleanup = addNetworkListeners(
      () => {
        setOnline(true);
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      },
      () => {
        setOnline(false);
        setShowReconnected(false);
      }
    );
    return cleanup;
  }, []);

  if (online && showReconnected) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top duration-300">
        <div className="tbo-glass-status tbo-glass-status-success px-4 py-2 flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          <span className="tbo-label">{t.offline.backOnline}</span>
        </div>
      </div>
    );
  }

  if (!online) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[300] animate-in slide-in-from-top duration-300">
        <div className="tbo-glass-status tbo-glass-status-warning px-4 py-3 flex items-center justify-center gap-2">
          <WifiOff className="w-5 h-5" />
          <span className="tbo-label">{t.offline.youreOffline}</span>
        </div>
      </div>
    );
  }

  return null;
}
