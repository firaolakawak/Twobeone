import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { setCurrentLanguage } from '../../utils/languageStore';
import { CoupleHeroCoverEditor } from '../CoupleHeroCoverEditor';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

const NativeURL = URL;
const OLD_COVER = 'https://example.com/current-cover.webp';
const NEW_COVER = 'https://example.com/new-cover.webp';
const fetchMock = vi.fn();
const response = (ok: boolean, body: object) => ({ ok, json: async () => body }) as Response;

function selectImage(file = new File(['image'], 'couple.png', { type: 'image/png' }), loaded = true) {
  fireEvent.change(screen.getByLabelText('Choose cover photo'), { target: { files: [file] } });
  const preview = screen.queryByRole('img', { name: 'Selected cover preview' });
  if (preview && loaded) fireEvent.load(preview);
}

function openEditor(options: { coverPicture?: string; onRefresh?: () => Promise<void> } = { coverPicture: OLD_COVER }) {
  const onCoverChange = vi.fn();
  render(<CoupleHeroCoverEditor accessToken="session-token" onCoverChange={onCoverChange} {...options} />);
  const trigger = screen.getByRole('button', { name: 'Edit cover' });
  fireEvent.click(trigger);
  return { onCoverChange, trigger };
}

describe('couple hero cover editor', () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentLanguage('en');
    vi.clearAllMocks();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('URL', class extends NativeURL {
      static createObjectURL = vi.fn(() => 'blob:cover-selection');
      static revokeObjectURL = vi.fn();
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('previews locally, uploads only on Save, locks pending actions, and returns focus after committing the cover', async () => {
    let finishUpload!: (value: Response) => void;
    fetchMock.mockImplementation(() => new Promise<Response>(resolve => { finishUpload = resolve; }));
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { onCoverChange, trigger } = openEditor({ onRefresh });
    expect(screen.getByRole('img', { name: 'Default gradient cover' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    selectImage();
    expect(screen.getByRole('img', { name: 'Selected cover preview' })).toHaveAttribute('src', 'blob:cover-selection');
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/profile/upload-cover'), expect.objectContaining({
      method: 'POST',
      headers: { Authorization: 'Bearer session-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData: 'data:image/png;base64,aW1hZ2U=', fileName: 'couple.png', contentType: 'image/png' }),
    }));
    expect(onCoverChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Choose photo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await act(async () => finishUpload(response(true, { success: true, imageUrl: NEW_COVER })));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onCoverChange).toHaveBeenCalledExactlyOnceWith(NEW_COVER);
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith('Cover updated.');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cover-selection');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('removes the existing cover through the authenticated delete endpoint', async () => {
    fetchMock.mockResolvedValue(response(true, { success: true, profile: { coverPicture: null } }));
    const { onCoverChange } = openEditor();
    expect(screen.getByRole('img', { name: 'Current cover preview' })).toHaveAttribute('src', OLD_COVER);
    fireEvent.click(screen.getByRole('button', { name: 'Remove cover' }));
    await waitFor(() => expect(onCoverChange).toHaveBeenCalledExactlyOnceWith(undefined));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/profile/delete-cover'), expect.objectContaining({ method: 'DELETE', headers: { Authorization: 'Bearer session-token' } }));
    expect(toast.success).toHaveBeenCalledWith('Cover removed.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each(['upload', 'remove'] as const)('keeps the saved cover when %s fails and allows retry or cancellation', async action => {
    fetchMock.mockResolvedValue(response(false, { error: 'Storage unavailable' }));
    const { onCoverChange, trigger } = openEditor();
    if (action === 'upload') selectImage();
    fireEvent.click(screen.getByRole('button', { name: action === 'upload' ? 'Save' : 'Remove cover' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(action === 'upload' ? 'Could not save the cover. Please try again.' : 'Could not remove the cover. Please try again.'));
    expect(onCoverChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(trigger);
    expect(screen.getByRole('img', { name: 'Current cover preview' })).toHaveAttribute('src', OLD_COVER);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('rejects unsupported and oversized files, and discards the local preview when cancelled', () => {
    const { onCoverChange, trigger } = openEditor();
    selectImage(new File(['svg'], 'cover.svg', { type: 'image/svg+xml' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please choose a JPEG, PNG, WebP or GIF image.');
    expect(URL.createObjectURL).not.toHaveBeenCalled();

    const oversizedFile = new File(['image'], 'large.png', { type: 'image/png' });
    Object.defineProperty(oversizedFile, 'size', { value: 10 * 1024 * 1024 + 1 });
    selectImage(oversizedFile);
    expect(screen.getByRole('alert')).toHaveTextContent('Choose an image no larger than 10 MB.');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    selectImage();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Selected cover preview' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cover-selection');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onCoverChange).not.toHaveBeenCalled();
    fireEvent.click(trigger);
    expect(screen.getByRole('img', { name: 'Current cover preview' })).toHaveAttribute('src', OLD_COVER);
    expect(screen.queryByText('couple.png')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('uses the gradient for an unavailable saved image and blocks an unreadable selected image', () => {
    openEditor();
    fireEvent.error(screen.getByRole('img', { name: 'Current cover preview' }));
    expect(screen.getByRole('img', { name: 'Default gradient cover' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove cover' })).toBeEnabled();
    selectImage(undefined, false);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.error(screen.getByRole('img', { name: 'Selected cover preview' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Could not preview this image. Choose another photo.');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('img', { name: 'Default gradient cover' })).toBeVisible();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cover-selection');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps a successful cover update when the subsequent profile refresh fails', async () => {
    fetchMock.mockResolvedValue(response(true, { success: true, imageUrl: NEW_COVER }));
    const { onCoverChange } = openEditor({ coverPicture: OLD_COVER, onRefresh: vi.fn().mockRejectedValue(new Error('Profile temporarily unavailable')) });
    selectImage();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith('Your cover was updated, but your profile could not refresh.'));
    expect(onCoverChange).toHaveBeenCalledExactlyOnceWith(NEW_COVER);
    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
