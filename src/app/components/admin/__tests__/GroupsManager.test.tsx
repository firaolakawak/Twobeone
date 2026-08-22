import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GroupsManager } from '../GroupsManager';

describe('GroupsManager community console', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders database groups and normalizes memberCount in the admin preview', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ groups: [{
      id: 'group-1', name: 'Covenant Builders', description: 'Couples growing in faith together.',
      category: 'Growing Together', memberCount: 32, meetingDay: 'Thursdays, 7:00 PM',
      location: 'Online', leader: 'Maya & Daniel', status: 'active', isPublic: true,
    }] }) } as Response);

    render(<GroupsManager accessToken="admin-token" />);

    expect(await screen.findAllByText('Covenant Builders')).toHaveLength(2);
    expect(screen.getAllByText('Maya & Daniel')).toHaveLength(2);
    expect(screen.getAllByText('32').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Preview Covenant Builders' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create a new community group' })).toBeInTheDocument();
  });
});
