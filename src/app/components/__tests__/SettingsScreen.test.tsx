import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('renders the profile workspace with photo actions and without user-facing debug tools', async () => {
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
            profilePicture: 'https://example.com/profile.jpg',
            coverPicture: 'https://example.com/cover.jpg',
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

    await userEvent.click(screen.getByRole('button', { name: 'Cover picture options' }));
    expect(screen.getByRole('menuitem', { name: 'Change Cover' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete Cover' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    await userEvent.click(screen.getByRole('button', { name: 'Profile picture options' }));
    expect(screen.getByRole('menuitem', { name: 'Change Picture' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete Picture' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change profile picture' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete profile picture' })).not.toBeInTheDocument();
  });
});
