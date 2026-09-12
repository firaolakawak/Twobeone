export const MOOD_WINDOW_MS = 24 * 60 * 60 * 1000;

export type MoodValue = "great" | "good" | "okay" | "sad";

export type MoodEntry = {
  userId: string;
  mood: MoodValue;
  createdAt: string;
  note?: string;
  id?: string;
};

export const MOOD_EMOJI: Record<MoodValue, string> = {
  great: "😄",
  good: "🙂",
  okay: "😐",
  sad: "😔",
};

export function getCurrentMood(
  entries: readonly MoodEntry[],
  userId: string | undefined,
  now = Date.now(),
): MoodEntry | null {
  if (userId === undefined || !Number.isFinite(now)) return null;

  let current: MoodEntry | null = null;
  let currentTime = -Infinity;

  for (const entry of entries) {
    if (
      !entry ||
      entry.userId !== userId ||
      typeof entry.createdAt !== "string" ||
      typeof entry.mood !== "string" ||
      !Object.prototype.hasOwnProperty.call(MOOD_EMOJI, entry.mood)
    ) {
      continue;
    }

    const timestamp = Date.parse(entry.createdAt);
    const age = now - timestamp;
    if (
      Number.isFinite(timestamp) &&
      age >= 0 &&
      age < MOOD_WINDOW_MS &&
      timestamp > currentTime
    ) {
      current = entry;
      currentTime = timestamp;
    }
  }

  return current;
}

export function shouldPromptForMood(
  currentMood: MoodEntry | null,
  lastPromptAt: number | null,
  now = Date.now(),
): boolean {
  if (currentMood || !Number.isFinite(now)) return false;
  if (lastPromptAt === null || !Number.isFinite(lastPromptAt)) return true;

  const age = now - lastPromptAt;
  return age < 0 || age >= MOOD_WINDOW_MS;
}

const promptTimes = new Map<string, number>();

export function getMoodPromptStorageKey(userId: string): string {
  return `twobeone:mood-prompt:${userId}`;
}

function parsePromptTime(value: string | null): number | null {
  if (value === null || !/^(0|[1-9]\d*)$/.test(value)) return null;
  const timestamp = Number(value);
  return Number.isSafeInteger(timestamp) ? timestamp : null;
}

export function readMoodPromptAt(userId: string): number | null {
  const key = getMoodPromptStorageKey(userId);
  const remembered = promptTimes.get(key) ?? null;

  try {
    if (typeof window === "undefined") return remembered;
    const stored = parsePromptTime(window.localStorage.getItem(key));
    if (stored === null) return remembered;
    const latest = remembered === null ? stored : Math.max(stored, remembered);
    promptTimes.set(key, latest);
    return latest;
  } catch {
    return remembered;
  }
}

export function markMoodPromptShown(userId: string, now = Date.now()): void {
  if (!Number.isSafeInteger(now) || now < 0) return;
  const key = getMoodPromptStorageKey(userId);
  promptTimes.set(key, now);

  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, String(now));
    }
  } catch {
    // Keep the in-memory timestamp when browser storage is unavailable.
  }
}
