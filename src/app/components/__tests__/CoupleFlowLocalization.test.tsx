import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { setCurrentLanguage } from '../../utils/languageStore';
import { DynamicQuestionPrompt } from '../DynamicQuestionPrompt';
import { PrayerBoard } from '../PrayerBoard';
import { QADiscussionHub } from '../QADiscussionHub';
import { DailyDevotionsFeed } from '../DailyDevotionsFeed';
import { PartnerDisconnectDialog } from '../PartnerDisconnectDialog';
import { api } from '../../utils/api';

vi.mock('../../utils/supabase/client', () => ({
  createClient: () => ({ auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } }),
}));
vi.mock('../AIAssistant', () => ({ AIAssistant: () => null }));

const switchLanguage = (language: 'en' | 'am' | 'om') => act(() => setCurrentLanguage(language));
const json = (data: unknown) => ({ ok: true, status: 200, json: async () => data }) as Response;

describe('couple flow language switching', () => {
  beforeEach(() => {
    setCurrentLanguage('en');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  });
  afterEach(() => {
    cleanup();
    setCurrentLanguage('en');
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('updates choice labels on the mounted prompt without changing saved answer identifiers', () => {
    const onChange = vi.fn();
    render(<DynamicQuestionPrompt prompt={{ id: 'choice', text: 'Authored question stays unchanged', type: 'yes_no' }} value="yes" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Yes' })).toHaveAttribute('aria-checked', 'true');
    switchLanguage('am');
    fireEvent.click(screen.getByRole('radio', { name: 'አዎ' }));
    switchLanguage('om');
    fireEvent.click(screen.getByRole('radio', { name: 'Eeyyee' }));
    expect(onChange.mock.calls).toEqual([['yes'], ['yes']]);
    expect(screen.getByText('Authored question stays unchanged')).toBeInTheDocument();
  });

  it('translates prayer category display and search while preserving the prayer text', () => {
    render(<PrayerBoard prayers={[{
      id: 'prayer', userId: 'user', title: 'Our authored prayer', description: 'A personal request',
      category: 'Family', isAnswered: false, isSharedWithCommunity: false, prayerCount: 0,
      createdAt: '2026-09-13', updatedAt: '2026-09-13',
    }]} onAddPrayer={vi.fn()} onUpdatePrayer={vi.fn()} onDeletePrayer={vi.fn()} onMarkPrayed={vi.fn()} />, { wrapper: LanguageProvider });
    expect(screen.getByText('Family')).toBeInTheDocument();
    switchLanguage('am');
    expect(screen.getByText('ቤተሰብ')).toBeInTheDocument();
    switchLanguage('om');
    expect(screen.getByText('Maatii')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Kadhannaawwan barbaadi' }), { target: { value: 'Maatii' } });
    expect(screen.getByText('Our authored prayer')).toBeInTheDocument();
  });

  it('reloads Q&A in the active language and ignores an older language response', async () => {
    let resolveEnglish!: (response: Response) => void;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/question-responses')) return json({ userResponses: [], partnerResponses: [] });
      if (url.includes('/questions?')) {
        const language = new URL(url).searchParams.get('language');
        if (language === 'en') return new Promise<Response>(resolve => { resolveEnglish = resolve; });
        return json({ questions: [{ id: `q-${language}`, category: 'daily-life', title: `Authored ${language}`, prompts: [{ id: 'p', text: `Prompt ${language}`, type: 'yes_no' }] }] });
      }
      return json({});
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<QADiscussionHub onSaveAnswer={vi.fn()} onPrayTogether={vi.fn()} userName="Firaol" partnerName="Keti" />, { wrapper: LanguageProvider });
    await waitFor(() => expect(resolveEnglish).toBeTypeOf('function'));
    switchLanguage('am');
    expect(await screen.findByText('Prompt am')).toBeInTheDocument();
    await act(async () => resolveEnglish(json({ questions: [{ id: 'old', category: 'daily-life', title: 'Old English', prompts: [] }] })));
    expect(screen.queryByText('Old English')).not.toBeInTheDocument();
    switchLanguage('om');
    expect(await screen.findByText('Prompt om')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Eeyyee' })).toBeInTheDocument();
    expect(screen.queryByText('Prompt am')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/questions?'))).toHaveLength(3);
  });

  it('switches devotional content and labels without remounting the feed', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/devotions')) return json({ devotions: ['en', 'am', 'om'].map(language => ({ id: language, language, title: `Authored ${language}`, verse: `Verse ${language}`, reference: 'Reference' })) });
      return json({ completions: [], highlights: [], devotions: [] });
    }));
    const view = render(<DailyDevotionsFeed onDevotionalClick={vi.fn()} accessToken="fixture" projectId="fixture" />, { wrapper: LanguageProvider });
    expect(await screen.findByRole('button', { name: 'Read Authored en' })).toBeInTheDocument();
    const feed = view.container.firstElementChild;
    switchLanguage('am');
    expect(screen.getByRole('button', { name: 'Authored am ያንብቡ' })).toBeInTheDocument();
    switchLanguage('om');
    expect(screen.getByRole('button', { name: 'Authored om dubbisi' })).toBeInTheDocument();
    expect(view.container.firstElementChild).toBe(feed);
    expect(within(view.container).queryByText('Authored en')).not.toBeInTheDocument();
  });

  it('updates an open disconnect request and handles dates that are not set yet', async () => {
    vi.spyOn(api.partner, 'getDisconnectStatus').mockResolvedValue({
      hasRequest: true, status: 'pending', userRequested: true, requestedAt: '2026-09-13',
    });
    render(<PartnerDisconnectDialog open onOpenChange={vi.fn()} partner={{ id: 'partner', name: 'Keti' }} />, { wrapper: LanguageProvider });
    expect(await screen.findByText('Waiting for Keti to respond')).toBeInTheDocument();
    switchLanguage('am');
    expect(screen.getByText('Keti እስኪመልሱ በመጠበቅ ላይ')).toBeInTheDocument();
    switchLanguage('om');
    expect(screen.getByText('Keti akka deebisu eegaa jira')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date|undefined days/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Lamaan erga walii galtanii booda jalqaba')).toHaveLength(2);
  });
});
