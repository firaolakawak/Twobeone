import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession, refreshSession, signInWithPassword } = vi.hoisted(() => ({
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock('../supabase/client', () => ({
  createClient: () => ({
    auth: { getSession, refreshSession, signInWithPassword },
  }),
}));

vi.mock('../supabase/info', () => ({
  projectId: 'test-project',
  publicAnonKey: 'test-anon-key',
}));

import api, { auth } from '../api';

describe('API request wiring', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getSession.mockReset();
    refreshSession.mockReset();
    signInWithPassword.mockReset();
  });

  it('calls signup with the anon key before a user session exists', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ user: { id: 'user-1' }, inviteCode: 'INVITE1' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ));
    signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: { access_token: 'user-token' } },
      error: null,
    });

    await expect(auth.signup('person@example.com', 'secret12', 'Person')).resolves.toMatchObject({
      user: { id: 'user-1' },
      session: { access_token: 'user-token' },
      inviteCode: 'INVITE1',
    });

    expect(getSession).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://test-project.supabase.co/functions/v1/make-server-6d579fee/signup',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-anon-key' }),
      }),
    );
  });

  it('exposes the AI APIs through the default client facade', () => {
    expect(api.marriageReadiness).toBeDefined();
    expect(api.compatibility).toBeDefined();
  });

  it('refreshes an expired session even when the endpoint has network retries', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'expired-token' } } });
    refreshSession.mockResolvedValue({ data: { session: { access_token: 'fresh-token' } } });
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ profile: { id: 'user-1' }, partner: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ));

    await expect(api.profile.get()).resolves.toEqual({
      profile: { id: 'user-1' },
      partner: null,
    });
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/profile'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer fresh-token' }),
      }),
    );
  });
});
