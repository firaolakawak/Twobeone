import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { 
  ChevronLeft, 
  MessageCircle, 
  Shield,
  Handshake,
  Volume2,
  Heart,
  BookOpen,
  Sparkles
} from 'lucide-react';

interface ConflictStyleQuizProps {
  existingResult?: any;
  onComplete: (result: any) => void;
  onBack: () => void;
}

const questions = [
  { q: "When a disagreement starts, I usually...", options: ["Address it immediately", "Take time to think first", "Avoid confrontation", "Try to find middle ground", "Defer to my partner"], type: "approach" },
  { q: "During a conflict, my priority is...", options: ["Being heard", "Understanding my partner", "Maintaining peace", "Finding a solution", "Preserving the relationship"], type: "priority" },
  { q: "I feel most comfortable when conflicts are...", options: ["Resolved quickly", "Discussed thoroughly", "Minimized", "Compromised", "Let go"], type: "comfort" },
  { q: "When my partner is upset, I tend to...", options: ["State my perspective", "Listen carefully", "Give them space", "Suggest solutions", "Apologize to keep peace"], type: "response" },
  { q: "If we can't agree, I typically...", options: ["Stand my ground", "Keep discussing", "Drop the issue", "Meet halfway", "Let them decide"], type: "resolution" },
  { q: "My communication during conflict is...", options: ["Direct and assertive", "Thoughtful and measured", "Minimal and reserved", "Balanced and fair", "Gentle and yielding"], type: "style" },
  { q: "I believe conflicts should be...", options: ["Won with good arguments", "Understood deeply", "Avoided when possible", "Negotiated fairly", "Surrendered for harmony"], type: "belief" },
  { q: "When tensions rise, I...", options: ["Speak up louder", "Ask more questions", "Withdraw emotionally", "Propose compromises", "Stay calm and agreeable"], type: "tension" },
  { q: "After a disagreement, I need...", options: ["To be right", "To be understood", "Time alone", "A fair outcome", "Reassurance of love"], type: "needs" },
  { q: "My greatest fear in conflict is...", options: ["Losing the argument", "Being misunderstood", "Damaging the relationship", "Unfair outcomes", "Hurting my partner"], type: "fear" },
  { q: "I feel resolution happens when...", options: ["I win my point", "We both feel heard", "The conflict ends", "We compromise", "My partner is happy"], type: "resolution" },
  { q: "During disagreements, I value...", options: ["Being right", "Mutual understanding", "Peace and quiet", "Fairness", "Harmony"], type: "values" },
  { q: "If my partner raises their voice, I...", options: ["Raise mine too", "Stay calm and listen", "Shut down", "Request we both calm down", "Try to soothe them"], type: "response" },
  { q: "I approach conflicts with...", options: ["Confidence in my views", "Curiosity about theirs", "Reluctance and anxiety", "Openness to compromise", "Desire to please"], type: "approach" },
  { q: "My conflict goal is to...", options: ["Prove my point", "Achieve understanding", "Restore peace quickly", "Find a fair solution", "Make my partner happy"], type: "goal" },
  { q: "When we disagree on something important, I...", options: ["Defend my position strongly", "Seek to understand why", "Avoid discussing it", "Look for middle ground", "Consider their needs first"], type: "important" },
  { q: "I'm most frustrated when...", options: ["I'm not heard", "We don't connect", "Conflict continues", "Solutions are unfair", "My partner is upset"], type: "frustration" },
  { q: "My natural instinct in conflict is...", options: ["To fight for what I believe", "To understand the issue", "To flee or avoid", "To negotiate a deal", "To yield and adapt"], type: "instinct" },
  { q: "I think healthy conflict resolution means...", options: ["Winning the debate", "Deep connection", "No conflict at all", "Both sides satisfied", "Partner's happiness"], type: "healthy" },
  { q: "When conflict arises, my emotions are...", options: ["Intense and expressed", "Controlled and thoughtful", "Suppressed or hidden", "Balanced", "Focused on partner's feelings"], type: "emotions" }
];

