import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  ChevronLeft, 
  MessageSquare, 
  Heart, 
  Send, 
  Loader2, 
  BookOpen,
  Sparkles,
  Users,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { DynamicQuestionPrompt } from './DynamicQuestionPrompt';

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
}

interface QADiscussionHubProps {
  onSaveAnswer: (questionId: string, answers: Record<string, string | string[] | number>) => void;
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
  const [activeCategory, setActiveCategory] = useState(selectedCategory || 'all');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Update active category when selectedCategory prop changes
  useEffect(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
      setCurrentQuestionIndex(0);
    }
  }, [selectedCategory]);

  const categories = [
    { id: 'all', label: 'All Questions', icon: '💬' },
    { id: 'daily-life', label: 'Daily Life & Habits', icon: '☀️' },
    { id: 'intimacy', label: 'Intimacy & Lifestyle', icon: '💕' },
    { id: 'love-balance', label: 'Love & Balance', icon: '⚖️' },
    { id: 'dream-wedding', label: 'Dream Wedding / Dream Home', icon: '💒' },
    { id: 'travel', label: 'Travel & Adventure', icon: '✈️' },
    { id: 'boundaries', label: 'Relationship Boundaries', icon: '🛡️' },
    { id: 'trust', label: 'Trust & Truth', icon: '🤝' },
    { id: 'kids-future', label: 'Kids & Future', icon: '👶' },
    { id: 'finance', label: 'Finance & Goals', icon: '💰' },
    { id: 'family', label: 'Family Relations', icon: '👨‍👩‍👧‍👦' },
    { id: 'bible', label: 'Bible Convictions', icon: '📖' },
  ];

  useEffect(() => {
    loadQuestions();
  }, [activeCategory]);

  const loadQuestions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || publicAnonKey;
      
      const categoryParam = activeCategory === 'all' ? '' : `?category=${activeCategory}`;
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/questions${categoryParam}`;
      
      console.log('Fetching questions from:', url);
      console.log('Category filter:', activeCategory);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const { questions: fetchedQuestions } = await response.json();
        console.log('Fetched questions:', fetchedQuestions);
        
        // Convert prompts array to match the component's expected format
        const convertedQuestions = (fetchedQuestions || []).map((q: any) => ({
          ...q,
          prompts: q.prompts?.map((p: any) => ({
            id: p.id,
            text: p.text || p,
            type: p.type || 'text',
            options: p.options || [],
            scaleMax: p.scaleMax || 5
          })) || []
        }));
        
        // Fetch responses for each question
        const questionsWithResponses = await Promise.all(
          convertedQuestions.map(async (q: Question) => {
            try {
              const respResponse = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/questions/${q.id}/responses`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }
              );
              
              if (respResponse.ok) {
                const { userResponse, partnerResponse } = await respResponse.json();
                console.log(`[Q&A] Question ${q.id} responses:`, {
                  userResponse,
                  partnerResponse,
                  userAnswers: userResponse?.answers,
                  partnerAnswers: partnerResponse?.answers
                });
                return {
                  ...q,
                  userAnswers: userResponse?.answers || {},
                  partnerAnswers: partnerResponse?.answers || {}
                };
              } else {
                console.error(`Failed to fetch responses for question ${q.id}, status:`, respResponse.status);
              }
            } catch (error) {
              console.error(`Failed to fetch responses for question ${q.id}:`, error);
            }
            return q;
          })
        );
        
        console.log('Questions with responses:', questionsWithResponses);
        setQuestions(questionsWithResponses);
      } else {
        const error = await response.json();
        console.error('Failed to load questions:', error);
        toast.error('Failed to load questions');
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
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
      console.log('Saving answer for question:', questionId, answers);
      
      // Call the parent save handler (saves to backend)
      await onSaveAnswer(questionId, answers);
      
      // Update the questions array to reflect the saved answer
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { ...q, userAnswers: answers }
          : q
      ));
      
      console.log('Answer saved successfully');
    } catch (error) {
      console.error('Failed to save answer:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2 relative">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="absolute left-0"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <MessageSquare className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl">Q&A Discussion Hub</h1>
        </div>
        {selectedCategory && selectedCategory !== 'all' && (
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {categories.find(c => c.id === selectedCategory)?.icon} {categories.find(c => c.id === selectedCategory)?.label}
            </Badge>
          </div>
        )}
        <p className="text-gray-600">Meaningful conversations for growing together</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold text-purple-600">{questions.length}</p>
          <p className="text-xs text-gray-600 mt-1">Total Questions</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold text-green-600">
            {questions.filter(q => q.userAnswers && Object.keys(q.userAnswers).length > 0).length}
          </p>
          <p className="text-xs text-gray-600 mt-1">Answered</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold text-rose-600">
            {questions.filter(q => q.userAnswers && Object.keys(q.userAnswers).length > 0 && q.partnerAnswers && Object.keys(q.partnerAnswers).length > 0).length}
          </p>
          <p className="text-xs text-gray-600 mt-1">Discussed</p>
        </Card>
      </div>

      {/* AI Assistant Button */}
      <Button
        onClick={() => setShowAIAssistant(!showAIAssistant)}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        size="lg"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        AI Assistant
      </Button>

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <AIAssistant
          questions={questions}
          onClose={() => setShowAIAssistant(false)}
        />
      )}

      {/* Categories */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Categories</h3>
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setActiveCategory(category.id);
                  setCurrentQuestionIndex(0);
                }}
                className="whitespace-nowrap"
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading questions...</p>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && filteredQuestions.length === 0 && (
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Questions Yet</h3>
          <p className="text-gray-600 mb-4">
            {activeCategory === 'all' 
              ? 'No questions have been created yet. Check back later!' 
              : 'No questions in this category yet.'}
          </p>
          {activeCategory !== 'all' && (
            <Button
              variant="outline"
              onClick={() => {
                setActiveCategory('all');
                setCurrentQuestionIndex(0);
              }}
            >
              View All Categories
            </Button>
          )}
        </Card>
      )}

      {/* Question Carousel */}
      {!isLoading && filteredQuestions.length > 0 && (
        <div className="space-y-4">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="text-sm text-gray-600">
              {currentQuestionIndex + 1} / {filteredQuestions.length}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            onSaveAnswer={(questionId, answers) => handleSaveAnswer(questionId, answers)}
            onPrayTogether={() => onPrayTogether(currentQuestion)}
            onNextQuestion={handleNext}
            userName={userName}
            partnerName={partnerName}
          />
        </div>
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

function QuestionCard({
  question,
  onSaveAnswer,
  onPrayTogether,
  onNextQuestion,
  userName,
  partnerName,
}: QuestionCardProps) {
  const [myAnswers, setMyAnswers] = useState<Record<string, string | string[] | number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [canContinue, setCanContinue] = useState(false); // New: track if user can continue
  const [isTyping, setIsTyping] = useState(false); // New: track if user is typing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update answers when question changes
  useEffect(() => {
    console.log('Question changed:', question.id);
    console.log('Loaded userAnswers:', question.userAnswers);
    const loadedAnswers = question.userAnswers || {};
    setMyAnswers(loadedAnswers);
    const hasAnswers = Object.keys(loadedAnswers).length > 0;
    setSaveStatus(hasAnswers ? 'saved' : 'idle');
    setCanContinue(hasAnswers); // Can continue if already answered
  }, [question.id]);

  // Auto-save function with debouncing
  const autoSave = async (answers: Record<string, string | string[] | number>) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Check if all prompts are answered
    const allAnswered = question.prompts.every(prompt => {
      const answer = answers[prompt.id];
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      return answer !== undefined && answer !== null && answer !== '';
    });

    if (!allAnswered) {
      setSaveStatus('idle');
      setCanContinue(false);
      return;
    }

    setSaveStatus('saving');
    setIsTyping(false); // User finished typing

    // Debounce: wait 1000ms (1 second) after user stops typing before saving
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Auto-saving answers after typing completed:', answers);
        await onSaveAnswer(question.id, answers);
        setSaveStatus('saved');
        setCanContinue(true); // Enable continue button after successful save
        toast.success('Your answers have been saved!');
      } catch (error) {
        console.error('Failed to auto-save:', error);
        setSaveStatus('idle');
        setCanContinue(false);
        toast.error('Failed to save answer');
      }
    }, 1000); // Wait 1 second after user stops typing
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
    autoSave(newAnswers);
    setIsTyping(true); // User is typing

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false); // User finished typing
    }, 1000); // Wait 1 second after user stops typing
  };

  const handleSave = async () => {
    // Validate all prompts are answered
    const allAnswered = question.prompts.every(prompt => {
      const answer = myAnswers[prompt.id];
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      return answer !== undefined && answer !== null && answer !== '';
    });

    if (!allAnswered) {
      toast.error('Please answer all prompts before saving');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveAnswer(question.id, myAnswers);
      toast.success('Answer saved successfully!');
      // Don't clear answers after saving - keep them visible
      // Don't navigate away automatically
    } catch (error) {
      console.error('Failed to save answer:', error);
      toast.error('Failed to save answer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    // Validate all prompts are answered
    const allAnswered = question.prompts.every(prompt => {
      const answer = myAnswers[prompt.id];
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      return answer !== undefined && answer !== null && answer !== '';
    });

    if (!allAnswered) {
      toast.error('Please answer all prompts before saving');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveAnswer(question.id, myAnswers);
      toast.success('Answer saved successfully!')
      // Navigate to next question
      onNextQuestion();
    } catch (error) {
      console.error('Failed to save answer:', error);
      toast.error('Failed to save answer');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate match percentage if both have answered
  const bothAnswered = question.userAnswers && Object.keys(question.userAnswers).length > 0 && 
                       question.partnerAnswers && Object.keys(question.partnerAnswers).length > 0;
  const matchPercentage = bothAnswered 
    ? calculateMatchPercentage(question.prompts, question.userAnswers!, question.partnerAnswers!)
    : 0;

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

  // Get match color based on percentage
  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-lime-600';
    if (percentage >= 40) return 'text-yellow-600';
    if (percentage >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getMatchBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 border-green-300';
    if (percentage >= 60) return 'bg-lime-100 border-lime-300';
    if (percentage >= 40) return 'bg-yellow-100 border-yellow-300';
    if (percentage >= 20) return 'bg-orange-100 border-orange-300';
    return 'bg-red-100 border-red-300';
  };

  const getMatchMessage = (percentage: number) => {
    if (percentage >= 90) return '🎉 Perfect alignment! You think alike!';
    if (percentage >= 75) return '💚 Strong compatibility!';
    if (percentage >= 60) return '💛 Good match with room to grow!';
    if (percentage >= 40) return '🧡 Some differences to explore together!';
    if (percentage >= 20) return '💙 Diverse perspectives - great for growth!';
    return '💜 Very different views - embrace the journey!';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Badge variant="secondary" className="mb-2">
              {question.category}
            </Badge>
            <CardTitle className="text-2xl mb-2">{question.title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrayTogether}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Scripture */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-gray-900 italic mb-2 text-base leading-relaxed">{question.verse}</p>
              <p className="text-sm text-gray-700 font-semibold">{question.verseReference}</p>
            </div>
          </div>
        </div>

        {/* Discussion Prompts */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Discussion Prompts
          </h4>
          <ul className="space-y-4">
            {question.prompts.map((prompt, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-purple-600 mt-1 text-lg">•</span>
                <span className="text-xl leading-relaxed font-bold text-gray-900">{prompt.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* My Answers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {userName ? `${userName}'s Answers` : 'Your Answers'}
            </h4>
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Saved</span>
              </div>
            )}
          </div>
          {question.prompts.map((prompt) => {
            // Check if this prompt has been answered
            const isAnswered = myAnswers[prompt.id] !== undefined && myAnswers[prompt.id] !== null && myAnswers[prompt.id] !== '';
            const isDisabled = false; // Never disable - allow editing
            
            return (
              <DynamicQuestionPrompt
                key={prompt.id}
                prompt={prompt}
                value={myAnswers[prompt.id] || null}
                onChange={(value) => handleAnswerChange(prompt.id, value)}
                disabled={isDisabled}
              />
            );
          })}
          
          {/* Status Message */}
          {!canContinue && saveStatus === 'idle' && Object.keys(myAnswers).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              💡 Please answer all prompts to continue
            </div>
          )}
          
          {isTyping && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Waiting for you to finish typing...</span>
            </div>
          )}
          
          {saveStatus === 'saving' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving your answers...</span>
            </div>
          )}
          
          {canContinue && saveStatus === 'saved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Your answers have been saved! Click below to continue.</span>
            </div>
          )}
          
          <Button
            onClick={handleSaveAndContinue}
            disabled={isSaving || !canContinue}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4 mr-2" />
                Continue to Next Question
              </>
            )}
          </Button>
        </div>

        {/* Partner's Answers */}
        {question.partnerAnswers && Object.keys(question.partnerAnswers).length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                {partnerName ? `${partnerName}'s Answers` : "Partner's Answers"}
              </h4>
              {question.prompts.map((prompt) => {
                const answer = question.partnerAnswers?.[prompt.id];
                if (!answer) return null;
                
                return (
                  <div key={prompt.id} className="space-y-2">
                    <p className="text-lg font-bold text-gray-900 leading-snug">{prompt.text}</p>
                    <div className="bg-rose-50 p-4 rounded-lg border-l-4 border-rose-400">
                      <p className="text-gray-900 font-medium leading-relaxed text-base">
                        {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Partner hasn't answered yet */}
        {question.userAnswers && Object.keys(question.userAnswers).length > 0 && 
         (!question.partnerAnswers || Object.keys(question.partnerAnswers).length === 0) && (
          <>
            <Separator />
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">
                {partnerName ? `${partnerName} hasn't` : "Your partner hasn't"} answered this question yet
              </p>
              <p className="text-sm text-gray-500">
                You'll see the match percentage once you both answer! 💕
              </p>
            </div>
          </>
        )}

        {/* Match Percentage */}
        {bothAnswered && (
          <>
            <Separator />
            <div className={`${getMatchBgColor(matchPercentage)} border-2 rounded-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-600" />
                  Compatibility Match
                </h4>
                <div className={`text-4xl ${getMatchColor(matchPercentage)}`}>
                  {matchPercentage}%
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/50 rounded-full h-3 mb-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${matchPercentage >= 80 ? 'bg-green-600' : matchPercentage >= 60 ? 'bg-lime-600' : matchPercentage >= 40 ? 'bg-yellow-600' : matchPercentage >= 20 ? 'bg-orange-600' : 'bg-red-600'}`}
                  style={{ width: `${matchPercentage}%` }}
                />
              </div>
              
              <p className={`text-center ${getMatchColor(matchPercentage)}`}>
                {getMatchMessage(matchPercentage)}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// AI Assistant Component
interface AIAssistantProps {
  questions: Question[];
  onClose: () => void;
}

function AIAssistant({ questions, onClose }: AIAssistantProps) {
  const answeredQuestions = questions.filter(q => q.userAnswers && Object.keys(q.userAnswers).length > 0);
  const bothAnswered = questions.filter(q => q.userAnswers && Object.keys(q.userAnswers).length > 0 && q.partnerAnswers && Object.keys(q.partnerAnswers).length > 0);

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <CardTitle>AI Insights</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <h4 className="font-semibold">Your Progress</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Questions Answered:</span>
              <span className="font-semibold">{answeredQuestions.length} / {questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discussed Together:</span>
              <span className="font-semibold">{bothAnswered.length}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="bg-purple-50 p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-purple-900">💡 AI Suggestion</h4>
          <p className="text-sm text-purple-800">
            {bothAnswered.length === 0 
              ? "Start by answering questions in categories that interest you most. Your partner can see and respond to your answers!"
              : bothAnswered.length < 5
              ? "Great start! Try exploring different categories to discover new conversation topics together."
              : "Excellent progress! Consider revisiting your earlier discussions to see how your thoughts have evolved."}
          </p>
        </div>

        {answeredQuestions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold">Most Active Categories</h4>
              <div className="space-y-1 text-sm">
                {Array.from(new Set(answeredQuestions.map(q => q.category)))
                  .slice(0, 3)
                  .map(category => (
                    <div key={category} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-600" />
                      <span className="text-gray-700 capitalize">{category.replace(/-/g, ' ')}</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}