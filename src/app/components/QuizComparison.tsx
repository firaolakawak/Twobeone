import { useUiCopy } from '../utils/uiTranslation';
import { guidanceMessages } from '../locales/guidance';
import { BackButton } from './BackButton';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
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
  const tr = useUiCopy(guidanceMessages);
  if (!userResult || !partnerResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50/30 to-primary-50/30">
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-4">
            <BackButton label={tr("Back to Quizzes")} onClick={onBack} />
            <h1 className="tbo-page-title min-w-0 break-words">{tr("Partner Comparison")}</h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="tbo-section-title mb-2">{tr("Comparison Not Available")}</h2>
          <p className="tbo-body text-muted-foreground mb-6">
            {!partner 
              ? tr("You need to connect with a partner first.")
              : tr("Your partner hasn't completed this quiz yet.")}
          </p>
          <BackButton label={tr("Back to Quizzes")} onClick={onBack} showLabel />
        </div>
      </div>
    );
  }

  const renderLoveLanguagesComparison = () => {
    const userPrimary = userResult.result.primary;
    const partnerPrimary = partnerResult.result.primary;
    const match = userPrimary === partnerPrimary;

    const loveLanguageNames: any = {
      WA: tr("Words of Affirmation"),
      QT: tr("Quality Time"),
      GT: tr("Receiving Gifts"),
      AS: tr("Acts of Service"),
      PT: tr("Physical Touch")
    };

    const insights = {
      same: {
        title: tr("Perfect Match!"),
        description: tr("You both share the same primary love language. This means you naturally understand how each other gives and receives love."),
        tips: [
          tr("Continue expressing love in ways that resonate with both of you"),
          tr("Be mindful not to neglect other love languages entirely"),
          tr("Your natural understanding is a gift - use it to deepen your bond")
        ]
      },
      different: {
        title: tr("Complementary Match"),
        description: tr("You have different primary love languages. This is an opportunity to grow by learning to love your partner in their language."),
        tips: [
          tr("You feel loved through {yourLanguage}, but your partner through {partnerLanguage}", { yourLanguage: loveLanguageNames[userPrimary], partnerLanguage: loveLanguageNames[partnerPrimary] }),
          tr("Make intentional effort to express love in your partner's language"),
          tr("Communicate openly about what makes you each feel most loved"),
          tr("Use this difference as a chance to expand your capacity for love")
        ]
      }
    };

    const currentInsight = match ? insights.same : insights.different;

    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="tbo-card-title flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-600" />{tr("Love Language Comparison")} </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                <p className="tbo-supporting text-muted-foreground mb-2">{tr("You")}</p>
                <p className="tbo-body text-primary-900">{loveLanguageNames[userPrimary]}</p>
              </div>
              <div className="p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                <p className="tbo-supporting text-muted-foreground mb-2">{partner?.name}</p>
                <p className="tbo-body text-primary-900">{loveLanguageNames[partnerPrimary]}</p>
              </div>
            </div>

            {match && (
              <div className="p-4 bg-success-50 rounded-lg border border-success-500/30 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success-700 flex-shrink-0" />
                <p className="tbo-supporting text-success-700">{tr("You share the same primary love language!")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 bg-gradient-to-br from-primary-50 to-primary-100">
          <CardHeader>
            <CardTitle className="tbo-card-title flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              {currentInsight.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="tbo-body text-foreground">{currentInsight.description}</p>
            <div className="space-y-2">
              {currentInsight.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-card rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="tbo-caption text-primary-700">{i + 1}</span>
                  </div>
                  <p className="tbo-supporting text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Score Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="tbo-card-title">{tr("Detailed Comparison")}</CardTitle>
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
                    <h4 className="tbo-card-title">{loveLanguageNames[lang]}</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="tbo-caption text-muted-foreground w-24">{tr("You")}</span>
                        <Progress value={userPercentage} className="h-2 flex-1" />
                        <span className="tbo-caption w-12 text-right">{userScore}/30</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="tbo-caption text-muted-foreground w-24">{partner?.name}</span>
                        <Progress value={partnerPercentage} className="h-2 flex-1" />
                        <span className="tbo-caption w-12 text-right">{partnerScore}/30</span>
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
      seeking: tr("Seeking Seeker"),
      growing: tr("Growing Believer"),
      maturing: tr("Maturing Disciple"),
      leading: tr("Spiritual Leader")
    };

    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="tbo-card-title flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-600" />{tr("Faith Journey Comparison")} </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-sky-50 rounded-lg border-2 border-sky-200 text-center">
                <p className="tbo-supporting text-muted-foreground mb-2">{tr("You")}</p>
                <p className="text-3xl font-bold text-sky-600 mb-1">{userPercentage}%</p>
                <p className="tbo-supporting text-sky-700">{stageNames[userStage]}</p>
              </div>
              <div className="p-4 bg-sky-50 rounded-lg border-2 border-sky-200 text-center">
                <p className="tbo-supporting text-muted-foreground mb-2">{partner?.name}</p>
                <p className="text-3xl font-bold text-sky-600 mb-1">{partnerPercentage}%</p>
                <p className="tbo-supporting text-sky-900">{stageNames[partnerStage]}</p>
              </div>
            </div>

            {difference <= 15 && (
              <div className="p-4 bg-success-50 rounded-lg border border-success-500/30 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success-700 flex-shrink-0" />
                <p className="tbo-supporting text-success-700">{tr("You're at similar faith stages - great for growing together!")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 bg-gradient-to-br from-sky-50 to-sky-100">
          <CardHeader>
            <CardTitle className="tbo-card-title flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />{tr("Growing Together")} </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="tbo-body text-foreground mb-3">
              {difference <= 15 
                ? tr("You're at similar points in your faith journey. Use this as an opportunity to grow together and encourage each other.")
                : tr("You're at different stages in your faith journey. This is an opportunity to learn from each other and grow together.")}
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-card rounded-lg">
                <p className="tbo-supporting text-sky-700 mb-1">{tr("Pray together daily")}</p>
                <p className="tbo-supporting text-muted-foreground">{tr("Strengthen your spiritual bond through shared prayer time")}</p>
              </div>
              <div className="p-3 bg-card rounded-lg">
                <p className="tbo-supporting text-sky-700 mb-1">{tr("Study Scripture together")}</p>
                <p className="tbo-supporting text-muted-foreground">{tr("Choose a book of the Bible or devotional to go through as a couple")}</p>
              </div>
              <div className="p-3 bg-card rounded-lg">
                <p className="tbo-supporting text-sky-700 mb-1">{tr("Serve together")}</p>
                <p className="tbo-supporting text-muted-foreground">{tr("Find a ministry or cause where you can serve side by side")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="tbo-card-title">{tr("Growth Area Comparison")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userResult.result.categoryAverages.map((userCat: any) => {
                const partnerCat = partnerResult.result.categoryAverages.find((c: any) => c.category === userCat.category);

                return (
                  <div key={userCat.category} className="space-y-2">
                    <h4 className="tbo-card-title capitalize">{tr(userCat.category)}</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="tbo-caption text-muted-foreground w-24">{tr("You")}</span>
                        <Progress value={userCat.percentage} className="h-2 flex-1" />
                        <span className="tbo-caption w-12 text-right">{Math.round(userCat.percentage)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="tbo-caption text-muted-foreground w-24">{partner?.name}</span>
                        <Progress value={partnerCat?.percentage || 0} className="h-2 flex-1" />
                        <span className="tbo-caption w-12 text-right">{Math.round(partnerCat?.percentage || 0)}%</span>
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
      competing: tr("Competing"),
      collaborating: tr("Collaborating"),
      avoiding: tr("Avoiding"),
      compromising: tr("Compromising"),
      accommodating: tr("Accommodating")
    };

    const compatibilityInsights: any = {
      'competing-competing': {
        compatibility: 'challenging',
        insight: tr("Both partners prefer to be direct and assertive. This can lead to power struggles."),
        tips: [tr("Practice active listening"), tr("Take turns being the \"decision maker\""), tr("Learn to yield sometimes"), tr("Remember you're on the same team")]
      },
      'competing-collaborating': {
        compatibility: 'good',
        insight: tr("One partner is direct while the other seeks understanding. Balance assertion with patience."),
        tips: [tr("Competing partner: Slow down and listen"), tr("Collaborating partner: Don't over-analyze"), tr("Find a middle ground between speed and thoroughness")]
      },
      'competing-avoiding': {
        compatibility: 'challenging',
        insight: tr("One partner confronts while the other withdraws. This can create frustration."),
        tips: [tr("Competing partner: Create safe space for discussion"), tr("Avoiding partner: Practice expressing concerns"), tr("Set gentle ground rules for conflicts")]
      },
      'competing-compromising': {
        compatibility: 'moderate',
        insight: tr("One seeks to win while the other seeks fairness. Learn from each other."),
        tips: [tr("Recognize when winning matters vs. when compromise is better"), tr("Value both perspectives equally")]
      },
      'competing-accommodating': {
        compatibility: 'challenging',
        insight: tr("One partner is assertive while the other yields. Ensure both voices are heard."),
        tips: [tr("Competing partner: Invite partner's input actively"), tr("Accommodating partner: Your needs matter too"), tr("Practice mutual submission")]
      },
      'collaborating-collaborating': {
        compatibility: 'excellent',
        insight: tr("Both partners value understanding and win-win solutions. Great foundation!"),
        tips: [tr("Continue prioritizing mutual understanding"), tr("Don't over-analyze minor issues"), tr("Your natural compatibility is a blessing")]
      },
      'collaborating-avoiding': {
        compatibility: 'moderate',
        insight: tr("One seeks deep resolution while the other prefers peace. Balance depth with simplicity."),
        tips: [tr("Collaborating partner: Not every issue needs deep diving"), tr("Avoiding partner: Some issues need addressing"), tr("Agree on which conflicts need discussion")]
      },
      'collaborating-compromising': {
        compatibility: 'good',
        insight: tr("Both value resolution but through different means. Combine your strengths."),
        tips: [tr("Use collaboration for important issues"), tr("Use compromise for minor ones"), tr("Appreciate each other's approach")]
      },
      'collaborating-accommodating': {
        compatibility: 'good',
        insight: tr("One seeks mutual understanding while the other defers. Ensure balance."),
        tips: [tr("Collaborating partner: Draw out partner's true feelings"), tr("Accommodating partner: Share your perspective"), tr("True collaboration needs both voices")]
      },
      'avoiding-avoiding': {
        compatibility: 'challenging',
        insight: tr("Both partners avoid conflict. Issues may go unresolved."),
        tips: [tr("Practice gentle, loving confrontation"), tr("Remember: conflict can strengthen relationships"), tr("Set regular \"check-in\" times for discussions"), tr("Seek counseling if needed")]
      },
      'avoiding-compromising': {
        compatibility: 'moderate',
        insight: tr("One avoids while the other seeks middle ground. The compromiser may need to initiate."),
        tips: [tr("Compromising partner: Create safe space for discussion"), tr("Avoiding partner: Try small steps in expressing needs")]
      },
      'avoiding-accommodating': {
        compatibility: 'challenging',
        insight: tr("Both prefer peace over resolution. Important issues may be neglected."),
        tips: [tr("Both: Practice expressing needs lovingly"), tr("Your relationship needs honest communication"), tr("Consider couples counseling for guidance")]
      },
      'compromising-compromising': {
        compatibility: 'good',
        insight: tr("Both value fairness and balance. You work well together!"),
        tips: [tr("Continue seeking win-win solutions"), tr("Remember: some issues need full resolution, not just middle ground"), tr("Your natural balance is a strength")]
      },
      'compromising-accommodating': {
        compatibility: 'good',
        insight: tr("One seeks fairness while the other yields. Ensure true fairness."),
        tips: [tr("Compromising partner: Make sure partner truly agrees"), tr("Accommodating partner: Speak up about your needs"), tr("True compromise requires both voices")]
      },
      'accommodating-accommodating': {
        compatibility: 'challenging',
        insight: tr("Both partners yield to each other. Decisions may be difficult."),
        tips: [tr("Both: Your needs are equally important"), tr("Practice expressing preferences"), tr("Take turns making decisions"), tr("Remember: healthy relationships need give AND take")]
      }
    };

    const getCompatibilityKey = () => {
      const styles = [userStyle, partnerStyle].sort();
      return `${styles[0]}-${styles[1]}`;
    };

    const compKey = getCompatibilityKey();
    const compatibility = compatibilityInsights[compKey] || compatibilityInsights[`${userStyle}-${partnerStyle}`];

    const compatibilityColors: any = {
      excellent: { bg: 'bg-success-50', border: 'border-success-500/30', text: 'text-success-700', badge: 'bg-success-500' },
      good: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', badge: 'bg-sky-500' },
      moderate: { bg: 'bg-warning-50', border: 'border-warning-500/30', text: 'text-warning-700', badge: 'bg-warning-500' },
      challenging: { bg: 'bg-warning-50', border: 'border-warning-500/30', text: 'text-warning-700', badge: 'bg-warning-500' }
    };

    const colors = compatibilityColors[compatibility.compatibility];

    return (
      <>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="tbo-card-title flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />{tr("Conflict Style Comparison")} </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                <p className="tbo-supporting text-muted-foreground mb-2">{tr("You")}</p>
                <p className="tbo-body text-primary-900">{styleNames[userStyle]}</p>
              </div>
              <div className="p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
                <p className="tbo-supporting text-muted-foreground mb-2">{partner?.name}</p>
                <p className="tbo-body text-primary-900">{styleNames[partnerStyle]}</p>
              </div>
            </div>

            {match && (
              <div className="p-4 bg-success-50 rounded-lg border border-success-500/30 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success-700 flex-shrink-0" />
                <p className="tbo-supporting text-success-700">{tr("You share the same conflict style!")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`mb-6 ${colors.bg} border-2 ${colors.border}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="tbo-card-title flex items-center gap-2">
                <TrendingUp className={`w-5 h-5 ${colors.text}`} />{tr("Compatibility Insight")} </CardTitle>
              <Badge className={`tbo-caption ${colors.badge} capitalize`}>
                {tr(compatibility.compatibility)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className={`tbo-body ${colors.text}`}>{compatibility.insight}</p>
            <div className="space-y-2">
              <h4 className="tbo-card-title">{tr("Tips for Your Combination")}</h4>
              {compatibility.tips.map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-card rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="tbo-caption text-primary-700">{i + 1}</span>
                  </div>
                  <p className="tbo-supporting text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Score Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="tbo-card-title">{tr("All Styles Comparison")}</CardTitle>
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
                    <h4 className="tbo-card-title">{styleNames[style]}</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="tbo-caption text-muted-foreground w-24">{tr("You")}</span>
                        <Progress value={userPercentage} className="h-2 flex-1" />
                        <span className="tbo-caption w-12 text-right">{userScore}/20</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="tbo-caption text-muted-foreground w-24">{partner?.name}</span>
                        <Progress value={partnerPercentage} className="h-2 flex-1" />
                        <span className="tbo-caption w-12 text-right">{partnerScore}/20</span>
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
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 via-primary-50/20 to-sky-50/30">
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-4">
          <BackButton label={tr("Back to Quizzes")} onClick={onBack} />
          <h1 className="tbo-page-title min-w-0 break-words">{tr("Partner Comparison")}</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {quizType === 'loveLanguages' && renderLoveLanguagesComparison()}
        {quizType === 'faithJourney' && renderFaithJourneyComparison()}
        {quizType === 'conflictStyle' && renderConflictStyleComparison()}

        {/* Biblical Encouragement */}
        <Card className="mt-6 bg-gradient-to-br from-sky-50 to-primary-50 border-sky-200">
          <CardHeader>
            <CardTitle className="tbo-card-title flex items-center gap-2">
              <Heart className="w-5 h-5 text-sky-600" />{tr("Biblical Encouragement")} </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
              <BookOpen className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="tbo-supporting italic text-sky-700 mb-1">"Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up." </p>
                <p className="tbo-caption text-sky-700">— Ecclesiastes 4:9-10</p>
              </div>
            </div>
            <p className="tbo-supporting text-foreground">{tr("Your differences are not weaknesses—they're opportunities to strengthen each other. As you learn to love, serve, and resolve conflicts in ways that honor both of you, your relationship becomes a beautiful reflection of Christ's love.")} </p>
          </CardContent>
        </Card>

        <BackButton label={tr("Back to Quizzes")} onClick={onBack} showLabel className="mt-6" />
      </div>
    </div>
  );
}
