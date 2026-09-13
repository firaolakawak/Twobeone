import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { SettingsScreen } from '../SettingsScreen';
import { setCurrentLanguage } from '../../utils/languageStore';

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

  it('changes an open contact dialog language while preserving the message draft', async () => {
    render(<LanguageProvider><SettingsScreen
      profile={{ id: 'u1', name: 'Keti', email: 'keti@example.com' } as any}
      onSignOut={vi.fn()} onUpdateProfile={vi.fn()} accessToken="fixture-token"
    /></LanguageProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Contact Us' }));
    await userEvent.type(screen.getByPlaceholderText('Enter your message here...'), 'Please keep my words unchanged.');
    act(() => setCurrentLanguage('am'));
    expect(screen.getByRole('dialog')).toHaveTextContent('ያግኙን');
    expect(screen.getByRole('button', { name: 'መልዕክት ላክ' })).toBeInTheDocument();
    act(() => setCurrentLanguage('om'));
    expect(screen.getByRole('dialog')).toHaveTextContent('Nu qunnamaa');
    expect(screen.getByDisplayValue('Please keep my words unchanged.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ergaa ergi' })).toBeInTheDocument();
  });

  it('saves the language selected in account settings to the profile', async () => {
    const onUpdateProfile = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    render(<LanguageProvider><SettingsScreen
      profile={{ id: 'u1', name: 'Keti', email: 'keti@example.com' } as any}
      onSignOut={vi.fn()} onUpdateProfile={onUpdateProfile} accessToken="fixture-token"
    /></LanguageProvider>);
    await userEvent.click(screen.getByRole('tab', { name: 'App settings' }));
    await userEvent.click(screen.getByRole('button', { name: /Afaan Oromo/ }));
    expect(onUpdateProfile).toHaveBeenCalledWith({ language: 'om' });
    expect(localStorage.getItem('twobeone_language')).toBe('om');
    expect(screen.getByText('Afaan barbaaddan filadhaa')).toBeInTheDocument();
  });

  it('preserves a personal draft when a saved language refreshes the profile', async () => {
    const profile = { id: 'u1', name: 'Keti', email: 'keti@example.com', language: 'en' } as any;
    const props = { onSignOut: vi.fn(), onUpdateProfile: vi.fn(), accessToken: 'fixture-token' };
    const { rerender } = render(<LanguageProvider><SettingsScreen profile={profile} {...props} /></LanguageProvider>);
    const input = screen.getByDisplayValue('Keti');
    await userEvent.clear(input);
    await userEvent.type(input, 'My unsaved name');
    act(() => setCurrentLanguage('om'));
    rerender(<LanguageProvider><SettingsScreen profile={{ ...profile, language: 'om' }} {...props} /></LanguageProvider>);
    expect(screen.getByDisplayValue('My unsaved name')).toBeInTheDocument();
  });
});
