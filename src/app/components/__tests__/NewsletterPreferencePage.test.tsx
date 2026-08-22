import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewsletterPreferencePage } from '../NewsletterPreferencePage';

describe('NewsletterPreferencePage', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  it('requires a deliberate confirmation click before activating email', async () => {
    window.history.replaceState({}, '', '/newsletter/confirm?token=confirmation-token');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'Your Saturday TwoBeOne email is confirmed.' }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<NewsletterPreferencePage action="confirm" onComplete={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: 'Confirm subscription' }));

    expect(await screen.findByText('Subscription confirmed')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/newsletter/confirm'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ token: 'confirmation-token' }) }),
    );
  });

  it('explains that essential account messages remain after unsubscribe', () => {
    window.history.replaceState({}, '', '/newsletter/unsubscribe?token=unsubscribe-token');
    render(<NewsletterPreferencePage action="unsubscribe" onComplete={() => {}} />);
    expect(screen.getByText(/Essential account emails are unaffected/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unsubscribe' })).toBeInTheDocument();
  });
});
