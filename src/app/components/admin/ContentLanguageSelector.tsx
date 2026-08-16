import { Globe } from 'lucide-react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { useContentLanguage } from '../../contexts/ContentLanguageContext';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'Amharic (አማርኛ)' },
  { code: 'om', label: 'Afan Oromo (Oromiffa)' },
] as const;

export function ContentLanguageSelector() {
  const { contentLanguage, setContentLanguage } = useContentLanguage();

  return (
    <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-5 h-5 text-sky-600" />
        <Label className="text-sm font-semibold text-sky-700">
          Content Language
        </Label>
      </div>
      <p className="text-xs text-sky-700 mb-3">
        Select the language for the content you're creating. This doesn't change the admin panel interface.
      </p>
      <div className="flex flex-wrap gap-2">
        {languages.map(({ code, label }) => (
          <Button
            key={code}
            type="button"
            size="sm"
            variant={contentLanguage === code ? 'default' : 'outline'}
            onClick={() => setContentLanguage(code)}
            className={contentLanguage === code ? 'bg-sky-600 hover:bg-sky-700' : ''}
            aria-pressed={contentLanguage === code}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="mt-2 text-xs text-sky-600 font-medium">
        Creating content in: {languages.find(({ code }) => code === contentLanguage)?.label}
      </div>
    </div>
  );
}
