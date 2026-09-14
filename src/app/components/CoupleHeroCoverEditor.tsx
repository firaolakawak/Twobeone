import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { coupleHeroCoverMessages } from '../locales/coupleHeroCover';
import { projectId } from '../utils/supabase/info';
import { useUiCopy } from '../utils/uiTranslation';
import { LoadingMark } from './BrandLoader';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import '../styles/profile-cover.css';

const COVER_API = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile`;
const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_COVER_BYTES = 10 * 1024 * 1024;

interface CoupleHeroCoverEditorProps {
  coverPicture?: string;
  accessToken: string;
  onCoverChange: (coverPicture: string | undefined) => void;
  onRefresh?: () => Promise<void> | void;
}

function readImageData(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Invalid image data'));
    reader.onerror = () => reject(reader.error ?? new Error('Image read failed'));
    reader.onabort = () => reject(new Error('Image read cancelled'));
    reader.readAsDataURL(file);
  });
}

export function CoupleHeroCoverEditor({ coverPicture, accessToken, onCoverChange, onRefresh }: CoupleHeroCoverEditorProps) {
  const tr = useUiCopy(coupleHeroCoverMessages);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ file: File; previewUrl: string } | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const [pending, setPending] = useState<'upload' | 'remove' | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const requestController = useRef<AbortController | null>(null);
  const helpId = useId();
  const errorId = useId();

  useEffect(() => () => {
    if (selected) URL.revokeObjectURL(selected.previewUrl);
  }, [selected]);

  useEffect(() => () => {
    requestController.current?.abort();
    requestController.current = null;
  }, []);

  const changeOpen = (nextOpen: boolean) => {
    if (pending) return;
    setSelected(null);
    setPreviewReady(false);
    setFailedCoverUrl(null);
    setErrorKey(null);
    setOpen(nextOpen);
  };

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || pending) return;
    setSelected(null);
    setPreviewReady(false);
    setErrorKey(null);
    if (!COVER_TYPES.includes(file.type)) {
      setErrorKey('Please choose a JPEG, PNG, WebP or GIF image.');
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setErrorKey('Choose an image no larger than 10 MB.');
      return;
    }
    try {
      setSelected({ file, previewUrl: URL.createObjectURL(file) });
    } catch {
      setErrorKey('Could not preview this image. Choose another photo.');
    }
  };

  const saveCover = async (action: 'upload' | 'remove') => {
    if (pending || (action === 'upload' && (!selected || !previewReady)) || (action === 'remove' && !coverPicture)) return;
    setPending(action);
    setErrorKey(null);
    const controller = new AbortController();
    requestController.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    try {
      const imageData = action === 'upload' ? await readImageData(selected!.file) : undefined;
      const response = await fetch(`${COVER_API}/${action === 'upload' ? 'upload-cover' : 'delete-cover'}`, {
        method: action === 'upload' ? 'POST' : 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}`, ...(action === 'upload' ? { 'Content-Type': 'application/json' } : {}) },
        ...(action === 'upload' ? { body: JSON.stringify({ imageData, fileName: selected!.file.name, contentType: selected!.file.type }) } : {}),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== true || (action === 'upload' && (typeof result.imageUrl !== 'string' || !result.imageUrl))) {
        throw new Error('Cover request failed');
      }
      onCoverChange(action === 'upload' ? result.imageUrl : undefined);
      let refreshFailed = false;
      try {
        await onRefresh?.();
      } catch {
        refreshFailed = true;
      }
      setSelected(null);
      setPreviewReady(false);
      setOpen(false);
      if (refreshFailed) toast.warning(tr('Your cover was updated, but your profile could not refresh.'));
      else toast.success(tr(action === 'upload' ? 'Cover updated.' : 'Cover removed.'));
    } catch {
      if (!controller.signal.aborted || requestController.current === controller) {
        toast.error(tr(action === 'upload' ? 'Could not save the cover. Please try again.' : 'Could not remove the cover. Please try again.'));
      }
    } finally {
      window.clearTimeout(timeout);
      if (requestController.current === controller) requestController.current = null;
      setPending(null);
    }
  };

  const previewUrl = selected?.previewUrl ?? (coverPicture !== failedCoverUrl ? coverPicture : undefined);

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="glass" size="icon" className="profile-cover-edit-button" aria-label={tr('Edit cover')} title={tr('Edit cover')} disabled={!!pending}>
          <ImagePlus aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="couple-cover-dialog max-h-[calc(100dvh-2rem)] overflow-y-auto"
        showCloseButton={!pending}
        aria-busy={!!pending}
        onEscapeKeyDown={event => { if (pending) event.preventDefault(); }}
        onInteractOutside={event => { if (pending) event.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="tbo-dialog-title">{tr('Edit cover')}</DialogTitle>
          <DialogDescription className="tbo-supporting">{tr('Choose a cover for your dashboard and profile, or use the soft gradient.')}</DialogDescription>
        </DialogHeader>
        <div className="couple-cover-preview overflow-hidden rounded-2xl border">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={tr(selected ? 'Selected cover preview' : 'Current cover preview')}
              className="aspect-[16/7] w-full object-cover"
              onLoad={() => { if (selected) setPreviewReady(true); }}
              onError={() => {
                if (selected) {
                  setSelected(null);
                  setPreviewReady(false);
                  setErrorKey('Could not preview this image. Choose another photo.');
                } else setFailedCoverUrl(coverPicture ?? null);
              }}
            />
          ) : (
            <div
              className="couple-cover-default-gradient aspect-[16/7] w-full"
              role="img"
              aria-label={tr('Default gradient cover')}
            />
          )}
        </div>
        <div className="grid min-w-0 gap-2">
          <input ref={fileInput} type="file" className="sr-only" accept={COVER_TYPES.join(',')} aria-label={tr('Choose cover photo')} aria-describedby={`${helpId}${errorKey ? ` ${errorId}` : ''}`} aria-invalid={!!errorKey} onChange={chooseFile} disabled={!!pending} tabIndex={-1} />
          <Button type="button" variant="outline" className="h-auto min-h-11 whitespace-normal" onClick={() => fileInput.current?.click()} disabled={!!pending}>{tr('Choose photo')}</Button>
          {selected && <p className="tbo-caption min-w-0 [overflow-wrap:anywhere]">{selected.file.name}</p>}
          <p id={helpId} className="tbo-caption text-muted-foreground">{tr('JPEG, PNG, WebP or GIF, up to 10 MB.')}</p>
          {errorKey && <p id={errorId} role="alert" className="tbo-supporting text-destructive">{tr(errorKey)}</p>}
        </div>
        <DialogFooter>
          {coverPicture && <Button type="button" variant="outline" className="h-auto min-h-11 whitespace-normal" disabled={!!pending} onClick={() => void saveCover('remove')}>
            {pending === 'remove' && <LoadingMark />}{tr(pending === 'remove' ? 'Removing...' : 'Remove cover')}
          </Button>}
          <Button type="button" variant="outline" className="h-auto min-h-11 whitespace-normal" disabled={!!pending} onClick={() => changeOpen(false)}>{tr('Cancel')}</Button>
          <Button type="button" className="h-auto min-h-11 whitespace-normal" disabled={!selected || !previewReady || !!pending} onClick={() => void saveCover('upload')}>
            {pending === 'upload' && <LoadingMark />}{tr(pending === 'upload' ? 'Saving...' : 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
