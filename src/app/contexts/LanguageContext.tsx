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

  // Keep browser accessibility metadata and the Ethiopic font in sync on every change.
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
    document.body.dataset.language = language;

    if (language === 'am' || language === 'om') {
      const id = 'ethiopic-font';
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wdth,wght@75..125,100..900&display=swap';
        document.head.appendChild(link);
      }
    }
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
