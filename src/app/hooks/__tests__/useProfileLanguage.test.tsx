import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useProfileLanguage } from '../useProfileLanguage';
import { setCurrentLanguage, useCurrentLanguage } from '../../utils/languageStore';

type Profile = { id: string; language?: string } | null;
const renderPreference = (profile: Profile) => renderHook(({ profile }: { profile: Profile }) => {
  useProfileLanguage(profile);
  return useCurrentLanguage();
}, { initialProps: { profile } });

beforeEach(() => setCurrentLanguage('en'));
afterEach(() => { cleanup(); localStorage.clear(); });

describe('profile language hydration', () => {
  it('does not overwrite a newer local selection with a delayed profile response', () => {
    const view = renderPreference({ id: 'user', language: 'en' });
    act(() => setCurrentLanguage('am'));
    act(() => setCurrentLanguage('om'));

    // The first save finishes after the user has already selected Oromo.
    view.rerender({ profile: { id: 'user', language: 'am' } });
    expect(view.result.current).toBe('om');
    expect(localStorage.getItem('twobeone_language')).toBe('om');
  });

  it('marks the first profile as hydrated even when its preference is absent', () => {
    const view = renderPreference({ id: 'user' });
    act(() => setCurrentLanguage('om'));
    view.rerender({ profile: { id: 'user', language: 'am' } });
    expect(view.result.current).toBe('om');
  });

  it('hydrates the new account after sign-out and can hydrate the same account on a later sign-in', () => {
    const view = renderPreference({ id: 'first', language: 'am' });
    expect(view.result.current).toBe('am');
    view.rerender({ profile: null });
    view.rerender({ profile: { id: 'second', language: 'om' } });
    expect(view.result.current).toBe('om');

    act(() => setCurrentLanguage('en'));
    view.rerender({ profile: null });
    view.rerender({ profile: { id: 'second', language: 'om' } });
    expect(view.result.current).toBe('om');
  });

  it('keeps the device preference when the account has an unsupported language', () => {
    act(() => setCurrentLanguage('am'));
    const view = renderPreference({ id: 'user', language: 'unsupported' });
    expect(view.result.current).toBe('am');
    view.rerender({ profile: { id: 'user', language: 'en' } });
    expect(view.result.current).toBe('am');
  });
});
