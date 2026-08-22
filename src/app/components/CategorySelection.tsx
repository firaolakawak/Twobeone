import { useEffect, useState } from 'react';
import { Sun, Heart, Scale, Church, Plane, Shield, Handshake, Baby, DollarSign, Users, BookOpen, ArrowUpRight, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
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
      icon: Sun,
      color: 'from-warning-500 to-warning-500',
      bgColor: 'bg-gradient-to-br from-warning-50 to-warning-50',
      borderColor: 'border-warning-500/30',
      textColor: 'text-warning-700',
      glowColor: 'bg-warning-200/60',
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
      glowColor: 'bg-primary-200/60',
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
      glowColor: 'bg-primary-200/60',
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
      glowColor: 'bg-sky-200/60',
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
      glowColor: 'bg-sky-200/60',
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
      glowColor: 'bg-success-200/60',
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
      glowColor: 'bg-sky-200/60',
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
      glowColor: 'bg-primary-200/60',
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
      glowColor: 'bg-success-200/60',
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
      glowColor: 'bg-warning-200/60',
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
      glowColor: 'bg-primary-200/60',
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            const progress = calculateCategoryProgress(questions, userResponses, category.id);
            const isComplete = progress.total > 0 && progress.remaining === 0;
            return (
              <motion.button
                key={category.id}
                type="button"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : index * 0.045, ease: [0.22, 1, 0.36, 1] }}
                whileHover={prefersReducedMotion ? undefined : { y: -5, scale: 1.012 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                className={`group relative w-full overflow-hidden rounded-[1.75rem] border ${category.borderColor} ${category.bgColor} text-left shadow-[0_10px_35px_-20px_rgba(88,28,59,0.35)] outline-none transition-[box-shadow,border-color] duration-300 hover:shadow-[0_22px_48px_-24px_rgba(88,28,59,0.5)] focus-visible:ring-4 focus-visible:ring-primary-300/40 focus-visible:ring-offset-2`}
                onClick={() => onSelectCategory(category.id)}
              >
                <div className={`pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full ${category.glowColor} blur-3xl opacity-50 transition-all duration-500 group-hover:scale-125 group-hover:opacity-80`} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/75 via-white/20 to-transparent opacity-70" />
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

                <div className="relative p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className={`absolute inset-1 rounded-2xl bg-gradient-to-br ${category.color} blur-md opacity-35 transition-opacity duration-300 group-hover:opacity-60`} />
                      <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${category.color} shadow-lg ring-1 ring-white/70 transition-transform duration-300 motion-safe:group-hover:-rotate-3 motion-safe:group-hover:scale-110`}>
                        <IconComponent className="h-7 w-7 text-white drop-shadow-sm transition-transform duration-300 motion-safe:group-hover:rotate-3" />
                        <span className="absolute inset-x-2 top-1 h-px bg-white/60" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h3 className={`text-lg font-semibold tracking-[-0.01em] ${category.textColor}`}>
                          {category.label}
                        </h3>
                        {!isLoadingProgress && progress.total > 0 && (
                          <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-white/80 bg-white/65 px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm ${category.textColor}`}>
                            {isComplete && <Check className="h-3 w-3" strokeWidth={3} />}
                            {progress.percentage}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {category.description}
                      </p>

                      <div className="mt-4 rounded-2xl border border-white/75 bg-white/50 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-sm" aria-label={`${category.label} progress`}>
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
                              <span className={`font-semibold ${category.textColor}`}>
                                {progress.remaining === 0 ? 'Complete' : `${progress.remaining} remaining`}
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-white/90 ring-1 ring-black/[0.04]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percentage}>
                              <motion.div
                                initial={prefersReducedMotion ? false : { width: 0 }}
                                animate={{ width: `${progress.percentage}%` }}
                                transition={{ duration: prefersReducedMotion ? 0 : 0.75, delay: prefersReducedMotion ? 0 : index * 0.04 + 0.2, ease: 'easeOut' }}
                                className={`relative h-full rounded-full bg-gradient-to-r ${category.color}`}
                              />
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">No questions available</p>
                        )}
                      </div>

                      <div className={`mt-4 flex items-center justify-end gap-1.5 text-xs font-semibold ${category.textColor}`}>
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

        {/* Back Button */}
        {onBack && (
          null
        )}
      </div>
    </div>
  );
}
