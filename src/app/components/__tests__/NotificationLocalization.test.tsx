import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { setCurrentLanguage } from '../../utils/languageStore';
import { NotificationCenter } from '../NotificationCenter';

const json = (notifications: unknown[]) => ({ ok: true, json: async () => ({ notifications }) }) as Response;
const fixture = (id: string, type: string, title: string, message: string) => ({ id, type, title, message, recipientId: 'recipient', senderId: 'sender', isRead: false, createdAt: new Date().toISOString() });
const props = { accessToken: 'fixture', projectId: 'fixture', publicAnonKey: 'fixture' };

describe('mounted notification localization', () => {
  beforeEach(() => {
    setCurrentLanguage('en');
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  });
  afterEach(() => { cleanup(); setCurrentLanguage('en'); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('shows the branded loading state, switches system copy, and preserves authored notification data', async () => {
    let resolve!: (response: Response) => void;
    const notices = [fixture('system', 'chat', 'New message from Keti', 'New Prayer Message'), fixture('authored', 'general', 'Our custom announcement', 'Please keep these exact words.')];
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(done => { resolve = done; })));
    const onNotificationClick = vi.fn();
    render(<NotificationCenter {...props} onNotificationClick={onNotificationClick} />, { wrapper: LanguageProvider });
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByRole('status').querySelector('img')).toBeTruthy();
    await act(async () => resolve(json(notices)));
    expect(await screen.findByText('New message from Keti')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => setCurrentLanguage('am'));
    expect(screen.getByText('ከKeti አዲስ መልዕክት')).toBeInTheDocument();
    act(() => setCurrentLanguage('om'));
    const translatedTitle = screen.getByText('Ergaa haaraa Keti irraa');
    expect(screen.getByText('New Prayer Message')).toBeInTheDocument();
    expect(screen.getByText('Our custom announcement')).toBeInTheDocument();
    expect(screen.getByText('Please keep these exact words.')).toBeInTheDocument();
    fireEvent.click(translatedTitle);
    expect(onNotificationClick).toHaveBeenCalledWith(notices[0]);
  });

  it('does not replace the new account notifications with an older in-flight response', async () => {
    let oldRequest!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn((_: unknown, init: RequestInit) => {
      if ((init.headers as Record<string, string>).Authorization === 'Bearer old') return new Promise<Response>(done => { oldRequest = done; });
      return Promise.resolve(json([fixture('new', 'general', 'New account notice', 'Current account')]));
    }));
    const view = render(<NotificationCenter {...props} accessToken="old" />, { wrapper: LanguageProvider });
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    view.rerender(<NotificationCenter {...props} accessToken="new" />);
    expect(await screen.findByText('New account notice')).toBeInTheDocument();
    await act(async () => oldRequest(json([fixture('old', 'general', 'Old account notice', 'Previous account')])));
    await waitFor(() => expect(screen.queryByText('Old account notice')).not.toBeInTheDocument());
    expect(screen.getByText('New account notice')).toBeInTheDocument();
  });
});
