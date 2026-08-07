import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { languages, Language } from '../utils/i18n';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';

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
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
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
    toast.success(`Language set to ${langName}`);

    if (accessToken && userId) {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: code }),
          }
        );
      } catch { /* non-fatal */ }
    }
  };

  const current = languages.find(l => l.code === language);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Borderless icon button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Select language"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
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
        <Globe
          strokeWidth={1.6}
          style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)', color: 'var(--muted-foreground)' }}
        />
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
          >
            {languages.map((lang) => {
              const isActive = language === lang.code;
              return (
                <button
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{lang.flag}</span>
                    <div>
                      <p style={{
                        fontSize: 'var(--text-caption)',
                        fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                        color: isActive ? 'var(--primary-700)' : 'var(--foreground)',
                        lineHeight: 1.3,
                        margin: 0,
                      }}>
                        {lang.nativeName}
                      </p>
                      <p style={{
                        fontSize: 'var(--text-label)',
                        color: 'var(--muted-foreground)',
                        margin: 0,
                        lineHeight: 1.2,
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
