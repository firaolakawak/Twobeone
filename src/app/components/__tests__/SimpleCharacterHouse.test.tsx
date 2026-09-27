import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterHouseBuilder } from '../CharacterHouseBuilder';
import api from '../../utils/api';
import type { CharacterHouseState } from '../../utils/characterHouseApi';
import { setCurrentLanguage } from '../../utils/languageStore';
import { translateUi } from '../../utils/uiTranslation';
import { simpleCharacterHouseMessages } from '../../locales/simpleCharacterHouse';
import { getHouseJourneyStage, safeHouseBlocks } from '../../data/characterHouseJourney';

vi.mock('../../utils/api', () => ({ default: { characterHouse: { get: vi.fn(), start: vi.fn(), update: vi.fn() } } }));
const empty = (): CharacterHouseState => ({ blueprint: null, progress: { completedDays: 0, totalDays: 365, todayContributed: false, currentUserCompletedToday: false, partnerCompletedToday: false, lastBlockDate: null }, day: '2026-09-17' });
const built = (count = 12): CharacterHouseState => ({ ...empty(), blueprint: { homeType: 'villa', bedrooms: 4, homeName: 'Saved home', completedDays: count, locked: true, blueprintStatus: 'active', challengeStartedAt: '2026-09-01T00:00:00Z' }, progress: { completedDays: count, totalDays: 365, todayContributed: false, currentUserCompletedToday: false, partnerCompletedToday: false, lastBlockDate: '2026-09-16' } });
const props = () => ({ currentUserId: 'a', partnerId: 'b', partnerName: 'Maya', onBack: vi.fn(), onOpenChallenge: vi.fn(), onConnect: vi.fn() });

