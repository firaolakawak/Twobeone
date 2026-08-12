import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UsersManager } from '../UsersManager';

describe('UsersManager account console', () => {
  afterEach(() => vi.restoreAllMocks());
  it('renders live account activity and selected profile details', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ users: [{
      id: 'user-1', name: 'Jordan Rivers', email: 'jordan@example.com', partnerId: null,
      createdAt: new Date().toISOString(), lastActive: new Date().toISOString(), completedDays: 14,
      journalEntries: 8, prayerRequests: 3,
    }] }) } as Response);
    render(<UsersManager accessToken="admin-token" />);
    expect(await screen.findAllByText('Jordan Rivers')).toHaveLength(2);
    expect(screen.getAllByText('jordan@example.com')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'View account for Jordan Rivers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete account for Jordan Rivers' })).toBeInTheDocument();
    expect(screen.getByText('Database connected')).toBeInTheDocument();
  });
});
