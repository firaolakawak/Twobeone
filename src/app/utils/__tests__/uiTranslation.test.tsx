import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';
import { getCurrentLanguage, setCurrentLanguage } from '../languageStore';
import { translateUi, useUiCopy, type UiMessages } from '../uiTranslation';

const messages: UiMessages = { 'Hello {name}': ['ሰላም {name}', 'Akkam {name}'] };
function PublicCopy() {
  const tr = useUiCopy(messages);
  return <p data-testid="public">{tr('Hello {name}', { name: 'Keti' })}</p>;
}
function AppCopy() {
  const { language, setLanguage } = useLanguage();
  return <button onClick={() => setLanguage('om')}>{language}</button>;
}

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.localStorage.clear(); });

describe('shared UI language', () => {
  it('updates public copy and separate providers together without remounting', () => {
    render(<><PublicCopy /><LanguageProvider><AppCopy /></LanguageProvider><LanguageProvider><AppCopy /></LanguageProvider></>);
    expect(screen.getByTestId('public')).toHaveTextContent('Hello Keti');
    act(() => setCurrentLanguage('am'));
    expect(screen.getByTestId('public')).toHaveTextContent('ሰላም Keti');
    expect(screen.getAllByRole('button', { name: 'am' })).toHaveLength(2);
    expect(document.documentElement.lang).toBe('am');
    act(() => screen.getAllByRole('button')[0].click());
    expect(screen.getByTestId('public')).toHaveTextContent('Akkam Keti');
    expect(screen.getAllByRole('button', { name: 'om' })).toHaveLength(2);
    expect(window.localStorage.getItem('twobeone_language')).toBe('om');
  });

  it('refreshes mounted copy on cross-tab preference changes and clears', () => {
    render(<PublicCopy />);
    act(() => {
      window.localStorage.setItem('twobeone_language', 'am');
      window.dispatchEvent(new StorageEvent('storage', { key: 'twobeone_language', newValue: 'am' }));
    });
    expect(screen.getByTestId('public')).toHaveTextContent('ሰላም Keti');
    act(() => {
      window.localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });
    expect(screen.getByTestId('public')).toHaveTextContent('Hello Keti');
  });

  it('continues switching when persistent storage is unavailable', () => {
    render(<PublicCopy />);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
    act(() => setCurrentLanguage('om'));
    expect(screen.getByTestId('public')).toHaveTextContent('Akkam Keti');
  });

  it('rejects invalid persisted preferences and preserves unknown/authored copy', () => {
    window.localStorage.setItem('twobeone_language', 'invalid');
    expect(getCurrentLanguage()).toBe('en');
    expect(translateUi('om', messages, 'My own journal text')).toBe('My own journal text');
    for (const source of ['constructor', 'toString', '__proto__']) {
      expect(translateUi('am', {}, source)).toBe(source);
      expect(translateUi('om', undefined, source)).toBe(source);
    }
    expect(translateUi('am', messages, 'Hello {name}', { name: '$&' })).toBe('ሰላም $&');
    expect(translateUi('om', messages, 'Save')).not.toBe('Save');
    expect(translateUi('om', messages, '{constructor}', {})).toBe('{constructor}');
  });

  it('uses the current language for feedback from a pending operation', () => {
    let retainedCopy: ReturnType<typeof useUiCopy> | undefined;
    function PendingFeedback() {
      const tr = useUiCopy(messages);
      retainedCopy ??= tr;
      return null;
    }
    render(<PendingFeedback />);
    expect(retainedCopy?.('Hello {name}', { name: 'Keti' })).toBe('Hello Keti');
    act(() => setCurrentLanguage('om'));
    expect(retainedCopy?.('Hello {name}', { name: 'Keti' })).toBe('Akkam Keti');
  });
});
