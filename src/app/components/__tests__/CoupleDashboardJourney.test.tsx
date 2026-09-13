import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { useDailyMoods } from '../../hooks/useDailyMoods';
import { milestones } from '../../utils/api';
import type { DailyMoodEntry } from '../../utils/dailyMood';
import { CoupleDashboard } from '../CoupleDashboard';

vi.mock('../../hooks/useDailyMoods', () => ({ useDailyMoods: vi.fn() }));
vi.mock('../../utils/api', () => ({
  questions: {
    count: vi.fn().mockResolvedValue({ count: 100 }),
    list: vi.fn().mockResolvedValue({ questions: [] }),
  },
  milestones: { list: vi.fn() },
  moods: { generateWeeklyReport: vi.fn().mockResolvedValue(undefined) },
}));
vi.mock('../../utils/amharicBibleApi', () => ({
  fetchAmharicChapter: vi.fn().mockResolvedValue({ verses: [] }),
  getAmharicBookName: (name: string) => name,
}));
vi.mock('../../utils/notifications', () => ({ sendNotification: vi.fn() }));
vi.mock('../ComprehensiveBibleReader', () => ({ ComprehensiveBibleReader: () => null }));
vi.mock('../LearningModulesCard', () => ({ LearningModulesCard: () => null }));
vi.mock('../ChampionsCard', () => ({ ChampionsCard: () => null }));
vi.mock('../PushNotificationSetup', () => ({ PushNotificationSetup: () => null }));

const now = new Date(2026, 8, 14, 12);
const dayMs = 24 * 60 * 60 * 1000;
const relationshipStart = new Date(now.getTime() - 102 * dayMs).toISOString();
const nextMilestoneTitle = 'Reunion in Addis Ababa';

function createUser(id: string, name: string) {
  return {
    id, name, email: `${id}@example.com`, full_name: name,
    avatar_url: null, bio: null, phone: null, location: null,
    relationship_start: relationshipStart, relationshipStart,
    partner_id: id === 'firaol' ? 'keti' : 'firaol', invite_code_ref: null,
    created_at: relationshipStart, createdAt: relationshipStart, updated_at: null,
  };
}

async function renderDashboard(onScreenNavigate?: (screen: string) => void) {
  const view = render(
    <CoupleDashboard
      profile={createUser('firaol', 'Firaol Akawak')}
      partner={createUser('keti', 'Keti Abira')}
      accessToken="signed-in-token"
      userOnline
      partnerOnline
      journalEntries={[]}
      prayers={[]}
      responses={{ user: [], partner: [] }}
      onScreenNavigate={onScreenNavigate}
    />,
    { wrapper: LanguageProvider },
  );
  await act(async () => Promise.resolve());
  await act(async () => vi.advanceTimersByTimeAsync(1100));
  return within(view.container.querySelector<HTMLElement>('[data-couple-journey]')!);
}

