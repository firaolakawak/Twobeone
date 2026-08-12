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
          <span className="module-console__eyebrow"><Sparkles /> Curriculum studio</span>
          <h1>Learning Modules</h1>
          <p>Shape Scripture-centered learning journeys that help couples grow, one practical lesson at a time.</p>
        </div>
        <div className="module-console__hero-actions">
          <Button variant="outline" onClick={() => onToolsOpenChange(true)} aria-label="Open module data tools"><Database /> Data tools</Button>
          <Button onClick={onNew} className="module-console__primary" aria-label="Create a new learning module"><Plus /> New module</Button>
        </div>
      </header>

      <section className="module-console__metrics" aria-label="Curriculum summary">
        <article><span><Layers3 /></span><div><strong>{modules.length}</strong><small>Modules</small></div></article>
        <article><span><BookOpen /></span><div><strong>{lessons}</strong><small>Total lessons</small></div></article>
        <article><span><CheckCircle2 /></span><div><strong>{published}</strong><small>Published</small></div></article>
        <article><span><Clock3 /></span><div><strong>{totalMinutes || '—'}</strong><small>{totalMinutes ? 'Learning minutes' : 'Minutes planned'}</small></div></article>
      </section>

      <section className="module-console__toolbar" aria-label="Module library controls">
        <div className="module-console__search"><Search aria-hidden="true" /><Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search modules or lessons…" aria-label="Search learning modules" />{searchQuery && <button type="button" onClick={() => onSearchChange('')} aria-label="Clear module search"><X /></button>}</div>
        <div className="module-console__segments" aria-label="Filter modules by status">{(['all', 'published', 'draft'] as const).map((status) => <button key={status} type="button" data-active={statusFilter === status || undefined} aria-pressed={statusFilter === status} onClick={() => onStatusFilterChange(status)}>{status}</button>)}</div>
        <label className="module-console__select"><Languages /><span className="sr-only">Language</span><select aria-label="Filter modules by language" value={languageFilter} onChange={(event) => onLanguageFilterChange(event.target.value as Props['languageFilter'])}><option value="all">All languages</option><option value="en">English</option><option value="am">Amharic</option></select></label>
        <label className="module-console__select"><ArrowUpDown /><span className="sr-only">Sort modules</span><select aria-label="Sort learning modules" value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value as Props['sortOrder'])}><option value="title">Title A–Z</option><option value="lessons">Most lessons</option><option value="status">Publishing status</option></select></label>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading} aria-label="Refresh learning modules"><RefreshCw className={isLoading ? 'module-console__spin' : ''} /></Button>
      </section>

      <div className="module-console__result-line" role="status"><span>{filteredModules.length} {filteredModules.length === 1 ? 'module' : 'modules'}</span>{(searchQuery || statusFilter !== 'all' || languageFilter !== 'all') && <button type="button" onClick={() => { onSearchChange(''); onStatusFilterChange('all'); onLanguageFilterChange('all'); }}>Clear filters</button>}</div>

      <section className="module-console__workspace">
        <div className="module-console__library" aria-label="Learning module library" aria-busy={isLoading}>
          {isLoading && [...Array(4)].map((_, index) => <div className="module-console__skeleton" key={index} />)}
          {!isLoading && filteredModules.map((module) => {
            const active = selectedId ? selectedId === module.id : selectedModule?.id === module.id;
            const minutes = module.lessons.reduce((sum, lesson) => sum + durationMinutes(lesson.duration), 0);
            return <article className="module-console__row" data-active={active || undefined} key={module.id}>
              <button type="button" className="module-console__row-main" onClick={() => onSelect(module.id)} aria-label={`Preview ${module.title}`}>
                <span className={`module-console__module-icon ${module.color}`}>{module.icon || '📚'}</span>
                <div><div className="module-console__row-title"><h2>{module.title}</h2><span className={`module-console__status module-console__status--${module.status}`}>{module.status}</span></div><p>{module.subtitle || 'Subtitle pending'}</p><small><BookOpen /> {module.lessons.length} lessons{minutes ? ` · ${minutes} min` : ''} · {languageNames[module.language || 'en'] || module.language}</small></div>
                <ChevronRight />
              </button>
              <div className="module-console__row-actions"><button type="button" onClick={() => onEdit(module)} aria-label={`Edit ${module.title}`}><Edit3 /> Edit</button><button type="button" onClick={() => onDelete(module.id)} aria-label={`Delete ${module.title}`}><Trash2 /> Delete</button></div>
            </article>;
          })}
          {!isLoading && !filteredModules.length && <div className="module-console__empty"><GraduationCap /><h2>No modules found</h2><p>Adjust your filters or begin a new learning journey.</p><Button onClick={onNew}><Plus /> New module</Button></div>}
        </div>

        <aside className="module-console__preview" aria-label="Learner experience preview">
          {selectedModule ? <>
            <div className="module-console__preview-top"><span>Learner preview</span><div><button type="button" onClick={() => onEdit(selectedModule)} aria-label={`Edit ${selectedModule.title}`}><Edit3 /></button><button type="button" className="module-console__danger" onClick={() => onDelete(selectedModule.id)} aria-label={`Delete ${selectedModule.title}`}><Trash2 /></button></div></div>
            <div className={`module-console__cover ${selectedModule.color}`}><span>{selectedModule.icon || '📚'}</span><div className="module-console__cover-orb" /></div>
            <div className="module-console__preview-body"><div className="module-console__preview-meta"><span className={`module-console__status module-console__status--${selectedModule.status}`}>{selectedModule.status}</span><span>{languageNames[selectedModule.language || 'en'] || selectedModule.language}</span></div><p className="module-console__kicker">{selectedModule.subtitle}</p><h2>{selectedModule.title}</h2><p className="module-console__description">{selectedModule.description || 'Add a concise description of this learning journey.'}</p>
              <div className="module-console__progress"><div><span>Course outline</span><b>{selectedModule.lessons.length} lessons</b></div><i><span style={{ width: selectedModule.lessons.length ? '18%' : '0%' }} /></i><small>Previewing the beginning of this journey</small></div>
              <ol className="module-console__lessons">{selectedModule.lessons.map((lesson, index) => <li key={lesson.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{lesson.title || `Untitled lesson ${index + 1}`}</strong><small><Clock3 /> {lesson.duration || 'Duration pending'}</small></div>{index === 0 ? <Eye /> : <FileText />}</li>)}</ol>
              {!selectedModule.lessons.length && <div className="module-console__empty module-console__empty--compact"><BookOpen /><p>Add lessons to preview the course outline.</p></div>}
            </div>
          </> : <div className="module-console__empty"><Eye /><h2>Select a module</h2><p>The complete learner-facing experience will appear here.</p></div>}
        </aside>
      </section>

      <Dialog open={toolsOpen} onOpenChange={onToolsOpenChange}><DialogContent className="module-console__tools-dialog max-w-[95vw] sm:max-w-4xl max-h-[92vh]"><DialogHeader><DialogTitle>Module data tools</DialogTitle><DialogDescription>Import, export, and maintain your curriculum library.</DialogDescription></DialogHeader><ScrollArea className="max-h-[76vh] pr-4">{tools}</ScrollArea></DialogContent></Dialog>

      <Dialog open={editorOpen} onOpenChange={onEditorOpenChange}><DialogContent className="module-console__editor max-w-[96vw] sm:max-w-5xl max-h-[94vh]"><DialogHeader><DialogTitle>{editingModule ? 'Edit learning module' : 'Create learning module'}</DialogTitle><DialogDescription>Design the module overview and build a clear, ordered lesson path.</DialogDescription></DialogHeader><ScrollArea className="max-h-[79vh] pr-4"><form onSubmit={onSubmit} className="module-editor">
        <section><div className="module-editor__section-title"><span>01</span><div><h3>Module identity</h3><p>Set the theme, audience-facing details, and publishing state.</p></div></div><div className="module-editor__grid module-editor__grid--title"><label><Label htmlFor="module-icon">Icon</Label><Input id="module-icon" value={formData.icon || ''} onChange={(event) => setField('icon', event.target.value)} maxLength={4} placeholder="📚" /></label><label><Label htmlFor="module-title">Title</Label><Input id="module-title" value={formData.title || ''} onChange={(event) => setField('title', event.target.value)} placeholder="God's Design for Marriage" required /></label></div><label><Label htmlFor="module-subtitle">Subtitle</Label><Input id="module-subtitle" value={formData.subtitle || ''} onChange={(event) => setField('subtitle', event.target.value)} placeholder="A concise learning promise" required /></label><label><Label htmlFor="module-description">Description</Label><Textarea id="module-description" value={formData.description || ''} onChange={(event) => setField('description', event.target.value)} rows={4} placeholder="What will couples understand or practice by completing this module?" required /><small>{formData.description?.length || 0} characters</small></label><div className="module-editor__grid"><label><Label htmlFor="module-language">Language</Label><select id="module-language" value={formData.language || 'en'} onChange={(event) => setField('language', event.target.value)}><option value="en">English</option><option value="am">Amharic</option></select></label><label><Label htmlFor="module-color">Theme</Label><select id="module-color" value={formData.color || 'bg-primary-500'} onChange={(event) => setField('color', event.target.value)}><option value="bg-primary-500">Plum</option><option value="bg-sky-500">Sky</option><option value="bg-success-500">Sage</option><option value="bg-warning-500">Amber</option><option value="bg-error-500">Rose</option></select></label><label><Label htmlFor="module-status">Status</Label><select id="module-status" value={formData.status || 'draft'} onChange={(event) => setField('status', event.target.value as Module['status'])}><option value="draft">Draft</option><option value="published">Published</option></select></label></div></section>
        <section><div className="module-editor__section-title module-editor__lessons-head"><span>02</span><div><h3>Lesson pathway</h3><p>Build the learning sequence from foundation to practice.</p></div><Button type="button" variant="outline" onClick={addLesson}><Plus /> Add lesson</Button></div><div className="module-editor__lesson-list">{(formData.lessons || []).map((lesson, index) => <article key={lesson.id}><div className="module-editor__lesson-top"><span>{String(index + 1).padStart(2, '0')}</span><div><strong>Lesson {index + 1}</strong><small>{lesson.title || 'Untitled lesson'}</small></div><button type="button" onClick={() => removeLesson(lesson.id)} aria-label={`Remove lesson ${index + 1}`}><Trash2 /></button></div><div className="module-editor__grid module-editor__grid--lesson"><label><Label htmlFor={`module-lesson-title-${lesson.id}`}>Lesson title</Label><Input id={`module-lesson-title-${lesson.id}`} value={lesson.title} onChange={(event) => updateLesson(lesson.id, 'title', event.target.value)} placeholder="The Covenant of Marriage" required /></label><label><Label htmlFor={`module-lesson-duration-${lesson.id}`}>Duration</Label><Input id={`module-lesson-duration-${lesson.id}`} value={lesson.duration} onChange={(event) => updateLesson(lesson.id, 'duration', event.target.value)} placeholder="15 min" required /></label></div><label><Label htmlFor={`module-lesson-content-${lesson.id}`}>Lesson content</Label><Textarea id={`module-lesson-content-${lesson.id}`} value={lesson.content} onChange={(event) => updateLesson(lesson.id, 'content', event.target.value)} rows={7} placeholder="Use Markdown for headings, Scripture, reflection, and discussion prompts…" required /><small>Markdown formatting is supported.</small></label></article>)}{!formData.lessons?.length && <div className="module-console__empty module-console__empty--compact"><BookOpen /><h3>Start the lesson pathway</h3><p>Add the first lesson to shape this learning experience.</p><Button type="button" variant="outline" onClick={addLesson}><Plus /> Add first lesson</Button></div>}</div></section>
        <footer><Button type="button" variant="outline" onClick={() => onEditorOpenChange(false)}>Cancel</Button><Button type="submit" className="module-console__primary">{editingModule ? 'Save changes' : formData.status === 'published' ? 'Create & publish' : 'Save draft'}</Button></footer>
      </form></ScrollArea></DialogContent></Dialog>
    </main>
  );
}
