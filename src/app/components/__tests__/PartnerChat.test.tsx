import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { hasNewPartnerMessage, PartnerChat } from '../PartnerChat';

describe('PartnerChat', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/chat/messages') && init?.method === 'POST') {
        return { ok: true, status: 201, json: async () => ({ message: { id: 'message-2', channelId: 'one:two', senderId: 'one', senderName: 'Alex', message: 'See you soon', createdAt: '2026-08-22T15:01:00.000Z' } }) };
      }
      if (url.endsWith('/chat/read')) return { ok: true, json: async () => ({ success: true }) };
      return { ok: true, json: async () => ({ hasPartner: true, unreadCount: 0, messages: [{ id: 'message-1', channelId: 'one:two', senderId: 'two', senderName: 'Sam', message: 'How was your day?', createdAt: '2026-08-22T15:00:00.000Z' }] }) };
    }));
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  });

  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('loads the private partner channel and sends a message', async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><PartnerChat accessToken="token" currentUserId="one" partnerName="Sam" partnerOnline onBack={vi.fn()} /></LanguageProvider>);

    expect(await screen.findByText('How was your day?')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Message your partner…' }), 'See you soon');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByText('See you soon')).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/chat/messages'), expect.objectContaining({ method: 'POST' })));
  });

  it('detects only newly arrived partner messages for the sound alert', () => {
    const original = [{ id: 'one', channelId: 'a:b', senderId: 'a', senderName: 'Alex', message: 'Hello', createdAt: '2026-08-22T15:00:00.000Z' }];
    expect(hasNewPartnerMessage(original, [...original, { ...original[0], id: 'two', senderId: 'b' }], 'a')).toBe(true);
    expect(hasNewPartnerMessage(original, [...original, { ...original[0], id: 'two', senderId: 'a' }], 'a')).toBe(false);
    expect(hasNewPartnerMessage([], original, 'a')).toBe(false);
  });
});
