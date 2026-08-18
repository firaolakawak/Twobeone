import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { BottomNavigation } from '../BottomNavigation';

describe('BottomNavigation', () => {
  it('identifies the active destination and keeps every destination actionable', async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <BottomNavigation activeTab="home" onTabChange={onTabChange} />
      </LanguageProvider>,
    );

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Home')).toBeVisible();
    expect(screen.getByText('Prayer')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Prayer' }));
    expect(onTabChange).toHaveBeenCalledWith('prayer');
  });
});
