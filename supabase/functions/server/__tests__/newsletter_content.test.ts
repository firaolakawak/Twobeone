import { describe, expect, it } from 'vitest';
import { generateWeeklyNewsletter, newsletterWeekKey, renderWeeklyNewsletter } from '../newsletter_content';

describe('weekly newsletter content', () => {
  it('selects a stable edition for an ISO week', () => {
    const date = new Date('2026-08-22T06:00:00.000Z');
    expect(newsletterWeekKey(date)).toBe('2026-W34');
    const first = generateWeeklyNewsletter(date);
    const second = generateWeeklyNewsletter(new Date('2026-08-23T23:59:00.000Z'));
    expect(first).toEqual(second);
    expect(first.subject).toContain('Saturday encouragement');
  });

  it('renders accessible HTML and plain text with unsubscribe links', () => {
    const edition = generateWeeklyNewsletter(new Date('2026-08-22T06:00:00.000Z'));
    const unsubscribeUrl = 'https://www.twobeone.app/newsletter/unsubscribe?token=safe-token';
    const rendered = renderWeeklyNewsletter(edition, unsubscribeUrl);
    expect(rendered.html).toContain('<!doctype html>');
    expect(rendered.html).toContain('Unsubscribe');
    expect(rendered.html).toContain(unsubscribeUrl.replace('&', '&amp;'));
    expect(rendered.text).toContain(`Unsubscribe: ${unsubscribeUrl}`);
    expect(rendered.text).toContain(edition.scriptureReference);
  });

  it('escapes generated content before inserting it into HTML', () => {
    const edition = { ...generateWeeklyNewsletter(), title: '<script>alert("x")</script>' };
    const rendered = renderWeeklyNewsletter(edition, 'https://www.twobeone.app/newsletter/unsubscribe?token=test');
    expect(rendered.html).not.toContain('<script>alert');
    expect(rendered.html).toContain('&lt;script&gt;');
  });
});
