import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BookOpen, Play, Headphones, Bookmark, CheckCircle2, ArrowLeft, Home, Trash2, Pause } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl">{t.devotionals.title}</h1>
        <p className="text-muted-foreground">{t.dashboard.growingTogetherInFaith}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="devotionals">
            <BookOpen className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t.devotionals.title}</span>
          </TabsTrigger>
          <TabsTrigger value="audio">
            <Headphones className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t.devotionals.audioTab}</span>
          </TabsTrigger>
          <TabsTrigger value="verses">
            <Bookmark className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t.devotionals.versesTab}</span>
          </TabsTrigger>
        </TabsList>

        {/* Devotionals Tab */}
        <TabsContent value="devotionals" className="space-y-4">
          {isLoadingDevotionals ? (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-3">
                <div className="h-32 bg-neutral-200 rounded-lg"></div>
                <div className="h-32 bg-neutral-200 rounded-lg"></div>
                <div className="h-32 bg-neutral-200 rounded-lg"></div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">{t.devotionals.loading}</p>
            </div>
          ) : filteredDevotionals.length > 0 ? (
            filteredDevotionals.map((devotional) => {
              const isCompleted = completedDevotionals.has(devotional.id);
              return (
                <Card
                  key={devotional.id}
                  lang={devotional.language === 'am' || devotional.language === 'om' ? devotional.language : undefined}
                  className="p-5 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onDevotionalClick(devotional.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">5 min read</span>
                        {isCompleted && (
                          <div className="flex items-center gap-1 text-success-700">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs">{t.devotionals.completed}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{devotional.title}</h3>
                      <p className="text-sm text-muted-foreground italic mb-2">
                        "{devotional.verse}"
                      </p>
                      <p className="text-xs text-muted-foreground">{devotional.reference}</p>
                    </div>
                    <BookOpen className="w-6 h-6 text-primary-500 flex-shrink-0 ml-4" />
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">{t.devotionals.noDevotionals}</h3>
              <p className="text-sm text-muted-foreground">
                Daily devotionals created by admin will appear here.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Audio Lessons Tab */}
        <TabsContent value="audio" className="space-y-4">
          {isLoadingAudio ? (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-3">
                <div className="h-32 bg-neutral-200 rounded-lg"></div>
                <div className="h-32 bg-neutral-200 rounded-lg"></div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Loading audio devotionals...</p>
            </div>
          ) : filteredAudioDevotionals.length > 0 ? (
            filteredAudioDevotionals.map((devotional) => {
              const isPlaying = currentlyPlayingId === devotional.id;
              return (
                <Card key={devotional.id} className="p-5">
                  <div className="flex items-start gap-4">
                    <Button
                      size="lg"
                      className="w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 flex-shrink-0"
                      onClick={() => handlePlayAudio(devotional.id)}
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
                      <h3 className="font-semibold mb-1">{devotional.title}</h3>
                      <p className="text-sm text-muted-foreground italic mb-2">
                        "{devotional.verse.substring(0, 100)}{devotional.verse.length > 100 ? '...' : ''}"
                      </p>
                      <p className="text-xs text-muted-foreground">{devotional.reference}</p>
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
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onDevotionalClick(devotional.id)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Read Full Devotional
                    </Button>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 text-center">
              <Headphones className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-2">No audio devotionals yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Audio devotionals uploaded by admins will appear here
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Memory Verses Tab - Now shows saved highlights */}
        <TabsContent value="verses" className="space-y-4">
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
                <Card key={highlight.id} className="p-5 relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-8">
                      <p className="text-foreground italic mb-3 leading-relaxed">
                        "{highlight.text}"
                      </p>
                      <p className="text-sm text-muted-foreground font-medium mb-2">{highlight.reference}</p>
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
                    className="w-full text-error-500 hover:text-error-700 hover:bg-error-50"
                    onClick={() => handleDeleteHighlight(highlight.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </Card>
              ))
          ) : (
            <Card className="p-8 text-center">
              <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-2">No saved verses yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save verses from the Daily Verse section to see them here
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}