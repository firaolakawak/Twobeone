
  import { createRoot } from "react-dom/client";
  import { lazy, Suspense } from "react";
  import App from "./app/App.tsx";
  import { BrandLoader } from "./app/components/BrandLoader.tsx";
  import { PWAInstallPrompt } from "./app/components/PWAInstallPrompt.tsx";
  import { isAppShellEnvironment } from "./app/utils/appShell.ts";
  import "./styles/index.css";

  const FaithQuestPreview = lazy(() => import('./app/components/FaithQuest.tsx').then(module => ({ default: module.FaithQuestPreview })));
  const isQuestPreview = new URLSearchParams(window.location.search).get('preview') === 'faith-quest';

  const reloadForFreshAssets = (event: Event) => {
    event.preventDefault();
    const reloadKey = "twobeone_chunk_reload";
    const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
    if (Date.now() - lastReload < 60_000) return;
    sessionStorage.setItem(reloadKey, String(Date.now()));
    window.location.reload();
  };

  // A deployment replaces hashed chunks. If an open tab requests an obsolete
  // chunk, reload once so it receives the current HTML and asset manifest.
  window.addEventListener("vite:preloadError", reloadForFreshAssets);
  window.addEventListener("unhandledrejection", (event) => {
    const message = String(event.reason?.message || event.reason || "");
    if (/dynamically imported module|importing a module script|module script/i.test(message)) {
      reloadForFreshAssets(event);
    }
  });

  createRoot(document.getElementById("root")!).render(
    <>
      {isQuestPreview ? <Suspense fallback={<BrandLoader />}><FaithQuestPreview /></Suspense> : <App />}
      {/* Keep the mobile installer outside App's auth/landing routes so it is
          available as soon as any shared link is opened. */}
      {!isQuestPreview && !isAppShellEnvironment() && <PWAInstallPrompt />}
    </>,
  );
