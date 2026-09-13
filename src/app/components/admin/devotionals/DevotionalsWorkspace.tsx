import type { Dispatch, FormEvent, ReactNode, RefObject, SetStateAction } from 'react';
import {
  ArrowUpDown, BookOpen, Calendar, Copy, Edit, Eye, FileJson, Headphones,
  Languages, Library, Music, Pause, Play, Plus, RefreshCw, Search,
  SlidersHorizontal, Sparkles, Trash2, Upload, X,
} from 'lucide-react';
import type { Devotional } from '../DevotionalsManager';
import { ContentLanguageSelector } from '../ContentLanguageSelector';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { ScrollArea } from '../../ui/scroll-area';

interface Props {
  devotionals: Devotional[];
  filteredDevotionals: Devotional[];
  selectedDevotional: Devotional | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'published' | 'draft';
  onStatusFilterChange: (value: 'all' | 'published' | 'draft') => void;
  languageFilter: 'all' | 'en' | 'am' | 'om';
  onLanguageFilterChange: (value: 'all' | 'en' | 'am' | 'om') => void;
  sortOrder: 'newest' | 'oldest' | 'title';
  onSortOrderChange: (value: 'newest' | 'oldest' | 'title') => void;
  publishedCount: number;
  draftCount: number;
  audioCount: number;
  onRefresh: () => void;
  onNew: () => void;
  onEdit: (devotional: Devotional) => void;
  onDuplicate: (devotional: Devotional) => void;
  onDelete: (id: string) => void;
  onAudioUpload: (id: string, file: File) => void;
  onAudioDelete: (id: string) => void;
  onAudioToggle: (url: string | null) => void;
  uploadingAudioFor: string | null;
  audioPreviewUrl: string | null;
  isPlayingPreview: boolean;
  audioRef: RefObject<HTMLAudioElement>;
  onAudioEnded: () => void;
  editorOpen: boolean;
  onEditorOpenChange: (open: boolean) => void;
  editingDevotional: Devotional | null;
  formData: Partial<Devotional>;
  onFormDataChange: Dispatch<SetStateAction<Partial<Devotional>>>;
  onSubmit: (event: FormEvent) => void;
  toolsOpen: boolean;
  onToolsOpenChange: (open: boolean) => void;
  tools: ReactNode;
}

const languageNames = { en: 'English', am: 'Amharic', om: 'Afan Oromo' } as const;

