import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { requestNotificationPermission, subscribeToPushNotifications } from '../../utils/pwa';
import { PushNotificationSetup } from '../PushNotificationSetup';

vi.mock('../../utils/pwa', () => ({
  VAPID_PUBLIC_KEY: 'test-key',
  pushSubscriptionMatchesCurrentKey: () => true,
  requestNotificationPermission: vi.fn(),
  subscribeToPushNotifications: vi.fn(),
}));

function renderSetup(props: ComponentProps<typeof PushNotificationSetup>) {
  return render(<PushNotificationSetup {...props} />, { wrapper: LanguageProvider });
}

async function advanceReminder() {
  await act(async () => Promise.resolve());
  await act(async () => vi.advanceTimersByTimeAsync(1500));
}

function setPermission(permission: NotificationPermission) {
  Object.defineProperty(window, 'Notification', { configurable: true, value: { permission } });
}

describe('PushNotificationSetup', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    setPermission('granted');
    vi.mocked(subscribeToPushNotifications).mockReset().mockResolvedValue(null);
    vi.mocked(requestNotificationPermission).mockReset();
    vi.stubGlobal('PushManager', class {});
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(null) },
        }),
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    cleanup();
    window.history.replaceState({}, '', '/');
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('does not show or initialize web push for the APK URL wrapper', async () => {
    window.history.replaceState({}, '', '/?app=1');
    const serviceWorkerReady = vi.fn();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { get ready() { serviceWorkerReady(); return Promise.resolve(); } },
    });

    const { container } = render(
      <LanguageProvider>
        <PushNotificationSetup userId="apk-user" accessToken="token" reminderOnly />
      </LanguageProvider>,
    );

    await act(async () => Promise.resolve());
    expect(container).toBeEmptyDOMElement();
    expect(serviceWorkerReady).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
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

  it('remembers a dismissed reminder after logout and keeps manual setup available', async () => {
    vi.useFakeTimers();
    setPermission('default');
    const firstLogin = renderSetup({ userId: 'returning-user', accessToken: 'token', reminderOnly: true });

    await advanceReminder();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    firstLogin.unmount();
    sessionStorage.clear();

    const secondLogin = renderSetup({ userId: 'returning-user', accessToken: 'new-token', reminderOnly: true });
    await advanceReminder();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    secondLogin.rerender(<PushNotificationSetup userId="returning-user" accessToken="new-token" />);
    fireEvent.click(screen.getByTitle('Enable Notifications'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('tracks automatic reminders separately for each user', async () => {
    vi.useFakeTimers();
    setPermission('default');
    const firstUser = renderSetup({ userId: 'first-user', accessToken: 'token', reminderOnly: true });
    await advanceReminder();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    firstUser.unmount();

    renderSetup({ userId: 'second-user', accessToken: 'token', reminderOnly: true });
    await advanceReminder();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it.each(['dialog', 'alertdialog'])('waits for another %s to close before consuming the reminder', async (role) => {
    vi.useFakeTimers();
    setPermission('default');
    const otherDialog = render(<div role={role} aria-label="Mood check-in">How are you feeling?</div>);
    renderSetup({ userId: 'waiting-user', accessToken: 'token', reminderOnly: true });

    await advanceReminder();
    expect(screen.queryByRole('dialog', { name: 'Push Notifications' })).not.toBeInTheDocument();
    expect(localStorage.getItem('twobeone_push_reminder:waiting-user')).toBeNull();

    otherDialog.unmount();
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(screen.queryByRole('dialog', { name: 'Push Notifications' })).not.toBeInTheDocument();
    expect(localStorage.getItem('twobeone_push_reminder:waiting-user')).toBeNull();

    await act(async () => vi.advanceTimersByTimeAsync(100));
    expect(screen.getByRole('dialog', { name: 'Push Notifications' })).toBeInTheDocument();
    expect(localStorage.getItem('twobeone_push_reminder:waiting-user')).toBe('shown');
  });

  it('restarts the delay when a dialog opens while the reminder is pending', async () => {
    vi.useFakeTimers();
    setPermission('default');
    renderSetup({ userId: 'interrupted-user', accessToken: 'token', reminderOnly: true });
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTimeAsync(600));

    const otherDialog = render(<div role="dialog" data-state="open" aria-label="Mood check-in" />);
    await advanceReminder();
    expect(screen.queryByRole('dialog', { name: 'Push Notifications' })).not.toBeInTheDocument();

    otherDialog.rerender(<div role="dialog" data-state="closed" aria-label="Mood check-in" />);
    await act(async () => Promise.resolve());
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(screen.queryByRole('dialog', { name: 'Push Notifications' })).not.toBeInTheDocument();

    await act(async () => vi.advanceTimersByTimeAsync(100));
    expect(screen.getByRole('dialog', { name: 'Push Notifications' })).toBeInTheDocument();
  });

  it('does not automatically remind users who denied notification permission', async () => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { permission: 'denied' },
    });

    renderSetup({ userId: 'denied-user', accessToken: 'token', reminderOnly: true });
    await advanceReminder();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['Notification', 'serviceWorker', 'PushManager'] as const)(
    'does not automatically remind users when %s is unsupported',
    async (api) => {
      vi.useFakeTimers();
      Reflect.deleteProperty(api === 'serviceWorker' ? navigator : window, api);

      renderSetup({ userId: 'unsupported-user', accessToken: 'token', reminderOnly: true });
      await advanceReminder();

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('waits until automatic reminders are enabled before showing the first reminder', async () => {
    vi.useFakeTimers();
    setPermission('default');
    const view = renderSetup({
      userId: 'onboarding-user', accessToken: 'token', reminderOnly: true, notificationsEnabled: false,
    });
    await advanceReminder();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    view.rerender(<PushNotificationSetup userId="onboarding-user" accessToken="token" reminderOnly notificationsEnabled />);
    await advanceReminder();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('restores a missing subscription silently when permission is already granted', async () => {
    vi.useFakeTimers();
    const subscription = { toJSON: () => ({ endpoint: 'https://push.example' }) } as PushSubscription;
    vi.mocked(subscribeToPushNotifications).mockResolvedValue(subscription);

    const view = renderSetup({ userId: 'repair-user', accessToken: 'token', reminderOnly: true });
    await advanceReminder();

    expect(subscribeToPushNotifications).toHaveBeenCalledOnce();
    expect(requestNotificationPermission).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalled();
    view.rerender(<PushNotificationSetup userId="repair-user" accessToken="token" />);
    expect(screen.getByTitle('Notifications On')).toBeInTheDocument();
  });

  it('respects disabled notifications when permission was previously granted', async () => {
    vi.useFakeTimers();
    renderSetup({ userId: 'disabled-user', accessToken: 'token', reminderOnly: true, notificationsEnabled: false });
    await advanceReminder();

    expect(subscribeToPushNotifications).not.toHaveBeenCalled();
    expect(requestNotificationPermission).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('synchronizes the current subscription with the latest account token', async () => {
    vi.useFakeTimers();
    const subscription = { toJSON: () => ({ endpoint: 'https://push.example' }) };
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) },
        }),
      },
    });
    const view = renderSetup({ userId: 'first-account', accessToken: 'first-token', reminderOnly: true });
    await advanceReminder();

    view.rerender(<PushNotificationSetup userId="second-account" accessToken="second-token" reminderOnly />);
    await advanceReminder();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer second-token' }),
    }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each(['network failure', 'server error'])(
    'keeps an existing subscription on without a reminder after a %s',
    async (failure) => {
      vi.useFakeTimers();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      if (failure === 'network failure') {
        vi.mocked(fetch).mockRejectedValue(new Error('Offline'));
      } else {
        vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
      }
      const subscription = { toJSON: () => ({ endpoint: 'https://push.example' }) };
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
          ready: Promise.resolve({
            pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) },
          }),
        },
      });

      const view = renderSetup({ userId: 'subscribed-user', accessToken: 'token', reminderOnly: true });
      await advanceReminder();
      expect(fetch).toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      view.rerender(<PushNotificationSetup userId="subscribed-user" accessToken="token" />);
      expect(screen.getByTitle('Notifications On')).toBeInTheDocument();
    },
  );
});
