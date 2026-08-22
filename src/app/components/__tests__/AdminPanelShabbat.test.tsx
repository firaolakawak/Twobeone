import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminPanel } from '../AdminPanel';

vi.mock('../admin/AdminDashboard', () => ({
  AdminDashboard: () => <div>Admin dashboard content</div>,
}));
vi.mock('../admin/ShabbatShalomConsole', () => ({
  ShabbatShalomConsole: () => <section><h1>Dedicated Shabbat Shalom console</h1></section>,
}));

describe('AdminPanel Shabbat Shalom navigation', () => {
  afterEach(cleanup);

  it('does not render Shabbat Shalom on the Admin Dashboard home', () => {
    render(<AdminPanel accessToken="admin-token" onSignOut={vi.fn()} />);

    expect(screen.getByText('Admin dashboard content')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dedicated Shabbat Shalom console' })).not.toBeInTheDocument();
  });

  it('opens Shabbat Shalom from its dedicated sidebar item', async () => {
    render(<AdminPanel accessToken="admin-token" onSignOut={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Shabbat Shalom/i }));

    expect(screen.getByRole('heading', { name: 'Dedicated Shabbat Shalom console' })).toBeInTheDocument();
    expect(screen.queryByText('Admin dashboard content')).not.toBeInTheDocument();
  });
});
