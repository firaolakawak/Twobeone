import { useCallback, useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { prayerUiMessages } from '../locales/prayerUi';
import { getHalfTextPreview } from '../utils/contentPreview';
import { formatUiDateTime } from '../utils/uiDateTime';
import { UI_LOCALES, useUiCopy } from '../utils/uiTranslation';
import { useLanguage } from '../contexts/LanguageContext';
import { BrandLoader, LoadingMark } from './BrandLoader';
import { Button } from './ui/button';
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
  isOpen: boolean;
  isContentExpanded: boolean;
  latestComment?: PrayerComment | null;
  onOpen: () => void;
  onLoadComments: (prayerId: string) => Promise<PrayerComment[]>;
  onLoadLatestComment: (prayerId: string) => Promise<PrayerComment | null>;
  onAddComment: (prayerId: string, content: string) => Promise<PrayerComment>;
  onLatestCommentChange?: (prayerId: string, comment: PrayerComment | null) => void;
  actions?: React.ReactNode;
}

const MAX_COMMENT_LENGTH = 2000;

function firstName(name: string) {
  return name.trim().split(/\s+/u)[0] || name.trim();
}

function shortCommentPreview(content: string, maxCharacters = 120) {
  const normalized = content.replace(/\s+/g, ' ').trim();
  const characters = Array.from(normalized);
  return characters.length > maxCharacters
    ? `${characters.slice(0, maxCharacters - 1).join('')}…`
    : normalized;
}

interface PrayerCommentComposerProps {
  prayerId: string;
  onAddComment: (prayerId: string, content: string) => Promise<PrayerComment>;
  onCommentAdded?: (prayerId: string, comment: PrayerComment) => void;
}

export function PrayerCommentComposer({
  prayerId,
  onAddComment,
  onCommentAdded,
}: PrayerCommentComposerProps) {
  const tr = useUiCopy(prayerUiMessages);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;

    setIsSending(true);
    try {
      const comment = await onAddComment(prayerId, content);
      onCommentAdded?.(prayerId, comment);
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

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 items-end gap-2">
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={MAX_COMMENT_LENGTH}
        rows={1}
        placeholder={tr('Add a comment')}
        aria-label={tr('Add a comment')}
        className="tbo-field max-h-28 min-h-12 min-w-0 flex-1 resize-none rounded-full border-[var(--glass-border)] bg-[var(--glass-inset-surface)] px-5 py-3"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!draft.trim() || isSending}
        aria-label={isSending ? tr('Sending...') : tr('Add comment')}
        title={isSending ? tr('Sending...') : tr('Add comment')}
        className="tbo-action h-12 w-12 shrink-0 rounded-full"
      >
        {isSending ? <LoadingMark size={18} /> : <Send className="h-5 w-5" aria-hidden="true" />}
      </Button>
    </form>
  );
}

