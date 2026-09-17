import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerFaithChallengeRoutes } from '../faith_challenge_routes';

const challenge = {
  day: '2026-09-17', missionId: 'quest-01', resetsAt: '2026-09-18T00:00:00+00:00',
  own: null, partner: { submitted: false, completed: false }, bothSubmitted: false,
};
const dependencies = {
  getUserFromToken: vi.fn(), rpc: vi.fn(), sendPush: vi.fn(),
};
let app: Hono;

function request(action: 'today' | 'submit' | 'complete', body?: unknown, authorization = 'Bearer verified-token') {
  return app.request(`/make-server-6d579fee/faith-challenge/${action}`, {
    method: action === 'today' ? 'GET' : 'POST',
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    ...(action === 'today' ? {} : { body: JSON.stringify(body) }),
  });
}

describe('daily faith challenge HTTP boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.getUserFromToken.mockResolvedValue('authenticated-user');
    dependencies.rpc.mockResolvedValue({ data: { challenge, notification: null }, error: null });
    dependencies.sendPush.mockResolvedValue(undefined);
    app = new Hono();
    registerFaithChallengeRoutes(app, dependencies);
  });

  it.each(['today', 'submit', 'complete'] as const)('requires verified authentication for %s', async (action) => {
    dependencies.getUserFromToken.mockResolvedValue(null);
    const response = await request(action, { day: challenge.day, missionId: challenge.missionId, choice: 1 });
    expect(response.status).toBe(401);
    expect(dependencies.getUserFromToken).toHaveBeenCalledWith('Bearer verified-token');
    expect(dependencies.rpc).not.toHaveBeenCalled();
    expect(dependencies.sendPush).not.toHaveBeenCalled();
  });

  it('loads only the authenticated couple and disables response caching', async () => {
    const response = await request('today');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ challenge });
    expect(dependencies.rpc).toHaveBeenCalledWith('daily_faith_challenge', {
      p_user_id: 'authenticated-user', p_action: 'today', p_payload: {},
    });
  });

  it('discards caller-supplied identities, partner answers and notification contents', async () => {
    await request('submit', {
      day: challenge.day, missionId: challenge.missionId, choice: 1, guess: 2,
      userId: 'victim', partnerId: 'stranger', partnerChoice: 0, notification: { recipientId: 'stranger' },
    });
    expect(dependencies.rpc).toHaveBeenCalledWith('daily_faith_challenge', {
      p_user_id: 'authenticated-user', p_action: 'submit',
      p_payload: { day: challenge.day, missionId: challenge.missionId, choice: 1, guess: 2, kindnessDone: false },
    });
  });

  it.each([null, [], {}, { ...challenge, choice: '1' }, { ...challenge, choice: -1 },
    { ...challenge, choice: 3 }, { ...challenge, choice: 1.5 }, { ...challenge, choice: 1, guess: 9 }])(
    'rejects malformed submission without touching storage: %j', async (body) => {
      const response = await request('submit', body);
      expect(response.status).toBe(400);
      expect(dependencies.rpc).not.toHaveBeenCalled();
    },
  );

  it('rejects malformed JSON', async () => {
    const response = await app.request('/make-server-6d579fee/faith-challenge/submit', {
      method: 'POST', headers: { Authorization: 'Bearer verified-token', 'Content-Type': 'application/json' }, body: '{',
    });
    expect(response.status).toBe(400);
    expect(dependencies.rpc).not.toHaveBeenCalled();
  });

  it.each(['partner_required', 'day_changed', 'mission_changed', 'waiting_for_partner'])('preserves controlled conflict %s', async (code) => {
    dependencies.rpc.mockResolvedValue({ data: { code }, error: null });
    const response = await request('complete', { day: challenge.day, missionId: challenge.missionId });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code });
    expect(dependencies.sendPush).not.toHaveBeenCalled();
  });

  it('sends only the transaction-created notice and excludes it from the API response', async () => {
    const notification = { id: 'once', recipientId: 'real-partner', type: 'faith_challenge' };
    dependencies.rpc.mockResolvedValueOnce({ data: { challenge, notification }, error: null });
    const body = { day: challenge.day, missionId: challenge.missionId, choice: 0, guess: 1 };
    const response = await request('submit', body);
    expect(await response.json()).toEqual({ challenge });
    await request('submit', body);
    expect(dependencies.sendPush).toHaveBeenCalledTimes(1);
    expect(dependencies.sendPush).toHaveBeenCalledWith(notification);
  });

  it('preserves a saved submission when best-effort push fails', async () => {
    dependencies.rpc.mockResolvedValue({ data: { challenge, notification: { id: 'once' } }, error: null });
    dependencies.sendPush.mockRejectedValue(new Error('Push unavailable'));
    const response = await request('submit', { day: challenge.day, missionId: challenge.missionId, choice: 2, guess: 1 });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ challenge });
  });

  it('fails closed when the migration or database is unavailable', async () => {
    dependencies.rpc.mockResolvedValue({ data: null, error: { message: 'private schema details' } });
    const response = await request('today');
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Today’s challenge is temporarily unavailable. Please try again.', code: 'unavailable' });
    expect(dependencies.sendPush).not.toHaveBeenCalled();
  });
});