describe('couple dashboard journey', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(useDailyMoods).mockReturnValue({
      userMood: { userId: 'firaol', mood: 'great', createdAt: now.toISOString() },
      partnerMood: { userId: 'keti', mood: 'good', createdAt: now.toISOString() },
      loaded: true,
      saveMood: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(milestones.list).mockResolvedValue({ milestones: [
      { id: 'past', title: 'Our first date', date: relationshipStart },
      { id: 'future', title: nextMilestoneTitle, date: new Date(now.getTime() + 10 * dayMs + 8 * 60 * 60 * 1000).toISOString() },
    ] });
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/couple-locations')) {
        return {
          ok: true,
          json: async () => ({
            userLocation: { userId: 'firaol', locationType: 'manual', location: { latitude: 24.4539, longitude: 54.3773, city: 'Abu Dhabi', country: 'United Arab Emirates' } },
            partnerLocation: { userId: 'keti', locationType: 'manual', location: { latitude: 9.03, longitude: 38.74, city: 'Addis Ababa', country: 'Ethiopia' } },
          }),
        } as Response;
      }
      if (url.startsWith('https://bible-api.com/')) {
        return { ok: true, json: async () => ({ text: 'Love is patient.', reference: '1 Corinthians 13:4', translation_name: 'KJV', verses: [] }) } as Response;
      }
      throw new Error(`Unexpected dashboard request: ${url}`);
    }));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows paired first names and the partner mood above the journey without hero mood controls', async () => {
    const onScreenNavigate = vi.fn();
    const journey = await renderDashboard(onScreenNavigate);

    const heading = journey.getByRole('heading', { name: /^Firaol & Keti/, level: 2 });
    expect(heading).toBeVisible();
    expect(journey.queryByText(/your shared journey/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading')[0]).toBe(heading);
    expect(journey.queryByText('Firaol Akawak', { exact: true })).not.toBeInTheDocument();
    expect(journey.queryByText('Keti Abira', { exact: true })).not.toBeInTheDocument();
    expect(document.querySelector('[data-relationship-counter]')).toHaveTextContent(/102\s*Days Together/);
    expect(journey.getByText(/km apart$/)).toBeVisible();
    expect(journey.getByText('Growing together in faith')).toBeVisible();
    expect(journey.queryByText('Abu Dhabi')).not.toBeInTheDocument();
    expect(journey.queryByText('Addis Ababa')).not.toBeInTheDocument();
    expect(journey.queryByText('(UAE)')).not.toBeInTheDocument();
    expect(journey.queryByText('(ETH)')).not.toBeInTheDocument();
    expect(journey.getByRole('img', { name: 'Firaol Akawak: online' })).toHaveAttribute('data-online', 'true');
    expect(journey.getByRole('img', { name: 'Keti Abira: online' })).toHaveAttribute('data-online', 'true');

    const partnerMood = journey.getByRole('img', { name: 'Keti Abira: Good · Today' });
    expect(partnerMood).toHaveTextContent('😊');
    expect(heading).toContainElement(partnerMood);
    expect(heading).toHaveTextContent(/^Firaol & Keti\s*😊$/);
    expect(journey.getByRole('region', { name: 'Growth Stage' })).toBeVisible();
    expect(journey.queryByText(nextMilestoneTitle)).not.toBeInTheDocument();
    expect(journey.queryByRole('region', { name: nextMilestoneTitle })).not.toBeInTheDocument();
    expect(journey.queryByText(/\d+d \d+h/)).not.toBeInTheDocument();
    expect(journey.queryByText('Anniversary', { exact: false })).not.toBeInTheDocument();

    expect(journey.queryByRole('button', { name: 'Mood Analytics' })).not.toBeInTheDocument();
    expect(journey.queryByRole('button', { name: "Today's Mood" })).not.toBeInTheDocument();
    expect(onScreenNavigate).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each([
    ['unset', null],
    ['yesterday', { userId: 'keti', mood: 'sad', createdAt: new Date(now.getTime() - dayMs).toISOString() }],
  ] as [string, DailyMoodEntry | null][])('does not show a partner emoji for %s mood data', async (_name, partnerMood) => {
    vi.mocked(useDailyMoods).mockReturnValue({
      userMood: { userId: 'firaol', mood: 'great', createdAt: now.toISOString() },
      partnerMood,
      loaded: true,
      saveMood: vi.fn().mockResolvedValue(undefined),
    });
    const journey = await renderDashboard();

    expect(journey.getByRole('heading', { name: 'Firaol & Keti', level: 2 })).toBeVisible();
    expect(journey.queryByRole('img', { name: /^Keti Abira:.*Today$/ })).not.toBeInTheDocument();
    expect(journey.queryByRole('button', { name: "Today's Mood" })).not.toBeInTheDocument();
  });

  it('automatically opens and saves the daily mood when unset even without hero controls', async () => {
    const saveMood = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useDailyMoods).mockReturnValue({
      userMood: null,
      partnerMood: { userId: 'keti', mood: 'good', createdAt: now.toISOString() },
      loaded: true,
      saveMood,
    });
    const journey = await renderDashboard();

    expect(journey.queryByRole('button', { name: "Today's Mood" })).not.toBeInTheDocument();
    expect(journey.queryByRole('button', { name: 'Mood Analytics' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'How are you feeling today?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Mood' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Good' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Mood' }));
    await act(async () => Promise.resolve());

    expect(saveMood).toHaveBeenCalledExactlyOnceWith('good');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(journey.getByRole('heading', { name: /^Firaol & Keti/, level: 2 })).toBeVisible();
    expect(localStorage.getItem('twobeone:mood-check-in:last-shown:firaol')).not.toBeNull();
  });
});
