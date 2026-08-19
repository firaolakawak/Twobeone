import { useEffect, useState, type ReactNode } from 'react';
import { Download, Heart, Plus, Share, Smartphone, X } from 'lucide-react';
import { Button } from './ui/button';
import { getTranslations, type Language } from '../utils/i18n';
import { isAppShellEnvironment } from '../utils/appShell';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallPlatform = 'ios' | 'native' | 'android' | 'browser';

const INSTALLED_STORAGE_KEY = 'twobeone_app_installed';

function isRunningInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone) ||
    document.referrer.includes('android-app://');
}

function rememberInstalled() {
  try { localStorage.setItem(INSTALLED_STORAGE_KEY, 'true'); } catch { /* Storage may be unavailable. */ }
}

function isInstalled() {
  if (isRunningInstalled()) {
    rememberInstalled();
    return true;
  }
  try { return localStorage.getItem(INSTALLED_STORAGE_KEY) === 'true'; } catch { return false; }
}

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent);
}

function isMobileDevice() {
  const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    navigator.userAgent,
  );
  const narrowTouchScreen = window.matchMedia('(max-width: 767px) and (pointer: coarse)').matches;
  const mobileWidth = window.innerWidth <= 767;
  return mobileUserAgent || narrowTouchScreen || mobileWidth;
}

export function PWAInstallPrompt() {
  const [appShell] = useState(isAppShellEnvironment);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('twobeone_language');
    return saved === 'am' || saved === 'om' ? saved : 'en';
  });
  const t = getTranslations(language);
  const [platform, setPlatform] = useState<InstallPlatform>('browser');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (appShell) return;
    const alreadyInstalled = isInstalled();
    const ios = isIOSDevice();
    const android = isAndroidDevice();
    const mobileDevice = isMobileDevice();
    setInstalled(alreadyInstalled);
    setPlatform(ios ? 'ios' : android ? 'android' : 'browser');

    let autoTimer: ReturnType<typeof setTimeout> | undefined;
    if (!alreadyInstalled && mobileDevice) {
      autoTimer = setTimeout(() => {
        if (!isInstalled()) setShowPrompt(true);
      }, 500);
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setPlatform('native');

      // Mobile browsers can now replace the instructional fallback with their
      // native one-tap installer. Desktop remains manual-only.
      if (mobileDevice) {
        if (autoTimer) clearTimeout(autoTimer);
        autoTimer = setTimeout(() => setShowPrompt(true), 250);
      }
    };

    const handleInstalled = () => {
      rememberInstalled();
      setInstalled(true);
      setShowPrompt(false);
    };

    const recheckInstalledState = () => {
      if (isInstalled()) handleInstalled();
    };

    const handleManualOpen = () => {
      if (!isInstalled()) setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('pageshow', recheckInstalledState);
    document.addEventListener('visibilitychange', recheckInstalledState);
    window.addEventListener('twobeone:open-install', handleManualOpen);

    return () => {
      if (autoTimer) clearTimeout(autoTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('pageshow', recheckInstalledState);
      document.removeEventListener('visibilitychange', recheckInstalledState);
      window.removeEventListener('twobeone:open-install', handleManualOpen);
    };
  }, [appShell]);

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      setLanguage((event as CustomEvent<Language>).detail);
    };
    window.addEventListener('twobeone:language-change', handleLanguageChange);
    return () => window.removeEventListener('twobeone:language-change', handleLanguageChange);
  }, []);

  const dismiss = () => {
    setShowPrompt(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (appShell || installed || !showPrompt) return null;

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
            aria-label={t.install.dismiss}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 pr-9">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg">
              <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h2 id="install-twobeone-title" className="text-base font-bold text-white">{t.install.title}</h2>
              <p className="mt-0.5 text-xs text-white/85">{t.install.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {platform === 'ios' ? (
            <div className="space-y-3" data-testid="ios-install-steps">
              <div className="grid grid-cols-3 gap-2 text-center">
                <InstallStep number="1" icon={<Share className="h-4 w-4" />} label={t.install.iosStep1} />
                <InstallStep number="2" icon={<Plus className="h-4 w-4" />} label={t.install.iosStep2} />
                <InstallStep number="3" icon={<Smartphone className="h-4 w-4" />} label={t.install.iosStep3} />
              </div>
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                {t.install.iosInstructions}
              </p>
              <Button type="button" variant="outline" onClick={dismiss} className="h-10 w-full rounded-xl font-semibold">
                {t.install.gotIt}
              </Button>
            </div>
          ) : platform === 'native' && deferredPrompt ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.install.subtitle}</p>
              <Button type="button" onClick={install} className="h-11 w-full rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-700">
                <Download className="mr-2 h-4 w-4" /> {t.install.installButton}
              </Button>
            </div>
          ) : platform === 'android' ? (
            <div className="space-y-3" data-testid="android-install-steps">
              <p className="text-sm text-muted-foreground">
                {t.install.androidInstructions}
              </p>
              <Button type="button" variant="outline" onClick={dismiss} className="h-10 w-full rounded-xl font-semibold">{t.install.gotIt}</Button>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>{t.install.androidInstructions}</p>
              <Button type="button" variant="outline" onClick={dismiss} className="h-10 w-full rounded-xl font-semibold">{t.install.gotIt}</Button>
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
