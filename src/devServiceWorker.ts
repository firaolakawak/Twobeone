function isAppWorker(worker: ServiceWorker | null, origin: string): boolean {
  if (!worker) return false;

  try {
    const url = new URL(worker.scriptURL);
    return url.origin === origin && url.pathname === "/service-worker.js";
  } catch {
    return false;
  }
}

function isAppCache(name: string): boolean {
  return (
    /^twobeone-(shell|runtime)-/.test(name) ||
    name === "twobeone-runtime" ||
    name === "twobeone-v1.0.0"
  );
}

/** Run before importing the app in development; true requests one clean reload. */
export async function clearDevelopmentServiceWorker(): Promise<boolean> {
  try {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }

    const serviceWorker = navigator.serviceWorker;
    if (
      !serviceWorker ||
      typeof serviceWorker.getRegistrations !== "function"
    ) {
      return false;
    }

    const origin = window.location.origin;
    const registrations = await serviceWorker.getRegistrations();
    const appRegistrations = registrations.filter((registration) =>
      [registration.active, registration.waiting, registration.installing].some(
        (worker) => isAppWorker(worker, origin),
      ),
    );

    // A false result means the registration was already removed, which is safe.
    await Promise.all(
      appRegistrations.map((registration) => registration.unregister()),
    );

    if (typeof caches !== "undefined") {
      const names = await caches.keys();
      await Promise.all(
        names.filter(isAppCache).map((name) => caches.delete(name)),
      );
    }

    // Unregistering does not release this document's existing controller. It may
    // also be controlling the page after an earlier tab removed its registration.
    return isAppWorker(serviceWorker.controller, origin);
  } catch (error) {
    console.warn(
      "[Development] Could not clear the app service worker:",
      error,
    );
    return false;
  }
}