const styles = {
  competing: {
    name: "Competing",
    icon: Volume2,
    color: "from-red-500 to-orange-500",
    description: "You're assertive and direct, preferring to stand firm on your convictions.",
    scripture: {
      verse: "Speaking the truth in love, we will grow to become in every respect the mature body of him who is the head, that is, Christ.",
      reference: "Ephesians 4:15"
    },
    strengths: [
      "You're honest and direct about your needs",
      "You don't avoid difficult conversations",
      "You stand up for what you believe is right"
    ],
    growthAreas: [
      "Practice listening without preparing your response",
      "Consider your partner's feelings before speaking",
      "Remember that being 'right' isn't always most important",
      "Ask questions to understand before asserting your view"
    ],
    biblicalGuidance: "While standing for truth is important, do so with gentleness. Remember Proverbs 15:1 - 'A gentle answer turns away wrath, but a harsh word stirs up anger.'"
  },
  collaborating: {
    name: "Collaborating",
    icon: Handshake,
    color: "from-green-500 to-emerald-500",
    description: "You seek to understand deeply and find solutions that satisfy both partners.",
    scripture: {
      verse: "How good and pleasant it is when God's people live together in unity!",
      reference: "Psalm 133:1"
    },
    strengths: [
      "You prioritize understanding before being understood",
      "You value both perspectives equally",
      "You're committed to win-win solutions"
    ],
    growthAreas: [
      "Remember that not every issue needs deep resolution",
      "Sometimes quick decisions are okay",
      "Don't over-analyze minor disagreements",
      "Balance thorough discussion with timely action"
    ],
    biblicalGuidance: "Your approach reflects Christ's heart for unity. Continue to 'make every effort to keep the unity of the Spirit through the bond of peace' (Ephesians 4:3)."
  },
  avoiding: {
    name: "Avoiding",
    icon: Shield,
    color: "from-blue-500 to-indigo-500",
    description: "You prefer to minimize conflict and maintain peace, sometimes at your own expense.",
    scripture: {
      verse: "If it is possible, as far as it depends on you, live at peace with everyone.",
      reference: "Romans 12:18"
    },
    strengths: [
      "You value peace and harmony",
      "You don't sweat the small stuff",
      "You give space when tensions are high"
    ],
    growthAreas: [
      "Speak up about your needs - they matter to God and your partner",
      "Healthy conflict can strengthen relationships",
      "Avoiding issues doesn't make them disappear",
      "Practice expressing concerns in a gentle, loving way"
    ],
    biblicalGuidance: "While peacemaking is blessed (Matthew 5:9), hiding your true feelings isn't healthy. 'Speaking the truth in love' (Ephesians 4:15) means honest, kind communication."
  },
  compromising: {
    name: "Compromising",
    icon: Handshake,
    color: "from-purple-500 to-violet-500",
    description: "You seek balanced solutions where both partners give and take fairly.",
    scripture: {
      verse: "Do nothing out of selfish ambition or vain conceit. Rather, in humility value others above yourselves.",
      reference: "Philippians 2:3"
    },
    strengths: [
      "You value fairness and equity",
      "You're willing to meet in the middle",
      "You find practical solutions quickly"
    ],
    growthAreas: [
      "Sometimes one perspective is objectively better",
      "Compromise isn't always the answer - seek God's wisdom",
      "Don't sacrifice important values for 'fairness'",
      "Some issues need full resolution, not just middle ground"
    ],
    biblicalGuidance: "Your fairness reflects God's justice. But remember - seek His will first, not just what seems fair. 'Seek first his kingdom and his righteousness' (Matthew 6:33)."
  },
  accommodating: {
    name: "Accommodating",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    description: "You prioritize your partner's happiness and often yield to maintain harmony.",
    scripture: {
      verse: "Submit to one another out of reverence for Christ.",
      reference: "Ephesians 5:21"
    },
    strengths: [
      "You're selfless and considerate",
      "You value your partner's happiness",
      "You maintain a peaceful atmosphere"
    ],
    growthAreas: [
      "Your needs and feelings are equally important",
      "Chronic self-sacrifice can breed resentment",
      "Speak your truth with love - your partner wants to know you",
      "Healthy relationships require mutual give and take"
    ],
    biblicalGuidance: "While submission is biblical, so is mutual submission (Ephesians 5:21). God values YOU - your thoughts, feelings, and needs. Don't lose yourself trying to please others."
  }
};

