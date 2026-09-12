import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MoodEntry } from "../moodCheckIn";

const NOW = Date.parse("2026-09-13T12:00:00.000Z");
const DAY = 86_400_000;

function entry(age: number, overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    userId: "user-a",
    mood: "good",
    createdAt: new Date(NOW - age).toISOString(),
    ...overrides,
  };
}

let api: typeof import("../moodCheckIn");

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  localStorage.clear();
  api = await import("../moodCheckIn");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
});

describe("getCurrentMood", () => {
  it("selects the newest matching entry without sorting or mutating its input", () => {
    const old = Object.freeze(entry(60_000));
    const current = Object.freeze(
      entry(1_000, { mood: "sad", note: "A hard day", id: "saved" }),
    );
    const partner = Object.freeze(
      entry(0, { userId: "user-b", mood: "great" }),
    );
    const entries = Object.freeze([current, partner, old]);

    expect(api.getCurrentMood(entries, "user-a")).toBe(current);
    expect(api.getCurrentMood(entries, "user-b")).toBe(partner);
    expect(api.getCurrentMood(entries, "user")).toBeNull();
    expect(api.getCurrentMood(entries, undefined)).toBeNull();
    expect(entries).toEqual([current, partner, old]);
  });

  it("includes now and the final millisecond before expiry, but excludes exactly 24 hours", () => {
    const justCurrent = entry(DAY - 1);
    const expired = entry(DAY);
    const atNow = entry(0);
    expect(api.MOOD_WINDOW_MS).toBe(DAY);
    expect(api.getCurrentMood([justCurrent], "user-a")).toBe(justCurrent);
    expect(api.getCurrentMood([expired], "user-a")).toBeNull();
    expect(api.getCurrentMood([atNow], "user-a")).toBe(atNow);
    expect(api.getCurrentMood([justCurrent], "user-a", NOW + 1)).toBeNull();
  });

  it("ignores bad timestamps, future entries and unrecognized mood values", () => {
    const valid = entry(60_000);
    const invalid = [
      entry(0, { createdAt: "not a timestamp" }),
      entry(0, { createdAt: "" }),
      entry(-1),
      entry(0, { mood: "excited" as MoodEntry["mood"] }),
      entry(0, { mood: "toString" as MoodEntry["mood"] }),
      entry(0, { mood: undefined as unknown as MoodEntry["mood"] }),
    ];
    expect(api.getCurrentMood([...invalid, valid], "user-a")).toBe(valid);
    expect(api.getCurrentMood(invalid, "user-a")).toBeNull();
    expect(api.getCurrentMood([], "user-a")).toBeNull();
  });

  it("compares timestamps by instant, including an explicit timezone offset", () => {
    const offset = entry(0, { createdAt: "2026-09-13T15:59:00+04:00" });
    expect(api.getCurrentMood([entry(120_000), offset], "user-a")).toBe(offset);
  });

  it("keeps the first entry when valid entries share the newest timestamp", () => {
    const first = entry(0, { mood: "okay" });
    expect(
      api.getCurrentMood([first, entry(0, { mood: "great" })], "user-a"),
    ).toBe(first);
  });

  it("provides the four requested mood emojis", () => {
    expect(api.MOOD_EMOJI).toEqual({
      great: "😄",
      good: "🙂",
      okay: "😐",
      sad: "😔",
    });
  });
});

describe("shouldPromptForMood", () => {
  it("does not prompt while a current mood exists", () => {
    expect(api.shouldPromptForMood(entry(0), null)).toBe(false);
    expect(api.shouldPromptForMood(entry(0), NOW - DAY)).toBe(false);
  });

  it.each([
    [null, true],
    [NOW, false],
    [NOW - DAY + 1, false],
    [NOW - DAY, true],
    [NOW - DAY - 1, true],
    [NOW + 1, true],
    [NaN, true],
    [Infinity, true],
    [-Infinity, true],
  ])(
    "handles the last prompt timestamp %s with result %s",
    (lastPromptAt, expected) => {
      expect(api.shouldPromptForMood(null, lastPromptAt)).toBe(expected);
    },
  );

  it("supports a supplied clock for expiry checks", () => {
    expect(api.shouldPromptForMood(null, NOW, NOW + DAY - 1)).toBe(false);
    expect(api.shouldPromptForMood(null, NOW, NOW + DAY)).toBe(true);
  });
});

