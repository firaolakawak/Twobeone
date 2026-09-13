import { BrandLoader, LoadingMark } from './BrandLoader';
import { useUiCopy } from '../utils/uiTranslation';
import { questionsUiMessages, getQuestionCategorySource, getQuestionChoiceSource } from '../locales/questionsUi';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { BackButton } from './BackButton';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import {
  ChevronLeft,
  MessageSquare,
  Heart,
  Send,
  BookOpen,
  Sparkles,
  Users,
  ChevronRight,
  ChevronDown,
  Globe,
  Lock,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Trophy,
  Sprout,
  Lightbulb,
  CalendarDays
} from 'lucide-react';
import { compatibility as compatibilityApi } from '../utils/api';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { DynamicQuestionPrompt } from './DynamicQuestionPrompt';
import { AIAssistant } from './AIAssistant';
import { getQACategoryVisual } from './qaCategoryVisuals';

const supabase = createClient();

type QuestionType = 'text' | 'multiple_choice' | 'multiple_select' | 'like_dislike' | 'love_hate' | 'scale' | 'yes_no';

interface QuestionPrompt {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  scaleMax?: number;
}

interface Question {
  id: string;
  category: string;
  title: string;
  verse: string;
  verseReference: string;
  prompts: QuestionPrompt[];
  userAnswers?: Record<string, string | string[] | number>;
  partnerAnswers?: Record<string, string | string[] | number>;
  language?: string; // Add language field
}

interface QADiscussionHubProps {
  onSaveAnswer: (questionId: string, answers: Record<string, string | string[] | number>, categoryId?: string) => void;
  onPrayTogether: (question: Question) => void;
  userName?: string;
  partnerName?: string;
  selectedCategory?: string; // Category pre-selected from navigation
  onBack?: () => void; // Navigate back to category selection
}

