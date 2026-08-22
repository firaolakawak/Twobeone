import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { OnboardingScreen } from '../OnboardingScreen';

describe('OnboardingScreen', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/?app=1');
  });

  afterEach(cleanup);

  it('lets a first-time app user skip directly to account creation', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(
      <LanguageProvider>
        <OnboardingScreen onComplete={onComplete} />
      </LanguageProvider>,
    );

    expect(screen.getByText('Grow together in faith and love')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onComplete).toHaveBeenCalledWith('signup');
  });

  it('saves a language choice and allows existing users to sign in', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(
      <LanguageProvider>
        <OnboardingScreen onComplete={onComplete} />
      </LanguageProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Made for both of you');

    await user.click(screen.getByRole('radio', { name: /አማርኛ/ }));
    expect(window.localStorage.getItem('twobeone_language')).toBe('am');

    await user.click(screen.getByRole('button', { name: 'መለያ አለኝ' }));
    expect(onComplete).toHaveBeenCalledWith('signin');
  });
});
