import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import type { DailyMoodEntry } from '../../utils/dailyMood';
import { CoupleMoodHeading } from '../CoupleMoodHeading';

const today = new Date(2026, 8, 14, 12);

describe('CoupleMoodHeading', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(today);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each([
    { userName: 'Firaol', partnerName: 'Keti', partnerId: 'keti', mood: 'good' as const, emoji: '😊', label: 'Good' },
    { userName: 'Keti', partnerName: 'Firaol', partnerId: 'firaol', mood: 'sad' as const, emoji: '😔', label: 'Sad' },
  ])('shows $partnerName’s current mood beside $userName & $partnerName', ({ userName, partnerName, partnerId, mood, emoji, label }) => {
    render(
      <CoupleMoodHeading
        userName={userName}
        partnerName={partnerName}
        partnerId={partnerId}
        partnerMood={{ userId: partnerId, mood, createdAt: today.toISOString() }}
      />,
      { wrapper: LanguageProvider },
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(`${userName} & ${partnerName}`);
    expect(screen.getByRole('img', { name: `${partnerName}: ${label} · Today` })).toHaveTextContent(emoji);
  });

  it.each([
    ['unset', null],
    ['yesterday', { userId: 'keti', mood: 'good', createdAt: new Date(2026, 8, 13, 23, 59).toISOString() }],
    ['another user’s', { userId: 'firaol', mood: 'sad', createdAt: today.toISOString() }],
  ] as [string, DailyMoodEntry | null][])('hides an emoji for %s mood data', (_name, partnerMood) => {
    render(
      <CoupleMoodHeading userName="Firaol" partnerName="Keti" partnerId="keti" partnerMood={partnerMood} />,
      { wrapper: LanguageProvider },
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Firaol & Keti');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
