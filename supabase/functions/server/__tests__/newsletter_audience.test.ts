import { describe, expect, it } from 'vitest';
import { buildNewsletterAudience, type NewsletterSubscriber } from '../newsletter_audience';

const subscriber = (overrides: Partial<NewsletterSubscriber>): NewsletterSubscriber => ({
  email: 'subscriber@example.com',
  status: 'active',
  source: 'landing_page',
  ...overrides,
});

describe('buildNewsletterAudience', () => {
  it('combines newsletter subscribers and registered users without duplicates', () => {
    const result = buildNewsletterAudience(
      [subscriber({ email: 'shared@example.com' }), subscriber({ email: 'subscriber@example.com' })],
      [
        { id: 'user-1', email: 'shared@example.com' },
        { id: 'user-2', email: 'registered@example.com', createdAt: '2026-08-01T00:00:00.000Z' },
      ],
    );

    expect(result.recipients.map(item => item.email).sort()).toEqual([
      'registered@example.com',
      'shared@example.com',
      'subscriber@example.com',
    ]);
    expect(result.recordsToPersist).toMatchObject([
      { email: 'registered@example.com', status: 'active', source: 'registered_user', registeredUserId: 'user-2' },
    ]);
  });

  it('never includes an unsubscribed registered account', () => {
    const result = buildNewsletterAudience(
      [subscriber({ email: 'opted-out@example.com', status: 'unsubscribed', source: 'registered_user' })],
      [{ id: 'user-1', email: 'opted-out@example.com' }],
    );

    expect(result.recipients).toEqual([]);
    expect(result.recordsToPersist).toEqual([]);
  });

  it('drops account-only records after the registered account is deleted', () => {
    const result = buildNewsletterAudience(
      [subscriber({ email: 'deleted@example.com', source: 'registered_user' })],
      [],
    );

    expect(result.recipients).toEqual([]);
  });
});