function formatDate(date: string) {
  const value = new Date(`${date}T00:00:00`);
  return Number.isNaN(value.getTime()) ? date : value.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function DevotionalsWorkspace(props: Props) {
  const {
    devotionals, filteredDevotionals, selectedDevotional, selectedId, onSelect,
    isLoading, searchQuery, onSearchChange, statusFilter, onStatusFilterChange,
    languageFilter, onLanguageFilterChange, sortOrder, onSortOrderChange,
    publishedCount, draftCount, audioCount, onRefresh, onNew, onEdit,
    onDuplicate, onDelete, onAudioUpload, onAudioDelete, onAudioToggle,
    uploadingAudioFor, audioPreviewUrl, isPlayingPreview, audioRef, onAudioEnded,
    editorOpen, onEditorOpenChange, editingDevotional, formData,
    onFormDataChange, onSubmit, toolsOpen, onToolsOpenChange, tools,
  } = props;

  const setField = <K extends keyof Devotional>(key: K, value: Devotional[K]) =>
    onFormDataChange((current) => ({ ...current, [key]: value }));

  return (
    <main className="dev-console">
      <audio ref={audioRef} onEnded={onAudioEnded} onPause={onAudioEnded} className="dev-console__audio" />

      <header className="dev-console__hero">
        <div className="dev-console__hero-copy">
          <span className="dev-console__eyebrow"><Sparkles aria-hidden="true" /> Content studio</span>
          <h1>Daily Devotionals</h1>
          <p>Plan, write, and publish Scripture-centered experiences for couples.</p>
        </div>
        <div className="dev-console__hero-actions">
          <Button variant="outline" onClick={() => onToolsOpenChange(true)} aria-label="Open devotional import and export tools">
            <FileJson aria-hidden="true" /> Content tools
          </Button>
          <Button onClick={onNew} className="dev-console__primary"><Plus aria-hidden="true" /> New devotional</Button>
        </div>
      </header>

      <section className="dev-console__metrics" aria-label="Devotional library summary">
        <article><span><Library /></span><div><strong>{devotionals.length}</strong><small>Total library</small></div></article>
        <article><span><BookOpen /></span><div><strong>{publishedCount}</strong><small>Published</small></div></article>
        <article><span><Edit /></span><div><strong>{draftCount}</strong><small>Drafts</small></div></article>
        <article><span><Headphones /></span><div><strong>{audioCount}</strong><small>With audio</small></div></article>
      </section>

      <section className="dev-console__toolbar" aria-label="Devotional filters">
        <div className="dev-console__search">
          <Search aria-hidden="true" />
          <Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search title, Scripture, verse, or tag…" aria-label="Search devotionals" />
          {searchQuery && <button type="button" onClick={() => onSearchChange('')} aria-label="Clear search"><X /></button>}
        </div>
        <div className="dev-console__segments" aria-label="Filter by publishing status">
          {(['all', 'published', 'draft'] as const).map((status) => (
            <button key={status} type="button" data-active={statusFilter === status || undefined} onClick={() => onStatusFilterChange(status)} aria-pressed={statusFilter === status}>
              {status}
            </button>
          ))}
        </div>
        <label className="dev-console__select"><Languages /><span className="sr-only">Language</span><select value={languageFilter} onChange={(event) => onLanguageFilterChange(event.target.value as Props['languageFilter'])} aria-label="Filter by language"><option value="all">All languages</option><option value="en">English</option><option value="am">Amharic</option><option value="om">Afan Oromo</option></select></label>
        <label className="dev-console__select"><ArrowUpDown /><span className="sr-only">Sort</span><select value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value as Props['sortOrder'])} aria-label="Sort devotionals"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option></select></label>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading} aria-label="Refresh devotionals"><RefreshCw className={isLoading ? 'dev-console__spin' : ''} /></Button>
      </section>

      <div className="dev-console__result-line" role="status">
        <span>{filteredDevotionals.length} {filteredDevotionals.length === 1 ? 'devotional' : 'devotionals'}</span>
        {(statusFilter !== 'all' || languageFilter !== 'all' || searchQuery) && <button type="button" onClick={() => { onSearchChange(''); onStatusFilterChange('all'); onLanguageFilterChange('all'); }}>Clear filters</button>}
      </div>

      <section className="dev-console__workspace">
        <div className="dev-console__list" aria-label="Devotional library" aria-busy={isLoading}>
          {isLoading && [...Array(4)].map((_, index) => <div className="dev-console__skeleton" key={index} />)}
          {!isLoading && filteredDevotionals.map((devotional) => {
            const active = (selectedId ? devotional.id === selectedId : devotional.id === filteredDevotionals[0]?.id);
            return (
              <article className="dev-console__row" data-active={active || undefined} key={devotional.id}>
                <button className="dev-console__row-main" type="button" onClick={() => onSelect(devotional.id)} aria-label={`Preview ${devotional.title}`}>
                  <time dateTime={devotional.date}><b>{new Date(`${devotional.date}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit' })}</b><span>{new Date(`${devotional.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short' })}</span></time>
                  <div><div className="dev-console__row-title"><h2>{devotional.title}</h2><span className={`dev-console__status dev-console__status--${devotional.status}`}>{devotional.status}</span></div><p>{devotional.reference || 'Scripture reference pending'}</p><small>{languageNames[(devotional.language ?? 'en') as keyof typeof languageNames] ?? devotional.language}{devotional.audioUrl ? ' · Audio ready' : ''}</small></div>
                  <Eye aria-hidden="true" />
                </button>
                <div className="dev-console__row-actions">
                  <button type="button" onClick={() => onEdit(devotional)} aria-label={`Edit ${devotional.title}`}><Edit /> Edit</button>
                  <button type="button" onClick={() => onDuplicate(devotional)} aria-label={`Duplicate ${devotional.title}`}><Copy /> Duplicate</button>
                </div>
              </article>
            );
          })}
          {!isLoading && !filteredDevotionals.length && <div className="dev-console__empty"><BookOpen /><h2>No devotionals found</h2><p>Adjust the filters or begin a new devotional.</p><Button onClick={onNew}><Plus /> New devotional</Button></div>}
        </div>

        <aside className="dev-console__preview" aria-label="Devotional preview">
          {selectedDevotional ? (
            <>
              <div className="dev-console__preview-top"><div><span className={`dev-console__status dev-console__status--${selectedDevotional.status}`}>{selectedDevotional.status}</span><span className="dev-console__language">{languageNames[(selectedDevotional.language ?? 'en') as keyof typeof languageNames] ?? selectedDevotional.language}</span></div><div><button onClick={() => onEdit(selectedDevotional)} aria-label={`Edit ${selectedDevotional.title}`}><Edit /></button><button className="dev-console__danger" onClick={() => onDelete(selectedDevotional.id)} aria-label={`Delete ${selectedDevotional.title}`}><Trash2 /></button></div></div>
              <p className="dev-console__preview-date"><Calendar /> Scheduled {formatDate(selectedDevotional.date)}</p>
              <h2>{selectedDevotional.title}</h2>
              <blockquote><p>“{selectedDevotional.verse}”</p><cite>{selectedDevotional.reference}</cite></blockquote>
              <div className="dev-console__preview-section"><span>Reflection</span><p>{selectedDevotional.reflection || 'Reflection content has not been added.'}</p></div>
              <div className="dev-console__prayer"><span>Prayer prompt</span><p>{selectedDevotional.prayerPrompt || 'Prayer prompt has not been added.'}</p></div>
              {!!selectedDevotional.tags?.length && <div className="dev-console__tags">{selectedDevotional.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
              <div className="dev-console__audio-control">
                {selectedDevotional.audioUrl ? <><button type="button" onClick={() => onAudioToggle(selectedDevotional.audioUrl!)} aria-label={`${isPlayingPreview && audioPreviewUrl === selectedDevotional.audioUrl ? 'Pause' : 'Play'} audio for ${selectedDevotional.title}`}>{isPlayingPreview && audioPreviewUrl === selectedDevotional.audioUrl ? <Pause /> : <Play />}</button><div><strong>{selectedDevotional.audioFileName || 'Devotional audio'}</strong><small>Audio narration ready</small></div><button type="button" className="dev-console__remove-audio" onClick={() => onAudioDelete(selectedDevotional.id)} aria-label={`Remove audio from ${selectedDevotional.title}`}><X /></button></> : <label><input type="file" accept="audio/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) onAudioUpload(selectedDevotional.id, file); }} disabled={uploadingAudioFor === selectedDevotional.id} /><Upload /> {uploadingAudioFor === selectedDevotional.id ? 'Uploading…' : 'Add audio narration'}</label>}
              </div>
            </>
          ) : <div className="dev-console__empty"><Eye /><h2>Select a devotional</h2><p>A full editorial preview will appear here.</p></div>}
        </aside>
      </section>

      <Dialog open={toolsOpen} onOpenChange={onToolsOpenChange}>
        <DialogContent className="dev-console__tools-dialog max-w-[95vw] sm:max-w-3xl max-h-[90vh]">
          <DialogHeader><DialogTitle>Content tools</DialogTitle><DialogDescription>Seed, import, or export devotional content.</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-[75vh] pr-4">{tools}</ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={onEditorOpenChange}>
        <DialogContent className="dev-console__editor max-w-[96vw] sm:max-w-4xl max-h-[94vh]">
          <DialogHeader><DialogTitle>{editingDevotional ? 'Edit devotional' : formData.title?.startsWith('Copy of') ? 'Duplicate devotional' : 'Create devotional'}</DialogTitle><DialogDescription>Build the Scripture, reflection, and prayer experience, then choose when to publish.</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-[78vh] pr-4">
            <form onSubmit={onSubmit} className="dev-editor">
              <section><div className="dev-editor__section-title"><span>01</span><div><h3>Publishing details</h3><p>Set language, schedule, and visibility.</p></div></div><ContentLanguageSelector /><div className="dev-editor__grid"><label><Label htmlFor="dev-date">Scheduled date</Label><Input id="dev-date" type="date" value={formData.date ?? ''} onChange={(event) => setField('date', event.target.value)} required /></label><label><Label htmlFor="dev-status">Status</Label><select id="dev-status" value={formData.status ?? 'draft'} onChange={(event) => setField('status', event.target.value as Devotional['status'])}><option value="draft">Draft</option><option value="published">Published</option></select></label></div></section>
              <section><div className="dev-editor__section-title"><span>02</span><div><h3>Scripture</h3><p>Give the devotional a clear theme and Biblical anchor.</p></div></div><label><Label htmlFor="dev-title">Title</Label><Input id="dev-title" value={formData.title ?? ''} onChange={(event) => setField('title', event.target.value)} placeholder="A memorable, encouraging title" required /><small>{formData.title?.length ?? 0} characters</small></label><div className="dev-editor__grid dev-editor__grid--verse"><label><Label htmlFor="dev-verse">Bible verse</Label><Textarea id="dev-verse" value={formData.verse ?? ''} onChange={(event) => setField('verse', event.target.value)} rows={5} placeholder="Enter the complete verse text" required /></label><label><Label htmlFor="dev-reference">Reference</Label><Input id="dev-reference" value={formData.reference ?? ''} onChange={(event) => setField('reference', event.target.value)} placeholder="1 Corinthians 13:4–7" required /><div className="dev-editor__verse-preview">{formData.verse ? <><p>“{formData.verse}”</p><cite>{formData.reference}</cite></> : <p>Your Scripture preview appears here.</p>}</div></label></div></section>
              <section><div className="dev-editor__section-title"><span>03</span><div><h3>Couples experience</h3><p>Guide reflection and shared prayer.</p></div></div><label><Label htmlFor="dev-reflection">Reflection</Label><Textarea id="dev-reflection" value={formData.reflection ?? ''} onChange={(event) => setField('reflection', event.target.value)} rows={8} placeholder="Connect Scripture to the couple’s daily relationship…" required /><small>{formData.reflection?.length ?? 0} characters</small></label><label><Label htmlFor="dev-prayer">Prayer prompt</Label><Textarea id="dev-prayer" value={formData.prayerPrompt ?? ''} onChange={(event) => setField('prayerPrompt', event.target.value)} rows={4} placeholder="Invite the couple to pray together…" required /></label><label><Label htmlFor="dev-tags">Tags</Label><Input id="dev-tags" value={(formData.tags ?? []).join(', ')} onChange={(event) => setField('tags', event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))} placeholder="communication, grace, prayer" /><small>Separate tags with commas.</small></label></section>
              <footer><Button type="button" variant="outline" onClick={() => onEditorOpenChange(false)}>Cancel</Button><Button type="submit" className="dev-console__primary">{editingDevotional ? 'Save changes' : formData.status === 'published' ? 'Create & publish' : 'Save draft'}</Button></footer>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </main>
  );
}
