import { BookOpen, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';
import { useLanguage } from '../contexts/LanguageContext';

interface DailyVerseCardProps {
  verse: string;
  reference: string;
  onClick?: () => void;
}

export function DailyVerseCard({ verse, reference, onClick }: DailyVerseCardProps) {
  const { t } = useLanguage();

  return (
    <Card
      className="border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-shadow"
      style={{ background: 'color-mix(in srgb, var(--primary) 6%, var(--background))' }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <BookOpen className="w-4 h-4" style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <h3 className="font-semibold text-foreground">{t.dashboard.dailyVerse}</h3>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>

      <p className="text-foreground italic mb-3 leading-relaxed">
        "{verse}"
      </p>

      <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
        {reference}
      </p>
    </Card>
  );
}
