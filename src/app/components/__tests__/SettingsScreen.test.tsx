import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { SettingsScreen } from '../SettingsScreen';
import { setCurrentLanguage } from '../../utils/languageStore';

const NativeURL = URL;

describe('SettingsScreen', () => {
  beforeEach(() => {
    setCurrentLanguage('en');
    vi.stubGlobal('ResizeObserver', class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    vi.stubGlobal('URL', class extends NativeURL {
      static createObjectURL = vi.fn(() => 'blob:profile-cover-selection');
      static revokeObjectURL = vi.fn();
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

    const editCover = screen.getByRole('button', { name: 'Edit cover' });
    expect(editCover).toHaveClass('profile-cover-edit-button');
    expect(editCover.closest('[data-profile-cover]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Cover picture options' })).not.toBeInTheDocument();
    await userEvent.click(editCover);
    expect(screen.getByRole('dialog', { name: 'Edit cover' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Current cover preview' })).toHaveAttribute('src', 'https://example.com/cover.jpg');
    expect(screen.getByRole('button', { name: 'Remove cover' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(editCover).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Profile picture options' }));
    expect(screen.getByRole('menuitem', { name: 'Change Picture' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete Picture' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change profile picture' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete profile picture' })).not.toBeInTheDocument();
  });

  it('previews, saves and removes the Profile header cover immediately, then syncs a refreshed cover', async () => {
    const previousCover = 'https://example.com/previous-cover.webp';
    const savedCover = 'https://example.com/saved-cover.webp';
    const refreshedCover = 'https://example.com/refreshed-cover.webp';
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => url.endsWith('/profile/upload-cover') ? { success: true, imageUrl: savedCover } : { success: true },
    } as Response));
    vi.stubGlobal('fetch', fetchMock);
    const profile = { id: 'u1', name: 'Keti', email: 'keti@example.com', coverPicture: previousCover } as any;
    const props = { onSignOut: vi.fn(), onUpdateProfile: vi.fn(), accessToken: 'fixture-token', onRefresh };
    const { container, rerender } = render(<LanguageProvider><SettingsScreen profile={profile} {...props} /></LanguageProvider>);
    const headerImage = () => container.querySelector('[data-profile-cover-image]');
    const editCover = screen.getByRole('button', { name: 'Edit cover' });
    expect(headerImage()).toHaveAttribute('src', previousCover);

    await userEvent.click(editCover);
    fireEvent.change(screen.getByLabelText('Choose cover photo'), { target: { files: [new File(['image'], 'cover.png', { type: 'image/png' })] } });
    const preview = screen.getByRole('img', { name: 'Selected cover preview' });
    expect(preview).toHaveAttribute('src', 'blob:profile-cover-selection');
    expect(headerImage()).toHaveAttribute('src', previousCover);
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.load(preview);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(headerImage()).toHaveAttribute('src', savedCover));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/profile/upload-cover'), expect.objectContaining({ method: 'POST' }));

    await userEvent.click(editCover);
    expect(screen.getByRole('img', { name: 'Current cover preview' })).toHaveAttribute('src', savedCover);
    await userEvent.click(screen.getByRole('button', { name: 'Remove cover' }));
    await waitFor(() => expect(headerImage()).toBeNull());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onRefresh).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/profile/delete-cover'), expect.objectContaining({ method: 'DELETE' }));
    await waitFor(() => expect(editCover).toHaveFocus());

    rerender(<LanguageProvider><SettingsScreen profile={{ ...profile, coverPicture: refreshedCover }} {...props} /></LanguageProvider>);
    expect(headerImage()).toHaveAttribute('src', refreshedCover);
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
