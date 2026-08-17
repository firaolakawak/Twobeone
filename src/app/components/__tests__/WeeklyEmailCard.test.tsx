import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WeeklyEmailCard } from '../WeeklyEmailCard';

describe('WeeklyEmailCard', () => {
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

    render(<WeeklyEmailCard accessToken="user-token" />);

    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause Saturday email' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/newsletter/preference'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer user-token' }) }),
    );
  });

  it('lets the signed-in user pause the email', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ enabled: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ enabled: false, message: 'Saturday emails are paused.' }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<WeeklyEmailCard accessToken="user-token" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Pause Saturday email' }));

    expect(await screen.findByText('Paused')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/newsletter/preference'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ enabled: false }) }),
    ));
  });
});
