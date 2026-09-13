import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCurrentLanguage, setCurrentLanguage, useCurrentLanguage } from '../utils/languageStore';
import { getTranslations, languages, Language } from '../utils/i18n';
import { toast } from 'sonner';
import { saveLanguagePreference } from '../utils/languagePreference';
import { translateUi } from '../utils/uiTranslation';
import { LoadingMark } from './BrandLoader';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'dialog';
  showLabel?: boolean;
  accessToken?: string;
  userId?: string;
}

export function LanguageSelector({
  accessToken,
  userId,
}: LanguageSelectorProps) {
  const language = useCurrentLanguage();
  const setLanguage = setCurrentLanguage;
  const t = getTranslations(language);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleSelect = async (code: Language) => {
    setOpen(false);
    setLanguage(code);
    const langName = languages.find(l => l.code === code)?.nativeName;
    toast.success(`${getTranslations(code).language.changedTo} ${langName}`);

    if (accessToken && userId) {
      setSaving(true);
      try {
        await saveLanguagePreference({ language: code, accessToken, userId });
      } catch {
        toast.error(translateUi(getCurrentLanguage(), undefined, 'Language changed on this device. Account sync failed; please try again.'));
      } finally {
        setSaving(false);
      }
    }
  };

  const current = languages.find(l => l.code === language);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Borderless icon button */}
      <button
        type="button"
        disabled={saving}
        onClick={() => setOpen(v => !v)}
        className="app-icon-button"
        aria-label={saving ? translateUi(language, undefined, 'Saving...') : t.language.select}
        aria-busy={saving}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: open ? 'var(--neutral-100)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.15s ease',
          color: 'var(--foreground)',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'var(--neutral-100)'; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        {saving ? <LoadingMark size={24} /> : <Globe
          strokeWidth={2.1}
          style={{ width: 'var(--icon-md)', height: 'var(--icon-md)', color: 'var(--neutral-700)' }}
        />}
      </button>

      {/* Floating menu — no hard border, soft shadow only */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.14, ease: [0.2, 0, 0, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: 192,
              background: 'var(--card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 32px -4px rgba(0,0,0,0.14), 0 2px 8px -2px rgba(0,0,0,0.08)',
              padding: '6px',
              zIndex: 200,
              overflow: 'hidden',
            }}
            role="menu"
            aria-label={t.language.menu}
          >
            {languages.map((lang) => {
              const isActive = language === lang.code;
              return (
                <button
                  type="button"
                  key={lang.code}
                  role="menuitem"
                  onClick={() => handleSelect(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive ? 'var(--primary-50)' : 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 0.12s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--neutral-100)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{lang.flag}</span>
                    <div>
                      <p className="tbo-label" lang={lang.code} style={{
                        color: isActive ? 'var(--primary-700)' : 'var(--foreground)',
                        margin: 0,
                      }}>
                        {lang.nativeName}
                      </p>
                      <p className="tbo-caption" style={{
                        color: 'var(--muted-foreground)',
                        margin: 0,
                      }}>
                        {lang.name}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <Check strokeWidth={2.5} style={{ width: 14, height: 14, color: 'var(--primary-600)', flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
