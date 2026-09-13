import { useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "twobeone-ambient-motion";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(notify: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

function readReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function useAmbientMotion() {
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    readReducedMotion,
    () => false,
  );
  const [preferred, setPreferred] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "off";
    } catch {
      return true;
    }
  });
  const enabled = preferred && !reducedMotion;

  useEffect(() => {
    // Preserve the setting as people navigate away from the dashboard.
    document.documentElement.dataset.tboAmbientMotion = enabled ? "on" : "off";
    try {
      localStorage.setItem(STORAGE_KEY, preferred ? "on" : "off");
    } catch {
      // The in-memory preference still works when browser storage is blocked.
    }
  }, [enabled, preferred]);

  return {
    enabled,
    reducedMotion,
    toggle: () => setPreferred((value) => !value),
  };
}
