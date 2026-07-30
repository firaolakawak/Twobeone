import { useState, useRef, useCallback } from 'react';
import {
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  SkipForward,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { STATIC_MODULES } from '../../data/modules';
import { toast } from 'sonner@2.0.3';

/* ─── Types ─────────────────────────────────── */
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
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ImportResult {
  id: string;
  title: string;
  action: 'created' | 'updated' | 'skipped';
  error?: string;
}

interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  total: number;
}

interface ExportPayload {
  version: string;
  exportedAt: string;
  app: string;
  count: number;
  modules: Module[];
}

interface ModulesImportExportProps {
  modules: Module[];
  accessToken?: string;
  onImportComplete: () => void;
}

/* ─── Helpers ─────────────────────────────── */
function sizeOf(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateModule(raw: any): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object') { errors.push('Not an object'); return { ok: false, errors }; }
  if (!raw.title || typeof raw.title !== 'string') errors.push('Missing or invalid "title"');
  if (!Array.isArray(raw.lessons)) errors.push('Missing or invalid "lessons" array');
  return { ok: errors.length === 0, errors };
}

/* ─── Section separator ─── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 'var(--text-caption)',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--neutral-500)',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      margin: '0 0 var(--spacing-3) 0',
    }}>
      {children}
    </p>
  );
}

/* ─── Status pill ─── */
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 'var(--text-label)', fontWeight: 'var(--font-weight-semibold)',
      color, backgroundColor: bg,
      borderRadius: 'var(--radius-full)',
      padding: '2px 10px',
    }}>
      {label}
    </span>
  );
}