export function ConflictStyleQuiz({ existingResult, onComplete, onBack }: ConflictStyleQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(!!existingResult);
  const [results, setResults] = useState(existingResult?.result);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  const calculateResults = (finalAnswers: number[]) => {
    const scores = { competing: 0, collaborating: 0, avoiding: 0, compromising: 0, accommodating: 0 };
    const styleMap = ['competing', 'collaborating', 'avoiding', 'compromising', 'accommodating'];

    finalAnswers.forEach((answer) => {
      const style = styleMap[answer];
      scores[style as keyof typeof scores]++;
    });

    const sortedStyles = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([style]) => style);

    const resultData = {
      scores,
      style: sortedStyles[0],
      secondary: sortedStyles[1],
      ranking: sortedStyles,
      completedAt: new Date().toISOString()
    };

    setResults(resultData);
    setShowResults(true);
    onComplete(resultData);
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setResults(null);
  };

  if (showResults && results) {
    const styleInfo = styles[results.style as keyof typeof styles];
    const StyleIcon = styleInfo.icon;
    const secondaryStyle = styles[results.secondary as keyof typeof styles];

    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50/50 to-violet-50/50">
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Your Conflict Style</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
          {/* Primary Style */}
          <Card className="mb-6 overflow-hidden border-purple-200">
            <div className={`h-2 bg-gradient-to-r ${styleInfo.color}`}></div>
            <CardHeader className="text-center pb-4">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${styleInfo.color} mb-4 mx-auto`}>
                <StyleIcon className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl mb-2">Your Primary Conflict Style</CardTitle>
              <h3 className={`text-3xl font-bold bg-gradient-to-r ${styleInfo.color} bg-clip-text text-transparent`}>
                {styleInfo.name}
              </h3>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-600">{styleInfo.description}</p>

              {/* Scripture */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 italic mb-1">"{styleInfo.scripture.verse}"</p>
                    <p className="text-xs text-blue-700">— {styleInfo.scripture.reference}</p>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                  <Sparkles className="w-5 h-5" />
                  Your Strengths
                </h4>
                <div className="space-y-2">
                  {styleInfo.strengths.map((strength, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2"></div>
                      <p className="text-sm text-gray-700">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Areas */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-700">
                  <Sparkles className="w-5 h-5" />
                  Growth Opportunities
                </h4>
                <div className="space-y-2">
                  {styleInfo.growthAreas.map((area, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-purple-700">{i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700">{area}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Biblical Guidance */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">Biblical Guidance</h4>
                    <p className="text-sm text-gray-700">{styleInfo.biblicalGuidance}</p>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div>
                <h4 className="font-semibold mb-3">All Conflict Styles</h4>
                <div className="space-y-3">
                  {Object.entries(results.scores)
                    .sort(([, a]: any, [, b]: any) => b - a)
                    .map(([style, score]: [string, any]) => {
                      const StyleInfo = styles[style as keyof typeof styles];
                      const StyleIconSmall = StyleInfo.icon;
                      const percentage = (score / questions.length) * 100;
                      return (
                        <div key={style} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <StyleIconSmall className="w-4 h-4 text-purple-600" />
                              <span>{StyleInfo.name}</span>
                            </div>
                            <span className="font-medium">{score}/{questions.length}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Style */}
          <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Your Secondary Style: {secondaryStyle.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{secondaryStyle.description}</p>
              <p className="text-sm text-gray-700">You also use this style, especially in certain situations. Being aware of both styles helps you navigate conflicts more effectively.</p>
            </CardContent>
          </Card>

          {/* Couple Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600" />
                Growing Together in Conflict
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-pink-50 rounded-lg">
                <p className="text-sm font-medium text-pink-900 mb-1">Pray before difficult conversations</p>
                <p className="text-sm text-gray-600">Ask God for wisdom, patience, and love</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Use "I feel" statements</p>
                <p className="text-sm text-gray-600">Share your emotions without blaming your partner</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900 mb-1">Take breaks when needed</p>
                <p className="text-sm text-gray-600">It's okay to pause and return when emotions settle</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-1">Remember you're on the same team</p>
                <p className="text-sm text-gray-600">The goal is understanding, not winning</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleRetake} variant="outline" className="flex-1">
              Retake Quiz
            </Button>
            <Button onClick={onBack} className={`flex-1 bg-gradient-to-r ${styleInfo.color}`}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 to-violet-50/50">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Conflict Style Quiz</h1>
          <div className="w-10" />
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 mb-4 mx-auto">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-center text-xl">{question.q}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswer(index)}
                className="w-full h-auto py-4 text-left justify-start bg-white hover:bg-purple-50 text-gray-900 border-2 border-gray-200 hover:border-purple-300"
                variant="outline"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="font-semibold text-purple-600 text-sm">{index + 1}</span>
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}