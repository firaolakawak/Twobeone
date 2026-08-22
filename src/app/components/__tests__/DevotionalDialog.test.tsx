import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { DevotionalDialog } from '../DevotionalDialog';

describe('DevotionalDialog', () => {
  afterEach(cleanup);

  it('presents the complete devotional in a consistent reading hierarchy', async () => {
    const onClose = vi.fn();
    const onComplete = vi.fn().mockResolvedValue(undefined);

    render(
      <LanguageProvider>
        <DevotionalDialog
          devotional={{
            id: 'devotion-1',
            title: 'Rest for Two',
            verse: 'Come to me, all you who are weary.',
            reference: 'Matthew 11:28',
            reflection: 'Make room for rest and grace together.',
            prayer: 'Lord, teach us to rest in you.',
          }}
          isOpen
          onClose={onClose}
          onComplete={onComplete}
        />
      </LanguageProvider>,
    );

    expect(screen.getByRole('dialog')).toHaveClass('h-dvh', 'max-w-none', 'rounded-none');
    const backButton = screen.getByRole('button', { name: 'Back to devotionals' });
    expect(backButton).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rest for Two' })).toBeInTheDocument();
    expect(screen.getAllByText('Scripture, reflection, and prayer for your shared walk.')).toHaveLength(2);
    expect(screen.getByText(/Come to me, all you who are weary/)).toBeInTheDocument();
    expect(screen.getByText('Make room for rest and grace together.')).toBeInTheDocument();
    expect(screen.getByText('Lord, teach us to rest in you.')).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(onClose).toHaveBeenCalledOnce();
    onClose.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Mark as Complete' }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(onClose).toHaveBeenCalledOnce();
  });
});
