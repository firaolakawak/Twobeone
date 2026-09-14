import { useUiCopy } from '../utils/uiTranslation';
import { coupleUiMessages } from '../locales/coupleUi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { BookOpen, Heart, CheckCircle2, Music, Play, Pause } from 'lucide-react';
import { BackButton } from './BackButton';
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
  const tr = useUiCopy(coupleUiMessages);
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
        className="inset-0 left-0 top-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-[var(--glass-inset-surface)] p-0 shadow-none sm:h-dvh sm:max-w-none sm:rounded-none"
        lang={devotional.language === 'am' || devotional.language === 'om' ? devotional.language : undefined}
        showCloseButton={false}
      >
        <DialogDescription className="tbo-supporting sr-only">

          {tr("Scripture, reflection, and prayer for your shared walk.")}
        </DialogDescription>
        <DialogHeader className="relative flex-shrink-0 border-b border-[var(--glass-border)] tbo-glass-raised px-4 py-4 text-left sm:px-8 sm:py-5">
          <div className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full bg-[var(--glass-inset-surface)] blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto flex w-full max-w-3xl flex-wrap items-start gap-3 sm:gap-5">
            <BackButton label={tr("Back to devotionals")} onClick={onClose} className="mt-0.5" />
            <div className="min-w-0 flex-1 basis-48">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="tbo-eyebrow inline-flex items-center gap-1.5 rounded-full bg-[var(--glass-inset-surface)] px-2.5 py-1 text-[var(--glass-accent)] shadow-sm ring-1 ring-[var(--glass-rim)]">
                  <Heart className="h-3 w-3 fill-rose-500 text-rose-500" aria-hidden="true" />

                  {tr("Devotional reading")}
                </span>
                {isCompleted && (
                  <span className="tbo-caption inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.devotionals.completed}
                  </span>
                )}
              </div>
              <DialogTitle className="tbo-dialog-title break-words text-foreground">{devotional.title}</DialogTitle>
              <p className="tbo-supporting mt-1 hidden max-w-xl text-muted-foreground sm:block">

                {tr("Scripture, reflection, and prayer for your shared walk.")}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--glass-inset-surface)] px-4 py-5 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-3xl space-y-8">
            {/* Scripture */}
            <section className="relative overflow-hidden rounded-[1.75rem] tbo-glass-inset p-6 shadow-[0_22px_55px_-34px_rgba(15,23,42,0.85)] sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.24),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.12),transparent_36%)]" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--glass-rose)]">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  <h3 className="tbo-card-title">{t.devotionals.scriptureReading}</h3>
                </div>
                <blockquote className="mt-6">
                  <p className="text-lg italic leading-8 text-muted-foreground sm:text-xl sm:leading-9">
                    “{devotional.verse}”
                  </p>
                  <cite className="mt-5 block text-sm font-bold not-italic text-[var(--glass-rose)]">
                    {devotional.reference}
                  </cite>
                </blockquote>
              </div>
            </section>

            {/* Reflection */}
            <section className="rounded-[1.5rem] tbo-glass-inset p-6 shadow-[0_14px_45px_-34px_rgba(15,23,42,0.55)] ring-1 ring-[var(--glass-rim)] sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--glass-inset-surface)] text-[var(--glass-accent)]">
                  <Heart className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="tbo-eyebrow text-rose-500">{tr("Pause and consider")}</p>
                  <h3 className="tbo-card-title mt-0.5 text-foreground">{t.devotionals.dailyReflection}</h3>
                </div>
              </div>
              <p className="whitespace-pre-line text-[15px] leading-8 text-foreground sm:text-base">
                {devotional.reflection}
              </p>
            </section>

            {/* Prayer */}
            {devotional.prayer && (
              <section className="relative overflow-hidden rounded-[1.5rem] tbo-glass-inset p-6 ring-1 ring-[var(--glass-rim)] sm:p-7">
                <div className="mb-4 flex items-center gap-2 text-[var(--glass-accent)]">
                  <Heart className="h-4.5 w-4.5 fill-rose-500 text-rose-500" aria-hidden="true" />
                  <h3 className="tbo-card-title">{t.devotionals.prayerPrompt}</h3>
                </div>
                <p className="whitespace-pre-line text-[15px] italic leading-8 text-foreground sm:text-base">
                  {devotional.prayer}
                </p>
              </section>
            )}

            {/* Prayer Together Chat */}
            <section>
              {accessToken && projectId && currentUserId && currentUserName && devotional.id && (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--glass-inset-surface)] text-[var(--glass-accent)]">
                      <Heart className="h-4.5 w-4.5 fill-rose-500 text-rose-500" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="tbo-eyebrow text-rose-500">{tr("Share the moment")}</p>
                      <h3 className="tbo-card-title text-foreground">{tr("Reflect together")}</h3>
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
              <section className="rounded-[1.5rem] tbo-glass-inset p-6 shadow-[0_14px_45px_-34px_rgba(15,23,42,0.55)] ring-1 ring-[var(--glass-rim)] sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--glass-inset-surface)] text-[var(--glass-accent)]">
                    <Music className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="tbo-eyebrow text-rose-500">{tr("Listen and reflect")}</p>
                    <h3 className="tbo-card-title text-foreground">{t.devotionals.audioTab}</h3>
                  </div>
                </div>
                <div>
                  {audioError ? (
                    <div className="text-center py-8">
                      <Music className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
                      <p className="tbo-supporting mb-1 text-foreground">{tr("Audio unavailable")}</p>
                      <p className="tbo-caption text-muted-foreground">{tr("The audio format may not be supported by your browser.")}</p>
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
                          className="tbo-action flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-200 transition-all duration-200 hover:scale-105 hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--glass-rim)] motion-reduce:transform-none"
                          aria-label={isPlaying ? tr("Pause devotional audio") : tr("Play devotional audio")}
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </button>

                        {/* Progress Bar */}
                        <div className="flex-1">
                          <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
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
                            aria-label={tr("Devotional audio progress")}
                            className="tbo-field h-1.5 w-full cursor-pointer appearance-none rounded-full"
                            style={{
                              background: `linear-gradient(to right, rgb(225 29 72) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgb(255 228 230) ${duration > 0 ? (currentTime / duration) * 100 : 0}%)`
                            }}
                          />
                        </div>
                      </div>

                      <p className="tbo-caption mt-3 text-center text-muted-foreground">

                        {tr("Listen together at your own pace")}
                      </p>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {onComplete && (
          <div className="flex-shrink-0 border-t border-[var(--glass-border)] bg-white/95 p-4 shadow-[0_-12px_35px_-28px_rgba(15,23,42,0.35)] backdrop-blur sm:p-5">
            <div className="mx-auto flex w-full max-w-3xl justify-end">
            <Button
              disabled={!!isCompleted}
              onClick={async () => {
                if (isCompleted) return;
                await onComplete();
                onClose();
              }}
              className="tbo-action h-12 w-full rounded-full px-6 shadow-lg transition-all duration-200 hover:shadow-xl disabled:bg-emerald-50 disabled:text-emerald-700 disabled:opacity-100 disabled:shadow-none sm:w-auto sm:min-w-56"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isCompleted ? tr("Completed") : tr("Mark as Complete")}
            </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
