import { describe, expect, it } from 'vitest';
import { hasAnswers } from '../AIAssistant';

describe('AI Assistant answer detection', () => {
  it('recognizes the answer map used by discussion questions', () => {
    expect(hasAnswers({ prompt_1: 'We value honest communication' })).toBe(true);
    expect(hasAnswers({ prompt_1: ['Prayer', 'Quality time'] })).toBe(true);
    expect(hasAnswers({ prompt_1: { response: 'Weekly check-ins' } })).toBe(true);
  });

  it('does not count empty answer maps as completed discussions', () => {
    expect(hasAnswers()).toBe(false);
    expect(hasAnswers({})).toBe(false);
    expect(hasAnswers({ prompt_1: '', prompt_2: [] })).toBe(false);
  });
});
