import { describe, expect, it } from 'vitest';
import { pickRandomHomeSpotlight } from '../CoupleDashboard';

describe('home spotlight selection', () => {
  it('can deterministically select each spotlight type', () => {
    expect(pickRandomHomeSpotlight(undefined, () => 0)).toBe('devotion');
    expect(pickRandomHomeSpotlight(undefined, () => 0.34)).toBe('question');
    expect(pickRandomHomeSpotlight(undefined, () => 0.99)).toBe('journal');
  });

  it('does not repeat the current type when the user shuffles', () => {
    expect(pickRandomHomeSpotlight('devotion', () => 0)).toBe('question');
    expect(pickRandomHomeSpotlight('question', () => 0.99)).toBe('journal');
    expect(pickRandomHomeSpotlight('journal', () => 0.99)).toBe('question');
  });
});
