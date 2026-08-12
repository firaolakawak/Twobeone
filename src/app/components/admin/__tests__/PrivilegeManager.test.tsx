import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrivilegeManager } from '../PrivilegeManager';

describe('PrivilegeManager access-control console', () => {
  afterEach(() => vi.restoreAllMocks());
  it('renders live roles and selected access scope', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/users')) return { ok: true, json: async () => ({ users: [{ id: 'user-1', name: 'Avery Stone', email: 'avery@example.com', isAdmin: false, hasPartner: true, createdAt: '2026-01-01T00:00:00Z' }] }) } as Response;
      if (url.endsWith('/list')) return { ok: true, json: async () => ({ admins: [] }) } as Response;
      return { ok: true, json: async () => ({ activityLog: [] }) } as Response;
    });
    render(<PrivilegeManager accessToken="admin-token" />);
    expect(await screen.findAllByText('Avery Stone')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Review privileges for Avery Stone' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Grant administrator access to Avery Stone' })).toBeInTheDocument();
    expect(screen.getByText('Protected admin area')).toBeInTheDocument();
  });
});
