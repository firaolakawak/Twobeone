import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { DailyMoodCheckIn, type DailyMoodCheckInProps } from '../DailyMoodCheckIn';

const DAY = 24 * 60 * 60 * 1_000;
const reminderKey = 'twobeone:mood-check-in:last-shown:user-1';

function setup(overrides: Partial<DailyMoodCheckInProps> = {}) {
  const props: DailyMoodCheckInProps = {
    userId: 'user-1', userName: 'Alex', partnerName: 'Sam', mood: null,
    loaded: true, onSave: vi.fn().mockResolvedValue(undefined), ...overrides,
  };
  return { ...render(<DailyMoodCheckIn {...props} />, { wrapper: LanguageProvider }), props };
}

async function advance(ms = 1_100) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value });
  fireEvent(document, new Event('visibilitychange'));
}

describe('DailyMoodCheckIn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-13T23:00:00Z'));
    localStorage.clear();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('requires a selection and a successful save before dismissing an automatic check-in', async () => {
    const { props } = setup();
    expect(localStorage.getItem(reminderKey)).toBeNull();
    await advance();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(localStorage.getItem(reminderKey)).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Mood' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Great' }));
    expect(props.onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save Mood' }));
    await advance(0);
    expect(props.onSave).toHaveBeenCalledWith('great');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps a rolling 24-hour cooldown after remounts and schedules its expiry', async () => {
    const first = setup();
    await advance();
    const shownAt = Number(localStorage.getItem(reminderKey));
    first.unmount();
    vi.setSystemTime(shownAt + 2 * 60 * 60 * 1_000);
    setup();
    await advance();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await advance(DAY - (Date.now() - shownAt) - 1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await advance(1_001);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('waits for mood loading and avoids prompting when today already has a mood', async () => {
    const view = setup({ loaded: false });
    await advance();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem(reminderKey)).toBeNull();
    view.rerender(<DailyMoodCheckIn {...view.props} loaded mood="good" />);
    await advance();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: "Today's Mood" }));
    expect(screen.getByRole('button', { name: 'Good' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await advance(0);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('waits for a visible page and for another dialog to close without consuming the reminder', async () => {
    setVisibility('hidden');
    setup();
    await advance();
    expect(localStorage.getItem(reminderKey)).toBeNull();
    const otherDialog = document.createElement('div');
    otherDialog.setAttribute('role', 'dialog');
    otherDialog.setAttribute('data-state', 'open');
    document.body.append(otherDialog);
    setVisibility('visible');
    await advance();
    expect(localStorage.getItem(reminderKey)).toBeNull();
    otherDialog.remove();
    await act(async () => Promise.resolve());
    await advance();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('rechecks the cooldown if another tab shows the reminder during the opening delay', async () => {
    setup();
    await advance(500);
    localStorage.setItem(reminderKey, String(Date.now()));
    await advance();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('skips automatic prompts if storage cannot remember them while retaining manual access', async () => {
    const view = setup();
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
    await advance();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent(window, new Event('focus'));
    await advance();
    expect(write).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: "Today's Mood" }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(view.props.onSave).not.toHaveBeenCalled();
  });

  it('shows save errors inline, permits closing, and keeps the selected mood for retry', async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(undefined);
    setup({ onSave });
    await advance();
    fireEvent.click(screen.getByRole('button', { name: 'Sad' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Mood' }));
    await advance(0);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to save mood');
    expect(screen.getAllByRole('button', { name: 'Close' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Sad' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Save Mood' }));
    await advance(0);
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('isolates an old pending save and reminder history when the signed-in user changes', async () => {
    let finishSave!: () => void;
    const oldSave = vi.fn(() => new Promise<void>((resolve) => { finishSave = resolve; }));
    const view = setup({ onSave: oldSave });
    await advance();
    fireEvent.click(screen.getByRole('button', { name: 'Okay' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Mood' }));
    view.rerender(<DailyMoodCheckIn {...view.props} userId="user-2" onSave={vi.fn()} />);
    await advance();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(localStorage.getItem('twobeone:mood-check-in:last-shown:user-2')).not.toBeNull();
    await act(async () => { finishSave(); });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Mood' })).toBeDisabled();
  });
});
