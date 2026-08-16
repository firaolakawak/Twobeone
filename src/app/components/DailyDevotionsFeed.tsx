import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BookOpen, Play, Headphones, Bookmark, CheckCircle2, Trash2, Pause, ArrowRight, Clock3 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
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

interface AudioLesson {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  topic: string;
}

interface MemoryVerse {
  id: string;
  verse: string;
  reference: string;
  isMemorized?: boolean;
}

interface DailyDevotionsFeedProps {
  onDevotionalClick: (id: string) => void;
  accessToken?: string;
  projectId?: string;
  onBackToHome?: () => void;
}

export function DailyDevotionsFeed({ onDevotionalClick, accessToken, projectId, onBackToHome }: DailyDevotionsFeedProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('devotionals');
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
  }, [accessToken, projectId]);

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

  const audioLessons: AudioLesson[] = [
    {
      id: '1',
      title: 'Communication in Christian Marriage',
      speaker: 'Dr. James Dobson',
      duration: '25 min',
      topic: 'Communication',
    },
    {
      id: '2',
      title: 'Conflict Resolution God\'s Way',
      speaker: 'Gary Chapman',
      duration: '30 min',
      topic: 'Conflict',
    },
  ];

  const memoryVerses: MemoryVerse[] = [
    {
      id: '1',
      verse: 'Two are better than one, because they have a good return for their labor.',
      reference: 'Ecclesiastes 4:9',
      isMemorized: true,
    },
    {
      id: '2',
      verse: 'Above all, love each other deeply, because love covers over a multitude of sins.',
      reference: '1 Peter 4:8',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-4">
      {/* Header */}
      <div className="space-y-3 px-2 pt-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 ring-1 ring-primary-100">
            <BookOpen className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{t.devotionals.title}</h1>
        </div>
        <p className="text-base leading-relaxed text-slate-600">{t.dashboard.growingTogetherInFaith}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-6">
        <TabsList className="grid h-14 w-full grid-cols-3 rounded-2xl border border-slate-200 bg-slate-100/90 p-1.5 shadow-inner" aria-label="Devotional sections">
          <TabsTrigger value="devotionals" className="h-full rounded-xl px-1 text-xs font-semibold text-slate-600 transition-all duration-200 hover:text-primary-700 data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm sm:text-sm">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>{t.devotionals.title}</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="h-full rounded-xl px-1 text-xs font-semibold text-slate-600 transition-all duration-200 hover:text-primary-700 data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm sm:text-sm">
            <Headphones className="h-4 w-4" aria-hidden="true" />
            <span>{t.devotionals.audioTab}</span>
          </TabsTrigger>
          <TabsTrigger value="verses" className="h-full rounded-xl px-1 text-xs font-semibold text-slate-600 transition-all duration-200 hover:text-primary-700 data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm sm:text-sm">
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            <span>{t.devotionals.versesTab}</span>
          </TabsTrigger>
        </TabsList>

        {/* Devotionals Tab */}
        <TabsContent value="devotionals" className="space-y-6">
          <div className="flex items-end justify-between gap-4 px-1">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Daily readings</h2>
              <p className="mt-1 text-sm text-slate-500">Pause, reflect, and grow together in Scripture.</p>
            </div>
            {!isLoadingDevotionals && (
              <span className="shrink-0 text-sm font-medium text-slate-500">{filteredDevotionals.length} {filteredDevotionals.length === 1 ? 'reading' : 'readings'}</span>
            )}
          </div>
          {isLoadingDevotionals ? (
            <div className="py-2 text-center" role="status" aria-label={t.devotionals.loading}>
              <div className="animate-pulse space-y-5">
                <div className="h-52 rounded-2xl bg-slate-100"></div>
                <div className="h-52 rounded-2xl bg-slate-100"></div>
                <div className="h-52 rounded-2xl bg-slate-100"></div>
              </div>
              <p className="mt-4 text-sm text-slate-500">{t.devotionals.loading}</p>
            </div>
          ) : filteredDevotionals.length > 0 ? (
            <div className="grid gap-5">
              {filteredDevotionals.map((devotional) => {
                const isCompleted = completedDevotionals.has(devotional.id);
                return (
                  <Card
                    key={devotional.id}
                    lang={devotional.language === 'am' || devotional.language === 'om' ? devotional.language : undefined}
                    className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-100/70"
                  >
                    <button
                      type="button"
                      className="w-full p-5 text-left outline-none sm:p-6"
                      onClick={() => onDevotionalClick(devotional.id)}
                      aria-label={`Read ${devotional.title}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                            {devotional.duration || '5 min read'}
                          </span>
                          {isCompleted && (
                            <Badge className="h-6 gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 shadow-none hover:bg-emerald-50">
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              {t.devotionals.completed}
                            </Badge>
                          )}
                        </div>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100 transition-transform duration-200 group-hover:scale-105">
                          <BookOpen className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-bold leading-tight tracking-tight text-slate-950 sm:text-2xl">{devotional.title}</h3>
                      <blockquote className="mt-4 border-l-2 border-primary-300 pl-4">
                        <p className="text-[15px] italic leading-7 text-slate-600 sm:text-base">“{devotional.verse}”</p>
                      </blockquote>
                      <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                        <cite className="text-sm font-semibold not-italic text-slate-600">{devotional.reference}</cite>
                        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-700">
                          Read devotional
                          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                      </div>
                    </button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-2xl border-slate-200 p-10 text-center shadow-sm">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
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
