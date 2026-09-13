import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { ArrowLeft, BookOpen, Heart, CheckCircle2, Music, Play, Pause } from 'lucide-react';
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
  language?: string;
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
  const { t } = useLanguage();
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
      <DialogContent
        className="inset-0 left-0 top-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-white p-0 shadow-none sm:h-dvh sm:max-w-none sm:rounded-none"
        lang={devotional.language === 'am' || devotional.language === 'om' ? devotional.language : undefined}
        showCloseButton={false}
      >
        <DialogDescription className="sr-only">
          Scripture, reflection, and prayer for your shared walk.
        </DialogDescription>
        <DialogHeader className="relative flex-shrink-0 border-b border-rose-100/80 bg-gradient-to-br from-rose-50 via-white to-amber-50 px-4 py-4 text-left sm:px-8 sm:py-5">
          <div className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full bg-rose-200/25 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto flex w-full max-w-3xl items-start gap-3 sm:gap-5">
            <button
              type="button"
              onClick={onClose}
              className="mt-0.5 inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-white/85 px-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-white hover:text-rose-700 hover:ring-rose-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 sm:px-4"
              aria-label="Back to devotionals"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-700 shadow-sm ring-1 ring-rose-100 sm:text-[11px]">
                  <Heart className="h-3 w-3 fill-rose-500 text-rose-500" aria-hidden="true" />
                  Devotional reading
                </span>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.devotionals.completed}
                  </span>
                )}
              </div>
              <DialogTitle className="truncate text-xl font-bold leading-tight tracking-[-0.025em] text-slate-950 sm:text-2xl">{devotional.title}</DialogTitle>
              <p className="mt-1 hidden max-w-xl text-sm leading-6 text-slate-500 sm:block">
                Scripture, reflection, and prayer for your shared walk.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/55 px-4 py-5 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-3xl space-y-8">
            {/* Scripture */}
            <section className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_22px_55px_-34px_rgba(15,23,42,0.85)] sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.24),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.12),transparent_36%)]" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-rose-200">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  <h3>{t.devotionals.scriptureReading}</h3>
                </div>
                <blockquote className="mt-6">
                  <p className="text-lg italic leading-8 text-slate-100 sm:text-xl sm:leading-9">
                    “{devotional.verse}”
                  </p>
                  <cite className="mt-5 block text-sm font-bold not-italic text-rose-200">
                    {devotional.reference}
                  </cite>
                </blockquote>
              </div>
            </section>

            {/* Reflection */}
            <section className="rounded-[1.5rem] bg-white p-6 shadow-[0_14px_45px_-34px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/70 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <Heart className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-rose-500">Pause and consider</p>
                  <h3 className="mt-0.5 font-bold text-slate-900">{t.devotionals.dailyReflection}</h3>
                </div>
              </div>
              <p className="whitespace-pre-line text-[15px] leading-8 text-slate-700 sm:text-base">
                {devotional.reflection}
              </p>
            </section>

            {/* Prayer */}
            {devotional.prayer && (
              <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-rose-50 to-amber-50 p-6 ring-1 ring-rose-100 sm:p-7">
                <div className="mb-4 flex items-center gap-2 text-rose-700">
                  <Heart className="h-4.5 w-4.5 fill-rose-500 text-rose-500" aria-hidden="true" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.16em]">{t.devotionals.prayerPrompt}</h3>
                </div>
                <p className="whitespace-pre-line text-[15px] italic leading-8 text-slate-700 sm:text-base">
                  {devotional.prayer}
                </p>
              </section>
            )}

            {/* Prayer Together Chat */}
            <section>
              {accessToken && projectId && currentUserId && currentUserName && devotional.id && (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                      <Heart className="h-4.5 w-4.5 fill-rose-500 text-rose-500" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-rose-500">Share the moment</p>
                      <h3 className="font-bold text-slate-900">Reflect together</h3>
                    </div>
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
              <section className="rounded-[1.5rem] bg-white p-6 shadow-[0_14px_45px_-34px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/70 sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <Music className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-rose-500">Listen and reflect</p>
                    <h3 className="font-bold text-slate-900">{t.devotionals.audioTab}</h3>
                  </div>
                </div>
                <div>
                  {audioError ? (
                    <div className="text-center py-8">
                      <Music className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
                      <p className="mb-1 text-sm font-semibold text-slate-700">Audio unavailable</p>
                      <p className="text-xs text-slate-500">The audio format may not be supported by your browser.</p>
                    </div>
                  ) : (
                    <>
                      <audio
                        ref={audioRef}
                        src={devotional.audioUrl || ''}
                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                        onEnded={() => setIsPlaying(false)}
                        onError={() => {
                          setAudioError(true);
                          setIsPlaying(false);
                        }}
                        preload="metadata"
                      />

                      <div className="flex items-center gap-4">
                        {/* Play/Pause Button */}
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-200 transition-all duration-200 hover:scale-105 hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 motion-reduce:transform-none"
                          aria-label={isPlaying ? 'Pause devotional audio' : 'Play devotional audio'}
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </button>

                        {/* Progress Bar */}
                        <div className="flex-1">
                          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
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
                            aria-label="Devotional audio progress"
                            className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
                            style={{
                              background: `linear-gradient(to right, rgb(225 29 72) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgb(255 228 230) ${duration > 0 ? (currentTime / duration) * 100 : 0}%)`
                            }}
                          />
                        </div>
                      </div>

                      <p className="mt-3 text-center text-xs text-slate-400">
                        Listen together at your own pace
                      </p>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {onComplete && (
          <div className="flex-shrink-0 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-12px_35px_-28px_rgba(15,23,42,0.35)] backdrop-blur sm:p-5">
            <div className="mx-auto flex w-full max-w-3xl justify-end">
            <Button
              disabled={!!isCompleted}
              onClick={async () => {
                if (isCompleted) return;
                await onComplete();
                onClose();
              }}
              className="h-12 w-full rounded-full bg-rose-600 px-6 text-sm font-bold text-white shadow-lg shadow-rose-200 transition-all duration-200 hover:bg-rose-700 hover:shadow-xl disabled:bg-emerald-50 disabled:text-emerald-700 disabled:opacity-100 disabled:shadow-none sm:w-auto sm:min-w-56"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isCompleted ? 'Completed' : 'Mark as Complete'}
            </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
