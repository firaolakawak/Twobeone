import { useState, useRef } from 'react';
import {
  Upload, Download, FileJson, CheckCircle2, XCircle,
  AlertTriangle, ChevronDown, ChevronUp, Loader2, BookOpen, Sparkles,
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { STATIC_DEVOTIONALS } from '../../data/devotionals';
import { toast } from 'sonner';

interface DevotionalRecord {
  id: string;
  title: string;
  date?: string;
  verse?: string;
  reference?: string;
  reflection?: string;
  prayerPrompt?: string;
  tags?: string[];
  status?: string;
  language?: string;
  audioUrl?: string;
  audioFileName?: string;
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

interface DevotionalsImportExportProps {
  devotionals: DevotionalRecord[];
  accessToken?: string;
  onImportComplete?: () => void;
}

type ExportScope = 'all' | 'published' | 'draft';

const VAR = (v: string) => `var(${v})`;

export function DevotionalsImportExport({ devotionals, accessToken, onImportComplete }: DevotionalsImportExportProps) {
  const [exportScope, setExportScope] = useState<ExportScope>('published');
  const [isExporting, setIsExporting] = useState(false);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<DevotionalRecord[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const [isSeedLoading, setIsSeedLoading] = useState(false);
  const [importLanguage, setImportLanguage] = useState<'en' | 'am' | 'om'>('en');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Export ──────────────────────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filtered = devotionals.filter(d => {
        if (exportScope === 'published') return d.status === 'published';
        if (exportScope === 'draft') return d.status === 'draft';
        return true;
      });

      const payload = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        app: 'TwoBeOne',
        count: filtered.length,
        devotionals: filtered,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `twobeone-devotionals-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filtered.length} devotional${filtered.length !== 1 ? 's' : ''}`);
    } finally {
      setIsExporting(false);
    }
  };

  // ── File pick ────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportData(null);
    setImportError(null);
    setImportResults(null);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const raw: DevotionalRecord[] = json.devotionals ?? (Array.isArray(json) ? json : null);
        if (!raw) throw new Error('JSON must have a "devotionals" array');
        const invalid = raw.filter(d => !d.id || !d.title);
        if (invalid.length > 0) {
          setImportError(`${invalid.length} item(s) missing required fields (id, title)`);
        }
        // Stamp language + prefix ID to avoid collision with English content
        const list = raw.map(d => ({
          ...d,
          language: importLanguage,
          id: d.id.startsWith(`${importLanguage}-`) ? d.id : `${importLanguage}-${d.id}`,
        }));
        setImportData(list);
      } catch (err: any) {
        setImportError(err.message || 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  // ── Import ───────────────────────────────────────────────
  const handleImport = async (items: DevotionalRecord[]) => {
    setIsImporting(true);
    setImportResults(null);
    setImportSummary(null);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/devotionals/import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
          body: JSON.stringify({ devotionals: items, overwrite }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const { results, summary } = await res.json();
      setImportResults(results);
      setImportSummary(summary);
      toast.success(`Import complete: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped`);
      onImportComplete?.();
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  // ── Seed built-in content ────────────────────────────────
  const handleSeedBuiltIn = async () => {
    setIsSeedLoading(true);
    await handleImport(STATIC_DEVOTIONALS as any);
    setIsSeedLoading(false);
  };

  const actionColor = (action: string) => {
    if (action === 'created') return VAR('--success-600');
    if (action === 'updated') return VAR('--secondary-600');
    return VAR('--neutral-400');
  };
  const ActionIcon = ({ action }: { action: string }) => {
    if (action === 'created') return <CheckCircle2 style={{ width: 14, height: 14, color: VAR('--success-600') }} />;
    if (action === 'updated') return <CheckCircle2 style={{ width: 14, height: 14, color: VAR('--secondary-600') }} />;
    return <XCircle style={{ width: 14, height: 14, color: VAR('--neutral-400') }} />;
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: VAR('--card'),
    borderRadius: VAR('--radius-lg'),
    border: `1px solid ${VAR('--border')}`,
    boxShadow: VAR('--shadow-sm'),
    overflow: 'hidden',
    marginBottom: VAR('--spacing-4'),
  };
  const headStyle: React.CSSProperties = {
    padding: `${VAR('--spacing-4')} ${VAR('--spacing-5')}`,
    borderBottom: `1px solid ${VAR('--border')}`,
    display: 'flex', alignItems: 'center', gap: VAR('--spacing-2'),
    backgroundColor: VAR('--neutral-50'),
  };

  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* ── Seed Built-In Content ── */}
      <div style={sectionStyle}>
        <div style={headStyle}>
          <Sparkles style={{ width: 18, height: 18, color: VAR('--primary-500') }} />
          <span style={{ fontSize: VAR('--text-callout'), fontWeight: VAR('--font-weight-semibold'), color: VAR('--neutral-900') }}>
            Seed Built-In Content
          </span>
        </div>
        <div style={{ padding: VAR('--spacing-5') }}>
          <p style={{ fontSize: VAR('--text-body'), color: VAR('--neutral-600'), margin: `0 0 ${VAR('--spacing-3')} 0`, lineHeight: 1.6 }}>
            Load 30 professionally written, Christ-centred devotionals covering love, communication, forgiveness, finances, prayer, and building your future together. Ideal for new installs.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: VAR('--spacing-3'), flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: VAR('--spacing-2'), cursor: 'pointer', fontSize: VAR('--text-callout'), color: VAR('--neutral-600') }}>
              <input
                type="checkbox"
                checked={overwrite}
                onChange={e => setOverwrite(e.target.checked)}
                style={{ accentColor: VAR('--primary-500') }}
              />
              Overwrite existing devotionals with same ID
            </label>
            <button
              onClick={handleSeedBuiltIn}
              disabled={isSeedLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: VAR('--spacing-2'),
                padding: `${VAR('--spacing-2')} ${VAR('--spacing-4')}`,
                borderRadius: VAR('--radius-md'),
                border: 'none', cursor: isSeedLoading ? 'not-allowed' : 'pointer',
                backgroundColor: VAR('--primary-500'), color: '#fff',
                fontSize: VAR('--text-callout'), fontWeight: VAR('--font-weight-semibold'),
                opacity: isSeedLoading ? 0.7 : 1,
              }}
            >
              {isSeedLoading
                ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Seeding…</>
                : <><BookOpen style={{ width: 16, height: 16 }} /> Seed 30 Devotionals</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Export ── */}
      <div style={sectionStyle}>
        <div style={headStyle}>
          <Download style={{ width: 18, height: 18, color: VAR('--secondary-600') }} />
          <span style={{ fontSize: VAR('--text-callout'), fontWeight: VAR('--font-weight-semibold'), color: VAR('--neutral-900') }}>
            Export Devotionals
          </span>
        </div>
        <div style={{ padding: VAR('--spacing-5') }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: VAR('--spacing-3'), flexWrap: 'wrap' }}>
            {(['all', 'published', 'draft'] as ExportScope[]).map(scope => (
              <button
                key={scope}
                onClick={() => setExportScope(scope)}
                style={{
                  padding: `${VAR('--spacing-1')} ${VAR('--spacing-3')}`,
                  borderRadius: VAR('--radius-full'),
                  border: `1px solid ${exportScope === scope ? VAR('--secondary-400') : VAR('--border')}`,
                  backgroundColor: exportScope === scope ? VAR('--secondary-50') : 'transparent',
                  color: exportScope === scope ? VAR('--secondary-700') : VAR('--neutral-600'),
                  fontSize: VAR('--text-label'), fontWeight: VAR('--font-weight-medium'),
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {scope}
              </button>
            ))}
            <span style={{ fontSize: VAR('--text-label'), color: VAR('--neutral-400') }}>
              {(exportScope === 'all' ? devotionals : devotionals.filter(d => d.status === exportScope)).length} devotional(s)
            </span>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting || devotionals.length === 0}
            style={{
              marginTop: VAR('--spacing-4'),
              display: 'flex', alignItems: 'center', gap: VAR('--spacing-2'),
              padding: `${VAR('--spacing-2')} ${VAR('--spacing-4')}`,
              borderRadius: VAR('--radius-md'),
              border: `1px solid ${VAR('--secondary-300')}`,
              backgroundColor: VAR('--secondary-50'),
              color: VAR('--secondary-700'),
              fontSize: VAR('--text-callout'), fontWeight: VAR('--font-weight-semibold'),
              cursor: isExporting || devotionals.length === 0 ? 'not-allowed' : 'pointer',
              opacity: isExporting || devotionals.length === 0 ? 0.6 : 1,
            }}
          >
            {isExporting
              ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Exporting…</>
              : <><Download style={{ width: 16, height: 16 }} /> Download JSON</>}
          </button>
        </div>
      </div>

      {/* ── Import ── */}
      <div style={sectionStyle}>
        <div style={headStyle}>
          <Upload style={{ width: 18, height: 18, color: VAR('--success-600') }} />
          <span style={{ fontSize: VAR('--text-callout'), fontWeight: VAR('--font-weight-semibold'), color: VAR('--neutral-900') }}>
            Import Devotionals
          </span>
        </div>
        <div style={{ padding: VAR('--spacing-5') }}>
          {/* Language selector */}
          <div style={{ marginBottom: VAR('--spacing-4') }}>
            <p style={{ fontSize: VAR('--text-callout'), fontWeight: VAR('--font-weight-semibold'), color: VAR('--neutral-800'), margin: `0 0 ${VAR('--spacing-2')} 0` }}>
              Content Language
            </p>
            <div style={{ display: 'flex', gap: VAR('--spacing-2'), flexWrap: 'wrap' }}>
              {([
                { code: 'en', label: 'English', flag: '🇺🇸' },
                { code: 'am', label: 'Amharic — አማርኛ', flag: '🇪🇹' },
                { code: 'om', label: 'Afan Oromo — Oromiffa', flag: '🇪🇹' },
              ] as const).map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setImportLanguage(lang.code);
                    // Re-stamp any already-loaded data with the new language
                    if (importData) {
                      setImportData(importData.map(d => ({
                        ...d,
                        language: lang.code,
                        id: d.id.replace(/^(en|am|om)-/, '') .replace(/^/, `${lang.code}-`),
                      })));
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: VAR('--spacing-2'),
                    padding: `${VAR('--spacing-2')} ${VAR('--spacing-3')}`,
                    borderRadius: VAR('--radius-md'),
                    border: `2px solid ${importLanguage === lang.code ? VAR('--primary-500') : VAR('--border')}`,
                    backgroundColor: importLanguage === lang.code ? VAR('--primary-50') : VAR('--card'),
                    color: importLanguage === lang.code ? VAR('--primary-700') : VAR('--neutral-600'),
                    fontSize: VAR('--text-callout'), fontWeight: importLanguage === lang.code ? VAR('--font-weight-semibold') : VAR('--font-weight-normal'),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: VAR('--text-label'), color: VAR('--neutral-400'), margin: `${VAR('--spacing-2')} 0 0 0` }}>
              All imported devotionals will be tagged with this language. IDs are prefixed (e.g. <code>am-dev-001</code>) to avoid conflicts.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) { const dt = new DataTransfer(); dt.items.add(f); if (fileInputRef.current) { fileInputRef.current.files = dt.files; fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true })); } }
            }}
            style={{
              border: `2px dashed ${importError ? VAR('--error-400') : VAR('--border')}`,
              borderRadius: VAR('--radius-md'),
              padding: VAR('--spacing-8'),
              textAlign: 'center', cursor: 'pointer',
              backgroundColor: importData ? VAR('--success-50') : VAR('--neutral-50'),
              transition: 'all 0.15s ease',
            }}
          >
            <FileJson style={{ width: 36, height: 36, margin: '0 auto', color: importData ? VAR('--success-500') : VAR('--neutral-400') }} />
            <p style={{ fontSize: VAR('--text-callout'), fontWeight: VAR('--font-weight-medium'), color: VAR('--neutral-700'), margin: `${VAR('--spacing-2')} 0 ${VAR('--spacing-1')} 0` }}>
              {importFile ? importFile.name : 'Drop JSON file here or click to browse'}
            </p>
            <p style={{ fontSize: VAR('--text-label'), color: VAR('--neutral-400'), margin: 0 }}>
              {importData ? `${importData.length} devotional(s) ready to import` : 'Accepts .json exported from this admin panel'}
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />

          {importError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: VAR('--spacing-2'), marginTop: VAR('--spacing-3'), padding: VAR('--spacing-3'), borderRadius: VAR('--radius-md'), backgroundColor: VAR('--error-50'), border: `1px solid ${VAR('--error-200')}` }}>
              <AlertTriangle style={{ width: 16, height: 16, color: VAR('--error-600'), flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: VAR('--text-label'), color: VAR('--error-700'), margin: 0 }}>{importError}</p>
            </div>
          )}

          {importData && importData.length > 0 && (
            <div style={{ marginTop: VAR('--spacing-4') }}>
              {/* Options */}
              <div style={{ display: 'flex', alignItems: 'center', gap: VAR('--spacing-4'), marginBottom: VAR('--spacing-4'), flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: VAR('--spacing-2'), cursor: 'pointer', fontSize: VAR('--text-callout'), color: VAR('--neutral-700') }}>
                  <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} style={{ accentColor: VAR('--primary-500') }} />
                  Overwrite existing
                </label>

                <button
                  onClick={() => setShowPreview(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', gap: VAR('--spacing-1'), background: 'none', border: 'none', cursor: 'pointer', fontSize: VAR('--text-label'), color: VAR('--secondary-600'), fontWeight: VAR('--font-weight-medium') }}
                >
                  {showPreview ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                  {showPreview ? 'Hide' : 'Preview'} {importData.length} items
                </button>
              </div>

              {showPreview && (
                <div style={{ maxHeight: 220, overflowY: 'auto', border: `1px solid ${VAR('--border')}`, borderRadius: VAR('--radius-md'), marginBottom: VAR('--spacing-4') }}>
                  {importData.map((d, i) => (
                    <div key={d.id || i} style={{ padding: `${VAR('--spacing-2')} ${VAR('--spacing-3')}`, borderBottom: i < importData.length - 1 ? `1px solid ${VAR('--border')}` : 'none', display: 'flex', alignItems: 'center', gap: VAR('--spacing-3') }}>
                      <BookOpen style={{ width: 14, height: 14, color: VAR('--primary-400'), flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: VAR('--text-label'), fontWeight: VAR('--font-weight-medium'), color: VAR('--neutral-800'), margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.title || 'Untitled'}
                        </p>
                        <p style={{ fontSize: 10, color: VAR('--neutral-400'), margin: 0 }}>{d.reference || d.id}</p>
                      </div>
                      {d.language && (
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, backgroundColor: VAR('--primary-50'), color: VAR('--primary-700'), fontWeight: VAR('--font-weight-semibold'), flexShrink: 0 }}>
                          {d.language.toUpperCase()}
                        </span>
                      )}
                      {d.date && <span style={{ fontSize: 10, color: VAR('--neutral-400'), flexShrink: 0 }}>{d.date}</span>}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleImport(importData)}
                disabled={isImporting}
                style={{
                  display: 'flex', alignItems: 'center', gap: VAR('--spacing-2'),
                  padding: `${VAR('--spacing-2')} ${VAR('--spacing-5')}`,
                  borderRadius: VAR('--radius-md'),
                  border: 'none', cursor: isImporting ? 'not-allowed' : 'pointer',
                  backgroundColor: VAR('--success-600'), color: '#fff',
                  fontSize: VAR('--text-callout'), fontWeight: VAR('--font-weight-semibold'),
                  opacity: isImporting ? 0.7 : 1,
                }}
              >
                {isImporting
                  ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Importing…</>
                  : <><Upload style={{ width: 16, height: 16 }} /> Import {importData.length} Devotional{importData.length !== 1 ? 's' : ''}</>}
              </button>
            </div>
          )}

          {/* Import results */}
          {importSummary && (
            <div style={{ marginTop: VAR('--spacing-5') }}>
              <div style={{ display: 'flex', gap: VAR('--spacing-3'), flexWrap: 'wrap', marginBottom: VAR('--spacing-3') }}>
                {[
                  { label: 'Created', val: importSummary.created, color: VAR('--success-600'), bg: VAR('--success-50') },
                  { label: 'Updated', val: importSummary.updated, color: VAR('--secondary-600'), bg: VAR('--secondary-50') },
                  { label: 'Skipped', val: importSummary.skipped, color: VAR('--neutral-500'), bg: VAR('--neutral-100') },
                ].map(s => (
                  <div key={s.label} style={{ padding: `${VAR('--spacing-2')} ${VAR('--spacing-3')}`, borderRadius: VAR('--radius-md'), backgroundColor: s.bg }}>
                    <span style={{ fontSize: VAR('--text-title3'), fontWeight: VAR('--font-weight-bold'), color: s.color, display: 'block' }}>{s.val}</span>
                    <span style={{ fontSize: VAR('--text-label'), color: s.color }}>{s.label}</span>
                  </div>
                ))}
              </div>
              {importResults && (
                <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid ${VAR('--border')}`, borderRadius: VAR('--radius-md') }}>
                  {importResults.map((r, i) => (
                    <div key={r.id} style={{ padding: `${VAR('--spacing-2')} ${VAR('--spacing-3')}`, borderBottom: i < importResults.length - 1 ? `1px solid ${VAR('--border')}` : 'none', display: 'flex', alignItems: 'center', gap: VAR('--spacing-2') }}>
                      <ActionIcon action={r.action} />
                      <span style={{ flex: 1, fontSize: VAR('--text-label'), color: VAR('--neutral-700'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                      <span style={{ fontSize: 10, fontWeight: VAR('--font-weight-semibold'), color: actionColor(r.action), textTransform: 'capitalize', flexShrink: 0 }}>{r.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
