import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PushNotificationsManager } from '../PushNotificationsManager';

describe('PushNotificationsManager', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the template library and requires audience confirmation', () => {
    render(<PushNotificationsManager accessToken="admin-token" />);

    expect(screen.getByText('12 templates')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Morning devotional/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Prayer reminder/ })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Good morning 🌅')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send push notification' })).toBeDisabled();
  });

  it('sends the admin broadcast and reports its delivery result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ totalSubscribers: 3, sent: 2, failed: 1, invalidSubscriptions: 0 }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<PushNotificationsManager accessToken="admin-token" />);

    await user.click(screen.getByRole('checkbox', { name: /reviewed the message, destination, and audience/i }));
    await user.click(screen.getByRole('button', { name: 'Send push notification' }));

    expect(await screen.findByText('Broadcast complete')).toBeInTheDocument();
    expect(screen.getByText('2 of 3 subscribed devices reached.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/admin/push/broadcast'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer admin-token' }),
        body: expect.stringContaining('morning-devotional'),
      }),
    );
  });

  it('lets an admin create a custom notification', async () => {
    const user = userEvent.setup();
    render(<PushNotificationsManager accessToken="admin-token" />);

    await user.click(screen.getByRole('button', { name: 'Create new' }));
    expect(screen.getByRole('heading', { name: 'Create new notification' })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Notification title'), 'A note for your marriage');
    await user.type(screen.getByPlaceholderText('Write a short, meaningful message'), 'Take a moment to encourage one another today.');

    expect(screen.getByText('A note for your marriage', { selector: '.push-console__preview strong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send push notification' })).toBeDisabled();
  });
});
