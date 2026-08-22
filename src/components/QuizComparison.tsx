import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  ChevronLeft, 
  Heart, 
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { User as UserType } from '../types';

interface QuizComparisonProps {
  quizType: string;
  userResult: any;
  partnerResult: any;
  partner?: UserType;
  onBack: () => void;
}

export function QuizComparison({ quizType, userResult, partnerResult, partner, onBack }: QuizComparisonProps) {
  if (!userResult || !partnerResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-pink-50/30">
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Partner Comparison</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Comparison Not Available</h2>
          <p className="text-gray-600 mb-6">
            {!partner 
              ? "You need to connect with a partner first."
              : "Your partner hasn't completed this quiz yet."}
          </p>
          <Button onClick={onBack}>Back to Quizzes</Button>
        </div>
      </div>
    );
  }

  const renderLoveLanguagesComparison = () => {
    const userPrimary = userResult.result.primary;
    const partnerPrimary = partnerResult.result.primary;
    const match = userPrimary === partnerPrimary;

    const loveLanguageNames: any = {
      WA: "Words of Affirmation",
      QT: "Quality Time",
      GT: "Receiving Gifts",
      AS: "Acts of Service",
      PT: "Physical Touch"
    };

    const insights = {
      same: {
        title: "Perfect Match!",
        description: "You both share the same primary love language. This means you naturally understand how each other gives and receives love.",
        tips: [
          "Continue expressing love in ways that resonate with both of you",
          "Be mindful not to neglect other love languages entirely",
          "Your natural understanding is a gift - use it to deepen your bond"
        ]
      },
      different: {
        title: "Complementary Match",
        description: "You have different primary love languages. This is an opportunity to grow by learning to love your partner in their language.",
        tips: [
          `You feel loved through ${loveLanguageNames[userPrimary]}, but your partner through ${loveLanguageNames[partnerPrimary]}`,
          "Make intentional effort to express love in your partner's language",
          "Communicate openly about what makes you each feel most loved",
          "Use this difference as a chance to expand your capacity for love"
        ]
      }
    };

    const currentInsight = match ? insights.same : insights.different;

    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              Love Language Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-pink-50 rounded-lg border-2 border-pink-200">
                <p className="text-sm text-gray-600 mb-2">You</p>
                <p className="font-semibold text-pink-900">{loveLanguageNames[userPrimary]}</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-lg border-2 border-rose-200">
                <p className="text-sm text-gray-600 mb-2">{partner?.name}</p>
                <p className="font-semibold text-rose-900">{loveLanguageNames[partnerPrimary]}</p>
              </div>
            </div>

            {match && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-900">You share the same primary love language!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              {currentInsight.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">{currentInsight.description}</p>
            <div className="space-y-2">
              {currentInsight.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-white rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-purple-700">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Score Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.keys(userResult.result.scores).map((lang) => {
                const userScore = userResult.result.scores[lang];
                const partnerScore = partnerResult.result.scores[lang];
                const userPercentage = (userScore / 30) * 100;
                const partnerPercentage = (partnerScore / 30) * 100;

                return (
                  <div key={lang} className="space-y-2">
                    <h4 className="text-sm font-medium">{loveLanguageNames[lang]}</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-24">You</span>
                        <Progress value={userPercentage} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-12 text-right">{userScore}/30</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-24">{partner?.name}</span>
                        <Progress value={partnerPercentage} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-12 text-right">{partnerScore}/30</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  const renderFaithJourneyComparison = () => {
    const userPercentage = userResult.result.percentage;
    const partnerPercentage = partnerResult.result.percentage;
    const userStage = userResult.result.stage;
    const partnerStage = partnerResult.result.stage;
    const difference = Math.abs(userPercentage - partnerPercentage);

    const stageNames: any = {
      seeking: "Seeking Seeker",
      growing: "Growing Believer",
      maturing: "Maturing Disciple",
      leading: "Spiritual Leader"
    };

    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Faith Journey Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200 text-center">
                <p className="text-sm text-gray-600 mb-2">You</p>
                <p className="text-3xl font-bold text-blue-600 mb-1">{userPercentage}%</p>
                <p className="text-sm font-medium text-blue-900">{stageNames[userStage]}</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200 text-center">
                <p className="text-sm text-gray-600 mb-2">{partner?.name}</p>
                <p className="text-3xl font-bold text-indigo-600 mb-1">{partnerPercentage}%</p>
                <p className="text-sm font-medium text-indigo-900">{stageNames[partnerStage]}</p>
              </div>
            </div>

            {difference <= 15 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-900">You're at similar faith stages - great for growing together!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Growing Together
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-700 mb-3">
              {difference <= 15 
                ? "You're at similar points in your faith journey. Use this as an opportunity to grow together and encourage each other."
                : "You're at different stages in your faith journey. This is an opportunity to learn from each other and grow together."}
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Pray together daily</p>
                <p className="text-sm text-gray-600">Strengthen your spiritual bond through shared prayer time</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Study Scripture together</p>
                <p className="text-sm text-gray-600">Choose a book of the Bible or devotional to go through as a couple</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Serve together</p>
                <p className="text-sm text-gray-600">Find a ministry or cause where you can serve side by side</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Area Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userResult.result.categoryAverages.map((userCat: any) => {
                const partnerCat = partnerResult.result.categoryAverages.find((c: any) => c.category === userCat.category);
                
                return (
                  <div key={userCat.category} className="space-y-2">
                    <h4 className="text-sm font-medium capitalize">{userCat.category}</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-24">You</span>
                        <Progress value={userCat.percentage} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-12 text-right">{Math.round(userCat.percentage)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-24">{partner?.name}</span>
                        <Progress value={partnerCat?.percentage || 0} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-12 text-right">{Math.round(partnerCat?.percentage || 0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  const renderConflictStyleComparison = () => {
    const userStyle = userResult.result.style;
    const partnerStyle = partnerResult.result.style;
    const match = userStyle === partnerStyle;

    const styleNames: any = {
      competing: "Competing",
      collaborating: "Collaborating",
      avoiding: "Avoiding",
      compromising: "Compromising",
      accommodating: "Accommodating"
    };

    const compatibilityInsights: any = {
      'competing-competing': {
        compatibility: 'challenging',
        insight: 'Both partners prefer to be direct and assertive. This can lead to power struggles.',
        tips: ['Practice active listening', 'Take turns being the "decision maker"', 'Learn to yield sometimes', 'Remember you\'re on the same team']
      },
      'competing-collaborating': {
        compatibility: 'good',
        insight: 'One partner is direct while the other seeks understanding. Balance assertion with patience.',
        tips: ['Competing partner: Slow down and listen', 'Collaborating partner: Don\'t over-analyze', 'Find a middle ground between speed and thoroughness']
      },
      'competing-avoiding': {
        compatibility: 'challenging',
        insight: 'One partner confronts while the other withdraws. This can create frustration.',
        tips: ['Competing partner: Create safe space for discussion', 'Avoiding partner: Practice expressing concerns', 'Set gentle ground rules for conflicts']
      },
      'competing-compromising': {
        compatibility: 'moderate',
        insight: 'One seeks to win while the other seeks fairness. Learn from each other.',
        tips: ['Recognize when winning matters vs. when compromise is better', 'Value both perspectives equally']
      },
      'competing-accommodating': {
        compatibility: 'challenging',
        insight: 'One partner is assertive while the other yields. Ensure both voices are heard.',
        tips: ['Competing partner: Invite partner\'s input actively', 'Accommodating partner: Your needs matter too', 'Practice mutual submission']
      },
      'collaborating-collaborating': {
        compatibility: 'excellent',
        insight: 'Both partners value understanding and win-win solutions. Great foundation!',
        tips: ['Continue prioritizing mutual understanding', 'Don\'t over-analyze minor issues', 'Your natural compatibility is a blessing']
      },
      'collaborating-avoiding': {
        compatibility: 'moderate',
        insight: 'One seeks deep resolution while the other prefers peace. Balance depth with simplicity.',
        tips: ['Collaborating partner: Not every issue needs deep diving', 'Avoiding partner: Some issues need addressing', 'Agree on which conflicts need discussion']
      },
      'collaborating-compromising': {
        compatibility: 'good',
        insight: 'Both value resolution but through different means. Combine your strengths.',
        tips: ['Use collaboration for important issues', 'Use compromise for minor ones', 'Appreciate each other\'s approach']
      },
      'collaborating-accommodating': {
        compatibility: 'good',
        insight: 'One seeks mutual understanding while the other defers. Ensure balance.',
        tips: ['Collaborating partner: Draw out partner\'s true feelings', 'Accommodating partner: Share your perspective', 'True collaboration needs both voices']
      },
      'avoiding-avoiding': {
        compatibility: 'challenging',
        insight: 'Both partners avoid conflict. Issues may go unresolved.',
        tips: ['Practice gentle, loving confrontation', 'Remember: conflict can strengthen relationships', 'Set regular "check-in" times for discussions', 'Seek counseling if needed']
      },
      'avoiding-compromising': {
        compatibility: 'moderate',
        insight: 'One avoids while the other seeks middle ground. The compromiser may need to initiate.',
        tips: ['Compromising partner: Create safe space for discussion', 'Avoiding partner: Try small steps in expressing needs']
      },
      'avoiding-accommodating': {
        compatibility: 'challenging',
        insight: 'Both prefer peace over resolution. Important issues may be neglected.',
        tips: ['Both: Practice expressing needs lovingly', 'Your relationship needs honest communication', 'Consider couples counseling for guidance']
      },
      'compromising-compromising': {
        compatibility: 'good',
        insight: 'Both value fairness and balance. You work well together!',
        tips: ['Continue seeking win-win solutions', 'Remember: some issues need full resolution, not just middle ground', 'Your natural balance is a strength']
      },
      'compromising-accommodating': {
        compatibility: 'good',
        insight: 'One seeks fairness while the other yields. Ensure true fairness.',
        tips: ['Compromising partner: Make sure partner truly agrees', 'Accommodating partner: Speak up about your needs', 'True compromise requires both voices']
      },
      'accommodating-accommodating': {
        compatibility: 'challenging',
        insight: 'Both partners yield to each other. Decisions may be difficult.',
        tips: ['Both: Your needs are equally important', 'Practice expressing preferences', 'Take turns making decisions', 'Remember: healthy relationships need give AND take']
      }
    };

    const getCompatibilityKey = () => {
      const styles = [userStyle, partnerStyle].sort();
      return `${styles[0]}-${styles[1]}`;
    };

    const compKey = getCompatibilityKey();
    const compatibility = compatibilityInsights[compKey] || compatibilityInsights[`${userStyle}-${partnerStyle}`];

    const compatibilityColors: any = {
      excellent: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', badge: 'bg-green-500' },
      good: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-500' },
      moderate: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', badge: 'bg-yellow-500' },
      challenging: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', badge: 'bg-orange-500' }
    };

    const colors = compatibilityColors[compatibility.compatibility];

    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Conflict Style Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <p className="text-sm text-gray-600 mb-2">You</p>
                <p className="font-semibold text-purple-900">{styleNames[userStyle]}</p>
              </div>
              <div className="p-4 bg-violet-50 rounded-lg border-2 border-violet-200">
                <p className="text-sm text-gray-600 mb-2">{partner?.name}</p>
                <p className="font-semibold text-violet-900">{styleNames[partnerStyle]}</p>
              </div>
            </div>

            {match && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-900">You share the same conflict style!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`mb-6 ${colors.bg} border-2 ${colors.border}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className={`w-5 h-5 ${colors.text}`} />
                Compatibility Insight
              </CardTitle>
              <Badge className={`${colors.badge} capitalize`}>
                {compatibility.compatibility}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className={`${colors.text}`}>{compatibility.insight}</p>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Tips for Your Combination</h4>
              {compatibility.tips.map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-white rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-purple-700">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Score Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>All Styles Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.keys(styleNames).map((style) => {
                const userScore = userResult.result.scores[style];
                const partnerScore = partnerResult.result.scores[style];
                const userPercentage = (userScore / 20) * 100;
                const partnerPercentage = (partnerScore / 20) * 100;

                return (
                  <div key={style} className="space-y-2">
                    <h4 className="text-sm font-medium">{styleNames[style]}</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-24">You</span>
                        <Progress value={userPercentage} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-12 text-right">{userScore}/20</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-24">{partner?.name}</span>
                        <Progress value={partnerPercentage} className="h-2 flex-1" />
                        <span className="text-xs font-medium w-12 text-right">{partnerScore}/20</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 via-pink-50/20 to-blue-50/30">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Partner Comparison</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {quizType === 'loveLanguages' && renderLoveLanguagesComparison()}
        {quizType === 'faithJourney' && renderFaithJourneyComparison()}
        {quizType === 'conflictStyle' && renderConflictStyleComparison()}

        {/* Biblical Encouragement */}
        <Card className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-600" />
              Biblical Encouragement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium italic text-blue-900 mb-1">
                  "Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up."
                </p>
                <p className="text-xs text-blue-700">— Ecclesiastes 4:9-10</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Your differences are not weaknesses—they're opportunities to strengthen each other. As you learn to love, serve, and resolve conflicts in ways that honor both of you, your relationship becomes a beautiful reflection of Christ's love.
            </p>
          </CardContent>
        </Card>

        <Button onClick={onBack} className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600">
          Back to Quizzes
        </Button>
      </div>
    </div>
  );
}
