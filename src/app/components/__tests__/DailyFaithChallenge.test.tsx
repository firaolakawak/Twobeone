import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DailyFaithChallenge } from '../DailyFaithChallenge';
import { dailyFaithChallengeApi, type DailyFaithChallengeState } from '../../utils/dailyFaithChallengeApi';
import { setCurrentLanguage } from '../../utils/languageStore';
import { getFaithQuestVisuals } from '../../data/faithQuestVisuals';
import { DAILY_FAITH_CHALLENGE_TIME_ZONE } from '../../utils/dailyFaithChallengeTime';
import { formatUiDateTime } from '../../utils/uiDateTime';

vi.mock('../../utils/dailyFaithChallengeApi', () => ({
  dailyFaithChallengeApi: { today: vi.fn(), submit: vi.fn(), complete: vi.fn() },
  DailyFaithChallengeError: class DailyFaithChallengeError extends Error { constructor(public code: string) { super(code); } },
}));

const initial = (): DailyFaithChallengeState => ({
  day: '2026-09-17', missionId: 'quest-01', resetsAt: '2026-09-17T20:00:00Z',
  own: null, partner: { submitted: false, completed: false }, bothSubmitted: false,
});
const resetTimeOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  timeZone: DAILY_FAITH_CHALLENGE_TIME_ZONE,
};
const formattedReset = (value: string, locale = 'en-US') => formatUiDateTime(new Date(value), locale, resetTimeOptions);
let remote: DailyFaithChallengeState;
const props = () => ({
  userId: 'firaol', partnerId: 'keti', userName: 'Firaol', partnerName: 'Keti',
  authenticated: true, moodReady: true, hasMood: true,
  onRequestMood: vi.fn(), onConnect: vi.fn(), onRequestConsumed: vi.fn(),
});
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const pick = (index: number) => fireEvent.click(screen.getAllByRole('radio')[index]);
const advance = async (milliseconds = 500) => {
  // Flush the mocked network response before advancing the modal's delay.
  await act(async () => { await Promise.resolve(); });
  await act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); });
};
const close = async () => { fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' }); await advance(0); };

describe('daily Together in Faith card', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-17T12:00:00Z'));
    vi.clearAllMocks();
    localStorage.clear();
    setCurrentLanguage('en');
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    remote = initial();
    vi.mocked(dailyFaithChallengeApi.today).mockImplementation(async () => structuredClone(remote));
    vi.mocked(dailyFaithChallengeApi.submit).mockImplementation(async (value) => {
      remote = { ...remote, own: { choice: value.choice, guess: value.guess, submittedAt: new Date().toISOString(), completedAt: null } };
      return structuredClone(remote);
    });
    vi.mocked(dailyFaithChallengeApi.complete).mockImplementation(async () => {
      remote = { ...remote, own: { ...remote.own!, completedAt: new Date().toISOString() } };
      return structuredClone(remote);
    });
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); setCurrentLanguage('en'); });

  it('opens after a saved mood and waits for the existing mood modal to close', async () => {
    const base = props();
    const view = render(<DailyFaithChallenge {...base} moodReady={false} hasMood={false} />);
    await advance();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const mood = document.createElement('div');
    mood.setAttribute('role', 'dialog'); mood.setAttribute('aria-label', 'Mood check-in');
    document.body.append(mood);
    view.rerender(<DailyFaithChallenge {...base} moodReady hasMood />);
    await advance();
    expect(screen.getAllByRole('dialog')).toEqual([mood]);
    await act(async () => { mood.remove(); });
    await advance();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByRole('radio')).toHaveLength(3);
    expect(within(dialog).getByText('Today’s encouragement', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText('Playable preview')).not.toBeInTheDocument();
  });

  it('remembers one automatic opening per account and shared day but allows manual resume', async () => {
    const base = props();
    const first = render(<DailyFaithChallenge {...base} />);
    await advance(); await close();
    first.unmount();
    render(<DailyFaithChallenge {...base} />);
    await advance();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    click('Open today’s challenge'); await advance();
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getAllByRole('radio').every(input => !(input as HTMLInputElement).checked)).toBe(true);
    expect(dailyFaithChallengeApi.submit).not.toHaveBeenCalled();
  });

  it('retains a notification open request through authentication and mood loading', async () => {
    const base = props();
    const view = render(<DailyFaithChallenge {...base} authenticated={false} moodReady={false} hasMood={false} openRequest={1} />);
    await advance();
    expect(base.onRequestConsumed).not.toHaveBeenCalled();
    view.rerender(<DailyFaithChallenge {...base} moodReady={false} hasMood={false} openRequest={1} />);
    await advance();
    expect(base.onRequestConsumed).toHaveBeenCalledTimes(1);
    expect(base.onRequestMood).not.toHaveBeenCalled();
    view.rerender(<DailyFaithChallenge {...base} moodReady hasMood={false} openRequest={1} />);
    await advance();
    expect(base.onRequestMood).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    view.rerender(<DailyFaithChallenge {...base} openRequest={0} />);
    await advance();
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(base.onRequestConsumed).toHaveBeenCalledTimes(1);
  });

  it('refreshes partner state immediately when a notification request is consumed', async () => {
    const base = props();
    const stale = { ...initial(), own: { choice: 0, guess: 1, submittedAt: '2026-09-17T10:00:00Z', completedAt: null } };
    const fresh: DailyFaithChallengeState = { ...stale, bothSubmitted: true,
      partner: { submitted: true, choice: 2, guess: 0, submittedAt: '2026-09-17T11:00:00Z', completed: false } };
    vi.mocked(dailyFaithChallengeApi.today).mockResolvedValueOnce(structuredClone(stale)).mockResolvedValue(structuredClone(fresh));

    render(<DailyFaithChallenge {...base} openRequest={8} />);
    await advance();

    expect(base.onRequestConsumed).toHaveBeenCalledOnce();
    expect(dailyFaithChallengeApi.today).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Reveal our cards' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Waiting for Keti' })).not.toBeInTheDocument();
  });

  it('waits for a slow notification refresh before opening partner status', async () => {
    const base = props();
    const stale: DailyFaithChallengeState = { ...initial(),
      own: { choice: 0, guess: 1, submittedAt: '2026-09-17T10:00:00Z', completedAt: null } };
    const fresh: DailyFaithChallengeState = { ...stale, bothSubmitted: true,
      partner: { submitted: true, choice: 2, guess: 0, submittedAt: '2026-09-17T11:00:00Z', completed: false } };
    let resolveRefresh!: (state: DailyFaithChallengeState) => void;
    const delayedRefresh = new Promise<DailyFaithChallengeState>(resolve => { resolveRefresh = resolve; });
    vi.mocked(dailyFaithChallengeApi.today).mockResolvedValueOnce(structuredClone(stale)).mockReturnValueOnce(delayedRefresh);

    const view = render(<DailyFaithChallenge {...base} />);
    await advance(0);
    expect(screen.getByText('Your answer is saved. Waiting for Keti.')).toBeVisible();

    view.rerender(<DailyFaithChallenge {...base} openRequest={9} />);
    await advance(500);
    expect(base.onRequestConsumed).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await act(async () => { resolveRefresh(structuredClone(fresh)); });
    await advance();
    expect(screen.getByRole('button', { name: 'Reveal our cards' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Waiting for Keti' })).not.toBeInTheDocument();
  });

  it('shows that the partner answered without revealing their private choice early', async () => {
    remote = { ...initial(), partner: { submitted: true, submittedAt: '2026-09-17T11:00:00Z', completed: false } };
    localStorage.setItem('twobeone:daily-faith:shown:["firaol","keti"]:2026-09-17', '1');
    render(<DailyFaithChallenge {...props()} />);
    await advance();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Keti answered. It’s your turn.')).toBeVisible();
    click('Open today’s challenge'); await advance();
    const progress = screen.getByRole('region', { name: 'Today’s progress' });
    expect(within(progress).getAllByRole('listitem')[0]).toHaveTextContent('Your answerNot started');
    expect(within(progress).getAllByRole('listitem')[1]).toHaveTextContent('Keti’s answerSubmitted');
    expect(within(progress).getByText('Next step: Submit your answer to reveal both cards.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Reveal our cards' })).not.toBeInTheDocument();
    expect(screen.queryByText('Your partner’s choice')).not.toBeInTheDocument();
  });

  it('shows Abu Dhabi midnight and localizes the reset label without closing the challenge', async () => {
    render(<DailyFaithChallenge {...props()} />);
    await advance();

    const expectReset = (locale: string, label: string) => {
      const times = screen.getAllByText(formattedReset(initial().resetsAt, locale), { selector: 'time' });
      expect(times).toHaveLength(2);
      for (const time of times) {
        expect(time).toHaveAttribute('datetime', initial().resetsAt);
        expect(time.closest('p')).toHaveTextContent(label);
      }
    };

    expectReset('en-US', 'Abu Dhabi time');
    expect(screen.getAllByText(formattedReset(initial().resetsAt), { selector: 'time' })[0]).toHaveTextContent('12:00 AM');
    await act(async () => { setCurrentLanguage('am'); });
    expect(screen.getByRole('dialog')).toBeVisible();
    expectReset('am-ET', 'በአቡ ዳቢ ሰዓት');
    await act(async () => { setCurrentLanguage('om'); });
    expect(screen.getByRole('dialog')).toBeVisible();
    expectReset('om-ET', 'sa’aatii Abu Dhabi');
  });

  it('saves actual heart choices, waits for the partner, then reveals the remote answer and completes', async () => {
    render(<DailyFaithChallenge {...props()} />);
    await advance();
    const progress = screen.getByRole('region', { name: 'Today’s progress' });
    const initialRows = within(progress).getAllByRole('listitem');
    expect(initialRows).toHaveLength(4);
    expect(initialRows[0]).toHaveTextContent('Your answerNot started');
    expect(initialRows[1]).toHaveTextContent('Keti’s answerWaiting');
    expect(initialRows[2]).toHaveTextContent('Your activityNot started');
    expect(initialRows[3]).toHaveTextContent('Keti’s activityWaiting');
    expect(within(progress).getByText('Next step: Choose and save your answer.')).toBeVisible();
    expect(within(progress).getByText(formattedReset(initial().resetsAt), { selector: 'time' })).toHaveAttribute('datetime', initial().resetsAt);
    pick(0); click('Confirm');
    expect(screen.getByRole('heading', { name: 'What would Keti choose?' })).toBeVisible();
    expect(within(progress).getByText('Next step: Guess what Keti would choose, then save.')).toBeVisible();
    expect(dailyFaithChallengeApi.submit).not.toHaveBeenCalled();
    pick(1); click('Save and notify partner'); await advance(0);
    expect(dailyFaithChallengeApi.submit).toHaveBeenCalledExactlyOnceWith({ day: '2026-09-17', missionId: 'quest-01', choice: 0, guess: 1 });
    expect(screen.getByRole('heading', { name: 'Waiting for Keti' })).toBeVisible();
    expect(within(progress).getAllByRole('listitem')[0]).toHaveTextContent('Your answerSubmitted');
    expect(within(progress).getByText('Next step: Wait for Keti to submit an answer.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Reveal our cards' })).not.toBeInTheDocument();
    expect(screen.queryByText('Sample partner')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    remote = { ...remote, bothSubmitted: true, partner: { submitted: true, choice: 2, guess: 0, completed: false } };
    await advance(30_000);
    expect(within(progress).getAllByRole('listitem')[1]).toHaveTextContent('Keti’s answerSubmitted');
    expect(within(progress).getByText('Next step: Reveal your cards.')).toBeVisible();
    click('Reveal our cards');
    expect(within(progress).getByText('Next step: Continue to the shared activity.')).toBeVisible();
    const cards = document.querySelectorAll<HTMLElement>('.quest-reveal-card');
    expect(cards).toHaveLength(2);
    expect(within(cards[1]).getByText('Keti')).toBeVisible();
    expect(within(cards[1]).getByText(getFaithQuestVisuals('quest-01')!.choices[2].label, { exact: true })).toBeVisible();
    click('Take it into real life');
    expect(within(progress).getByText('Next step: Complete the shared activity.')).toBeVisible();
    expect(within(progress).getAllByRole('listitem')[2]).toHaveTextContent('Your activityIn progress');
    expect(screen.getByRole('button', { name: 'Complete today’s challenge' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'We tried this together.' }));
    click('Complete today’s challenge'); await advance(0);
    expect(dailyFaithChallengeApi.complete).toHaveBeenCalledExactlyOnceWith({ day: '2026-09-17', missionId: 'quest-01' });
    expect(screen.getByRole('heading', { name: 'Your activity is complete' })).toBeVisible();
    expect(within(progress).getAllByRole('listitem')[2]).toHaveTextContent('Your activityCompleted');
    expect(within(progress).getAllByRole('listitem')[3]).toHaveTextContent('Keti’s activityWaiting');
    expect(within(progress).getByText('Next step: Wait for Keti to complete the shared activity.')).toBeVisible();
  });

  it('requires trying the selected kindness before submitting or notifying', async () => {
    remote = { ...initial(), day: '2026-09-19', missionId: 'quest-03', resetsAt: '2026-09-19T20:00:00Z' };
    render(<DailyFaithChallenge {...props()} />);
    await advance(); pick(2); click('Confirm');
    expect(screen.getByRole('heading', { name: 'Try this kindness first' })).toBeVisible();
    expect(screen.getByText('Next step: Try the selected kindness, then confirm and save.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save and notify partner' })).toBeDisabled();
    expect(dailyFaithChallengeApi.submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'I tried this act of kindness.' }));
    click('Save and notify partner'); await advance(0);
    expect(dailyFaithChallengeApi.submit).toHaveBeenCalledExactlyOnceWith({ day: '2026-09-19', missionId: 'quest-03', choice: 2, kindnessDone: true });
    expect(screen.getByRole('heading', { name: 'Waiting for Keti' })).toBeVisible();
  });

  it('keeps a failed choice selected and retries without showing a saved or waiting state', async () => {
    remote = { ...initial(), day: '2026-09-18', missionId: 'quest-02', resetsAt: '2026-09-18T20:00:00Z' };
    vi.mocked(dailyFaithChallengeApi.submit).mockRejectedValueOnce(new Error('Network interrupted'));
    render(<DailyFaithChallenge {...props()} />);
    await advance(); pick(1); click('Save and notify partner'); await advance(0);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save your choice. Please try again.');
    expect(screen.getAllByRole('radio')[1]).toBeChecked();
    expect(screen.queryByRole('heading', { name: 'Waiting for Keti' })).not.toBeInTheDocument();
    click('Save and notify partner'); await advance(0);
    expect(dailyFaithChallengeApi.submit).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('heading', { name: 'Waiting for Keti' })).toBeVisible();
  });

  it('does not automatically interrupt a saved player, and opens a fresh card on the next server day', async () => {
    remote = { ...initial(), own: { choice: 0, guess: 1, submittedAt: '2026-09-17T10:00:00Z', completedAt: null } };
    render(<DailyFaithChallenge {...props()} />);
    await advance();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Your answer is saved. Waiting for Keti.')).toBeVisible();
    remote = { ...initial(), day: '2026-09-18', missionId: 'quest-02', resetsAt: '2026-09-18T20:00:00Z' };
    await advance(30_500);
    await advance();
    expect(screen.getByRole('heading', { name: getFaithQuestVisuals('quest-02')!.prompt })).toBeVisible();
    expect(screen.getAllByRole('radio').every(input => !(input as HTMLInputElement).checked)).toBe(true);
  });

  it('keeps the saved waiting state on a refresh failure and retries with a load error', async () => {
    remote = { ...initial(), own: { choice: 2, guess: 0, submittedAt: '2026-09-17T10:00:00Z', completedAt: null } };
    render(<DailyFaithChallenge {...props()} />);
    await advance();
    click('Open today’s challenge'); await advance();
    expect(screen.getByRole('heading', { name: 'Waiting for Keti' })).toBeVisible();

    vi.mocked(dailyFaithChallengeApi.today).mockRejectedValueOnce(new Error('Network interrupted'));
    click('Refresh'); await advance(0);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load today’s challenge. Please try again.');
    expect(alert).not.toHaveTextContent('Could not save your choice');
    expect(screen.getByRole('heading', { name: 'Waiting for Keti' })).toBeVisible();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    fireEvent.click(within(alert).getByRole('button', { name: 'Refresh' })); await advance(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Waiting for Keti' })).toBeVisible();
    expect(dailyFaithChallengeApi.submit).not.toHaveBeenCalled();
    expect(remote.own?.choice).toBe(2);
  });

  it('does not automatically reopen after a manually opened loading card receives its day', async () => {
    let resolveToday!: (state: DailyFaithChallengeState) => void;
    const pending = new Promise<DailyFaithChallengeState>(resolve => { resolveToday = resolve; });
    vi.mocked(dailyFaithChallengeApi.today).mockImplementation(() => pending);
    render(<DailyFaithChallenge {...props()} />);
    click('Open today’s challenge'); await advance();
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    await act(async () => { resolveToday(initial()); });
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    await close(); await advance(1_000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(dailyFaithChallengeApi.submit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Open today’s challenge' })).toBeVisible();
  });

  it('shows the practised virtue and waits for both completions before reporting a house block', async () => {
    const onOpenHouse = vi.fn();
    remote = { ...initial(), bothSubmitted: true,
      own: { choice: 0, guess: 1, submittedAt: '2026-09-17T10:00:00Z', completedAt: '2026-09-17T11:00:00Z' },
      partner: { submitted: true, choice: 1, guess: 0, completed: false },
      house: { configured: true, homeType: 'house', bedrooms: 3, completedDays: 14, totalDays: 365, todayContributed: false, lastBlockDate: '2026-09-16' },
    };
    render(<DailyFaithChallenge {...props()} onOpenHouse={onOpenHouse} />);
    await advance();
    expect(screen.getByText('Your activity is complete. Waiting for Keti.')).toBeVisible();
    expect(screen.getByText(formattedReset(remote.resetsAt), { selector: 'time' })).toHaveAttribute('datetime', remote.resetsAt);
    click('Open today’s challenge'); await advance();
    expect(screen.getByText('Practised: Love')).toBeVisible();
    expect(screen.getByText('Waiting for your partner to complete the activity.')).toBeVisible();
    expect(screen.queryByText('+1 shared block')).not.toBeInTheDocument();
    expect(screen.getByText('14 / 365 blocks')).toBeVisible();

    remote = { ...remote, partner: { ...remote.partner, completed: true },
      house: { ...remote.house!, completedDays: 15, todayContributed: true, lastBlockDate: remote.day } };
    await advance(30_000);
    expect(screen.getByRole('heading', { name: 'Today’s challenge complete' })).toBeVisible();
    expect(screen.getByText('Next step: Your shared activity is complete.')).toBeVisible();
    expect(screen.getByText('+1 shared block')).toBeVisible();
    expect(screen.getByText('15 / 365 blocks')).toBeVisible();
    click('View our house'); await advance(0);
    expect(onOpenHouse).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(dailyFaithChallengeApi.complete).not.toHaveBeenCalled();
  });

  it('offers house setup after completing a challenge without claiming an unearned block', async () => {
    const onOpenHouse = vi.fn();
    remote = { ...initial(), bothSubmitted: true, house: null,
      own: { choice: 0, guess: 1, submittedAt: '2026-09-17T10:00:00Z', completedAt: '2026-09-17T11:00:00Z' },
      partner: { submitted: true, choice: 1, guess: 0, completed: true },
    };
    render(<DailyFaithChallenge {...props()} onOpenHouse={onOpenHouse} />);
    await advance(); click('Open today’s challenge'); await advance();
    expect(screen.getByText('Start your house to turn daily challenges into building progress.')).toBeVisible();
    expect(screen.queryByText('+1 shared block')).not.toBeInTheDocument();
    click('Start our house');
    expect(onOpenHouse).toHaveBeenCalledOnce();
  });

  it('celebrates a finished house without promising progress beyond its goal', async () => {
    remote = { ...initial(), bothSubmitted: true,
      own: { choice: 0, guess: 1, submittedAt: '2026-09-17T10:00:00Z', completedAt: '2026-09-17T11:00:00Z' },
      partner: { submitted: true, choice: 1, guess: 0, completed: true },
      house: { configured: true, homeType: 'villa', bedrooms: 4, completedDays: 365, totalDays: 365, todayContributed: true, lastBlockDate: '2026-09-17' },
    };
    render(<DailyFaithChallenge {...props()} />);
    await advance(); click('Open today’s challenge'); await advance();
    expect(screen.getByText('Your house is complete')).toBeVisible();
    expect(screen.getByText('365 / 365 blocks')).toBeVisible();
    expect(screen.queryByText('+1 shared block')).not.toBeInTheDocument();
  });
});
