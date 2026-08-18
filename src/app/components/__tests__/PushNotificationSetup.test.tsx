import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { PushNotificationSetup } from '../PushNotificationSetup';

vi.mock('../../utils/pwa', () => ({
  VAPID_PUBLIC_KEY: 'test-key',
  pushSubscriptionMatchesCurrentKey: () => true,
  requestNotificationPermission: vi.fn(),
  subscribeToPushNotifications: vi.fn(),
}));

describe('PushNotificationSetup', () => {
  beforeEach(() => {
    sessionStorage.clear();
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission: 'granted' },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('does not flash the reminder dialog while an enabled subscription is still loading', async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { ready: new Promise(() => {}) },
    });

    render(
      <LanguageProvider>
        <PushNotificationSetup userId="user-1" accessToken="token" reminderOnly />
      </LanguageProvider>,
    );

    await act(async () => Promise.resolve());
    act(() => vi.advanceTimersByTime(1500));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('never suggests disabling when notifications are on', async () => {
    const subscription = { toJSON: () => ({ endpoint: 'https://push.example' }) };
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) },
        }),
      },
    });

    render(
      <LanguageProvider>
        <PushNotificationSetup userId="user-1" accessToken="token" />
      </LanguageProvider>,
    );

    await waitFor(() => expect(screen.getByTitle('Notifications On')).toBeInTheDocument());
    await userEvent.click(screen.getByTitle('Notifications On'));

    expect(screen.queryByText('Disable Notifications')).not.toBeInTheDocument();
  });

  it('reminds a user whose notifications are not enabled', async () => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission: 'default' },
    });

    render(
      <LanguageProvider>
        <PushNotificationSetup userId="user-2" accessToken="token" reminderOnly />
      </LanguageProvider>,
    );

    await act(async () => Promise.resolve());
    act(() => vi.advanceTimersByTime(1500));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enable Notifications' })).toBeInTheDocument();
    expect(screen.queryByText('Disable Notifications')).not.toBeInTheDocument();
  });
});
