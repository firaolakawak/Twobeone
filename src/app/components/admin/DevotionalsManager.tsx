import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Calendar, BookOpen, RefreshCw, Upload, Music, X, Play, Pause, Copy, FileJson, CheckCircle2, SlidersHorizontal, Headphones, Languages, Sparkles, ArrowUpDown, Eye, Library } from 'lucide-react';
import { DevotionalsImportExport } from './DevotionalsImportExport';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useContentLanguage } from '../../contexts/ContentLanguageContext';
import { ContentLanguageSelector } from './ContentLanguageSelector';
import { DevotionalsWorkspace } from './devotionals/DevotionalsWorkspace';
import '../../styles/devotionals-console.css';

export interface Devotional {
  id: string;
  date: string;
  title: string;
  verse: string;
  reference: string;
  reflection: string;
  prayerPrompt: string;
  tags: string[];
  status: 'published' | 'draft';
  audioUrl?: string;
  audioFileName?: string;
  language?: 'en' | 'am' | 'om';
}

interface DevotionalsManagerProps {
  accessToken?: string;
}

export function DevotionalsManager({ accessToken }: DevotionalsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDevotional, setEditingDevotional] = useState<Devotional | null>(null);
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'en' | 'am' | 'om'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [uploadingAudioFor, setUploadingAudioFor] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const contentLanguage = useContentLanguage();

  // Upload JSON dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadLanguage, setUploadLanguage] = useState<'en' | 'am' | 'om'>('am');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<any[] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadOverwrite, setUploadOverwrite] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<{ created: number; updated: number; skipped: number } | null>(null);

  useEffect(() => {
    loadDevotionals();
  }, []);

  const loadDevotionals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/devotionals/list`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const { devotionals: apiDevotionals } = await response.json();
        
        // If backend has devotionals, use them; otherwise use static data
        if (apiDevotionals && apiDevotionals.length > 0) {
          setDevotionals(apiDevotionals.map((d: any) => ({
            id: d.id,
            date: d.date || new Date().toISOString().split('T')[0],
            title: d.title,
            verse: d.verse,
            reference: d.reference || d.verseReference || '',
            reflection: d.reflection || '',
            prayerPrompt: d.prayerPrompt || '',
            tags: d.tags || [],
            status: d.status || 'published',
            audioUrl: d.audioUrl,
            audioFileName: d.audioFileName,
            language: d.language || 'en'
          })));
        } else {
          setDevotionals([]);
        }
      }
    } catch (error) {
      console.error('Failed to load devotionals:', error);
      toast.error('Failed to load devotionals');
      setDevotionals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const [formData, setFormData] = useState<Partial<Devotional>>({
    title: '',
    verse: '',
    reference: '',
    reflection: '',
    prayerPrompt: '',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    status: 'draft',
  });

  const handleEdit = (devotional: Devotional) => {
    setEditingDevotional(devotional);
    setFormData(devotional);
    contentLanguage.setContentLanguage(devotional.language ?? 'en');
    setIsDialogOpen(true);
  };

  const handleDuplicate = (devotional: Devotional) => {
    setEditingDevotional(null); // treat as new
    contentLanguage.setContentLanguage(devotional.language ?? 'en');
    setFormData({
      title: `Copy of ${devotional.title}`,
      verse: devotional.verse,
      reference: devotional.reference,
      reflection: devotional.reflection,
      prayerPrompt: devotional.prayerPrompt,
      date: new Date().toISOString().split('T')[0],
      tags: [...(devotional.tags || [])],
      status: 'draft',
      // audioUrl intentionally excluded — audio stays on original
    });
    setIsDialogOpen(true);
    toast.info('Devotional duplicated — review and save as a new draft.');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this devotional?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/devotionals/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        setDevotionals(devotionals.filter(d => d.id !== id));
        toast.success('Devotional deleted successfully');
      } else {
        throw new Error('Failed to delete devotional');
      }
    } catch (error) {
      console.error('Failed to delete devotional:', error);
      toast.error('Failed to delete devotional');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add content language to form data
    const submissionData = {
      ...formData,
      language: contentLanguage.contentLanguage
    };
    
    try {
      if (editingDevotional) {
        // Update existing
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/devotionals/${editingDevotional.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken || publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
          }
        );

        if (response.ok) {
          setDevotionals(devotionals.map(d => 
            d.id === editingDevotional.id ? { ...d, ...submissionData } as Devotional : d
          ));
          toast.success('Devotional updated successfully');
        } else {
          throw new Error('Failed to update devotional');
        }
      } else {
        // Create new
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/devotionals`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken || publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
          }
        );

        if (response.ok) {
          const { devotionalId } = await response.json();
          const newDevotional: Devotional = {
            ...submissionData,
            id: devotionalId,
          } as Devotional;
          setDevotionals([newDevotional, ...devotionals]);
          toast.success('Devotional created successfully');
        } else {
          throw new Error('Failed to create devotional');
        }
      }

      setIsDialogOpen(false);
      setEditingDevotional(null);
      setFormData({
        title: '',
        verse: '',
        reference: '',
        reflection: '',
        prayerPrompt: '',
        date: new Date().toISOString().split('T')[0],
        tags: [],
        status: 'draft',
      });
      
      // Reload devotionals from backend
      loadDevotionals();
    } catch (error) {
      console.error('Failed to save devotional:', error);
      toast.error('Failed to save devotional');
    }
  };

  const handleAudioUpload = async (devotionalId: string, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setUploadingAudioFor(devotionalId);
    console.log('Starting audio upload:', {
      devotionalId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/devotionals/${devotionalId}/audio`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Audio upload failed:', error);
        throw new Error(error.details || error.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('Audio upload successful:', result);
      const { audioUrl, fileName } = result;
      
      // Update devotional in state
      setDevotionals(devotionals.map(d => 
        d.id === devotionalId 
          ? { ...d, audioUrl, audioFileName: fileName } 
          : d
      ));

      toast.success('Audio uploaded successfully! 🎵');
      await loadDevotionals(); // Refresh to get updated data
    } catch (error: any) {
      console.error('Audio upload error:', error);
      toast.error(error.message || 'Failed to upload audio');
    } finally {
      setUploadingAudioFor(null);
    }
  };

  const handleDeleteAudio = async (devotionalId: string) => {
    if (!confirm('Are you sure you want to delete this audio file?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/devotionals/${devotionalId}/audio`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete audio');
      }

      // Update devotional in state
      setDevotionals(devotionals.map(d => 
        d.id === devotionalId 
          ? { ...d, audioUrl: undefined, audioFileName: undefined } 
          : d
      ));

      toast.success('Audio deleted successfully');
      await loadDevotionals(); // Refresh
    } catch (error) {
      console.error('Failed to delete audio:', error);
      toast.error('Failed to delete audio');
    }
  };

  const toggleAudioPreview = (audioUrl: string | null) => {
    if (!audioRef.current) return;

    if (audioPreviewUrl === audioUrl && isPlayingPreview) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      if (audioUrl && audioRef.current.src !== audioUrl) {
        audioRef.current.src = audioUrl;
      }
      audioRef.current.play();
      setAudioPreviewUrl(audioUrl);
      setIsPlayingPreview(true);
    }
  };

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadData(null);
    setUploadError(null);
    setUploadSummary(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const raw = json.devotionals ?? (Array.isArray(json) ? json : null);
        if (!raw) throw new Error('JSON must contain a "devotionals" array');
        const stamped = raw.map((d: any) => ({
          ...d,
          language: uploadLanguage,
          id: d.id.startsWith(`${uploadLanguage}-`) ? d.id : `${uploadLanguage}-${d.id}`,
        }));
        setUploadData(stamped);
      } catch (err: any) {
        setUploadError(err.message || 'Invalid JSON');
      }
    };
    reader.readAsText(file);
  };

  const handleUploadSave = async () => {
    if (!uploadData?.length) return;
    setIsUploading(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/devotionals/import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
          body: JSON.stringify({ devotionals: uploadData, overwrite: uploadOverwrite }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const { summary } = await res.json();
      setUploadSummary(summary);
      toast.success(`Saved: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped`);
      loadDevotionals();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDevotionals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return devotionals
      .filter((devotional) => {
        const matchesSearch = !query ||
          devotional.title?.toLowerCase().includes(query) ||
          devotional.reference?.toLowerCase().includes(query) ||
          devotional.verse?.toLowerCase().includes(query) ||
          devotional.tags?.some((tag) => tag.toLowerCase().includes(query));
        const matchesStatus = statusFilter === 'all' || devotional.status === statusFilter;
        const matchesLanguage = languageFilter === 'all' || (devotional.language ?? 'en') === languageFilter;
        return matchesSearch && matchesStatus && matchesLanguage;
      })
      .sort((a, b) => {
        if (sortOrder === 'title') return a.title.localeCompare(b.title);
        const difference = new Date(b.date).getTime() - new Date(a.date).getTime();
        return sortOrder === 'newest' ? difference : -difference;
      });
  }, [devotionals, languageFilter, searchQuery, sortOrder, statusFilter]);

  const selectedDevotional =
    filteredDevotionals.find((devotional) => devotional.id === selectedId) ??
    filteredDevotionals[0] ??
    null;

  const publishedCount = devotionals.filter((devotional) => devotional.status === 'published').length;
  const draftCount = devotionals.filter((devotional) => devotional.status === 'draft').length;
  const audioCount = devotionals.filter((devotional) => devotional.audioUrl).length;

  const openNewDevotional = () => {
    setEditingDevotional(null);
    setFormData({
      title: '', verse: '', reference: '', reflection: '', prayerPrompt: '',
      date: new Date().toISOString().split('T')[0], tags: [], status: 'draft',
    });
    setIsDialogOpen(true);
  };

  // The upgraded console keeps the existing API and mutation handlers while
  // moving the editorial experience into a focused, reusable workspace.
  return (
      <DevotionalsWorkspace
        devotionals={devotionals}
        filteredDevotionals={filteredDevotionals}
        selectedDevotional={selectedDevotional}
        selectedId={selectedId}
        onSelect={setSelectedId}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        languageFilter={languageFilter}
        onLanguageFilterChange={setLanguageFilter}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        publishedCount={publishedCount}
        draftCount={draftCount}
        audioCount={audioCount}
        onRefresh={loadDevotionals}
        onNew={openNewDevotional}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onAudioUpload={handleAudioUpload}
        onAudioDelete={handleDeleteAudio}
        onAudioToggle={toggleAudioPreview}
        uploadingAudioFor={uploadingAudioFor}
        audioPreviewUrl={audioPreviewUrl}
        isPlayingPreview={isPlayingPreview}
        audioRef={audioRef}
        onAudioEnded={() => setIsPlayingPreview(false)}
        editorOpen={isDialogOpen}
        onEditorOpenChange={setIsDialogOpen}
        editingDevotional={editingDevotional}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        toolsOpen={isToolsOpen}
        onToolsOpenChange={setIsToolsOpen}
        tools={
          <DevotionalsImportExport
            devotionals={devotionals}
            accessToken={accessToken}
            onImportComplete={loadDevotionals}
          />
        }
      />
    );

  /* Previous console retained temporarily below for migration reference. */
  return (
    <div className="space-y-6">
      {/* Hidden audio player for previews */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlayingPreview(false)}
        onPause={() => setIsPlayingPreview(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-[24px]">Daily Devotionals</h2>
          <p className="text-sm text-muted-foreground text-[15px]">Manage daily devotional content for couples</p>
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          {/* Upload JSON button */}
          <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
            setIsUploadDialogOpen(open);
            if (!open) { setUploadFile(null); setUploadData(null); setUploadError(null); setUploadSummary(null); }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-sm border-primary-300 text-primary-700 hover:bg-primary-50">
                <Upload className="w-4 h-4 mr-2" />
                Upload JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg w-full">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                  <FileJson className="w-5 h-5 text-primary-600" />
                  Upload Devotionals JSON
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Select the content language, then upload a JSON file to save devotionals to the database.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Language selector */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Content Language</Label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { code: 'en' as const, label: 'English', flag: '🇺🇸' },
                      { code: 'am' as const, label: 'Amharic — አማርኛ', flag: '🇪🇹' },
                      { code: 'om' as const, label: 'Afan Oromo', flag: '🇪🇹' },
                    ]).map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setUploadLanguage(lang.code);
                          if (uploadData) {
                            setUploadData(uploadData.map((d: any) => ({
                              ...d,
                              language: lang.code,
                              id: d.id.replace(/^(en|am|om)-/, `${lang.code}-`),
                            })));
                          }
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${uploadLanguage === lang.code ? 'var(--primary-500)' : 'var(--border)'}`,
                          backgroundColor: uploadLanguage === lang.code ? 'var(--primary-50)' : 'transparent',
                          color: uploadLanguage === lang.code ? 'var(--primary-700)' : 'var(--neutral-600)',
                          fontSize: 'var(--text-callout)',
                          fontWeight: uploadLanguage === lang.code ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <span>{lang.flag}</span><span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* File drop zone */}
                <div
                  onClick={() => uploadFileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) {
                      const dt = new DataTransfer(); dt.items.add(f);
                      if (uploadFileRef.current) { uploadFileRef.current.files = dt.files; uploadFileRef.current.dispatchEvent(new Event('change', { bubbles: true })); }
                    }
                  }}
                  style={{
                    border: `2px dashed ${uploadError ? 'var(--error-400)' : uploadData ? 'var(--success-400)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-6)',
                    textAlign: 'center', cursor: 'pointer',
                    backgroundColor: uploadData ? 'var(--success-50)' : 'var(--neutral-50)',
                    transition: 'all 0.15s',
                  }}
                >
                  {uploadData ? (
                    <CheckCircle2 className="w-9 h-9 mx-auto mb-2 text-success-600" />
                  ) : (
                    <FileJson className="w-9 h-9 mx-auto mb-2" style={{ color: 'var(--neutral-400)' }} />
                  )}
                  <p className="text-sm font-medium" style={{ color: 'var(--neutral-700)' }}>
                    {uploadFile ? uploadFile.name : 'Drop JSON file here or click to browse'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--neutral-400)' }}>
                    {uploadData
                      ? `${uploadData.length} devotional${uploadData.length !== 1 ? 's' : ''} ready — language: ${uploadLanguage.toUpperCase()}`
                      : 'Accepts .json in TwoBeOne export format'}
                  </p>
                </div>
                <input ref={uploadFileRef} type="file" accept=".json" className="hidden" onChange={handleUploadFileChange} />

                {uploadError && (
                  <p className="text-xs text-error-600 bg-error-50 rounded-md p-3 border border-error-200">{uploadError}</p>
                )}

                {/* Overwrite toggle */}
                {uploadData && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--neutral-700)' }}>
                    <input
                      type="checkbox"
                      checked={uploadOverwrite}
                      onChange={e => setUploadOverwrite(e.target.checked)}
                      style={{ accentColor: 'var(--primary-500)' }}
                    />
                    Overwrite existing devotionals with same ID
                  </label>
                )}

                {/* Success summary */}
                {uploadSummary && (
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { label: 'Created', val: uploadSummary.created, color: 'var(--success-700)', bg: 'var(--success-50)' },
                      { label: 'Updated', val: uploadSummary.updated, color: 'var(--sky-700)', bg: 'var(--sky-50)' },
                      { label: 'Skipped', val: uploadSummary.skipped, color: 'var(--neutral-500)', bg: 'var(--neutral-100)' },
                    ].map(s => (
                      <div key={s.label} style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', backgroundColor: s.bg }}>
                        <p className="text-xl font-bold" style={{ color: s.color }}>{s.val}</p>
                        <p className="text-xs" style={{ color: s.color }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    className="bg-primary-600 hover:bg-primary-700"
                    onClick={handleUploadSave}
                    disabled={!uploadData || isUploading}
                  >
                    {isUploading ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" />Save {uploadData?.length ?? 0} Devotionals</>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* New Devotional button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary-600 hover:bg-primary-700 w-full sm:w-auto text-sm"
              size="sm"
              onClick={() => {
                setEditingDevotional(null);
                setFormData({
                  title: '',
                  verse: '',
                  reference: '',
                  reflection: '',
                  prayerPrompt: '',
                  date: new Date().toISOString().split('T')[0],
                  tags: [],
                  status: 'draft',
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Devotional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] w-full">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold">
                {editingDevotional ? 'Edit Devotional' : formData.title?.startsWith('Copy of') ? 'Duplicate Devotional' : 'Create New Devotional'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingDevotional
                  ? 'Update the details of this devotional.'
                  : formData.title?.startsWith('Copy of')
                  ? 'Review the duplicated content and adjust before saving as a new draft.'
                  : 'Enter the details for the new devotional.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-2 sm:pr-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Content Language Selector */}
                <ContentLanguageSelector />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-xs sm:text-sm">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })}
                      className="w-full h-10 px-3 rounded-md border border-border text-xs sm:text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title" className="text-xs sm:text-sm">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Love is Patient"
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="verse" className="text-xs sm:text-sm">Bible Verse</Label>
                  <Textarea
                    id="verse"
                    value={formData.verse}
                    onChange={(e) => setFormData({ ...formData, verse: e.target.value })}
                    placeholder="Enter the full Bible verse text"
                    rows={3}
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="reference" className="text-xs sm:text-sm">Reference</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    placeholder="e.g., 1 Corinthians 13:4"
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="reflection" className="text-xs sm:text-sm">Reflection</Label>
                  <Textarea
                    id="reflection"
                    value={formData.reflection}
                    onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
                    placeholder="Write the main reflection content..."
                    rows={6}
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="prayerPrompt" className="text-xs sm:text-sm">Prayer Prompt</Label>
                  <Textarea
                    id="prayerPrompt"
                    value={formData.prayerPrompt}
                    onChange={(e) => setFormData({ ...formData, prayerPrompt: e.target.value })}
                    placeholder="Suggest how couples can pray together..."
                    rows={3}
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto" size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary-600 hover:bg-primary-700 w-full sm:w-auto" size="sm">
                    {editingDevotional ? 'Update' : 'Create'} Devotional
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        </div>{/* end button group */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-primary-100 rounded-lg">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground text-[14px] font-bold">Total Devotionals</p>
              <p className="text-xl sm:text-2xl font-semibold">{devotionals.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-success-50 rounded-lg">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-success-700" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground font-bold text-[14px]">Published</p>
              <p className="text-xl sm:text-2xl font-semibold">{devotionals.filter(d => d.status === 'published').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-sky-100 rounded-lg">
              <Music className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground text-[14px] font-bold">With Audio</p>
              <p className="text-xl sm:text-2xl font-semibold">{devotionals.filter(d => d.audioUrl).length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Import / Export */}
      <DevotionalsImportExport
        devotionals={devotionals}
        accessToken={accessToken}
        onImportComplete={loadDevotionals}
      />

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search devotionals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-xs sm:text-sm text-[14px]"
          />
        </div>
        <Button variant="outline" onClick={loadDevotionals} size="sm" className="w-full sm:w-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Devotionals List */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading devotionals...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDevotionals.map((devotional) => (
            <Card key={devotional.id} className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-xl font-semibold">{devotional.title}</h3>
                    <Badge variant={devotional.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                      {devotional.status}
                    </Badge>
                    {devotional.audioUrl && (
                      <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-xs">
                        <Music className="w-3 h-3 mr-1" />
                        Audio
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">{devotional.reference}</p>
                  <p className="text-xs sm:text-sm text-foreground line-clamp-2 mb-3">{devotional.verse}</p>
                  <p className="text-xs text-muted-foreground">
                    Scheduled for: {new Date(devotional.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                  {/* Audio Management */}
                  {devotional.audioUrl ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAudioPreview(devotional.audioUrl!)}
                        className="bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs"
                      >
                        {isPlayingPreview && audioPreviewUrl === devotional.audioUrl ? (
                          <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAudio(devotional.id)}
                        className="text-error-500 hover:bg-error-50 text-xs"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept="audio/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAudioUpload(devotional.id, file);
                        }}
                        disabled={uploadingAudioFor === devotional.id}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={uploadingAudioFor === devotional.id}
                        className="bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs whitespace-nowrap"
                      >
                        {uploadingAudioFor === devotional.id ? (
                          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Add Audio</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(devotional)}
                    className="text-xs"
                    title="Edit"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate(devotional)}
                    className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(devotional.id)}
                    className="text-error-500 hover:bg-error-50 text-xs"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredDevotionals.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No devotionals found</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery ? 'Try a different search term' : 'Create your first devotional to get started'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
