import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { setCurrentLanguage } from '../../utils/languageStore';
import { DashboardGrowthCard } from '../DashboardGrowthCard';

const DAY = 86_400_000;
const NOW = Date.parse('2026-09-14T12:00:00.000Z');
const ago = (duration: number) => new Date(NOW - duration).toISOString();

describe('dashboard growth milestones', () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentLanguage('en');
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('preserves the canonical stage names and selects Growth at 103 days', () => {
    render(<DashboardGrowthCard startDate={ago(103 * DAY)} />, { wrapper: LanguageProvider });
    const progress = screen.getByRole('progressbar', { name: 'Growth Stage' });
    const milestoneList = screen.getByRole('list', { name: 'Growth milestones' });
    const currentMilestone = () => within(milestoneList).getAllByRole('listitem').filter(item => item.getAttribute('aria-current') === 'step');

    expect(progress).toHaveAttribute('aria-valuenow', '14');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
    expect(progress).toHaveAttribute('aria-valuetext', '14% complete; 77 days left');
    expect(screen.getByText('77 days left')).toBeVisible();
    expect(currentMilestone()).toHaveLength(1);
    expect(currentMilestone()[0]).toHaveTextContent('Growth');
    expect(within(milestoneList).queryByText(/days/)).not.toBeInTheDocument();
    for (const name of ['Seed', 'Growth', 'Unity', 'Commitment', 'Covenant']) {
      expect(within(milestoneList).getByText(name)).toBeVisible();
    }
  });

  it.each([
    { boundary: 90, before: 'Seed', after: 'Growth', daysLeft: 90 },
    { boundary: 180, before: 'Growth', after: 'Unity', daysLeft: 70 },
  ])('advances from $before to $after at the existing $boundary-day boundary while mounted', ({ boundary, before, after, daysLeft }) => {
    render(<DashboardGrowthCard startDate={ago(boundary * DAY - 30_000)} />, { wrapper: LanguageProvider });
    const milestoneList = screen.getByRole('list', { name: 'Growth milestones' });
    const currentMilestone = () => within(milestoneList).getAllByRole('listitem').filter(item => item.getAttribute('aria-current') === 'step');
    expect(currentMilestone()[0]).toHaveTextContent(before);
    expect(screen.getByRole('progressbar', { name: `${before} Stage` })).toHaveAttribute('aria-valuenow', '98');

    act(() => vi.advanceTimersByTime(60_000));

    const progress = screen.getByRole('progressbar', { name: `${after} Stage` });
    expect(progress).toHaveAttribute('aria-valuenow', '0');
    expect(progress).toHaveAttribute('aria-valuetext', `0% complete; ${daysLeft} days left`);
    expect(currentMilestone()).toHaveLength(1);
    expect(currentMilestone()[0]).toHaveTextContent(after);
  });

  it('keeps the final milestone complete without inventing a remaining day count', () => {
    render(<DashboardGrowthCard startDate={ago(400 * DAY)} />, { wrapper: LanguageProvider });
    expect(screen.getByRole('progressbar', { name: 'Covenant Stage' })).toHaveAttribute('aria-valuetext', '100% complete');
    expect(screen.getByText('Covenant').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.queryByText(/\(360\+ days\)/)).not.toBeInTheDocument();
    expect(screen.queryByText(/days left/)).not.toBeInTheDocument();
  });
});
