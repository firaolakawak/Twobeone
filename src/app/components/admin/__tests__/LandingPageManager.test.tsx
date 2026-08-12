import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LandingPageManager } from '../LandingPageManager';

const content = { hero: { badge: 'Faith meets love', title: 'Grow Together', subtitle: 'Every Day', description: 'A stronger relationship rooted in Scripture.', scripture: { text: 'Two shall become one.', reference: 'Genesis 2:24' }, socialProof: { couplesCount: '2,000+', rating: 5 } }, screenshot: { greeting: '', coupleNames: '', streakDays: '', devotional: { badge: '', title: '', verse: '' }, stats: { devotionals: '', prayers: '', questions: '' }, prayerRequest: { title: '', text: '' } }, features: [{ title: 'Daily Devotionals', description: 'Grow in Scripture.', icon: 'BookOpen', color: 'from-primary-500 to-primary-600' }], whySection: { badge: 'Why', title: 'Built for two', description: 'Faith first.', reasons: [] }, stats: [{ label: 'Couples', value: '2k+', gradient: '' }], testimonials: [], faqs: [], cta: { title: 'Begin together', description: 'Start today.', newsletterLabel: 'Updates', buttonText: 'Get started', footer: 'Free forever' } };

describe('LandingPageManager publishing studio', () => {
  afterEach(() => vi.restoreAllMocks());
  it('renders database content in the editor and live preview', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => ({ ok: true, json: async () => String(input).includes('/landing/content') ? { content } : String(input).includes('/landing/stats') ? { subscribersCount: 4 } : { subscribers: [] } }) as Response);
    render(<LandingPageManager accessToken="admin-token" />);
    expect(await screen.findAllByText('Grow Together')).toHaveLength(1);
    expect(screen.getByDisplayValue('Grow Together')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Live landing page preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save landing page changes' })).toBeDisabled();
    expect(screen.getAllByText('4')).toHaveLength(2);
  });
});
