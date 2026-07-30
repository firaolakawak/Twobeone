import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Plus, Search, Edit, Trash2, Loader2, X, MessageCircle, Download, Upload, FileJson, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { createClient } from '../../utils/supabase/client';

const supabase = createClient();

type QuestionType = 'text' | 'multiple_choice' | 'multiple_select' | 'like_dislike' | 'love_hate' | 'scale' | 'yes_no';

interface Question {
  id: string;
  category: string;
  title: string;
  verse: string;
  verseReference: string;
  prompts: QuestionPrompt[];
  status: 'active' | 'inactive';
  language?: string; // Add language field
}

interface QuestionPrompt {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  scaleMax?: number;
}

interface QuestionsManagerProps {
  accessToken?: string;
}

export function QuestionsManager({ accessToken: propAccessToken }: QuestionsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(propAccessToken || null);

  const categories = [
    { id: 'daily-life', label: 'Daily Life & Habits' },
    { id: 'intimacy', label: 'Intimacy & Lifestyle' },
    { id: 'love-balance', label: 'Love & Balance' },
    { id: 'dream-wedding', label: 'Dream Wedding / Dream Home' },
    { id: 'travel', label: '✈️ Travel & Adventure' },
    { id: 'boundaries', label: '🛡️ Relationship Boundaries' },
    { id: 'trust', label: '🤝 Trust & Truth' },
    { id: 'kids-future', label: '👶 Kids & Future' },
    { id: 'finance', label: '💰 Finance & Goals' },
    { id: 'family', label: '👨‍👩‍👧‍👦 Family Relations' },
    { id: 'bible', label: '📖 Bible Convictions' },
  ];

  const questionTypes: { value: QuestionType; label: string; description: string }[] = [
    { value: 'text', label: 'Text Response', description: 'Free text answer' },
    { value: 'multiple_choice', label: 'Multiple Choice', description: 'Select one option' },
    { value: 'multiple_select', label: 'Multiple Select', description: 'Select multiple options' },
    { value: 'like_dislike', label: 'Like/Dislike', description: 'Thumbs up or down' },
    { value: 'love_hate', label: 'Love/Hate', description: 'Heart or broken heart' },
    { value: 'scale', label: 'Rating Scale', description: '1-5 or 1-10 scale' },
    { value: 'yes_no', label: 'Yes/No', description: 'Simple yes or no' },
  ];

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importCategory, setImportCategory] = useState('all');
  const [importLanguage, setImportLanguage] = useState<'auto' | 'en' | 'am' | 'om'>('auto');
  const [importPreview, setImportPreview] = useState<Partial<Question>[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [exportCategory, setExportCategory] = useState('all');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  useEffect(() => {
    loadQuestions();
    loadAccessToken();
  }, []);

  const loadAccessToken = async () => {
    // If we have a prop token, use it; otherwise refresh from session
    if (propAccessToken) {
      setAccessToken(propAccessToken);
      return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      setAccessToken(session.access_token);
    }
  };

  const loadQuestions = async () => {
    try {
      // Use prop token if available, otherwise try to get fresh session
      let token = propAccessToken;
      
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }
      
      if (!token) {
        toast.error('No valid session. Please sign in again.');
        return;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/questions/list`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const { questions: fetchedQuestions } = await response.json();
        setQuestions(fetchedQuestions || []);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const [formData, setFormData] = useState<Partial<Question>>({
    title: '',
    category: 'daily-life',
    verse: '',
    verseReference: '',
    prompts: [],
    status: 'active',
    language: 'en', // Default to English
  });

  const addPrompt = () => {
    setFormData({
      ...formData,
      prompts: [
        ...(formData.prompts || []),
        {
          id: Date.now().toString(),
          text: '',
          type: 'text',
        },
      ],
    });
  };

  const removePrompt = (index: number) => {
    const newPrompts = [...(formData.prompts || [])];
    newPrompts.splice(index, 1);
    setFormData({ ...formData, prompts: newPrompts });
  };

  const updatePrompt = (index: number, updates: Partial<QuestionPrompt>) => {
    const newPrompts = [...(formData.prompts || [])];
    newPrompts[index] = { ...newPrompts[index], ...updates };
    
    // Reset options when changing question type
    if (updates.type && !['multiple_choice', 'multiple_select'].includes(updates.type)) {
      newPrompts[index].options = undefined;
    }
    if (updates.type && updates.type !== 'scale') {
      newPrompts[index].scaleMax = undefined;
    }
    
    setFormData({ ...formData, prompts: newPrompts });
  };

  const addOption = (promptIndex: number) => {
    const newPrompts = [...(formData.prompts || [])];
    newPrompts[promptIndex].options = [...(newPrompts[promptIndex].options || []), ''];
    setFormData({ ...formData, prompts: newPrompts });
  };

  const updateOption = (promptIndex: number, optionIndex: number, value: string) => {
    const newPrompts = [...(formData.prompts || [])];
    const options = [...(newPrompts[promptIndex].options || [])];
    options[optionIndex] = value;
    newPrompts[promptIndex].options = options;
    setFormData({ ...formData, prompts: newPrompts });
  };

  const removeOption = (promptIndex: number, optionIndex: number) => {
    const newPrompts = [...(formData.prompts || [])];
    const options = [...(newPrompts[promptIndex].options || [])];
    options.splice(optionIndex, 1);
    newPrompts[promptIndex].options = options;
    setFormData({ ...formData, prompts: newPrompts });
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData(question);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      deleteQuestion(id);
    }
  };

  const handleDeduplicateAll = async () => {
    if (!confirm('Remove all duplicate questions? The oldest copy of each unique title will be kept.')) return;
    try {
      const token = accessToken || publicAnonKey;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/deduplicate-questions`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        toast.success(`✅ Removed ${data.removed} duplicates (${data.before} → ${data.after} questions)`);
        await loadQuestions();
      } else {
        toast.error('Deduplication failed');
      }
    } catch {
      toast.error('Could not connect to server');
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      const token = accessToken || publicAnonKey;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/questions/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== id));
        toast.success('Question deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Delete question error:', error);
      toast.error('Failed to delete question');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validPrompts = formData.prompts?.filter(p => p.text.trim()) || [];
    if (validPrompts.length < 1) {
      toast.error('Please add at least one question prompt');
      return;
    }

    // Validate prompts with options
    for (const prompt of validPrompts) {
      if (['multiple_choice', 'multiple_select'].includes(prompt.type)) {
        const validOptions = prompt.options?.filter(o => o.trim()) || [];
        if (validOptions.length < 2) {
          toast.error(`Please provide at least 2 options for "${prompt.text}"`);
          return;
        }
        prompt.options = validOptions;
      }
    }

    if (editingQuestion) {
      updateQuestion({ ...formData, prompts: validPrompts } as Question);
    } else {
      createQuestion({ ...formData, prompts: validPrompts } as Question);
    }
  };

  const createQuestion = async (question: Partial<Question>) => {
    try {
      const token = accessToken || publicAnonKey;
      
      console.log('Creating question:', question);
      console.log('Using token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/questions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(question)
        }
      );

      console.log('Create response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Create response:', result);
        toast.success('Question created successfully');
        loadQuestions(); // Reload questions from backend
        resetForm();
      } else {
        const error = await response.json();
        console.error('Create error response:', error);
        toast.error(error.error || 'Failed to create question');
      }
    } catch (error) {
      console.error('Create question error:', error);
      toast.error('Failed to create question');
    }
  };

  const updateQuestion = async (question: Question) => {
    try {
      const token = accessToken || publicAnonKey;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/questions/${question.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(question)
        }
      );

      if (response.ok) {
        toast.success('Question updated successfully');
        loadQuestions(); // Reload questions from backend
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update question');
      }
    } catch (error) {
      console.error('Update question error:', error);
      toast.error('Failed to update question');
    }
  };

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
    setFormData({
      title: '',
      category: 'daily-life',
      verse: '',
      verseReference: '',
      prompts: [],
      status: 'active',
      language: 'en', // Default to English
    });
  };

  const handleExport = () => {
    const toExport = exportCategory === 'all'
      ? questions
      : questions.filter(q => q.category === exportCategory);

    if (toExport.length === 0) {
      toast.error('No questions found for the selected category');
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      category: exportCategory,
      version: '1.0',
      questions: toExport.map(({ id, ...rest }) => rest), // strip IDs so imports get fresh ones
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const catLabel = exportCategory === 'all'
      ? 'all-categories'
      : categories.find(c => c.id === exportCategory)?.label?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || exportCategory;
    a.href = url;
    a.download = `qa-questions-${catLabel}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${toExport.length} question(s)`);
    setIsExportDialogOpen(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        let json: any;
        try {
          json = JSON.parse(text);
        } catch (parseErr: any) {
          setImportError(`JSON syntax error: ${parseErr.message}. Fix the file and try again.`);
          return;
        }

        // Accept: array at root, { questions: [...] }, { data: [...] }, { items: [...] }
        let raw: any[] = [];
        if (Array.isArray(json)) {
          raw = json;
        } else if (Array.isArray(json.questions)) {
          raw = json.questions;
        } else if (Array.isArray(json.data)) {
          raw = json.data;
        } else if (Array.isArray(json.items)) {
          raw = json.items;
        } else {
          const keys = Object.keys(json);
          const arrKey = keys.find(k => Array.isArray(json[k]));
          if (arrKey) raw = json[arrKey];
        }

        if (raw.length === 0) {
          const topKeys = Object.keys(json).join(', ');
          setImportError(`No question array found. File has keys: [${topKeys}]. Expected a "questions" array.`);
          return;
        }

        // Accept questions with title+prompts, or title alone (prompts optional)
        const valid = raw.filter(q => q.title);
        const withPrompts = valid.filter(q => Array.isArray(q.prompts) && q.prompts.length > 0);

        if (valid.length === 0) {
          setImportError(`Found ${raw.length} items but none have a "title" field.`);
          return;
        }

        // Auto-detect language
        const detectedLang = valid.find(q => q.language)?.language;
        if (detectedLang && importLanguage === 'auto') {
          setImportLanguage(detectedLang as 'en' | 'am' | 'om');
        }

        // Use questions with prompts if available, otherwise all valid ones
        setImportPreview(withPrompts.length > 0 ? withPrompts : valid);
      } catch (err: any) {
        setImportError(`Unexpected error: ${err?.message || err}`);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImportSubmit = async () => {
    if (!importPreview || importPreview.length === 0) return;
    setIsImporting(true);
    const token = accessToken || publicAnonKey;
    let succeeded = 0;
    let failed = 0;

    for (const q of importPreview) {
      try {
        const resolvedLang = importLanguage === 'auto'
          ? (q.language || 'en')
          : importLanguage;
        const payload = {
          ...q,
          id: undefined,
          // Only override category if a specific one was chosen
          category: importCategory === 'all' ? (q.category || 'daily-life') : importCategory,
          status: q.status || 'active',
          language: resolvedLang,
        };
        const resp = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/questions`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        if (resp.ok) succeeded++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setIsImporting(false);
    if (succeeded > 0) toast.success(`Imported ${succeeded} question(s) successfully`);
    if (failed > 0) toast.error(`${failed} question(s) failed to import`);
    setIsImportDialogOpen(false);
    setImportPreview(null);
    setImportError(null);
    loadQuestions();
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.verseReference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || q.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getQuestionTypeLabel = (type: QuestionType) => {
    return questionTypes.find(qt => qt.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-[24px]">Q&A Discussion Questions</h2>
          <p className="text-sm text-muted-foreground text-[16px]">Manage conversation topics with flexible question types</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Export Dialog */}
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-success-700" />
                  Export Q&A Questions
                </DialogTitle>
                <DialogDescription>
                  Download questions as a JSON file. You can re-import them later or share with others.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Select Category to Export</Label>
                  <select
                    value={exportCategory}
                    onChange={(e) => setExportCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-border text-sm mt-1"
                  >
                    <option value="all">📦 All Categories ({questions.length} questions)</option>
                    {categories.map(cat => {
                      const count = questions.filter(q => q.category === cat.id).length;
                      return (
                        <option key={cat.id} value={cat.id}>
                          {cat.label} ({count} questions)
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
                  <p className="font-medium mb-1">What gets exported:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Question titles, Bible verses &amp; references</li>
                    <li>• All prompts with types and options</li>
                    <li>• Category, language, and status</li>
                    <li>• IDs are stripped — imports create fresh entries</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsExportDialogOpen(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleExport} className="flex-1 bg-success-500 hover:bg-success-700 gap-2">
                    <Download className="w-4 h-4" />
                    Download JSON
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Import Dialog */}
          <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
            setIsImportDialogOpen(open);
            if (!open) { setImportPreview(null); setImportError(null); setImportLanguage('auto'); }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 border-primary-300 text-primary-700 hover:bg-primary-50">
                <Upload className="w-4 h-4" />
                Upload JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-primary-600" />
                  Upload Q&A Questions JSON
                </DialogTitle>
                <DialogDescription>
                  Upload Amharic, Afan Oromo, or English Q&A questions from a JSON file.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-4 pt-2 pb-1">

                {/* Language selector */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Content Language</Label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { code: 'auto' as const, label: 'Auto-detect', flag: '🔍' },
                      { code: 'en' as const, label: 'English', flag: '🇺🇸' },
                      { code: 'am' as const, label: 'Amharic — አማርኛ', flag: '🇪🇹' },
                      { code: 'om' as const, label: 'Afan Oromo', flag: '🇪🇹' },
                    ]).map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setImportLanguage(lang.code)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${importLanguage === lang.code ? 'var(--primary-500)' : 'var(--border)'}`,
                          backgroundColor: importLanguage === lang.code ? 'var(--primary-50)' : 'transparent',
                          color: importLanguage === lang.code ? 'var(--primary-700)' : 'var(--neutral-600)',
                          fontSize: 'var(--text-label)',
                          fontWeight: importLanguage === lang.code ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <span>{lang.flag}</span><span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Auto-detect reads the <code>language</code> field from each question in the JSON.
                  </p>
                </div>

                {/* Category override */}
                <div>
                  <Label>Category Override <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <select
                    value={importCategory}
                    onChange={(e) => setImportCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-border text-sm mt-1"
                  >
                    <option value="all">Keep each question's own category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Drop zone */}
                <div>
                  <Label>JSON File</Label>
                  <label className="mt-1 flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                    {importPreview ? (
                      <CheckCircle2 className="w-7 h-7 text-success-600 mb-1" />
                    ) : (
                      <FileJson className="w-7 h-7 text-muted-foreground mb-1" />
                    )}
                    <span className="text-sm font-medium" style={{ color: importPreview ? 'var(--success-700)' : 'var(--neutral-600)' }}>
                      {importPreview
                        ? `${importPreview.length} question${importPreview.length !== 1 ? 's' : ''} ready`
                        : 'Click to select a .json file'}
                    </span>
                    {importPreview && (
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Language: {importLanguage === 'auto' ? `auto (${importPreview.find(q => q.language)?.language || 'en'})` : importLanguage.toUpperCase()}
                      </span>
                    )}
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={handleImportFile}
                    />
                  </label>
                </div>

                {importError && (
                  <div className="flex items-start gap-2 bg-error-50 border border-error-200 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 text-error-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-error-700">{importError}</p>
                  </div>
                )}

                {importPreview && importPreview.length > 0 && (
                  <ScrollArea className="h-48 border border-border rounded-lg">
                    <div className="divide-y divide-border">
                      {importPreview.map((q, i) => (
                        <div key={i} className="px-3 py-2 text-xs flex items-center gap-2">
                          <span className="text-muted-foreground font-medium w-5 flex-shrink-0">{i + 1}.</span>
                          <span className="flex-1 min-w-0 truncate font-medium" lang={q.language === 'am' || q.language === 'om' ? q.language : undefined}>
                            {q.title}
                          </span>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">{q.category || importCategory}</Badge>
                          <span className="text-muted-foreground flex-shrink-0">{q.prompts?.length || 0}p</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>{/* end scrollable body */}
              </div>{/* end pb wrapper */}

              {/* Sticky footer — always visible */}
              <div className="flex-shrink-0 flex gap-2 pt-3 border-t border-border mt-1">
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} className="flex-1">Cancel</Button>
                <Button
                  onClick={handleImportSubmit}
                  disabled={!importPreview || importPreview.length === 0 || isImporting}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 gap-2"
                >
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isImporting ? 'Saving…' : `Save ${importPreview?.length ?? 0} Questions`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDeduplicateAll}
          className="w-full sm:w-auto"
          style={{ borderColor: 'var(--error-500)', color: 'var(--error-500)', fontSize: 'var(--text-caption)', fontWeight: 'var(--font-weight-medium)' }}
        >
          🗑️ Remove Duplicates
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary-600 hover:bg-primary-700 w-full sm:w-auto"
              size="sm"
              onClick={() => {
                setEditingQuestion(null);
                setFormData({
                  title: '',
                  category: 'daily-life',
                  verse: '',
                  verseReference: '',
                  prompts: [],
                  status: 'active',
                  language: 'en', // Default to English
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] w-full">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingQuestion ? 'Edit Question' : 'Create New Question'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingQuestion ? 'Update the details of this Q&A question.' : 'Create a new question for couples to answer and discuss together.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[75vh] pr-2 sm:pr-4">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-xs sm:text-sm">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-border text-xs sm:text-sm"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full h-10 px-3 rounded-md border border-border text-xs sm:text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title" className="text-xs sm:text-sm">Question Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Morning Routines & Quiet Time"
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
                  <Label htmlFor="reference" className="text-xs sm:text-sm">Verse Reference</Label>
                  <Input
                    id="reference"
                    value={formData.verseReference}
                    onChange={(e) => setFormData({ ...formData, verseReference: e.target.value })}
                    placeholder="e.g., Mark 1:35"
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="language" className="text-xs sm:text-sm">Language</Label>
                  <select
                    id="language"
                    value={formData.language || 'en'}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-border text-xs sm:text-sm"
                  >
                    <option value="en">🌍 English</option>
                    <option value="am">🌍 አማርኛ (Amharic)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the language for this question. Users can filter questions by language.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Label className="text-xs sm:text-sm">Discussion Questions</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPrompt} className="w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Question
                    </Button>
                  </div>

                  {(formData.prompts || []).map((prompt, promptIndex) => (
                    <Card key={prompt.id} className="p-3 sm:p-4 space-y-3 relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removePrompt(promptIndex)}
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>

                      <div className="pr-8">
                        <Label className="text-xs sm:text-sm">Question Type</Label>
                        <select
                          value={prompt.type}
                          onChange={(e) => updatePrompt(promptIndex, { type: e.target.value as QuestionType })}
                          className="w-full h-10 px-3 rounded-md border border-border mt-1 text-xs sm:text-sm"
                        >
                          {questionTypes.map(qt => (
                            <option key={qt.value} value={qt.value}>
                              {qt.label} - {qt.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs sm:text-sm">Question Text</Label>
                        <Textarea
                          value={prompt.text}
                          onChange={(e) => updatePrompt(promptIndex, { text: e.target.value })}
                          placeholder="Enter your question..."
                          rows={2}
                          className="mt-1 text-xs sm:text-sm"
                          required
                        />
                      </div>

                      {/* Multiple Choice / Multiple Select Options */}
                      {['multiple_choice', 'multiple_select'].includes(prompt.type) && (
                        <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-primary-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <Label className="text-xs sm:text-sm">Answer Options</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(promptIndex)}
                              className="w-full sm:w-auto"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Option
                            </Button>
                          </div>
                          {(prompt.options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(promptIndex, optionIndex, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                                required
                                className="text-xs sm:text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(promptIndex, optionIndex)}
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Scale Options */}
                      {prompt.type === 'scale' && (
                        <div className="pl-2 sm:pl-4 border-l-2 border-primary-200">
                          <Label className="text-xs sm:text-sm">Scale Maximum</Label>
                          <select
                            value={prompt.scaleMax || 5}
                            onChange={(e) => updatePrompt(promptIndex, { scaleMax: parseInt(e.target.value) })}
                            className="w-full h-10 px-3 rounded-md border border-border mt-1 text-xs sm:text-sm"
                          >
                            <option value="5">1-5 Scale</option>
                            <option value="10">1-10 Scale</option>
                          </select>
                        </div>
                      )}
                    </Card>
                  ))}

                  {(!formData.prompts || formData.prompts.length === 0) && (
                    <Card className="p-6 sm:p-8 text-center border-dashed">
                      <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-xs sm:text-sm">No questions added yet</p>
                      <p className="text-muted-foreground text-xs">Click "Add Question" to get started</p>
                    </Card>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 sm:flex-1">
                    {editingQuestion ? 'Update' : 'Create'} Question
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        <Card className="lg:col-span-8 p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sm:pl-10 text-xs sm:text-sm text-[14px]"
            />
          </div>
        </Card>
        <Card className="lg:col-span-4 p-3 sm:p-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-border text-xs sm:text-sm text-[14px]"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 text-[14px] font-bold">Total Questions</p>
          <p className="text-xl sm:text-2xl font-semibold font-bold">{questions.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 text-[14px] font-bold">Active</p>
          <p className="text-xl sm:text-2xl font-semibold text-success-700 font-bold">
            {questions.filter(q => q.status === 'active').length}
          </p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 text-[14px] font-bold">Categories</p>
          <p className="text-xl sm:text-2xl font-semibold font-bold">{categories.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 text-[13px] font-bold">Total Prompts</p>
          <p className="text-xl sm:text-2xl font-semibold font-bold">
            {questions.reduce((sum, q) => sum + q.prompts.length, 0)}
          </p>
        </Card>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((question) => (
          <Card key={question.id} className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
                  <h3 className="font-semibold text-base sm:text-lg font-bold">{question.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {categories.find(c => c.id === question.category)?.label || question.category}
                  </Badge>
                  <Badge variant={question.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {question.status}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground italic mb-3 font-bold">{question.verseReference}</p>
                <div className="space-y-2">
                  {question.prompts.map((prompt, index) => (
                    <div key={prompt.id} className="text-xs sm:text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium font-bold">{index + 1}.</span>
                        <span className="text-foreground">{prompt.text}</span>
                        <Badge variant="secondary" className="text-xs">
                          {getQuestionTypeLabel(prompt.type)}
                        </Badge>
                      </div>
                      {prompt.options && prompt.options.length > 0 && (
                        <div className="ml-4 sm:ml-6 mt-1 text-xs text-muted-foreground">
                          Options: {prompt.options.join(', ')}
                        </div>
                      )}
                      {prompt.type === 'scale' && (
                        <div className="ml-4 sm:ml-6 mt-1 text-xs text-muted-foreground">
                          Scale: 1-{prompt.scaleMax || 5}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(question)}
                  className="text-xs"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(question.id)}
                  className="text-xs"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-error-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}