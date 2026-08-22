import { useState, useEffect } from 'react';
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
}

export function DailyDevotionsFeed({ onDevotionalClick, accessToken, projectId, onBackToHome }: DailyDevotionsFeedProps) {
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
            prayerPrompt: d.prayerPrompt
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
    
    // Poll for new highlights every 10 seconds (to catch shared verses)
    const interval = setInterval(loadHighlights, 10000);
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
              prayerPrompt: d.prayerPrompt
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

  const handlePlayAudio = async (devotionalId: string, audioUrl: string) => {
    // Validate audio URL
    if (!audioUrl || audioUrl.trim() === '' || audioUrl === 'undefined' || audioUrl === 'null') {
      console.error('Invalid audio URL:', audioUrl);
      toast.error('Audio file not available');
      return;
    }

    // If clicking the same audio that's playing, pause it
    if (currentlyPlayingId === devotionalId) {
      const audio = audioElements.get(devotionalId);
      if (audio) {
        audio.pause();
        setCurrentlyPlayingId(null);
      }
      return;
    }

    // Pause any currently playing audio
    if (currentlyPlayingId) {
      const currentAudio = audioElements.get(currentlyPlayingId);
      if (currentAudio) {
        try {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        } catch (err) {
          console.log('Error pausing previous audio:', err);
        }
      }
      setCurrentlyPlayingId(null);
    }

    // Get or create audio element
    let audio = audioElements.get(devotionalId);
    let isNewAudio = false;
    
    if (!audio) {
      isNewAudio = true;
      audio = new Audio();
      
      // Set up event listeners before setting src
      audio.addEventListener('ended', () => {
        setCurrentlyPlayingId(null);
      });
      
      audio.addEventListener('error', (e: Event) => {
        const target = e.target as HTMLAudioElement;
        const error = target.error;
        
        // Silently handle expected audio errors (file doesn't exist, CORS issues, etc.)
        if (error) {
          // Only log to console, don't show verbose error details to avoid clutter
          console.log(`Audio unavailable for devotional ${devotionalId} (Error code: ${error.code})`);
          
          // Don't show toast errors - audio is optional and failures are expected
          // when files haven't been uploaded yet or signed URLs expire
        }
        
        setCurrentlyPlayingId(null);
      });

      audio.addEventListener('loadedmetadata', () => {
        console.log('Audio metadata loaded for:', devotionalId);
      });
      
      // Store the audio element
      audioElements.set(devotionalId, audio);
      setAudioElements(new Map(audioElements));
    } else {
      // If audio element exists but hasn't been loaded yet (or failed to load),
      // we need to reload it. Check the readyState.
      if (audio.readyState === 0 || audio.error) {
        // Audio was never loaded or had an error, treat it as new
        isNewAudio = true;
        console.log('Reloading audio that failed to load previously');
      }
    }

    // Set playing state immediately for better UX
    setCurrentlyPlayingId(devotionalId);

    try {
      // Set src and load if this is a new audio element or needs reloading
      if (isNewAudio) {
        console.log('Setting audio source:', audioUrl);
        audio.src = audioUrl;
        audio.load();
        
        // Wait for audio to be ready to play
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Audio loading timeout'));
          }, 10000); // Increased to 10 seconds
          
          const onCanPlay = () => {
            clearTimeout(timeout);
            cleanup();
            console.log('Audio ready to play');
            resolve();
          };
          
          const onError = () => {
            clearTimeout(timeout);
            cleanup();
            reject(new Error('Audio failed to load'));
          };
          
          const cleanup = () => {
            audio!.removeEventListener('canplay', onCanPlay);
            audio!.removeEventListener('error', onError);
          };
          
          audio!.addEventListener('canplay', onCanPlay, { once: true });
          audio!.addEventListener('error', onError, { once: true });
        });
      }
      
      // Play the audio
      console.log('Playing audio...');
      await audio.play();
      console.log('Audio playing successfully');
    } catch (err: any) {
      console.error('Failed to play audio:', err);
      setCurrentlyPlayingId(null);
      
      if (err.message === 'Audio loading timeout') {
        toast.error('Audio is taking too long to load. Please try again.');
      } else if (err.message === 'Audio failed to load') {
        // Error already handled by the error event listener
      } else if (err.name === 'NotSupportedError' || err.name === 'NotAllowedError') {
        toast.error('Unable to play audio. Please check your browser settings.');
      } else if (err.name !== 'AbortError') {
        // Don't show toast for abort errors (quick clicks)
        toast.error('Failed to play audio');
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
      {/* Header with Back Button */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBackToHome}
          className="text-white hover:bg-white/20"
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl">Daily Devotions</h1>
        <p className="text-gray-600">Strengthen your faith journey together</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="devotionals">
            <BookOpen className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Devotionals</span>
          </TabsTrigger>
          <TabsTrigger value="audio">
            <Headphones className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Audio</span>
          </TabsTrigger>
          <TabsTrigger value="verses">
            <Bookmark className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Verses</span>
          </TabsTrigger>
        </TabsList>

        {/* Devotionals Tab */}
        <TabsContent value="devotionals" className="space-y-4">
          {isLoadingDevotionals ? (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-3">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Loading devotionals...</p>
            </div>
          ) : devotionals.length > 0 ? (
            devotionals.map((devotional) => {
              const isCompleted = completedDevotionals.has(devotional.id);
              return (
                <Card
                  key={devotional.id}
                  className="p-5 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onDevotionalClick(devotional.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">5 min read</span>
                        {isCompleted && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs">Completed</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{devotional.title}</h3>
                      <p className="text-sm text-gray-600 italic mb-2">
                        "{devotional.verse}"
                      </p>
                      <p className="text-xs text-gray-500">{devotional.reference}</p>
                    </div>
                    <BookOpen className="w-6 h-6 text-rose-500 flex-shrink-0 ml-4" />
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Devotionals Yet</h3>
              <p className="text-sm text-gray-600">
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
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Loading audio devotionals...</p>
            </div>
          ) : audioDevotionals.length > 0 ? (
            audioDevotionals.map((devotional) => {
              const isPlaying = currentlyPlayingId === devotional.id;
              return (
                <Card key={devotional.id} className="p-5">
                  <div className="flex items-start gap-4">
                    <Button
                      size="lg"
                      className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 flex-shrink-0"
                      onClick={() => handlePlayAudio(devotional.id, devotional.audioUrl!)}
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
                      <p className="text-sm text-gray-600 italic mb-2">
                        "{devotional.verse.substring(0, 100)}{devotional.verse.length > 100 ? '...' : ''}"
                      </p>
                      <p className="text-xs text-gray-500">{devotional.reference}</p>
                      {devotional.audioFileName && (
                        <div className="flex items-center gap-2 mt-2">
                          <Headphones className="w-3 h-3 text-purple-500" />
                          <span className="text-xs text-purple-600">
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
              <Headphones className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-medium mb-2">No audio devotionals yet</h3>
              <p className="text-sm text-gray-500 mb-4">
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
                <div className="h-24 bg-gray-200 rounded-lg"></div>
                <div className="h-24 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ) : savedHighlights.length > 0 ? (
            savedHighlights
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((highlight) => (
                <Card key={highlight.id} className="p-5 relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-8">
                      <p className="text-gray-800 italic mb-3 leading-relaxed">
                        "{highlight.text}"
                      </p>
                      <p className="text-sm text-gray-600 font-medium mb-2">{highlight.reference}</p>
                      {highlight.note && (
                        <p className="text-xs text-gray-500 mt-2">
                          📝 {highlight.note}
                        </p>
                      )}
                      {highlight.sharedBy && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Shared by {highlight.sharedBy}
                        </Badge>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Saved {new Date(highlight.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="absolute top-5 right-5 flex items-center gap-2">
                      <Bookmark className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteHighlight(highlight.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </Card>
              ))
          ) : (
            <Card className="p-8 text-center">
              <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-medium mb-2">No saved verses yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Save verses from the Daily Verse section to see them here
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}