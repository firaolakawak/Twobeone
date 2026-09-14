import { useUiCopy } from '../utils/uiTranslation';
import { systemMessages } from '../locales/system';
import { useState, useEffect } from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

export function IconsMissingNotice() {
  const tr = useUiCopy(systemMessages);
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
        className="fixed inset-0 bg-[var(--glass-overlay)] z-50"
        onClick={handleDismiss}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="tbo-glass-raised relative max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full border border-border hover:bg-accent transition-colors"
            aria-label={tr("Dismiss")}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-[var(--glass-warning-soft)] text-[var(--glass-warning)] flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* Title */}
            <h3 className="tbo-card-title mb-2">
               {tr("iOS App Icons Missing")} </h3>

            {/* Description */}
            <p className="tbo-supporting text-muted-foreground mb-6">
               {tr("The app icon won't display on iOS devices. Generate and upload the required PNG icons to fix this issue.")} </p>

            {/* Action button */}
            <button
              onClick={handleOpenGenerator}
              className="tbo-action tbo-glass-primary"
            >
              <ExternalLink className="w-4 h-4" />
               {tr("Generate Icons Now")} </button>

            {/* Dismiss text */}
            <button
              onClick={handleDismiss}
              className="tbo-action mt-4 text-muted-foreground hover:text-foreground transition-colors underline"
            >
               {tr("Dismiss and don't show again")} </button>
          </div>
        </div>
      </div>
    </>
  );
}
