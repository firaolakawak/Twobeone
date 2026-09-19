import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { getHalfTextPreview } from '../../utils/contentPreview';
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
        userName="Fira Alemu"
        partnerName="Mimi Abebe"
        onAddPrayer={vi.fn()}
        onUpdatePrayer={vi.fn()}
        onDeletePrayer={vi.fn()}
        onMarkPrayed={vi.fn()}
        onLoadLatestComment={vi.fn().mockResolvedValue(null)}
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

  it('filters prayers from the header summary without a duplicated tab strip', () => {
    renderPrayerBoard();

    expect(screen.getByRole('heading', { level: 1, name: 'Prayer' })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Active/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Peace for our family')).toBeInTheDocument();
    expect(screen.queryByText('A new opportunity')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Answered/ }));

    expect(screen.getByRole('button', { name: /Answered/ })).toHaveAttribute('aria-pressed', 'true');
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

    const newRequestButton = screen.getByRole('button', { name: 'New Request' });
    expect(newRequestButton).not.toHaveTextContent('New Request');
    expect(newRequestButton).toHaveClass('rounded-full');
    expect(newRequestButton.closest('header')).not.toBeNull();
    fireEvent.click(newRequestButton);
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
          userName="Fira Alemu"
          partnerName="Mimi Abebe"
          onAddPrayer={vi.fn()}
          onUpdatePrayer={onUpdatePrayer}
          onDeletePrayer={vi.fn()}
          onMarkPrayed={vi.fn()}
          onLoadLatestComment={vi.fn().mockResolvedValue(null)}
          onLoadComments={vi.fn().mockResolvedValue([])}
          onAddComment={vi.fn()}
        />
      </LanguageProvider>,
    );

    const requesterName = screen.getByText('Mimi');
    const prayerType = screen.getByText('Family');
    expect(screen.queryByText('Mimi Abebe')).not.toBeInTheDocument();
    expect(screen.queryByText('Fira')).not.toBeInTheDocument();
    expect(requesterName.compareDocumentPosition(prayerType) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const prayerContent = screen.getByText(getHalfTextPreview(prayers[0].description));
    expect(prayerContent).not.toHaveClass('line-clamp-2');
    const expandButton = screen.getByRole('button', { name: 'Expand Peace for our family' });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(expandButton);
    expect(screen.getByText(prayers[0].description)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse Peace for our family' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'You prayed' }));

    expect(onUpdatePrayer).toHaveBeenCalledWith('partner-prayer', { partnerPrayed: true });
  });

  it('loads the prayer thread and adds a trimmed comment', async () => {
    const onLoadComments = vi.fn().mockResolvedValue([{
      id: 'comment-1',
      prayerId: 'active-prayer',
      userId: 'partner-1',
      userName: 'Mimi Abebe',
      content: 'We are with you.',
      createdAt: '2026-08-16T13:00:00.000Z',
      isMine: false,
    }]);
    const onAddComment = vi.fn().mockResolvedValue({
      id: 'comment-2',
      prayerId: 'active-prayer',
      userId: 'user-1',
      userName: 'Firaol Akawak',
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
          onLoadLatestComment={vi.fn().mockResolvedValue(null)}
          onLoadComments={onLoadComments}
          onAddComment={onAddComment}
        />
      </LanguageProvider>,
    );

    const prayedToggle = screen.getByRole('button', { name: 'You prayed' });
    const commentsToggle = screen.getByRole('button', { name: 'Comments' });
    expect(prayedToggle).not.toHaveTextContent('You prayed');
    expect(commentsToggle).not.toHaveTextContent('Comments');
    expect(screen.queryByRole('button', { name: 'Partner prayed' })).not.toBeInTheDocument();
    expect(screen.queryByText('1 praying')).not.toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Aug 16').closest('time')).toHaveAttribute('datetime', prayers[0].createdAt);
    expect(screen.queryByText('Shared')).not.toBeInTheDocument();
    fireEvent.click(commentsToggle);

    expect(await screen.findByText('We are with you.')).toBeInTheDocument();
    expect(screen.getByText('Mimi')).toHaveClass('tbo-caption');
    expect(screen.queryByText('Mimi Abebe')).not.toBeInTheDocument();
    const openCommentsToggle = screen.getByRole('button', { name: 'Comments' });
    expect(openCommentsToggle).toHaveAttribute('aria-expanded', 'true');
    expect(onLoadComments).toHaveBeenCalledWith('active-prayer');
    expect(screen.queryByText('Prayer comments')).not.toBeInTheDocument();
    expect(screen.queryByText('Add a comment')).not.toBeInTheDocument();

    const commentsRegion = screen.getByRole('region', { name: 'Comments on Peace for our family' });
    await waitFor(() => expect(commentsRegion).toHaveFocus());
    expect(commentsRegion).not.toHaveClass('rounded-2xl');
    expect(commentsRegion).not.toHaveClass('border');
    expect(commentsRegion).not.toHaveClass('tbo-glass-inset');
    const commentRow = screen.getByText('We are with you.').closest('li');
    expect(commentRow).not.toHaveClass('rounded-xl');
    expect(commentRow).not.toHaveClass('border');
    expect(commentRow).not.toHaveClass('ring-1');

    const commentInput = screen.getByRole('textbox', { name: 'Add a comment' });
    const loadedComment = screen.getByText('We are with you.');
    expect(loadedComment).toHaveClass('tbo-supporting');
    expect(loadedComment.compareDocumentPosition(openCommentsToggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(openCommentsToggle.compareDocumentPosition(commentInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const addCommentButton = screen.getByRole('button', { name: 'Add comment' });
    expect(addCommentButton).not.toHaveTextContent('Add comment');
    expect(addCommentButton).toBeDisabled();
    fireEvent.change(commentInput, { target: { value: '  Amen, thank you.  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add comment' }));

    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith('active-prayer', 'Amen, thank you.');
    });
    expect(await screen.findByText('Amen, thank you.')).toBeInTheDocument();
    expect(commentInput).toHaveValue('');

    fireEvent.click(screen.getByRole('button', { name: 'Comments' }));
    const latestCommentPreview = screen.getByRole('button', { name: 'Open comment from Firaol' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Comments' })).toHaveFocus());
    expect(latestCommentPreview).toHaveTextContent(getHalfTextPreview('Amen, thank you.'));
    expect(latestCommentPreview).toHaveTextContent('Firaol');
    expect(latestCommentPreview).not.toHaveTextContent('Firaol Akawak');
    expect(latestCommentPreview.querySelector('.tbo-supporting')).toHaveTextContent(getHalfTextPreview('Amen, thank you.'));
    expect(latestCommentPreview.querySelector('[class*="line-clamp"]')).not.toBeInTheDocument();
  });

  it('shows the latest comment and composer in the card before loading the complete thread', async () => {
    const latestComment = {
      id: 'latest-comment',
      prayerId: 'active-prayer',
      userId: 'partner-1',
      userName: 'Mimi Abebe',
      content: 'Please keep trusting God with every next step in this long prayer update.',
      createdAt: '2026-08-16T15:30:00.000Z',
      isMine: false,
    };
    const onLoadComments = vi.fn().mockResolvedValue([latestComment]);
    const onLoadLatestComment = vi.fn().mockResolvedValue(null);
    const board = (preview: typeof latestComment | null) => (
      <LanguageProvider>
        <PrayerBoard
          prayers={[{ ...prayers[0], latestComment: preview }]}
          onAddPrayer={vi.fn()}
          onUpdatePrayer={vi.fn()}
          onDeletePrayer={vi.fn()}
          onMarkPrayed={vi.fn()}
          onLoadLatestComment={onLoadLatestComment}
          onLoadComments={onLoadComments}
          onAddComment={vi.fn()}
        />
      </LanguageProvider>
    );

    const view = render(board(latestComment));

    let preview = screen.getByRole('button', { name: 'Open comment from Mimi' });
    expect(preview).toHaveTextContent('Mimi');
    expect(preview).not.toHaveTextContent('Mimi Abebe');
    expect(preview).toHaveTextContent(getHalfTextPreview(latestComment.content));
    expect(preview.querySelector('.tbo-caption')).toHaveTextContent('Mimi');
    expect(preview.querySelector('.tbo-supporting')).toHaveTextContent(getHalfTextPreview(latestComment.content));
    expect(preview.querySelector('[class*="line-clamp"]')).not.toBeInTheDocument();
    expect(preview.querySelector('time')).toHaveAttribute('datetime', latestComment.createdAt);
    expect(preview).toHaveAccessibleDescription(/Please keep trusting God/);
    expect(preview).toHaveAttribute('aria-expanded', 'false');
    const closedCommentsToggle = screen.getByRole('button', { name: 'Comments' });
    const quickCommentInput = screen.getByRole('textbox', { name: 'Add a comment' });
    expect(preview.compareDocumentPosition(closedCommentsToggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(closedCommentsToggle.compareDocumentPosition(quickCommentInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(onLoadComments).not.toHaveBeenCalled();

    view.rerender(board(null));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Open comment from Mimi' })).not.toBeInTheDocument());
    expect(screen.queryByRole('textbox', { name: 'Add a comment' })).not.toBeInTheDocument();
    expect(onLoadLatestComment).not.toHaveBeenCalled();

    view.rerender(board(latestComment));
    preview = await screen.findByRole('button', { name: 'Open comment from Mimi' });
    const persistentDraft = screen.getByRole('textbox', { name: 'Add a comment' });
    fireEvent.change(persistentDraft, { target: { value: 'Keep this draft while opening.' } });
    fireEvent.click(preview);

    const commentsRegion = await screen.findByRole('region', { name: 'Comments on Peace for our family' });
    await waitFor(() => expect(commentsRegion).toHaveFocus());
    expect(onLoadComments).toHaveBeenCalledWith('active-prayer');
    expect(screen.queryByRole('button', { name: 'Open comment from Mimi' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Add a comment' })).toHaveValue('Keep this draft while opening.');
  });

  it('loads the latest comment into a collapsed card without opening the prayer or full thread', async () => {
    const latestComment = {
      id: 'collapsed-preview-comment',
      prayerId: 'active-prayer',
      userId: 'partner-1',
      userName: 'Mimi',
      content: 'I am praying with you through every part of this request.',
      createdAt: '2026-08-16T15:30:00.000Z',
      isMine: false,
    };
    const onLoadLatestComment = vi.fn().mockResolvedValue(latestComment);
    const onLoadComments = vi.fn().mockResolvedValue([latestComment]);

    render(
      <LanguageProvider>
        <PrayerBoard
          prayers={[prayers[0]]}
          onAddPrayer={vi.fn()}
          onUpdatePrayer={vi.fn()}
          onDeletePrayer={vi.fn()}
          onMarkPrayed={vi.fn()}
          onLoadLatestComment={onLoadLatestComment}
          onLoadComments={onLoadComments}
          onAddComment={vi.fn()}
        />
      </LanguageProvider>,
    );

    const preview = await screen.findByRole('button', { name: 'Open comment from Mimi' });
    const prayedButton = screen.getByRole('button', { name: 'You prayed' });
    const commentsButton = screen.getByRole('button', { name: 'Comments' });
    const composer = screen.getByRole('textbox', { name: 'Add a comment' });

    expect(onLoadLatestComment).toHaveBeenCalledWith('active-prayer');
    expect(onLoadComments).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Expand Peace for our family' })).toHaveAttribute('aria-expanded', 'false');
    expect(preview).toHaveTextContent(getHalfTextPreview(latestComment.content));
    expect(preview.compareDocumentPosition(prayedButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(prayedButton.compareDocumentPosition(commentsButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(commentsButton.compareDocumentPosition(composer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Expand Peace for our family' }));
    expect(screen.getByText(prayers[0].description)).toBeInTheDocument();
    expect(preview).toHaveTextContent(latestComment.content);
    expect(onLoadComments).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse Peace for our family' }));
    expect(screen.getByText(getHalfTextPreview(prayers[0].description))).toBeInTheDocument();
    expect(preview).toHaveTextContent(getHalfTextPreview(latestComment.content));
  });

  it('adds a comment from the visible card composer without loading the full thread', async () => {
    const existingComment = {
      id: 'comment-1',
      prayerId: 'active-prayer',
      userId: 'partner-1',
      userName: 'Mimi',
      content: 'We are still praying.',
      createdAt: '2026-08-16T13:00:00.000Z',
      isMine: false,
    };
    const addedComment = {
      id: 'comment-2',
      prayerId: 'active-prayer',
      userId: 'user-1',
      userName: 'Firaol',
      content: 'Thank you. Amen.',
      createdAt: '2026-08-16T14:00:00.000Z',
      isMine: true,
    };
    const onLoadComments = vi.fn().mockResolvedValue([existingComment, addedComment]);
    const onAddComment = vi.fn().mockResolvedValue(addedComment);

    render(
      <LanguageProvider>
        <PrayerBoard
          prayers={[{ ...prayers[0], latestComment: existingComment }]}
          onAddPrayer={vi.fn()}
          onUpdatePrayer={vi.fn()}
          onDeletePrayer={vi.fn()}
          onMarkPrayed={vi.fn()}
          onLoadLatestComment={vi.fn().mockResolvedValue(null)}
          onLoadComments={onLoadComments}
          onAddComment={onAddComment}
        />
      </LanguageProvider>,
    );

    const commentInput = screen.getByRole('textbox', { name: 'Add a comment' });
    fireEvent.change(commentInput, { target: { value: '  Thank you. Amen.  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add comment' }));

    await waitFor(() => expect(onAddComment).toHaveBeenCalledWith('active-prayer', 'Thank you. Amen.'));
    const updatedPreview = await screen.findByRole('button', { name: 'Open comment from Firaol' });
    expect(updatedPreview.querySelector('.tbo-supporting')).toHaveTextContent(getHalfTextPreview('Thank you. Amen.'));
    expect(commentInput).toHaveValue('');
    expect(onLoadComments).not.toHaveBeenCalled();
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
          onLoadLatestComment={vi.fn().mockResolvedValue(null)}
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

    fireEvent.click(screen.getByRole('button', { name: 'Comments' }));
    expect(screen.queryByRole('textbox', { name: 'Add a comment' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Comments' }));
    expect(await screen.findByRole('textbox', { name: 'Add a comment' })).toHaveValue('Please keep praying.');
  });

  it('shows only the requester first name before the prayer type', () => {
    render(
      <LanguageProvider>
        <PrayerBoard
          prayers={[{
            ...prayers[0],
            category: 'Relationship',
            isSurprise: true,
            unlockAt: '2026-12-25T00:00:00.000Z',
          }]}
          userName="Fira Alemu"
          partnerName="Mimi Abebe"
          onAddPrayer={vi.fn()}
          onUpdatePrayer={vi.fn()}
          onDeletePrayer={vi.fn()}
          onMarkPrayed={vi.fn()}
          onLoadLatestComment={vi.fn().mockResolvedValue(null)}
          onLoadComments={vi.fn().mockResolvedValue([])}
          onAddComment={vi.fn()}
        />
      </LanguageProvider>,
    );

    const requesterName = screen.getByText('Fira');
    const prayerType = screen.getByText('Relationship');
    const prayerTitle = screen.getByRole('heading', { level: 3, name: 'Peace for our family' });
    expect(screen.queryByText('Fira Alemu')).not.toBeInTheDocument();
    expect(requesterName.compareDocumentPosition(prayerType) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(prayerType.compareDocumentPosition(prayerTitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('Aug 16')).toBeInTheDocument();
    expect(screen.getByText('Surprise')).toBeInTheDocument();
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
          onLoadLatestComment={vi.fn().mockResolvedValue(null)}
          onLoadComments={vi.fn().mockResolvedValue([])}
          onAddComment={vi.fn()}
        />
      </LanguageProvider>,
    );

    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Comments' })).not.toBeInTheDocument();
  });
});
