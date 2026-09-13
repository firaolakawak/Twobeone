import { useCallback, useEffect, useRef, useState } from 'react';
import { moods as moodsApi } from '../utils/api';
import { getMoodDayKey, getTodaysMood, type DailyMoodEntry, type MoodValue } from '../utils/dailyMood';

interface MoodState {
  userId?: string;
  partnerId?: string;
  day: string;
  userMood: DailyMoodEntry | null;
  partnerMood: DailyMoodEntry | null;
  loaded: boolean;
}

interface MoodScope {
  userId?: string;
  partnerId?: string;
  day: string;
  revision: number;
  disposed: boolean;
  inFlight: symbol | null;
}

function emptyState(scope: Pick<MoodScope, 'userId' | 'partnerId' | 'day'>): MoodState {
  return { userId: scope.userId, partnerId: scope.partnerId, day: scope.day, userMood: null, partnerMood: null, loaded: false };
}

export function useDailyMoods(userId?: string, partnerId?: string) {
  const scopeRef = useRef<MoodScope | null>(null);
  const [state, setState] = useState<MoodState>(() => emptyState({ userId, partnerId, day: getMoodDayKey() }));

  useEffect(() => {
    const scope: MoodScope = { userId, partnerId, day: getMoodDayKey(), revision: 0, disposed: false, inFlight: null };
    scopeRef.current = scope;
    setState(emptyState(scope));

    if (!userId) return () => { scope.disposed = true; };

    const refreshDay = () => {
      const day = getMoodDayKey();
      if (scope.day !== day) {
        scope.day = day;
        scope.revision += 1;
        scope.inFlight = null;
        setState(emptyState(scope));
      }
    };

    const fetchMoods = async () => {
      if (scope.disposed || document.visibilityState !== 'visible') return;
      refreshDay();
      if (scope.inFlight) return;

      const request = Symbol('daily-moods');
      const revision = scope.revision;
      const day = scope.day;
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(0, 0, 0, 0);
      scope.inFlight = request;

      try {
        let userMood: DailyMoodEntry | null = null;
        let partnerMood: DailyMoodEntry | null = null;
        let before: string | undefined;
        const cursors = new Set<string>();

        while (true) {
          const page = await moodsApi.list(2, { limit: 100, ...(before ? { before } : {}) });
          if (scope.disposed || scope.revision !== revision) return;
          if (getMoodDayKey() !== day) {
            refreshDay();
            void fetchMoods();
            return;
          }
          if (!Array.isArray(page?.moods)) throw new Error('Invalid mood history response');

          userMood = getTodaysMood(userMood ? [userMood, ...page.moods] : page.moods, userId, now);
          partnerMood = getTodaysMood(partnerMood ? [partnerMood, ...page.moods] : page.moods, partnerId, now);

          // One partner can have many updates; keep paging until today's other
          // mood is found, without loading the couple's older mood history.
          const cursor = page.nextBefore;
          const cursorTime = typeof cursor === 'string' ? Date.parse(cursor) : NaN;
          if ((userMood && (!partnerId || partnerMood)) || !cursor || !Number.isFinite(cursorTime)
            || cursorTime < midnight.getTime() || cursors.has(cursor)
            || (before && cursorTime >= Date.parse(before))) break;
          cursors.add(cursor);
          before = cursor;
        }

        setState({ userId, partnerId, day, userMood, partnerMood, loaded: true });
      } catch {
        // An unavailable lookup must not be treated as an unset mood. Keep the
        // last successful state and let foreground/minute refreshes try again.
      } finally {
        if (scope.inFlight === request) scope.inFlight = null;
      }
    };

    let midnightTimer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      clearTimeout(midnightTimer);
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      midnightTimer = setTimeout(() => {
        refreshDay();
        scheduleMidnight();
        void fetchMoods();
      }, Math.max(1, midnight.getTime() - Date.now()));
    };

    const initialTimer = setTimeout(() => { void fetchMoods(); }, 1500);
    const interval = setInterval(() => { void fetchMoods(); }, 60_000);
    const onForeground = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(initialTimer);
      refreshDay();
      scheduleMidnight();
      void fetchMoods();
    };
    scheduleMidnight();
    window.addEventListener('focus', onForeground);
    document.addEventListener('visibilitychange', onForeground);

    return () => {
      scope.disposed = true;
      clearTimeout(initialTimer);
      clearTimeout(midnightTimer);
      clearInterval(interval);
      window.removeEventListener('focus', onForeground);
      document.removeEventListener('visibilitychange', onForeground);
    };
  }, [userId, partnerId]);

  const saveMood = useCallback(async (mood: MoodValue) => {
    const scope = scopeRef.current;
    if (!userId || !scope || scope.disposed || scope.userId !== userId || scope.partnerId !== partnerId) {
      throw new Error('Sign in to save your mood');
    }

    const response = await moodsApi.save(mood);
    const record = response?.mood;
    const saved = record && typeof record.createdAt === 'string'
      ? getTodaysMood([record], userId, new Date(record.createdAt))
      : null;
    if (response?.success !== true || !saved || saved.mood !== mood) {
      throw new Error('Invalid saved mood response');
    }
    if (scope.disposed || scopeRef.current !== scope) return;

    // Reads started before this confirmed write must not restore an older mood.
    scope.revision += 1;
    scope.inFlight = null;
    const now = new Date();
    const day = getMoodDayKey(now);
    scope.day = day;
    setState(previous => {
      const current = previous.userId === userId && previous.partnerId === partnerId && previous.day === day
        ? previous : emptyState({ userId, partnerId, day });
      return { ...current, userMood: getTodaysMood([saved, current.userMood], userId, now), loaded: true };
    });
  }, [userId, partnerId]);

  // Hide stale records immediately on an account change, before effects run,
  // and on any render after midnight while a suspended tab is waking up.
  const current = state.userId === userId && state.partnerId === partnerId && state.day === getMoodDayKey()
    ? state : emptyState({ userId, partnerId, day: getMoodDayKey() });
  return { userMood: current.userMood, partnerMood: current.partnerMood, loaded: current.loaded, saveMood };
}
