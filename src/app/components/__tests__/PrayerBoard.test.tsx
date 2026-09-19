import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
        onLoadComments={vi.fn().mockResolvedValue([])}
        onAddComment={vi.fn()}
      />
    </LanguageProvider>,
  );
}

describe('PrayerBoard', () => {
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

  it('lets the creator choose a private or date-locked partner prayer', () => {
    renderPrayerBoard();
    fireEvent.click(screen.getByRole('button', { name: 'New Request' }));

    const partnerSharing = screen.getByRole('switch', { name: 'Share with Partner' });
    expect(partnerSharing).toBeChecked();
    fireEvent.click(screen.getByRole('switch', { name: 'Make it a surprise' }));
    expect(screen.getByLabelText('Unlock date')).toBeInTheDocument();

    fireEvent.click(partnerSharing);
    expect(partnerSharing).not.toBeChecked();
    expect(screen.queryByRole('switch', { name: 'Make it a surprise' })).not.toBeInTheDocument();
  });

  it('records the current user on a partner-owned prayer', () => {
    const onUpdatePrayer = vi.fn().mockResolvedValue(undefined);
    render(
      <LanguageProvider>
        <PrayerBoard
          prayers={[{
            ...prayers[0],
            id: 'partner-prayer',
            userId: 'partner-1',
            isPartner: true,
            partnerPrayed: false,
          }]}
          onAddPrayer={vi.fn()}
          onUpdatePrayer={onUpdatePrayer}
          onDeletePrayer={vi.fn()}
          onMarkPrayed={vi.fn()}
          onLoadComments={vi.fn().mockResolvedValue([])}
          onAddComment={vi.fn()}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'You prayed' }));

    expect(onUpdatePrayer).toHaveBeenCalledWith('partner-prayer', { partnerPrayed: true });
  });

  it('loads the prayer thread and adds a trimmed comment', async () => {
    const onLoadComments = vi.fn().mockResolvedValue([{
      id: 'comment-1',
      prayerId: 'active-prayer',
      userId: 'partner-1',
      userName: 'Mimi',
      content: 'We are with you.',
      createdAt: '2026-08-16T13:00:00.000Z',
      isMine: false,
    }]);
    const onAddComment = vi.fn().mockResolvedValue({
      id: 'comment-2',
      prayerId: 'active-prayer',
      userId: 'user-1',
      userName: 'Firaol',
      content: 'Amen, thank you.',
      createdAt: '2026-08-16T14:00:00.000Z',
      isMine: true,
    });

    render(
      <LanguageProvider>
        <PrayerBoard
          prayers={prayers}
          onAddPrayer={vi.fn()}
          onUpdatePrayer={vi.fn()}
          onDeletePrayer={vi.fn()}
          onMarkPrayed={vi.fn()}
          onLoadComments={onLoadComments}
          onAddComment={onAddComment}
        />
      </LanguageProvider>,
    );

    const commentsToggle = screen.getByRole('button', { name: 'Comments' });
    fireEvent.click(commentsToggle);

    expect(commentsToggle).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByText('We are with you.')).toBeInTheDocument();
    expect(onLoadComments).toHaveBeenCalledWith('active-prayer');

    const commentInput = screen.getByRole('textbox', { name: 'Add a comment' });
    expect(screen.getByRole('button', { name: 'Add comment' })).toBeDisabled();
    fireEvent.change(commentInput, { target: { value: '  Amen, thank you.  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add comment' }));

    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith('active-prayer', 'Amen, thank you.');
    });
    expect(await screen.findByText('Amen, thank you.')).toBeInTheDocument();
    expect(commentInput).toHaveValue('');
  });

  it('keeps the comment draft when sending fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onAddComment = vi.fn().mockRejectedValue(new Error('Network unavailable'));
    render(
      <LanguageProvider>
        <PrayerBoard
          prayers={prayers}
          onAddPrayer={vi.fn()}
          onUpdatePrayer={vi.fn()}
          onDeletePrayer={vi.fn()}
          onMarkPrayed={vi.fn()}
          onLoadComments={vi.fn().mockResolvedValue([])}
          onAddComment={onAddComment}
        />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Comments' }));
    const commentInput = await screen.findByRole('textbox', { name: 'Add a comment' });
    fireEvent.change(commentInput, { target: { value: 'Please keep praying.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add comment' }));

    await waitFor(() => expect(onAddComment).toHaveBeenCalledOnce());
    expect(commentInput).toHaveValue('Please keep praying.');
  });

  it('does not expose comments on a partner surprise that is still locked', () => {
    render(
      <LanguageProvider>
        <PrayerBoard
          prayers={[{
            ...prayers[0],
            id: 'locked-prayer',
            title: 'Surprise',
            description: '',
            isPartner: true,
            isSurprise: true,
            isLockedForPartner: true,
            unlockAt: '2026-12-25T00:00:00.000Z',
          }]}
          onAddPrayer={vi.fn()}
          onUpdatePrayer={vi.fn()}
          onDeletePrayer={vi.fn()}
          onMarkPrayed={vi.fn()}
          onLoadComments={vi.fn().mockResolvedValue([])}
          onAddComment={vi.fn()}
        />
      </LanguageProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Comments' })).not.toBeInTheDocument();
  });
});
