import { formatUiDate } from '../../utils/uiDateTime';
import { BrandLoader, LoadingMark } from '../BrandLoader';
import { useCurrentLanguage } from '../../utils/languageStore';
import { UI_LOCALES, useUiCopy } from "../../utils/uiTranslation";
import { adminToolsMessages } from "../../locales/adminTools";
import { useState, useEffect, useRef } from 'react';
import { Upload, X, Trash2, Image as ImageIcon, Download, Eye, RefreshCw } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface Screenshot {
  id: string;
  filename: string;
  url: string;
  type: string;
  uploadedAt: string;
  size: number;
  contentType: string;
}

interface ScreenshotUploaderProps {
  accessToken?: string;
}

export function ScreenshotUploader({ accessToken }: ScreenshotUploaderProps) {
  const tr = useUiCopy(adminToolsMessages);
  const language = useCurrentLanguage();
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('hero');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadScreenshots();
  }, []);

  const loadScreenshots = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/landing/screenshots`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const { screenshots: loadedScreenshots } = await response.json();
        setScreenshots(loadedScreenshots || []);
      }
    } catch (error) {
      console.error('Failed to load screenshots:', error);
      toast.error(tr("Failed to load screenshots"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(tr("Please select an image file"));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5242880) {
      toast.error(tr("Image size must be less than 5MB"));
      return;
    }

    await uploadScreenshot(file);
  };

  const uploadScreenshot = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', selectedType);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/landing/screenshots/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const { screenshot } = await response.json();
        toast.success(tr("Screenshot uploaded successfully!"));
        setScreenshots([...screenshots, screenshot]);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Failed to upload screenshot:', error);
      toast.error(tr('Failed to upload screenshot'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tr("Are you sure you want to delete this screenshot?"))) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/landing/screenshots/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        toast.success(tr("Screenshot deleted successfully"));
        setScreenshots(screenshots.filter(s => s.id !== id));
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Failed to delete screenshot:', error);
      toast.error(tr("Failed to delete screenshot"));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hero': return 'bg-primary-100 text-primary-700';
      case 'devotional': return 'bg-violet-100 text-violet-700';
      case 'prayer': return 'bg-rose-100 text-rose-700';
      case 'sync': return 'bg-amber-100 text-amber-700';
      case 'feature': return 'bg-sky-100 text-sky-700';
      case 'testimonial': return 'bg-success-50 text-success-700';
      default: return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary-600" />
            <h3 className="tbo-section-title ">{tr("Upload Screenshot")}</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadScreenshots}
            disabled={isLoading}
          >
            {isLoading ? <LoadingMark className="mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {tr("Refresh")}</Button>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-4">
          <p className="tbo-supporting text-sky-700">
            📸 <strong>{tr("Upload App Screenshots")}</strong> {tr("- Add high-quality screenshots of your app to display on the landing page. Recommended: Mobile screenshots in portrait orientation (PNG or JPG, max 5MB)")}</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="tbo-label mb-2 block">{tr("Screenshot Type")}</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">{tr("Hero Section")}</SelectItem>
                  <SelectItem value="devotional">{tr("Mobile Mockup · Daily Devotional")}</SelectItem>
                  <SelectItem value="prayer">{tr("Mobile Mockup · Shared Prayer")}</SelectItem>
                  <SelectItem value="sync">{tr("Mobile Mockup · Couple Sync")}</SelectItem>
                  <SelectItem value="feature">{tr("Feature Showcase")}</SelectItem>
                  <SelectItem value="testimonial">{tr("Testimonial Section")}</SelectItem>
                  <SelectItem value="general">{tr("General")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="tbo-label mb-2 block">{tr("Upload Image")}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <LoadingMark className="mr-2" />
                    {tr("Uploading...")}</>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {tr("Choose File")}</>
                )}
              </Button>
            </div>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="tbo-supporting text-muted-foreground mb-1">
              {tr("Click \"Choose File\" to upload or drag and drop")}</p>
            <p className="tbo-caption text-muted-foreground">
              {tr("PNG, JPG up to 5MB")}</p>
          </div>
        </div>
      </Card>

      {/* Screenshots Gallery */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="tbo-section-title ">{tr('Uploaded screenshots ({count})', { count: screenshots.length })}</h3>
          {screenshots.length > 0 && (
            <Badge className="tbo-caption px-3 py-1">{tr('{count} images', { count: screenshots.length })}</Badge>
          )}
        </div>

        {isLoading ? (
          <BrandLoader className="py-12" label={tr("Loading screenshots…")} />
        ) : screenshots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="tbo-body mb-1">{tr("No screenshots uploaded yet")}</p>
            <p className="tbo-supporting ">{tr("Upload your first screenshot to get started")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {screenshots.map((screenshot) => (
              <div
                key={screenshot.id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-[9/16] bg-muted">
                  <img
                    src={screenshot.url}
                    alt={screenshot.filename}
                    className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewImage(screenshot.url)}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => setPreviewImage(screenshot.url)}
                      aria-label={tr("Preview {name}", { name: screenshot.filename })}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDelete(screenshot.id)}
                      aria-label={tr("Delete {name}", { name: screenshot.filename })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <Badge className={getTypeColor(screenshot.type)}>
                    {tr(({ hero: 'Hero Section', devotional: 'Mobile Mockup · Daily Devotional', prayer: 'Mobile Mockup · Shared Prayer', sync: 'Mobile Mockup · Couple Sync', feature: 'Feature Showcase', testimonial: 'Testimonial Section', general: 'General' } as Record<string,string>)[screenshot.type] || screenshot.type)}
                  </Badge>
                  <p className="tbo-caption truncate" title={screenshot.filename}>
                    {screenshot.filename}
                  </p>
                  <div className="tbo-caption flex items-center justify-between text-muted-foreground">
                    <span>{formatFileSize(screenshot.size)}</span>
                    <span>{formatUiDate(new Date(screenshot.uploadedAt), UI_LOCALES[language])}</span>
                  </div>
                  <a
                    href={screenshot.url}
                    download={screenshot.filename}
                    className="tbo-action text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    {tr("Download")}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <Button
              variant="secondary"
              size="sm"
              className="absolute -top-12 right-0"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-4 h-4 mr-2" />
              {tr("Close")}</Button>
            <img
              src={previewImage}
              alt={tr("Preview")}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
