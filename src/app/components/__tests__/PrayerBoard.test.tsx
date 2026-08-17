import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { PrayerBoard } from '../PrayerBoard';

const prayers = [
  {
    id: 'active-prayer',
    userId: 'user-1',
    title: 'Peace for our family',
    description: 'Help us listen to one another with patience.',
    category: 'Family',
    isAnswered: false,
    isSharedWithCommunity: false,
    prayerCount: 1,
    youPrayed: true,
    partnerPrayed: false,
    createdAt: '2026-08-16T12:00:00.000Z',
    updatedAt: '2026-08-16T12:00:00.000Z',
  },
  {
    id: 'answered-prayer',
    userId: 'user-1',
    title: 'A new opportunity',
    description: 'We are grateful for an open door at work.',
    category: 'Thanksgiving',
    isAnswered: true,
    isSharedWithCommunity: false,
    prayerCount: 2,
    youPrayed: true,
    partnerPrayed: true,
    createdAt: '2026-08-15T12:00:00.000Z',
    updatedAt: '2026-08-15T12:00:00.000Z',
  },
];

function renderPrayerBoard() {
  render(
    <LanguageProvider>
      <PrayerBoard
        prayers={prayers}
        onAddPrayer={vi.fn()}
        onUpdatePrayer={vi.fn()}
        onDeletePrayer={vi.fn()}
        onMarkPrayed={vi.fn()}
      />
    </LanguageProvider>,
  );
}

describe('PrayerBoard', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('separates active and answered prayers with accessible tabs', () => {
    renderPrayerBoard();

    expect(screen.getByRole('heading', { level: 1, name: 'Prayer' })).toBeInTheDocument();
    expect(screen.getByText('Peace for our family')).toBeInTheDocument();
    expect(screen.queryByText('A new opportunity')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Answered' }));

    expect(screen.getByText('A new opportunity')).toBeInTheDocument();
    expect(screen.queryByText('Peace for our family')).not.toBeInTheDocument();
  });

  it('searches prayer content and opens the new request form', () => {
    renderPrayerBoard();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search prayers' }), {
      target: { value: 'health' },
    });
    expect(screen.getByText('No matching prayers')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear prayer search' }));
    expect(screen.getByText('Peace for our family')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New Request' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'New Prayer Request' })).toBeInTheDocument();
  });
});