/* ─── Import result row ─── */
function ResultRow({ r }: { r: ImportResult }) {
  const map = {
    created: { icon: <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--success-500)' }} />, label: 'Created', color: 'var(--success-700)', bg: 'var(--success-50)' },
    updated: { icon: <CheckCircle2 style={{ width: 15, height: 15, color: 'var(--secondary-600)' }} />, label: 'Updated', color: 'var(--secondary-600)', bg: 'var(--secondary-50)' },
    skipped: { icon: <SkipForward style={{ width: 15, height: 15, color: 'var(--warning-700)' }} />, label: r.error ? 'Error' : 'Skipped', color: 'var(--warning-700)', bg: 'var(--warning-50)' },
  }[r.action];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
      padding: 'var(--spacing-2) var(--spacing-3)',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--neutral-50)',
    }}>
      {map.icon}
      <span style={{ flex: 1, fontSize: 'var(--text-callout)', color: 'var(--neutral-800)', fontWeight: 'var(--font-weight-medium)' }}>
        {r.title}
      </span>
      <Pill label={map.label} color={map.color} bg={map.bg} />
      {r.error && (
        <span style={{ fontSize: 'var(--text-label)', color: 'var(--error-500)' }}>{r.error}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export function ModulesImportExport({ modules, accessToken, onImportComplete }: ModulesImportExportProps) {
  const [activePanel, setActivePanel] = useState<'none' | 'export' | 'import'>('none');

  /* ── Export state ── */
  const [exportScope, setExportScope] = useState<'all' | 'published' | 'draft'>('all');

  /* ── Import state ── */
  const [dragOver, setDragOver] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedModules, setParsedModules] = useState<Module[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [overwriteMode, setOverwriteMode] = useState<'skip' | 'overwrite'>('skip');
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [expandedPreview, setExpandedPreview] = useState(false);
  const [importLanguage, setImportLanguage] = useState<'auto' | 'en' | 'am' | 'om'>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedBuiltIn = async () => {
    setIsSeeding(true);
    try {
      const modulesToSeed = STATIC_MODULES.map(m => ({
        id: m.id,
        title: m.title,
        subtitle: m.subtitle,
        description: m.description,
        lessons: m.lessons.map(l => ({ id: l.id, title: l.title, duration: l.duration, content: l.content })),
        icon: m.iconKey,
        color: m.accentColor,
        status: 'published',
        language: 'en',
      }));
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/modules/import`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken || publicAnonKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ modules: modulesToSeed, overwrite: false }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Seed failed');
      toast.success(`Seeded ${data.summary.created} module(s). ${data.summary.skipped} already existed.`);
      onImportComplete();
    } catch (err: any) {
      toast.error(err.message || 'Seed failed');
    } finally {
      setIsSeeding(false);
    }
  };

  /* ── Export ── */
  const handleExport = () => {
    const filtered = modules.filter(m => {
      if (exportScope === 'published') return m.status === 'published';
      if (exportScope === 'draft') return m.status === 'draft';
      return true;
    });

    // Strip server-only timestamps to keep the export clean but keep IDs
    const payload: ExportPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      app: 'TwoBeOne',
      count: filtered.length,
      modules: filtered.map(({ createdAt: _c, updatedAt: _u, ...rest }) => rest as Module),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twobeone-modules-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} module${filtered.length !== 1 ? 's' : ''}`);
  };

  /* ── File parse ── */
  const parseFile = useCallback((file: File) => {
    setImportFile(file);
    setParsedModules([]);
    setParseErrors([]);
    setImportResults(null);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        // Support both { modules: [...] } wrapper and bare array
        const list: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.modules) ? raw.modules : null;
        if (!list) { setParseErrors(['File must contain a JSON array or an object with a "modules" array.']); return; }

        const valid: Module[] = [];
        const errs: string[] = [];
        list.forEach((item, i) => {
          const { ok, errors } = validateModule(item);
          if (ok) valid.push(item as Module);
          else errs.push(`Module ${i + 1} (${item?.title ?? 'untitled'}): ${errors.join(', ')}`);
        });

        // Auto-detect language from first module that has one set
        const detected = valid.find(m => m.language)?.language;
        if (detected && importLanguage === 'auto') {
          setImportLanguage(detected as 'en' | 'am' | 'om');
        }

        setParsedModules(valid);
        setParseErrors(errs);
      } catch {
        setParseErrors(['Invalid JSON — the file could not be parsed.']);
      }
    };
    reader.readAsText(file);
  }, []);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.json')) parseFile(file);
    else toast.error('Please drop a .json file');
  }, [parseFile]);

  /* ── Import ── */
  const handleImport = async () => {
    if (parsedModules.length === 0) return;
    setIsImporting(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/modules/import`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
        modules: parsedModules.map(m => {
          const lang = importLanguage === 'auto' ? (m.language || 'en') : importLanguage;
          // Prefix IDs with language code for non-English to avoid collisions
          // e.g. "module-1" → "am-module-1" so English & Amharic coexist
          const prefixedId = lang !== 'en' && m.id && !m.id.startsWith(`${lang}-`)
            ? `${lang}-${m.id}`
            : m.id;
          return { ...m, id: prefixedId, language: lang };
        }),
        overwrite: overwriteMode === 'overwrite',
      }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setImportResults(data.results);
      setImportSummary(data.summary);
      toast.success(`Import complete: ${data.summary.created} created, ${data.summary.updated} updated, ${data.summary.skipped} skipped`);
      onImportComplete();
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setParsedModules([]);
    setParseErrors([]);
    setImportResults(null);
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>

      {/* ── Trigger bar ── */}
      <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
        {/* Seed built-in */}
        <button
          onClick={handleSeedBuiltIn}
          disabled={isSeeding}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
            padding: 'var(--spacing-2) var(--spacing-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--primary-300)',
            backgroundColor: 'var(--primary-50)',
            color: 'var(--primary-700)',
            fontSize: 'var(--text-callout)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: isSeeding ? 'not-allowed' : 'pointer',
            opacity: isSeeding ? 0.7 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          {isSeeding
            ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Seeding…</>
            : <><Sparkles style={{ width: 16, height: 16 }} /> Seed 5 Built-In Modules</>}
        </button>
        {/* Export trigger */}
        <button
          onClick={() => setActivePanel(activePanel === 'export' ? 'none' : 'export')}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
            padding: 'var(--spacing-2) var(--spacing-4)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${activePanel === 'export' ? 'var(--primary-400, #ff6391)' : 'var(--neutral-200)'}`,
            backgroundColor: activePanel === 'export' ? 'var(--primary-50)' : 'var(--card)',
            color: activePanel === 'export' ? 'var(--primary-600)' : 'var(--neutral-700)',
            fontSize: 'var(--text-callout)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Download style={{ width: 16, height: 16 }} />
          Export
          {activePanel === 'export'
            ? <ChevronUp style={{ width: 14, height: 14 }} />
            : <ChevronDown style={{ width: 14, height: 14 }} />}
        </button>

        {/* Import trigger */}
        <button
          onClick={() => setActivePanel(activePanel === 'import' ? 'none' : 'import')}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',
            padding: 'var(--spacing-2) var(--spacing-4)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${activePanel === 'import' ? 'var(--secondary-400, #38bdf8)' : 'var(--neutral-200)'}`,
            backgroundColor: activePanel === 'import' ? 'var(--secondary-50)' : 'var(--card)',
            color: activePanel === 'import' ? 'var(--secondary-700, #0369a1)' : 'var(--neutral-700)',
            fontSize: 'var(--text-callout)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Upload style={{ width: 16, height: 16 }} />
          Import
          {activePanel === 'import'
            ? <ChevronUp style={{ width: 14, height: 14 }} />
            : <ChevronDown style={{ width: 14, height: 14 }} />}
        </button>
      </div>

      {/* ══════════════ EXPORT PANEL ══════════════ */}
      {activePanel === 'export' && (
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--primary-200, #ffc7d7)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-4)',
          display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', margin: 0 }}>
                Export Modules
              </p>
              <p style={{ fontSize: 'var(--text-callout)', color: 'var(--neutral-500)', margin: '2px 0 0 0' }}>
                Download your modules as a portable JSON file
              </p>
            </div>
            <FileJson style={{ width: 28, height: 28, color: 'var(--primary-400, #ff6391)', flexShrink: 0 }} />
          </div>

          {/* Scope selector */}
          <div>
            <SectionTitle>What to export</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              {([
                { value: 'all',       label: 'All modules',       count: modules.length },
                { value: 'published', label: 'Published only',    count: modules.filter(m => m.status === 'published').length },
                { value: 'draft',     label: 'Drafts only',       count: modules.filter(m => m.status === 'draft').length },
              ] as const).map(opt => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)',
                    padding: 'var(--spacing-3)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${exportScope === opt.value ? 'var(--primary-400, #ff6391)' : 'var(--neutral-200)'}`,
                    backgroundColor: exportScope === opt.value ? 'var(--primary-50)' : 'var(--neutral-50)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="exportScope"
                    value={opt.value}
                    checked={exportScope === opt.value}
                    onChange={() => setExportScope(opt.value)}
                    style={{ accentColor: 'var(--primary-500)', width: 16, height: 16 }}
                  />
                  <span style={{ flex: 1, fontSize: 'var(--text-callout)', color: 'var(--neutral-800)', fontWeight: 'var(--font-weight-medium)' }}>
                    {opt.label}
                  </span>
                  <Pill
                    label={`${opt.count} module${opt.count !== 1 ? 's' : ''}`}
                    color="var(--neutral-600)"
                    bg="var(--neutral-100)"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Format info */}
          <div style={{
            padding: 'var(--spacing-3)',
            backgroundColor: 'var(--neutral-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--neutral-200)',
          }}>
            <SectionTitle>Export format</SectionTitle>
            <p style={{ fontSize: 'var(--text-callout)', color: 'var(--neutral-600)', margin: 0, lineHeight: 1.6 }}>
              Exports a <strong>JSON</strong> file containing module metadata, lesson content, and IDs.
              Use this file to back up content or migrate modules to another environment.
              Module IDs are preserved so re-importing with "overwrite" enabled updates existing modules in-place.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={modules.length === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)',
              padding: 'var(--spacing-3) var(--spacing-4)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: modules.length === 0 ? 'var(--neutral-200)' : 'var(--primary-600)',
              color: modules.length === 0 ? 'var(--neutral-400)' : '#ffffff',
              fontSize: 'var(--text-callout)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: modules.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <Download style={{ width: 16, height: 16 }} />
            Download JSON
          </button>
        </div>
      )}

      {/* ══════════════ IMPORT PANEL ══════════════ */}
      {activePanel === 'import' && (
        <div style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--secondary-200, #bae6fd)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-4)',
          display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', margin: 0 }}>
                Import Modules
              </p>
              <p style={{ fontSize: 'var(--text-callout)', color: 'var(--neutral-500)', margin: '2px 0 0 0' }}>
                Upload a JSON file to add or update modules in bulk
              </p>
            </div>
            <Upload style={{ width: 28, height: 28, color: 'var(--secondary-500, #0ea5e9)', flexShrink: 0 }} />
          </div>

          {/* ── Show results after import ── */}
          {importSummary && importResults ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              {/* Summary banner */}
              <div style={{
                display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap',
                padding: 'var(--spacing-3)',
                backgroundColor: 'var(--success-50)',
                border: '1px solid var(--success-500)',
                borderRadius: 'var(--radius-md)',
                alignItems: 'center',
              }}>
                <CheckCircle2 style={{ width: 20, height: 20, color: 'var(--success-500)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 'var(--text-callout)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--success-700)', margin: 0 }}>
                    Import complete
                  </p>
                  <p style={{ fontSize: 'var(--text-label)', color: 'var(--success-700)', margin: 0 }}>
                    {importSummary.created} created · {importSummary.updated} updated · {importSummary.skipped} skipped of {importSummary.total} total
                  </p>
                </div>
              </div>

              {/* Per-row results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {importResults.map((r, i) => <ResultRow key={i} r={r} />)}
              </div>

              <button
                onClick={resetImport}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)',
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--neutral-200)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--neutral-600)',
                  fontSize: 'var(--text-callout)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                <X style={{ width: 14, height: 14 }} />
                Import another file
              </button>
            </div>
          ) : (
            <>
              {/* ── Language selector ── */}
              <div>
                <SectionTitle>Content Language</SectionTitle>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                  {([
                    { code: 'auto', label: 'Auto-detect', flag: '🔍' },
                    { code: 'en',   label: 'English',           flag: '🇺🇸' },
                    { code: 'am',   label: 'Amharic — አማርኛ',   flag: '🇪🇹' },
                    { code: 'om',   label: 'Afan Oromo',        flag: '🇪🇹' },
                  ] as const).map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setImportLanguage(lang.code);
                        // Re-stamp already-parsed modules
                        if (parsedModules.length > 0 && lang.code !== 'auto') {
                          setParsedModules(parsedModules.map(m => {
                            const baseId = m.id?.replace(/^(en|am|om)-/, '') ?? m.id;
                            const newId = lang.code !== 'en' && baseId && !baseId.startsWith(`${lang.code}-`)
                              ? `${lang.code}-${baseId}`
                              : baseId;
                            return { ...m, id: newId, language: lang.code };
                          }));
                        }
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${importLanguage === lang.code ? 'var(--primary-500)' : 'var(--border)'}`,
                        backgroundColor: importLanguage === lang.code ? 'var(--primary-50)' : 'transparent',
                        color: importLanguage === lang.code ? 'var(--primary-700)' : 'var(--neutral-600)',
                        fontSize: 'var(--text-label)',
                        fontWeight: importLanguage === lang.code ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{lang.flag}</span><span>{lang.label}</span>
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 'var(--text-label)', color: 'var(--neutral-400)', margin: 0 }}>
                  Auto-detect reads the <code>language</code> field from each module. Override to force all modules to one language.
                </p>
              </div>

              {/* ── Drop zone ── */}
              <div>
                <SectionTitle>Select file</SectionTitle>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--secondary-500, #0ea5e9)' : importFile ? 'var(--success-500)' : 'var(--neutral-300)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-8) var(--spacing-4)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: dragOver ? 'var(--secondary-50)' : importFile ? 'var(--success-50)' : 'var(--neutral-50)',
                    transition: 'all 0.15s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-2)',
                  }}
                >
                  {importFile ? (
                    <>
                      <FileJson style={{ width: 32, height: 32, color: 'var(--success-500)' }} />
                      <p style={{ fontSize: 'var(--text-callout)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--success-700)', margin: 0 }}>
                        {importFile.name}
                      </p>
                      <p style={{ fontSize: 'var(--text-label)', color: 'var(--neutral-500)', margin: 0 }}>
                        {sizeOf(importFile.size)} · Click to choose a different file
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload style={{ width: 32, height: 32, color: 'var(--neutral-400)' }} />
                      <p style={{ fontSize: 'var(--text-callout)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-700)', margin: 0 }}>
                        Drop a JSON file here
                      </p>
                      <p style={{ fontSize: 'var(--text-label)', color: 'var(--neutral-500)', margin: 0 }}>
                        or click to browse
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={onFileInputChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* ── Parse errors ── */}
              {parseErrors.length > 0 && (
                <div style={{
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--error-50)',
                  border: '1px solid var(--error-500)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <XCircle style={{ width: 16, height: 16, color: 'var(--error-500)', flexShrink: 0 }} />
                    <p style={{ fontSize: 'var(--text-callout)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--error-700)', margin: 0 }}>
                      {parseErrors.length} validation issue{parseErrors.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  {parseErrors.map((e, i) => (
                    <p key={i} style={{ fontSize: 'var(--text-label)', color: 'var(--error-700)', margin: '0 0 0 24px' }}>
                      • {e}
                    </p>
                  ))}
                </div>
              )}

              {/* ── Preview ── */}
              {parsedModules.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <SectionTitle>{parsedModules.length} valid module{parsedModules.length !== 1 ? 's' : ''} ready to import</SectionTitle>
                    <button
                      onClick={() => setExpandedPreview(!expandedPreview)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 'var(--text-label)', color: 'var(--neutral-500)',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      }}
                    >
                      {expandedPreview ? 'Collapse' : 'Expand preview'}
                      {expandedPreview ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
                    </button>
                  </div>

                  {expandedPreview && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', maxHeight: 240, overflowY: 'auto' }}>
                      {parsedModules.map((m, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)',
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          backgroundColor: 'var(--neutral-50)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--neutral-200)',
                        }}>
                          <div style={{
                            width: 32, height: 32,
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--secondary-50)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontSize: 16,
                          }}>
                            {m.icon || <BookOpen style={{ width: 16, height: 16, color: 'var(--secondary-500)' }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 'var(--text-callout)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-900)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.title}
                            </p>
                            <p style={{ fontSize: 'var(--text-label)', color: 'var(--neutral-500)', margin: 0 }}>
                              {m.lessons?.length ?? 0} lesson{(m.lessons?.length ?? 0) !== 1 ? 's' : ''} · {m.status ?? 'draft'} · ID: {m.id}
                            </p>
                          </div>
                          <Pill
                            label={m.language === 'am' ? '🇪🇹 AM' : m.language === 'om' ? '🇪🇹 OM' : '🇺🇸 EN'}
                            color="var(--neutral-600)"
                            bg="var(--neutral-100)"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Conflict resolution */}
                  <div>
                    <SectionTitle>If a module ID already exists</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                      {([
                        { value: 'skip',      label: 'Skip (keep existing)',   desc: 'Existing modules will not be changed — only new modules are created.', icon: <SkipForward style={{ width: 15, height: 15 }} /> },
                        { value: 'overwrite', label: 'Overwrite (replace all)', desc: 'Existing modules will be fully replaced with the imported data.',      icon: <AlertTriangle style={{ width: 15, height: 15 }} /> },
                      ] as const).map(opt => (
                        <label
                          key={opt.value}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)',
                            padding: 'var(--spacing-3)',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${overwriteMode === opt.value ? (opt.value === 'overwrite' ? 'var(--warning-500)' : 'var(--success-500)') : 'var(--neutral-200)'}`,
                            backgroundColor: overwriteMode === opt.value ? (opt.value === 'overwrite' ? 'var(--warning-50)' : 'var(--success-50)') : 'var(--neutral-50)',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="radio"
                            name="overwriteMode"
                            value={opt.value}
                            checked={overwriteMode === opt.value}
                            onChange={() => setOverwriteMode(opt.value)}
                            style={{ accentColor: opt.value === 'overwrite' ? 'var(--warning-500)' : 'var(--success-500)', width: 16, height: 16, marginTop: 2, flexShrink: 0 }}
                          />
                          <div>
                            <p style={{ fontSize: 'var(--text-callout)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--neutral-800)', margin: 0 }}>
                              {opt.label}
                            </p>
                            <p style={{ fontSize: 'var(--text-label)', color: 'var(--neutral-500)', margin: '2px 0 0 0' }}>
                              {opt.desc}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Overwrite warning */}
                  {overwriteMode === 'overwrite' && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)',
                      padding: 'var(--spacing-3)',
                      backgroundColor: 'var(--warning-50)',
                      border: '1px solid var(--warning-500)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <AlertTriangle style={{ width: 16, height: 16, color: 'var(--warning-700)', flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 'var(--text-callout)', color: 'var(--warning-700)', margin: 0, lineHeight: 1.5 }}>
                        Overwrite mode will permanently replace existing module content. This cannot be undone — consider exporting a backup first.
                      </p>
                    </div>
                  )}

                  {/* Import button */}
                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-2)',
                      padding: 'var(--spacing-3) var(--spacing-4)',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      backgroundColor: isImporting ? 'var(--neutral-300)' : 'var(--secondary-600, #0284c7)',
                      color: '#ffffff',
                      fontSize: 'var(--text-callout)',
                      fontWeight: 'var(--font-weight-semibold)',
                      cursor: isImporting ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <Upload style={{ width: 16, height: 16 }} />
                    {isImporting
                      ? 'Importing…'
                      : `Import ${parsedModules.length} Module${parsedModules.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              )}

              {/* Format guide */}
              {!importFile && (
                <div style={{
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--neutral-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--neutral-200)',
                }}>
                  <SectionTitle>Expected JSON format</SectionTitle>
                  <pre style={{
                    fontSize: 'var(--text-label)',
                    color: 'var(--neutral-600)',
                    backgroundColor: 'var(--neutral-100)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-3)',
                    overflow: 'auto',
                    margin: 0,
                    lineHeight: 1.6,
                    fontFamily: 'ui-monospace, monospace',
                  }}>
{`{
  "modules": [
    {
      "id": "optional-id",
      "title": "Module Title",
      "subtitle": "Subtitle",
      "description": "...",
      "status": "published",
      "language": "en",
      "icon": "📚",
      "lessons": [
        {
          "id": "lesson-1",
          "title": "Lesson Title",
          "duration": "15 min",
          "content": "..."
        }
      ]
    }
  ]
}`}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