describe("mood prompt persistence", () => {
  it("uses the exact per-user key and preserves unrelated storage", () => {
    localStorage.setItem("auth-session", "keep-me");
    expect(api.getMoodPromptStorageKey("user-a")).toBe(
      "twobeone:mood-prompt:user-a",
    );
    expect(api.readMoodPromptAt("user-a")).toBeNull();
    api.markMoodPromptShown("user-a");

    expect(localStorage.getItem("twobeone:mood-prompt:user-a")).toBe(
      String(NOW),
    );
    expect(api.readMoodPromptAt("user-a")).toBe(NOW);
    expect(api.readMoodPromptAt("user-b")).toBeNull();
    expect(localStorage.getItem("auth-session")).toBe("keep-me");
  });

  it("reads persisted values and notices a later prompt from another tab", () => {
    const key = api.getMoodPromptStorageKey("user-a");
    localStorage.setItem(key, String(NOW - 1_000));
    expect(api.readMoodPromptAt("user-a")).toBe(NOW - 1_000);
    api.markMoodPromptShown("user-a", NOW - 500);
    localStorage.setItem(key, String(NOW));
    expect(api.readMoodPromptAt("user-a")).toBe(NOW);
  });

  it.each([
    "",
    " ",
    "NaN",
    "Infinity",
    "-1",
    "1.5",
    "0x10",
    "1e3",
    "123abc",
    "{}",
    "9007199254740992",
  ])("ignores malformed persisted timestamps: %s", (value) => {
    localStorage.setItem(api.getMoodPromptStorageKey("user-a"), value);
    expect(api.readMoodPromptAt("user-a")).toBeNull();
  });

  it("accepts timestamp zero and ignores invalid write timestamps", () => {
    api.markMoodPromptShown("user-a", 0);
    expect(api.readMoodPromptAt("user-a")).toBe(0);
    for (const invalid of [NaN, Infinity, -1, 1.5])
      api.markMoodPromptShown("user-a", invalid);
    expect(localStorage.getItem(api.getMoodPromptStorageKey("user-a"))).toBe(
      "0",
    );
  });

  it("uses separate in-memory timestamps when storage reads and writes are blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(api.readMoodPromptAt("user-a")).toBeNull();
    expect(() => api.markMoodPromptShown("user-a")).not.toThrow();
    expect(api.readMoodPromptAt("user-a")).toBe(NOW);
    expect(api.shouldPromptForMood(null, api.readMoodPromptAt("user-a"))).toBe(
      false,
    );
    expect(api.readMoodPromptAt("user-b")).toBeNull();
  });

  it("keeps a newer remembered prompt when a failed write leaves old storage behind", () => {
    localStorage.setItem(
      api.getMoodPromptStorageKey("user-a"),
      String(NOW - DAY),
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    api.markMoodPromptShown("user-a");
    expect(api.readMoodPromptAt("user-a")).toBe(NOW);
    expect(api.shouldPromptForMood(null, api.readMoodPromptAt("user-a"))).toBe(
      false,
    );
  });

  it("guards SSR access and retains the per-user memory fallback", () => {
    vi.stubGlobal("window", undefined);
    expect(api.readMoodPromptAt("user-a")).toBeNull();
    expect(() => api.markMoodPromptShown("user-a")).not.toThrow();
    expect(api.readMoodPromptAt("user-a")).toBe(NOW);
    expect(api.readMoodPromptAt("user-b")).toBeNull();
  });

  it("remembers a persisted prompt if subsequent storage reads become unavailable", () => {
    localStorage.setItem(api.getMoodPromptStorageKey("user-a"), String(NOW));
    expect(api.readMoodPromptAt("user-a")).toBe(NOW);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage no longer available");
    });
    expect(api.readMoodPromptAt("user-a")).toBe(NOW);
    expect(api.shouldPromptForMood(null, api.readMoodPromptAt("user-a"))).toBe(
      false,
    );
  });
});
