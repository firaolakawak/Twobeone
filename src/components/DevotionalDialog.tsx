import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { BookOpen, Heart, CheckCircle2, Music, Play, Pause } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { PrayerTogetherChat } from './PrayerTogetherChat';
import { useState, useRef, useEffect } from 'react';

interface Devotional {
  id?: string;
  title: string;
  verse: string;
  reference: string;
  reflection: string;
  prayer: string;
  audioUrl?: string;
}

interface DevotionalDialogProps {
  devotional: Devotional;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  isCompleted?: boolean;
  accessToken?: string;
  projectId?: string;
  currentUserId?: string;
  currentUserName?: string;
  partnerName?: string;
}

export function DevotionalDialog({ 
  devotional, 
  isOpen, 
  onClose, 
  onComplete,
  isCompleted,
  accessToken,
  projectId,
  currentUserId,
  currentUserName,
  partnerName
}: DevotionalDialogProps) {
  console.log('[DevotionalDialog] Render with:', { 
    isCompleted, 
    hasOnComplete: !!onComplete,
    showButton: !isCompleted && !!onComplete,
    devotionalTitle: devotional.title,
    hasAudio: !!devotional.audioUrl
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Reset audio when dialog opens/closes
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioError(false);
    }
  }, [isOpen]);

  // Add audio error handler when audio element is created
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !devotional.audioUrl || devotional.audioUrl.trim() === '') return;

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const error = target.error;
      
      if (error) {
        // Silently log audio errors - audio is optional and failures are expected
        console.log(`Audio unavailable for devotional (Error code: ${error.code})`);
      }
      
      setAudioError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('error', handleError);
    };
  }, [devotional.audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.error('Failed to play audio:', err);
            setIsPlaying(false);
            
            if (err.name === 'NotSupportedError') {
              setAudioError(true);
            } else if (err.name !== 'AbortError') {
              // Only show error for non-abort errors
              setAudioError(true);
            }
          });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0 gap-0" aria-describedby="devotional-description">
        {/* Fixed Header - 8dp spacing system */}
        <DialogHeader className="px-4 pt-4 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <DialogTitle className="text-xl dark:text-white">{devotional.title}</DialogTitle>
                <DialogDescription id="devotional-description" className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Daily devotional with Scripture reading, reflection, and prayer guidance
                </DialogDescription>
              </div>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Completed</span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Scrollable Content Area - flexible height */}
        <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
          <div className="space-y-6 max-w-2xl mx-auto">{/* 24dp spacing between sections */}
            {/* Scripture */}
            <section>
              <div className="flex items-center gap-2 text-rose-700 mb-3">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-semibold">Today's Scripture</h3>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6">
                <p className="text-lg italic text-gray-800 leading-relaxed mb-4">
                  "{devotional.verse}"
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  — {devotional.reference}
                </p>
              </div>
            </section>

            {/* Reflection */}
            <section>
              <div className="flex items-center gap-2 text-blue-700 mb-3">
                <Heart className="w-5 h-5" />
                <h3 className="font-semibold">Reflection</h3>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {devotional.reflection}
                </p>
              </div>
            </section>

            {/* Prayer */}
            {devotional.prayer && (
              <section>
                <div className="flex items-center gap-2 text-purple-700 mb-3">
                  <Heart className="w-5 h-5 fill-purple-700" />
                  <h3 className="font-semibold">Prayer</h3>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line italic">
                    {devotional.prayer}
                  </p>
                </div>
              </section>
            )}

            {/* Prayer */}
            <section>
              {/* Prayer Together Chat */}
              {accessToken && projectId && currentUserId && currentUserName && devotional.id && (
                <>
                  <div className="flex items-center gap-2 text-purple-700 mb-3 mt-6">
                    <Heart className="w-5 h-5 fill-purple-700" />
                    <h3 className="font-semibold">Prayer Together Chat</h3>
                  </div>
                  <PrayerTogetherChat
                    devotionId={devotional.id}
                    accessToken={accessToken}
                    projectId={projectId}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    partnerName={partnerName}
                  />
                </>
              )}
            </section>

            {/* Audio Player Section */}
            {devotional.audioUrl && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-purple-700 mb-3 mt-6">
                  <Music className="w-5 h-5 fill-purple-700" />
                  <h3 className="font-semibold">Listen to Audio Reading</h3>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6">
                  {audioError ? (
                    <div className="text-center py-8">
                      <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-2">Unable to load audio</p>
                      <p className="text-xs text-gray-500">The audio format may not be supported by your browser</p>
                    </div>
                  ) : (
                    <>
                      <audio
                        ref={audioRef}
                        src={devotional.audioUrl || ''}
                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                        onEnded={() => setIsPlaying(false)}
                        onLoadedMetadata={() => {
                          console.log('Audio loaded successfully:', devotional.audioUrl);
                        }}
                        onError={(e) => {
                          // Silently handle audio errors - already logged in useEffect
                          setAudioError(true);
                          setIsPlaying(false);
                        }}
                        preload="metadata"
                      />
                      
                      <div className="flex items-center gap-4">
                        {/* Play/Pause Button */}
                        <button
                          onClick={togglePlay}
                          className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white transition-all hover:scale-105"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </button>

                        {/* Progress Bar */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={(e) => {
                              if (audioRef.current) {
                                audioRef.current.currentTime = parseFloat(e.target.value);
                                setCurrentTime(parseFloat(e.target.value));
                              }
                            }}
                            className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #9333ea ${(currentTime / duration) * 100}%, #e9d5ff ${(currentTime / duration) * 100}%)`
                            }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mt-3 text-center">
                        🎧 Listen to this devotional read aloud
                      </p>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          {!isCompleted && onComplete && (
            <Button 
              onClick={async () => {
                await onComplete();
                onClose();
              }}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Complete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}