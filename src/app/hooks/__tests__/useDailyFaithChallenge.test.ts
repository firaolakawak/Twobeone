import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dailyFaithChallengeApi, DailyFaithChallengeError, type DailyFaithChallengeState } from '../../utils/dailyFaithChallengeApi';
import { useDailyFaithChallenge } from '../useDailyFaithChallenge';

vi.mock('../../utils/dailyFaithChallengeApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/dailyFaithChallengeApi')>();
  return { ...actual, dailyFaithChallengeApi: { today: vi.fn(), submit: vi.fn(), complete: vi.fn() } };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

const empty: DailyFaithChallengeState = {
  day: '2026-09-17', missionId: 'quest-01', resetsAt: '2026-09-18T00:00:00.000Z',
  own: null, partner: { submitted: false, completed: false }, bothSubmitted: false,
};
const saved: DailyFaithChallengeState = {
  ...empty, own: { choice: 1, guess: 2, submittedAt: '2026-09-17T10:00:00.000Z', completedAt: null },
};
const submission = { day: empty.day, missionId: empty.missionId, choice: 1, guess: 2 };
const flush = () => act(async () => {});
const advance = (milliseconds: number) => act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); });

describe('daily challenge request lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.mocked(dailyFaithChallengeApi.today).mockReset().mockResolvedValue(empty);
    vi.mocked(dailyFaithChallengeApi.submit).mockReset().mockResolvedValue(saved);
    vi.mocked(dailyFaithChallengeApi.complete).mockReset();
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it('keeps a confirmed submission when an older lookup resolves afterward', async () => {
    const stale = deferred<DailyFaithChallengeState>();
    vi.mocked(dailyFaithChallengeApi.today).mockReturnValueOnce(stale.promise);
    const { result } = renderHook(() => useDailyFaithChallenge(true));
    const readSignal = vi.mocked(dailyFaithChallengeApi.today).mock.calls[0][0];
    await act(async () => { expect(await result.current.submit(submission)).toBe(true); });
    expect(readSignal?.aborted).toBe(true);
    expect(result.current.challenge).toEqual(saved);
    await act(async () => { stale.resolve(empty); });
    expect(result.current.challenge).toEqual(saved);
    expect(result.current.loading).toBe(false);
  });

  it('retains the last confirmed state after rejection and allows an explicit retry', async () => {
    const { result } = renderHook(() => useDailyFaithChallenge(true));
    await flush();
    vi.mocked(dailyFaithChallengeApi.submit).mockRejectedValueOnce(new DailyFaithChallengeError('unavailable'));
    await act(async () => { expect(await result.current.submit(submission)).toBe(false); });
    expect(result.current.challenge).toEqual(empty);
    expect(result.current.error).toBe('unavailable');
    expect(result.current.saving).toBe(false);
    await advance(60_000);
    expect(dailyFaithChallengeApi.submit).toHaveBeenCalledTimes(1);
    await act(async () => { expect(await result.current.submit(submission)).toBe(true); });
    expect(result.current.challenge).toEqual(saved);
    expect(result.current.error).toBeNull();
    expect(dailyFaithChallengeApi.submit).toHaveBeenCalledTimes(2);
  });

  it('sends one mutation during double clicks and holds polling until it finishes', async () => {
    const pending = deferred<DailyFaithChallengeState>();
    vi.mocked(dailyFaithChallengeApi.submit).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useDailyFaithChallenge(true));
    await flush();
    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => { first = result.current.submit(submission); second = result.current.submit(submission); });
    expect(result.current.saving).toBe(true);
    expect(await second).toBe(false);
    await advance(60_000);
    expect(dailyFaithChallengeApi.today).toHaveBeenCalledTimes(1);
    expect(dailyFaithChallengeApi.submit).toHaveBeenCalledTimes(1);
    await act(async () => { pending.resolve(saved); expect(await first).toBe(true); });
    expect(result.current.saving).toBe(false);
    await advance(60_000);
    expect(dailyFaithChallengeApi.submit).toHaveBeenCalledTimes(1);
  });

  it('does not claim completion after a failed complete request', async () => {
    vi.mocked(dailyFaithChallengeApi.today).mockResolvedValue(saved);
    vi.mocked(dailyFaithChallengeApi.complete).mockRejectedValueOnce(new Error('Offline'));
    const { result } = renderHook(() => useDailyFaithChallenge(true));
    await flush();
    await act(async () => { expect(await result.current.complete(submission)).toBe(false); });
    expect(result.current.challenge?.own?.completedAt).toBeNull();
    expect(result.current.error).toBe('complete');
    expect(result.current.saving).toBe(false);
  });

  it('skips background polling and refreshes immediately when the tab becomes visible', async () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    renderHook(() => useDailyFaithChallenge(true));
    await advance(60_000);
    expect(dailyFaithChallengeApi.today).not.toHaveBeenCalled();
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(dailyFaithChallengeApi.today).not.toHaveBeenCalled();
    visibility.mockReturnValue('visible');
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(dailyFaithChallengeApi.today).toHaveBeenCalledTimes(1);
    await advance(30_000);
    expect(dailyFaithChallengeApi.today).toHaveBeenCalledTimes(2);
  });

  it('aborts old reads on unmount and ignores old account results after a new keyed mount', async () => {
    const stale = deferred<DailyFaithChallengeState>();
    vi.mocked(dailyFaithChallengeApi.today).mockReturnValueOnce(stale.promise);
    const oldAccount = renderHook(() => useDailyFaithChallenge(true));
    const signal = vi.mocked(dailyFaithChallengeApi.today).mock.calls[0][0];
    oldAccount.unmount();
    expect(signal?.aborted).toBe(true);
    const newState = { ...empty, missionId: 'quest-02' };
    vi.mocked(dailyFaithChallengeApi.today).mockResolvedValue(newState);
    const newAccount = renderHook(() => useDailyFaithChallenge(true));
    await flush();
    await act(async () => { stale.resolve(saved); });
    expect(newAccount.result.current.challenge).toEqual(newState);
    newAccount.unmount();
    await advance(60_000);
    expect(dailyFaithChallengeApi.today).toHaveBeenCalledTimes(2);
  });

  it('does not report an unmounted account write as a successful current operation', async () => {
    const pending = deferred<DailyFaithChallengeState>();
    vi.mocked(dailyFaithChallengeApi.submit).mockReturnValueOnce(pending.promise);
    const oldAccount = renderHook(() => useDailyFaithChallenge(true));
    await flush();
    let request!: Promise<boolean>;
    act(() => { request = oldAccount.result.current.submit(submission); });
    oldAccount.unmount();
    const newAccount = renderHook(() => useDailyFaithChallenge(true));
    await flush();
    await act(async () => { pending.resolve(saved); expect(await request).toBe(false); });
    expect(newAccount.result.current.challenge).toEqual(empty);
    expect(newAccount.result.current.saving).toBe(false);
  });

  it('allows the current session to continue after disabling while a write was pending', async () => {
    const pending = deferred<DailyFaithChallengeState>();
    vi.mocked(dailyFaithChallengeApi.submit).mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderHook(({ enabled }) => useDailyFaithChallenge(enabled), { initialProps: { enabled: true } });
    await flush();
    let request!: Promise<boolean>;
    act(() => { request = result.current.submit(submission); });
    rerender({ enabled: false });
    expect(result.current.challenge).toBeNull();
    expect(result.current.loading).toBe(false);
    await act(async () => { pending.resolve(saved); expect(await request).toBe(false); });
    expect(result.current.saving).toBe(false);
    rerender({ enabled: true });
    await flush();
    expect(result.current.challenge).toEqual(empty);
    await act(async () => { expect(await result.current.submit(submission)).toBe(true); });
  });

  it('keeps a newer write locked when an older enabled-session write settles', async () => {
    const oldWrite = deferred<DailyFaithChallengeState>();
    const newWrite = deferred<DailyFaithChallengeState>();
    vi.mocked(dailyFaithChallengeApi.submit).mockReturnValueOnce(oldWrite.promise).mockReturnValueOnce(newWrite.promise);
    const { result, rerender } = renderHook(({ enabled }) => useDailyFaithChallenge(enabled), { initialProps: { enabled: true } });
    await flush();
    let oldRequest!: Promise<boolean>;
    let newRequest!: Promise<boolean>;
    act(() => { oldRequest = result.current.submit(submission); });
    rerender({ enabled: false });
    rerender({ enabled: true });
    await flush();
    act(() => { newRequest = result.current.submit(submission); });
    await act(async () => { oldWrite.resolve(saved); expect(await oldRequest).toBe(false); });
    expect(result.current.saving).toBe(true);
    expect(result.current.challenge).toEqual(empty);
    await act(async () => { expect(await result.current.submit(submission)).toBe(false); });
    expect(dailyFaithChallengeApi.submit).toHaveBeenCalledTimes(2);
    await act(async () => { newWrite.resolve(saved); expect(await newRequest).toBe(true); });
    expect(result.current.saving).toBe(false);
    expect(result.current.challenge).toEqual(saved);
  });
});
