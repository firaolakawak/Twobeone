import { BrandLoader, LoadingMark } from "../../BrandLoader";
import { useUiCopy } from "../../../utils/uiTranslation";
import { adminContentMessages } from "../../../locales/adminContent";
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import {
  ArrowUpDown, BookOpen, CheckCircle2, ChevronRight, Copy, Edit, FileJson,
  Filter, Languages, Layers3, MessageCircle, MessagesSquare, Plus, RefreshCw,
  Search, SlidersHorizontal, Sparkles, Trash2, Upload, UsersRound, X,
} from 'lucide-react';
import type { Question, QuestionPrompt, QuestionType } from '../QuestionsManager';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { ScrollArea } from '../../ui/scroll-area';

interface Category { id: string; label: string }
interface QuestionTypeOption { value: QuestionType; label: string; description: string }

interface Props {
  questions: Question[];
  filteredQuestions: Question[];
  selectedQuestion: Question | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  categories: Category[];
  questionTypes: QuestionTypeOption[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  languageFilter: 'all' | 'en' | 'am' | 'om';
  onLanguageFilterChange: (value: 'all' | 'en' | 'am' | 'om') => void;
  sortOrder: 'title' | 'category' | 'prompts';
  onSortOrderChange: (value: 'title' | 'category' | 'prompts') => void;
  onRefresh: () => void;
  onNew: () => void;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onDeduplicate: () => void;
  editorOpen: boolean;
  onEditorOpenChange: (open: boolean) => void;
  editingQuestion: Question | null;
  formData: Partial<Question>;
  onFormDataChange: Dispatch<SetStateAction<Partial<Question>>>;
  onSubmit: (event: FormEvent) => void;
  onAddPrompt: () => void;
  onRemovePrompt: (index: number) => void;
  onUpdatePrompt: (index: number, updates: Partial<QuestionPrompt>) => void;
  onAddOption: (promptIndex: number) => void;
  onUpdateOption: (promptIndex: number, optionIndex: number, value: string) => void;
  onRemoveOption: (promptIndex: number, optionIndex: number) => void;
  toolsOpen: boolean;
  onToolsOpenChange: (open: boolean) => void;
  importCategory: string;
  onImportCategoryChange: (value: string) => void;
  importLanguage: 'auto' | 'en' | 'am' | 'om';
  onImportLanguageChange: (value: 'auto' | 'en' | 'am' | 'om') => void;
  importPreview: Partial<Question>[] | null;
  importError: string | null;
  isImporting: boolean;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImportSubmit: () => void;
  exportCategory: string;
  onExportCategoryChange: (value: string) => void;
  onExport: () => void;
}

const languageNames: Record<string, string> = { en: 'English', am: 'Amharic', om: 'Afan Oromo' };
const typeNames: Record<QuestionType, string> = {
  text: 'Text response', multiple_choice: 'Multiple choice', multiple_select: 'Multiple select',
  like_dislike: 'Like / dislike', love_hate: 'Love / hate', scale: 'Rating scale', yes_no: 'Yes / no',
};

function PromptPreview({ prompt, index }: { prompt: QuestionPrompt; index: number }) {
  const tr = useUiCopy(adminContentMessages);
  return (
    <article className="qa-preview__prompt">
      <div><span>{String(index + 1).padStart(2, '0')}</span><small>{tr(typeNames[prompt.type])}</small></div>
      <h3>{prompt.text}</h3>
      {prompt.type === 'text' && <div className="qa-preview__text-answer">{tr("Write your response…")}</div>}
      {(prompt.type === 'multiple_choice' || prompt.type === 'multiple_select') && <div className="qa-preview__options">{(prompt.options || []).map((option) => <span key={option}><i />{option}</span>)}</div>}
      {prompt.type === 'yes_no' && <div className="qa-preview__binary"><span>{tr("Yes")}</span><span>{tr("No")}</span></div>}
      {prompt.type === 'like_dislike' && <div className="qa-preview__binary"><span>{tr("Like")}</span><span>{tr("Dislike")}</span></div>}
      {prompt.type === 'love_hate' && <div className="qa-preview__binary"><span>{tr("Love")}</span><span>{tr("Not for me")}</span></div>}
      {prompt.type === 'scale' && <div className="qa-preview__scale">{Array.from({ length: prompt.scaleMax || 5 }, (_, value) => <span key={value}>{value + 1}</span>)}</div>}
    </article>
  );
}

export function QuestionsWorkspace(props: Props) {
  const tr = useUiCopy(adminContentMessages);
  const {
    questions, filteredQuestions, selectedQuestion, selectedId, onSelect, categories,
    questionTypes, isLoading, searchQuery, onSearchChange, categoryFilter,
    onCategoryFilterChange, statusFilter, onStatusFilterChange, languageFilter,
    onLanguageFilterChange, sortOrder, onSortOrderChange, onRefresh, onNew,
    onEdit, onDelete, onDeduplicate, editorOpen, onEditorOpenChange,
    editingQuestion, formData, onFormDataChange, onSubmit, onAddPrompt,
    onRemovePrompt, onUpdatePrompt, onAddOption, onUpdateOption, onRemoveOption,
    toolsOpen, onToolsOpenChange, importCategory, onImportCategoryChange,
    importLanguage, onImportLanguageChange, importPreview, importError,
    isImporting, onImportFile, onImportSubmit, exportCategory,
    onExportCategoryChange, onExport,
  } = props;

  const activeCount = questions.filter((question) => question.status === 'active').length;
  const promptCount = questions.reduce((total, question) => total + (question.prompts?.length || 0), 0);
  const usedCategories = new Set(questions.map((question) => question.category)).size;
  const categoryName = (id: string) => tr(categories.find((category) => category.id === id)?.label || id);
  const setField = <K extends keyof Question>(key: K, value: Question[K]) => onFormDataChange((current) => ({ ...current, [key]: value }));

  return (
    <main className="qa-console">
      <header className="qa-console__hero">
        <div><span className="qa-console__eyebrow"><Sparkles /> {tr("Conversation studio")}</span><h1>{tr("Q&A Questions")}</h1><p>{tr("Design meaningful prompts that help couples listen, reflect, and grow together.")}</p></div>
        <div className="qa-console__hero-actions"><Button variant="outline" onClick={() => onToolsOpenChange(true)} aria-label={tr("Open question data tools")}><SlidersHorizontal /> {tr("Data tools")}</Button><Button onClick={onNew} className="qa-console__primary"><Plus /> {tr("New question set")}</Button></div>
      </header>

      <section className="qa-console__metrics" aria-label={tr("Question library summary")}>
        <article><span><MessagesSquare /></span><div><strong>{questions.length}</strong><small>{tr("Question sets")}</small></div></article>
        <article><span><CheckCircle2 /></span><div><strong>{activeCount}</strong><small>{tr("Active")}</small></div></article>
        <article><span><Layers3 /></span><div><strong>{promptCount}</strong><small>{tr("Total prompts")}</small></div></article>
        <article><span><UsersRound /></span><div><strong>{usedCategories}</strong><small>{tr("Categories in use")}</small></div></article>
      </section>

      <section className="qa-console__toolbar" aria-label={tr("Question filters")}>
        <div className="qa-console__search"><Search /><Input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder={tr("Search titles, Scripture, or prompts…")} aria-label={tr("Search question sets")} />{searchQuery && <button type="button" onClick={() => onSearchChange('')} aria-label={tr("Clear search")}><X /></button>}</div>
        <div className="qa-console__segments" aria-label={tr("Filter by status")}>{(['all', 'active', 'inactive'] as const).map((status) => <button type="button" key={status} data-active={statusFilter === status || undefined} aria-pressed={statusFilter === status} onClick={() => onStatusFilterChange(status)}>{tr(status)}</button>)}</div>
        <label className="qa-console__select"><Filter /><select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)} aria-label={tr("Filter by category")}><option value="all">{tr("All categories")}</option>{categories.map((category) => <option value={category.id} key={category.id}>{tr(category.label)}</option>)}</select></label>
        <label className="qa-console__select"><Languages /><select value={languageFilter} onChange={(event) => onLanguageFilterChange(event.target.value as Props['languageFilter'])} aria-label={tr("Filter by language")}><option value="all">{tr("All languages")}</option><option value="en">{tr("English")}</option><option value="am">{tr("Amharic")}</option><option value="om">{tr("Afan Oromo")}</option></select></label>
        <label className="qa-console__select"><ArrowUpDown /><select value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value as Props['sortOrder'])} aria-label={tr("Sort question sets")}><option value="category">{tr("Category")}</option><option value="title">{tr("Title A–Z")}</option><option value="prompts">{tr("Most prompts")}</option></select></label>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={isLoading} aria-label={tr("Refresh questions")}>{isLoading ? <LoadingMark /> : <RefreshCw  />}</Button>
      </section>

      <div className="qa-console__result-line" role="status"><span>{filteredQuestions.length} {filteredQuestions.length === 1 ? tr("question set") : tr("question sets")}</span>{(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || languageFilter !== 'all') && <button type="button" onClick={() => { onSearchChange(''); onCategoryFilterChange('all'); onStatusFilterChange('all'); onLanguageFilterChange('all'); }}>{tr("Clear filters")}</button>}</div>

      <section className="qa-console__workspace">
        <div className="qa-console__list" aria-label={tr("Question set library")} aria-busy={isLoading}>
          {isLoading && <BrandLoader className="py-8" />}
          {!isLoading && filteredQuestions.map((question) => {
            const active = selectedId ? selectedId === question.id : question.id === filteredQuestions[0]?.id;
            return <article className="qa-console__row" data-active={active || undefined} key={question.id}><button type="button" className="qa-console__row-main" onClick={() => onSelect(question.id)} aria-label={tr('Preview {title}', { title: question.title })}><span className="qa-console__category-mark"><MessageCircle /></span><div><div className="qa-console__row-title"><h2>{question.title}</h2><span className={`qa-console__status qa-console__status--${question.status}`}>{tr(question.status)}</span></div><p>{categoryName(question.category)}</p><small>{question.prompts?.length || 0} {tr("prompts ·")} {tr(languageNames[question.language || 'en'] || question.language || "")}</small></div><ChevronRight /></button><div className="qa-console__row-actions"><button type="button" onClick={() => onEdit(question)} aria-label={tr('Edit {title}', { title: question.title })}><Edit /> {tr("Edit")}</button><button type="button" className="qa-console__delete" onClick={() => onDelete(question.id)} aria-label={tr('Delete {title}', { title: question.title })}><Trash2 /> {tr("Delete")}</button></div></article>;
          })}
          {!isLoading && !filteredQuestions.length && <div className="qa-console__empty"><MessagesSquare /><h2>{tr("No question sets found")}</h2><p>{tr("Adjust your filters or design a new conversation.")}</p><Button onClick={onNew}><Plus /> {tr("New question set")}</Button></div>}
        </div>

        <aside className="qa-console__preview" aria-label={tr("Question set preview")}>
          {selectedQuestion ? <><div className="qa-console__preview-top"><div><span className={`qa-console__status qa-console__status--${selectedQuestion.status}`}>{tr(selectedQuestion.status)}</span><span>{tr(languageNames[selectedQuestion.language || 'en'] || selectedQuestion.language || "")}</span></div><div><button type="button" onClick={() => onEdit(selectedQuestion)} aria-label={tr('Edit {title}', { title: selectedQuestion.title })}><Edit /></button><button type="button" className="qa-console__delete" onClick={() => onDelete(selectedQuestion.id)} aria-label={tr('Delete {title}', { title: selectedQuestion.title })}><Trash2 /></button></div></div><p className="qa-console__preview-category">{categoryName(selectedQuestion.category)}</p><h2>{selectedQuestion.title}</h2>{selectedQuestion.verse && <blockquote><p>“{selectedQuestion.verse}”</p><cite>{selectedQuestion.verseReference}</cite></blockquote>}<div className="qa-console__preview-heading"><span>{tr("Conversation preview")}</span><small>{selectedQuestion.prompts?.length || 0} {tr("prompts")}</small></div><div className="qa-preview__prompts">{selectedQuestion.prompts?.map((prompt, index) => <PromptPreview prompt={prompt} index={index} key={prompt.id} />)}</div></> : <div className="qa-console__empty"><MessageCircle /><h2>{tr("Select a question set")}</h2><p>{tr("The couple-facing conversation preview will appear here.")}</p></div>}
        </aside>
      </section>

      <Dialog open={toolsOpen} onOpenChange={onToolsOpenChange}><DialogContent className="qa-tools max-w-[95vw] sm:max-w-3xl max-h-[90vh]"><DialogHeader><DialogTitle>{tr("Question data tools")}</DialogTitle><DialogDescription>{tr("Import, export, and clean up the Q&A library.")}</DialogDescription></DialogHeader><ScrollArea className="max-h-[74vh] pr-4"><div className="qa-tools__grid"><section><div className="qa-tools__title"><Upload /><div><h3>{tr("Import JSON")}</h3><p>{tr("Add question sets from a compatible file.")}</p></div></div><label><Label htmlFor="qa-import-language">{tr("Content language")}</Label><select id="qa-import-language" value={importLanguage} onChange={(event) => onImportLanguageChange(event.target.value as Props['importLanguage'])}><option value="auto">{tr("Auto-detect")}</option><option value="en">{tr("English")}</option><option value="am">{tr("Amharic")}</option><option value="om">{tr("Afan Oromo")}</option></select></label><label><Label htmlFor="qa-import-category">{tr("Category override")}</Label><select id="qa-import-category" value={importCategory} onChange={(event) => onImportCategoryChange(event.target.value)}><option value="all">{tr("Keep source categories")}</option>{categories.map((category) => <option value={category.id} key={category.id}>{tr(category.label)}</option>)}</select></label><label className="qa-tools__drop"><input type="file" accept=".json,application/json" onChange={onImportFile} /><FileJson /><strong>{importPreview ? tr('{count} sets ready', { count: importPreview.length }) : tr("Choose JSON file")}</strong><small>{tr("Supports array or questions object")}</small></label>{importError && <p className="qa-tools__error">{importError}</p>}{importPreview && <div className="qa-tools__preview">{importPreview.slice(0, 5).map((question, index) => <span key={index}>{question.title}</span>)}{importPreview.length > 5 && <small>+{importPreview.length - 5} {tr("more")}</small>}</div>}<Button onClick={onImportSubmit} disabled={!importPreview?.length || isImporting} className="qa-console__primary">{isImporting ? tr("Importing…") : tr('Import {count} sets', { count: importPreview?.length || 0 })}</Button></section><section><div className="qa-tools__title"><FileJson /><div><h3>{tr("Export library")}</h3><p>{tr("Download a portable JSON backup.")}</p></div></div><label><Label htmlFor="qa-export-category">{tr("Export scope")}</Label><select id="qa-export-category" value={exportCategory} onChange={(event) => onExportCategoryChange(event.target.value)}><option value="all">{tr("All categories (")}{questions.length})</option>{categories.map((category) => <option value={category.id} key={category.id}>{tr(category.label)}</option>)}</select></label><Button variant="outline" onClick={onExport}><FileJson /> {tr("Download JSON")}</Button><div className="qa-tools__divider" /><div className="qa-tools__title"><Copy /><div><h3>{tr("Library cleanup")}</h3><p>{tr("Keep the oldest copy of duplicate titles.")}</p></div></div><Button variant="outline" className="qa-tools__danger" onClick={onDeduplicate}><Trash2 /> {tr("Remove duplicates")}</Button></section></div></ScrollArea></DialogContent></Dialog>

      <Dialog open={editorOpen} onOpenChange={onEditorOpenChange}><DialogContent className="qa-editor-dialog max-w-[96vw] sm:max-w-5xl max-h-[94vh]"><DialogHeader><DialogTitle>{editingQuestion ? tr("Edit question set") : tr("Create question set")}</DialogTitle><DialogDescription>{tr("Define the topic, Biblical context, and couple-facing prompt sequence.")}</DialogDescription></DialogHeader><ScrollArea className="max-h-[79vh] pr-4"><form onSubmit={onSubmit} className="qa-editor"><section><div className="qa-editor__section-title"><span>01</span><div><h3>{tr("Conversation setup")}</h3><p>{tr("Organize and publish this question set.")}</p></div></div><div className="qa-editor__grid"><label><Label htmlFor="qa-category">{tr("Category")}</Label><select id="qa-category" value={formData.category || 'daily-life'} onChange={(event) => setField('category', event.target.value)}>{categories.map((category) => <option value={category.id} key={category.id}>{tr(category.label)}</option>)}</select></label><label><Label htmlFor="qa-language">{tr("Language")}</Label><select id="qa-language" value={formData.language || 'en'} onChange={(event) => setField('language', event.target.value)}><option value="en">{tr("English")}</option><option value="am">{tr("Amharic")}</option><option value="om">{tr("Afan Oromo")}</option></select></label><label><Label htmlFor="qa-status">{tr("Status")}</Label><select id="qa-status" value={formData.status || 'active'} onChange={(event) => setField('status', event.target.value as Question['status'])}><option value="active">{tr("Active")}</option><option value="inactive">{tr("Inactive")}</option></select></label></div><label><Label htmlFor="qa-title">{tr("Question-set title")}</Label><Input id="qa-title" value={formData.title || ''} onChange={(event) => setField('title', event.target.value)} placeholder={tr("A clear theme for this conversation")} required /><small>{formData.title?.length || 0} {tr("characters")}</small></label></section><section><div className="qa-editor__section-title"><span>02</span><div><h3>{tr("Scripture anchor")}</h3><p>{tr("Connect the conversation to Biblical wisdom.")}</p></div></div><div className="qa-editor__grid qa-editor__grid--scripture"><label><Label htmlFor="qa-verse">{tr("Bible verse")}</Label><Textarea id="qa-verse" value={formData.verse || ''} onChange={(event) => setField('verse', event.target.value)} rows={5} placeholder={tr("Enter the complete verse text")} required /></label><label><Label htmlFor="qa-reference">{tr("Reference")}</Label><Input id="qa-reference" value={formData.verseReference || ''} onChange={(event) => setField('verseReference', event.target.value)} placeholder={tr("James 1:19")} required /><div className="qa-editor__verse-preview">{formData.verse ? <><p>“{formData.verse}”</p><cite>{formData.verseReference}</cite></> : <p>{tr("Scripture preview")}</p>}</div></label></div></section><section><div className="qa-editor__section-title qa-editor__section-title--actions"><div className="qa-editor__section-title"><span>03</span><div><h3>{tr("Prompt sequence")}</h3><p>{tr("Mix response types to keep the conversation engaging.")}</p></div></div><Button type="button" variant="outline" onClick={onAddPrompt}><Plus /> {tr("Add prompt")}</Button></div><div className="qa-editor__prompts">{(formData.prompts || []).map((prompt, promptIndex) => <article key={prompt.id} className="qa-editor__prompt"><header><span>{tr("Prompt")} {String(promptIndex + 1).padStart(2, '0')}</span><button type="button" onClick={() => onRemovePrompt(promptIndex)} aria-label={tr('Remove prompt {number}', { number: promptIndex + 1 })}><Trash2 /></button></header><div className="qa-editor__grid"><label><Label htmlFor={`prompt-type-${prompt.id}`}>{tr("Response type")}</Label><select id={`prompt-type-${prompt.id}`} value={prompt.type} onChange={(event) => onUpdatePrompt(promptIndex, { type: event.target.value as QuestionType })}>{questionTypes.map((type) => <option value={type.value} key={type.value}>{tr(type.label)} — {tr(type.description)}</option>)}</select></label><label><Label htmlFor={`prompt-text-${prompt.id}`}>{tr("Prompt")}</Label><Textarea id={`prompt-text-${prompt.id}`} value={prompt.text} onChange={(event) => onUpdatePrompt(promptIndex, { text: event.target.value })} rows={3} placeholder={tr("What would you like the couple to discuss?")} required /></label></div>{(prompt.type === 'multiple_choice' || prompt.type === 'multiple_select') && <div className="qa-editor__options"><div><Label>{tr("Answer options")}</Label><button type="button" onClick={() => onAddOption(promptIndex)}><Plus /> {tr("Add option")}</button></div>{(prompt.options || []).map((option, optionIndex) => <label key={optionIndex}><span>{optionIndex + 1}</span><Input value={option} onChange={(event) => onUpdateOption(promptIndex, optionIndex, event.target.value)} placeholder={tr('Option {number}', { number: optionIndex + 1 })} required /><button type="button" onClick={() => onRemoveOption(promptIndex, optionIndex)} aria-label={tr('Remove option {number}', { number: optionIndex + 1 })}><X /></button></label>)}</div>}{prompt.type === 'scale' && <label className="qa-editor__scale"><Label htmlFor={`scale-${prompt.id}`}>{tr("Scale maximum")}</Label><select id={`scale-${prompt.id}`} value={prompt.scaleMax || 5} onChange={(event) => onUpdatePrompt(promptIndex, { scaleMax: Number(event.target.value) })}><option value="5">1–5</option><option value="10">1–10</option></select></label>}</article>)}{!formData.prompts?.length && <button className="qa-editor__empty-prompts" type="button" onClick={onAddPrompt}><MessageCircle /><strong>{tr("Add the first prompt")}</strong><small>{tr("Choose from seven flexible response types.")}</small></button>}</div></section><footer><Button type="button" variant="outline" onClick={() => onEditorOpenChange(false)}>{tr("Cancel")}</Button><Button type="submit" className="qa-console__primary">{editingQuestion ? tr("Save changes") : tr("Create question set")}</Button></footer></form></ScrollArea></DialogContent></Dialog>
    </main>
  );
}
