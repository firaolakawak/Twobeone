import { createContext, useContext, ReactNode } from 'react';
import { Language, getTranslations, Translations } from '../utils/i18n';
import { setCurrentLanguage, useCurrentLanguage } from '../utils/languageStore';

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
  const language = useCurrentLanguage();
  const t = getTranslations(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setCurrentLanguage, t }}>
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
