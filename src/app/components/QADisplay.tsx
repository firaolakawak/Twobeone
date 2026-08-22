import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  MessageSquare, 
  Heart, 
  BookOpen,
  Users,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  Circle,
  Search,
  X
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { Input } from './ui/input';

const supabase = createClient();

interface QuestionPrompt {
  id: string;
  text: string;
  type: string;
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
  status: string;
  userResponse?: string;
  partnerResponse?: string;
}

interface QADisplayProps {
  onBack?: () => void;
  userName?: string;
  partnerName?: string;
}

export function QADisplay({ onBack, userName, partnerName }: QADisplayProps) {
  const { t } = useLanguage();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', label: 'All Categories', icon: '💬' },
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
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || publicAnonKey;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/questions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const { questions: fetchedQuestions } = await response.json();
        
        // Load responses for each question
        const questionsWithResponses = await Promise.all(
          (fetchedQuestions || []).map(async (q: any) => {
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
                return {
                  ...q,
                  userResponse: userResponse?.response,
                  partnerResponse: partnerResponse?.response,
                };
              }
            } catch (err) {
              console.error('Failed to load response for question:', q.id, err);
            }
            return q;
          })
        );
        
        setQuestions(questionsWithResponses);
      } else {
        toast.error('Failed to load questions');
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const filteredQuestions = questions.filter((q) => {
    // Category filter
    if (filterCategory !== 'all' && q.category !== filterCategory) {
      return false;
    }

    // Status filter
    if (filterStatus === 'answered' && !q.userResponse) {
      return false;
    }
    if (filterStatus === 'unanswered' && q.userResponse) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        q.title.toLowerCase().includes(query) ||
        q.verse.toLowerCase().includes(query) ||
        q.verseReference.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const answeredCount = questions.filter(q => q.userResponse).length;
  const bothAnsweredCount = questions.filter(q => q.userResponse && q.partnerResponse).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MessageSquare className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl">Q&A History</h1>
        </div>
        <p className="text-muted-foreground">{t.questions.viewResponses}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="flex flex-col items-center">
            <Circle className="w-6 h-6 text-muted-foreground mb-2" />
            <p className="text-2xl font-semibold text-foreground">{questions.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex flex-col items-center">
            <CheckCircle2 className="w-6 h-6 text-success-700 mb-2" />
            <p className="text-2xl font-semibold text-success-700">{answeredCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Answered</p>
          </div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="flex flex-col items-center">
            <Heart className="w-6 h-6 text-primary-600 mb-2" />
            <p className="text-2xl font-semibold text-primary-600">{bothAnsweredCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Together</p>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.common.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full"
        >
          <Filter className="w-4 h-4 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Status</label>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                  className="flex-1"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'answered' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('answered')}
                  className="flex-1"
                >
                  Answered
                </Button>
                <Button
                  variant={filterStatus === 'unanswered' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('unanswered')}
                  className="flex-1"
                >
                  Unanswered
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Category</label>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFilterCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filterCategory === cat.id
                          ? 'bg-primary-100 text-primary-900 font-medium'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <span className="mr-2">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Clear Filters */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterCategory('all');
                setFilterStatus('all');
                setSearchQuery('');
              }}
              className="w-full"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && filteredQuestions.length === 0 && (
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
              ? 'No Questions Found'
              : 'No Questions Yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
              ? 'Try adjusting your filters or search terms'
              : 'Questions will appear here once created'}
          </p>
          {(searchQuery || filterStatus !== 'all' || filterCategory !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setFilterCategory('all');
                setFilterStatus('all');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Card>
      )}

      {/* Questions List */}
      {!isLoading && filteredQuestions.length > 0 && (
        <div className="space-y-4">
          {filteredQuestions.map((question) => {
            const isExpanded = expandedQuestions.has(question.id);
            const hasAnswer = !!question.userResponse;
            const hasPartnerAnswer = !!question.partnerResponse;

            return (
              <Card key={question.id} className="overflow-hidden">
                <CardHeader 
                  className={`cursor-pointer transition-colors ${
                    hasAnswer 
                      ? 'bg-gradient-to-r from-success-50 to-success-50' 
                      : 'bg-gradient-to-r from-muted to-muted'
                  }`}
                  onClick={() => toggleExpanded(question.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {categories.find(c => c.id === question.category)?.icon}{' '}
                          {categories.find(c => c.id === question.category)?.label || question.category}
                        </Badge>
                        {hasAnswer && (
                          <Badge className="bg-success-500 text-white text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Answered
                          </Badge>
                        )}
                        {hasPartnerAnswer && (
                          <Badge className="bg-primary-600 text-white text-xs">
                            <Heart className="w-3 h-3 mr-1" />
                            Partner Answered
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{question.title}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-6 space-y-6">
                    {/* Scripture */}
                    <div className="bg-warning-50 border-l-4 border-warning-500 p-4 rounded-r">
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-5 h-5 text-warning-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-foreground italic mb-2">{question.verse}</p>
                          <p className="text-sm text-muted-foreground">{question.verseReference}</p>
                        </div>
                      </div>
                    </div>

                    {/* Discussion Prompts */}
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary-600" />
                        Discussion Prompts
                      </h4>
                      <ul className="space-y-2">
                        {question.prompts?.map((prompt, index) => (
                          <li key={prompt.id || index} className="flex items-start gap-2 text-foreground">
                            <span className="text-primary-600 mt-1">•</span>
                            <span>{prompt.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Responses */}
                    {(hasAnswer || hasPartnerAnswer) && (
                      <>
                        <Separator />
                        
                        {/* User Response */}
                        {hasAnswer && (
                          <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Users className="w-4 h-4 text-sky-600" />
                              {userName ? `${userName}'s Answer` : 'Your Answer'}
                            </h4>
                            <div className="bg-sky-50 p-4 rounded-lg">
                              <p className="text-foreground">{question.userResponse}</p>
                            </div>
                          </div>
                        )}

                        {/* Partner Response */}
                        {hasPartnerAnswer && (
                          <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Heart className="w-4 h-4 text-primary-600" />
                              {partnerName ? `${partnerName}'s Answer` : "{t.questions.partnersAnswer}"}
                            </h4>
                            <div className="bg-primary-50 p-4 rounded-lg">
                              <p className="text-foreground">{question.partnerResponse}</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* No Response Yet */}
                    {!hasAnswer && !hasPartnerAnswer && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Circle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <p>No responses yet</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
