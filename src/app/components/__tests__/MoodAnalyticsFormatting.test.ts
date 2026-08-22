import { describe, expect, it } from 'vitest';
import { buildWhatsAppReportUrl, cleanReportFormatting } from '../MoodAnalytics';

describe('mood reflection formatting', () => {
  it('removes generated Markdown markers while preserving natural paragraphs', () => {
    const generated = '### This Week\n\n**You listened well.**\n\n1. Make time to pray together.';

    expect(cleanReportFormatting(generated)).toBe(
      'This Week\n\nYou listened well.\n\nMake time to pray together.',
    );
  });

  it('creates an encoded WhatsApp report with activity time and no Markdown', () => {
    const url = buildWhatsAppReportUrl('Weekly reflection', '**You grew together.**', 'Aug 1 – Aug 7', {
      week: { totalSeconds: 3600, byCategory: { reading: 1200, answering: 900, journaling: 600, praying: 300 } },
    });
    const sharedText = decodeURIComponent(url.split('text=')[1]);
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(sharedText).toContain('Intentional time this week: 60 min');
    expect(sharedText).toContain('You grew together.');
    expect(sharedText).not.toContain('**');
  });
});
