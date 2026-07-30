import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, GraduationCap, ChevronRight, X, Bold, Italic, Heading2, Quote, List, ListOrdered, Link, Minus } from 'lucide-react';
import { ModulesImportExport } from './ModulesImportExport';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const mdToHtml = (md: string): string => {
  if (!md) return '';
  const lines = md.split('\n');
  const out: string[] = [];
  let inUl = false, inOl = false;
  const closeList = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };
  for (const raw of lines) {
    const l = raw
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    if (/^### (.+)/.test(l)) { closeList(); out.push(`<h3 style="font-size:1em;font-weight:700;margin:6px 0 2px">${l.replace(/^### /, '')}</h3>`); }
    else if (/^## (.+)/.test(l)) { closeList(); out.push(`<h2 style="font-size:1.15em;font-weight:700;margin:8px 0 3px">${l.replace(/^## /, '')}</h2>`); }
    else if (/^> (.+)/.test(l)) { closeList(); out.push(`<blockquote style="border-left:3px solid var(--border);padding-left:10px;color:var(--muted-foreground);margin:4px 0">${l.replace(/^> /, '')}</blockquote>`); }
    else if (/^---$/.test(l.trim())) { closeList(); out.push(`<hr style="border:none;border-top:1px solid var(--border);margin:8px 0">`); }
    else if (/^- (.+)/.test(l)) { if (!inUl) { if (inOl) { out.push('</ol>'); inOl = false; } out.push('<ul style="list-style:disc;padding-left:18px;margin:4px 0">'); inUl = true; } out.push(`<li>${l.replace(/^- /, '')}</li>`); }
    else if (/^\d+\. (.+)/.test(l)) { if (!inOl) { if (inUl) { out.push('</ul>'); inUl = false; } out.push('<ol style="list-style:decimal;padding-left:18px;margin:4px 0">'); inOl = true; } out.push(`<li>${l.replace(/^\d+\. /, '')}</li>`); }
    else if (l.trim() === '') { closeList(); out.push('<br>'); }
    else { closeList(); out.push(`<p style="margin:2px 0">${l}</p>`); }
  }
  closeList();
  return out.join('');
};

interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string;
}

interface Module {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  lessons: Lesson[];
  icon: string;
  color: string;
  status: 'published' | 'draft';
  language?: string; // Add language field
}

interface ModulesManagerProps {
  accessToken?: string;
}

