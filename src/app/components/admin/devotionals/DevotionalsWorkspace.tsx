import { formatUiDate } from '../../../utils/uiDateTime';
import { BrandLoader, LoadingMark } from "../../BrandLoader";
import { useCurrentLanguage } from '../../../utils/languageStore';
import { useUiCopy, UI_LOCALES } from "../../../utils/uiTranslation";
import { adminContentMessages } from "../../../locales/adminContent";
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

function formatDate(date: string, locale: string) {
  const value = new Date(`${date}T00:00:00`);
  return Number.isNaN(value.getTime()) ? date : formatUiDate(value, locale, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function DevotionalsWorkspace(props: Props) {
  const language = useCurrentLanguage();
  const tr = useUiCopy(adminContentMessages);
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
          <span className="dev-console__eyebrow"><Sparkles aria-hidden="true" /> {tr("Content studio")}</span>
          <h1>{tr("Daily Devotionals")}</h1>
          <p>{tr("Plan, write, and publish Scripture-centered experiences for couples.")}</p>
        </div>
        <div className="dev-console__hero-actions">
          <Button variant="outline" onClick={() => onToolsOpenChange(true)} aria-label={tr("Open devotional import and export tools")}>
            <FileJson aria-hidden="true" /> {tr("Content tools")}</Button>
          <Button onClick={onNew} className="dev-console__primary"><Plus aria-hidden="true" /> {tr("New devotional")}</Button>
        </div>
      </header>

      <section className="dev-console__metrics" aria-label={tr("Devotional library summary")}>
        <article><span><Library /></span><div><strong>{devotionals.length}</strong><small>{tr("Total library")}</small></div></article>
        <article><span><BookOpen /></span><div><strong>{publishedCount}</strong><small>{tr("Published")}</small></div></article>
        <article><span><Edit /></span><div><strong>{draftCount}</strong><small>{tr("Drafts")}</small></div></article>
        <article><span><Headphones /></span><div><strong>{audioCount}</strong><small>{tr("With audio")}</small></div></article>
      </section>

      <section className="dev-console__toolbar" aria-label={tr("Devotional filters")}>
        <div className="dev-console__search">
          <Search aria-hidden="true" />
          <Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder={tr("Search title, Scripture, verse, or tag…")} aria-label={tr("Search devotionals")} />
          {searchQuery && <button type="button" onClick={() => onSearchChange('')} aria-label={tr("Clear search")}><X /></button>}
        </div>
        <div className="dev-console__segments" aria-label={tr("Filter by publishing status")}>
          {(['all', 'published', 'draft'] as const).map((status) => (
            <button key={status} type="button" data-active={statusFilter === status || undefined} onClick={() => onStatusFilterChange(status)} aria-pressed={statusFilter === status}>
              {tr(status)}
            </button>
          ))}
        </div>
        <label className="dev-console__select"><Languages /><span className="sr-only">{tr("Language")}</span><select value={languageFilter} onChange={(event) => onLanguageFilterChange(event.target.value as Props['languageFilter'])} aria-label={tr("Filter by language")}><option value="all">{tr("All languages")}</option><option value="en">{tr("English")}</option><option value="am">{tr("Amharic")}</option><option value="om">{tr("Afan Oromo")}</option></select></label>
        <label className="dev-console__select"><ArrowUpDown /><span className="sr-only">{tr("Sort")}</span><select value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value as Props['sortOrder'])} aria-label={tr("Sort devotionals")}><option value="newest">{tr("Newest first")}</option><option value="oldest">{tr("Oldest first")}</option><option value="title">{tr("Title A–Z")}</option></select></label>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading} aria-label={tr("Refresh devotionals")}>{isLoading ? <LoadingMark /> : <RefreshCw  />}</Button>
      </section>

      <div className="dev-console__result-line" role="status">
        <span>{filteredDevotionals.length} {tr(filteredDevotionals.length === 1 ? 'devotional' : 'devotionals')}</span>
        {(statusFilter !== 'all' || languageFilter !== 'all' || searchQuery) && <button type="button" onClick={() => { onSearchChange(''); onStatusFilterChange('all'); onLanguageFilterChange('all'); }}>{tr("Clear filters")}</button>}
      </div>

      <section className="dev-console__workspace">
        <div className="dev-console__list" aria-label={tr("Devotional library")} aria-busy={isLoading}>
          {isLoading && <BrandLoader className="py-8" />}
          {!isLoading && filteredDevotionals.map((devotional) => {
            const active = (selectedId ? devotional.id === selectedId : devotional.id === filteredDevotionals[0]?.id);
            return (
              <article className="dev-console__row" data-active={active || undefined} key={devotional.id}>
                <button className="dev-console__row-main" type="button" onClick={() => onSelect(devotional.id)} aria-label={tr('Preview {title}', { title: devotional.title })}>
                  <time dateTime={devotional.date}><b>{formatUiDate(new Date(`${devotional.date}T00:00:00`), UI_LOCALES[language], { day: '2-digit' })}</b><span>{formatUiDate(new Date(`${devotional.date}T00:00:00`), UI_LOCALES[language], { month: 'short' })}</span></time>
                  <div><div className="dev-console__row-title"><h2>{devotional.title}</h2><span className={`dev-console__status dev-console__status--${devotional.status}`}>{tr(devotional.status)}</span></div><p>{devotional.reference || tr("Scripture reference pending")}</p><small>{tr(languageNames[(devotional.language ?? 'en') as keyof typeof languageNames] ?? devotional.language ?? "")}{devotional.audioUrl ? tr(" · Audio ready") : ''}</small></div>
                  <Eye aria-hidden="true" />
                </button>
                <div className="dev-console__row-actions">
                  <button type="button" onClick={() => onEdit(devotional)} aria-label={tr('Edit {title}', { title: devotional.title })}><Edit /> {tr("Edit")}</button>
                  <button type="button" onClick={() => onDuplicate(devotional)} aria-label={tr('Duplicate {title}', { title: devotional.title })}><Copy /> {tr("Duplicate")}</button>
                </div>
              </article>
            );
          })}
          {!isLoading && !filteredDevotionals.length && <div className="dev-console__empty"><BookOpen /><h2>{tr("No devotionals found")}</h2><p>{tr("Adjust the filters or begin a new devotional.")}</p><Button onClick={onNew}><Plus /> {tr("New devotional")}</Button></div>}
        </div>

        <aside className="dev-console__preview" aria-label={tr("Devotional preview")}>
          {selectedDevotional ? (
            <>
              <div className="dev-console__preview-top"><div><span className={`dev-console__status dev-console__status--${selectedDevotional.status}`}>{tr(selectedDevotional.status)}</span><span className="dev-console__language">{tr(languageNames[(selectedDevotional.language ?? 'en') as keyof typeof languageNames] ?? selectedDevotional.language ?? "")}</span></div><div><button onClick={() => onEdit(selectedDevotional)} aria-label={tr('Edit {title}', { title: selectedDevotional.title })}><Edit /></button><button className="dev-console__danger" onClick={() => onDelete(selectedDevotional.id)} aria-label={tr('Delete {title}', { title: selectedDevotional.title })}><Trash2 /></button></div></div>
              <p className="dev-console__preview-date"><Calendar /> {tr("Scheduled")} {formatDate(selectedDevotional.date, UI_LOCALES[language])}</p>
              <h2>{selectedDevotional.title}</h2>
              <blockquote><p>“{selectedDevotional.verse}”</p><cite>{selectedDevotional.reference}</cite></blockquote>
              <div className="dev-console__preview-section"><span>{tr("Reflection")}</span><p>{selectedDevotional.reflection || tr("Reflection content has not been added.")}</p></div>
              <div className="dev-console__prayer"><span>{tr("Prayer prompt")}</span><p>{selectedDevotional.prayerPrompt || tr("Prayer prompt has not been added.")}</p></div>
              {!!selectedDevotional.tags?.length && <div className="dev-console__tags">{selectedDevotional.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
              <div className="dev-console__audio-control">
                {selectedDevotional.audioUrl ? <><button type="button" onClick={() => onAudioToggle(selectedDevotional.audioUrl!)} aria-label={tr('{action} audio for {title}', { action: tr(isPlayingPreview && audioPreviewUrl === selectedDevotional.audioUrl ? 'Pause' : 'Play'), title: selectedDevotional.title })}>{isPlayingPreview && audioPreviewUrl === selectedDevotional.audioUrl ? <Pause /> : <Play />}</button><div><strong>{selectedDevotional.audioFileName || tr("Devotional audio")}</strong><small>{tr("Audio narration ready")}</small></div><button type="button" className="dev-console__remove-audio" onClick={() => onAudioDelete(selectedDevotional.id)} aria-label={tr('Remove audio from {title}', { title: selectedDevotional.title })}><X /></button></> : <label><input type="file" accept="audio/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) onAudioUpload(selectedDevotional.id, file); }} disabled={uploadingAudioFor === selectedDevotional.id} /><Upload /> {uploadingAudioFor === selectedDevotional.id ? tr("Uploading…") : tr("Add audio narration")}</label>}
              </div>
            </>
          ) : <div className="dev-console__empty"><Eye /><h2>{tr("Select a devotional")}</h2><p>{tr("A full editorial preview will appear here.")}</p></div>}
        </aside>
      </section>

      <Dialog open={toolsOpen} onOpenChange={onToolsOpenChange}>
        <DialogContent className="dev-console__tools-dialog max-w-[95vw] sm:max-w-3xl max-h-[90vh]">
          <DialogHeader><DialogTitle>{tr("Content tools")}</DialogTitle><DialogDescription>{tr("Seed, import, or export devotional content.")}</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-[75vh] pr-4">{tools}</ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={onEditorOpenChange}>
        <DialogContent className="dev-console__editor max-w-[96vw] sm:max-w-4xl max-h-[94vh]">
          <DialogHeader><DialogTitle>{editingDevotional ? tr("Edit devotional") : formData.title?.startsWith('Copy of') ? tr("Duplicate devotional") : tr("Create devotional")}</DialogTitle><DialogDescription>{tr("Build the Scripture, reflection, and prayer experience, then choose when to publish.")}</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-[78vh] pr-4">
            <form onSubmit={onSubmit} className="dev-editor">
              <section><div className="dev-editor__section-title"><span>01</span><div><h3>{tr("Publishing details")}</h3><p>{tr("Set language, schedule, and visibility.")}</p></div></div><ContentLanguageSelector /><div className="dev-editor__grid"><label><Label htmlFor="dev-date">{tr("Scheduled date")}</Label><Input id="dev-date" type="date" value={formData.date ?? ''} onChange={(event) => setField('date', event.target.value)} required /></label><label><Label htmlFor="dev-status">{tr("Status")}</Label><select id="dev-status" value={formData.status ?? 'draft'} onChange={(event) => setField('status', event.target.value as Devotional['status'])}><option value="draft">{tr("Draft")}</option><option value="published">{tr("Published")}</option></select></label></div></section>
              <section><div className="dev-editor__section-title"><span>02</span><div><h3>{tr("Scripture")}</h3><p>{tr("Give the devotional a clear theme and Biblical anchor.")}</p></div></div><label><Label htmlFor="dev-title">{tr("Title")}</Label><Input id="dev-title" value={formData.title ?? ''} onChange={(event) => setField('title', event.target.value)} placeholder={tr("A memorable, encouraging title")} required /><small>{formData.title?.length ?? 0} {tr("characters")}</small></label><div className="dev-editor__grid dev-editor__grid--verse"><label><Label htmlFor="dev-verse">{tr("Bible verse")}</Label><Textarea id="dev-verse" value={formData.verse ?? ''} onChange={(event) => setField('verse', event.target.value)} rows={5} placeholder={tr("Enter the complete verse text")} required /></label><label><Label htmlFor="dev-reference">{tr("Reference")}</Label><Input id="dev-reference" value={formData.reference ?? ''} onChange={(event) => setField('reference', event.target.value)} placeholder={tr("1 Corinthians 13:4–7")} required /><div className="dev-editor__verse-preview">{formData.verse ? <><p>“{formData.verse}”</p><cite>{formData.reference}</cite></> : <p>{tr("Your Scripture preview appears here.")}</p>}</div></label></div></section>
              <section><div className="dev-editor__section-title"><span>03</span><div><h3>{tr("Couples experience")}</h3><p>{tr("Guide reflection and shared prayer.")}</p></div></div><label><Label htmlFor="dev-reflection">{tr("Reflection")}</Label><Textarea id="dev-reflection" value={formData.reflection ?? ''} onChange={(event) => setField('reflection', event.target.value)} rows={8} placeholder={tr("Connect Scripture to the couple’s daily relationship…")} required /><small>{formData.reflection?.length ?? 0} {tr("characters")}</small></label><label><Label htmlFor="dev-prayer">{tr("Prayer prompt")}</Label><Textarea id="dev-prayer" value={formData.prayerPrompt ?? ''} onChange={(event) => setField('prayerPrompt', event.target.value)} rows={4} placeholder={tr("Invite the couple to pray together…")} required /></label><label><Label htmlFor="dev-tags">{tr("Tags")}</Label><Input id="dev-tags" value={(formData.tags ?? []).join(', ')} onChange={(event) => setField('tags', event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))} placeholder={tr("communication, grace, prayer")} /><small>{tr("Separate tags with commas.")}</small></label></section>
              <footer><Button type="button" variant="outline" onClick={() => onEditorOpenChange(false)}>{tr("Cancel")}</Button><Button type="submit" className="dev-console__primary">{editingDevotional ? tr("Save changes") : formData.status === 'published' ? tr("Create & publish") : tr("Save draft")}</Button></footer>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </main>
  );
}
