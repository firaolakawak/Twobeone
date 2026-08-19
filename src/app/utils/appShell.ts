export const APP_SHELL_STORAGE_KEY = 'twobeone_app_shell';
export const ONBOARDING_STORAGE_KEY = 'twobeone_onboarding_complete';

/**
 * Detects the Android APK URL wrapper specifically. Unlike
 * `isAppShellEnvironment`, this deliberately excludes installed PWAs because
 * they support the existing web-push flow.
 */
export function isApkUrlEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const appParameter = params.get('app');

  try {
    if (appParameter === '1') {
      window.localStorage.setItem(APP_SHELL_STORAGE_KEY, '1');
    } else if (appParameter === '0') {
      window.localStorage.removeItem(APP_SHELL_STORAGE_KEY);
    }
  } catch {
    // URL and referrer detection still work when DOM storage is disabled.
  }

  let rememberedAppShell = false;
  try {
    rememberedAppShell = window.localStorage.getItem(APP_SHELL_STORAGE_KEY) === '1';
  } catch {
    // Keep using the non-storage checks below.
  }

  return appParameter === '1' || (
    appParameter !== '0' &&
    (rememberedAppShell || document.referrer.includes('android-app://'))
  );
}

/**
 * Detects a URL-wrapper/PWA environment without relying on a native bridge.
 * `?app=1` is remembered because redirects and shared internal links may later
 * omit the query parameter inside the same isolated WebView storage context.
 */
export function isAppShellEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const appParameter = params.get('app');
  const apkUrlEnvironment = isApkUrlEnvironment();

  const standalone = window.matchMedia?.('(display-mode: standalone)').matches === true;
  const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  return appParameter === '1' || (
    appParameter !== '0' &&
    (apkUrlEnvironment || standalone || iosStandalone)
  );
}
