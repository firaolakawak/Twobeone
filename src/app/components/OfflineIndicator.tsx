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
        <div className="px-4 py-2 rounded-full shadow-lg flex items-center gap-2" style={{ background: 'var(--success-500)', color: '#fff' }}>
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">{t.offline.backOnline}</span>
        </div>
      </div>
    );
  }

  if (!online) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[300] animate-in slide-in-from-top duration-300">
        <div className="px-4 py-3 flex items-center justify-center gap-2" style={{ background: 'var(--warning-500)', color: '#fff' }}>
          <WifiOff className="w-5 h-5" />
          <span className="text-sm font-medium">{t.offline.youreOffline}</span>
        </div>
      </div>
    );
  }

  return null;
}
