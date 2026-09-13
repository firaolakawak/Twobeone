import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

const STORAGE_KEY = "twobeone-ambient-motion";

export function useAmbientMotion() {
  const reducedMotion = Boolean(useReducedMotion());
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
