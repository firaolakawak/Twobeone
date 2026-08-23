import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { DailyDevotionsFeed } from '../DailyDevotionsFeed';

describe('DailyDevotionsFeed', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

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
    expect(screen.getByText('Begin together')).toBeInTheDocument();
  });

  it('places uncompleted devotionals before completed devotionals', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/devotions')) {
        return {
          ok: true,
          json: async () => ({
            devotions: [
              {
                id: 'completed-devotion',
                title: 'Already Read',
                verse: 'A completed verse.',
                reference: 'Psalm 1:1',
                language: 'en',
              },
              {
                id: 'next-devotion',
                title: 'Read This Next',
                verse: 'An unread verse.',
                reference: 'Psalm 2:1',
                language: 'en',
              },
            ],
          }),
        } as Response;
      }
      if (url.endsWith('/devotional-completions')) {
        return {
          ok: true,
          json: async () => ({
            completions: [{ devotionId: 'completed-devotion' }],
          }),
        } as Response;
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

    await waitFor(() => {
      const nextReading = screen.getByRole('button', { name: 'Read Read This Next' });
      const completedReading = screen.getByRole('button', { name: 'Read Already Read' });

      expect(
        nextReading.compareDocumentPosition(completedReading) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  });

  it('refreshes the read count after a devotional is completed', async () => {
    let isCompleted = false;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/devotions')) {
        return {
          ok: true,
          json: async () => ({
            devotions: [{
              id: 'dev-1',
              title: 'Faithful Steps',
              verse: 'Walk by faith.',
              reference: '2 Corinthians 5:7',
              language: 'en',
            }],
          }),
        } as Response;
      }
      if (url.endsWith('/devotional-completions')) {
        return {
          ok: true,
          json: async () => ({
            completions: isCompleted ? [{ devotionId: 'dev-1' }] : [],
          }),
        } as Response;
      }
      return { ok: true, json: async () => ({ highlights: [] }) } as Response;
    });

    const { rerender } = render(
      <LanguageProvider>
        <DailyDevotionsFeed
          onDevotionalClick={vi.fn()}
          accessToken="token"
          projectId="project"
          completionVersion={0}
        />
      </LanguageProvider>,
    );

    expect(await screen.findByText('0/1 read')).toBeInTheDocument();
    isCompleted = true;
    rerender(
      <LanguageProvider>
        <DailyDevotionsFeed
          onDevotionalClick={vi.fn()}
          accessToken="token"
          projectId="project"
          completionVersion={1}
        />
      </LanguageProvider>,
    );

    expect(await screen.findByText('1/1 read')).toBeInTheDocument();
  });

  it('searches devotionals by their content and clears the search', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/devotions')) {
        return {
          ok: true,
          json: async () => ({
            devotions: [
              {
                id: 'grace',
                title: 'Growing in Grace',
                verse: 'My grace is sufficient for you.',
                reference: '2 Corinthians 12:9',
                reflection: 'Receive grace together.',
                language: 'en',
              },
              {
                id: 'peace',
                title: 'A Peaceful Home',
                verse: 'Peace I leave with you.',
                reference: 'John 14:27',
                reflection: 'Practice gentleness today.',
                language: 'en',
              },
            ],
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

    const search = await screen.findByRole('searchbox', { name: 'Search devotionals' });
    fireEvent.change(search, { target: { value: 'gentleness' } });

    expect(screen.getByRole('button', { name: 'Read A Peaceful Home' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Read Growing in Grace' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear devotional search' }));
    expect(screen.getByRole('button', { name: 'Read Growing in Grace' })).toBeInTheDocument();
  });
});
