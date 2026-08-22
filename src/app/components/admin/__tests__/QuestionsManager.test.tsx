import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuestionsManager } from '../QuestionsManager';

describe('QuestionsManager conversation console', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders database question sets in the library and couple preview', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        questions: [{
          id: 'question-1',
          category: 'trust',
          title: 'Listening with grace',
          verse: 'Everyone should be quick to listen.',
          verseReference: 'James 1:19',
          status: 'active',
          language: 'en',
          prompts: [{ id: 'prompt-1', text: 'When do you feel most heard?', type: 'text' }],
        }],
      }),
    } as Response);

    render(<QuestionsManager accessToken="admin-token" />);

    expect(await screen.findAllByText('Listening with grace')).toHaveLength(2);
    expect(screen.getByText('When do you feel most heard?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open question data tools' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview Listening with grace' })).toBeInTheDocument();
  });
});
