import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShabbatShalomConsole } from '../../ShabbatShalomConsole';

const { successToast } = vi.hoisted(() => ({ successToast: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: successToast, error: vi.fn() } }));

const overview = {
  audience: {
    total: 48,
    registeredUsers: 45,
    registeredRecipients: 42,
    standaloneSubscribers: 6,
    pendingConfirmation: 2,
    optedOut: 3,
  },
  schedule: { enabled: true, label: 'Saturday at 09:00 Africa/Addis_Ababa' },
  lastCampaign: { weekKey: '2026-W33', sent: 40, status: 'completed' },
};

const preview = {
  edition: {
    weekKey: '2026-W34',
    subject: 'Shabbat Shalom — Choose kindness',
    title: 'Choose kindness',
    scripture: 'Be kind and compassionate to one another.',
    scriptureReference: 'Ephesians 4:32',
    encouragement: 'Small moments build strong relationships.',
    guidance: 'Ask how you can help.',
    weeklyPractice: 'Share one appreciation.',
    appFeature: 'Shared Journal',
  },
};

const recipients = {
  weekKey: '2026-W34',
  count: 3,
  users: [
    { id: 'user-1', name: 'Marta', email: 'marta@example.com', eligible: true, status: 'ready' },
    { id: 'user-2', name: 'Noah', email: 'noah@example.com', eligible: false, status: 'opted_out' },
    { id: 'user-3', name: 'Ari', email: 'ari@example.com', eligible: false, status: 'already_sent' },
  ],
};

function consoleResponse(url: string) {
  if (url.includes('admin-overview')) return overview;
  if (url.includes('admin-recipients')) return recipients;
  return preview;
}

describe('ShabbatShalomConsole', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    successToast.mockClear();
  });

  it('shows the combined audience and current edition in the admin dashboard', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve({
      ok: true,
      json: async () => consoleResponse(url),
    })));

    render(<ShabbatShalomConsole accessToken="admin-token" />);

    expect(await screen.findByRole('heading', { name: 'Shabbat Shalom' })).toBeInTheDocument();
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Shabbat Shalom — Choose kindness')).toBeInTheDocument();
    expect(screen.getByText(/Saturday at 09:00/)).toBeInTheDocument();
    expect(screen.getByText('marta@example.com')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Noah/ })).toBeDisabled();
    expect(screen.getByText('Sent this week')).toBeInTheDocument();
  });

  it('confirms and sends the actual edition to selected registered users', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.endsWith('/send-selected') && options?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ status: 'completed', sent: 1, skipped: 0 }) });
      }
      return Promise.resolve({ ok: true, json: async () => consoleResponse(url) });
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ShabbatShalomConsole accessToken="admin-token" />);

    await userEvent.click(await screen.findByRole('checkbox', { name: /Marta/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Send now to 1 selected' }));

    const sendCall = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/send-selected') && options?.method === 'POST');
    expect(sendCall).toBeDefined();
    expect(JSON.parse(String(sendCall?.[1]?.body))).toEqual({
      userIds: ['user-1'],
      requestId: expect.any(String),
    });
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('actual Shabbat Shalom edition'));
    expect(successToast).toHaveBeenCalledWith('Shabbat Shalom sent to 1 user(s).');
  });
});
