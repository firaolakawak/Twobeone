import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { prayerUiMessages } from '../locales/prayerUi';
import { formatUiDateTime } from '../utils/uiDateTime';
import { UI_LOCALES, useUiCopy } from '../utils/uiTranslation';
import { useLanguage } from '../contexts/LanguageContext';
import { BrandLoader, LoadingMark } from './BrandLoader';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

export interface PrayerComment {
  id: string;
  prayerId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  isMine?: boolean;
}

interface PrayerCommentsProps {
  id: string;
  prayerId: string;
  prayerTitle: string;
  onLoadComments: (prayerId: string) => Promise<PrayerComment[]>;
  onAddComment: (prayerId: string, content: string) => Promise<PrayerComment>;
}

const MAX_COMMENT_LENGTH = 2000;

export function PrayerComments({
  id,
  prayerId,
  prayerTitle,
  onLoadComments,
  onAddComment,
}: PrayerCommentsProps) {
  const tr = useUiCopy(prayerUiMessages);
  const { language } = useLanguage();
  const [comments, setComments] = useState<PrayerComment[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<'session' | 'load' | null>(null);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setComments(await onLoadComments(prayerId));
    } catch (error) {
      console.error('Failed to load prayer comments', error);
      setLoadError(error instanceof Error && error.message === 'Unauthorized' ? 'session' : 'load');
    } finally {
      setIsLoading(false);
    }
  }, [onLoadComments, prayerId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;

    setIsSending(true);
    try {
      const comment = await onAddComment(prayerId, content);
      setComments((current) => current.some((entry) => entry.id === comment.id)
        ? current
        : [...current, comment]);
      setDraft('');
      toast.success(tr('Comment added!'));
    } catch (error) {
      console.error('Failed to add prayer comment', error);
      toast.error(
        error instanceof Error && error.message === 'Unauthorized'
          ? tr('Your session expired. Please sign in again.')
          : tr('Failed to add comment'),
      );
    } finally {
      setIsSending(false);
    }
  };

  const inputId = `${id}-input`;

  return (
    <section
      id={id}
      role="region"
      aria-label={tr('Comments on {title}', { title: prayerTitle })}
      className="overflow-hidden rounded-2xl border border-[var(--glass-border)] tbo-glass-inset shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--glass-border)] bg-[var(--glass-inset-surface)] px-4 py-3">
        <MessageCircle className="h-4 w-4 text-[var(--glass-accent)]" aria-hidden="true" />
        <h4 className="tbo-label text-foreground">{tr('Prayer comments')}</h4>
        {!isLoading && !loadError && (
          <span className="tbo-caption ml-auto rounded-full bg-[var(--glass-inset-surface)] px-2 py-0.5 text-muted-foreground ring-1 ring-[var(--glass-rim)]">
            {comments.length}
          </span>
        )}
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <BrandLoader label={tr('Loading comments...')} size={36} className="min-h-28 justify-center" />
        ) : loadError ? (
          <div className="flex min-h-28 flex-col items-center justify-center gap-3 text-center" role="alert">
            <p className="tbo-supporting text-muted-foreground">
              {loadError === 'session'
                ? tr('Your session expired. Please sign in again.')
                : tr('Failed to load comments')}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadComments()} className="tbo-action min-h-11 rounded-full border-[var(--glass-border)]">
              {tr('Retry')}
            </Button>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-5 text-center">
            <p className="tbo-label text-foreground">{tr('No comments yet')}</p>
            <p className="tbo-supporting mt-1 text-muted-foreground">
              {tr('Be the first to leave encouragement on this prayer.')}
            </p>
          </div>
        ) : (
          <ol className="max-h-80 space-y-3 overflow-y-auto pr-1" aria-label={tr('Prayer comments')}>
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-inset-surface)] px-3.5 py-3 ring-1 ring-[var(--glass-rim)]">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="tbo-label break-words text-foreground">{comment.userName}</span>
                  <time className="tbo-caption text-muted-foreground" dateTime={comment.createdAt}>
                    {formatUiDateTime(new Date(comment.createdAt), UI_LOCALES[language], {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <p className="tbo-body mt-1 whitespace-pre-wrap break-words text-foreground">{comment.content}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {!loadError && !isLoading && (
        <form onSubmit={handleSubmit} className="border-t border-[var(--glass-border)] bg-[var(--glass-inset-surface)] p-4">
          <Label htmlFor={inputId} className="tbo-label">{tr('Add a comment')}</Label>
          <Textarea
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            rows={2}
            placeholder={tr('Share encouragement or an update...')}
            className="tbo-field mt-2 min-h-20 resize-y rounded-xl border-[var(--glass-border)] bg-[var(--glass-inset-surface)]"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span
              className="tbo-caption text-muted-foreground"
              aria-label={tr('{count} of {max} characters', { count: draft.length, max: MAX_COMMENT_LENGTH })}
            >
              {draft.length}/{MAX_COMMENT_LENGTH}
            </span>
            <Button
              type="submit"
              disabled={!draft.trim() || isSending}
              className="tbo-action min-h-11 rounded-full px-4"
            >
              {isSending ? <LoadingMark size={18} /> : <Send className="h-4 w-4" aria-hidden="true" />}
              {isSending ? tr('Sending...') : tr('Add comment')}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
