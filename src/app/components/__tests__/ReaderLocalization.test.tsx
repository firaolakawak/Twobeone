import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComprehensiveBibleReader } from '../ComprehensiveBibleReader';
import { ScriptureMemory } from '../ScriptureMemory';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { setCurrentLanguage } from '../../utils/languageStore';
import { fetchBibleChapter } from '../../utils/bibleApi';
import { fetchAmharicChapter } from '../../utils/amharicBibleApi';

vi.mock('../../data/bible-chapters', () => ({ bibleChapters: [] }));
vi.mock('../../utils/bibleApi', () => ({ fetchBibleChapter: vi.fn(), prefetchChapters: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../utils/amharicBibleApi', () => ({
  fetchAmharicChapter: vi.fn(), isBibleLoaded: () => true,
  getAmharicBookName: (book: string) => book === 'Romans' ? 'ሮሜ' : book === 'Genesis' ? 'ዘፍጥረት' : book,
}));

const switchLanguage = (language: 'en' | 'am' | 'om') => act(() => setCurrentLanguage(language));
const englishChapter = { book: 'Romans', chapter: 8, verses: [{ number: 1, text: 'Original English Scripture' }] };
const amharicChapter = { bookNumber: 45, bookName: 'ሮሜ', chapter: 8, verses: [{ number: 1, text: 'የአማርኛ መጽሐፍ ቅዱስ ጽሑፍ' }] };

describe('reader language switching', () => {
  beforeEach(() => {
    setCurrentLanguage('en');
    vi.mocked(fetchBibleChapter).mockResolvedValue(englishChapter);
    vi.mocked(fetchAmharicChapter).mockResolvedValue(amharicChapter);
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    setCurrentLanguage('en');
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('switches a mounted reader EN→AM→OM and explicitly discloses the English fallback', async () => {
    render(<ComprehensiveBibleReader isOpen onClose={vi.fn()} partnerName="Keti" />);
    const dialog = screen.getByRole('dialog');
    expect(await screen.findByText('Original English Scripture')).toHaveAttribute('lang', 'en');
    expect(fetchAmharicChapter).not.toHaveBeenCalled();
    switchLanguage('am');
    expect(await screen.findByText('የአማርኛ መጽሐፍ ቅዱስ ጽሑፍ')).toHaveAttribute('lang', 'am');
    fireEvent.click(screen.getByRole('button', { name: 'ሮሜ' }));
    fireEvent.change(screen.getByPlaceholderText('መጻሕፍትን ይፈልጉ...'), { target: { value: 'ዘፍጥረት' } });
    expect(screen.getByRole('button', { name: 'ዘፍጥረት' })).toBeInTheDocument();
    switchLanguage('om');
    expect(await screen.findByText('Original English Scripture')).toBeInTheDocument();
    expect(screen.getByText(/Caaffanni Qulqullaaʼaan Afaan Oromoo appii kana keessatti ammaaf hin jiru/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Boqonnaa itti aanu' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(fetchAmharicChapter).toHaveBeenCalledTimes(1);
  });

  it('ignores a late Amharic response after switching to Oromo', async () => {
    let resolveAmharic!: (chapter: typeof amharicChapter) => void;
    vi.mocked(fetchAmharicChapter).mockImplementationOnce(() => new Promise(resolve => { resolveAmharic = resolve; }));
    render(<ComprehensiveBibleReader isOpen onClose={vi.fn()} />);
    await screen.findByText('Original English Scripture');
    switchLanguage('am');
    expect(screen.getByRole('status')).toHaveTextContent('ምዕራፉ እየተጫነ ነው…');
    switchLanguage('om');
    await screen.findByText('Original English Scripture');
    await act(async () => resolveAmharic(amharicChapter));
    expect(screen.queryByText('የአማርኛ መጽሐፍ ቅዱስ ጽሑፍ')).not.toBeInTheDocument();
    expect(screen.getByText('Original English Scripture')).toHaveAttribute('lang', 'en');
  });

  it('renders localized load errors separately from verses and retries the requested chapter', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fetchBibleChapter).mockResolvedValueOnce({ book: 'Romans', chapter: 8, verses: [{ number: 1, text: 'Unable to load this chapter. Please check your internet connection and try again.' }] });
    setCurrentLanguage('om');
    render(<ComprehensiveBibleReader isOpen onClose={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Boqonnaa kana feʼuun hin dandaʼamne.');
    expect(screen.queryByText('Original English Scripture')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deebisii yaali' }));
    await screen.findByText('Original English Scripture');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchBibleChapter).toHaveBeenLastCalledWith('Romans', 8);
  });

  it('preserves memory selection and Scripture text while translating category filters and practice controls', async () => {
    const view = render(<ScriptureMemory onBack={vi.fn()} />, { wrapper: LanguageProvider });
    const root = view.container.firstElementChild;
    const category = screen.getByRole('combobox', { name: 'Filter by category' });
    fireEvent.change(category, { target: { value: 'love' } });
    expect(within(category).getByRole('option', { name: 'Love' })).toHaveValue('love');
    switchLanguage('am');
    expect(screen.getByRole('combobox', { name: 'በምድብ ያጣሩ' })).toHaveValue('love');
    switchLanguage('om');
    expect(within(screen.getByRole('combobox', { name: 'Ramaddiin calali' })).getByRole('option', { name: 'Jaalala' })).toHaveValue('love');
    fireEvent.click(screen.getByText('Love never ends.'));
    expect(screen.getByText('Love never ends.')).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('button', { name: 'Qormaata jalqabi' })).toBeInTheDocument();
    expect(screen.getByText(/Lakkoofsonni yaadachuuf qophaaʼan amma Afaan Ingiliziitiin jiru/)).toBeInTheDocument();
    expect(view.container.firstElementChild).toBe(root);
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });
});
