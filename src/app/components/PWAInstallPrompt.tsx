import { useEffect, useState, type ReactNode } from 'react';
import { Download, Heart, Plus, Share, Smartphone, X } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallPlatform = 'ios' | 'native' | 'browser';

// Versioned so dismissal flags from the old, duplicated prompt system cannot
// accidentally suppress this consolidated installer.
const DISMISSED_AT_KEY = 'twobeone-install-dismissed-at-v2';
const REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone) ||
    document.referrer.includes('android-app://');
}

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function canAutoShow() {
  const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY) || 0);
  return !dismissedAt || Date.now() - dismissedAt >= REMIND_AFTER_MS;
}

export function PWAInstallPrompt() {
  const [platform, setPlatform] = useState<InstallPlatform>('browser');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const alreadyInstalled = isInstalled();
    const ios = isIOSDevice();
    const mobileDevice = ios || /Android|Mobile/i.test(navigator.userAgent);
    setInstalled(alreadyInstalled);
    setPlatform(ios ? 'ios' : 'browser');

    let autoTimer: ReturnType<typeof setTimeout> | undefined;
    if (!alreadyInstalled && ios && canAutoShow()) {
      autoTimer = setTimeout(() => setShowPrompt(true), 4000);
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setPlatform('native');

      // Desktop never opens an unsolicited prompt. Its installer remains
      // available intentionally from Profile > App settings.
      if (mobileDevice && canAutoShow()) {
        autoTimer = setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    const handleInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem(DISMISSED_AT_KEY);
    };

    const handleManualOpen = () => {
      if (!isInstalled()) setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('twobeone:open-install', handleManualOpen);

    return () => {
      if (autoTimer) clearTimeout(autoTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('twobeone:open-install', handleManualOpen);
    };
  }, []);

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISSED_AT_KEY, Date.now().toString());
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
    if (outcome === 'dismissed') {
      localStorage.setItem(DISMISSED_AT_KEY, Date.now().toString());
    }
  };

  if (installed || !showPrompt) return null;

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="install-twobeone-title"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-[220] mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300 md:bottom-6 md:left-auto md:right-6 md:mx-0 md:w-[25rem]"
    >
      <div className="overflow-hidden rounded-[1.75rem] border border-rose-100 bg-white/95 shadow-[0_22px_60px_-18px_rgba(136,19,55,0.35)] backdrop-blur-xl">
        <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 px-5 pb-4 pt-5 text-white">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 pr-9">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg">
              <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h2 id="install-twobeone-title" className="text-base font-bold text-white">Add TwoBeOne to your Home Screen</h2>
              <p className="mt-0.5 text-xs text-white/85">Open your couple space in one tap.</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {platform === 'ios' ? (
            <div className="space-y-3" data-testid="ios-install-steps">
              <div className="grid grid-cols-3 gap-2 text-center">
                <InstallStep number="1" icon={<Share className="h-4 w-4" />} label="Tap Share" />
                <InstallStep number="2" icon={<Plus className="h-4 w-4" />} label="Add to Home" />
                <InstallStep number="3" icon={<Smartphone className="h-4 w-4" />} label="Tap Add" />
              </div>
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                In Safari, enable <strong className="text-foreground">Open as Web App</strong> before tapping Add.
              </p>
              <Button type="button" variant="outline" onClick={dismiss} className="h-10 w-full rounded-xl font-semibold">
                Got it
              </Button>
            </div>
          ) : platform === 'native' && deferredPrompt ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Install the secure web app for faster access and an app-like full-screen experience.</p>
              <Button type="button" onClick={install} className="h-11 w-full rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-700">
                <Download className="mr-2 h-4 w-4" /> Install TwoBeOne
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Open this page in Safari on iPhone, then use Share → Add to Home Screen.</p>
              <Button type="button" variant="outline" onClick={dismiss} className="h-10 w-full rounded-xl font-semibold">Got it</Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function InstallStep({ number, icon, label }: { number: string; icon: ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-rose-50 px-2 py-3">
      <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm">
        {icon}
      </div>
      <p className="text-[11px] font-semibold text-foreground"><span className="sr-only">Step {number}: </span>{label}</p>
    </div>
  );
}
