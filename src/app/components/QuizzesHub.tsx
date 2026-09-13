import { useUiCopy } from '../utils/uiTranslation';
import { guidanceMessages, quizResultLabel } from '../locales/guidance';
import { BackButton } from './BackButton';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Heart, 
  BookOpen, 
  MessageCircle, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  Users,
  Trophy,
  Brain
} from 'lucide-react';
import { LoveLanguagesQuiz } from './LoveLanguagesQuiz';
import { FaithJourneyQuiz } from './FaithJourneyQuiz';
import { ConflictStyleQuiz } from './ConflictStyleQuiz';
import { QuizComparison } from './QuizComparison';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { User as UserType } from '../types';

interface QuizzesHubProps {
  profile: UserType;
  partner?: UserType;
  accessToken: string;
  onBack: () => void;
}

interface QuizResult {
  quizType: string;
  result: any;
  completedAt: string;
}

export function QuizzesHub({ profile, partner, accessToken, onBack }: QuizzesHubProps) {
  const tr = useUiCopy(guidanceMessages);
  const [activeView, setActiveView] = useState<'hub' | 'loveLanguages' | 'faithJourney' | 'conflictStyle' | 'comparison'>('hub');
  const [results, setResults] = useState<QuizResult[]>([]);
  const [partnerResults, setPartnerResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparisonQuizType, setComparisonQuizType] = useState<string>('');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/quiz/results`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setPartnerResults(data.partnerResults || []);
      }
    } catch (error) {
      console.error('Failed to load quiz results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = async (quizType: string, result: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/quiz/save-result`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ quizType, result })
        }
      );

      if (!response.ok) {
        throw new Error(tr("Failed to save quiz result"));
      }

      toast.success(tr("Quiz completed! Results saved."));
      await loadResults();
      setActiveView('hub');
    } catch (error) {
      console.error('Failed to save quiz result:', error);
      toast.error(tr("Failed to save quiz result"));
    }
  };

  const getQuizResult = (quizType: string) => {
    return results.find(r => r.quizType === quizType);
  };

  const getPartnerQuizResult = (quizType: string) => {
    return partnerResults.find(r => r.quizType === quizType);
  };

  const handleViewComparison = (quizType: string) => {
    setComparisonQuizType(quizType);
    setActiveView('comparison');
  };

  const quizzes = [
    {
      id: 'loveLanguages',
      title: tr("Love Languages"),
      description: tr("Discover how you give and receive love"),
      icon: Heart,
      color: 'from-primary-500 to-primary-500',
      bgColor: 'from-primary-50 to-primary-50',
      questions: 30,
      duration: '10 min',
      scripture: 'Love is patient, love is kind - 1 Corinthians 13:4'
    },
    {
      id: 'faithJourney',
      title: tr("Faith Journey"),
      description: tr("Assess your spiritual growth and practices"),
      icon: BookOpen,
      color: 'from-sky-500 to-sky-500',
      bgColor: 'from-sky-50 to-sky-100',
      questions: 25,
      duration: '8 min',
      scripture: 'Grow in the grace and knowledge of our Lord - 2 Peter 3:18'
    },
    {
      id: 'conflictStyle',
      title: tr("Conflict Style"),
      description: tr("Learn how you handle disagreements"),
      icon: MessageCircle,
      color: 'from-primary-500 to-primary-500',
      bgColor: 'from-primary-50 to-primary-50',
      questions: 20,
      duration: '7 min',
      scripture: 'Be quick to listen, slow to speak - James 1:19'
    }
  ];

  if (activeView === 'loveLanguages') {
    return (
      <LoveLanguagesQuiz
        existingResult={getQuizResult('loveLanguages')}
        onComplete={(result) => handleQuizComplete('loveLanguages', result)}
        onBack={() => setActiveView('hub')}
      />
    );
  }

  if (activeView === 'faithJourney') {
    return (
      <FaithJourneyQuiz
        existingResult={getQuizResult('faithJourney')}
        onComplete={(result) => handleQuizComplete('faithJourney', result)}
        onBack={() => setActiveView('hub')}
      />
    );
  }

  if (activeView === 'conflictStyle') {
    return (
      <ConflictStyleQuiz
        existingResult={getQuizResult('conflictStyle')}
        onComplete={(result) => handleQuizComplete('conflictStyle', result)}
        onBack={() => setActiveView('hub')}
      />
    );
  }

  if (activeView === 'comparison') {
    return (
      <QuizComparison
        quizType={comparisonQuizType}
        userResult={getQuizResult(comparisonQuizType)}
        partnerResult={getPartnerQuizResult(comparisonQuizType)}
        partner={partner}
        onBack={() => setActiveView('hub')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-primary-50/20 to-sky-50/30">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-4">
          <BackButton label={tr("Back")} onClick={onBack} />
          <h1 className="tbo-page-title min-w-0 break-words">{tr("Discovery Quizzes")}</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="tbo-section-title mb-2">{tr("Discover Your Relationship")}</h2>
          <p className="tbo-body text-muted-foreground max-w-xl mx-auto">{tr("Take biblical-based quizzes to understand yourself and your partner better. Compare results and grow together in love.")} </p>
        </div>

        {/* Stats Card */}
        {!loading && (
          <Card className="mb-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{results.length}</div>
                  <div className="tbo-supporting opacity-90">{tr("Completed")}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{3 - results.length}</div>
                  <div className="tbo-supporting opacity-90">{tr("Remaining")}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {partner ? partnerResults.length : 0}
                  </div>
                  <div className="tbo-supporting opacity-90">{tr("Partner's")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quizzes Grid */}
        <div className="space-y-4 mb-8">
          {quizzes.map((quiz) => {
            const QuizIcon = quiz.icon;
            const userResult = getQuizResult(quiz.id);
            const partnerResult = getPartnerQuizResult(quiz.id);
            const isCompleted = !!userResult;
            const canCompare = isCompleted && partner && partnerResult;

            return (
              <Card
                key={quiz.id}
                className={`overflow-hidden hover:shadow-lg transition-all ${
                  isCompleted ? 'border-success-500/30 bg-success-50/30' : ''
                }`}
              >
                <div className={`h-2 bg-gradient-to-r ${quiz.color}`}></div>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${quiz.color} flex items-center justify-center flex-shrink-0`}>
                      <QuizIcon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="tbo-card-title">{quiz.title}</h3>
                        {isCompleted && (
                          <Badge className="tbo-caption bg-success-500">
                            <CheckCircle className="w-3 h-3 mr-1" />{tr("Done")} </Badge>
                        )}
                      </div>

                      <p className="tbo-supporting text-muted-foreground mb-3">{quiz.description}</p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span>{quiz.questions}{tr("questions")}</span>
                        <span>•</span>
                        <span>{tr(quiz.duration)}</span>
                      </div>

                      <div className="flex items-start gap-2 p-3 bg-sky-50 rounded-lg mb-4">
                        <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-sky-700 italic">{quiz.scripture}</p>
                      </div>

                      {isCompleted && userResult && (
                        <div className="mb-4 p-3 bg-card rounded-lg border">
                          <p className="tbo-caption text-muted-foreground mb-1">{tr("Your Result:")}</p>
                          <p className="tbo-supporting">{quizResultLabel(tr, userResult.result.primary || userResult.result.topLanguage || userResult.result.style || userResult.result.stage)}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => setActiveView(quiz.id as any)}
                          className={`tbo-action flex-1 min-h-11 h-auto whitespace-normal bg-gradient-to-r ${quiz.color}`}
                        >
                          {isCompleted ? tr("Retake Quiz") : tr("Start Quiz")}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>

                        {canCompare && (
                          <Button
                            onClick={() => handleViewComparison(quiz.id)}
                            variant="outline"
                            className="tbo-action flex items-center gap-2"
                          >
                            <Users className="w-4 h-4" />{tr("Compare")} </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <CardHeader>
            <CardTitle className="tbo-card-title flex items-center gap-2 text-primary-900">
              <Trophy className="w-5 h-5" />{tr("Why Take These Quizzes?")} </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="tbo-body text-primary-900">{tr("Deepen Understanding")}</p>
                <p className="tbo-supporting text-primary-700">{tr("Learn how you and your partner express love and handle challenges")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="tbo-body text-primary-900">{tr("Biblical Insights")}</p>
                <p className="tbo-supporting text-primary-700">{tr("Each result includes Scripture-based guidance for growth")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="tbo-body text-primary-900">{tr("Partner Comparison")}</p>
                <p className="tbo-supporting text-primary-700">{tr("Compare results to find compatibility and areas to work on together")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