export function QADiscussionHub({ 
  onSaveAnswer, 
  onPrayTogether,
  userName,
  partnerName,
  selectedCategory,
  onBack
}: QADiscussionHubProps) {
  const tr = useUiCopy(questionsUiMessages);
  const { t, language: appLanguage } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState(selectedCategory || 'all');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  // Overall compatibility state
  const [overallResult, setOverallResult] = useState<any>(null);
  const [overallLoading, setOverallLoading] = useState(false);
  const [overallLoaded, setOverallLoaded] = useState(false);

  // Language filter — default to app-level language so it's always in sync
  const selectedLanguage = appLanguage;

  // Update active category when selectedCategory prop changes
  useEffect(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
      setCurrentQuestionIndex(0);
    }
  }, [selectedCategory]);

  // All 11 real categories (excluding 'all') for completion tracking
  const ALL_CATEGORY_IDS = [
    'daily-life','intimacy','love-balance','dream-wedding','travel',
    'boundaries','trust','kids-future','finance','family','bible',
  ];

  // Compute category engagement — a category is "engaged" when both partners answered ≥1 question in it
  const categoryEngagement = ALL_CATEGORY_IDS.map(catId => {
    const catQs = questions.filter(q => q.category === catId);
    const bothAnswered = catQs.filter(q =>
      q.userAnswers && Object.keys(q.userAnswers).length > 0 &&
      q.partnerAnswers && Object.keys(q.partnerAnswers).length > 0
    );
    return { id: catId, total: catQs.length, bothAnswered: bothAnswered.length, complete: bothAnswered.length > 0 };
  });

  const completedCatIds = categoryEngagement.filter(c => c.complete).map(c => c.id);
  const isEligibleForOverall = completedCatIds.length >= 3;
  const isFullyComplete = completedCatIds.length === ALL_CATEGORY_IDS.length;

  // Load cached overall result once questions are loaded
  useEffect(() => {
    if (questions.length === 0 || overallLoaded) return;
    setOverallLoaded(true);
    compatibilityApi.getOverall()
      .then(data => { if (data?.result) setOverallResult(data.result); })
      .catch(() => {});
  }, [questions.length]);

  const handleGenerateOverall = async (force = false) => {
    if (!isEligibleForOverall) return;
    setOverallLoading(true);
    try {
      // Build Q&A pairs for each completed category
      const questionPairs = completedCatIds.map(catId => {
        const catLabel = categories.find(c => c.id === catId)?.label || catId;
        const catQs = questions.filter(q =>
          q.category === catId &&
          q.userAnswers && Object.keys(q.userAnswers).length > 0 &&
          q.partnerAnswers && Object.keys(q.partnerAnswers).length > 0
        );
        return {
          categoryId: catId,
          categoryLabel: catLabel,
          questions: catQs.map(q => ({
            id: q.id,
            title: q.title,
            prompts: (q.prompts || []).map((p: any) => {
              const ua = q.userAnswers?.[p.id];
              const pa = q.partnerAnswers?.[p.id];
              const fmt = (v: any) => Array.isArray(v) ? v.join(', ') : String(v ?? '—');
              return { text: p.text, userAnswer: fmt(ua), partnerAnswer: fmt(pa) };
            }),
          })),
        };
      });

      const result = await compatibilityApi.generateOverall({
        completedCategories: completedCatIds,
        questionPairs,
        userName: userName || tr("You"),
        partnerName: partnerName || tr("Your partner"),
        force,
      });
      setOverallResult(result);
    } catch (err: any) {
      toast.error(tr("Could not generate compatibility. Please try again."));
    } finally {
      setOverallLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: t.questions.title },
    ...ALL_CATEGORY_IDS.map(id => ({ id, label: tr(getQuestionCategorySource(id)) })),
  ];

  useEffect(() => {
    const controller = new AbortController();
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setIsLoadingQuestions(true);
    void loadQuestions(controller.signal);
    return () => controller.abort();
  }, [activeCategory, selectedLanguage]);

  const loadQuestions = async (signal?: AbortSignal) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || publicAnonKey;

      // Build URL with proper query parameters
      let url = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/questions`;
      const params = [];

      if (activeCategory !== 'all') {
        params.push(`category=${activeCategory}`);
      }

      // Always add language parameter to filter by selected language
      params.push(`language=${selectedLanguage}`);

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      console.log('Fetching questions from:', url);
      console.log('Category filter:', activeCategory);
      console.log('Language filter:', selectedLanguage);

      const response = await fetch(url, {
        signal,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const body = await response.json();
        // Backend already handles language filtering + English fallback.
        // No duplicate frontend filter — it would hide all questions for 'om' users.
        const fetchedQuestions: any[] = body.questions || [];

        // Convert prompts to the component's expected format
        const convertedQuestions = fetchedQuestions.map((q: any) => ({
          ...q,
          prompts: (q.prompts || []).map((p: any) => ({
            id: p.id,
            text: p.text || p,
            type: p.type || 'text',
            options: p.options || [],
            scaleMax: p.scaleMax || 5,
          })),
        }));

        // Fetch ALL responses — no category param. Responses have no category field,
        // so passing one caused the backend to filter everything out. The client-side
        // attachResponses() already scopes responses to the current question set by questionId.
        let userResponses: any[] = [];
        let partnerResponses: any[] = [];
        try {
          const respBulk = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/question-responses`,
            { signal, headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (respBulk.ok) {
            const bulk = await respBulk.json();
            userResponses = bulk.userResponses || [];
            partnerResponses = bulk.partnerResponses || [];
          }
        } catch (err) {
          console.warn('[Q&A] Could not load bulk responses, showing questions without response state');
        }

        // Attach responses to each question client-side.
        // Handles two storage formats:
        //   DailyQuestion: questionId = "qId:prompt:N"  (no promptId field)
        //   QADiscussionHub: questionId = "qId", promptId = "someId"
        const attachResponses = (responses: any[], q: Question): Record<string, any> => {
          const out: Record<string, any> = {};
          responses.forEach((r: any) => {
            const baseId = (r.questionId || '').split(':prompt:')[0];
            if (baseId !== q.id) return;
            const key = r.promptId
              ?? (r.questionId?.includes(':prompt:') ? r.questionId.split(':prompt:')[1] : 'default');
            out[key] = r;
          });
          return out;
        };

        const questionsWithResponses = convertedQuestions.map((q: Question) => ({
          ...q,
          userAnswers: attachResponses(userResponses, q),
          partnerAnswers: attachResponses(partnerResponses, q),
        }));

        if (!signal?.aborted) setQuestions(questionsWithResponses);
      } else {
        // 401 = token expired, silently skip (user will be redirected)
        if (response.status !== 401) {
          let msg = tr("Failed to load questions");
          try { const e = await response.json(); msg = e.error || msg; } catch {}
          console.error('Load questions error:', response.status, msg);
          toast.error(msg);
        }
      }
    } catch (error: any) {
      if (signal?.aborted) return;
      const msg: string = error?.message || '';
      console.error('Load questions exception:', msg);
      // Suppress transient network/timeout errors silently
      if (!msg.includes('timeout') && !msg.includes('Failed to fetch') && !msg.includes('NetworkError')) {
        toast.error(tr("Failed to load questions. Please try again."));
      }
    } finally {
      if (!signal?.aborted) setIsLoadingQuestions(false);
    }
  };

  const filteredQuestions = activeCategory === 'all' 
    ? questions 
    : questions.filter(q => q.category === activeCategory);

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => 
      prev === 0 ? filteredQuestions.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentQuestionIndex((prev) => 
      prev === filteredQuestions.length - 1 ? 0 : prev + 1
    );
  };

  const handleSaveAnswer = async (questionId: string, answers: Record<string, string | string[] | number>) => {
    try {
      // Pass the active category so App.tsx can deep-link the partner notification
      const category = activeCategory !== 'all' ? activeCategory : undefined;
      await onSaveAnswer(questionId, answers, category);
      // Reload from server so answered status, stats, and card badges all reflect reality
      await loadQuestions();
    } catch (error) {
      console.error('Failed to save answer:', error);
      throw error;
    }
  };

  const answeredQuestions = filteredQuestions.filter(
    question => question.userAnswers && Object.keys(question.userAnswers).length > 0,
  ).length;
  const discussedQuestions = filteredQuestions.filter(
    question => question.userAnswers && Object.keys(question.userAnswers).length > 0
      && question.partnerAnswers && Object.keys(question.partnerAnswers).length > 0,
  ).length;
  const completionPercentage = filteredQuestions.length > 0
    ? Math.round((answeredQuestions / filteredQuestions.length) * 100)
    : 0;
  const remainingQuestions = Math.max(filteredQuestions.length - answeredQuestions, 0);
  const activeCategoryDetails = categories.find(category => category.id === activeCategory) || categories[0];
  const activeCategoryVisual = getQACategoryVisual(activeCategoryDetails.id);
  const ActiveCategoryIcon = activeCategoryVisual.icon;

  return (
    <div className="space-y-5 pb-10">
      <motion.section
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-primary-100/80 bg-gradient-to-br from-primary-50/70 via-white to-sky-50/45 p-5 shadow-[0_18px_50px_rgba(83,45,67,0.08)] sm:p-7"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-sky-200/25 blur-3xl" />

        <div className="relative">
          <div className="mb-6 flex items-center justify-between gap-3">
            {onBack ? (
              <BackButton label={t.common.back} onClick={onBack} />
            ) : <span />}
            <div className={`tbo-caption inline-flex items-center gap-2 rounded-full border ${activeCategoryVisual.border} bg-white/80 px-3 py-2 ${activeCategoryVisual.text} shadow-sm`}>
              <ActiveCategoryIcon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              {activeCategoryDetails.label}
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 ring-1 ring-primary-200/60">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h1 className="tbo-page-title text-foreground">{tr("A conversation worth having")}</h1>
            <p className="tbo-supporting mt-2 text-muted-foreground">{tr("Answer honestly, discover each other gently, and grow closer one question at a time.")}</p>
          </div>

          <div className="mt-6 rounded-3xl border border-white/80 bg-white/65 p-4 shadow-sm backdrop-blur-sm">
            <div className="mb-2 flex items-end justify-between gap-4">
              <div>
                <p className="tbo-eyebrow text-primary-600">{tr("Your progress")}</p>
                <p className="tbo-supporting mt-1 text-foreground">{remainingQuestions === 0 && filteredQuestions.length > 0 ? tr("Beautiful — this category is complete") : tr('{count} questions remaining', { count: remainingQuestions })}</p>
              </div>
              <span className="text-2xl font-bold text-primary-700">{completionPercentage}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-primary-100/80" role="progressbar" aria-label={tr("Category completion")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercentage}>
              <motion.div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700" initial={prefersReducedMotion ? false : { width: 0 }} animate={{ width: `${completionPercentage}%` }} transition={{ duration: prefersReducedMotion ? 0 : 0.65, ease: 'easeOut' }} />
            </div>
            <div className="mt-4 grid grid-cols-3 divide-x divide-primary-100 text-center">
              {[
                { value: filteredQuestions.length, label: tr("Questions") },
                { value: answeredQuestions, label: tr("Answered") },
                { value: discussedQuestions, label: tr("Together") },
              ].map(stat => (
                <div key={stat.label} className="px-2">
                  <p className="tbo-body text-foreground">{stat.value}</p>
                  <p className="tbo-caption text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      <button type="button" aria-expanded={showAIAssistant} onClick={() => setShowAIAssistant(!showAIAssistant)} className="tbo-action group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary-700 px-5 text-white shadow-[0_10px_24px_rgba(125,55,82,0.18)] transition-all hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-[0_14px_30px_rgba(125,55,82,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 motion-reduce:transform-none">
        <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
        {showAIAssistant ? tr("Close AI companion") : tr("Open AI companion")}
      </button>

      <AnimatePresence initial={false}>
        {showAIAssistant && (
          <motion.div initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}>
            <AIAssistant questions={questions} onClose={() => setShowAIAssistant(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoadingQuestions && (
        <Card className="p-12 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <BrandLoader label={tr('Loading questions…')} />
        </Card>
      )}

      {/* Empty State */}
      {!isLoadingQuestions && filteredQuestions.length === 0 && (
        <Card className="p-12 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--neutral-300)' }} />
          <h3 className="tbo-card-title mb-2">{tr("No Questions Yet")}</h3>
          <p className="tbo-body text-muted-foreground mb-4">
            {activeCategory === 'all' 
              ? tr("No questions have been created yet. Check back later!")
              : tr("No questions in this category yet.")}
          </p>
          {activeCategory !== 'all' && (
            <Button className="tbo-action"
              variant="outline"
              onClick={() => {
                setActiveCategory('all');
                setCurrentQuestionIndex(0);
              }}
            >

              {tr("View All Categories")}
            </Button>
          )}
        </Card>
      )}

      {/* Question Carousel */}
      {!isLoadingQuestions && filteredQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-white/80 p-2 shadow-sm">
            <button type="button" onClick={handlePrevious} aria-label={tr("Previous question")} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              <ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">{tr("Previous")}</span>
            </button>
            <div className="min-w-32 text-center">
              <p className="tbo-eyebrow text-primary-600">{tr("Question")} {currentQuestionIndex + 1}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary-100">
                <div className="h-full rounded-full bg-primary-600 transition-[width] duration-300" style={{ width: `${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%` }} />
              </div>
            </div>
            <button type="button" onClick={handleNext} aria-label={tr("Next question")} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              <span className="hidden sm:inline">{tr("Next")}</span><ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={currentQuestion.id} initial={prefersReducedMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -18 }} transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}>
              <QuestionCard question={currentQuestion} onSaveAnswer={(questionId, answers) => handleSaveAnswer(questionId, answers)} onPrayTogether={() => onPrayTogether(currentQuestion)} onNextQuestion={handleNext} userName={userName} partnerName={partnerName} />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ── General Compatibility Match ─ shown below per-question AI match ── */}
      {questions.length > 0 && (
        <Card style={{ border: '2px solid var(--primary-200)', background: 'var(--primary-50)', borderRadius: 'var(--radius-lg)' }}>
          <CardHeader style={{ paddingBottom: 'var(--spacing-2)' }}>
            <CardTitle className="tbo-card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)',  color: 'var(--primary-700)' }}>
              <TrendingUp className="w-5 h-5" />

              {tr("General Compatibility Match")}
              {overallResult?.cached && (
                <span className="tbo-caption" style={{  background: 'var(--primary-100)', color: 'var(--primary-700)', padding: '2px 8px', borderRadius: 'var(--radius-full)',  }}>
                  <Sparkles className="w-3 h-3 inline mr-1" />{tr("AI · Saved")}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>

            {/* Category Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                <span className="tbo-label" style={{  color: 'var(--foreground)',  }}>

                  {tr("Categories completed together")}
                </span>
                <span className="tbo-label" style={{   color: 'var(--primary-700)' }}>
                  {completedCatIds.length} / {ALL_CATEGORY_IDS.length}
                </span>
              </div>
              <div style={{ height: 8, background: 'var(--neutral-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(completedCatIds.length / ALL_CATEGORY_IDS.length) * 100}%`,
                  background: completedCatIds.length === ALL_CATEGORY_IDS.length ? 'var(--success-500)' : 'var(--primary-500)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.6s ease',
                }} />
              </div>

              {/* Category pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-3)' }}>
                {ALL_CATEGORY_IDS.map(catId => {
                  const eng = categoryEngagement.find(c => c.id === catId);
                  const cat = categories.find(c => c.id === catId);
                  const visual = getQACategoryVisual(catId);
                  const CategoryIcon = visual.icon;
                  return (
                    <div className="tbo-caption" key={catId} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',

                      background: eng?.complete ? 'var(--success-50)' : 'var(--card)',
                      border: `1.5px solid ${eng?.complete ? 'var(--success-500)' : 'var(--border)'}`,
                      color: eng?.complete ? 'var(--success-700)' : 'var(--muted-foreground)',
                    }}>
                      {eng?.complete ? (
                        <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--success-500)' }} />
                      ) : (
                        <CategoryIcon className="w-3 h-3" aria-hidden="true" />
                      )}
                      {cat?.label}
                      {eng && eng.total > 0 && (
                        <span style={{ opacity: 0.7 }}>({eng.bothAnswered}/{eng.total})</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Not eligible yet */}
            {!isEligibleForOverall && (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-4)', background: 'var(--muted)', borderRadius: 'var(--radius-md)' }}>
                <Lock className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--neutral-400)' }} />
                <p className="tbo-body" style={{  color: 'var(--muted-foreground)',  }}>

                  {tr("Complete at least 3 categories together to unlock")}
                </p>
                <p className="tbo-supporting" style={{  color: 'var(--muted-foreground)', marginTop: 4 }}>
                  {tr('{count} more needed', { count: 3 - completedCatIds.length })}
                </p>
              </div>
            )}

            {/* Eligible but no result yet */}
            {isEligibleForOverall && !overallResult && (
              <div style={{ textAlign: 'center' }}>
                <p className="tbo-supporting" style={{  color: 'var(--muted-foreground)', marginBottom: 'var(--spacing-3)' }}>
                  {isFullyComplete
                    ? tr("🎉 You've completed all categories! Generate your full compatibility match.")
                    : tr("You've completed {count} categories together. Generate your compatibility match now, or complete more for a richer analysis.", { count: completedCatIds.length })}
                </p>
                <Button className="tbo-action"
                  onClick={() => handleGenerateOverall(false)}
                  disabled={overallLoading}
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)',   borderRadius: 'var(--radius-md)', padding: '0 var(--spacing-6)', height: 'var(--button-md)' }}
                >
                  {overallLoading ? <><LoadingMark className="mr-2" />{tr("Analysing…")}</> : <><Sparkles className="w-4 h-4 mr-2" />{tr("Generate Compatibility Match")}</>}
                </Button>
              </div>
            )}

            {/* Result */}
            {overallResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-5)' }}>
                  <div style={{
                    position: 'relative', width: 80, height: 80, flexShrink: 0,
                    borderRadius: '50%',
                    background: `conic-gradient(var(--primary-500) ${overallResult.score * 3.6}deg, var(--neutral-200) 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ position: 'absolute', width: 62, height: 62, borderRadius: '50%', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 'var(--text-subtitle)', fontWeight: 'var(--font-weight-bold)', color: 'var(--primary-700)' }}>{overallResult.score}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="tbo-section-title" style={{   color: 'var(--primary-700)' }}>{overallResult.label}</p>
                    <p className="tbo-supporting" style={{  color: 'var(--muted-foreground)', marginTop: 2 }}>
                      {tr('Based on {count} categories · {date}', { count: completedCatIds.length, date: tr(overallResult.aiPowered ? 'AI-powered' : 'Stats-based') })}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div style={{ background: 'var(--success-50)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)' }}>
                    <p className="tbo-supporting mb-2 flex items-center gap-1.5 text-success-700"><Trophy className="h-4 w-4" />{tr("Strengths")}</p>
                    {(overallResult.strengths || []).map((s: string, i: number) => (
                      <p className="tbo-supporting" key={i} style={{  color: 'var(--foreground)', marginBottom: 4 }}>• {s}</p>
                    ))}
                  </div>
                  <div style={{ background: 'var(--warning-50)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)' }}>
                    <p className="tbo-supporting mb-2 flex items-center gap-1.5 text-warning-700"><Sprout className="h-4 w-4" />{tr("Grow Together")}</p>
                    {(overallResult.growthAreas || []).map((g: string, i: number) => (
                      <p className="tbo-supporting" key={i} style={{  color: 'var(--foreground)', marginBottom: 4 }}>• {g}</p>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'var(--card)', border: '1px solid var(--primary-200)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-4)' }}>
                  <p className="tbo-supporting flex items-start gap-2 italic text-foreground"><Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />{overallResult.insight}</p>
                </div>
                <div style={{ background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)', display: 'flex', gap: 'var(--spacing-3)' }}>
                  <CalendarDays className="h-5 w-5 flex-shrink-0 text-primary-600" />
                  <div>
                    <p className="tbo-caption" style={{   color: 'var(--primary-700)', marginBottom: 4 }}>{tr("30-Day Challenge")}</p>
                    <p className="tbo-supporting" style={{  color: 'var(--foreground)',  }}>{overallResult.challenge}</p>
                  </div>
                </div>
                {overallResult.categoryHighlights && Object.keys(overallResult.categoryHighlights).length > 0 && (
                  <details style={{ cursor: 'pointer' }}>
                    <summary className="tbo-label" style={{   color: 'var(--primary-700)', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ChevronRight className="w-4 h-4" />

                      {tr("Category Highlights")}
                    </summary>
                    <div style={{ marginTop: 'var(--spacing-3)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                      {Object.entries(overallResult.categoryHighlights).map(([catId, note]: [string, any]) => {
                        const cat = categories.find(c => c.id === catId);
                        const visual = getQACategoryVisual(catId);
                        const CategoryIcon = visual.icon;
                        return (
                          <div key={catId} style={{ display: 'flex', gap: 'var(--spacing-2)', padding: 'var(--spacing-2) var(--spacing-3)', background: 'var(--card)', borderRadius: 'var(--radius-sm)' }}>
                            <CategoryIcon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${visual.iconColor}`} aria-hidden="true" />
                            <div>
                              <span className="tbo-caption" style={{   color: 'var(--foreground)' }}>{cat?.label}: </span>
                              <span className="tbo-supporting" style={{  color: 'var(--muted-foreground)' }}>{note}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button className="tbo-action"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateOverall(true)}
                    disabled={overallLoading}
                    style={{  color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
                  >
                    {overallLoading ? <LoadingMark className="mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}

                    {tr("Regenerate")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// QuestionCard Component
interface QuestionCardProps {
  question: Question;
  onSaveAnswer: (questionId: string, answers: Record<string, string | string[] | number>) => void;
  onPrayTogether: () => void;
  onNextQuestion: () => void;
  userName?: string;
  partnerName?: string;
}

// Calculate match percentage between user and partner answers
function calculateMatchPercentage(
  prompts: QuestionPrompt[],
  userAnswers: Record<string, string | string[] | number>,
  partnerAnswers: Record<string, string | string[] | number>
): number {
  if (!userAnswers || !partnerAnswers || prompts.length === 0) return 0;

  let totalScore = 0;
  let promptCount = 0;

  prompts.forEach(prompt => {
    const userAnswer = userAnswers[prompt.id];
    const partnerAnswer = partnerAnswers[prompt.id];

    // Skip if either answer is missing
    if (!userAnswer || !partnerAnswer) return;

    promptCount++;

    if (prompt.type === 'multiple_choice' || prompt.type === 'yes_no' || prompt.type === 'like_dislike' || prompt.type === 'love_hate') {
      // Exact match for single-choice questions
      totalScore += userAnswer === partnerAnswer ? 100 : 0;
    } else if (prompt.type === 'multiple_select') {
      // Calculate overlap percentage for multi-select
      const userArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      const partnerArray = Array.isArray(partnerAnswer) ? partnerAnswer : [partnerAnswer];

      const intersection = userArray.filter(item => partnerArray.includes(item));
      const union = [...new Set([...userArray, ...partnerArray])];

      totalScore += union.length > 0 ? (intersection.length / union.length) * 100 : 0;
    } else if (prompt.type === 'scale') {
      // Calculate proximity for scale questions
      const userVal = Number(userAnswer);
      const partnerVal = Number(partnerAnswer);
      const maxScale = prompt.scaleMax || 10;

      const difference = Math.abs(userVal - partnerVal);
      const similarity = Math.max(0, (maxScale - difference) / maxScale) * 100;
      totalScore += similarity;
    } else if (prompt.type === 'text') {
      // For text, just check if both answered (can't compare semantic similarity easily)
      totalScore += 50; // Neutral score for having both answered
    }
  });

  return promptCount > 0 ? Math.round(totalScore / promptCount) : 0;
}

interface AICompatibility {
  score: number;
  label: string;
  strengths: string;
  growthArea: string;
  insight: string;
  recommendation: string;
  aiPowered?: boolean;
  cached?: boolean;
  generatedAt?: string;
}

function QuestionCard({
  question,
  onSaveAnswer,
  onPrayTogether,
  onNextQuestion,
  userName,
  partnerName,
}: QuestionCardProps) {
  const tr = useUiCopy(questionsUiMessages);
  const { t } = useLanguage();
  const [myAnswers, setMyAnswers] = useState<Record<string, string | string[] | number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [canContinue, setCanContinue] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [aiCompatibility, setAiCompatibility] = useState<AICompatibility | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Derive read-only mode: question is saved and user has not clicked "Edit"
  const isReadOnly = saveStatus === 'saved' && !isEditing;

  // Update answers when question changes
  useEffect(() => {
    const raw = question.userAnswers || {};

    const normalizedByKey: Record<string, any> = {};
    Object.entries(raw).forEach(([key, val]: [string, any]) => {
      const actualValue = (val && typeof val === 'object' && 'response' in val) ? val.response : val;
      normalizedByKey[key] = actualValue;
    });

    const finalAnswers: Record<string, any> = {};
    Object.entries(normalizedByKey).forEach(([key, val]) => {
      const asIndex = parseInt(key, 10);
      if (!isNaN(asIndex) && question.prompts[asIndex]) {
        finalAnswers[question.prompts[asIndex].id] = val;
      } else {
        finalAnswers[key] = val;
      }
    });

    setMyAnswers(finalAnswers);
    const hasAnswers = Object.keys(finalAnswers).length > 0;
    setSaveStatus(hasAnswers ? 'saved' : 'idle');
    setCanContinue(hasAnswers);
    setIsEditing(false); // reset edit mode when question changes
  }, [question.id]);

  // Auto-save function with debouncing
  // Auto-save has been intentionally removed.
  // Answers are saved ONLY when the user explicitly clicks "Save Answer".
  // This function now only tracks whether all prompts have been answered
  // so the Save button can be enabled.
  const checkAllAnswered = (answers: Record<string, string | string[] | number>): boolean => {
    return question.prompts.every(prompt => {
      const answer = answers[prompt.id];
      if (Array.isArray(answer)) return answer.length > 0;
      return answer !== undefined && answer !== null && answer !== '';
    });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleAnswerChange = (promptId: string, value: string | string[] | number) => {
    const newAnswers = { ...myAnswers, [promptId]: value };
    setMyAnswers(newAnswers);
    // Update whether the Save button should be enabled — NO auto-save
    setCanContinue(checkAllAnswered(newAnswers));

    // Typing indicator only (no auto-save)
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000); // Wait 1 second after user stops typing
  };

  const handleSave = async () => {
    const allAnswered = question.prompts.every(prompt => {
      const answer = myAnswers[prompt.id];
      if (Array.isArray(answer)) return answer.length > 0;
      return answer !== undefined && answer !== null && answer !== '';
    });

    if (!allAnswered) {
      toast.error(tr("Please answer all prompts before saving"));
      return;
    }

    setIsSaving(true);
    try {
      await onSaveAnswer(question.id, myAnswers);
      setSaveStatus('saved');
      setCanContinue(true);
      setIsEditing(false);
      toast.success(tr("Answer saved successfully!"));
    } catch (error) {
      console.error('Failed to save answer:', error);
      toast.error(tr("Failed to save answer"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    const allAnswered = question.prompts.every(prompt => {
      const answer = myAnswers[prompt.id];
      if (Array.isArray(answer)) return answer.length > 0;
      return answer !== undefined && answer !== null && answer !== '';
    });

    if (!allAnswered) {
      toast.error(tr("Please answer all prompts before saving"));
      return;
    }

    setIsSaving(true);
    try {
      await onSaveAnswer(question.id, myAnswers);
      setSaveStatus('saved');
      setCanContinue(true);
      setIsEditing(false);
      toast.success(tr("Answer saved successfully!"));
      onNextQuestion();
    } catch (error) {
      console.error('Failed to save answer:', error);
      toast.error(tr("Failed to save answer"));
    } finally {
      setIsSaving(false);
    }
  };

  // Normalise a raw answers map: extract .response from objects and remap
  // numeric index keys ("0","1",...) to real prompt IDs.
  const normaliseAnswers = (raw: Record<string, any>): Record<string, string | string[] | number> => {
    const byKey: Record<string, any> = {};
    Object.entries(raw).forEach(([key, val]) => {
      byKey[key] = (val && typeof val === 'object' && 'response' in val) ? val.response : val;
    });
    const final: Record<string, any> = {};
    Object.entries(byKey).forEach(([key, val]) => {
      const idx = parseInt(key, 10);
      if (!isNaN(idx) && question.prompts[idx]) {
        final[question.prompts[idx].id] = val;
      } else {
        final[key] = val;
      }
    });
    return final;
  };

  const normalisedPartnerAnswers = normaliseAnswers(question.partnerAnswers || {});

  // Both answered: user must have saved AND partner must have at least one answer
  const userHasSaved   = saveStatus === 'saved';
  const partnerHasData = Object.keys(normalisedPartnerAnswers).some(k => {
    const v = normalisedPartnerAnswers[k];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== '';
  });
  const bothAnswered = userHasSaved && partnerHasData;

  // Simple numeric score (colour rings while AI loads)
  const matchPercentage = bothAnswered
    ? calculateMatchPercentage(question.prompts, myAnswers, normalisedPartnerAnswers)
    : 0;

  // Load or generate AI compatibility — runs once per question, result is stored permanently
  useEffect(() => {
    if (!bothAnswered || aiCompatibility) return;
    let cancelled = false;

    (async () => {
      setIsLoadingAI(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token || cancelled) return;

        const base = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee`;
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        // Step 1 — check if a permanent result already exists for this question
        const cached = await fetch(`${base}/ai/compatibility/${question.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!cancelled && cached.ok) {
          const cachedData = await cached.json();
          if (cachedData.result) {
            setAiCompatibility(cachedData.result);
            setIsLoadingAI(false);
            return;
          }
        }

        if (cancelled) return;

        // Step 2 — no saved result yet: generate with Gemini and save permanently
        const res = await fetch(`${base}/ai/compatibility`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            questionId: question.id,
            questionTitle: question.title,
            questionCategory: question.category,
            prompts: question.prompts,
            userAnswers: myAnswers,
            partnerAnswers: normalisedPartnerAnswers,
            userName,
            partnerName,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Compatibility analysis failed (${res.status})`);
        }
        if (!cancelled) setAiCompatibility(await res.json());
      } catch {
        if (!cancelled) {
          // Offline fallback — not saved, will retry next session
          setAiCompatibility({
            score: matchPercentage,
            label: matchPercentage >= 75 ? 'Strong Alignment' : matchPercentage >= 50 ? 'Growing Together' : 'Beautiful Differences',
            strengths: 'Both of you shared honest answers — a sign of trust and openness.',
            growthArea: 'Use your different perspectives as starting points for deeper conversation.',
            insight: 'Every question you both answer brings you closer in faith and understanding.',
            recommendation: 'Discuss your answers out loud together for 10 minutes this week.',
            aiPowered: false,
          });
        }
      } finally {
        if (!cancelled) setIsLoadingAI(false);
      }
    })();

    return () => { cancelled = true; };
  }, [bothAnswered, question.id]);

  // DEBUG: Log what we have
  console.log(`[QuestionCard] Rendering question ${question.id}:`, {
    hasUserAnswers: !!question.userAnswers,
    userAnswersCount: question.userAnswers ? Object.keys(question.userAnswers).length : 0,
    hasPartnerAnswers: !!question.partnerAnswers,
    partnerAnswersCount: question.partnerAnswers ? Object.keys(question.partnerAnswers).length : 0,
    bothAnswered,
    matchPercentage,
    userAnswers: question.userAnswers,
    partnerAnswers: question.partnerAnswers
  });

  const getMatchColor = (percentage: number): string => {
    if (percentage >= 80) return 'var(--success-700)';
    if (percentage >= 60) return 'var(--success-500)';
    if (percentage >= 40) return 'var(--warning-700)';
    if (percentage >= 20) return 'var(--warning-500)';
    return 'var(--error-500)';
  };

  const getMatchBg = (percentage: number): string => {
    if (percentage >= 80) return 'var(--success-50)';
    if (percentage >= 60) return 'var(--success-50)';
    if (percentage >= 40) return 'var(--warning-50)';
    if (percentage >= 20) return 'var(--warning-50)';
    return 'var(--error-50)';
  };

  const getMatchBorder = (percentage: number): string => {
    if (percentage >= 80) return 'var(--success-500)';
    if (percentage >= 60) return 'var(--success-500)';
    if (percentage >= 40) return 'var(--warning-500)';
    if (percentage >= 20) return 'var(--warning-500)';
    return 'var(--error-500)';
  };

  const getMatchMessage = (percentage: number) => {
    if (percentage >= 90) return tr("🎉 Perfect alignment! You think alike!");
    if (percentage >= 75) return tr("💚 Strong compatibility!");
    if (percentage >= 60) return tr("💛 Good match with room to grow!");
    if (percentage >= 40) return tr("🧡 Some differences to explore together!");
    if (percentage >= 20) return tr("💙 Diverse perspectives - great for growth!");
    return tr("💜 Very different views - embrace the journey!");
  };

  // Format a saved answer value for display
  const formatAnswerForDisplay = (value: string | string[] | number | undefined): string => {
    if (value === undefined || value === null || value === '') return '—';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  return (
    <Card className="overflow-hidden rounded-[2rem] border-primary-100/80 bg-white/90 shadow-[0_22px_70px_rgba(83,45,67,0.11)]">
      <CardHeader className="relative overflow-hidden border-b border-primary-100/70 bg-gradient-to-br from-primary-50 via-white to-secondary-50/70 p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-primary-200/25 blur-3xl" />
        <div className="flex items-start justify-between gap-4">
          <div className="relative flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className="tbo-caption rounded-full border border-primary-100 bg-white/70 px-3 py-1 capitalize text-primary-700 shadow-sm">
                {tr(getQuestionCategorySource(question.category))}
              </Badge>
              {/* Green "Done" badge — shown whenever this question has a saved answer */}
              {saveStatus === 'saved' && (
                <span
                  className="tbo-caption inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--success-50)',
                    color: 'var(--success-700)',

                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--success-500)',
                  }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>

                  {tr("Done")}
                </span>
              )}
            </div>
            <CardTitle className="tbo-card-title max-w-2xl text-foreground">
              {question.title}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrayTogether}
            aria-label={tr("Pray together about this question")}
            title={tr("Pray together")}
            className="tbo-action relative shrink-0 rounded-full border border-primary-100 bg-white/75 text-primary-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-50 hover:text-primary-700 hover:shadow-md motion-reduce:transform-none"
          >
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-4 sm:p-7">
        {/* Scripture */}
        <div
          className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50/90 to-orange-50/55 p-4 shadow-sm sm:p-5"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-200/25 blur-2xl" />
          <div className="flex items-start gap-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/75 text-amber-700 shadow-sm"><BookOpen className="h-5 w-5" /></span>
            <div className="relative">
              <p className="mb-2 italic leading-relaxed text-foreground">
                {question.verse}
              </p>
              <p className="tbo-caption text-amber-800">
                {question.verseReference}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* My Answers */}
        <div className="space-y-4">
          {/* Section header with status indicator */}
          <div className="flex items-center justify-between">
            <h4
              className="tbo-card-title flex items-center gap-2 text-foreground"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-50 text-secondary-600"><Users className="h-4.5 w-4.5" /></span>
              {userName ? tr("{name}'s Answers", { name: userName }) : t.questions.yourAnswer}
            </h4>
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1" style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)' }}>
                  <LoadingMark />
                  <span>{tr("Saving…")}</span>
                </div>
              )}
              {/* Edit toggle — shown when in read-only mode */}
              {isReadOnly && (
                <button
                  onClick={() => setIsEditing(true)}
                  type="button"
                  className="tbo-action flex min-h-9 items-center gap-1 rounded-full bg-primary-50 px-3 text-primary-700 transition-colors hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >

                  {tr("Edit")}
                </button>
              )}
            </div>
          </div>

          {/* READ-ONLY view: static answer display */}
          {isReadOnly ? (
            <Collapsible defaultOpen={false} className="rounded-2xl border border-emerald-100 bg-emerald-50/45">
              <CollapsibleTrigger className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 [&[data-state=open]_.answer-chevron]:rotate-180">
                <span>
                  <span className="tbo-label block text-emerald-900">{tr("Your saved answers")}</span>
                  <span className="tbo-caption mt-0.5 block text-emerald-800/70">{tr("Tap to review")} · {tr('{count} responses', { count: question.prompts.length })}</span>
                </span>
                <ChevronDown className="answer-chevron h-5 w-5 shrink-0 text-emerald-700 transition-transform duration-200" aria-hidden="true" />
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="space-y-4 border-t border-emerald-100 px-4 pb-4 pt-4">
                  {question.prompts.map((prompt) => (
                    <div key={prompt.id} className="space-y-1.5">
                      <p className="tbo-supporting text-foreground">{prompt.text}</p>
                      <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm">
                        <p className="tbo-supporting text-foreground">{formatAnswerForDisplay(myAnswers[prompt.id])}</p>
                      </div>
                    </div>
                  ))}
                  <Button onClick={onNextQuestion} className="tbo-action h-12 w-full rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-[0_10px_25px_rgba(190,68,112,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(190,68,112,0.28)] motion-reduce:transform-none">
                    <ChevronRight className="mr-2 h-4 w-4" />  {tr("Next Question")}
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            /* EDITABLE view: interactive prompts */
            <>
              {question.prompts.map((prompt) => (
                <DynamicQuestionPrompt
                  key={prompt.id}
                  prompt={prompt}
                  value={myAnswers[prompt.id] || null}
                  onChange={(value) => handleAnswerChange(prompt.id, value)}
                  disabled={false}
                />
              ))}

              {!canContinue && Object.keys(myAnswers).length > 0 && (
                <div className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-xs text-amber-900">
                  <span aria-hidden="true">💡</span><span>{tr("Answer all prompts above to unlock the Save button.")}</span>
                </div>
              )}

              <Button
                onClick={handleSaveAndContinue}
                disabled={isSaving || !canContinue}
                className="tbo-action h-12 w-full rounded-2xl transition-all enabled:bg-gradient-to-r enabled:from-primary-600 enabled:to-primary-700 enabled:text-white enabled:shadow-[0_10px_25px_rgba(190,68,112,0.22)] enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_14px_30px_rgba(190,68,112,0.28)] disabled:bg-neutral-100 disabled:text-muted-foreground motion-reduce:transform-none"
                style={{

                  cursor: (isSaving || !canContinue) ? 'not-allowed' : 'pointer',
                }}
              >
                {isSaving ? (
                  <>
                    <LoadingMark className="mr-2" />

                    {tr("Saving…")}
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 mr-2" />

                    {tr("Save Answer")}
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* ── Partner's Answer (3 states) ───────────────────────────────── */}
        <Separator />

        {bothAnswered ? (
          /* ✅ Both answered → reveal partner's response */
          <Collapsible defaultOpen={false} className="rounded-2xl border border-primary-200 bg-primary-50/55">
            <CollapsibleTrigger className="group flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 [&[data-state=open]_.partner-chevron]:rotate-180">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-primary-600 shadow-sm"><Heart className="h-5 w-5 fill-current" /></span>
                <span className="min-w-0">
                  <span className="tbo-label block break-words text-primary-800">{partnerName ? tr("{name}'s Answer", { name: partnerName }) : t.questions.partnersAnswer}</span>
                  <span className="tbo-caption mt-0.5 block text-primary-700/70">{tr("Ready to reveal")}</span>
                </span>
              </span>
              <ChevronDown className="partner-chevron h-5 w-5 shrink-0 text-primary-700 transition-transform duration-200" aria-hidden="true" />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="space-y-4 border-t border-primary-100 px-4 pb-4 pt-4">
                {question.prompts.map((prompt) => {
                  const answer = normalisedPartnerAnswers[prompt.id];
                  if (answer === undefined || answer === null || answer === '') return null;
                  const choiceSource = getQuestionChoiceSource(prompt.type, answer);
                  const displayValue = choiceSource ? tr(choiceSource) : Array.isArray(answer) ? answer.join(', ') : String(answer);
                  return (
                    <div key={prompt.id} className="space-y-1.5">
                      <p className="tbo-caption text-muted-foreground">{prompt.text}</p>
                      <div className="rounded-2xl border border-primary-100 bg-white/85 px-4 py-3 shadow-sm">
                        <p className="tbo-supporting text-foreground">{displayValue}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

        ) : userHasSaved ? (
          /* ⏳ You answered, partner hasn't yet → waiting state */
          <div
            className="text-center py-6"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
          >
            <Heart className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--neutral-300)' }} />
            <p className="tbo-body" style={{ color: 'var(--muted-foreground)',  margin: 0,  }}>
              {tr('Waiting for {name} to answer…', { name: partnerName || tr('your partner') })}
            </p>
            <p className="tbo-supporting" style={{  color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>

              {tr("Their response will be revealed once they submit 💕")}
            </p>
          </div>

        ) : (
          /* 🔒 You haven't answered yet → partner's answer stays hidden */
          <div
            className="text-center py-6"
            style={{
              background: 'var(--muted)',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              className="mx-auto mb-3 flex items-center justify-center"
              style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'var(--neutral-200)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--neutral-500)' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p className="tbo-body" style={{ color: 'var(--muted-foreground)',  margin: 0,  }}>
              {tr("{name}'s answer is hidden", { name: partnerName || tr('Your partner') })}
            </p>
            <p className="tbo-supporting" style={{  color: 'var(--muted-foreground)', marginTop: 'var(--spacing-1)' }}>

              {tr("Save your answer first — then both responses are revealed together 🔓")}
            </p>
          </div>
        )}

        {/* AI-Powered Compatibility Match */}
        {bothAnswered && (
          <Collapsible defaultOpen={false} className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-primary-50/60">
            <CollapsibleTrigger className="group flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-violet-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 [&[data-state=open]_.compatibility-chevron]:rotate-180">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-violet-600 shadow-sm"><Sparkles className={`h-5 w-5 ${isLoadingAI ? 'animate-pulse' : ''}`} /></span>
                <span className="min-w-0">
                  <span className="tbo-label flex items-center gap-2 text-violet-950">{tr("Compatibility Match")} <span className="tbo-eyebrow rounded-full bg-white/80 px-2 py-0.5 text-violet-700">AI</span></span>
                  <span className="tbo-caption mt-0.5 block break-words text-violet-800/70">{isLoadingAI ? tr("Analysing your answers…") : aiCompatibility ? tr('{label} · Tap for insight', { label: tr(aiCompatibility.label) }) : tr("Tap to view your insight")}</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {aiCompatibility && <span className="text-lg font-bold" style={{ color: getMatchColor(aiCompatibility.score) }}>{aiCompatibility.score}%</span>}
                <ChevronDown className="compatibility-chevron h-5 w-5 text-violet-700 transition-transform duration-200" aria-hidden="true" />
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="border-t border-violet-100 p-4 sm:p-5">

            {/* Loading skeleton */}
            {isLoadingAI && (
              <div
                style={{
                  padding: 'var(--spacing-6)',
                  background: 'var(--primary-50)',
                  border: '2px solid var(--primary-200)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <BrandLoader label={tr('AI is analysing your answers…')} />
              </div>
            )}

            {/* AI result */}
            {!isLoadingAI && aiCompatibility && (
              <div
                style={{
                  padding: 'var(--spacing-6)',
                  background: getMatchBg(aiCompatibility.score),
                  border: `2px solid ${getMatchBorder(aiCompatibility.score)}`,
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-4)',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <Heart className="w-5 h-5" style={{ color: 'var(--primary-500)' }} />
                    <span className="tbo-body" style={{  color: 'var(--foreground)',  }}>

                      {tr("Compatibility Match")}
                    </span>
                    {aiCompatibility.aiPowered !== false && (
                      <span className="tbo-caption"
                        style={{

                          color: 'var(--primary-600)',
                          background: 'var(--primary-100)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Sparkles style={{ width: 10, height: 10 }} />
                        {aiCompatibility.cached ? tr("AI · Saved") : 'AI'}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--text-display)', fontWeight: 'var(--font-weight-bold)', color: getMatchColor(aiCompatibility.score), lineHeight: 1 }}>
                      {aiCompatibility.score}%
                    </div>
                    <div className="tbo-caption" style={{  color: getMatchColor(aiCompatibility.score),  }}>
                      {tr(aiCompatibility.label)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${aiCompatibility.score}%`,
                      height: '100%',
                      background: getMatchColor(aiCompatibility.score),
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.8s ease',
                    }}
                  />
                </div>

                {/* AI Insight */}
                <div
                  style={{
                    background: 'var(--card)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-4)',
                    borderLeft: `4px solid ${getMatchBorder(aiCompatibility.score)}`,
                  }}
                >
                  <p className="tbo-supporting" style={{  color: 'var(--foreground)', fontStyle: 'italic', margin: 0 }}>
                    💡 {tr(aiCompatibility.insight)}
                  </p>
                </div>

                {/* Strengths & Growth */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                  <div style={{ background: 'var(--success-50)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)' }}>
                    <p className="tbo-caption" style={{   color: 'var(--success-700)', margin: '0 0 4px 0' }}>

                      {tr("✅ Strengths")}
                    </p>
                    <p className="tbo-supporting" style={{  color: 'var(--foreground)', margin: 0,  }}>
                      {tr(aiCompatibility.strengths)}
                    </p>
                  </div>
                  <div style={{ background: 'var(--warning-50)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-3)' }}>
                    <p className="tbo-caption" style={{   color: 'var(--warning-700)', margin: '0 0 4px 0' }}>

                      {tr("🌱 Grow Together")}
                    </p>
                    <p className="tbo-supporting" style={{  color: 'var(--foreground)', margin: 0,  }}>
                      {tr(aiCompatibility.growthArea)}
                    </p>
                  </div>
                </div>

                {/* Weekly Recommendation */}
                <div
                  style={{
                    background: 'var(--primary-50)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-3)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--spacing-2)',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📅</span>
                  <div>
                    <p className="tbo-caption" style={{   color: 'var(--primary-700)', margin: '0 0 2px 0' }}>

                      {tr("This Week's Recommendation")}
                    </p>
                    <p className="tbo-supporting" style={{  color: 'var(--foreground)', margin: 0,  }}>
                      {tr(aiCompatibility.recommendation)}
                    </p>
                  </div>
                </div>
              </div>
            )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
