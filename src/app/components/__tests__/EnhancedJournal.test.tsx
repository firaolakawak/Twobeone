import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { EnhancedJournal } from '../EnhancedJournal';

const entries = [
  {
    id: 'reflection-1',
    title: 'A quiet morning',
    content: 'We made time to listen and pray together.',
    createdAt: '2026-08-16T08:30:00.000Z',
    updatedAt: '2026-08-16T08:30:00.000Z',
    entryType: 'journal',
    isShared: true,
    mediaFiles: [],
  },
  {
    id: 'moment-1',
    title: 'Anniversary dinner',
    content: 'A joyful evening worth remembering.',
    createdAt: '2026-08-15T19:00:00.000Z',
    updatedAt: '2026-08-15T19:00:00.000Z',
    entryType: 'event',
    location: 'Addis Ababa',
    emoji: '❤️',
    isShared: true,
    mediaFiles: [],
  },
] as any;

function renderJournal() {
  render(
    <LanguageProvider>
      <EnhancedJournal
        entries={entries}
        onAddEntry={vi.fn()}
        onUpdateEntry={vi.fn()}
        onDeleteEntry={vi.fn()}
        accessToken="token"
      />
    </LanguageProvider>,
  );
}

describe('EnhancedJournal', () => {
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

  it('filters journal entries by type and search text', () => {
    renderJournal();

    expect(screen.getByRole('heading', { level: 1, name: 'Journal' })).toBeInTheDocument();
    expect(screen.getByText('A quiet morning')).toBeInTheDocument();
    expect(screen.getByText('Anniversary dinner')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Moments' }));
    expect(screen.queryByText('A quiet morning')).not.toBeInTheDocument();
    expect(screen.getByText('Anniversary dinner')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search journal entries' }), {
      target: { value: 'missing' },
    });
    expect(screen.getByText('No matching entries')).toBeInTheDocument();
  });

  it('opens the redesigned writing dialog from the primary action', () => {
    renderJournal();

    fireEvent.click(screen.getByRole('button', { name: 'New Entry' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'New Entry' })).toBeInTheDocument();
    expect(screen.getByText('Write what is on your heart and choose whether to share it.')).toBeInTheDocument();
  });
});