describe('simple shared character house', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); setCurrentLanguage('en'); vi.mocked(api.characterHouse.get).mockResolvedValue(empty()); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); setCurrentLanguage('en'); });

  it('asks only house type and bedrooms and starts them in one request', async () => {
    vi.mocked(api.characterHouse.start).mockResolvedValue(built(0));
    const view = render(<CharacterHouseBuilder {...props()} />);
    await screen.findByText('1. What kind of house?');
    expect(view.container.querySelectorAll('fieldset')).toHaveLength(2);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Wall paint')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Villa', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: '4 bedrooms' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start building' }));
    await screen.findByRole('button', { name: 'Change house type' });
    expect(api.characterHouse.start).toHaveBeenCalledExactlyOnceWith({ homeType: 'villa', bedrooms: 4 });
    expect(view.container.querySelectorAll('fieldset')).toHaveLength(0);
    expect(screen.getByText('0 / 365 blocks')).toBeInTheDocument();
  });

  it('retains choices after a failed save, with no automatic mutation retry', async () => {
    vi.mocked(api.characterHouse.start).mockRejectedValue(new Error('offline'));
    render(<CharacterHouseBuilder {...props()} />);
    await screen.findByText('1. What kind of house?');
    fireEvent.click(screen.getByRole('button', { name: 'Apartment', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: '2 bedrooms' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start building' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Apartment', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '2 bedrooms' })).toHaveAttribute('aria-pressed', 'true');
    expect(api.characterHouse.start).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Change house type' })).not.toBeInTheDocument();
  });

  it('changes the shared house design without losing progress', async () => {
    const original = built(12);
    original.blueprint!.bedrooms = 7;
    const redesigned = built(12);
    redesigned.blueprint = { ...redesigned.blueprint!, homeType: 'apartment', bedrooms: 4 };
    vi.mocked(api.characterHouse.get).mockResolvedValue(original);
    vi.mocked(api.characterHouse.update).mockResolvedValue(redesigned);
    render(<CharacterHouseBuilder {...props()} />);
    await screen.findByText('Villa · 7 bedrooms');

    const editTrigger = screen.getByRole('button', { name: 'Change house type' });
    expect(editTrigger).toHaveAttribute('title', 'Change house type');
    expect(editTrigger).not.toHaveTextContent('Change house type');
    fireEvent.click(editTrigger);
    expect(await screen.findByRole('heading', { name: 'Change house type' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('button', { name: 'Change house type' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Change house type' }));
    expect(screen.getByRole('button', { name: '7 bedrooms' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Apartment', exact: true }));
    expect(screen.getByRole('button', { name: '4 bedrooms' })).toHaveAttribute('aria-pressed', 'true');

    await act(async () => { window.dispatchEvent(new Event('focus')); });
    await waitFor(() => expect(api.characterHouse.get).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'Apartment', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await act(async () => setCurrentLanguage('am'));
    expect(screen.getByRole('heading', { name: translateUi('am', simpleCharacterHouseMessages, 'Change house type') })).toBeVisible();
    await act(async () => setCurrentLanguage('om'));
    expect(screen.getByRole('button', { name: translateUi('om', simpleCharacterHouseMessages, 'Save house changes') })).toBeEnabled();
    await act(async () => setCurrentLanguage('en'));

    fireEvent.click(screen.getByRole('button', { name: 'Save house changes' }));
    await screen.findByText('Apartment · 4 bedrooms');
    expect(api.characterHouse.update).toHaveBeenCalledExactlyOnceWith({ homeType: 'apartment', bedrooms: 4 });
    expect(screen.getByRole('button', { name: 'Change house type' })).toHaveFocus();
    expect(screen.getByText('12 / 365 blocks')).toBeInTheDocument();
    expect(api.characterHouse.start).not.toHaveBeenCalled();
  });

  it('keeps an unsaved redesign and earned progress after an update fails', async () => {
    vi.mocked(api.characterHouse.get).mockResolvedValue(built(12));
    vi.mocked(api.characterHouse.update).mockRejectedValue(new Error('offline'));
    render(<CharacterHouseBuilder {...props()} />);
    await screen.findByText('Villa · 4 bedrooms');
    fireEvent.click(screen.getByRole('button', { name: 'Change house type' }));
    fireEvent.click(screen.getByRole('button', { name: 'House', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Save house changes' }));

    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'House', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Villa · 4 bedrooms')).toBeInTheDocument();
    expect(screen.getByText('12 / 365 blocks')).toBeInTheDocument();
    expect(api.characterHouse.update).toHaveBeenCalledTimes(1);
  });

  it('never imports browser progress or credits opening a daily challenge', async () => {
    localStorage.setItem('twobeone_character_house_prototype_v1', JSON.stringify({ completedDays: 365, homeType: 'villa' }));
    vi.mocked(api.characterHouse.get).mockResolvedValue(built(12));
    const callbacks = props();
    render(<CharacterHouseBuilder {...callbacks} />);
    await screen.findByText('12 / 365 blocks');
    fireEvent.click(screen.getByRole('button', { name: 'Open today’s challenge' }));
    expect(callbacks.onOpenChallenge).toHaveBeenCalledOnce();
    expect(screen.getByText('12 / 365 blocks')).toBeInTheDocument();
    expect(api.characterHouse.start).not.toHaveBeenCalled();
    expect(screen.queryByText('Place Today’s Block')).not.toBeInTheDocument();
  });

  it('shows that the viewer completed their part and keeps today’s status accessible while the partner is pending', async () => {
    const completedToday = built(12);
    completedToday.progress.currentUserCompletedToday = true;
    const nextDay = built(12);
    nextDay.day = '2026-09-18';
    vi.mocked(api.characterHouse.get).mockResolvedValueOnce(completedToday).mockResolvedValueOnce(completedToday).mockResolvedValue(nextDay);
    const callbacks = props();
    render(<CharacterHouseBuilder {...callbacks} />);

    expect(await screen.findByText('Your part is complete')).toBeVisible();
    expect(screen.getByText('Waiting for Maya to complete today’s challenge. The shared block will be added after both of you finish.')).toBeVisible();
    expect(screen.getByText('Completed')).toBeVisible();
    expect(screen.getByText('Not completed yet')).toBeVisible();
    expect(screen.getByRole('status', { name: 'Today’s completion status' })).toBeVisible();
    const statusButton = screen.getByRole('button', { name: 'View today’s status' });
    expect(statusButton).toBeEnabled();
    fireEvent.click(statusButton);
    expect(callbacks.onOpenChallenge).toHaveBeenCalledOnce();

    await act(async () => setCurrentLanguage('am'));
    expect(screen.getByRole('button', { name: translateUi('am', simpleCharacterHouseMessages, 'View today’s status') })).toBeEnabled();
    expect(screen.getByText(translateUi('am', simpleCharacterHouseMessages, 'Waiting for {name} to complete today’s challenge. The shared block will be added after both of you finish.', { name: 'Maya' }))).toBeVisible();
    await act(async () => setCurrentLanguage('om'));
    expect(screen.getByRole('button', { name: translateUi('om', simpleCharacterHouseMessages, 'View today’s status') })).toBeEnabled();
    expect(screen.getByText(translateUi('om', simpleCharacterHouseMessages, 'Waiting for {name} to complete today’s challenge. The shared block will be added after both of you finish.', { name: 'Maya' }))).toBeVisible();

    await act(async () => { setCurrentLanguage('en'); window.dispatchEvent(new Event('focus')); });
    await waitFor(() => expect(api.characterHouse.get).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'View today’s status' })).toBeEnabled();

    await act(async () => { window.dispatchEvent(new Event('focus')); });
    const unlocked = await screen.findByRole('button', { name: 'Open today’s challenge' });
    expect(unlocked).toBeEnabled();
    fireEvent.click(unlocked);
    expect(callbacks.onOpenChallenge).toHaveBeenCalledTimes(2);
  });

  it('shows when the partner finished first and makes the viewer’s next step explicit', async () => {
    const partnerFinished = built(12);
    partnerFinished.progress.partnerCompletedToday = true;
    vi.mocked(api.characterHouse.get).mockResolvedValue(partnerFinished);
    const callbacks = props();
    render(<CharacterHouseBuilder {...callbacks} />);

    expect(await screen.findByText('Maya completed their part')).toBeVisible();
    expect(screen.getByText('Your turn: complete today’s challenge to add the shared block.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Complete your part' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Complete your part' }));
    expect(callbacks.onOpenChallenge).toHaveBeenCalledOnce();
  });

  it('does not report a missing rollout completion flag as not completed', async () => {
    const rolling = built(12);
    rolling.progress.partnerCompletedToday = null;
    vi.mocked(api.characterHouse.get).mockResolvedValue(rolling);
    render(<CharacterHouseBuilder {...props()} />);

    expect(await screen.findByText('Completion details are updating. This page refreshes automatically.')).toBeVisible();
    expect(screen.getByText('Status unavailable')).toBeVisible();
    expect(screen.queryByText('Maya completed their part')).not.toBeInTheDocument();
  });

  it('confirms both completions and the shared block without hiding today’s status', async () => {
    const contributed = built(13);
    contributed.progress.todayContributed = true;
    contributed.progress.currentUserCompletedToday = true;
    contributed.progress.partnerCompletedToday = true;
    contributed.progress.lastBlockDate = contributed.day;
    vi.mocked(api.characterHouse.get).mockResolvedValue(contributed);
    render(<CharacterHouseBuilder {...props()} />);

    expect(await screen.findByText('Today’s shared block is in place!')).toBeVisible();
    expect(screen.getByText('You both completed today’s challenge. One block was added to your house.')).toBeVisible();
    expect(screen.getAllByText('Completed')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'View today’s status' })).toBeEnabled();
  });

  it('does not claim both partners completed when today’s block came from a legacy baseline', async () => {
    const baselineToday = built(13);
    baselineToday.progress.todayContributed = true;
    baselineToday.progress.lastBlockDate = baselineToday.day;
    vi.mocked(api.characterHouse.get).mockResolvedValue(baselineToday);
    render(<CharacterHouseBuilder {...props()} />);

    expect(await screen.findByText('Today’s shared block is in place!')).toBeVisible();
    expect(screen.getByText('Today’s shared block is recorded. Check each partner’s activity status below.')).toBeVisible();
    expect(screen.getAllByText('Not completed yet')).toHaveLength(2);
    expect(screen.queryByText('You both completed today’s challenge. One block was added to your house.')).not.toBeInTheDocument();
  });

  it('does not carry a previous couple’s late response to the new couple', async () => {
    let finishOld!: (value: CharacterHouseState) => void;
    vi.mocked(api.characterHouse.get).mockReturnValueOnce(new Promise(resolve => { finishOld = resolve; })).mockResolvedValue(empty());
    const callbacks = props();
    const view = render(<CharacterHouseBuilder {...callbacks} />);
    view.rerender(<CharacterHouseBuilder {...callbacks} currentUserId="new-user" partnerId="new-partner" />);
    await screen.findByText('1. What kind of house?');
    await act(async () => finishOld(built(320)));
    expect(screen.queryByText('320 / 365 blocks')).not.toBeInTheDocument();
    expect(screen.getByText('1. What kind of house?')).toBeInTheDocument();
  });

  it('switches translated copy on the same form without losing stable choices', async () => {
    render(<CharacterHouseBuilder {...props()} />);
    await screen.findByText('1. What kind of house?');
    fireEvent.click(screen.getByRole('button', { name: 'Villa', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: '5 bedrooms' }));
    await act(async () => setCurrentLanguage('am'));
    expect(screen.getByRole('button', { name: translateUi('am', simpleCharacterHouseMessages, 'Villa'), exact: true })).toHaveAttribute('aria-pressed', 'true');
    await act(async () => setCurrentLanguage('om'));
    expect(screen.getByRole('button', { name: translateUi('om', simpleCharacterHouseMessages, '{count} bedrooms', { count: 5 }) })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps completed progress and never restarts a finished house', async () => {
    vi.mocked(api.characterHouse.get).mockResolvedValue(built(365));
    render(<CharacterHouseBuilder {...props()} />);
    await screen.findByText('Your home is complete!');
    expect(screen.getByText('365 / 365 blocks')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start building' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change house type' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Open today’s challenge' })).toBeEnabled();
    expect(api.characterHouse.start).not.toHaveBeenCalled();
  });

  it('shows a retry after loading fails instead of allowing an unsynced setup', async () => {
    vi.mocked(api.characterHouse.get).mockRejectedValueOnce(new Error('offline')).mockResolvedValue(empty());
    render(<CharacterHouseBuilder {...props()} />);
    await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: 'Start building' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('1. What kind of house?');
  });

  it('shows the connection action without fetching someone else’s saved house', async () => {
    const callbacks = props();
    render(<CharacterHouseBuilder {...callbacks} partnerId={undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Connect your partner' }));
    expect(callbacks.onConnect).toHaveBeenCalledOnce();
    expect(api.characterHouse.get).not.toHaveBeenCalled();
  });

  it('keeps construction thresholds finite and uses the retained 365-block goal', () => {
    expect(safeHouseBlocks(Number.NaN)).toBe(0);
    expect(safeHouseBlocks(-1)).toBe(0);
    expect(safeHouseBlocks(999)).toBe(365);
    expect([0, 59, 60, 150, 220, 300, 365].map(count => getHouseJourneyStage(count).id)).toEqual(['foundation', 'foundation', 'walls', 'windows', 'roof', 'home', 'home']);
  });

  it('provides both translations with identical placeholders for every new message', () => {
    const placeholders = (value: string) => [...value.matchAll(/\{\w+\}/g)].map(match => match[0]).sort();
    for (const [source, pair] of Object.entries(simpleCharacterHouseMessages)) {
      for (const translated of pair) { expect(translated.trim()).not.toBe(''); expect(placeholders(translated)).toEqual(placeholders(source)); }
    }
  });
});
