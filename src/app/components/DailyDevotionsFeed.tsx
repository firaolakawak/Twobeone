import { formatUiDate } from '../utils/uiDateTime';
import { useUiCopy, UI_LOCALES } from '../utils/uiTranslation';
import { BrandLoader } from './BrandLoader';
import { coupleUiMessages } from '../locales/coupleUi';
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BookOpen, Play, Headphones, Bookmark, CheckCircle2, Trash2, Pause, ArrowRight, Clock3, Heart, Search, X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface Devotional {
  id: string;
  title: string;
  verse: string;
  reference: string;
  category?: string;
  duration?: string;
  isCompleted?: boolean;
  reflection?: string;
  audioUrl?: string;
  audioFileName?: string;
  date?: string;
  prayerPrompt?: string;
  language?: string; // Add language field
}

interface Highlight {
  id: string;
  userId: string;
  reference: string;
  verseNumber: number;
  text: string;
  color: string;
  note?: string;
  sharedBy?: string;
  sharedById?: string;
  createdAt: string;
}

interface DailyDevotionsFeedProps {
  onDevotionalClick: (id: string) => void;
  accessToken?: string;
  projectId?: string;
  onBackToHome?: () => void;
  completionVersion?: number;
}

export function DailyDevotionsFeed({ onDevotionalClick, accessToken, projectId, onBackToHome, completionVersion = 0 }: DailyDevotionsFeedProps) {
  const tr = useUiCopy(coupleUiMessages);
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('devotionals');
  const [searchQuery, setSearchQuery] = useState('');
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [isLoadingDevotionals, setIsLoadingDevotionals] = useState(false);
  const [completedDevotionals, setCompletedDevotionals] = useState<Set<string>>(new Set());
  const [savedHighlights, setSavedHighlights] = useState<Highlight[]>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
  const [audioDevotionals, setAudioDevotionals] = useState<Devotional[]>([]);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());

  // Filter devotionals by the global app language so switching language updates content instantly
  const filteredDevotionals = devotionals.filter(d =>
    language === 'en'
      ? !d.language || d.language === 'en'
      : d.language === language
  );

  const filteredAudioDevotionals = audioDevotionals.filter(d =>
    language === 'en'
      ? !d.language || d.language === 'en'
      : d.language === language
  );

  // Load devotionals from backend (admin-created only)
  useEffect(() => {
    const loadDevotionals = async () => {
      if (!accessToken || !projectId) return;

      setIsLoadingDevotionals(true);
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotions`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const { devotions } = await response.json();
          const formattedDevotionals = devotions?.map((d: any) => ({
            id: d.id,
            title: d.title,
            verse: d.verse,
            reference: d.reference || d.verseReference || '',
            reflection: d.reflection || d.content || '',
            audioUrl: d.audioUrl,
            audioFileName: d.audioFileName,
            date: d.date,
            duration: d.duration,
            prayerPrompt: d.prayerPrompt,
            language: d.language // Add language field
          })) || [];
          setDevotionals(formattedDevotionals);
        }
      } catch (err) {
        console.error('Failed to load devotionals:', err);
      } finally {
        setIsLoadingDevotionals(false);
      }
    };

    loadDevotionals();
  }, [accessToken, projectId]);

  // Load completed devotionals from backend
  useEffect(() => {
    const loadCompletions = async () => {
      if (!accessToken || !projectId) return;

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotional-completions`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const { completions } = await response.json();
          const completedIds = new Set(
            completions?.map((c: any) => c.devotionId || c.devotion_id) || []
          );
          setCompletedDevotionals(completedIds);
        }
      } catch (err) {
        console.error('Failed to load devotional completions:', err);
      }
    };

    loadCompletions();
  }, [accessToken, projectId, completionVersion]);

  // Load saved highlights from backend
  useEffect(() => {
    const loadHighlights = async () => {
      if (!accessToken || !projectId) return;

      setIsLoadingHighlights(true);
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/highlights`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const { highlights } = await response.json();
          setSavedHighlights(highlights || []);
        }
      } catch (err) {
        console.error('Failed to load highlights:', err);
      } finally {
        setIsLoadingHighlights(false);
      }
    };

    loadHighlights();

    // Poll every 60 seconds — reduces 5 extra network calls/min to 1
    const interval = setInterval(loadHighlights, 60000);
    return () => clearInterval(interval);
  }, [accessToken, projectId]);

  // Load audio devotionals from backend
  useEffect(() => {
    const loadAudioDevotionals = async () => {
      if (!accessToken || !projectId) return;

      setIsLoadingAudio(true);
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotions`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const { devotions: allDevotionals } = await response.json();
          // Filter to only show devotionals with audio
          const withAudio = allDevotionals
            ?.filter((d: any) => d.audioUrl)
            .map((d: any) => ({
              id: d.id,
              title: d.title,
              verse: d.verse,
              reference: d.reference || d.verseReference || '',
              reflection: d.reflection || d.content || '',
              audioUrl: d.audioUrl,
              audioFileName: d.audioFileName,
              date: d.date,
              duration: d.duration,
              prayerPrompt: d.prayerPrompt,
              language: d.language // Add language field
            })) || [];

          setAudioDevotionals(withAudio);
        }
      } catch (err) {
        console.error('Failed to load audio devotionals:', err);
      } finally {
        setIsLoadingAudio(false);
      }
    };

    loadAudioDevotionals();
  }, [accessToken, projectId]);

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      audioElements.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, [audioElements]);

  const fetchFreshAudioUrl = async (devotionalId: string): Promise<string | null> => {
    if (!accessToken || !projectId) return null;
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotions/${devotionalId}/audio-url`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (!res.ok) {
        console.warn(`[Audio] Fresh URL fetch failed (${res.status}) for devotional ${devotionalId}`);
        return null;
      }
      const { audioUrl } = await res.json();
      return audioUrl || null;
    } catch (err) {
      console.warn('[Audio] fetchFreshAudioUrl error:', err);
      return null;
    }
  };

  const loadAndPlay = (audio: HTMLAudioElement, url: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout')), 12000);
      const cleanup = () => {
        clearTimeout(timeout);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
      };
      const onCanPlay = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(new Error('load_error')); };
      audio.addEventListener('canplay', onCanPlay, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.src = url;
      audio.load();
    });

  const handlePlayAudio = async (devotionalId: string) => {
    // Toggle pause if already playing
    if (currentlyPlayingId === devotionalId) {
      const audio = audioElements.get(devotionalId);
      if (audio) { audio.pause(); setCurrentlyPlayingId(null); }
      return;
    }

    // Pause any other playing audio
    if (currentlyPlayingId) {
      const cur = audioElements.get(currentlyPlayingId);
      if (cur) { try { cur.pause(); cur.currentTime = 0; } catch {} }
      setCurrentlyPlayingId(null);
    }

    // Always fetch a fresh signed URL — avoids stale/expired URL issues
    const freshUrl = await fetchFreshAudioUrl(devotionalId);
    if (!freshUrl) {
      toast.error(tr("Audio file is not available. Please contact your admin."));
      return;
    }

    // Get or create audio element
    let audio = audioElements.get(devotionalId);
    if (!audio) {
      audio = new Audio();
      audio.addEventListener('ended', () => setCurrentlyPlayingId(null));
      audio.addEventListener('error', (e: Event) => {
        const code = (e.target as HTMLAudioElement).error?.code;
        console.warn(`Audio element error for ${devotionalId} (code: ${code})`);
        setCurrentlyPlayingId(null);
      });
      audioElements.set(devotionalId, audio);
      setAudioElements(new Map(audioElements));
    }

    setCurrentlyPlayingId(devotionalId);

    try {
      await loadAndPlay(audio, freshUrl);
      await audio.play();
    } catch (err: any) {
      setCurrentlyPlayingId(null);
      console.error('Failed to play audio:', err);
      if (err.message === 'timeout') {
        toast.error(tr("Audio is taking too long to load. Please try again."));
      } else if (err.message === 'load_error') {
        toast.error(tr("Audio file could not be loaded. The file may have been removed."));
      } else if (err.name !== 'AbortError') {
        toast.error(tr("Could not play audio. Please try again."));
      }
    }
  };

  const handleDeleteHighlight = async (highlightId: string) => {
    if (!accessToken || !projectId) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/highlight/${highlightId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        setSavedHighlights(highlights => highlights.filter(h => h.id !== highlightId));
        toast.success(tr("Highlight removed"));
      } else {
        toast.error(tr("Failed to remove highlight"));
      }
    } catch (err) {
      console.error('Failed to delete highlight:', err);
      toast.error(tr("Failed to remove highlight"));
    }
  };

  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
  const matchingDevotionals = normalizedSearchQuery
    ? filteredDevotionals.filter((devotional) =>
        [
          devotional.title,
          devotional.verse,
          devotional.reference,
          devotional.reflection,
          devotional.prayerPrompt,
        ].some((value) =>
          value?.toLocaleLowerCase().includes(normalizedSearchQuery),
        ),
      )
    : filteredDevotionals;
  const orderedDevotionals = [...matchingDevotionals].sort((first, second) =>
    Number(completedDevotionals.has(first.id)) -
    Number(completedDevotionals.has(second.id)),
  );
  const featuredDevotional = orderedDevotionals[0];
  const earlierDevotionals = orderedDevotionals.slice(1);
  const completedVisibleCount = filteredDevotionals.filter((devotional) =>
    completedDevotionals.has(devotional.id),
  ).length;
  const completionProgress = filteredDevotionals.length
    ? Math.round((completedVisibleCount / filteredDevotionals.length) * 100)
    : 0;

  return (
    <div className="mx-auto min-w-0 w-full max-w-3xl space-y-7 pb-6 [overflow-wrap:anywhere]">
      {/* Warm, quiet introduction */}
      <header className="relative isolate overflow-hidden rounded-[2rem] tbo-glass-raised px-6 py-8 shadow-[0_18px_55px_-38px_rgba(190,24,93,0.45)] ring-1 ring-[var(--glass-rim)] sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[var(--glass-inset-surface)] blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-xl">
          <div className="tbo-caption mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--glass-inset-surface)] px-3 py-1.5 text-[var(--glass-accent)] shadow-sm ring-1 ring-[var(--glass-rim)] backdrop-blur">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden="true" />

            {tr("A quiet moment for two")}
          </div>
          <h1 className="tbo-page-title text-foreground">{t.devotionals.title}</h1>
          <p className="tbo-supporting mt-3 max-w-lg text-muted-foreground">
            {t.dashboard.growingTogetherInFaith}
          </p>

          {!isLoadingDevotionals && filteredDevotionals.length > 0 && (
            <div
              className="mt-7 flex items-center gap-4"
              role="progressbar"
              aria-label={tr("Devotional reading progress")}
              aria-valuemin={0}
              aria-valuemax={filteredDevotionals.length}
              aria-valuenow={completedVisibleCount}
              aria-valuetext={tr('{count} of {total} readings completed', { count: completedVisibleCount, total: filteredDevotionals.length })}
            >
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--glass-inset-surface)] ring-1 ring-[var(--glass-rim)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-[width] duration-700 ease-out motion-reduce:transition-none"
                  style={{ width: `${completionProgress}%` }}
                />
              </div>
              <span className="tbo-caption shrink-0 text-muted-foreground">
                {completedVisibleCount}/{filteredDevotionals.length}  {tr("read")}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-7">
        <TabsList className="grid h-14 w-full grid-cols-3 gap-1 rounded-[1.25rem] border border-[var(--glass-border)] bg-[var(--glass-inset-surface)] p-1.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-24px_rgba(15,23,42,0.45)]" aria-label={tr("Devotional sections")}>
          <TabsTrigger value="devotionals" className="tbo-action group h-full min-w-0 whitespace-normal rounded-[0.9rem] border-0 bg-transparent px-1 sm:px-2 text-muted-foreground shadow-none transition-all duration-200 hover:bg-[var(--glass-inset-surface)] hover:text-foreground data-[state=active]:bg-[var(--glass-inset-surface)] data-[state=active]:text-[var(--glass-accent)] data-[state=active]:shadow-[0_4px_14px_-8px_rgba(190,24,93,0.45)] data-[state=active]:ring-1 data-[state=active]:ring-[var(--glass-rim)]">
            <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-transparent transition-colors sm:flex group-data-[state=active]:bg-[var(--glass-inset-surface)]">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="hidden min-w-0 max-w-full sm:inline">{t.devotionals.title}</span>
            <span className="min-w-0 max-w-full sm:hidden">{tr("Readings")}</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="tbo-action group h-full min-w-0 whitespace-normal rounded-[0.9rem] border-0 bg-transparent px-1 sm:px-2 text-muted-foreground shadow-none transition-all duration-200 hover:bg-[var(--glass-inset-surface)] hover:text-foreground data-[state=active]:bg-[var(--glass-inset-surface)] data-[state=active]:text-[var(--glass-accent)] data-[state=active]:shadow-[0_4px_14px_-8px_rgba(190,24,93,0.45)] data-[state=active]:ring-1 data-[state=active]:ring-[var(--glass-rim)]">
            <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-transparent transition-colors sm:flex group-data-[state=active]:bg-[var(--glass-inset-surface)]">
              <Headphones className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 max-w-full">{t.devotionals.audioTab}</span>
          </TabsTrigger>
          <TabsTrigger value="verses" className="tbo-action group h-full min-w-0 whitespace-normal rounded-[0.9rem] border-0 bg-transparent px-1 sm:px-2 text-muted-foreground shadow-none transition-all duration-200 hover:bg-[var(--glass-inset-surface)] hover:text-foreground data-[state=active]:bg-[var(--glass-inset-surface)] data-[state=active]:text-[var(--glass-accent)] data-[state=active]:shadow-[0_4px_14px_-8px_rgba(190,24,93,0.45)] data-[state=active]:ring-1 data-[state=active]:ring-[var(--glass-rim)]">
            <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-transparent transition-colors sm:flex group-data-[state=active]:bg-[var(--glass-inset-surface)]">
              <Bookmark className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 max-w-full">{t.devotionals.versesTab}</span>
          </TabsTrigger>
        </TabsList>

        {/* Devotionals Tab */}
        <TabsContent value="devotionals" className="space-y-7 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-300">
          <div className="flex flex-wrap items-end justify-between gap-4 px-1">
            <div>
              <p className="tbo-eyebrow text-[var(--glass-accent)]">{tr("Your shared rhythm")}</p>
              <h2 className="tbo-section-title mt-1 text-foreground">{tr("Daily readings")}</h2>
            </div>
            {!isLoadingDevotionals && (
              <span className="tbo-caption text-muted-foreground">{tr('{count} readings', { count: matchingDevotionals.length })}</span>
            )}
          </div>
          <div className="relative" role="search">
            <label htmlFor="devotional-search" className="tbo-label sr-only">{tr("Search devotionals")}</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="devotional-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setSearchQuery('');
              }}
              placeholder={tr("Search by title, verse, or topic…")}
              className="tbo-field h-12 w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-inset-surface)] py-3 pl-11 pr-11 text-foreground shadow-[0_8px_25px_-22px_rgba(15,23,42,0.55)] outline-none transition-all placeholder:text-muted-foreground hover:border-[var(--glass-border)] focus:border-rose-300 focus:ring-4 focus:ring-[var(--glass-rim)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--glass-inset-surface)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                aria-label={tr("Clear devotional search")}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {isLoadingDevotionals ? (
            <BrandLoader label={t.devotionals.loading} className="py-8" />
          ) : featuredDevotional ? (
            <div className="space-y-7">
              <Card
                lang={featuredDevotional.language === 'am' || featuredDevotional.language === 'om' ? featuredDevotional.language : undefined}
                className="tbo-glass group relative overflow-hidden rounded-[2rem] border-0 p-0 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.8)] ring-1 ring-white/10 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_70px_-35px_rgba(190,24,93,0.5)] focus-within:ring-4 focus-within:ring-[var(--glass-rim)] motion-reduce:transform-none"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.26),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.14),transparent_38%)]" aria-hidden="true" />
                <button
                  type="button"
                  className="relative w-full p-6 text-left outline-none active:scale-[0.995] motion-reduce:transform-none sm:p-8"
                  onClick={() => onDevotionalClick(featuredDevotional.id)}
                  aria-label={tr('Read {title}', { title: featuredDevotional.title })}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="tbo-eyebrow inline-flex items-center gap-2 text-[var(--glass-rose)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_0_4px_rgba(251,113,133,0.12)]" />

                      {tr("Featured devotion")}
                    </span>
                    {completedDevotionals.has(featuredDevotional.id) ? (
                      <span className="tbo-caption inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300/20">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.devotionals.completed}
                      </span>
                    ) : (
                      <span className="tbo-caption inline-flex items-center gap-1.5 text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        {featuredDevotional.duration || tr("5 min")}
                      </span>
                    )}
                  </div>

                  <h3 className="tbo-card-title mt-10 max-w-xl text-foreground">{featuredDevotional.title}</h3>
                  <blockquote className="mt-5 max-w-xl">
                    <p className="tbo-body italic text-muted-foreground">“{featuredDevotional.verse}”</p>
                    <cite className="tbo-label mt-3 block not-italic text-[var(--glass-rose)]">{featuredDevotional.reference}</cite>
                  </blockquote>

                  <span className="tbo-label mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--glass-inset-surface)] px-4 py-2.5 text-foreground shadow-lg shadow-black/10 transition-all duration-200 group-hover:gap-3 group-hover:bg-[var(--glass-inset-surface)]">

                    {tr("Begin together")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </button>
              </Card>

              {earlierDevotionals.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-1">
                    <span className="tbo-eyebrow text-muted-foreground">{tr("Continue your journey")}</span>
                    <span className="h-px flex-1 bg-[var(--glass-inset-surface)]" />
                  </div>
                  {earlierDevotionals.map((devotional, index) => {
                    const isCompleted = completedDevotionals.has(devotional.id);
                    return (
                      <Card
                        key={devotional.id}
                        lang={devotional.language === 'am' || devotional.language === 'om' ? devotional.language : undefined}
                        className="tbo-glass group animate-in overflow-hidden rounded-2xl border border-[var(--glass-border)] p-0 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.5)] fade-in slide-in-from-bottom-2 transition-all duration-300 ease-out hover:border-[var(--glass-border)] hover:bg-[var(--glass-inset-surface)] hover:shadow-[0_16px_38px_-26px_rgba(190,24,93,0.45)] focus-within:ring-4 focus-within:ring-[var(--glass-rim)] motion-reduce:animate-none"
                        style={{ animationDelay: `${Math.min(index * 45, 225)}ms` }}
                      >
                        <button
                          type="button"
                          className="w-full p-5 text-left outline-none active:bg-[var(--glass-inset-surface)] sm:p-6"
                          onClick={() => onDevotionalClick(devotional.id)}
                          aria-label={tr('Read {title}', { title: devotional.title })}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-[var(--glass-inset-surface)] text-[var(--glass-accent)] group-hover:bg-[var(--glass-inset-surface)]'}`}>
                              {isCompleted ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <BookOpen className="h-5 w-5" aria-hidden="true" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="tbo-caption flex items-center gap-2 text-muted-foreground">
                                <span>{devotional.duration || tr("5 min read")}</span>
                                <span aria-hidden="true">·</span>
                                <span className="truncate">{devotional.reference}</span>
                              </div>
                              <h3 className="tbo-card-title mt-1.5 text-foreground">{devotional.title}</h3>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:bg-[var(--glass-inset-surface)] group-hover:text-[var(--glass-accent)] group-hover:shadow-sm">
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </span>
                          </div>
                        </button>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : normalizedSearchQuery ? (
            <Card className="rounded-[2rem] border-[var(--glass-border)] tbo-glass p-10 text-center shadow-sm">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--glass-inset-surface)] text-rose-500">
                <Search className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="tbo-card-title mb-2 text-foreground">{tr("No matching devotionals")}</h3>
              <p className="tbo-supporting mx-auto max-w-sm text-muted-foreground">

                {tr("Try a different title, Scripture reference, or topic.")}
              </p>
              <Button
                type="button"
                variant="ghost"
                className="tbo-action mt-4 rounded-full text-[var(--glass-accent)] hover:bg-[var(--glass-inset-surface)] hover:text-[var(--glass-accent)]"
                onClick={() => setSearchQuery('')}
              >

                {tr("Clear search")}
              </Button>
            </Card>
          ) : (
            <Card className="rounded-[2rem] border-[var(--glass-border)] tbo-glass p-10 text-center shadow-sm">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--glass-inset-surface)] text-rose-500">
                <BookOpen className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="tbo-card-title mb-2 text-foreground">{t.devotionals.noDevotionals}</h3>
              <p className="tbo-supporting text-muted-foreground">

                {tr("Daily devotionals created by admin will appear here.")}
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Audio Lessons Tab */}
        <TabsContent value="audio" className="space-y-6">
          <div className="flex items-end justify-between gap-4 px-1">
            <div>
              <h2 className="tbo-section-title text-foreground">{tr("Audio devotionals")}</h2>
              <p className="tbo-supporting mt-1 text-muted-foreground">{tr("Listen and reflect wherever your day takes you.")}</p>
            </div>
            {!isLoadingAudio && <span className="tbo-label shrink-0 text-muted-foreground">{filteredAudioDevotionals.length}  {tr("available")}</span>}
          </div>
          {isLoadingAudio ? (
            <BrandLoader label={tr('Loading audio devotionals...')} className="py-8" />
          ) : filteredAudioDevotionals.length > 0 ? (
            filteredAudioDevotionals.map((devotional) => {
              const isPlaying = currentlyPlayingId === devotional.id;
              return (
                <Card key={devotional.id} className="tbo-glass rounded-2xl border-[var(--glass-border)] p-5 shadow-sm transition-all duration-200 hover:border-[var(--glass-border)] hover:shadow-md sm:p-6">
                  <div className="flex items-start gap-5">
                    <Button
                      size="lg"
                      className="tbo-action h-14 w-14 flex-shrink-0 rounded-2xl shadow-sm transition-all hover:scale-105 hover:shadow-md focus-visible:ring-4 focus-visible:ring-[var(--glass-rim)]"
                      onClick={() => handlePlayAudio(devotional.id)}
                      aria-label={tr(isPlaying ? 'Pause {title}' : 'Play {title}', { title: devotional.title })}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                      )}
                    </Button>
                    <div className="flex-1">
                      {devotional.date && (
                        <Badge variant="secondary" className="tbo-caption mb-2">
                          {formatUiDate(new Date(devotional.date), UI_LOCALES[language], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Badge>
                      )}
                      <h3 className="tbo-card-title mb-1.5 text-foreground">{devotional.title}</h3>
                      <p className="mb-2 text-sm italic leading-6 text-muted-foreground">
                        "{devotional.verse.substring(0, 100)}{devotional.verse.length > 100 ? '...' : ''}"
                      </p>
                      <p className="tbo-supporting text-muted-foreground">{devotional.reference}</p>
                      {devotional.audioFileName && (
                        <div className="flex items-center gap-2 mt-2">
                          <Headphones className="w-3 h-3 text-primary-500" />
                          <span className="tbo-caption text-[var(--glass-accent)]">
                            {isPlaying ? tr("Now Playing") : tr("Audio Available")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Show devotional content when clicked */}
                  <div className="mt-5 border-t border-[var(--glass-border)] pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="tbo-action w-full rounded-xl text-[var(--glass-accent)] hover:bg-[var(--glass-inset-surface)] hover:text-[var(--glass-accent)]"
                      onClick={() => onDevotionalClick(devotional.id)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />

                      {tr("Read Full Devotional")} <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="tbo-glass rounded-2xl border-[var(--glass-border)] p-10 text-center shadow-sm">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--glass-inset-surface)] text-muted-foreground"><Headphones className="h-7 w-7" aria-hidden="true" /></span>
              <h3 className="tbo-card-title mb-2 text-foreground">{tr("No audio devotionals yet")}</h3>
              <p className="tbo-supporting text-muted-foreground">

                {tr("Audio devotionals uploaded by admins will appear here")}
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Memory Verses Tab - Now shows saved highlights */}
        <TabsContent value="verses" className="space-y-6">
          <div className="flex items-end justify-between gap-4 px-1">
            <div>
              <h2 className="tbo-section-title text-foreground">{tr("Saved verses")}</h2>
              <p className="tbo-supporting mt-1 text-muted-foreground">{tr("Return to the words you want to carry with you.")}</p>
            </div>
            {!isLoadingHighlights && <span className="tbo-label shrink-0 text-muted-foreground">{savedHighlights.length}  {tr("saved")}</span>}
          </div>
          {isLoadingHighlights ? (
            <BrandLoader className="py-8" />
          ) : savedHighlights.length > 0 ? (
            savedHighlights
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((highlight) => (
                <Card key={highlight.id} className="tbo-glass relative rounded-2xl border-[var(--glass-border)] p-5 shadow-sm transition-all duration-200 hover:border-[var(--glass-border)] hover:shadow-md sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-8">
                      <p className="tbo-body mb-3 border-l-2 border-warning-300 pl-4 italic text-foreground">
                        “{highlight.text}”
                      </p>
                      <p className="tbo-supporting mb-2 text-muted-foreground">{highlight.reference}</p>
                      {highlight.note && (
                        <p className="tbo-caption text-muted-foreground mt-2">
                          📝 {highlight.note}
                        </p>
                      )}
                      {highlight.sharedBy && (
                        <Badge variant="secondary" className="tbo-caption mt-2">

                          {tr("Shared by")} {highlight.sharedBy}
                        </Badge>
                      )}
                      <p className="tbo-caption text-muted-foreground mt-2">

                        {tr("Saved")} {formatUiDate(new Date(highlight.createdAt), UI_LOCALES[language], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="absolute top-5 right-5 flex items-center gap-2">
                      <Bookmark className="w-5 h-5 text-warning-500 fill-warning-500 flex-shrink-0" />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="tbo-action w-full rounded-xl text-error-600 hover:bg-error-50 hover:text-error-700"
                    onClick={() => handleDeleteHighlight(highlight.id)}
                    aria-label={tr('Remove saved verse {reference}', { reference: highlight.reference })}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />

                    {tr("Remove")}
                  </Button>
                </Card>
              ))
          ) : (
            <Card className="tbo-glass rounded-2xl border-[var(--glass-border)] p-10 text-center shadow-sm">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--glass-inset-surface)] text-muted-foreground"><Bookmark className="h-7 w-7" aria-hidden="true" /></span>
              <h3 className="tbo-card-title mb-2 text-foreground">{tr("No saved verses yet")}</h3>
              <p className="tbo-supporting text-muted-foreground">

                {tr("Save verses from the Daily Verse section to see them here")}
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
