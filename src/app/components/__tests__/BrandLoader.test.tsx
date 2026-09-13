import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BrandLoader, LoadingMark } from '../BrandLoader';
import { setCurrentLanguage } from '../../utils/languageStore';

afterEach(() => { cleanup(); localStorage.clear(); });

describe('branded waiting states', () => {
  it('announces the waiting message in the current language without remounting', () => {
    setCurrentLanguage('en');
    const { container } = render(<BrandLoader />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
    act(() => setCurrentLanguage('am'));
    expect(screen.getByRole('status')).toHaveTextContent('በመጫን ላይ...');
    act(() => setCurrentLanguage('om'));
    expect(screen.getByRole('status')).toHaveTextContent('Fe’amaa jira...');
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(container.querySelector('img')?.getAttribute('src')).toContain('twobeone-header-logo');
  });

  it('keeps the inline animation decorative so the control label is announced once', () => {
    render(<button disabled><LoadingMark />Saving...</button>);
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
