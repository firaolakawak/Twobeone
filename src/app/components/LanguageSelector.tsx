import { useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Languages, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { languages, Language } from '../utils/i18n';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'dialog';
  showLabel?: boolean;
  accessToken?: string;
  userId?: string;
}

export function LanguageSelector({ 
  variant = 'dropdown', 
  showLabel = true,
  accessToken,
  userId 
}: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleLanguageChange = async (newLang: Language) => {
    const oldLang = language;
    setLanguage(newLang);
    
    const langName = languages.find(l => l.code === newLang)?.nativeName;
    toast.success(`${t.common.success} - ${langName}`);

    // Save to backend if user is logged in
    if (accessToken && userId) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/profile`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              language: newLang
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to save language preference');
        }

        console.log('[Language] Saved preference to backend:', newLang);
      } catch (error) {
        console.error('[Language] Failed to save preference:', error);
        // Don't revert language change - local preference is still valid
      }
    }

    setIsDialogOpen(false);
  };

  if (variant === 'dialog') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="gap-2"
        >
          <Languages className="w-4 h-4" />
          {showLabel && <span>{t.profile.language}</span>}
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-primary-600" />
                {t.profile.language}
              </DialogTitle>
              <DialogDescription>
                Choose your preferred language / ተመራጭ ቋንቋዎን ይምረጡ
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    language === lang.code
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-border hover:border-primary-300 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{lang.flag}</span>
                    <div className="text-left">
                      <p className="font-semibold">{lang.nativeName}</p>
                      <p className="text-sm text-muted-foreground">{lang.name}</p>
                    </div>
                  </div>
                  {language === lang.code && (
                    <Check className="w-5 h-5 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Dropdown variant (default)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Languages className="w-4 h-4" />
          {showLabel && (
            <span className="hidden sm:inline">
              {languages.find(l => l.code === language)?.nativeName}
            </span>
          )}
          <span className="sm:hidden">
            {languages.find(l => l.code === language)?.flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </div>
            {language === lang.code && (
              <Check className="w-4 h-4 text-primary-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}