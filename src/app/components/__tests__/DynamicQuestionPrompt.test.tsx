import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamicQuestionPrompt } from '../DynamicQuestionPrompt';

describe('DynamicQuestionPrompt', () => {
  it('exposes single-choice answers as an accessible radio group', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DynamicQuestionPrompt
        prompt={{ id: 'pace', text: 'What pace feels right?', type: 'multiple_choice', options: ['Slow', 'Steady'] }}
        value={null}
        onChange={onChange}
      />,
    );

    const option = screen.getByRole('radio', { name: 'Steady' });
    expect(option).toHaveAttribute('aria-checked', 'false');
    await user.click(option);
    expect(onChange).toHaveBeenCalledWith('Steady');
  });

  it('keeps disabled answer tiles non-interactive', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DynamicQuestionPrompt
        prompt={{ id: 'confirm', text: 'Do you agree?', type: 'yes_no' }}
        value={null}
        onChange={onChange}
        disabled
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Yes' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
