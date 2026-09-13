import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveLanguagePreference } from '../languagePreference';

const success = () => ({ ok: true, status: 200 }) as Response;
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
const save = (language: 'en' | 'am' | 'om', userId = 'user') => saveLanguagePreference({ language, userId, accessToken: 'fixture-token' });

describe('account language preference saves', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('dispatches overlapping Amharic and Oromo saves in order so the final completed write is Oromo', async () => {
    const firstResponse = deferred<Response>();
    const committed: string[] = [];
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const language = JSON.parse(String(init.body)).language;
      if (language === 'am') await firstResponse.promise;
      committed.push(language);
      return success();
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = save('am');
    const second = save('om');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ language: 'am' }) });

    firstResponse.resolve(success());
    await Promise.all([first, second]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ language: 'om' }) });
    expect(committed).toEqual(['am', 'om']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('continues queued saves after an HTTP failure while rejecting only the failed caller', async () => {
    const firstResponse = deferred<Response>();
    const fetchMock = vi.fn().mockImplementationOnce(() => firstResponse.promise).mockResolvedValue(success());
    vi.stubGlobal('fetch', fetchMock);
    const first = save('am');
    const firstFailure = expect(first).rejects.toThrow('Language preference sync failed');
    const second = save('om');
    await vi.advanceTimersByTimeAsync(0);
    firstResponse.resolve({ ok: false, status: 503 } as Response);

    await firstFailure;
    await expect(second).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('continues after a rejected network request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue(success()));
    const first = save('am');
    const failed = expect(first).rejects.toThrow('Failed to fetch');
    const second = save('om');
    await failed;
    await expect(second).resolves.toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects a stalled request at 15 seconds and releases its queue even when fetch ignores abort', async () => {
    let firstSignal: AbortSignal | undefined;
    const fetchMock = vi.fn()
      .mockImplementationOnce((_url: string, init: RequestInit) => {
        firstSignal = init.signal as AbortSignal;
        return new Promise<Response>(() => {});
      })
      .mockResolvedValue(success());
    vi.stubGlobal('fetch', fetchMock);
    const first = save('am');
    const timedOut = expect(first).rejects.toThrow('Language preference sync timed out');
    const second = save('om');
    await vi.advanceTimersByTimeAsync(14_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstSignal?.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await timedOut;
    await expect(second).resolves.toBeUndefined();
    expect(firstSignal?.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);

    // A completed queue must also accept a fresh save for the same account.
    await expect(save('en')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not hold another account behind a pending save', async () => {
    const firstResponse = deferred<Response>();
    const fetchMock = vi.fn().mockImplementationOnce(() => firstResponse.promise).mockResolvedValue(success());
    vi.stubGlobal('fetch', fetchMock);
    const first = save('am', 'first-account');
    const other = save('om', 'second-account');
    await other;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    firstResponse.resolve(success());
    await first;
    expect(vi.getTimerCount()).toBe(0);
  });
});
