import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { moods } from '../../utils/api';
import { useDailyMoods } from '../useDailyMoods';

vi.mock('../../utils/api', () => ({ moods: { list: vi.fn(), save: vi.fn() } }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

function entry(userId: string, mood = 'great', createdAt = new Date().toISOString()) {
  return { userId, mood, createdAt };
}

async function advance(milliseconds = 1500) {
  await act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); });
}

describe('useDailyMoods', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 13, 12));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.mocked(moods.list).mockReset().mockResolvedValue({ moods: [] });
    vi.mocked(moods.save).mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('waits for a successful initial lookup before reporting that a mood is unset', async () => {
    vi.mocked(moods.list).mockRejectedValueOnce(new Error('Offline'));
    const { result } = renderHook(() => useDailyMoods('user', 'partner'));
    expect(result.current.loaded).toBe(false);
    await advance();
    expect(result.current.loaded).toBe(false);
    expect(result.current.userMood).toBeNull();

    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(result.current.loaded).toBe(true);
    expect(result.current.userMood).toBeNull();
  });

  it('cancels the delayed initial request when unmounted', async () => {
    const { unmount } = renderHook(() => useDailyMoods('user', 'partner'));
    await advance(1000);
    expect(moods.list).not.toHaveBeenCalled();
    unmount();
    await advance(1000);
    expect(moods.list).not.toHaveBeenCalled();
  });

  it('finds the other mood when one partner has filled the first history page', async () => {
    const partnerMood = entry('partner');
    const userMood = entry('user', 'okay', new Date(2026, 8, 13, 8).toISOString());
    const cursor = new Date(2026, 8, 13, 9).toISOString();
    vi.mocked(moods.list)
      .mockResolvedValueOnce({ moods: [partnerMood], nextBefore: cursor })
      .mockResolvedValueOnce({ moods: [userMood] });
    const { result } = renderHook(() => useDailyMoods('user', 'partner'));
    await advance();
    expect(moods.list).toHaveBeenNthCalledWith(1, 2, { limit: 100 });
    expect(moods.list).toHaveBeenNthCalledWith(2, 2, { limit: 100, before: cursor });
    expect(result.current.userMood).toEqual(userMood);
    expect(result.current.partnerMood).toEqual(partnerMood);
    expect(result.current.loaded).toBe(true);
  });

  it('does not page into yesterday when today has no mood for one person', async () => {
    vi.mocked(moods.list).mockResolvedValue({
      moods: [entry('partner')],
      nextBefore: new Date(2026, 8, 12, 23, 59).toISOString(),
    });
    const { result } = renderHook(() => useDailyMoods('user', 'partner'));
    await advance();
    expect(moods.list).toHaveBeenCalledTimes(1);
    expect(result.current.userMood).toBeNull();
    expect(result.current.loaded).toBe(true);
  });

  it('ignores an old account response after the signed-in person changes', async () => {
    const oldRequest = deferred<{ moods: ReturnType<typeof entry>[] }>();
    vi.mocked(moods.list).mockReturnValueOnce(oldRequest.promise);
    const { result, rerender } = renderHook(({ userId }) => useDailyMoods(userId, 'partner'), {
      initialProps: { userId: 'old-user' },
    });
    await advance();
    rerender({ userId: 'new-user' });
    expect(result.current.loaded).toBe(false);
    const newMood = entry('new-user', 'okay');
    vi.mocked(moods.list).mockResolvedValueOnce({ moods: [newMood] });
    await advance();
    await act(async () => { oldRequest.resolve({ moods: [entry('old-user')] }); });
    expect(result.current.userMood).toEqual(newMood);
  });

  it('expires both moods at local midnight even while the tab is hidden', async () => {
    vi.setSystemTime(new Date(2026, 8, 13, 23, 59, 50));
    vi.mocked(moods.list).mockResolvedValueOnce({ moods: [entry('user'), entry('partner')] });
    const { result } = renderHook(() => useDailyMoods('user', 'partner'));
    await advance();
    expect(result.current.userMood).not.toBeNull();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    await advance(8500);
    expect(result.current.userMood).toBeNull();
    expect(result.current.partnerMood).toBeNull();
    expect(result.current.loaded).toBe(false);
    expect(moods.list).toHaveBeenCalledTimes(1);

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(result.current.loaded).toBe(true);
    expect(moods.list).toHaveBeenCalledTimes(2);
  });

  it('refreshes visible tabs every minute and skips requests in the background', async () => {
    const { result } = renderHook(() => useDailyMoods('user', 'partner'));
    await advance();
    vi.mocked(moods.list).mockResolvedValue({ moods: [entry('partner', 'sad')] });
    await advance(58_500);
    expect(result.current.partnerMood?.mood).toBe('sad');
    expect(moods.list).toHaveBeenCalledTimes(2);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    await advance(120_000);
    expect(moods.list).toHaveBeenCalledTimes(2);
  });

  it('keeps a confirmed save when an older in-flight lookup finishes later', async () => {
    const { result } = renderHook(() => useDailyMoods('user', 'partner'));
    await advance();
    const staleRequest = deferred<{ moods: ReturnType<typeof entry>[] }>();
    vi.mocked(moods.list).mockReturnValueOnce(staleRequest.promise);
    await advance(58_500);
    const savedMood = entry('user', 'good');
    vi.mocked(moods.save).mockResolvedValueOnce({ success: true, mood: savedMood });
    await act(async () => { await result.current.saveMood('good'); });
    expect(result.current.userMood).toEqual(savedMood);
    expect(moods.list).toHaveBeenCalledTimes(2);
    await act(async () => { staleRequest.resolve({ moods: [] }); });
    expect(result.current.userMood).toEqual(savedMood);
  });

  it('propagates write failures and leaves the previous mood intact', async () => {
    const original = entry('user', 'okay');
    vi.mocked(moods.list).mockResolvedValue({ moods: [original] });
    vi.mocked(moods.save).mockRejectedValue(new Error('Offline'));
    const { result } = renderHook(() => useDailyMoods('user', 'partner'));
    await advance();
    await act(async () => { await expect(result.current.saveMood('sad')).rejects.toThrow('Offline'); });
    expect(result.current.userMood).toEqual(original);
  });

  it.each([
    { success: false, mood: entry('user') },
    { success: true, mood: entry('other-user') },
    { success: true, mood: entry('user', 'great', 'invalid-date') },
    { success: true, mood: entry('user', 'sad') },
  ])('rejects a malformed save response: %j', async response => {
    vi.mocked(moods.save).mockResolvedValue(response);
    const { result } = renderHook(() => useDailyMoods('user', 'partner'));
    await advance();
    await act(async () => { await expect(result.current.saveMood('great')).rejects.toThrow('Invalid saved mood response'); });
    expect(result.current.userMood).toBeNull();
  });
});
