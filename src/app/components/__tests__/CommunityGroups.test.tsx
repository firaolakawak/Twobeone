import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { CommunityGroups } from '../CommunityGroups';

vi.mock('../../utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'user-token' } },
      }),
    },
  }),
}));

describe('CommunityGroups', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens the create dialog and submits a new group', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      if (init?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            group: {
              id: 'group-2',
              name: 'Covenant Couples',
              description: 'Growing together',
              imageUrl: '',
              isPublic: true,
              createdBy: 'user-1',
              createdAt: '2026-08-16T00:00:00.000Z',
              memberCount: 1,
            },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({ groups: [], liveSessions: [] }),
      } as Response;
    });

    render(
      <LanguageProvider>
        <CommunityGroups />
      </LanguageProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Create New Group' }));
    await userEvent.type(screen.getByLabelText('Group Name'), 'Covenant Couples');
    await userEvent.type(screen.getByLabelText('Description'), 'Growing together');
    await userEvent.click(screen.getByRole('button', { name: 'Create Group' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/groups$/),
      expect.objectContaining({ method: 'POST' }),
    ));
  });
});
