import { describe, expect, it } from 'vitest';
import { isAuthNetworkError } from '../AuthPage';

describe('AuthPage network error detection', () => {
  it.each([
    new TypeError('Failed to fetch'),
    { message: 'Network request failed' },
    { message: 'Load failed' },
    { message: 'Authentication request timed out' },
    { message: 'Cloudflare 521 origin down' },
    { message: 'Cloudflare 522 connection timed out' },
  ])('recognizes retryable authentication connectivity failures', error => {
    expect(isAuthNetworkError(error)).toBe(true);
  });

  it('does not classify invalid credentials as a network failure', () => {
    expect(isAuthNetworkError({ message: 'Invalid login credentials' })).toBe(false);
  });
});
