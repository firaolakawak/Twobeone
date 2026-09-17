import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAccessToken } from '../api';
import { dailyFaithChallengeApi, DailyFaithChallengeError, type DailyFaithChallengeState } from '../dailyFaithChallengeApi';

vi.mock('../api', () => ({ getAccessToken: vi.fn() }));
vi.mock('../supabase/info', () => ({ projectId: 'test-project' }));

const valid: DailyFaithChallengeState = {
  day: '2026-09-17', missionId: 'quest-01', resetsAt: '2026-09-18T00:00:00.000Z',
  own: null, partner: { submitted: false, completed: false }, bothSubmitted: false,
};
const own = { choice: 0, guess: 1, submittedAt: '2026-09-17T10:00:00.000Z', completedAt: null };
const submission = { day: valid.day, missionId: valid.missionId, choice: 0, guess: 1 };
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('daily challenge API boundary', () => {
  beforeEach(() => {
    vi.mocked(getAccessToken).mockReset().mockResolvedValue('test-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond({ challenge: valid })));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

  it('authenticates the daily lookup and does not request data without a session', async () => {
    expect(await dailyFaithChallengeApi.today()).toEqual(valid);
    expect(fetch).toHaveBeenCalledWith('https://test-project.supabase.co/functions/v1/make-server-6d579fee/faith-challenge/today', expect.objectContaining({
      method: 'GET', headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
    }));
    vi.mocked(getAccessToken).mockResolvedValueOnce(null);
    await expect(dailyFaithChallengeApi.today()).rejects.toMatchObject({ code: 'unauthorized' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(['submit', 'complete'] as const)('sends a %s exactly once, with no automatic mutation retries', async (operation) => {
    vi.useFakeTimers();
    const confirmed = { ...valid, own };
    vi.mocked(fetch).mockResolvedValueOnce(respond({ challenge: confirmed }));
    expect(await dailyFaithChallengeApi[operation](submission)).toEqual(confirmed);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/faith-challenge/${operation}`), expect.objectContaining({ method: 'POST', body: JSON.stringify(submission) }));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('propagates server error codes without retrying a rejected submission', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValueOnce(respond({ code: 'mood_required' }, 409));
    await expect(dailyFaithChallengeApi.submit(submission)).rejects.toEqual(new DailyFaithChallengeError('mood_required'));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['missing challenge', {}],
    ['null envelope', null],
    ['invalid day', { challenge: { ...valid, day: 'today' } }],
    ['unknown mission', { challenge: { ...valid, missionId: 'quest-99' } }],
    ['invalid reset time', { challenge: { ...valid, resetsAt: 'tomorrow' } }],
    ['missing own', { challenge: { day: valid.day, missionId: valid.missionId, resetsAt: valid.resetsAt, partner: valid.partner, bothSubmitted: false } }],
    ['invalid own choice', { challenge: { ...valid, own: { ...own, choice: 3 } } }],
    ['invalid own guess', { challenge: { ...valid, own: { ...own, guess: 9 } } }],
    ['missing heart guess', { challenge: { ...valid, own: { ...own, guess: undefined } } }],
    ['null heart guess', { challenge: { ...valid, own: { ...own, guess: null } } }],
    ['invalid submission time', { challenge: { ...valid, own: { ...own, submittedAt: 'soon' } } }],
    ['missing partner completed flag', { challenge: { ...valid, partner: { submitted: false } } }],
    ['invalid partner completed flag', { challenge: { ...valid, partner: { submitted: false, completed: 'yes' } } }],
    ['inconsistent reveal status', { challenge: { ...valid, own, bothSubmitted: true, partner: { submitted: false, completed: false, choice: 1 } } }],
    ['missing revealed choice', { challenge: { ...valid, own, bothSubmitted: true, partner: { submitted: true, completed: false } } }],
    ['missing revealed heart guess', { challenge: { ...valid, own, bothSubmitted: true, partner: { submitted: true, completed: false, choice: 1 } } }],
  ])('rejects malformed responses: %s', async (_description, body) => {
    vi.mocked(fetch).mockResolvedValueOnce(respond(body));
    await expect(dailyFaithChallengeApi.today()).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it.each(['quest-02', 'quest-03'])('accepts optional and null guesses for non-heart mission %s', async (missionId) => {
    for (const guess of [undefined, null]) {
      const challenge = { ...valid, missionId, own: { ...own, guess }, bothSubmitted: true,
        partner: { submitted: true, completed: false, choice: 2, guess, submittedAt: own.submittedAt } };
      vi.mocked(fetch).mockResolvedValueOnce(respond({ challenge }));
      expect(await dailyFaithChallengeApi.today()).toEqual(JSON.parse(JSON.stringify(challenge)));
    }
  });

  it('forwards cancellation to a pending lookup', async () => {
    let fetchSignal!: AbortSignal;
    vi.mocked(fetch).mockImplementationOnce(async (_url, options) => {
      fetchSignal = options!.signal as AbortSignal;
      return await new Promise<Response>((_resolve, reject) => {
        fetchSignal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      });
    });
    const controller = new AbortController();
    const request = dailyFaithChallengeApi.today(controller.signal);
    await Promise.resolve();
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchSignal.aborted).toBe(true);
  });
});
