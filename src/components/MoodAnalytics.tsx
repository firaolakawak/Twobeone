import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import {
  Smile,
  Meh,
  Frown,
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  Calendar,
  Heart,
  Sparkles,
  BarChart3,
  Clock,
  MessageCircle,
  Loader2,
  ChevronRight,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { moods as moodsApi } from '../utils/api';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface MoodEntry {
  id: string;
  userId: string;
  mood: 'great' | 'good' | 'okay' | 'sad';
  note?: string;
  createdAt: string;
}

interface MoodAnalyticsProps {
  profile?: {
    id: string;
    name: string;
  };
  partner?: {
    id: string;
    name: string;
  };
  onClose?: () => void;
}

export function MoodAnalytics({ profile, partner, onClose }: MoodAnalyticsProps) {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<'great' | 'good' | 'okay' | 'sad'>('good');
  const [moodNote, setMoodNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [weeklyReportLoading, setWeeklyReportLoading] = useState(false);
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [openAIStatus, setOpenAIStatus] = useState<any>(null);
  const [hasQuotaError, setHasQuotaError] = useState(false);

  useEffect(() => {
    loadMoods();
  }, []);

  const loadMoods = async () => {
    try {
      setLoading(true);
      const { moods: fetchedMoods } = await moodsApi.list(30);
      setMoods(fetchedMoods);
    } catch (error) {
      console.error('Error loading moods:', error);
      toast.error('Failed to load mood data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMood = async () => {
    if (!selectedMood) {
      toast.error('Please select a mood');
      return;
    }

    setIsSaving(true);
    try {
      await moodsApi.save(selectedMood, moodNote);
      toast.success('Mood saved! 💝');
      setMoodNote('');
      await loadMoods();
    } catch (error) {
      console.error('Error saving mood:', error);
      toast.error('Failed to save mood');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!partner) {
      toast.error('You need a partner to generate AI analysis');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { analysis: aiAnalysis } = await moodsApi.analyze();
      setAnalysis(aiAnalysis);
      setHasQuotaError(false); // Clear quota error flag on success
      toast.success('Analysis generated! 🧠');
    } catch (error: any) {
      console.error('Error analyzing moods:', error);
      
      // Check if it's an OpenAI quota error
      if (error.message && (error.message.includes('quota') || error.message.includes('billing'))) {
        setHasQuotaError(true);
        toast.error('AI analysis unavailable - OpenAI quota exceeded. Please add credits to your OpenAI account.', {
          duration: 6000,
        });
      } else if (error.message && error.message.includes('rate_limit')) {
        toast.error('Rate limit reached. Please try again in a few moments.', {
          duration: 4000,
        });
      } else {
        toast.error(error.message || 'Failed to generate analysis');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateWeeklyReport = async () => {
    if (!partner) {
      toast.error('You need a partner to generate weekly reports');
      return;
    }

    setWeeklyReportLoading(true);
    try {
      const { report } = await moodsApi.generateWeeklyReport();
      toast.success('Weekly report sent to both of you! Check notifications 💝');
    } catch (error: any) {
      console.error('Error generating weekly report:', error);
      
      // Check if it's an OpenAI quota error
      if (error.message && (error.message.includes('quota') || error.message.includes('billing'))) {
        toast.error('Weekly report created with basic stats. AI analysis unavailable due to quota limits.', {
          duration: 6000,
        });
      } else if (error.message && error.message.includes('rate_limit')) {
        toast.error('Rate limit reached. Please try again in a few moments.', {
          duration: 4000,
        });
      } else {
        toast.error(error.message || 'Failed to generate weekly report');
      }
    } finally {
      setWeeklyReportLoading(false);
    }
  };

  // Calculate statistics
  const last7Days = moods.filter(m => {
    const date = new Date(m.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return date >= sevenDaysAgo;
  });

  const userMoods = last7Days.filter(m => m.userId === profile?.id);
  const partnerMoods = last7Days.filter(m => m.userId === partner?.id);

  const moodValues: Record<string, number> = { great: 4, good: 3, okay: 2, sad: 1 };
  const userAverage = userMoods.length > 0
    ? userMoods.reduce((sum, m) => sum + moodValues[m.mood], 0) / userMoods.length
    : 0;
  const partnerAverage = partnerMoods.length > 0
    ? partnerMoods.reduce((sum, m) => sum + moodValues[m.mood], 0) / partnerMoods.length
    : 0;

  // Prepare chart data
  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    const userDayMoods = moods.filter(m => 
      m.userId === profile?.id && m.createdAt.startsWith(dateStr)
    );
    const partnerDayMoods = moods.filter(m => 
      m.userId === partner?.id && m.createdAt.startsWith(dateStr)
    );

    const userAvg = userDayMoods.length > 0
      ? userDayMoods.reduce((sum, m) => sum + moodValues[m.mood], 0) / userDayMoods.length
      : null;
    const partnerAvg = partnerDayMoods.length > 0
      ? partnerDayMoods.reduce((sum, m) => sum + moodValues[m.mood], 0) / partnerDayMoods.length
      : null;

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      you: userAvg,
      partner: partnerAvg
    };
  });

  // Mood distribution
  const userMoodCounts = {
    great: userMoods.filter(m => m.mood === 'great').length,
    good: userMoods.filter(m => m.mood === 'good').length,
    okay: userMoods.filter(m => m.mood === 'okay').length,
    sad: userMoods.filter(m => m.mood === 'sad').length
  };

  const partnerMoodCounts = {
    great: partnerMoods.filter(m => m.mood === 'great').length,
    good: partnerMoods.filter(m => m.mood === 'good').length,
    okay: partnerMoods.filter(m => m.mood === 'okay').length,
    sad: partnerMoods.filter(m => m.mood === 'sad').length
  };

  const getMoodIcon = (mood: string, size = 'w-5 h-5') => {
    switch (mood) {
      case 'great':
        return <Smile className={`${size} text-green-600`} />;
      case 'good':
        return <Smile className={`${size} text-blue-600`} />;
      case 'okay':
        return <Meh className={`${size} text-yellow-600`} />;
      case 'sad':
        return <Frown className={`${size} text-gray-600`} />;
      default:
        return <Meh className={`${size} text-gray-400`} />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'great':
        return 'border-green-300 bg-green-50';
      case 'good':
        return 'border-blue-300 bg-blue-50';
      case 'okay':
        return 'border-yellow-300 bg-yellow-50';
      case 'sad':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* OpenAI Quota Error Alert */}
      {hasQuotaError && (
        <Alert className="border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="ml-2">
            <div className="space-y-2">
              <p className="font-medium text-amber-900">
                AI Analysis Temporarily Unavailable
              </p>
              <p className="text-sm text-amber-800">
                The OpenAI API quota has been exceeded. To restore AI-powered mood analysis and weekly reports:
              </p>
              <ul className="text-sm text-amber-800 list-disc list-inside space-y-1 ml-2">
                <li>Add credits to your OpenAI account at <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-amber-900">platform.openai.com/account/billing</a></li>
                <li>Or upgrade to a paid plan with higher quota limits</li>
              </ul>
              <p className="text-sm text-amber-700 mt-2">
                Don't worry - all your mood tracking data is safe! Basic statistics and charts continue to work normally.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 rounded-full hover:bg-purple-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold">Mood Analytics</h1>
            <p className="text-sm text-muted-foreground">Track your emotional journey together</p>
          </div>
        </div>
        {partner && (
          <Button
            onClick={handleGenerateWeeklyReport}
            disabled={weeklyReportLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {weeklyReportLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Weekly Report
              </>
            )}
          </Button>
        )}
      </div>

      {/* Track Today's Mood */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600" />
            How are you feeling today?
          </CardTitle>
          <CardDescription>Share your emotional state with your partner</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mood Selection */}
          <div className="grid grid-cols-4 gap-3">
            <Button
              variant="outline"
              className={`h-20 flex-col gap-2 ${selectedMood === 'great' ? 'border-green-400 bg-green-100' : ''}`}
              onClick={() => setSelectedMood('great')}
            >
              <Smile className={`w-8 h-8 ${selectedMood === 'great' ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-xs">Great</span>
            </Button>
            <Button
              variant="outline"
              className={`h-20 flex-col gap-2 ${selectedMood === 'good' ? 'border-blue-400 bg-blue-100' : ''}`}
              onClick={() => setSelectedMood('good')}
            >
              <Smile className={`w-8 h-8 ${selectedMood === 'good' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-xs">Good</span>
            </Button>
            <Button
              variant="outline"
              className={`h-20 flex-col gap-2 ${selectedMood === 'okay' ? 'border-yellow-400 bg-yellow-100' : ''}`}
              onClick={() => setSelectedMood('okay')}
            >
              <Meh className={`w-8 h-8 ${selectedMood === 'okay' ? 'text-yellow-600' : 'text-gray-400'}`} />
              <span className="text-xs">Okay</span>
            </Button>
            <Button
              variant="outline"
              className={`h-20 flex-col gap-2 ${selectedMood === 'sad' ? 'border-gray-400 bg-gray-100' : ''}`}
              onClick={() => setSelectedMood('sad')}
            >
              <Frown className={`w-8 h-8 ${selectedMood === 'sad' ? 'text-gray-600' : 'text-gray-400'}`} />
              <span className="text-xs">Sad</span>
            </Button>
          </div>

          {/* Optional Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-purple-600" />
              Add a note (optional)
            </label>
            <Textarea
              placeholder="What's on your heart today?"
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            onClick={handleSaveMood}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Mood'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {partner && (
        <div className="grid grid-cols-2 gap-4">
          {/* Your Average */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Your Average (7 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userAverage.toFixed(1)}/4</p>
                  <p className="text-xs text-muted-foreground">{userMoods.length} entries</p>
                </div>
              </div>
              <Progress value={(userAverage / 4) * 100} className="mt-3 h-2" />
            </CardContent>
          </Card>

          {/* Partner Average */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{partner.name}'s Average</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{partnerAverage.toFixed(1)}/4</p>
                  <p className="text-xs text-muted-foreground">{partnerMoods.length} entries</p>
                </div>
              </div>
              <Progress value={(partnerAverage / 4) * 100} className="mt-3 h-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mood Trends Chart */}
      {partner && last7DaysData.some(d => d.you !== null || d.partner !== null) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Mood Trends (Last 7 Days)
            </CardTitle>
            <CardDescription>Track your emotional patterns over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={last7DaysData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: any) => value?.toFixed(1)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="you" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name={profile?.name || 'You'}
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey="partner" 
                  stroke="#ec4899" 
                  strokeWidth={2}
                  name={partner.name}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Mood Distribution */}
      {partner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Mood Distribution (Last 7 Days)
            </CardTitle>
            <CardDescription>How often you felt each emotion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Your Distribution */}
            <div className="space-y-3">
              <p className="text-sm font-medium">{profile?.name || 'You'}</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <Smile className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-700">{userMoodCounts.great}</p>
                  <p className="text-xs text-green-600">Great</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Smile className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-700">{userMoodCounts.good}</p>
                  <p className="text-xs text-blue-600">Good</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Meh className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-yellow-700">{userMoodCounts.okay}</p>
                  <p className="text-xs text-yellow-600">Okay</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Frown className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-700">{userMoodCounts.sad}</p>
                  <p className="text-xs text-gray-600">Sad</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Partner Distribution */}
            <div className="space-y-3">
              <p className="text-sm font-medium">{partner.name}</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <Smile className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-700">{partnerMoodCounts.great}</p>
                  <p className="text-xs text-green-600">Great</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Smile className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-700">{partnerMoodCounts.good}</p>
                  <p className="text-xs text-blue-600">Good</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Meh className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-yellow-700">{partnerMoodCounts.okay}</p>
                  <p className="text-xs text-yellow-600">Okay</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Frown className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-700">{partnerMoodCounts.sad}</p>
                  <p className="text-xs text-gray-600">Sad</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {partner && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Mood Analysis
            </CardTitle>
            <CardDescription>Get insights from your emotional patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis ? (
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">AI Insights</p>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {analysis.analysis}
                    </div>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(analysis.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Brain className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Generate an AI-powered analysis of your mood patterns
                </p>
              </div>
            )}
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate AI Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Moods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            Recent Mood History
          </CardTitle>
          <CardDescription>Your last 10 mood entries</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : moods.length > 0 ? (
              <div className="space-y-3">
                {moods.slice(0, 10).map((mood) => (
                  <div
                    key={mood.id}
                    className={`p-4 rounded-lg border-2 ${getMoodColor(mood.mood)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {getMoodIcon(mood.mood, 'w-6 h-6')}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="capitalize">
                              {mood.mood}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {mood.userId === profile?.id ? 'You' : partner?.name}
                            </span>
                          </div>
                          {mood.note && (
                            <p className="text-sm text-gray-700 mt-2">{mood.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(mood.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No mood entries yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start tracking your moods to see patterns and insights
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}