import { useEffect, useState } from 'react';
import { Sun, Heart, Scale, Church, Plane, Shield, Handshake, Baby, DollarSign, Users, BookOpen } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from './ui/card';
import { questions as questionsApi } from '../utils/api';

interface CategoryQuestion {
  id: string;
  category: string;
}

interface CategoryProgress {
  total: number;
  answered: number;
  remaining: number;
  percentage: number;
}

export function calculateCategoryProgress(
  questions: CategoryQuestion[],
  responses: unknown[],
  categoryId: string,
): CategoryProgress {
  const categoryQuestions = questions.filter(question => question.category === categoryId);
  const answeredIds = new Set(
    responses
      .map(response => {
        if (!response || typeof response !== 'object') return '';
        const record = response as Record<string, unknown>;
        const questionId = record.questionId ?? record.question_id;
        return typeof questionId === 'string' ? questionId.split(':prompt:')[0] : '';
      })
      .filter(Boolean),
  );
  const answered = categoryQuestions.filter(question => answeredIds.has(question.id)).length;
  const total = categoryQuestions.length;
  const remaining = Math.max(total - answered, 0);
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

  return { total, answered, remaining, percentage };
}

interface CategorySelectionProps {
  onSelectCategory: (categoryId: string) => void;
  onBack?: () => void;
  responses?: {
    user: unknown[];
    partner: unknown[];
  };
}

export function CategorySelection({ onSelectCategory, onBack, responses }: CategorySelectionProps) {
  const { t, language } = useLanguage();
  const [questions, setQuestions] = useState<CategoryQuestion[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingProgress(true);

    questionsApi.list(undefined, language)
      .then(data => {
        if (!cancelled) setQuestions(data.questions || []);
      })
      .catch(error => {
        console.warn('[CategorySelection] Could not load question progress:', error);
        if (!cancelled) setQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProgress(false);
      });

    return () => { cancelled = true; };
  }, [language]);

  const userResponses = responses?.user || [];
  const categories = [
    { 
      id: 'daily-life', 
      label: t.questions.categories.dailyLifeHabits,
      icon: Sun,
      color: 'from-warning-500 to-warning-500',
      bgColor: 'bg-gradient-to-br from-warning-50 to-warning-50',
      borderColor: 'border-warning-500/30',
      textColor: 'text-warning-700',
      description: t.questions.categoryDescriptions.dailyLifeHabits,
    },
    { 
      id: 'intimacy', 
      label: t.questions.categories.intimacyLifestyle,
      icon: Heart,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-gradient-to-br from-primary-50 to-primary-100',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-700',
      description: t.questions.categoryDescriptions.intimacyLifestyle,
    },
    { 
      id: 'love-balance', 
      label: t.questions.categories.loveBalance,
      icon: Scale,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-gradient-to-br from-primary-50 to-primary-100',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-700',
      description: t.questions.categoryDescriptions.loveBalance,
    },
    { 
      id: 'dream-wedding', 
      label: t.questions.categories.dreamWeddingHome,
      icon: Church,
      color: 'from-sky-500 to-primary-500',
      bgColor: 'bg-gradient-to-br from-sky-50 to-primary-50',
      borderColor: 'border-sky-200',
      textColor: 'text-sky-700',
      description: t.questions.categoryDescriptions.dreamWeddingHome,
    },
    { 
      id: 'travel', 
      label: t.questions.categories.travelAdventure,
      icon: Plane,
      color: 'from-sky-500 to-sky-500',
      bgColor: 'bg-gradient-to-br from-sky-50 to-sky-50',
      borderColor: 'border-sky-200',
      textColor: 'text-sky-700',
      description: t.questions.categoryDescriptions.travelAdventure,
    },
    { 
      id: 'boundaries', 
      label: t.questions.categories.relationshipBoundaries,
      icon: Shield,
      color: 'from-success-500 to-sky-500',
      bgColor: 'bg-gradient-to-br from-success-50 to-sky-50',
      borderColor: 'border-success-500/30',
      textColor: 'text-success-700',
      description: t.questions.categoryDescriptions.relationshipBoundaries,
    },
    { 
      id: 'trust', 
      label: t.questions.categories.trustTruth,
      icon: Handshake,
      color: 'from-sky-500 to-sky-500',
      bgColor: 'bg-gradient-to-br from-sky-50 to-sky-100',
      borderColor: 'border-sky-200',
      textColor: 'text-sky-700',
      description: t.questions.categoryDescriptions.trustTruth,
    },
    { 
      id: 'kids-future', 
      label: t.questions.categories.kidsFuture,
      icon: Baby,
      color: 'from-primary-500 to-primary-500',
      bgColor: 'bg-gradient-to-br from-primary-50 to-primary-50',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-700',
      description: t.questions.categoryDescriptions.kidsFuture,
    },
    { 
      id: 'finance', 
      label: t.questions.categories.financeGoals,
      icon: DollarSign,
      color: 'from-success-500 to-success-700',
      bgColor: 'bg-gradient-to-br from-success-50 to-success-50',
      borderColor: 'border-success-500/30',
      textColor: 'text-success-700',
      description: t.questions.categoryDescriptions.financeGoals,
    },
    { 
      id: 'family', 
      label: t.questions.categories.familyRelations,
      icon: Users,
      color: 'from-warning-500 to-warning-500',
      bgColor: 'bg-gradient-to-br from-warning-50 to-warning-50',
      borderColor: 'border-warning-500/30',
      textColor: 'text-warning-700',
      description: t.questions.categoryDescriptions.familyRelations,
    },
    { 
      id: 'bible', 
      label: t.questions.categories.bibleConvictions,
      icon: BookOpen,
      color: 'from-primary-500 to-primary-500',
      bgColor: 'bg-gradient-to-br from-primary-50 to-primary-50',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-700',
      description: t.questions.categoryDescriptions.bibleConvictions,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-primary-50 pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Back Icon Button */}
        {onBack && (
          null
        )}

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            {t.questions.selectCategory}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t.questions.knowEachOther}. Meaningful questions and deepen your Relationship
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const progress = calculateCategoryProgress(questions, userResponses, category.id);
            return (
              <Card
                key={category.id}
                className={`${category.bgColor} ${category.borderColor} cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2`}
                onClick={() => onSelectCategory(category.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className={`font-semibold text-lg ${category.textColor}`}>
                        {category.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                      <div className="pt-2 space-y-2" aria-label={`${category.label} progress`}>
                        {isLoadingProgress ? (
                          <div className="h-8 rounded-md bg-white/60 animate-pulse" />
                        ) : progress.total > 0 ? (
                          <>
                            <div className="flex items-center justify-between gap-3 text-xs font-medium">
                              <span className="text-muted-foreground">
                                {progress.answered} of {progress.total} answered
                              </span>
                              <span className={category.textColor}>
                                {progress.remaining === 0 ? 'Complete' : `${progress.remaining} remaining`}
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-white/80" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percentage}>
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${category.color} transition-all duration-500`}
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                            <p className={`text-right text-xs font-semibold ${category.textColor}`}>
                              {progress.percentage}% complete
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">No questions available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Back Button */}
        {onBack && (
          null
        )}
      </div>
    </div>
  );
}
