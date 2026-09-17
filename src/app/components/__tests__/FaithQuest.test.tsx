import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FaithQuest } from '../FaithQuest';
import { FAITH_QUEST_MISSIONS } from '../../data/faithQuest';
import { getFaithQuestVisuals } from '../../data/faithQuestVisuals';
import { questStorageKey } from '../../utils/faithQuestProgress';
import { setCurrentLanguage } from '../../utils/languageStore';
import { faithQuestUiMessages } from '../../locales/faithQuestUi';

const props = { onBack: vi.fn(), currentUserId: 'firaol', partnerId: 'keti', userName: 'Firaol', partnerName: 'Keti' };
const progressKey = questStorageKey('firaol', 'keti', 'practice');

function click(name: string) { fireEvent.click(screen.getByRole('button', { name, exact: true })); }
function pick(index: number) { fireEvent.click(screen.getAllByRole('radio')[index]); }
function begin() { click('Start our first mission'); click('Start mission'); }
function finishPractice(followUp?: string) {
  click('Reveal our cards');
  if (followUp) {
    const line = screen.getByText(followUp, { exact: true });
    expect(line).not.toBeVisible();
    fireEvent.click(line.closest('details')!.querySelector('summary')!);
    expect(line).toBeVisible();
  }
  click('Take it into real life');
  expect(screen.getByRole('button', { name: 'Complete practice' })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'I explored this practice activity.' }));
  click('Complete practice');
}

