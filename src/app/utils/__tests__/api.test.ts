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

import api, { auth, warmUpServer } from '../api';

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

  it('authorizes the public health warm-up with the anon key', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ status: 'ok' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ));

    await warmUpServer();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://test-project.supabase.co/functions/v1/make-server-6d579fee/health',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer test-anon-key' }),
      }),
    );
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

  it('retries prayer updates with a refreshed token while preserving the request', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'expired-token' } } });
    refreshSession.mockResolvedValue({ data: { session: { access_token: 'fresh-token' } } });
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ success: true, prayer: { id: 'prayer-1', partnerPrayed: true } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ));

    await expect(api.prayer.update('prayer-1', { partnerPrayed: true })).resolves.toEqual({
      success: true,
      prayer: { id: 'prayer-1', partnerPrayed: true },
    });

    expect(refreshSession).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://test-project.supabase.co/functions/v1/make-server-6d579fee/prayer/prayer-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ partnerPrayed: true }),
        headers: expect.objectContaining({ Authorization: 'Bearer expired-token' }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://test-project.supabase.co/functions/v1/make-server-6d579fee/prayer/prayer-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ partnerPrayed: true }),
        headers: expect.objectContaining({ Authorization: 'Bearer fresh-token' }),
      }),
    );
  });

  it('lists prayer comments with an encoded prayer id and pagination', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'user-token' } } });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ comments: [], nextBefore: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ));

    await expect(api.prayer.listComments('prayer/one', {
      limit: 25,
      before: '2026-09-19T12:00:00.000Z',
    })).resolves.toEqual({ comments: [], nextBefore: null });

    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestUrl.pathname).toContain('/prayer/prayer%2Fone/comments');
    expect(requestUrl.searchParams.get('limit')).toBe('25');
    expect(requestUrl.searchParams.get('before')).toBe('2026-09-19T12:00:00.000Z');
  });

  it('retries a prayer comment with fresh authentication and preserves its body', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'expired-token' } } });
    refreshSession.mockResolvedValue({ data: { session: { access_token: 'fresh-token' } } });
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ))
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ comment: { id: 'comment-1', content: 'Amen' } }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ));

    await expect(api.prayer.addComment('prayer-1', 'Amen')).resolves.toEqual({
      comment: { id: 'comment-1', content: 'Amen' },
    });

    expect(refreshSession).toHaveBeenCalledOnce();
    for (const [index, token] of ['expired-token', 'fresh-token'].entries()) {
      expect(fetchMock).toHaveBeenNthCalledWith(
        index + 1,
        'https://test-project.supabase.co/functions/v1/make-server-6d579fee/prayer/prayer-1/comments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ message: 'Amen' }),
          headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
        }),
      );
    }
  });
});
