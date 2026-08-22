import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { sendNotification } from '../utils/notifications';
import { QuestionChatDialog } from './QuestionChatDialog';
import { QAResultsView } from './QAResultsView';
import { DiscussionThread } from './DiscussionThread';
import { 
  BookOpen, 
  Heart, 
  Send, 
  Lock,
  Unlock,
  MessageCircle,
  Sparkles,
  Quote,
  ArrowLeft,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Calendar,
  Check,
  MessageSquare,
  X
} from 'lucide-react';

interface Question {
  id: string;
  category: string;
  verse: string;
  verseReference: string;
  prompts: string[];
  date?: string;
  title?: string;
}

interface DailyQuestionProps {
  accessToken: string;
  projectId: string;
  userProfile: any;
  partner: any;
  onPrayTogether?: () => void;
  onBack?: () => void;
}

interface Answer {
  id: string;
  userId: string;
  questionId: string;
  response: string;
  isPrivate: boolean;
  createdAt: string;
}

export function DailyQuestion({
  accessToken,
  projectId,
  userProfile,
  partner,
  onPrayTogether,
  onBack
}: DailyQuestionProps) {
  const { t } = useLanguage();
  const [question, setQuestion] = useState<Question | null>(null);
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [promptIndex: number]: string }>({});
  const [isPrivate, setIsPrivate] = useState<{ [promptIndex: number]: boolean }>({});
  // allQuestions keeps the complete unfiltered list so category lookups always work
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  // allUserAnswers stores every saved response so isCategoryAnswered/Complete work across questions
  const [allUserAnswers, setAllUserAnswers] = useState<Answer[]>([]);
  const [partnerAnswers, setPartnerAnswers] = useState<Answer[]>([]);
  const [userSubmittedAnswers, setUserSubmittedAnswers] = useState<Answer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'results' | 'discuss'>('results');
  const [selectedPromptForChat, setSelectedPromptForChat] = useState(0);

  useEffect(() => {
    // Load question from backend instead of hardcoded data
    loadQuestion();
    loadAnswers();
  }, []);

  const loadQuestion = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/questions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const { questions: fetchedQuestions } = await response.json();
        if (fetchedQuestions && fetchedQuestions.length > 0) {
          // Keep the complete list in allQuestions — never overwrite this
          setAllQuestions(fetchedQuestions);
          // Get today's question based on day of year
          const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
          const questionIndex = dayOfYear % fetchedQuestions.length;
          setQuestion(fetchedQuestions[questionIndex]);
          setAvailableQuestions(fetchedQuestions);
        }
      }
    } catch (error) {
      console.error('Error loading question:', error);
    }
  };

  const getTodaysQuestion = () => {
    // Deprecated - now loads from backend
    return null;
  };

  const getQuestionsByCategory = (category: string): Question[] => {
    // Always search the full list so category lookups work even after filtering availableQuestions
    return allQuestions.filter(q => q.category === category);
  };

  const getCategories = (): string[] => {
    return [...new Set(allQuestions.map(q => q.category))];
  };

  useEffect(() => {
    // Reload answers whenever the question changes
    if (question) {
      loadAnswers(question);
    }
  }, [question?.id]);

  const handleCategorySelect = (category: string) => {
    const categoryQuestions = getQuestionsByCategory(category);
    // Only update the browseable list, never overwrite allQuestions
    setAvailableQuestions(categoryQuestions);
    setSelectedCategory(category);
    setSelectedQuestionIndex(0);
    const firstQuestion = categoryQuestions[0] ?? null;
    setQuestion(firstQuestion);
    setActivePromptIndex(0);
    setShowCategorySelection(false);
    // Pass the new question explicitly so loadAnswers doesn't read stale state
    loadAnswers(firstQuestion);
  };

  const handleQuestionChange = (direction: 'prev' | 'next') => {
    if (!availableQuestions.length) return;

    const newIndex = direction === 'next'
      ? Math.min(availableQuestions.length - 1, selectedQuestionIndex + 1)
      : Math.max(0, selectedQuestionIndex - 1);

    const newQuestion = availableQuestions[newIndex];
    setSelectedQuestionIndex(newIndex);
    setQuestion(newQuestion);
    setActivePromptIndex(0);
    loadAnswers(newQuestion);
  };

  const loadAnswers = async (currentQuestion?: Question | null) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/question-responses`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch question responses (status:', response.status, ')');
        return;
      }

      const data = await response.json();
      const allResponses: Answer[] = data.userResponses || [];

      // Store every response so category completion checks always have full data
      setAllUserAnswers(allResponses);

      // Filter to just the current question's answers for the detail view
      const activeQuestion = currentQuestion ?? question;
      if (activeQuestion) {
        const userAnswers = allResponses.filter(
          (r: Answer) => r.questionId.startsWith(activeQuestion.id)
        );
        setUserSubmittedAnswers(userAnswers);
      }

      setPartnerAnswers(data.partnerResponses || []);
    } catch (error) {
      console.error('Error loading answers:', error);
    }
  };

  const handleSubmitAnswer = async (promptIndex: number) => {
    if (!question || !answers[promptIndex]?.trim()) {
      toast.error('Please write an answer first');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/question-responses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            question_id: `${question.id}:prompt:${promptIndex}`,
            response: answers[promptIndex],
            is_private: isPrivate[promptIndex] || false
          })
        }
      );

      if (!response.ok) throw new Error('Failed to submit answer');

      // Send notification to partner if answer is shared
      if (partner && !isPrivate[promptIndex]) {
        try {
          await sendNotification({
            recipientId: partner.id,
            title: '💬 New Answer from Your Partner!',
            message: `${userProfile.name} answered a question in ${question.category}`,
            type: 'question_answered',
            projectId,
            accessToken
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Don't block the main flow if notification fails
        }
      }

      toast.success(
        isPrivate[promptIndex] 
          ? '✨ Answer saved privately' 
          : '💕 Answer shared with your partner!'
      );
      
      // Clear the answer
      setAnswers(prev => ({ ...prev, [promptIndex]: '' }));
      await loadAnswers(question);

      // Move to next prompt if available
      if (promptIndex < question.prompts.length - 1) {
        setActivePromptIndex(promptIndex + 1);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // New function for QAResultsView to submit answers with custom response and privacy
  const handleSubmitAnswerFromResults = async (promptIndex: number, responseText: string, isPrivateAnswer: boolean) => {
    if (!question || !responseText?.trim()) {
      toast.error('Please write an answer first');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/question-responses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            question_id: `${question.id}:prompt:${promptIndex}`,
            response: responseText,
            is_private: isPrivateAnswer
          })
        }
      );

      if (!response.ok) throw new Error('Failed to submit answer');

      // Send notification to partner if answer is shared
      if (partner && !isPrivateAnswer) {
        try {
          await sendNotification({
            recipientId: partner.id,
            title: '💬 New Reply from Your Partner!',
            message: `${userProfile.name} replied to a question in ${question.category}`,
            type: 'question_answered',
            projectId,
            accessToken
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      }

      toast.success(
        isPrivateAnswer 
          ? '✨ Answer saved privately' 
          : '💕 Reply sent to your partner!'
      );
      
      // Reload answers to show the new reply
      await loadAnswers(question);
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAnswerForPrompt = (promptIndex: number, isPartner: boolean): Answer | undefined => {
    if (!question) return undefined;
    const answersArray = isPartner ? partnerAnswers : userSubmittedAnswers;
    return answersArray.find(
      a => a.questionId === `${question.id}:prompt:${promptIndex}`
    );
  };

  const isPromptAnswered = (promptIndex: number): boolean => {
    return !!getAnswerForPrompt(promptIndex, false);
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Daily Life & Habits': 'from-sky-500 to-sky-600',
      'Intimacy & Lifestyle': 'from-primary-500 to-primary-500',
      'Love & Balance': 'from-primary-500 to-primary-600',
      'Dream Wedding / Dream Home': 'from-warning-500 to-warning-500',
      'Travel & Adventure': 'from-success-500 to-success-700',
      'Relationship Boundaries': 'from-error-500 to-primary-500',
      'Trust & Truth': 'from-sky-500 to-primary-500',
      'Kids & Future': 'from-sky-500 to-sky-500',
      'Finance & Goals': 'from-success-500 to-sky-500',
      'Family Relations': 'from-warning-500 to-warning-500',
      'Bible Convictions': 'from-primary-500 to-primary-500'
    };
    return colors[category] || 'from-neutral-500 to-neutral-500';
  };

  if (!question) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const activePrompt = question.prompts[activePromptIndex];
  const userAnswer = getAnswerForPrompt(activePromptIndex, false);
  const partnerAnswer = getAnswerForPrompt(activePromptIndex, true);
  const categories = getCategories();

  // Helper function to check if a category has any answered questions
  const isCategoryAnswered = (category: string): boolean => {
    const categoryQuestions = getQuestionsByCategory(category);
    if (categoryQuestions.length === 0) return false;
    return categoryQuestions.some(q =>
      allUserAnswers.some(a => a.questionId.startsWith(q.id))
    );
  };

  // Helper function to check if a category is fully complete (all prompts answered)
  const isCategoryComplete = (category: string): boolean => {
    const categoryQuestions = getQuestionsByCategory(category);
    if (categoryQuestions.length === 0) return false;

    for (const q of categoryQuestions) {
      for (let i = 0; i < q.prompts.length; i++) {
        const hasAnswer = allUserAnswers.some(
          a => a.questionId === `${q.id}:prompt:${i}`
        );
        if (!hasAnswer) return false;
      }
    }
    return true;
  };

  // Category Selection Screen
  if (showCategorySelection) {
    return (
      <div className="h-full flex flex-col">
        <ScrollArea className="flex-1">
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowCategorySelection(false)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-neutral-200 transition-all group"
              >
                <ArrowLeft className="w-4 h-4 text-foreground group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <h2 className="text-xl font-semibold text-foreground">{t.questions.selectCategory}</h2>
              <div className="w-9" /> {/* Spacer */}
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => {
                const categoryQuestions = getQuestionsByCategory(category);
                const totalQuestions = categoryQuestions.reduce((sum, q) => sum + q.prompts.length, 0);
                const isAnswered = isCategoryAnswered(category);
                const isComplete = isCategoryComplete(category);
                
                return (
                  <Card
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-2 relative ${
                      selectedCategory === category 
                        ? 'border-primary-500 shadow-md' 
                        : 'border-border'
                    }`}
                  >
                    {isComplete && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-success-500 text-white px-3 py-1.5 rounded-full shadow-md">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-semibold">Complete</span>
                      </div>
                    )}
                    {!isComplete && isAnswered && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-sky-500 text-white px-3 py-1.5 rounded-full shadow-md">
                        <Circle className="w-4 h-4 fill-current" />
                        <span className="text-xs font-semibold">In Progress</span>
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getCategoryColor(category)} flex items-center justify-center shadow-md`}>
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{category}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {categoryQuestions.length} question sets • {totalQuestions} prompts
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-primary-50 via-primary-50 to-primary-50">
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Header with Title and Back */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">{question.category}</h1>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-card hover:bg-muted transition-all shadow-sm group"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('results')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                viewMode === 'results'
                  ? `bg-gradient-to-r ${getCategoryColor(question.category)} text-white shadow-md`
                  : 'bg-card text-muted-foreground hover:bg-muted border border-border'
              }`}
            >
              {t.questions.viewResponses}
            </button>
            <button
              onClick={() => setViewMode('discuss')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                viewMode === 'discuss'
                  ? `bg-gradient-to-r ${getCategoryColor(question.category)} text-white shadow-md`
                  : 'bg-card text-muted-foreground hover:bg-muted border border-border'
              }`}
            >
              {t.questions.discuss}
            </button>
            <button
              onClick={() => setShowCategorySelection(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-card text-muted-foreground hover:bg-muted border border-border transition-all"
            >
              <Grid3x3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.questions.selectCategory}</span>
            </button>
          </div>

          {/* Content based on view mode */}
          {viewMode === 'results' ? (
            <QAResultsView
              question={question}
              userProfile={userProfile}
              partner={partner}
              userAnswers={userSubmittedAnswers}
              partnerAnswers={partnerAnswers}
              onDiscuss={() => {
                // Open discussion about the category/question in general (not a specific prompt)
                setSelectedPromptForChat(0);
                setIsChatOpen(true);
              }}
              onSubmitAnswer={handleSubmitAnswerFromResults}
              isSubmitting={isSubmitting}
              projectId={projectId}
              accessToken={accessToken}
            />
          ) : (
            /* Discuss Mode - Answer Questions */
            <div className="space-y-6">
              {/* Embedded Discussion Thread */}
              <DiscussionThread
                questionId={`${question.id}:prompt:${activePromptIndex}`}
                question={question}
                promptIndex={activePromptIndex}
                accessToken={accessToken}
                projectId={projectId}
                currentUserId={userProfile.id}
                currentUserName={userProfile.name}
                partner={partner}
              />

              {/* Pray Together Card */}
              {onPrayTogether && (
                <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100">
                  <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{t.prayer.prayTogether}</h4>
                        <p className="text-sm text-muted-foreground">Take a moment to pray about your answers</p>
                      </div>
                    </div>
                    <Button
                      onClick={onPrayTogether}
                      className="bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:opacity-90 shadow-md"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      {t.prayer.prayTogether}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Question Chat Dialog */}
      {question && (
        <QuestionChatDialog
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          question={question}
          promptIndex={selectedPromptForChat}
          accessToken={accessToken}
          projectId={projectId}
          currentUserId={userProfile.id}
          currentUserName={userProfile.name}
          partner={partner}
        />
      )}
    </div>
  );
}