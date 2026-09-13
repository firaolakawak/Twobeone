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
      toast.error('Audio file is not available. Please contact your admin.');
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
        toast.error('Audio is taking too long to load. Please try again.');
      } else if (err.message === 'load_error') {
        toast.error('Audio file could not be loaded. The file may have been removed.');
      } else if (err.name !== 'AbortError') {
        toast.error('Could not play audio. Please try again.');
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
        toast.success('Highlight removed');
      } else {
        toast.error('Failed to remove highlight');
      }
    } catch (err) {
      console.error('Failed to delete highlight:', err);
      toast.error('Failed to remove highlight');
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
    <div className="mx-auto w-full max-w-3xl space-y-7 pb-6">
      {/* Warm, quiet introduction */}
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-50 via-white to-amber-50 px-6 py-8 shadow-[0_18px_55px_-38px_rgba(190,24,93,0.45)] ring-1 ring-rose-100/80 sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-rose-200/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-semibold tracking-wide text-rose-700 shadow-sm ring-1 ring-rose-100 backdrop-blur">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden="true" />
            A quiet moment for two
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">{t.devotionals.title}</h1>
          <p className="mt-3 max-w-lg text-[15px] leading-7 text-slate-600 sm:text-base">
            {t.dashboard.growingTogetherInFaith}
          </p>

          {!isLoadingDevotionals && filteredDevotionals.length > 0 && (
            <div
              className="mt-7 flex items-center gap-4"
              role="progressbar"
              aria-label="Devotional reading progress"
              aria-valuemin={0}
              aria-valuemax={filteredDevotionals.length}
              aria-valuenow={completedVisibleCount}
              aria-valuetext={`${completedVisibleCount} of ${filteredDevotionals.length} readings completed`}
            >
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/90 ring-1 ring-rose-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-[width] duration-700 ease-out motion-reduce:transition-none"
                  style={{ width: `${completionProgress}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-500">
                {completedVisibleCount}/{filteredDevotionals.length} read
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-7">
        <TabsList className="grid h-14 w-full grid-cols-3 gap-1 rounded-[1.25rem] border border-slate-200/80 bg-slate-100/70 p-1.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-24px_rgba(15,23,42,0.45)]" aria-label="Devotional sections">
          <TabsTrigger value="devotionals" className="group h-full rounded-[0.9rem] border-0 bg-transparent px-2 text-xs font-semibold text-slate-500 shadow-none transition-all duration-200 hover:bg-white/65 hover:text-slate-800 data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-[0_4px_14px_-8px_rgba(190,24,93,0.45)] data-[state=active]:ring-1 data-[state=active]:ring-rose-100 sm:text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent transition-colors group-data-[state=active]:bg-rose-50">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="hidden sm:inline">{t.devotionals.title}</span>
            <span className="sm:hidden">Readings</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="group h-full rounded-[0.9rem] border-0 bg-transparent px-2 text-xs font-semibold text-slate-500 shadow-none transition-all duration-200 hover:bg-white/65 hover:text-slate-800 data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-[0_4px_14px_-8px_rgba(190,24,93,0.45)] data-[state=active]:ring-1 data-[state=active]:ring-rose-100 sm:text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent transition-colors group-data-[state=active]:bg-rose-50">
              <Headphones className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>{t.devotionals.audioTab}</span>
          </TabsTrigger>
          <TabsTrigger value="verses" className="group h-full rounded-[0.9rem] border-0 bg-transparent px-2 text-xs font-semibold text-slate-500 shadow-none transition-all duration-200 hover:bg-white/65 hover:text-slate-800 data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-[0_4px_14px_-8px_rgba(190,24,93,0.45)] data-[state=active]:ring-1 data-[state=active]:ring-rose-100 sm:text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent transition-colors group-data-[state=active]:bg-rose-50">
              <Bookmark className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>{t.devotionals.versesTab}</span>
          </TabsTrigger>
        </TabsList>

        {/* Devotionals Tab */}
        <TabsContent value="devotionals" className="space-y-7 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-300">
          <div className="flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Your shared rhythm</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Daily readings</h2>
            </div>
            {!isLoadingDevotionals && (
              <span className="shrink-0 text-xs font-medium text-slate-400">{matchingDevotionals.length} {matchingDevotionals.length === 1 ? 'reading' : 'readings'}</span>
            )}
          </div>
          <div className="relative" role="search">
            <label htmlFor="devotional-search" className="sr-only">Search devotionals</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="devotional-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setSearchQuery('');
              }}
              placeholder="Search by title, verse, or topic…"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm text-slate-900 shadow-[0_8px_25px_-22px_rgba(15,23,42,0.55)] outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                aria-label="Clear devotional search"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {isLoadingDevotionals ? (
            <div className="py-2 text-center" role="status" aria-label={t.devotionals.loading}>
              <div className="animate-pulse space-y-4">
                <div className="h-72 rounded-[2rem] bg-gradient-to-br from-rose-50 to-slate-100" />
                <div className="h-32 rounded-2xl bg-slate-100" />
                <div className="h-32 rounded-2xl bg-slate-100" />
              </div>
              <p className="mt-4 text-sm text-slate-500">{t.devotionals.loading}</p>
            </div>
          ) : featuredDevotional ? (
            <div className="space-y-7">
              <Card
                lang={featuredDevotional.language === 'am' || featuredDevotional.language === 'om' ? featuredDevotional.language : undefined}
                className="group relative overflow-hidden rounded-[2rem] border-0 bg-slate-950 p-0 text-white shadow-[0_24px_60px_-35px_rgba(15,23,42,0.8)] ring-1 ring-white/10 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_30px_70px_-35px_rgba(190,24,93,0.5)] focus-within:ring-4 focus-within:ring-rose-200 motion-reduce:transform-none"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.26),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.14),transparent_38%)]" aria-hidden="true" />
                <button
                  type="button"
                  className="relative w-full p-6 text-left outline-none active:scale-[0.995] motion-reduce:transform-none sm:p-8"
                  onClick={() => onDevotionalClick(featuredDevotional.id)}
                  aria-label={`Read ${featuredDevotional.title}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_0_4px_rgba(251,113,133,0.12)]" />
                      Featured devotion
                    </span>
                    {completedDevotionals.has(featuredDevotional.id) ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.devotionals.completed}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        {featuredDevotional.duration || '5 min'}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-10 max-w-xl text-2xl font-bold leading-tight tracking-[-0.025em] text-white sm:text-3xl">{featuredDevotional.title}</h3>
                  <blockquote className="mt-5 max-w-xl">
                    <p className="text-[15px] italic leading-7 text-slate-300 sm:text-base">“{featuredDevotional.verse}”</p>
                    <cite className="mt-3 block text-sm font-semibold not-italic text-rose-200">{featuredDevotional.reference}</cite>
                  </blockquote>

                  <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-black/10 transition-all duration-200 group-hover:gap-3 group-hover:bg-rose-50">
                    Begin together
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </button>
              </Card>

              {earlierDevotionals.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Continue your journey</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                  {earlierDevotionals.map((devotional, index) => {
                    const isCompleted = completedDevotionals.has(devotional.id);
                    return (
                      <Card
                        key={devotional.id}
                        lang={devotional.language === 'am' || devotional.language === 'om' ? devotional.language : undefined}
                        className="group animate-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.5)] fade-in slide-in-from-bottom-2 transition-all duration-300 ease-out hover:border-rose-200 hover:bg-rose-50/20 hover:shadow-[0_16px_38px_-26px_rgba(190,24,93,0.45)] focus-within:ring-4 focus-within:ring-rose-100 motion-reduce:animate-none"
                        style={{ animationDelay: `${Math.min(index * 45, 225)}ms` }}
                      >
                        <button
                          type="button"
                          className="w-full p-5 text-left outline-none active:bg-rose-50/50 sm:p-6"
                          onClick={() => onDevotionalClick(devotional.id)}
                          aria-label={`Read ${devotional.title}`}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-100'}`}>
                              {isCompleted ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <BookOpen className="h-5 w-5" aria-hidden="true" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                <span>{devotional.duration || '5 min read'}</span>
                                <span aria-hidden="true">·</span>
                                <span className="truncate">{devotional.reference}</span>
                              </div>
                              <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-tight text-slate-900">{devotional.title}</h3>
                            </div>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all duration-200 group-hover:translate-x-1 group-hover:bg-white group-hover:text-rose-600 group-hover:shadow-sm">
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
            <Card className="rounded-[2rem] border-rose-100 bg-gradient-to-br from-white to-rose-50/50 p-10 text-center shadow-sm">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100/70 text-rose-500">
                <Search className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mb-2 text-lg font-bold text-slate-900">No matching devotionals</h3>
              <p className="mx-auto max-w-sm text-sm leading-6 text-slate-500">
                Try a different title, Scripture reference, or topic.
              </p>
              <Button
                type="button"
                variant="ghost"
                className="mt-4 rounded-full text-rose-700 hover:bg-rose-100/70 hover:text-rose-800"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            </Card>
          ) : (
            <Card className="rounded-[2rem] border-rose-100 bg-gradient-to-br from-white to-rose-50/50 p-10 text-center shadow-sm">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100/70 text-rose-500">
                <BookOpen className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="mb-2 text-lg font-bold text-slate-900">{t.devotionals.noDevotionals}</h3>
              <p className="text-sm leading-6 text-slate-500">
                Daily devotionals created by admin will appear here.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Audio Lessons Tab */}
        <TabsContent value="audio" className="space-y-6">
          <div className="flex items-end justify-between gap-4 px-1">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Audio devotionals</h2>
              <p className="mt-1 text-sm text-slate-500">Listen and reflect wherever your day takes you.</p>
            </div>
            {!isLoadingAudio && <span className="shrink-0 text-sm font-medium text-slate-500">{filteredAudioDevotionals.length} available</span>}
          </div>
          {isLoadingAudio ? (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-3">
                <div className="h-44 rounded-2xl bg-slate-100"></div>
                <div className="h-44 rounded-2xl bg-slate-100"></div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Loading audio devotionals...</p>
            </div>
          ) : filteredAudioDevotionals.length > 0 ? (
            filteredAudioDevotionals.map((devotional) => {
              const isPlaying = currentlyPlayingId === devotional.id;
              return (
                <Card key={devotional.id} className="rounded-2xl border-slate-200/90 p-5 shadow-sm transition-all duration-200 hover:border-primary-200 hover:shadow-md sm:p-6">
                  <div className="flex items-start gap-5">
                    <Button
                      size="lg"
                      className="h-14 w-14 flex-shrink-0 rounded-2xl bg-primary-600 shadow-sm transition-all hover:scale-105 hover:bg-primary-700 hover:shadow-md focus-visible:ring-4 focus-visible:ring-primary-200"
                      onClick={() => handlePlayAudio(devotional.id)}
                      aria-label={`${isPlaying ? 'Pause' : 'Play'} ${devotional.title}`}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                      )}
                    </Button>
                    <div className="flex-1">
                      {devotional.date && (
                        <Badge variant="secondary" className="text-xs mb-2">
                          {new Date(devotional.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Badge>
                      )}
                      <h3 className="mb-1.5 text-lg font-bold tracking-tight text-slate-950 sm:text-xl">{devotional.title}</h3>
                      <p className="mb-2 text-sm italic leading-6 text-slate-600">
                        "{devotional.verse.substring(0, 100)}{devotional.verse.length > 100 ? '...' : ''}"
                      </p>
                      <p className="text-sm font-semibold text-slate-500">{devotional.reference}</p>
                      {devotional.audioFileName && (
                        <div className="flex items-center gap-2 mt-2">
                          <Headphones className="w-3 h-3 text-primary-500" />
                          <span className="text-xs text-primary-600">
                            {isPlaying ? 'Now Playing' : 'Audio Available'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Show devotional content when clicked */}
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full rounded-xl font-semibold text-primary-700 hover:bg-primary-50 hover:text-primary-800"
                      onClick={() => onDevotionalClick(devotional.id)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Read Full Devotional <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="rounded-2xl border-slate-200 p-10 text-center shadow-sm">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Headphones className="h-7 w-7" aria-hidden="true" /></span>
              <h3 className="mb-2 text-lg font-bold text-slate-900">No audio devotionals yet</h3>
              <p className="text-sm leading-6 text-slate-500">
                Audio devotionals uploaded by admins will appear here
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Memory Verses Tab - Now shows saved highlights */}
        <TabsContent value="verses" className="space-y-6">
          <div className="flex items-end justify-between gap-4 px-1">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Saved verses</h2>
              <p className="mt-1 text-sm text-slate-500">Return to the words you want to carry with you.</p>
            </div>
            {!isLoadingHighlights && <span className="shrink-0 text-sm font-medium text-slate-500">{savedHighlights.length} saved</span>}
          </div>
          {isLoadingHighlights ? (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-3">
                <div className="h-24 bg-neutral-200 rounded-lg"></div>
                <div className="h-24 bg-neutral-200 rounded-lg"></div>
              </div>
            </div>
          ) : savedHighlights.length > 0 ? (
            savedHighlights
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((highlight) => (
                <Card key={highlight.id} className="relative rounded-2xl border-slate-200/90 p-5 shadow-sm transition-all duration-200 hover:border-primary-200 hover:shadow-md sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-8">
                      <p className="mb-3 border-l-2 border-warning-300 pl-4 text-base italic leading-7 text-slate-700">
                        “{highlight.text}”
                      </p>
                      <p className="mb-2 text-sm font-bold text-slate-600">{highlight.reference}</p>
                      {highlight.note && (
                        <p className="text-xs text-muted-foreground mt-2">
                          📝 {highlight.note}
                        </p>
                      )}
                      {highlight.sharedBy && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Shared by {highlight.sharedBy}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Saved {new Date(highlight.createdAt).toLocaleDateString('en-US', { 
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
                    className="w-full rounded-xl text-error-600 hover:bg-error-50 hover:text-error-700"
                    onClick={() => handleDeleteHighlight(highlight.id)}
                    aria-label={`Remove saved verse ${highlight.reference}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </Card>
              ))
          ) : (
            <Card className="rounded-2xl border-slate-200 p-10 text-center shadow-sm">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Bookmark className="h-7 w-7" aria-hidden="true" /></span>
              <h3 className="mb-2 text-lg font-bold text-slate-900">No saved verses yet</h3>
              <p className="text-sm leading-6 text-slate-500">
                Save verses from the Daily Verse section to see them here
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
