import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { DailyDevotionsFeed } from '../DailyDevotionsFeed';

describe('DailyDevotionsFeed', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders devotionals as accessible reading cards', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/devotions')) {
        return {
          ok: true,
          json: async () => ({
            devotions: [{
              id: 'dev-1',
              title: 'Building on the Rock',
              verse: 'Everyone who hears these words of mine and puts them into practice is wise.',
              reference: 'Matthew 7:24–25',
              language: 'en',
            }],
          }),
        } as Response;
      }
      if (url.endsWith('/devotional-completions')) {
        return { ok: true, json: async () => ({ completions: [] }) } as Response;
      }
      return { ok: true, json: async () => ({ highlights: [] }) } as Response;
    });

    render(
      <LanguageProvider>
        <DailyDevotionsFeed
          onDevotionalClick={vi.fn()}
          accessToken="token"
          projectId="project"
        />
      </LanguageProvider>,
    );

    expect(await screen.findByRole('button', { name: 'Read Building on the Rock' })).toBeInTheDocument();
    expect(screen.getByText('Matthew 7:24–25')).toBeInTheDocument();
    expect(screen.getByText('Read devotional')).toBeInTheDocument();
  });
});
