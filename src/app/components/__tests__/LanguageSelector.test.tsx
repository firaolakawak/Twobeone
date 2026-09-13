import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector } from '../LanguageSelector';

function CurrentLanguage() {
  const { language, t } = useLanguage();
  return <output>{language}:{t.common.welcome}</output>;
}

describe('LanguageSelector', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('switches the complete UI context to Afaan Oromo and persists the choice', async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LanguageSelector />
        <CurrentLanguage />
      </LanguageProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Select language' }));
    await user.click(screen.getByRole('menuitem', { name: /Afaan Oromo/ }));

    expect(screen.getByText('om:Baga Nagaan Dhuftan')).toBeInTheDocument();
    expect(localStorage.getItem('twobeone_language')).toBe('om');
    expect(document.documentElement).toHaveAttribute('lang', 'om');
    expect(document.body).toHaveAttribute('data-language', 'om');
  });

  it('synchronizes separate provider boundaries when the language changes', () => {
    render(
      <>
        <LanguageProvider><CurrentLanguage /></LanguageProvider>
        <LanguageProvider><CurrentLanguage /></LanguageProvider>
      </>,
    );

    act(() => {
      window.dispatchEvent(new CustomEvent('twobeone:language-change', { detail: 'am' }));
    });

    expect(screen.getAllByText(/^am:/)).toHaveLength(2);
  });

  it('works on a public entry point without a provider and saves the selected language code', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);
    render(<LanguageSelector accessToken="fixture-token" userId="fixture-user" />);
    await userEvent.click(screen.getByRole('button', { name: 'Select language' }));
    await userEvent.click(screen.getByRole('menuitem', { name: /Afaan Oromo/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/profile$/), expect.objectContaining({
      method: 'POST', body: JSON.stringify({ language: 'om' }),
    })));
    expect(document.documentElement.lang).toBe('om');
  });
});
