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

describe('ShabbatShalomConsole', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    successToast.mockClear();
  });

  it('shows the combined audience and current edition in the admin dashboard', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => Promise.resolve({
      ok: true,
      json: async () => url.includes('admin-overview') ? overview : preview,
    })));

    render(<ShabbatShalomConsole accessToken="admin-token" />);

    expect(await screen.findByRole('heading', { name: 'Shabbat Shalom' })).toBeInTheDocument();
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Shabbat Shalom — Choose kindness')).toBeInTheDocument();
    expect(screen.getByText(/Saturday at 09:00/)).toBeInTheDocument();
  });

  it('sends a protected test without starting the campaign', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.endsWith('/test') && options?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      return Promise.resolve({ ok: true, json: async () => url.includes('admin-overview') ? overview : preview });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<ShabbatShalomConsole accessToken="admin-token" />);

    await userEvent.type(await screen.findByLabelText('Test email address'), 'admin@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send test email' }));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/newsletter/test'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'admin@example.com' }) }),
    );
    expect(successToast).toHaveBeenCalled();
  });
});
