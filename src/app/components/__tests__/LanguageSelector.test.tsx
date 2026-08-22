import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector } from '../LanguageSelector';

function CurrentLanguage() {
  const { language, t } = useLanguage();
  return <output>{language}:{t.common.welcome}</output>;
}

describe('LanguageSelector', () => {
  afterEach(() => localStorage.clear());

  it('switches the complete UI context to Afaan Oromo and persists the choice', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LanguageSelector />
        <CurrentLanguage />
      </LanguageProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Select language' }));
    await user.click(screen.getByRole('menuitem', { name: /Oromiffa/ }));

    expect(screen.getByText('om:Baga Nagaan Dhuftan')).toBeInTheDocument();
    expect(localStorage.getItem('twobeone_language')).toBe('om');
    expect(document.documentElement).toHaveAttribute('lang', 'om');
    expect(document.body).toHaveAttribute('data-language', 'om');
  });
});
