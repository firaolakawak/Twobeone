import { useCallback, useEffect, useRef, useState } from "react";
import { moods as moodsApi } from "../utils/api";
import {
  getCurrentMood,
  getMoodPromptStorageKey,
  markMoodPromptShown,
  MOOD_WINDOW_MS,
  readMoodPromptAt,
  shouldPromptForMood,
  type MoodEntry,
  type MoodValue,
} from "../utils/moodCheckIn";

interface MoodSnapshot {
  scope: string;
  entries: MoodEntry[];
  checkedAt: number | null;
}

export function useDailyMoodCheckIn({
  userId,
  partnerId,
}: {
  userId?: string;
  partnerId?: string;
}) {
  const scope = JSON.stringify([userId, partnerId]);
  const activeScope = useRef(scope);
  activeScope.current = scope;
  const mounted = useRef(false);
  const saving = useRef(false);
  const writeVersion = useRef(0);
  const refreshRef = useRef<() => void>(() => {});
  const [snapshot, setSnapshot] = useState<MoodSnapshot>({
    scope,
    entries: [],
    checkedAt: null,
  });
  const [now, setNow] = useState(Date.now);
  const [opened, setOpened] = useState<{
    scope: string;
    automatic: boolean;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const entries = snapshot.scope === scope ? snapshot.entries : [];
  const ownMood = getCurrentMood(entries, userId, now);
  const partnerMood = getCurrentMood(entries, partnerId, now);
  const isOpen = opened?.scope === scope;

  useEffect(() => {
    mounted.current = true;
    saving.current = false;
    writeVersion.current += 1;
    setSnapshot({ scope, entries: [], checkedAt: null });
    setOpened(null);
    setIsSaving(false);
    setSaveFailed(false);
    let cancelled = false;
    let fetching = false;

    const refresh = async () => {
      if (!userId || !partnerId || fetching || saving.current || document.hidden)
        return;
      fetching = true;
      const version = writeVersion.current;
      try {
        const result = await moodsApi.list(1, { limit: 200 });
        // Some older servers return a warning with an empty list on failure.
        // That response cannot establish that the user has no mood.
        if (!Array.isArray(result.moods) || (result as { warning?: string }).warning)
          return;
        if (cancelled || version !== writeVersion.current) return;
        const checkedAt = Date.now();
        setSnapshot({ scope, entries: result.moods, checkedAt });
        setNow(checkedAt);
      } catch {
        // Retain a known mood on transient errors; never prompt from a failed load.
      } finally {
        fetching = false;
      }
    };
    refreshRef.current = () => {
      void refresh();
    };
    const onVisible = () => {
      if (!document.hidden) {
        setNow(Date.now());
        void refresh();
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (userId && event.key === getMoodPromptStorageKey(userId)) onVisible();
    };
    // Let the dashboard settle before considering its automatic check-in.
    const initial = window.setTimeout(refresh, 1500);
    const polling = window.setInterval(refresh, 5 * 60_000);
    const clock = window.setInterval(() => setNow(Date.now()), 60_000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      mounted.current = false;
      window.clearTimeout(initial);
      window.clearInterval(polling);
      window.clearInterval(clock);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, [scope, userId, partnerId]);

  // Expire each person's emoji and the reminder cooldown at their exact boundary.
  useEffect(() => {
    const promptAt = userId ? readMoodPromptAt(userId) : null;
    const deadlines = [
      ownMood ? Date.parse(ownMood.createdAt) + MOOD_WINDOW_MS : null,
      partnerMood ? Date.parse(partnerMood.createdAt) + MOOD_WINDOW_MS : null,
      promptAt === null || promptAt > now ? null : promptAt + MOOD_WINDOW_MS,
    ].filter((value): value is number => value !== null && value > now);
    if (!deadlines.length) return;
    const timer = window.setTimeout(() => {
      setNow(Date.now());
      refreshRef.current();
    }, Math.min(...deadlines) - now);
    return () => window.clearTimeout(timer);
  }, [ownMood?.createdAt, partnerMood?.createdAt, userId, now, isOpen]);

  useEffect(() => {
    if (
      ownMood && opened?.scope === scope && opened.automatic && !saving.current
    ) {
      setOpened(null);
      return;
    }
    if (!userId || !partnerId || isOpen || document.hidden || saving.current) return;
    if (snapshot.scope !== scope || snapshot.checkedAt === null) return;
    // A resumed tab must refresh before concluding that a mood is missing.
    if (Date.now() - snapshot.checkedAt > 1500) return;
    if (!shouldPromptForMood(ownMood, readMoodPromptAt(userId), Date.now())) return;
    if (document.querySelector('[role="dialog"][data-state="open"]')) return;
    markMoodPromptShown(userId);
    setSaveFailed(false);
    setOpened({ scope, automatic: true });
  }, [scope, userId, partnerId, ownMood, snapshot, now, isOpen, opened]);

  const openCheckIn = useCallback(() => {
    if (!userId || !partnerId || saving.current) return;
    markMoodPromptShown(userId);
    setNow(Date.now());
    setSaveFailed(false);
    setOpened({ scope, automatic: false });
  }, [scope, userId, partnerId]);

  const closeCheckIn = useCallback(() => {
    if (!saving.current) setOpened(null);
  }, []);

  const saveMood = useCallback(async (value: MoodValue): Promise<boolean> => {
    if (!userId || !partnerId || saving.current) return false;
    saving.current = true;
    const version = ++writeVersion.current;
    const isCurrentSave = () =>
      mounted.current &&
      activeScope.current === scope &&
      writeVersion.current === version;
    setIsSaving(true);
    setSaveFailed(false);
    try {
      const result = await moodsApi.save(value);
      if (result?.success !== true) throw new Error("Mood was not saved");
      if (!isCurrentSave()) return false;
      const savedAt = Date.now();
      const saved = getCurrentMood([result.mood], userId, savedAt) || {
        userId,
        mood: value,
        createdAt: new Date(savedAt).toISOString(),
      };
      // Use the successful write response. A failed background read must not
      // turn an already-saved mood into a failed check-in.
      setSnapshot((current) => ({
        scope,
        entries: [
          ...(current.scope === scope
            ? current.entries.filter((entry) => entry?.userId !== userId)
            : []),
          saved,
        ],
        checkedAt: savedAt,
      }));
      markMoodPromptShown(userId, savedAt);
      setNow(savedAt);
      setOpened(null);
      return true;
    } catch {
      if (isCurrentSave()) setSaveFailed(true);
      return false;
    } finally {
      if (isCurrentSave()) {
        saving.current = false;
        writeVersion.current += 1;
        setIsSaving(false);
      }
    }
  }, [scope, userId, partnerId]);

  return {
    ownMood,
    partnerMood,
    isOpen,
    isSaving,
    saveFailed,
    openCheckIn,
    closeCheckIn,
    saveMood,
  };
}