export function PrayerComments({
  id,
  prayerId,
  prayerTitle,
  isOpen,
  isContentExpanded,
  latestComment,
  onOpen,
  onLoadComments,
  onLoadLatestComment,
  onAddComment,
  onLatestCommentChange,
  actions,
}: PrayerCommentsProps) {
  const tr = useUiCopy(prayerUiMessages);
  const { language } = useLanguage();
  const [comments, setComments] = useState<PrayerComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<'session' | 'load' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRequestStarted = useRef(false);
  const fullThreadLoadStarted = useRef(false);

  const loadComments = useCallback(async () => {
    fullThreadLoadStarted.current = true;
    setIsLoading(true);
    setLoadError(null);
    try {
      const loadedComments = await onLoadComments(prayerId);
      setComments(loadedComments);
      setHasLoaded(true);
      onLatestCommentChange?.(prayerId, loadedComments.at(-1) ?? null);
    } catch (error) {
      console.error('Failed to load prayer comments', error);
      setLoadError(error instanceof Error && error.message === 'Unauthorized' ? 'session' : 'load');
    } finally {
      setIsLoading(false);
    }
  }, [onLatestCommentChange, onLoadComments, prayerId]);

  useEffect(() => {
    if (isOpen && !hasLoaded && !isLoading && !loadError) void loadComments();
  }, [hasLoaded, isLoading, isOpen, loadComments, loadError]);

  useEffect(() => {
    if (isOpen || latestComment !== undefined || previewRequestStarted.current) return;

    const loadPreview = () => {
      if (previewRequestStarted.current) return;
      previewRequestStarted.current = true;
      void onLoadLatestComment(prayerId)
        .then((comment) => {
          if (!fullThreadLoadStarted.current) onLatestCommentChange?.(prayerId, comment);
        })
        .catch((error) => {
          // Preview metadata is optional. Opening the thread still performs the
          // normal load and exposes its retry state if this lightweight request fails.
          console.error('Failed to load prayer comment preview', error);
        });
    };

    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') {
      loadPreview();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      loadPreview();
    }, { rootMargin: '200px 0px' });
    observer.observe(container);
    return () => observer.disconnect();
  }, [isOpen, latestComment, onLatestCommentChange, onLoadLatestComment, prayerId]);

  const handleCommentAdded = (addedPrayerId: string, comment: PrayerComment) => {
    setComments((current) => current.some((entry) => entry.id === comment.id)
      ? current
      : [...current, comment]);
    onLatestCommentChange?.(addedPrayerId, comment);
  };

  const previewTimeId = `${id}-preview-time`;
  const previewDescriptionId = `${id}-preview-description`;
  const showLoading = isOpen && !loadError && (isLoading || !hasLoaded);
  const visibleLatestComment = latestComment
    ? (isContentExpanded ? latestComment.content : getHalfTextPreview(latestComment.content))
    : '';
  const latestCommenterFirstName = latestComment ? firstName(latestComment.userName) : '';

  return (
    <div ref={containerRef} className="min-w-0 space-y-3">
      {!isOpen && latestComment ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={tr('Open comment from {name}', { name: latestCommenterFirstName })}
          aria-describedby={`${previewTimeId} ${previewDescriptionId}`}
          aria-controls={id}
          aria-expanded={false}
          className="min-h-11 w-full min-w-0 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[var(--glass-inset-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glass-accent)]"
        >
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="tbo-caption min-w-0 max-w-full break-words text-foreground">{latestCommenterFirstName}</span>
            <time id={previewTimeId} className="tbo-caption ml-auto max-w-full text-right text-muted-foreground" dateTime={latestComment.createdAt}>
              {formatUiDateTime(new Date(latestComment.createdAt), UI_LOCALES[language], {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </time>
          </span>
          <span className="tbo-supporting mt-1 block whitespace-pre-wrap break-words text-foreground">
            {visibleLatestComment}
          </span>
          <span id={previewDescriptionId} className="sr-only">
            {shortCommentPreview(visibleLatestComment)}
          </span>
        </button>
      ) : null}

      <section
        id={id}
        role="region"
        tabIndex={-1}
        hidden={!isOpen}
        aria-label={tr('Comments on {title}', { title: prayerTitle })}
        className="min-w-0"
      >
        {isOpen && (showLoading ? (
          <BrandLoader label={tr('Loading comments...')} size={32} className="justify-center py-3" />
        ) : loadError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 py-2" role="alert">
            <p className="tbo-supporting text-muted-foreground">
              {loadError === 'session'
                ? tr('Your session expired. Please sign in again.')
                : tr('Failed to load comments')}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={() => void loadComments()} className="tbo-action min-h-11 rounded-full text-[var(--glass-accent)]">
              {tr('Retry')}
            </Button>
          </div>
        ) : comments.length > 0 ? (
          <ol className="divide-y divide-[var(--glass-border)]" aria-label={tr('Prayer comments')}>
            {comments.map((comment) => (
              <li key={comment.id} className="min-w-0 py-3 first:pt-1 last:pb-1">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="tbo-caption min-w-0 break-words text-foreground">{firstName(comment.userName)}</span>
                  <time className="tbo-caption ml-auto text-muted-foreground" dateTime={comment.createdAt}>
                    {formatUiDateTime(new Date(comment.createdAt), UI_LOCALES[language], {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <p className="tbo-supporting mt-1 whitespace-pre-wrap break-words text-foreground">{comment.content}</p>
              </li>
            ))}
          </ol>
        ) : null)}
      </section>

      {actions}

      <div hidden={!isOpen && !latestComment}>
        <PrayerCommentComposer
          prayerId={prayerId}
          onAddComment={onAddComment}
          onCommentAdded={handleCommentAdded}
        />
      </div>
    </div>
  );
}
