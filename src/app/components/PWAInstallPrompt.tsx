import { useCurrentLanguage } from '../utils/languageStore';
import { useUiCopy } from '../utils/uiTranslation';
import { systemMessages } from '../locales/system';
import { useEffect, useState, type ReactNode } from 'react';
import { Download, Heart, Plus, Share, Smartphone, X } from 'lucide-react';
import { Button } from './ui/button';
import { getTranslations, type Language } from '../utils/i18n';
import { isAppShellEnvironment } from '../utils/appShell';
import '../styles/system-overlays.css';

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
  const language = useCurrentLanguage();
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

    const handleManualOpen = (event: Event) => {
      const requestedPlatform = (event as CustomEvent<{ platform?: InstallPlatform }>).detail?.platform;
      if (requestedPlatform === 'ios') setPlatform('ios');
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
      className="tbo-install-prompt fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-[220] mx-auto max-h-[calc(100dvh-env(safe-area-inset-bottom)-6.75rem)] max-w-md overflow-y-auto rounded-[1.75rem] motion-safe:animate-in slide-in-from-bottom-4 fade-in duration-300 md:bottom-6 md:left-auto md:right-6 md:mx-0 md:w-[25rem]"
    >
      <div className="tbo-glass-raised overflow-hidden">
        <div className="relative bg-muted border-b border-border px-5 pb-4 pt-5 text-foreground">
          <button
            type="button"
            onClick={dismiss}
            aria-label={t.install.dismiss}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-card border border-border transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="tbo-install-heading">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg">
              <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
            </div>
            <div className="min-w-0 [overflow-wrap:anywhere]">
              <h2 id="install-twobeone-title" className="tbo-dialog-title text-foreground">{t.install.title}</h2>
              <p className="tbo-caption mt-0.5 text-muted-foreground">{t.install.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {platform === 'ios' ? (
            <div className="space-y-3" data-testid="ios-install-steps">
              <div className="tbo-install-steps text-center">
                <InstallStep number="1" icon={<Share className="h-4 w-4" />} label={t.install.iosStep1} />
                <InstallStep number="2" icon={<Plus className="h-4 w-4" />} label={t.install.iosStep2} />
                <InstallStep number="3" icon={<Smartphone className="h-4 w-4" />} label={t.install.iosStep3} />
              </div>
              <p className="tbo-caption text-center text-muted-foreground">
                {t.install.iosInstructions}
              </p>
              <Button type="button" variant="outline" onClick={dismiss} className="tbo-action h-10 w-full rounded-xl">
                {t.install.gotIt}
              </Button>
            </div>
          ) : platform === 'native' && deferredPrompt ? (
            <div className="space-y-3">
              <p className="tbo-supporting text-muted-foreground">{t.install.subtitle}</p>
              <Button type="button" variant="glass-primary" onClick={install} className="tbo-action w-full">
                <Download className="mr-2 h-4 w-4" /> {t.install.installButton}
              </Button>
            </div>
          ) : platform === 'android' ? (
            <div className="space-y-3" data-testid="android-install-steps">
              <p className="tbo-supporting text-muted-foreground">
                {t.install.androidInstructions}
              </p>
              <Button type="button" variant="outline" onClick={dismiss} className="tbo-action h-10 w-full rounded-xl">{t.install.gotIt}</Button>
            </div>
          ) : (
            <div className="tbo-supporting space-y-3 text-muted-foreground">
              <p className="tbo-supporting">{t.install.androidInstructions}</p>
              <Button type="button" variant="outline" onClick={dismiss} className="tbo-action h-10 w-full rounded-xl">{t.install.gotIt}</Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function InstallStep({ number, icon, label }: { number: string; icon: ReactNode; label: string }) {
  const tr = useUiCopy(systemMessages);
  return (
    <div className="tbo-glass-inset px-2 py-3">
      <div className="tbo-glass-orb mx-auto mb-1.5 h-7 w-7">
        {icon}
      </div>
      <p className="tbo-caption text-foreground [overflow-wrap:anywhere]"><span className="sr-only">{tr("Step")} {number}: </span>{label}</p>
    </div>
  );
}
