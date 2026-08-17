import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { SettingsScreen } from '../SettingsScreen';

describe('SettingsScreen', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the profile workspace without user-facing debug tools', () => {
    render(
      <LanguageProvider>
        <SettingsScreen
          profile={{
            id: 'user-1',
            name: 'Keti Abira',
            email: 'keti@example.com',
            bio: '',
            phone: '',
            location: '',
            relationshipStart: '',
          } as any}
          onSignOut={vi.fn()}
          onUpdateProfile={vi.fn()}
          accessToken="token"
        />
      </LanguageProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Keti Abira' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Profile settings sections' })).toBeInTheDocument();
    expect(screen.queryByText('Debug Responses')).not.toBeInTheDocument();
    expect(screen.queryByText('Testing Dashboard')).not.toBeInTheDocument();
  });
});
