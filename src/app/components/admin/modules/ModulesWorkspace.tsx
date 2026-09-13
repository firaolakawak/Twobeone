import { BrandLoader, LoadingMark } from "../../BrandLoader";
import { useUiCopy } from "../../../utils/uiTranslation";
import { adminContentMessages } from "../../../locales/adminContent";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react';
import {
  ArrowUpDown, BarChart3, BookOpen, CheckCircle2, ChevronRight, Clock3,
  Database, Edit3, Eye, FileText, GraduationCap, Languages, Layers3,
  Plus, RefreshCw, Search, Sparkles, Trash2, X,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { ScrollArea } from '../../ui/scroll-area';
import { Textarea } from '../../ui/textarea';
import type { Lesson, Module } from '../ModulesManager';

interface Props {
  modules: Module[];
  filteredModules: Module[];
  selectedModule: Module | null;
  selectedId: string | null;
  isLoading: boolean;
  searchQuery: string;
  statusFilter: 'all' | Module['status'];
  languageFilter: 'all' | 'en' | 'am';
  sortOrder: 'title' | 'lessons' | 'status';
  editorOpen: boolean;
  editingModule: Module | null;
  formData: Partial<Module>;
  toolsOpen: boolean;
  tools: ReactNode;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: Props['statusFilter']) => void;
  onLanguageFilterChange: (value: Props['languageFilter']) => void;
  onSortOrderChange: (value: Props['sortOrder']) => void;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onNew: () => void;
  onEdit: (module: Module) => void;
  onDelete: (id: string) => void;
  onEditorOpenChange: (open: boolean) => void;
  onToolsOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent) => void;
  setFormData: Dispatch<SetStateAction<Partial<Module>>>;
  addLesson: () => void;
  updateLesson: (lessonId: string, field: keyof Lesson, value: string) => void;
  removeLesson: (lessonId: string) => void;
}

const languageNames: Record<string, string> = { en: 'English', am: 'Amharic' };

function durationMinutes(duration: string) {
  const amount = Number.parseInt(duration, 10);
  return Number.isFinite(amount) ? amount : 0;
}

