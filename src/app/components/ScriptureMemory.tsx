import { useUiCopy } from '../utils/uiTranslation';
import { readingUiMessages } from '../locales/readingUi';
import { BrandLoader } from './BrandLoader';
import { BackButton } from './BackButton';
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { 
  BookOpen, 
  Brain, 
  Target, 
  Award, 
  Flame,
  Play,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  Plus,
  Users,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { curatedVerses, type MemoryVerse } from '../data/memory-verses';
import { projectId } from '../utils/supabase/info';

interface UserVerseProgress {
  verseId: string;
  masteryLevel: number; // 0-100
  lastPracticed: string;
  timesReviewed: number;
  consecutiveCorrect: number;
  status: 'new' | 'learning' | 'mastered';
}

interface MemoryStats {
  totalVerses: number;
  masteredVerses: number;
  learningVerses: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string;
}

interface ScriptureMemoryProps {
  onBack: () => void;
  accessToken?: string;
  userName?: string;
  partnerName?: string;
}

export function ScriptureMemory({ onBack, accessToken, userName, partnerName }: ScriptureMemoryProps) {
  const tr = useUiCopy(readingUiMessages);
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'library' | 'practice' | 'quiz' | 'progress'>('library');
  const [userProgress, setUserProgress] = useState<Record<string, UserVerseProgress>>({});
  const [stats, setStats] = useState<MemoryStats>({
    totalVerses: 0,
    masteredVerses: 0,
    learningVerses: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: ''
  });
  const [selectedVerse, setSelectedVerse] = useState<MemoryVerse | null>(null);
  const [showText, setShowText] = useState(true);
  const [quizMode, setQuizMode] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMemoryData();
  }, [accessToken]);

  const loadMemoryData = async () => {
    if (!accessToken) { setIsLoading(false); return; }

    setIsLoading(true);
    try {
      // Load user's verse progress
      const progressResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/memory/progress`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (progressResponse.ok) {
        const { progress } = await progressResponse.json();
        const progressMap: Record<string, UserVerseProgress> = {};
        progress?.forEach((p: any) => {
          progressMap[p.verseId] = p;
        });
        setUserProgress(progressMap);
      }

      // Load memory stats
      const statsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/memory/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || stats);
      }
    } catch (error) {
      console.error('Failed to load memory data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startLearning = async (verse: MemoryVerse) => {
    setSelectedVerse(verse);
    setActiveTab('practice');
    setShowText(true);
    setQuizMode(false);

    // Record practice session
    if (accessToken) {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/memory/practice`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              verseId: verse.id,
              action: 'start'
            })
          }
        );
      } catch (error) {
        console.error('Failed to record practice:', error);
      }
    }
  };

  const toggleQuizMode = () => {
    setQuizMode(!quizMode);
    setShowText(false);
    setShowAnswer(false);
    setUserAnswer('');
  };

  const checkAnswer = async (correct: boolean) => {
    if (!selectedVerse || !accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/memory/practice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            verseId: selectedVerse.id,
            action: 'answer',
            correct
          })
        }
      );

      if (response.ok) {
        const { progress: updatedProgress, stats: updatedStats } = await response.json();

        // Update local state
        setUserProgress(prev => ({
          ...prev,
          [selectedVerse.id]: updatedProgress
        }));

        if (updatedStats) {
          setStats(updatedStats);
        }

        if (correct) {
          toast.success(tr("Correct! 🎉"), {
            description: tr('Mastery: {percent}%', { percent: updatedProgress.masteryLevel })
          });
        } else {
          toast.error(tr("Not quite right. Keep practicing! 💪"));
        }
      }
    } catch (error) {
      console.error('Failed to record answer:', error);
    }

    // Reset for next round
    setTimeout(() => {
      setShowAnswer(false);
      setUserAnswer('');
    }, 2000);
  };

  const getVerseProgress = (verseId: string): UserVerseProgress | null => {
    return userProgress[verseId] || null;
  };

  const getStatusBadge = (progress: UserVerseProgress | null) => {
    if (!progress) return <Badge className="tbo-caption" variant="outline">{tr("New")}</Badge>;

    if (progress.status === 'mastered') {
      return <Badge className="tbo-caption bg-success-500">{tr("Mastered")}</Badge>;
    } else if (progress.status === 'learning') {
      return <Badge className="tbo-caption bg-sky-500">{tr("Learning")}</Badge>;
    }
    return <Badge className="tbo-caption" variant="outline">{tr("New")}</Badge>;
  };

  const getMasteryColor = (level: number) => {
    if (level >= 80) return 'bg-success-500';
    if (level >= 50) return 'bg-sky-500';
    if (level >= 25) return 'bg-warning-500';
    return 'bg-neutral-300';
  };

  const filteredVerses = curatedVerses.filter(verse => {
    const categoryMatch = filterCategory === 'all' || verse.category === filterCategory;

    const progress = getVerseProgress(verse.id);
    const statusMatch = filterStatus === 'all' || 
                       (filterStatus === 'new' && !progress) ||
                       (filterStatus === 'learning' && progress?.status === 'learning') ||
                       (filterStatus === 'mastered' && progress?.status === 'mastered');

    return categoryMatch && statusMatch;
  });

  const categories = Array.from(new Set(curatedVerses.map(v => v.category)));

  return (
    <div className="min-h-screen min-w-0 bg-gradient-to-br from-primary-50 via-primary-50 to-primary-50 dark:from-neutral-900 dark:via-primary-900/20 dark:to-primary-900/20 p-4 [overflow-wrap:anywhere]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <BackButton label={t.common.back} onClick={onBack} />
            <div className="min-w-0 flex-1 basis-48">
              <h1 className="tbo-page-title">
                <Brain className="mr-2 inline h-6 w-6 align-middle text-primary-600" />
                {tr('Scripture Memory')}
              </h1>
              <p className="tbo-supporting text-muted-foreground mt-1">
                {t.dashboard.growingTogetherInFaith}
              </p>
            </div>
          </div>
        </div>

        {language !== 'en' && (
          <p className="tbo-supporting mb-6 rounded-lg border bg-card p-4">
            {tr('Memory verses are currently available in English. Your progress is shared across interface languages.')}
          </p>
        )}
        {isLoading && <BrandLoader className="mb-6" />}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <BookOpen className="w-5 h-5 text-primary-600 mb-2" />
                <div className="text-xl">{stats.totalVerses}</div>
                <div className="tbo-caption text-muted-foreground">{tr('Verses Started')}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-success-500/30 bg-success-50/50">
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <Award className="w-5 h-5 text-success-700 mb-2" />
                <div className="text-xl text-success-700">{stats.masteredVerses}</div>
                <div className="tbo-caption text-muted-foreground">{tr('Mastered')}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sky-200 bg-sky-50/50">
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <Target className="w-5 h-5 text-sky-600 mb-2" />
                <div className="text-xl text-sky-600">{stats.learningVerses}</div>
                <div className="tbo-caption text-muted-foreground">{tr('Learning')}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning-500/30 bg-warning-50/50">
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <Flame className="w-5 h-5 text-warning-700 mb-2" />
                <div className="text-xl text-warning-700">{stats.currentStreak}</div>
                <div className="tbo-caption text-muted-foreground">{tr("Day Streak")}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid h-auto min-h-10 grid-cols-4 w-full">
            <TabsTrigger value="library" className="tbo-action">
              <BookOpen className="w-4 h-4 mr-1 md:mr-2" />
              <span className="sr-only sm:not-sr-only sm:whitespace-normal">{tr("Library")}</span>
            </TabsTrigger>
            <TabsTrigger value="practice" disabled={!selectedVerse} className="tbo-action">
              <Eye className="w-4 h-4 mr-1 md:mr-2" />
              <span className="sr-only sm:not-sr-only sm:whitespace-normal">{tr("Practice")}</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" disabled={!selectedVerse} className="tbo-action">
              <Brain className="w-4 h-4 mr-1 md:mr-2" />
              <span className="sr-only sm:not-sr-only sm:whitespace-normal">{tr("Quiz")}</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="tbo-action">
              <Award className="w-4 h-4 mr-1 md:mr-2" />
              <span className="sr-only sm:not-sr-only sm:whitespace-normal">{tr("Progress")}</span>
            </TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library">
            <Card>
              <CardHeader>
                <CardTitle className="tbo-card-title">{tr("Verse Library")}</CardTitle>
                <CardDescription className="tbo-supporting">{tr("Select a verse to start memorizing")}</CardDescription>

                {/* Filters */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  <select
                    aria-label={tr('Filter by category')}
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="tbo-field min-w-0 max-w-full px-3 py-2 rounded-md border border-border bg-card"
                  >
                    <option value="all">{tr("All Categories")}</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {tr(cat.charAt(0).toUpperCase() + cat.slice(1))}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label={tr('Filter by status')}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="tbo-field min-w-0 max-w-full px-3 py-2 rounded-md border border-border bg-card"
                  >
                    <option value="all">{tr("All Status")}</option>
                    <option value="new">{tr("New")}</option>
                    <option value="learning">{tr("Learning")}</option>
                    <option value="mastered">{tr("Mastered")}</option>
                  </select>
                </div>
              </CardHeader>

              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {!isLoading && filteredVerses.length === 0 && <p className="tbo-supporting">{tr('No verses match these filters.')}</p>}
                    {filteredVerses.map((verse) => {
                      const progress = getVerseProgress(verse.id);
                      const masteryLevel = progress?.masteryLevel || 0;

                      return (
                        <Card 
                          key={verse.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => startLearning(verse)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="tbo-supporting text-primary-600 dark:text-primary-400">
                                    {verse.reference}
                                  </span>
                                  {getStatusBadge(progress)}
                                  <Badge variant="outline" className="tbo-caption">
                                    {tr(verse.category.charAt(0).toUpperCase() + verse.category.slice(1))}
                                  </Badge>
                                </div>
                                <p lang="en" className="text-sm text-muted-foreground mb-3">
                                  {verse.text}
                                </p>
                                {progress && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{tr('Mastery: {percent}%', { percent: masteryLevel })}</span>
                                      <span>•</span>
                                      <span>{tr('Reviewed {count} times', { count: progress.timesReviewed })}</span>
                                    </div>
                                    <Progress 
                                      value={masteryLevel} 
                                      className="h-2"
                                    />
                                  </div>
                                )}
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Practice Tab */}
          <TabsContent value="practice">
            {selectedVerse && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="tbo-card-title">{selectedVerse.reference}</CardTitle>
                      <CardDescription className="tbo-supporting">{tr("Read and memorize this verse")}</CardDescription>
                    </div>
                    {getStatusBadge(getVerseProgress(selectedVerse.id))}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Verse Display */}
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-6 min-h-[150px] flex items-center justify-center">
                    <div className="text-center">
                      {showText ? (
                        <>
                          <p lang="en" className="text-base leading-relaxed mb-4">
                            {selectedVerse.text}
                          </p>
                          <p className="text-sm text-primary-600 dark:text-primary-400">
                            — {selectedVerse.reference}
                          </p>
                        </>
                      ) : (
                        <div className="text-muted-foreground">
                          <EyeOff className="w-8 h-8 mx-auto mb-2" />
                          <p className="tbo-supporting">{tr("Verse hidden. Try to recall it!")}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Practice Controls */}
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button className="tbo-action"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowText(!showText)}
                    >
                      {showText ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showText ? tr("Hide") : tr("Show")}
                    </Button>

                    <Button className="tbo-action" size="sm" onClick={() => {
                      setActiveTab('quiz');
                      setQuizMode(true);
                      setShowText(false);
                    }}>
                      <Brain className="w-4 h-4 mr-2" />

                      {tr("Start Quiz")}
                    </Button>
                  </div>

                  {/* Progress Info */}
                  {(() => {
                    const progress = getVerseProgress(selectedVerse.id);
                    if (progress) {
                      return (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="tbo-supporting text-muted-foreground">{tr("Your Progress")}</span>
                            <span className="tbo-supporting">{progress.masteryLevel}%</span>
                          </div>
                          <Progress value={progress.masteryLevel} />
                          <div className="flex gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                            <span>{tr('Reviewed {count} times', { count: progress.timesReviewed })}</span>
                            <span>•</span>
                            <span>{tr('Streak: {count} correct', { count: progress.consecutiveCorrect })}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz">
            {selectedVerse && (
              <Card>
                <CardHeader>
                  <CardTitle className="tbo-card-title">{tr("Quiz Time! 🧠")}</CardTitle>
                  <CardDescription className="tbo-supporting">{tr("Can you recall this verse?")}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Question */}
                  <div className="bg-gradient-to-br from-sky-50 to-primary-50 dark:from-sky-900/20 dark:to-primary-900/20 rounded-lg p-6">
                    <div className="text-center">
                      <p className="tbo-body mb-4">

                        {tr("What verse is this?")}
                      </p>
                      <p className="text-xl text-primary-600 dark:text-primary-400">
                        {selectedVerse.reference}
                      </p>
                    </div>
                  </div>

                  {/* Answer Area */}
                  {!showAnswer ? (
                    <div className="space-y-3">
                      <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder={tr("Type the verse from memory...")}
                        className="tbo-field w-full px-4 py-3 rounded-lg border border-border bg-card"
                        rows={4}
                      />
                      <Button 
                        onClick={() => setShowAnswer(true)}
                        className="tbo-action w-full"
                      >

                        {tr("Check Answer")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Correct Answer */}
                      <div className="bg-muted  rounded-lg p-4">
                        <p className="tbo-supporting text-muted-foreground mb-2">{tr("Correct verse:")}</p>
                        <p lang="en" className="text-sm leading-relaxed">{selectedVerse.text}</p>
                      </div>

                      {/* Self-Assessment */}
                      <div className="text-center">
                        <p className="tbo-supporting text-muted-foreground mb-3">{tr("How did you do?")}</p>
                        <div className="flex gap-3 justify-center flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="tbo-action border-error-500/50 text-error-500 hover:bg-error-50"
                            onClick={() => checkAnswer(false)}
                          >
                            <X className="w-4 h-4 mr-2" />

                            {tr("Need Practice")}
                          </Button>
                          <Button
                            size="sm"
                            className="tbo-action bg-success-500 hover:bg-success-700"
                            onClick={() => checkAnswer(true)}
                          >
                            <Check className="w-4 h-4 mr-2" />

                            {tr("Got It Right!")}
                          </Button>
                        </div>
                      </div>

                      {/* Next Verse */}
                      <Button
                        variant="outline"
                        className="tbo-action w-full"
                        onClick={() => {
                          const currentIndex = curatedVerses.findIndex(v => v.id === selectedVerse.id);
                          const nextVerse = curatedVerses[(currentIndex + 1) % curatedVerses.length];
                          startLearning(nextVerse);
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />

                        {tr("Next Verse")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <div className="space-y-4">
              {/* Overall Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="tbo-card-title">{tr("Your Memory Journey")}</CardTitle>
                  <CardDescription className="tbo-supporting">{tr("Track your scripture memorization progress")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="tbo-supporting text-muted-foreground">{tr("Overall Progress")}</span>
                        <span className="tbo-supporting">
                          {stats.masteredVerses} / {curatedVerses.length}
                        </span>
                      </div>
                      <Progress 
                        value={(stats.masteredVerses / curatedVerses.length) * 100} 
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="tbo-supporting text-muted-foreground">{tr("Current Streak")}</span>
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-warning-500" />
                          <span className="text-base">{tr('{count} days', { count: stats.currentStreak })}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="tbo-supporting text-muted-foreground">{tr("Longest Streak")}</span>
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-warning-500" />
                          <span className="text-base">{tr('{count} days', { count: stats.longestStreak })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mastered Verses */}
              <Card>
                <CardHeader>
                  <CardTitle className="tbo-card-title flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-warning-500" />

                    {tr("Mastered Verses")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {!isLoading && !Object.values(userProgress).some(progress => progress.status === 'mastered') && <p className="tbo-supporting">{tr('Mastered verses will appear here.')}</p>}
                      {Object.entries(userProgress)
                        .filter(([_, progress]) => progress.status === 'mastered')
                        .map(([verseId, progress]) => {
                          const verse = curatedVerses.find(v => v.id === verseId);
                          if (!verse) return null;

                          return (
                            <div 
                              key={verseId}
                              className="flex items-center gap-3 p-3 rounded-lg bg-success-50 dark:bg-success-700/10 border border-success-500/30"
                            >
                              <Award className="w-5 h-5 text-success-700 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="tbo-supporting text-success-700 dark:text-success-500">
                                    {verse.reference}
                                  </span>
                                  <Badge variant="outline" className="tbo-caption">
                                    {progress.masteryLevel}%
                                  </Badge>
                                </div>
                                <p className="tbo-caption text-muted-foreground dark:text-muted-foreground mt-1">
                                  {tr('Reviewed {count} times', { count: progress.timesReviewed })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
