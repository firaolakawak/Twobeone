import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PushNotificationsManager } from '../PushNotificationsManager';

const subscribers = [{ userId: 'ff89619f-a5cd-41fa-a28b-04f93908afc5', name: 'Firaol Akawak', email: 'fireksf@gmail.com', status: 'enabled' }];

function mockPushApi(delivery = { totalSubscribers: 3, sent: 2, failed: 1, invalidSubscriptions: 0 }, subscriberData = subscribers) {
  const fetchMock = vi.fn().mockImplementation((input: string, options?: RequestInit) => {
    if (input.includes('/admin/push/subscribers') && !options?.method) {
      return Promise.resolve({ ok: true, json: async () => ({ subscribers: subscriberData, total: subscriberData.length }) });
    }
    return Promise.resolve({ ok: true, json: async () => delivery });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('PushNotificationsManager', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows subscribed users, the template library, and requires audience confirmation', async () => {
    mockPushApi();
    const user = userEvent.setup();
    render(<PushNotificationsManager accessToken="admin-token" />);

    expect(await screen.findByText('1 enabled')).toBeInTheDocument();
    expect(screen.queryByText('Firaol Akawak')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show list' }));
    expect(screen.getByText('Firaol Akawak')).toBeInTheDocument();
    expect(screen.getByText('fireksf@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('12 templates')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Choose a message template' })).toHaveValue('morning-devotional');
    expect(screen.getByRole('option', { name: /Prayer reminder/ })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Good morning 🌅')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send push notification' })).toBeDisabled();
  });

  it('sends the admin broadcast and reports its delivery result', async () => {
    const fetchMock = mockPushApi();
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
    mockPushApi();
    const user = userEvent.setup();
    render(<PushNotificationsManager accessToken="admin-token" />);

    await user.click(screen.getByRole('button', { name: 'Create new' }));
    expect(screen.getByRole('heading', { name: 'Create new notification' })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Notification title'), 'A note for your marriage');
    await user.type(screen.getByPlaceholderText('Write a short, meaningful message'), 'Take a moment to encourage one another today.');

    expect(screen.getByText('A note for your marriage', { selector: '.push-console__preview strong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send push notification' })).toBeDisabled();
  });

  it('paginates an expanded subscriber list', async () => {
    const manySubscribers = Array.from({ length: 12 }, (_, index) => ({
      userId: `user-${index + 1}`,
      name: `Member ${String(index + 1).padStart(2, '0')}`,
      email: `member${index + 1}@example.com`,
      status: 'enabled',
    }));
    mockPushApi(undefined, manySubscribers);
    const user = userEvent.setup();
    render(<PushNotificationsManager accessToken="admin-token" />);

    expect(await screen.findByText('12 enabled')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show list' }));
    expect(screen.getByText('Showing 1–10 of 12')).toBeInTheDocument();
    expect(screen.queryByText('Member 11')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next subscriber page' }));
    expect(screen.getByText('Showing 11–12 of 12')).toBeInTheDocument();
    expect(screen.getByText('Member 11')).toBeInTheDocument();
  });
});
