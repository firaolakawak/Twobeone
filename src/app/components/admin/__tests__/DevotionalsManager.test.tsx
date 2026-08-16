import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('offers Afan Oromo and selects it when editing Oromo content', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        devotionals: [{
          id: 'dev-om-1',
          date: '2026-08-12',
          title: 'Jaalala keessatti guddachuu',
          verse: 'Jaalalli obsaa dha.',
          reference: '1 Qorontos 13:4',
          reflection: 'Waliif obsaa.',
          prayerPrompt: 'Waliif kadhadhaa.',
          tags: ['jaalala'],
          status: 'published',
          language: 'om',
        }],
      }),
    } as Response);

    render(
      <ContentLanguageProvider>
        <DevotionalsManager accessToken="admin-token" />
      </ContentLanguageProvider>,
    );

    const editButtons = await screen.findAllByRole('button', { name: 'Edit Jaalala keessatti guddachuu' });
    await userEvent.click(editButtons[0]);

    expect(screen.getByRole('button', { name: 'Afan Oromo (Oromiffa)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Creating content in: Afan Oromo (Oromiffa)')).toBeInTheDocument();
  });
});
