import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContentLanguageProvider } from '../../../contexts/ContentLanguageContext';
import { DevotionalsManager } from '../DevotionalsManager';

describe('DevotionalsManager editorial console', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders database devotionals in the library and preview', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        devotionals: [{
          id: 'dev-1',
          date: '2026-08-12',
          title: 'Grace in the ordinary',
          verse: 'Be devoted to one another in love.',
          reference: 'Romans 12:10',
          reflection: 'Notice the small ways grace appears today.',
          prayerPrompt: 'Thank God for one another.',
          tags: ['grace'],
          status: 'published',
          language: 'en',
        }],
      }),
    } as Response);

    render(
      <ContentLanguageProvider>
        <DevotionalsManager accessToken="admin-token" />
      </ContentLanguageProvider>,
    );

    expect(await screen.findAllByText('Grace in the ordinary')).toHaveLength(2);
    expect(screen.getAllByText('Romans 12:10')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Open devotional import and export tools' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Preview Grace in the ordinary/ })).toBeInTheDocument();
  });
});
