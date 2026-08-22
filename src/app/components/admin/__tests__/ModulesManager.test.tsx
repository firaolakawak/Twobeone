import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModulesManager } from '../ModulesManager';

describe('ModulesManager curriculum console', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders database modules in the library and learner preview', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ modules: [{
        id: 'module-1', title: 'Growing in Grace', subtitle: 'A shared practice',
        description: 'Build a daily rhythm of grace together.', icon: '🌱', color: 'bg-success-500',
        status: 'published', language: 'am',
        lessons: [{ id: 'lesson-1', title: 'Grace in conversation', duration: '12 min', content: 'Listen first.' }],
      }] }),
    } as Response);

    render(<ModulesManager accessToken="admin-token" />);

    expect(await screen.findAllByText('Growing in Grace')).toHaveLength(2);
    expect(screen.getByText('Grace in conversation')).toBeInTheDocument();
    expect(screen.getAllByText('Amharic')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Open module data tools' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview Growing in Grace' })).toBeInTheDocument();
  });
});
