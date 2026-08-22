import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { BottomNavigation } from '../BottomNavigation';

describe('BottomNavigation', () => {
  it('identifies the active destination and keeps every destination actionable', async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <LanguageProvider>
        <BottomNavigation activeTab="home" onTabChange={onTabChange} />
      </LanguageProvider>,
    );

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Home')).toBeVisible();
    expect(screen.queryByText('Prayer')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Prayer' }));
    expect(onTabChange).toHaveBeenCalledWith('prayer');

    rerender(<LanguageProvider><BottomNavigation activeTab="prayer" onTabChange={onTabChange} /></LanguageProvider>);
    expect(screen.getByText('Prayer')).toBeVisible();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });
});