export function ModulesManager({ accessToken }: ModulesManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/modules/list`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const { modules: apiModules } = await response.json();
        
        // If backend has modules, use them; otherwise use default data
        if (apiModules && apiModules.length > 0) {
          setModules(apiModules.map((m: any) => ({
            id: m.id,
            title: m.title,
            subtitle: m.subtitle || '',
            description: m.description || '',
            lessons: m.lessons || [],
            icon: m.icon || '📚',
            color: m.color || 'bg-primary-500',
            status: m.status || 'draft'
          })));
        } else {
          // Use default data as fallback
          setModules([
            {
              id: '1',
              title: "God's Design for Marriage",
              subtitle: 'Biblical Foundations',
              description: 'Explore what Scripture teaches about covenant, commitment, and Christ-centered relationships.',
              lessons: [
                { id: '1', title: 'The Covenant of Marriage', duration: '15 min', content: '...' },
                { id: '2', title: 'Leaving and Cleaving', duration: '12 min', content: '...' },
                { id: '3', title: 'Two Becoming One', duration: '18 min', content: '...' },
              ],
              icon: '📖',
              color: 'bg-sky-500',
              status: 'published',
            },
            {
              id: '2',
              title: 'Communication & Conflict',
              subtitle: 'Speaking Truth in Love',
              description: 'Learn biblical principles for healthy communication, active listening, and resolving disagreements.',
              lessons: [
                { id: '1', title: 'Active Listening Skills', duration: '20 min', content: '...' },
                { id: '2', title: 'Speaking with Grace', duration: '15 min', content: '...' },
                { id: '3', title: 'Resolving Conflict', duration: '25 min', content: '...' },
              ],
              icon: '💬',
              color: 'bg-success-500',
              status: 'published',
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to load modules:', error);
      toast.error('Failed to load modules');
      
      // Use default data as fallback
      setModules([
        {
          id: '1',
          title: "God's Design for Marriage",
          subtitle: 'Biblical Foundations',
          description: 'Explore what Scripture teaches about covenant, commitment, and Christ-centered relationships.',
          lessons: [
            { id: '1', title: 'The Covenant of Marriage', duration: '15 min', content: '...' },
            { id: '2', title: 'Leaving and Cleaving', duration: '12 min', content: '...' },
            { id: '3', title: 'Two Becoming One', duration: '18 min', content: '...' },
          ],
          icon: '📖',
          color: 'bg-sky-500',
          status: 'published',
        },
        {
          id: '2',
          title: 'Communication & Conflict',
          subtitle: 'Speaking Truth in Love',
          description: 'Learn biblical principles for healthy communication, active listening, and resolving disagreements.',
          lessons: [
            { id: '1', title: 'Active Listening Skills', duration: '20 min', content: '...' },
            { id: '2', title: 'Speaking with Grace', duration: '15 min', content: '...' },
            { id: '3', title: 'Resolving Conflict', duration: '25 min', content: '...' },
          ],
          icon: '💬',
          color: 'bg-success-500',
          status: 'published',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const [formData, setFormData] = useState<Partial<Module>>({
    title: '',
    subtitle: '',
    description: '',
    lessons: [],
    icon: '📚',
    color: 'bg-primary-500',
    status: 'draft',
    language: 'en', // Default to English
  });

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData(module);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/modules/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        setModules(modules.filter(m => m.id !== id));
        toast.success('Module deleted successfully');
      } else {
        throw new Error('Failed to delete module');
      }
    } catch (error) {
      console.error('Failed to delete module:', error);
      toast.error('Failed to delete module');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingModule) {
        // Update existing
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/modules/${editingModule.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken || publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          }
        );

        if (response.ok) {
          setModules(modules.map(m => 
            m.id === editingModule.id ? { ...m, ...formData } as Module : m
          ));
          toast.success('Module updated successfully');
        } else {
          throw new Error('Failed to update module');
        }
      } else {
        // Create new
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/modules`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken || publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          }
        );

        if (response.ok) {
          const { moduleId } = await response.json();
          const newModule: Module = {
            ...formData,
            id: moduleId,
          } as Module;
          setModules([newModule, ...modules]);
          toast.success('Module created successfully');
        } else {
          throw new Error('Failed to create module');
        }
      }

      setIsDialogOpen(false);
      setEditingModule(null);
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        lessons: [],
        icon: '📚',
        color: 'bg-primary-500',
        status: 'draft',
        language: 'en', // Default to English
      });
      
      // Reload modules from backend
      loadModules();
    } catch (error) {
      console.error('Failed to save module:', error);
      toast.error('Failed to save module');
    }
  };

  const addLesson = () => {
    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: '',
      duration: '',
      content: ''
    };
    setFormData({
      ...formData,
      lessons: [...(formData.lessons || []), newLesson]
    });
  };

  const updateLesson = (lessonId: string, field: keyof Lesson, value: string) => {
    setFormData({
      ...formData,
      lessons: (formData.lessons || []).map(lesson =>
        lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
      )
    });
  };

  const removeLesson = (lessonId: string) => {
    setFormData({
      ...formData,
      lessons: (formData.lessons || []).filter(lesson => lesson.id !== lessonId)
    });
  };

  const filteredModules = modules.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-[24px]">Learning Modules</h2>
          <p className="text-sm text-muted-foreground text-[16px]">Manage pre-marriage guidance and educational content</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary-600 hover:bg-primary-700 w-full sm:w-auto text-xs sm:text-sm text-[14px] font-bold"
              size="sm"
              onClick={() => {
                setEditingModule(null);
                setFormData({
                  title: '',
                  subtitle: '',
                  description: '',
                  lessons: [],
                  icon: '📚',
                  color: 'bg-primary-500',
                  status: 'draft',
                  language: 'en', // Default to English
                });
              }}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              New Module
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] w-full">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg lg:text-xl">
                {editingModule ? 'Edit Module' : 'Create New Module'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingModule ? 'Update the details of this learning module.' : 'Create a new learning module with lessons and resources.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[75vh] pr-2 sm:pr-4">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Basic Info */}
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-xs sm:text-sm">Module Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., God's Design for Marriage"
                      className="text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="subtitle" className="text-xs sm:text-sm">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="e.g., Biblical Foundations"
                      className="text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of what this module covers..."
                      rows={3}
                      className="text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="language" className="text-xs sm:text-sm">Language</Label>
                    <select
                      id="language"
                      value={formData.language || 'en'}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full h-9 sm:h-10 px-3 rounded-md border border-border text-xs sm:text-sm"
                    >
                      <option value="en">🌍 English</option>
                      <option value="am">🌍 አማርኛ (Amharic)</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select the language for this module. Users can filter modules by language.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="icon" className="text-xs sm:text-sm">Icon (Emoji)</Label>
                      <Input
                        id="icon"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="📚"
                        maxLength={2}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="color" className="text-xs sm:text-sm">Color Class</Label>
                      <select
                        id="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full h-9 sm:h-10 px-3 rounded-md border border-border text-xs sm:text-sm"
                      >
                        <option value="bg-sky-500">Blue</option>
                        <option value="bg-success-500">Green</option>
                        <option value="bg-primary-500">Purple</option>
                        <option value="bg-primary-500">Rose</option>
                        <option value="bg-warning-500">Amber</option>
                        <option value="bg-sky-500">Indigo</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="status" className="text-xs sm:text-sm">Status</Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })}
                        className="w-full h-9 sm:h-10 px-3 rounded-md border border-border text-xs sm:text-sm"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Lessons Section */}
                <div className="border-t pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                    <div>
                      <Label className="text-sm sm:text-base">Lessons</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">Add lessons to this module</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLesson}
                      className="text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Add Lesson
                    </Button>
                  </div>

                  {formData.lessons && formData.lessons.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {formData.lessons.map((lesson, index) => (
                        <Card key={lesson.id} className="p-3 sm:p-4 relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => removeLesson(lesson.id)}
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4 text-error-500" />
                          </Button>
                          
                          <div className="space-y-2 sm:space-y-3 pr-8">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </span>
                              <Label className="text-xs sm:text-sm font-medium">Lesson {index + 1}</Label>
                            </div>

                            <div>
                              <Label htmlFor={`lesson-title-${lesson.id}`} className="text-xs sm:text-sm">
                                Lesson Title
                              </Label>
                              <Input
                                id={`lesson-title-${lesson.id}`}
                                value={lesson.title}
                                onChange={(e) => updateLesson(lesson.id, 'title', e.target.value)}
                                placeholder="e.g., The Covenant of Marriage"
                                className="text-xs sm:text-sm"
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor={`lesson-duration-${lesson.id}`} className="text-xs sm:text-sm">
                                Duration
                              </Label>
                              <Input
                                id={`lesson-duration-${lesson.id}`}
                                value={lesson.duration}
                                onChange={(e) => updateLesson(lesson.id, 'duration', e.target.value)}
                                placeholder="e.g., 15 min"
                                className="text-xs sm:text-sm"
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor={`lesson-content-${lesson.id}`} className="text-xs sm:text-sm">
                                Content
                              </Label>
                              <div className="rounded-md border border-border overflow-hidden">
                                {/* Formatting toolbar */}
                                <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border" style={{ background: 'var(--muted)' }}>
                                  {[
                                    { icon: Bold,         label: 'Bold',           wrap: ['**', '**'],         block: false },
                                    { icon: Italic,       label: 'Italic',         wrap: ['_', '_'],           block: false },
                                    { icon: Heading2,     label: 'Heading',        wrap: ['## ', ''],          block: true  },
                                    { icon: Quote,        label: 'Quote',          wrap: ['> ', ''],           block: true  },
                                    { icon: List,         label: 'Bullet list',    wrap: ['- ', ''],           block: true  },
                                    { icon: ListOrdered,  label: 'Numbered list',  wrap: ['1. ', ''],          block: true  },
                                    { icon: Link,         label: 'Link',           wrap: ['[', '](url)'],      block: false },
                                    { icon: Minus,        label: 'Divider',        wrap: ['\n---\n', ''],      block: true  },
                                  ].map(({ icon: Icon, label, wrap, block }) => (
                                    <button
                                      key={label}
                                      type="button"
                                      title={label}
                                      aria-label={label}
                                      className="w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-background"
                                      style={{ color: 'var(--muted-foreground)' }}
                                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}
                                      onClick={() => {
                                        const ta = document.getElementById(`lesson-content-${lesson.id}`) as HTMLTextAreaElement;
                                        if (!ta) return;
                                        const start = ta.selectionStart;
                                        const end = ta.selectionEnd;
                                        const selected = lesson.content.slice(start, end);
                                        let before = lesson.content.slice(0, start);
                                        let after = lesson.content.slice(end);
                                        let insertion: string;
                                        if (block && start > 0 && !before.endsWith('\n')) {
                                          before += '\n';
                                        }
                                        insertion = wrap[0] + (selected || (block ? 'text' : 'text')) + wrap[1];
                                        const newVal = before + insertion + after;
                                        updateLesson(lesson.id, 'content', newVal);
                                        requestAnimationFrame(() => {
                                          ta.focus();
                                          const cursor = before.length + wrap[0].length + (selected || 'text').length;
                                          ta.setSelectionRange(cursor, cursor);
                                        });
                                      }}
                                    >
                                      <Icon className="w-3.5 h-3.5" />
                                    </button>
                                  ))}
                                </div>
                                {/* Markdown textarea */}
                                <Textarea
                                  id={`lesson-content-${lesson.id}`}
                                  value={lesson.content}
                                  onChange={(e) => updateLesson(lesson.id, 'content', e.target.value)}
                                  placeholder="Lesson content, scripture references, discussion questions..."
                                  rows={6}
                                  className="text-xs sm:text-sm border-0 rounded-none focus-visible:ring-0 resize-none font-mono"
                                  required
                                />
                                {/* Live formatted preview */}
                                {lesson.content.trim() && (
                                  <div className="border-t border-border">
                                    <div className="px-3 py-1.5 flex items-center gap-1.5 border-b border-border" style={{ background: 'var(--muted)' }}>
                                      <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Preview</span>
                                    </div>
                                    <div
                                      className="px-3 py-2.5 text-xs sm:text-sm"
                                      style={{ color: 'var(--foreground)', background: 'var(--background)', lineHeight: '1.65' }}
                                      dangerouslySetInnerHTML={{ __html: mdToHtml(lesson.content) }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-6 sm:p-8 text-center">
                      <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                      <p className="text-muted-foreground mb-1 sm:mb-2 text-xs sm:text-sm">No lessons added yet</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                        Click "Add Lesson" to create your first lesson
                      </p>
                    </Card>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
                  <Button type="submit" className="flex-1 text-xs sm:text-sm">
                    {editingModule ? 'Update' : 'Create'} Module
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Import / Export */}
      <ModulesImportExport
        modules={modules}
        accessToken={accessToken}
        onImportComplete={loadModules}
      />

      {/* Search */}
      <Card className="p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
          <Input
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sm:pl-10 text-xs sm:text-sm text-[14px]"
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 text-[14px] font-bold">Total Modules</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-[20px] font-bold">{modules.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 text-[14px] font-bold">Total Lessons</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-[20px] font-bold">
            {modules.reduce((acc, m) => acc + m.lessons.length, 0)}
          </p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 text-[14px] font-bold">Published</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-success-700 text-[20px] font-bold">
            {modules.filter(m => m.status === 'published').length}
          </p>
        </Card>
      </div>

      {/* Modules List */}
      {isLoading ? (
        <Card className="p-6 sm:p-8 text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">Loading modules...</p>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredModules.map((module) => (
            <Card key={module.id} className="p-3 sm:p-4 lg:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${module.color} flex items-center justify-center text-xl sm:text-2xl flex-shrink-0`}>
                    {module.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base sm:text-lg font-bold">{module.title}</h3>
                      <Badge variant={module.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                        {module.status}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 text-[14px] font-bold">{module.subtitle}</p>
                    <p className="text-xs sm:text-sm text-foreground mb-2 sm:mb-3">{module.description}</p>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-bold">{module.lessons.length} lessons</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 sm:ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(module)}
                    className="flex-1 sm:flex-none text-xs text-[14px] font-bold"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-0" />
                    <span className="sm:hidden ml-1">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(module.id)}
                    className="flex-1 sm:flex-none text-xs text-[13px] font-bold"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-error-500 sm:mr-0" />
                    <span className="sm:hidden ml-1">Delete</span>
                  </Button>
                </div>
              </div>

              {/* Lessons */}
              {module.lessons.length > 0 && (
                <div className="border-t pt-3 sm:pt-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2 text-[14px] font-bold">
                    Lessons
                  </p>
                  {module.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-2 sm:p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-card border-2 border-border flex items-center justify-center text-xs font-medium flex-shrink-0 text-[14px] font-bold">
                          {index + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-medium truncate text-[14px]">{lesson.title}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <span className="text-xs text-muted-foreground text-[14px] font-bold">{lesson.duration} Min</span>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}