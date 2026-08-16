import { createContext, useContext, useState, ReactNode } from 'react';

export type ContentLanguage = 'en' | 'am' | 'om';

interface ContentLanguageContextType {
  contentLanguage: ContentLanguage;
  setContentLanguage: (lang: ContentLanguage) => void;
}

const ContentLanguageContext = createContext<ContentLanguageContextType | undefined>(undefined);

interface ContentLanguageProviderProps {
  children: ReactNode;
}

export function ContentLanguageProvider({ children }: ContentLanguageProviderProps) {
  const [contentLanguage, setContentLanguage] = useState<ContentLanguage>('en');

  return (
    <ContentLanguageContext.Provider value={{ contentLanguage, setContentLanguage }}>
      {children}
    </ContentLanguageContext.Provider>
  );
}

// Custom hook to use content language context (for admin panel)
export function useContentLanguage() {
  const context = useContext(ContentLanguageContext);
  if (context === undefined) {
    throw new Error('useContentLanguage must be used within a ContentLanguageProvider');
  }
  return context;
}
