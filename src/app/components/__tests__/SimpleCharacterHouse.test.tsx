import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CharacterHouseBuilder } from '../CharacterHouseBuilder';
import api from '../../utils/api';
import type { CharacterHouseState } from '../../utils/characterHouseApi';
import { setCurrentLanguage } from '../../utils/languageStore';
import { translateUi } from '../../utils/uiTranslation';
import { simpleCharacterHouseMessages } from '../../locales/simpleCharacterHouse';
import { getHouseJourneyStage, safeHouseBlocks } from '../../data/characterHouseJourney';

vi.mock('../../utils/api', () => ({ default: { characterHouse: { get: vi.fn(), start: vi.fn() } } }));
const empty = (): CharacterHouseState => ({ blueprint: null, progress: { completedDays: 0, totalDays: 365, todayContributed: false, lastBlockDate: null }, day: '2026-09-17' });
const built = (count = 12): CharacterHouseState => ({ ...empty(), blueprint: { homeType: 'villa', bedrooms: 4, homeName: 'Saved home', completedDays: count, locked: true, blueprintStatus: 'active', challengeStartedAt: '2026-09-01T00:00:00Z' }, progress: { completedDays: count, totalDays: 365, todayContributed: false, lastBlockDate: '2026-09-16' } });
const props = () => ({ currentUserId: 'a', partnerId: 'b', onBack: vi.fn(), onOpenChallenge: vi.fn(), onConnect: vi.fn() });

describe('simple shared character house', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); setCurrentLanguage('en'); vi.mocked(api.characterHouse.get).mockResolvedValue(empty()); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); setCurrentLanguage('en'); });

  it('asks only house type and bedrooms and locks them in one request', async () => {
    vi.mocked(api.characterHouse.start).mockResolvedValue(built(0));
    const view = render(<CharacterHouseBuilder {...props()} />);
    await screen.findByText('1. What kind of house?');
    expect(view.container.querySelectorAll('fieldset')).toHaveLength(2);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Wall paint')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Villa', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: '4 bedrooms' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lock & start building' }));
    await screen.findByText('Design locked');
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
    fireEvent.click(screen.getByRole('button', { name: 'Lock & start building' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Apartment', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '2 bedrooms' })).toHaveAttribute('aria-pressed', 'true');
    expect(api.characterHouse.start).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Design locked')).not.toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: 'Lock & start building' })).not.toBeInTheDocument();
    expect(api.characterHouse.start).not.toHaveBeenCalled();
  });

  it('shows a retry after loading fails instead of allowing an unsynced setup', async () => {
    vi.mocked(api.characterHouse.get).mockRejectedValueOnce(new Error('offline')).mockResolvedValue(empty());
    render(<CharacterHouseBuilder {...props()} />);
    await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: 'Lock & start building' })).not.toBeInTheDocument();
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
