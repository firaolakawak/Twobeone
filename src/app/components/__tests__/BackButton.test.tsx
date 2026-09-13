import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BackButton } from '../BackButton';

afterEach(cleanup);

describe('BackButton', () => {
  it('announces its destination and returns by keyboard without submitting a form', async () => {
    const onBack = vi.fn();
    const onSubmit = vi.fn(event => event.preventDefault());
    const user = userEvent.setup();
    render(<form onSubmit={onSubmit}><BackButton label="Back to devotionals" onClick={onBack} /></form>);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Back to devotionals' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onBack).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps a disabled return action inactive', async () => {
    const onBack = vi.fn();
    render(<BackButton label="Back" onClick={onBack} disabled />);
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).not.toHaveBeenCalled();
  });

  it('shows the supplied translated label for a contextual return', () => {
    render(<BackButton label="ተመለስ" showLabel />);
    expect(screen.getByRole('button', { name: 'ተመለስ' })).toHaveTextContent('ተመለስ');
  });
});
