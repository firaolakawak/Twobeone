import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { moods } from "../../utils/api";
import { getMoodPromptStorageKey } from "../../utils/moodCheckIn";
import { useDailyMoodCheckIn } from "../useDailyMoodCheckIn";

vi.mock("../../utils/api", () => ({
  moods: { list: vi.fn(), save: vi.fn() },
}));

const DAY = 24 * 60 * 60_000;
const NOW = Date.parse("2026-09-13T08:00:00.000Z");
let pair = { userId: "user-a", partnerId: "partner-a" };
let scopeNumber = 0;
const list = vi.mocked(moods.list);
const save = vi.mocked(moods.save);
let hidden = false;

function mood(
  userId: string,
  value: "great" | "good" | "okay" | "sad" = "good",
  age = 0,
) {
  return {
    userId,
    mood: value,
    createdAt: new Date(Date.now() - age).toISOString(),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useDailyMoodCheckIn", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.resetAllMocks();
    localStorage.clear();
    // The real helper retains an in-memory fallback when storage is unavailable.
    // Independent users keep that intentional persistence isolated between tests.
    scopeNumber += 1;
    pair = {
      userId: `user-a-${scopeNumber}`,
      partnerId: `partner-a-${scopeNumber}`,
    };
    hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    list.mockResolvedValue({ moods: [] });
    save.mockResolvedValue({ success: true, mood: mood(pair.userId) });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("waits for a successful initial read before opening a missing-mood prompt", async () => {
    const pending = deferred<Awaited<ReturnType<typeof moods.list>>>();
    list.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useDailyMoodCheckIn(pair));

    expect(result.current.isOpen).toBe(false);
    await advance(1500);
    expect(list).toHaveBeenCalledOnce();
    expect(result.current.isOpen).toBe(false);

    await act(async () => pending.resolve({ moods: [] }));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.ownMood).toBeNull();
  });

  it("shows only current moods for this pair and suppresses the prompt when own mood is fresh", async () => {
    const own = mood(pair.userId, "great");
    const partner = mood(pair.partnerId, "sad", 1000);
    list.mockResolvedValue({
      moods: [
        mood("unrelated-user", "okay"),
        mood(pair.userId, "sad", DAY),
        partner,
        own,
      ],
    });
    const { result } = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);

    expect(result.current.ownMood).toEqual(own);
    expect(result.current.partnerMood).toEqual(partner);
    expect(result.current.isOpen).toBe(false);
  });

  it("records the automatic prompt when shown and preserves dismissal across remounts", async () => {
    const first = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);
    expect(first.result.current.isOpen).toBe(true);
    // A reload while the prompt is still open must not display it again.
    first.unmount();
    const second = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);
    expect(second.result.current.isOpen).toBe(false);

    act(() => second.result.current.openCheckIn());
    expect(second.result.current.isOpen).toBe(true);
    act(() => second.result.current.closeCheckIn());
    expect(second.result.current.isOpen).toBe(false);
    second.unmount();
    const third = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);
    expect(third.result.current.isOpen).toBe(false);
  });

  it("makes the prompt eligible exactly 24 hours after it was last shown", async () => {
    const first = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);
    const shownAt = Date.now();
    act(() => first.result.current.closeCheckIn());
    first.unmount();

    vi.setSystemTime(shownAt + DAY - 3000);
    const next = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);
    expect(next.result.current.isOpen).toBe(false);
    await advance(1499);
    expect(next.result.current.isOpen).toBe(false);
    await advance(1);
    expect(next.result.current.isOpen).toBe(true);
  });

  it("expires displayed moods at their boundary and waits for refresh before prompting", async () => {
    const pending = deferred<Awaited<ReturnType<typeof moods.list>>>();
    list
      .mockResolvedValueOnce({
        moods: [
          mood(pair.userId, "good", DAY - 10_000),
          mood(pair.partnerId, "great", DAY - 10_000),
        ],
      })
      .mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);
    await advance(8499);
    expect(result.current.ownMood?.mood).toBe("good");
    expect(result.current.partnerMood?.mood).toBe("great");

    await advance(1);
    expect(result.current.ownMood).toBeNull();
    expect(result.current.partnerMood).toBeNull();
    expect(result.current.isOpen).toBe(false);
    await act(async () => pending.resolve({ moods: [] }));
    expect(result.current.isOpen).toBe(true);
  });

  it.each(["rejected", "warning"])(
    "does not prompt from an initial %s read and can recover on focus",
    async (failure) => {
      if (failure === "rejected")
        list.mockRejectedValueOnce(new Error("offline"));
      else
        list.mockResolvedValueOnce({
          moods: [],
          warning: "offline fallback",
        } as Awaited<ReturnType<typeof moods.list>>);
      const { result } = renderHook(() => useDailyMoodCheckIn(pair));
      await advance(1500);
      expect(result.current.isOpen).toBe(false);
      act(() => window.dispatchEvent(new Event("focus")));
      await settle();
      expect(result.current.isOpen).toBe(true);
    },
  );

  it.each([
    { userId: pair.userId, partnerId: undefined },
    { userId: undefined, partnerId: pair.partnerId },
  ])(
    "does not automatically prompt for an incomplete pair %j",
    async (scope) => {
      const { result } = renderHook(() => useDailyMoodCheckIn(scope));
      await advance(5 * 60_000);
      expect(result.current.isOpen).toBe(false);
      expect(list).not.toHaveBeenCalled();
    },
  );

  it("refreshes on the five-minute poll and when a visible window resumes", async () => {
    const own = mood(pair.userId);
    list.mockResolvedValue({ moods: [own] });
    const { result } = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);
    list.mockResolvedValue({ moods: [own, mood(pair.partnerId, "sad")] });
    await advance(5 * 60_000);
    expect(list).toHaveBeenCalledTimes(2);
    expect(result.current.partnerMood?.mood).toBe("sad");

    hidden = true;
    act(() => window.dispatchEvent(new Event("focus")));
    await settle();
    expect(list).toHaveBeenCalledTimes(2);
    list.mockResolvedValue({ moods: [own, mood(pair.partnerId, "great")] });
    hidden = false;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    await settle();
    expect(result.current.partnerMood?.mood).toBe("great");
    expect(list).toHaveBeenCalledTimes(3);
  });

  it("opens manually even with a current mood and a recent automatic-prompt cooldown", async () => {
    const { result } = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);
    act(() => result.current.closeCheckIn());
    list.mockResolvedValue({ moods: [mood(pair.userId)] });
    act(() => window.dispatchEvent(new Event("focus")));
    await settle();
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.openCheckIn());
    expect(result.current.isOpen).toBe(true);
  });

  it("keeps a failed save open for retry and commits a successful retry without needing a read", async () => {
    const pending = deferred<Awaited<ReturnType<typeof moods.save>>>();
    save.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);
    let saveResult!: Promise<boolean>;
    act(() => {
      saveResult = result.current.saveMood("sad");
    });
    expect(result.current.isSaving).toBe(true);
    await act(async () => pending.reject(new Error("offline")));
    expect(await saveResult).toBe(false);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.saveFailed).toBe(true);
    expect(result.current.ownMood).toBeNull();

    list.mockRejectedValue(new Error("background read unavailable"));
    save.mockResolvedValueOnce({
      success: true,
      mood: mood(pair.userId, "great"),
    });
    let retryResult = false;
    await act(async () => {
      retryResult = await result.current.saveMood("great");
    });
    expect(retryResult).toBe(true);
    expect(result.current.ownMood?.mood).toBe("great");
    expect(result.current.isOpen).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveFailed).toBe(false);
    act(() => window.dispatchEvent(new Event("focus")));
    await settle();
    expect(result.current.ownMood?.mood).toBe("great");
  });

  it("uses the submitted mood when a successful server response omits its mood entry", async () => {
    save.mockResolvedValueOnce({ success: true, mood: undefined });
    const { result } = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);
    let saved = false;
    await act(async () => {
      saved = await result.current.saveMood("okay");
    });
    expect(saved).toBe(true);
    expect(result.current.ownMood).toMatchObject({
      userId: pair.userId,
      mood: "okay",
    });
    expect(result.current.isOpen).toBe(false);
  });

  it.each([
    { label: "missing confirmation", response: {} },
    { label: "negative confirmation", response: { success: false } },
  ])("keeps the dialog open when save returns $label", async ({ response }) => {
    save.mockResolvedValueOnce(
      response as Awaited<ReturnType<typeof moods.save>>,
    );
    const { result } = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);
    let saved = true;
    await act(async () => {
      saved = await result.current.saveMood("good");
    });

    expect(saved).toBe(false);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveFailed).toBe(true);
    expect(result.current.ownMood).toBeNull();
  });

  it("does not retry rapidly when a failed load encounters a far-future prompt timestamp", async () => {
    localStorage.setItem(
      getMoodPromptStorageKey(pair.userId),
      String(Number.MAX_SAFE_INTEGER),
    );
    list.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useDailyMoodCheckIn(pair));

    await advance(1500);
    expect(list).toHaveBeenCalledOnce();
    await advance(10_000);
    expect(list).toHaveBeenCalledOnce();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.ownMood).toBeNull();
  });

  it("ignores a list that began before a successful save", async () => {
    const pending = deferred<Awaited<ReturnType<typeof moods.list>>>();
    const { result } = renderHook(() => useDailyMoodCheckIn(pair));
    await advance(1500);
    list.mockReturnValueOnce(pending.promise);
    act(() => window.dispatchEvent(new Event("focus")));
    save.mockResolvedValueOnce({
      success: true,
      mood: mood(pair.userId, "great"),
    });
    await act(async () => {
      await result.current.saveMood("great");
    });
    await act(async () => pending.resolve({ moods: [] }));
    expect(result.current.ownMood?.mood).toBe("great");
    expect(result.current.isOpen).toBe(false);
  });

  it("resets the scope and ignores a prior user's in-flight list", async () => {
    const oldRead = deferred<Awaited<ReturnType<typeof moods.list>>>();
    list.mockReturnValueOnce(oldRead.promise);
    const { result, rerender } = renderHook(useDailyMoodCheckIn, {
      initialProps: pair,
    });
    await advance(1500);
    const nextPair = { userId: "user-b", partnerId: "partner-b" };
    const nextOwn = mood(nextPair.userId, "great");
    list.mockResolvedValueOnce({ moods: [nextOwn] });
    rerender(nextPair);
    expect(result.current.ownMood).toBeNull();
    expect(result.current.isOpen).toBe(false);
    await advance(1500);
    await act(async () =>
      oldRead.resolve({ moods: [mood(pair.userId, "sad")] }),
    );
    expect(result.current.ownMood).toEqual(nextOwn);
    expect(result.current.partnerMood).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it("ignores a previous pair's save response after changing partners", async () => {
    const oldSave = deferred<Awaited<ReturnType<typeof moods.save>>>();
    save.mockReturnValueOnce(oldSave.promise);
    const { result, rerender } = renderHook(useDailyMoodCheckIn, {
      initialProps: pair,
    });
    await advance(1500);
    let pendingSave!: Promise<boolean>;
    act(() => {
      pendingSave = result.current.saveMood("sad");
    });
    const currentMood = mood(pair.userId, "great");
    list.mockResolvedValueOnce({ moods: [currentMood] });
    rerender({ ...pair, partnerId: "partner-b" });
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isOpen).toBe(false);
    await advance(1500);
    await act(async () => {
      oldSave.resolve({ success: true, mood: mood(pair.userId, "sad") });
      await pendingSave;
    });
    expect(result.current.ownMood).toEqual(currentMood);
    expect(result.current.saveFailed).toBe(false);
    expect(result.current.isOpen).toBe(false);
  });

  it.each(["success", "rejection"])(
    "ignores an older %s after switching A to B to A while a newer save is pending",
    async (outcome) => {
      const oldSave = deferred<Awaited<ReturnType<typeof moods.save>>>();
      const newSave = deferred<Awaited<ReturnType<typeof moods.save>>>();
      save
        .mockReturnValueOnce(oldSave.promise)
        .mockReturnValueOnce(newSave.promise);
      const { result, rerender } = renderHook(useDailyMoodCheckIn, {
        initialProps: pair,
      });
      await advance(1500);
      let oldResult!: Promise<boolean>;
      act(() => {
        oldResult = result.current.saveMood("sad");
      });

      rerender({ userId: "user-b", partnerId: "partner-b" });
      rerender(pair);
      act(() => result.current.openCheckIn());
      let newResult!: Promise<boolean>;
      act(() => {
        newResult = result.current.saveMood("great");
      });
      await act(async () => {
        if (outcome === "success")
          oldSave.resolve({ success: true, mood: mood(pair.userId, "sad") });
        else oldSave.reject(new Error("older request failed"));
        await oldResult;
      });

      expect(await oldResult).toBe(false);
      expect(result.current.isSaving).toBe(true);
      expect(result.current.isOpen).toBe(true);
      expect(result.current.saveFailed).toBe(false);
      expect(result.current.ownMood).toBeNull();

      await act(async () => {
        newSave.resolve({ success: true, mood: mood(pair.userId, "great") });
        await newResult;
      });
      expect(await newResult).toBe(true);
      expect(result.current.ownMood?.mood).toBe("great");
      expect(result.current.isSaving).toBe(false);
      expect(result.current.isOpen).toBe(false);
    },
  );
});
