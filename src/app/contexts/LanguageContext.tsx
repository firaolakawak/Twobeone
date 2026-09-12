import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslations, Translations } from '../utils/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Initialize language from localStorage or default to English
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = typeof window === 'undefined' ? null : window.localStorage.getItem('twobeone_language');
    return (saved === 'en' || saved === 'am' || saved === 'om') ? saved as Language : 'en';
  });

  // Get translations for current language
  const t = getTranslations(language);

  // Save language preference
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('twobeone_language', lang);
      window.dispatchEvent(new CustomEvent('twobeone:language-change', { detail: lang }));
    }
  };

  // Keep every provider instance and other open tabs in sync. The app has
  // separate provider boundaries for public, authentication, and app routes.
  useEffect(() => {
    const applyExternalLanguage = (next: unknown) => {
      if (next === 'en' || next === 'am' || next === 'om') setLanguageState(next);
    };
    const handleLanguageChange = (event: Event) => {
      applyExternalLanguage((event as CustomEvent<unknown>).detail);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'twobeone_language') applyExternalLanguage(event.newValue);
    };
    window.addEventListener('twobeone:language-change', handleLanguageChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('twobeone:language-change', handleLanguageChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Keep browser accessibility metadata in sync. fonts.css provides local
  // Ethiopic glyphs automatically when the selected language needs them.
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
    document.body.dataset.language = language;

  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
