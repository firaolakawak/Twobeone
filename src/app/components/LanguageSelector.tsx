import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { getCurrentLanguage, setCurrentLanguage, useCurrentLanguage } from '../utils/languageStore';
import { getTranslations, languages, Language } from '../utils/i18n';
import { toast } from 'sonner';
import { saveLanguagePreference } from '../utils/languagePreference';
import { translateUi } from '../utils/uiTranslation';
import { LoadingMark } from './BrandLoader';
import '../styles/header-controls.css';

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
  const [menuOffset, setMenuOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Keep the anchored menu inside the viewport when text or the window grows.
  useLayoutEffect(() => {
    if (!open) return;
    const positionMenu = () => {
      if (!ref.current || !menuRef.current) return;
      const margin = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setMenuOffset(Math.min(0, ref.current.getBoundingClientRect().right - menuRef.current.offsetWidth - margin));
    };
    positionMenu();
    window.addEventListener('resize', positionMenu);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(positionMenu);
    if (menuRef.current) observer?.observe(menuRef.current);
    return () => {
      window.removeEventListener('resize', positionMenu);
      observer?.disconnect();
    };
  }, [open]);

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

  return (
    <div ref={ref} className="tbo-language-selector">
      <button
        type="button"
        disabled={saving}
        onClick={() => setOpen(v => !v)}
        className="tbo-glass-action tbo-header-control"
        aria-label={saving ? translateUi(language, undefined, 'Saving...') : t.language.select}
        aria-busy={saving}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {saving ? <LoadingMark size={24} /> : <Globe
          strokeWidth={2.1}
          aria-hidden="true"
        />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            className="tbo-glass-raised tbo-language-menu"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.14, ease: [0.2, 0, 0, 1] }}
            style={{ right: menuOffset }}
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
                  className="tbo-language-menu__item"
                  data-active={isActive || undefined}
                  onClick={() => handleSelect(lang.code)}
                >
                  <div className="tbo-language-menu__identity">
                    <span className="tbo-language-menu__flag" aria-hidden="true">{lang.flag}</span>
                    <div className="tbo-language-menu__names">
                      <p className="tbo-label" lang={lang.code}>
                        {lang.nativeName}
                      </p>
                      <p className="tbo-language-menu__translation tbo-caption">
                        {lang.name}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <Check className="tbo-language-menu__check" strokeWidth={2.5} aria-hidden="true" />
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
