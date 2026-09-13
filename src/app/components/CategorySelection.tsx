import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, MessageCircleHeart } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { questions as questionsApi } from '../utils/api';
import { getQACategoryVisual } from './qaCategoryVisuals';

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
  const prefersReducedMotion = useReducedMotion();
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
      description: t.questions.categoryDescriptions.dailyLifeHabits,
    },
    { 
      id: 'intimacy', 
      label: t.questions.categories.intimacyLifestyle,
      description: t.questions.categoryDescriptions.intimacyLifestyle,
    },
    { 
      id: 'love-balance', 
      label: t.questions.categories.loveBalance,
      description: t.questions.categoryDescriptions.loveBalance,
    },
    { 
      id: 'dream-wedding', 
      label: t.questions.categories.dreamWeddingHome,
      description: t.questions.categoryDescriptions.dreamWeddingHome,
    },
    { 
      id: 'travel', 
      label: t.questions.categories.travelAdventure,
      description: t.questions.categoryDescriptions.travelAdventure,
    },
    { 
      id: 'boundaries', 
      label: t.questions.categories.relationshipBoundaries,
      description: t.questions.categoryDescriptions.relationshipBoundaries,
    },
    { 
      id: 'trust', 
      label: t.questions.categories.trustTruth,
      description: t.questions.categoryDescriptions.trustTruth,
    },
    { 
      id: 'kids-future', 
      label: t.questions.categories.kidsFuture,
      description: t.questions.categoryDescriptions.kidsFuture,
    },
    { 
      id: 'finance', 
      label: t.questions.categories.financeGoals,
      description: t.questions.categoryDescriptions.financeGoals,
    },
    { 
      id: 'family', 
      label: t.questions.categories.familyRelations,
      description: t.questions.categoryDescriptions.familyRelations,
    },
    { 
      id: 'bible', 
      label: t.questions.categories.bibleConvictions,
      description: t.questions.categoryDescriptions.bibleConvictions,
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(251,247,249,0.9)_0%,#fff_28%,#fff_100%)] pb-20">
      <div className="mx-auto max-w-5xl space-y-7 px-4 py-5 sm:px-6 sm:py-8">
        {onBack && (
          <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/70 bg-white px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            <ArrowLeft className="h-4 w-4" /> Back home
          </button>
        )}

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
            <MessageCircleHeart className="h-6 w-6" />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-600">{t.questions.title}</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.questions.selectCategory}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            {t.questions.knowEachOther}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {categories.map((category, index) => {
            const visual = getQACategoryVisual(category.id);
            const IconComponent = visual.icon;
            const progress = calculateCategoryProgress(questions, userResponses, category.id);
            const isComplete = progress.total > 0 && progress.remaining === 0;
            return (
              <motion.button
                key={category.id}
                type="button"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : index * 0.045, ease: [0.22, 1, 0.36, 1] }}
                whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                className={`group relative w-full overflow-hidden rounded-3xl border ${visual.border} ${visual.card} text-left shadow-[0_8px_28px_-22px_rgba(45,28,38,0.35)] outline-none transition-[box-shadow,border-color] duration-300 hover:shadow-[0_18px_38px_-24px_rgba(45,28,38,0.42)] focus-visible:ring-4 focus-visible:ring-primary-300/30 focus-visible:ring-offset-2`}
                onClick={() => onSelectCategory(category.id)}
              >
                <div className="relative p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${visual.iconSurface} ${visual.iconColor} ring-1 ring-black/[0.035] transition-transform duration-300 motion-safe:group-hover:scale-105`}>
                      <IconComponent className="h-6 w-6" strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h3 className={`text-lg font-semibold tracking-[-0.01em] ${visual.text}`}>
                          {category.label}
                        </h3>
                        {!isLoadingProgress && progress.total > 0 && (
                          <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-black/[0.05] bg-white/80 px-2.5 py-1 text-[11px] font-bold ${visual.text}`}>
                            {isComplete && <Check className="h-3 w-3" strokeWidth={3} />}
                            {progress.percentage}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {category.description}
                      </p>

                      <div className="mt-4 rounded-2xl border border-black/[0.045] bg-white/65 p-3" aria-label={`${category.label} progress`}>
                        {isLoadingProgress ? (
                          <div className="space-y-2" aria-label="Loading progress">
                            <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/80" />
                            <div className="h-2.5 animate-pulse rounded-full bg-white/70" />
                          </div>
                        ) : progress.total > 0 ? (
                          <>
                            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium">
                              <span className="text-muted-foreground">
                                {progress.answered} of {progress.total} answered
                              </span>
                              <span className={`font-semibold ${visual.text}`}>
                                {progress.remaining === 0 ? 'Complete' : `${progress.remaining} remaining`}
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-white/90 ring-1 ring-black/[0.04]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percentage}>
                              <motion.div
                                initial={prefersReducedMotion ? false : { width: 0 }}
                                animate={{ width: `${progress.percentage}%` }}
                                transition={{ duration: prefersReducedMotion ? 0 : 0.75, delay: prefersReducedMotion ? 0 : index * 0.04 + 0.2, ease: 'easeOut' }}
                                className={`relative h-full rounded-full ${visual.progress}`}
                              />
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">No questions available</p>
                        )}
                      </div>

                      <div className={`mt-4 flex items-center justify-end gap-1.5 text-xs font-semibold ${visual.text}`}>
                        <span>{isComplete ? 'Review together' : progress.answered > 0 ? 'Continue conversation' : 'Start conversation'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
