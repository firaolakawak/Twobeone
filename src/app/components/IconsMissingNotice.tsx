import { useState, useEffect } from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

export function IconsMissingNotice() {
  const [showNotice, setShowNotice] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if icons exist by trying to load one
    const checkIcons = async () => {
      try {
        const response = await fetch('/icons/icon-180x180.png');
        if (!response.ok) {
          // Icon doesn't exist
          const hasSeenNotice = localStorage.getItem('icons-missing-notice-dismissed');
          if (!hasSeenNotice) {
            setShowNotice(true);
          }
        }
      } catch (error) {
        // Error loading icon - assume missing
        const hasSeenNotice = localStorage.getItem('icons-missing-notice-dismissed');
        if (!hasSeenNotice) {
          setShowNotice(true);
        }
      }
    };

    checkIcons();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setShowNotice(false);
    localStorage.setItem('icons-missing-notice-dismissed', 'true');
  };

  const handleOpenGenerator = () => {
    window.open('/generate-app-icons.html', '_blank');
  };

  if (!showNotice || dismissed) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-warning-500 to-warning-500 rounded-2xl shadow-2xl max-w-md w-full p-6 text-white">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold mb-2">
              iOS App Icons Missing
            </h3>

            {/* Description */}
            <p className="text-sm text-white/90 mb-6 leading-relaxed">
              The app icon won't display on iOS devices. Generate and upload the required PNG icons to fix this issue.
            </p>

            {/* Action button */}
            <button
              onClick={handleOpenGenerator}
              className="inline-flex items-center gap-2 px-6 py-3 bg-card text-warning-700 rounded-lg hover:bg-card/90 transition-colors text-sm font-medium shadow-lg"
            >
              <ExternalLink className="w-4 h-4" />
              Generate Icons Now
            </button>

            {/* Dismiss text */}
            <button
              onClick={handleDismiss}
              className="mt-4 text-xs text-white/70 hover:text-white transition-colors underline"
            >
              Dismiss and don't show again
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
