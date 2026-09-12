import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearDevelopmentServiceWorker } from "../devServiceWorker";

function worker(path = "/service-worker.js"): ServiceWorker {
  return {
    scriptURL: new URL(path, window.location.origin).href,
  } as ServiceWorker;
}

function registration(
  workers: Partial<
    Pick<ServiceWorkerRegistration, "active" | "waiting" | "installing">
  >,
) {
  return {
    active: null,
    waiting: null,
    installing: null,
    unregister: vi.fn().mockResolvedValue(true),
    ...workers,
  };
}

describe("clearDevelopmentServiceWorker", () => {
  let getRegistrations: ReturnType<typeof vi.fn>;
  let cacheKeys: ReturnType<typeof vi.fn>;
  let deleteCache: ReturnType<typeof vi.fn>;
  let serviceWorker: {
    getRegistrations: typeof getRegistrations;
    controller: ServiceWorker | null;
  };

  beforeEach(() => {
    getRegistrations = vi.fn().mockResolvedValue([]);
    cacheKeys = vi.fn().mockResolvedValue([]);
    deleteCache = vi.fn().mockResolvedValue(true);
    serviceWorker = { getRegistrations, controller: null };
    vi.stubGlobal("navigator", { serviceWorker });
    vi.stubGlobal("caches", { keys: cacheKeys, delete: deleteCache });
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("unregisters app workers in every lifecycle state and preserves unrelated registrations", async () => {
    const active = registration({ active: worker() });
    const waiting = registration({ waiting: worker("/service-worker.js?v=6") });
    const installing = registration({ installing: worker() });
    const otherPath = registration({
      active: worker("/other/service-worker.js"),
    });
    const otherScript = registration({
      active: worker("/service-worker.js.backup"),
    });
    const otherOrigin = registration({
      active: worker("https://unrelated.example/service-worker.js"),
    });
    getRegistrations.mockResolvedValue([
      active,
      waiting,
      installing,
      otherPath,
      otherScript,
      otherOrigin,
    ]);

    expect(await clearDevelopmentServiceWorker()).toBe(false);
    for (const own of [active, waiting, installing])
      expect(own.unregister).toHaveBeenCalledOnce();
    for (const unrelated of [otherPath, otherScript, otherOrigin])
      expect(unrelated.unregister).not.toHaveBeenCalled();
  });

  it("clears only current and known legacy app caches and leaves auth and other storage intact", async () => {
    const own = [
      "twobeone-shell-v6",
      "twobeone-runtime-v5",
      "twobeone-runtime",
      "twobeone-v1.0.0",
    ];
    cacheKeys.mockResolvedValue([
      ...own,
      "other-app-shell-v6",
      "twobeone-user-data",
      "twobeone-shell",
      "untouched",
    ]);
    localStorage.setItem("supabase-auth", "session-token");
    sessionStorage.setItem("draft", "saved-draft");

    expect(await clearDevelopmentServiceWorker()).toBe(false);
    expect(deleteCache.mock.calls.map(([name]) => name)).toEqual(own);
    expect(localStorage.getItem("supabase-auth")).toBe("session-token");
    expect(sessionStorage.getItem("draft")).toBe("saved-draft");
  });

  it("requests a reload when the app worker still controls the document after unregistering", async () => {
    const active = registration({ active: worker() });
    getRegistrations.mockResolvedValue([active]);
    serviceWorker.controller = worker();

    expect(await clearDevelopmentServiceWorker()).toBe(true);
    expect(active.unregister).toHaveBeenCalledOnce();
  });

  it("requests a reload when a previously unregistered app worker still controls the document", async () => {
    serviceWorker.controller = worker();
    expect(await clearDevelopmentServiceWorker()).toBe(true);
  });

  it("accepts an unregister result of false when the registration was already removed", async () => {
    const active = registration({ active: worker() });
    active.unregister.mockResolvedValue(false);
    getRegistrations.mockResolvedValue([active]);
    serviceWorker.controller = worker();

    expect(await clearDevelopmentServiceWorker()).toBe(true);
  });

  it("does not request a reload for an unrelated controlling worker", async () => {
    serviceWorker.controller = worker("/another-service-worker.js");
    expect(await clearDevelopmentServiceWorker()).toBe(false);
  });

  it("returns false when the service worker API is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    expect(await clearDevelopmentServiceWorker()).toBe(false);
    expect(cacheKeys).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("can remove the controlling app worker when Cache Storage is unavailable", async () => {
    vi.stubGlobal("caches", undefined);
    serviceWorker.controller = worker();
    expect(await clearDevelopmentServiceWorker()).toBe(true);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each(["registration", "unregister", "cache-list", "cache-delete"])(
    "warns and returns false when %s fails instead of rejecting startup",
    async (operation) => {
      const error = new Error("API unavailable");
      const active = registration({ active: worker() });
      serviceWorker.controller = worker();
      getRegistrations.mockResolvedValue([active]);
      cacheKeys.mockResolvedValue(["twobeone-shell-v6"]);
      if (operation === "registration")
        getRegistrations.mockRejectedValue(error);
      if (operation === "unregister")
        active.unregister.mockRejectedValue(error);
      if (operation === "cache-list") cacheKeys.mockRejectedValue(error);
      if (operation === "cache-delete") deleteCache.mockRejectedValue(error);

      await expect(clearDevelopmentServiceWorker()).resolves.toBe(false);
      expect(console.warn).toHaveBeenCalledWith(expect.any(String), error);
    },
  );
});
