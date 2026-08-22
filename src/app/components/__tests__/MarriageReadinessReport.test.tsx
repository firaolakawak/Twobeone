import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MarriageReadinessReport } from '../MarriageReadinessReport';

vi.mock('../../utils/api', () => ({
  marriageReadiness: {
    get: vi.fn().mockResolvedValue({
      result: {
        score: 72,
        eligible: false,
        categories: {
          devotional: { score: 70, streak: 3, completions: 12 },
          prayer: { score: 80, total: 8, answered: 3 },
          qa: { score: 65, shared: 10, totalUser: 12, totalPartner: 11 },
          modules: { score: 75, completed: 6, total: 8 },
          activity: { score: 70, entries: 20 },
        },
        couple: { userName: 'Partner One', partnerName: 'Partner Two' },
        report: null,
        generatedAt: '2026-08-15T00:00:00.000Z',
      },
    }),
  },
}));

describe('MarriageReadinessReport printing', () => {
  it('isolates the report and configures an A4 print document', async () => {
    const { container } = render(<MarriageReadinessReport onBack={vi.fn()} />);

    expect(await screen.findAllByText('Partner One & Partner Two')).toHaveLength(2);
    expect(container.querySelector('.marriage-report-print-root')).toBeInTheDocument();

    const printStyles = Array.from(container.querySelectorAll('style'))
      .map((style) => style.textContent)
      .join('\n');
    expect(printStyles).toContain('size: A4 portrait');
    expect(printStyles).toContain('body *');
    expect(printStyles).toContain('visibility: hidden !important');
    expect(printStyles).toContain('break-inside: avoid');
  });
});
