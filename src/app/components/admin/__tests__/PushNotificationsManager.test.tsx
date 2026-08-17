import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PushNotificationsManager } from '../PushNotificationsManager';

describe('PushNotificationsManager', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('previews the polished message and requires audience confirmation', () => {
    render(<PushNotificationsManager accessToken="admin-token" />);

    expect(screen.getByText('Thank you for being part of TwoBeOne 💕')).toBeInTheDocument();
    expect(screen.getByText(/We truly appreciate you using the TwoBeOne app/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send appreciation push' })).toBeDisabled();
  });

  it('sends the admin broadcast and reports its delivery result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ totalSubscribers: 3, sent: 2, failed: 1, invalidSubscriptions: 0 }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<PushNotificationsManager accessToken="admin-token" />);

    await user.click(screen.getByRole('checkbox', { name: /reviewed the message and audience/i }));
    await user.click(screen.getByRole('button', { name: 'Send appreciation push' }));

    expect(await screen.findByText('Broadcast complete')).toBeInTheDocument();
    expect(screen.getByText('2 of 3 subscribed devices reached.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/admin/push/appreciation'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer admin-token' }),
      }),
    );
  });
});
