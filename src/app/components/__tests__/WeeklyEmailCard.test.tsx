import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShabbatShalomConsole } from '../WeeklyEmailCard';

describe('ShabbatShalomConsole', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the registered user Saturday email status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ShabbatShalomConsole accessToken="user-token" />);

    expect(screen.getByText('Shabbat Shalom')).toBeInTheDocument();
    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause Shabbat Shalom' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/newsletter/preference'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer user-token' }) }),
    );
  });

  it('lets the signed-in user pause the email', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ enabled: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ enabled: false, message: 'Shabbat Shalom emails are paused.' }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<ShabbatShalomConsole accessToken="user-token" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Pause Shabbat Shalom' }));

    expect(await screen.findByText('Paused')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/newsletter/preference'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ enabled: false }) }),
    ));
  });
});