describe('Together in Faith playable preview', () => {
  beforeEach(() => { localStorage.clear(); setCurrentLanguage('en'); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); setCurrentLanguage('en'); });

  it('plays all three modes, preserves completion on reload, and keeps answers out of storage', () => {
    const view = render(<FaithQuest {...props} />);
    expect(screen.getByRole('button', { name: /Mission 2.*A late call/ })).toBeDisabled();
    begin();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Just listen' })).toHaveAccessibleDescription(FAITH_QUEST_MISSIONS[0].options[0]);
    pick(0); click('Confirm'); pick(2); click('Confirm');
    expect(screen.getByText('Sample partner')).toBeVisible();
    finishPractice();
    click('Next mission'); click('Start mission');
    expect(screen.getByRole('heading', { name: 'Your partner is late. What do you do?' })).toBeVisible();
    pick(1); click('Confirm'); finishPractice(FAITH_QUEST_MISSIONS[1].followUps?.[1]);
    click('Next mission'); click('Start mission');
    pick(2); click('Confirm');
    expect(screen.getByRole('heading', { name: 'Your secret mission' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Reveal our cards' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'I explored this practice activity.' }));
    click('Ready to discover?'); finishPractice(); click('Back to the journey');

    const saved = JSON.parse(localStorage.getItem(progressKey)!);
    expect(saved.completions.map((item: { id: string }) => item.id)).toEqual(['quest-01', 'quest-02', 'quest-03']);
    expect(Object.keys(saved.completions[0]).sort()).toEqual(['completedAt', 'id']);
    expect(localStorage.getItem(progressKey)).not.toContain('answers');
    view.unmount();
    render(<FaithQuest {...props} />);
    expect(screen.getByText('3 of 30 missions')).toBeVisible();
    expect(screen.getByRole('button', { name: /Mission 4.*Ready to play/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Mission 5.*Locked/ })).toBeDisabled();
  }, 10_000);

  it('hides the first player’s answers at handoff and reveals both actual choices together', () => {
    render(<FaithQuest {...props} />);
    click('Pass & play'); begin(); pick(0); click('Confirm'); pick(1); click('Confirm');
    expect(screen.getByRole('heading', { name: 'Pass the device to Keti' })).toBeVisible();
    expect(screen.queryByText(FAITH_QUEST_MISSIONS[0].options[0], { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByText(/Practice uses sample choices/)).not.toBeInTheDocument();
    click('I’m ready'); pick(2); click('Confirm'); pick(0); click('Confirm'); click('Reveal our cards');
    const cards = document.querySelectorAll('.quest-reveal-card');
    expect(cards).toHaveLength(2);
    expect(within(cards[0] as HTMLElement).getByText('Firaol')).toBeVisible();
    expect(within(cards[0] as HTMLElement).getByText(getFaithQuestVisuals('quest-01')!.choices[0].label, { exact: true })).toBeVisible();
    expect(within(cards[1] as HTMLElement).getByText('Keti')).toBeVisible();
    expect(within(cards[1] as HTMLElement).getByText(getFaithQuestVisuals('quest-01')!.choices[2].label, { exact: true })).toBeVisible();
    click('Take it into real life'); fireEvent.click(screen.getByRole('checkbox', { name: 'We tried this together.' })); click('Complete mission');
    expect(localStorage.getItem(progressKey)).toBeNull();
    expect(JSON.parse(localStorage.getItem(questStorageKey('firaol', 'keti', 'together'))!).completions).toHaveLength(1);
  });

  it('confirms exit, clears unfinished answers, and returns focus to the launch button', async () => {
    render(<FaithQuest {...props} />);
    const launch = screen.getByRole('button', { name: 'Start our first mission' });
    launch.focus(); begin(); pick(0);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('alertdialog', { name: 'Exit mission?' })).toBeVisible();
    click('Keep playing');
    expect(screen.getAllByRole('radio')[0]).toBeChecked();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' }); click('Exit mission');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    begin();
    expect(screen.getAllByRole('radio').every(radio => !(radio as HTMLInputElement).checked)).toBe(true);
    expect(localStorage.getItem(progressKey)).toBeNull();
  });

  it('keeps account progress separate and only resets the selected play mode', () => {
    localStorage.setItem(progressKey, JSON.stringify({ version: 1, completions: [{ id: 'quest-01', completedAt: new Date().toISOString() }] }));
    const otherKey = questStorageKey('keti', 'firaol', 'practice');
    localStorage.setItem(otherKey, localStorage.getItem(progressKey)!);
    const view = render(<FaithQuest {...props} />);
    expect(screen.getByText('1 of 30 missions')).toBeVisible();
    click('Reset preview'); click('Keep progress'); expect(screen.getByText('1 of 30 missions')).toBeVisible();
    click('Reset preview'); click('Reset progress'); expect(screen.getByText('0 of 30 missions')).toBeVisible();
    expect(JSON.parse(localStorage.getItem(otherKey)!).completions).toHaveLength(1);
    view.rerender(<FaithQuest {...props} currentUserId="third" partnerId="fourth" />);
    expect(screen.getByText('0 of 30 missions')).toBeVisible();
  });

  it('keeps the game playable when browser storage rejects saves', () => {
    render(<FaithQuest {...props} />);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage disabled'); });
    begin(); pick(0); click('Confirm'); pick(0); click('Confirm'); finishPractice(); click('Back to the journey');
    expect(screen.getByRole('status')).toHaveTextContent('Browser storage is unavailable. Progress lasts for this visit.');
    expect(screen.getByText('1 of 30 missions')).toBeVisible();
  });

  it('preserves a private choice when the interface language changes mid-mission', () => {
    render(<FaithQuest {...props} />);
    begin(); pick(1);
    act(() => setCurrentLanguage('am'));
    expect(screen.getAllByRole('radio')[1]).toBeChecked();
    expect(screen.getByRole('button', { name: faithQuestUiMessages['Confirm'][0] })).toBeEnabled();
    act(() => setCurrentLanguage('om'));
    expect(screen.getAllByRole('radio')[1]).toBeChecked();
    expect(screen.getByRole('button', { name: faithQuestUiMessages['Confirm'][1] })).toBeEnabled();
    act(() => setCurrentLanguage('en'));
    click('Confirm');
    expect(screen.getByRole('heading', { name: 'What would Practice partner choose?' })).toBeVisible();
  });
});
