import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { RelationshipCountdown, RelationshipGrowth, RelationshipSummary } from '../RelationshipJourney';

const DAY = 86_400_000;
const HOUR = 3_600_000;
const NOW = Date.parse('2026-09-13T12:00:00.000Z');
const ago = (duration: number) => new Date(NOW - duration).toISOString();
const future = (duration: number) => new Date(NOW + duration).toISOString();

describe('relationship journey dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows the live relationship duration and known distance together', () => {
    render(<LanguageProvider><RelationshipSummary startDate={ago(102 * DAY + 14 * HOUR + 7 * 60_000 + 21_000)} distanceKm={2387.2} /></LanguageProvider>);

    expect(document.querySelector('[data-relationship-counter]')).toHaveTextContent(/102\s*Days Together/);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('14:07:21')).toBeInTheDocument();
    expect(screen.getByText('2387 km apart')).toBeInTheDocument();
    expect(screen.getByText('Growing together in faith')).toBeInTheDocument();
  });

  it('rolls the counter into the next full day without requiring its parent to render', () => {
    render(<LanguageProvider><RelationshipSummary startDate={ago(90 * DAY - 1_000)} /></LanguageProvider>);
    expect(document.querySelector('[data-relationship-counter]')).toHaveTextContent(/89\s*Days Together/);
    expect(screen.getByText('23:59:59')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1_000));

    expect(document.querySelector('[data-relationship-counter]')).toHaveTextContent(/90\s*Days Together/);
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  it.each([undefined, null, NaN, -1])('omits the distance when it is unavailable or invalid (%s)', distanceKm => {
    render(<LanguageProvider><RelationshipSummary startDate={ago(DAY)} distanceKm={distanceKm} /></LanguageProvider>);
    expect(screen.queryByText(/km apart/)).not.toBeInTheDocument();
    expect(screen.queryByText('•')).not.toBeInTheDocument();
  });

  it('keeps a valid zero distance visible', () => {
    render(<LanguageProvider><RelationshipSummary distanceKm={0} /></LanguageProvider>);
    expect(screen.getByText('0.0 km apart')).toBeInTheDocument();
  });

  it('keeps nearby partners distinguishable from zero distance', () => {
    render(<LanguageProvider><RelationshipSummary distanceKm={0.4} /></LanguageProvider>);
    expect(screen.getByText('0.4 km apart')).toBeInTheDocument();
  });

  it('shows journey progress with five accessible stage icons and current-stage percentage', () => {
    render(<LanguageProvider><RelationshipGrowth startDate={ago(102 * DAY)} /></LanguageProvider>);

    expect(screen.getByRole('heading', { name: 'Growth Stage' })).toBeInTheDocument();
    const progress = screen.getByRole('progressbar', { name: 'Growth Stage' });
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '360');
    expect(progress).toHaveAttribute('aria-valuenow', '102');
    expect(progress).toHaveAttribute('aria-valuetext', '13% · 102 days together · 78 days left');
    expect(screen.getByText('13%')).toBeInTheDocument();
    expect(screen.getByText('78 days left')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    const stageIcons = [
      ['Seed', '🌱'],
      ['Growth', '🌿'],
      ['Unity', '💞'],
      ['Commitment', '🤝'],
      ['Covenant', '👑'],
    ];
    for (const [name, emoji] of stageIcons) {
      const icon = screen.getByRole('img', { name });
      expect(icon).toHaveTextContent(emoji);
      expect(icon).toBeVisible();
      expect(icon.closest('.sr-only')).toBeNull();
      expect(progress).not.toContainElement(icon);
    }
    expect(screen.getByRole('img', { name: 'Growth' }).closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('updates the growth stage after crossing a day boundary while mounted', () => {
    render(<LanguageProvider><RelationshipGrowth startDate={ago(90 * DAY - 1_000)} /></LanguageProvider>);
    expect(screen.getByRole('heading', { name: 'Seed Stage' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(60_000));

    expect(screen.getByRole('heading', { name: 'Growth Stage' })).toBeInTheDocument();
    expect(screen.getByText('90 days left')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '90');
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Growth' }).closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('shows a completed final stage without a fictitious next milestone', () => {
    render(<LanguageProvider><RelationshipGrowth startDate={ago(400 * DAY)} /></LanguageProvider>);
    expect(screen.getByRole('heading', { name: 'Covenant Stage' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '360');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '100% · 400 days together');
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Covenant' }).closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.queryByText(/days left/)).not.toBeInTheDocument();
  });

  it('selects the earliest future milestone and refreshes its countdown', () => {
    const milestones = [
      { id: 'later', title: 'Our trip', date: future(300 * DAY) },
      { id: 'past', title: 'Last visit', date: ago(DAY) },
      { id: 'invalid', title: 'Draft', date: 'not-a-date' },
      { id: 'next', title: 'Anniversary', date: future(262 * DAY + 9 * HOUR) },
    ];
    render(<LanguageProvider><RelationshipCountdown milestones={milestones} /></LanguageProvider>);

    expect(screen.getByRole('heading', { name: 'Anniversary' })).toBeInTheDocument();
    expect(screen.getByText('262d 09h')).toBeInTheDocument();
    expect(screen.queryByText('Our trip')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(HOUR));
    expect(screen.getByText('262d 08h')).toBeInTheDocument();
  });

  it('moves to the next milestone when one expires, then hides after the last one', () => {
    render(<LanguageProvider><RelationshipCountdown milestones={[
      { id: 'first', title: 'Visit', date: future(30_000) },
      { id: 'last', title: 'Anniversary', date: future(90_000) },
    ]} /></LanguageProvider>);
    expect(screen.getByRole('heading', { name: 'Visit' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByRole('heading', { name: 'Anniversary' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Visit' })).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('does not invent a countdown when no upcoming milestone is saved', () => {
    render(<LanguageProvider><RelationshipCountdown milestones={[]} /></LanguageProvider>);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