export function ModulesWorkspace(props: Props) {
  const tr = useUiCopy(adminContentMessages);
  const {
    modules, filteredModules, selectedModule, selectedId, isLoading, searchQuery,
    statusFilter, languageFilter, sortOrder, editorOpen, editingModule, formData,
    toolsOpen, tools, onSearchChange, onStatusFilterChange, onLanguageFilterChange,
    onSortOrderChange, onSelect, onRefresh, onNew, onEdit, onDelete,
    onEditorOpenChange, onToolsOpenChange, onSubmit, setFormData, addLesson,
    updateLesson, removeLesson,
  } = props;
  const lessons = modules.reduce((count, module) => count + module.lessons.length, 0);
  const published = modules.filter((module) => module.status === 'published').length;
  const totalMinutes = modules.reduce((total, module) => total + module.lessons.reduce((sum, lesson) => sum + durationMinutes(lesson.duration), 0), 0);
  const setField = <K extends keyof Module>(field: K, value: Module[K]) => setFormData((current) => ({ ...current, [field]: value }));

  return (
    <main className="module-console">
      <header className="module-console__hero">
        <div className="module-console__hero-copy">
          <span className="module-console__eyebrow"><Sparkles /> {tr("Curriculum studio")}</span>
          <h1>{tr("Learning Modules")}</h1>
          <p>{tr("Shape Scripture-centered learning journeys that help couples grow, one practical lesson at a time.")}</p>
        </div>
        <div className="module-console__hero-actions">
          <Button variant="outline" onClick={() => onToolsOpenChange(true)} aria-label={tr("Open module data tools")}><Database /> {tr("Data tools")}</Button>
          <Button onClick={onNew} className="module-console__primary" aria-label={tr("Create a new learning module")}><Plus /> {tr("New module")}</Button>
        </div>
      </header>

      <section className="module-console__metrics" aria-label={tr("Curriculum summary")}>
        <article><span><Layers3 /></span><div><strong>{modules.length}</strong><small>{tr("Modules")}</small></div></article>
        <article><span><BookOpen /></span><div><strong>{lessons}</strong><small>{tr("Total lessons")}</small></div></article>
        <article><span><CheckCircle2 /></span><div><strong>{published}</strong><small>{tr("Published")}</small></div></article>
        <article><span><Clock3 /></span><div><strong>{totalMinutes || '—'}</strong><small>{totalMinutes ? tr("Learning minutes") : tr("Minutes planned")}</small></div></article>
      </section>

      <section className="module-console__toolbar" aria-label={tr("Module library controls")}>
        <div className="module-console__search"><Search aria-hidden="true" /><Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder={tr("Search modules or lessons…")} aria-label={tr("Search learning modules")} />{searchQuery && <button type="button" onClick={() => onSearchChange('')} aria-label={tr("Clear module search")}><X /></button>}</div>
        <div className="module-console__segments" aria-label={tr("Filter modules by status")}>{(['all', 'published', 'draft'] as const).map((status) => <button key={status} type="button" data-active={statusFilter === status || undefined} aria-pressed={statusFilter === status} onClick={() => onStatusFilterChange(status)}>{tr(status)}</button>)}</div>
        <label className="module-console__select"><Languages /><span className="sr-only">{tr("Language")}</span><select aria-label={tr("Filter modules by language")} value={languageFilter} onChange={(event) => onLanguageFilterChange(event.target.value as Props['languageFilter'])}><option value="all">{tr("All languages")}</option><option value="en">{tr("English")}</option><option value="am">{tr("Amharic")}</option></select></label>
        <label className="module-console__select"><ArrowUpDown /><span className="sr-only">{tr("Sort modules")}</span><select aria-label={tr("Sort learning modules")} value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value as Props['sortOrder'])}><option value="title">{tr("Title A–Z")}</option><option value="lessons">{tr("Most lessons")}</option><option value="status">{tr("Publishing status")}</option></select></label>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading} aria-label={tr("Refresh learning modules")}>{isLoading ? <LoadingMark /> : <RefreshCw  />}</Button>
      </section>

      <div className="module-console__result-line" role="status"><span>{filteredModules.length} {tr(filteredModules.length === 1 ? 'module' : 'modules')}</span>{(searchQuery || statusFilter !== 'all' || languageFilter !== 'all') && <button type="button" onClick={() => { onSearchChange(''); onStatusFilterChange('all'); onLanguageFilterChange('all'); }}>{tr("Clear filters")}</button>}</div>

      <section className="module-console__workspace">
        <div className="module-console__library" aria-label={tr("Learning module library")} aria-busy={isLoading}>
          {isLoading && <BrandLoader className="py-8" />}
          {!isLoading && filteredModules.map((module) => {
            const active = selectedId ? selectedId === module.id : selectedModule?.id === module.id;
            const minutes = module.lessons.reduce((sum, lesson) => sum + durationMinutes(lesson.duration), 0);
            return <article className="module-console__row" data-active={active || undefined} key={module.id}>
              <button type="button" className="module-console__row-main" onClick={() => onSelect(module.id)} aria-label={tr('Preview {title}', { title: module.title })}>
                <span className={`module-console__module-icon ${module.color}`}>{module.icon || '📚'}</span>
                <div><div className="module-console__row-title"><h2>{module.title}</h2><span className={`module-console__status module-console__status--${module.status}`}>{tr(module.status)}</span></div><p>{module.subtitle || tr("Subtitle pending")}</p><small><BookOpen /> {module.lessons.length} {tr("lessons")}{minutes ? tr(' · {count} min', { count: minutes }) : ''} · {tr(languageNames[module.language || 'en'] || module.language || "")}</small></div>
                <ChevronRight />
              </button>
              <div className="module-console__row-actions"><button type="button" onClick={() => onEdit(module)} aria-label={tr('Edit {title}', { title: module.title })}><Edit3 /> {tr("Edit")}</button><button type="button" onClick={() => onDelete(module.id)} aria-label={tr('Delete {title}', { title: module.title })}><Trash2 /> {tr("Delete")}</button></div>
            </article>;
          })}
          {!isLoading && !filteredModules.length && <div className="module-console__empty"><GraduationCap /><h2>{tr("No modules found")}</h2><p>{tr("Adjust your filters or begin a new learning journey.")}</p><Button onClick={onNew}><Plus /> {tr("New module")}</Button></div>}
        </div>

        <aside className="module-console__preview" aria-label={tr("Learner experience preview")}>
          {selectedModule ? <>
            <div className="module-console__preview-top"><span>{tr("Learner preview")}</span><div><button type="button" onClick={() => onEdit(selectedModule)} aria-label={tr('Edit {title}', { title: selectedModule.title })}><Edit3 /></button><button type="button" className="module-console__danger" onClick={() => onDelete(selectedModule.id)} aria-label={tr('Delete {title}', { title: selectedModule.title })}><Trash2 /></button></div></div>
            <div className={`module-console__cover ${selectedModule.color}`}><span>{selectedModule.icon || '📚'}</span><div className="module-console__cover-orb" /></div>
            <div className="module-console__preview-body"><div className="module-console__preview-meta"><span className={`module-console__status module-console__status--${selectedModule.status}`}>{tr(selectedModule.status)}</span><span>{tr(languageNames[selectedModule.language || 'en'] || selectedModule.language || "")}</span></div><p className="module-console__kicker">{selectedModule.subtitle}</p><h2>{selectedModule.title}</h2><p className="module-console__description">{selectedModule.description || tr("Add a concise description of this learning journey.")}</p>
              <div className="module-console__progress"><div><span>{tr("Course outline")}</span><b>{selectedModule.lessons.length} {tr("lessons")}</b></div><i><span style={{ width: selectedModule.lessons.length ? '18%' : '0%' }} /></i><small>{tr("Previewing the beginning of this journey")}</small></div>
              <ol className="module-console__lessons">{selectedModule.lessons.map((lesson, index) => <li key={lesson.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{lesson.title || tr('Untitled lesson {number}', { number: index + 1 })}</strong><small><Clock3 /> {lesson.duration || tr("Duration pending")}</small></div>{index === 0 ? <Eye /> : <FileText />}</li>)}</ol>
              {!selectedModule.lessons.length && <div className="module-console__empty module-console__empty--compact"><BookOpen /><p>{tr("Add lessons to preview the course outline.")}</p></div>}
            </div>
          </> : <div className="module-console__empty"><Eye /><h2>{tr("Select a module")}</h2><p>{tr("The complete learner-facing experience will appear here.")}</p></div>}
        </aside>
      </section>

      <Dialog open={toolsOpen} onOpenChange={onToolsOpenChange}><DialogContent className="module-console__tools-dialog max-w-[95vw] sm:max-w-4xl max-h-[92vh]"><DialogHeader><DialogTitle>{tr("Module data tools")}</DialogTitle><DialogDescription>{tr("Import, export, and maintain your curriculum library.")}</DialogDescription></DialogHeader><ScrollArea className="max-h-[76vh] pr-4">{tools}</ScrollArea></DialogContent></Dialog>

      <Dialog open={editorOpen} onOpenChange={onEditorOpenChange}><DialogContent className="module-console__editor max-w-[96vw] sm:max-w-5xl max-h-[94vh]"><DialogHeader><DialogTitle>{editingModule ? tr("Edit learning module") : tr("Create learning module")}</DialogTitle><DialogDescription>{tr("Design the module overview and build a clear, ordered lesson path.")}</DialogDescription></DialogHeader><ScrollArea className="max-h-[79vh] pr-4"><form onSubmit={onSubmit} className="module-editor">
        <section><div className="module-editor__section-title"><span>01</span><div><h3>{tr("Module identity")}</h3><p>{tr("Set the theme, audience-facing details, and publishing state.")}</p></div></div><div className="module-editor__grid module-editor__grid--title"><label><Label htmlFor="module-icon">{tr("Icon")}</Label><Input id="module-icon" value={formData.icon || ''} onChange={(event) => setField('icon', event.target.value)} maxLength={4} placeholder="📚" /></label><label><Label htmlFor="module-title">{tr("Title")}</Label><Input id="module-title" value={formData.title || ''} onChange={(event) => setField('title', event.target.value)} placeholder={tr("God's Design for Marriage")} required /></label></div><label><Label htmlFor="module-subtitle">{tr("Subtitle")}</Label><Input id="module-subtitle" value={formData.subtitle || ''} onChange={(event) => setField('subtitle', event.target.value)} placeholder={tr("A concise learning promise")} required /></label><label><Label htmlFor="module-description">{tr("Description")}</Label><Textarea id="module-description" value={formData.description || ''} onChange={(event) => setField('description', event.target.value)} rows={4} placeholder={tr("What will couples understand or practice by completing this module?")} required /><small>{formData.description?.length || 0} {tr("characters")}</small></label><div className="module-editor__grid"><label><Label htmlFor="module-language">{tr("Language")}</Label><select id="module-language" value={formData.language || 'en'} onChange={(event) => setField('language', event.target.value)}><option value="en">{tr("English")}</option><option value="am">{tr("Amharic")}</option></select></label><label><Label htmlFor="module-color">{tr("Theme")}</Label><select id="module-color" value={formData.color || 'bg-primary-500'} onChange={(event) => setField('color', event.target.value)}><option value="bg-primary-500">{tr("Plum")}</option><option value="bg-sky-500">{tr("Sky")}</option><option value="bg-success-500">{tr("Sage")}</option><option value="bg-warning-500">{tr("Amber")}</option><option value="bg-error-500">{tr("Rose")}</option></select></label><label><Label htmlFor="module-status">{tr("Status")}</Label><select id="module-status" value={formData.status || 'draft'} onChange={(event) => setField('status', event.target.value as Module['status'])}><option value="draft">{tr("Draft")}</option><option value="published">{tr("Published")}</option></select></label></div></section>
        <section><div className="module-editor__section-title module-editor__lessons-head"><span>02</span><div><h3>{tr("Lesson pathway")}</h3><p>{tr("Build the learning sequence from foundation to practice.")}</p></div><Button type="button" variant="outline" onClick={addLesson}><Plus /> {tr("Add lesson")}</Button></div><div className="module-editor__lesson-list">{(formData.lessons || []).map((lesson, index) => <article key={lesson.id}><div className="module-editor__lesson-top"><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{tr("Lesson")} {index + 1}</strong><small>{lesson.title || tr("Untitled lesson")}</small></div><button type="button" onClick={() => removeLesson(lesson.id)} aria-label={tr('Remove lesson {number}', { number: index + 1 })}><Trash2 /></button></div><div className="module-editor__grid module-editor__grid--lesson"><label><Label htmlFor={`module-lesson-title-${lesson.id}`}>{tr("Lesson title")}</Label><Input id={`module-lesson-title-${lesson.id}`} value={lesson.title} onChange={(event) => updateLesson(lesson.id, 'title', event.target.value)} placeholder={tr("The Covenant of Marriage")} required /></label><label><Label htmlFor={`module-lesson-duration-${lesson.id}`}>{tr("Duration")}</Label><Input id={`module-lesson-duration-${lesson.id}`} value={lesson.duration} onChange={(event) => updateLesson(lesson.id, 'duration', event.target.value)} placeholder={tr("15 min")} required /></label></div><label><Label htmlFor={`module-lesson-content-${lesson.id}`}>{tr("Lesson content")}</Label><Textarea id={`module-lesson-content-${lesson.id}`} value={lesson.content} onChange={(event) => updateLesson(lesson.id, 'content', event.target.value)} rows={7} placeholder={tr("Use Markdown for headings, Scripture, reflection, and discussion prompts…")} required /><small>{tr("Markdown formatting is supported.")}</small></label></article>)}{!formData.lessons?.length && <div className="module-console__empty module-console__empty--compact"><BookOpen /><h3>{tr("Start the lesson pathway")}</h3><p>{tr("Add the first lesson to shape this learning experience.")}</p><Button type="button" variant="outline" onClick={addLesson}><Plus /> {tr("Add first lesson")}</Button></div>}</div></section>
        <footer><Button type="button" variant="outline" onClick={() => onEditorOpenChange(false)}>{tr("Cancel")}</Button><Button type="submit" className="module-console__primary">{editingModule ? tr("Save changes") : formData.status === 'published' ? tr("Create & publish") : tr("Save draft")}</Button></footer>
      </form></ScrollArea></DialogContent></Dialog>
    </main>
  );
}
