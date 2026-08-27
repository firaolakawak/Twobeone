import { useEffect, useRef } from 'react';
import { engagement } from '../utils/api';
import { getEngagementCategory } from '../utils/engagement';

const IDLE_AFTER_MS = 2 * 60 * 1000;
// One write every two minutes is enough for useful engagement reporting and
// keeps each slice within the server's 120-second cap.
const FLUSH_EVERY_MS = 2 * 60 * 1000;

export function useEngagementTracking({
  activeTab,
  selectedScreen,
  enabled,
}: {
  activeTab: string;
  selectedScreen: string | null;
  enabled: boolean;
}) {
  const category = getEngagementCategory(activeTab, selectedScreen);
  const activeSecondsRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const lastActivityRef = useRef(Date.now());
  const sessionRef = useRef(crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`);
  const sequenceRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const markActive = () => { lastActivityRef.current = Date.now(); };
    const flush = () => {
      const seconds = Math.floor(activeSecondsRef.current);
      if (seconds < 1) return;
      activeSecondsRef.current -= seconds;
      sequenceRef.current += 1;
      const eventId = `${sessionRef.current}-${sequenceRef.current}`;
      void engagement.track(category, Math.min(seconds, 120), eventId).catch(() => {
        // A future tick will continue tracking; event IDs make successful retries idempotent.
      });
    };
    const tick = () => {
      const now = Date.now();
      const elapsed = Math.min((now - lastTickRef.current) / 1000, 5);
      lastTickRef.current = now;
      if (document.visibilityState === 'visible' && now - lastActivityRef.current < IDLE_AFTER_MS) {
        activeSecondsRef.current += elapsed;
      }
    };

    lastTickRef.current = Date.now();
    const tickTimer = window.setInterval(tick, 1000);
    const flushTimer = window.setInterval(flush, FLUSH_EVERY_MS);
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, markActive, { passive: true }));
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
      else { lastTickRef.current = Date.now(); markActive(); }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      tick();
      flush();
      window.clearInterval(tickTimer);
      window.clearInterval(flushTimer);
      events.forEach(event => window.removeEventListener(event, markActive));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, category]);
}
