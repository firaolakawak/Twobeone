import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { 
  ChevronLeft, 
  Heart, 
  Gift, 
  Clock, 
  MessageCircle, 
  HandHeart,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface LoveLanguagesQuizProps {
  existingResult?: any;
  onComplete: (result: any) => void;
  onBack: () => void;
}

const questions = [
  { q: "I feel most loved when my partner...", a1: "Tells me they love me", a2: "Gives me a thoughtful gift", type: "WA-GT" },
  { q: "What makes me feel appreciated is...", a1: "Quality time together", a2: "Physical touch and affection", type: "QT-PT" },
  { q: "I prefer to receive...", a1: "Encouraging words", a2: "Help with tasks", type: "WA-AS" },
  { q: "I feel closest to my partner when...", a1: "We're doing something together", a2: "They hold my hand or hug me", type: "QT-PT" },
  { q: "I most appreciate when my partner...", a1: "Helps me with my responsibilities", a2: "Surprises me with a gift", type: "AS-GT" },
  { q: "I feel loved when my partner...", a1: "Compliments me", a2: "Spends uninterrupted time with me", type: "WA-QT" },
  { q: "What matters most to me is...", a1: "Physical affection", a2: "Receiving thoughtful presents", type: "PT-GT" },
  { q: "I value when my partner...", a1: "Does things to help me", a2: "Gives me words of encouragement", type: "AS-WA" },
  { q: "I feel special when my partner...", a1: "Brings me gifts", a2: "Touches me affectionately", type: "GT-PT" },
  { q: "I appreciate most when my partner...", a1: "Gives me their full attention", a2: "Praises my achievements", type: "QT-WA" },
  { q: "I feel most connected when...", a1: "My partner helps me", a2: "We cuddle or embrace", type: "AS-PT" },
  { q: "I prefer to receive...", a1: "A heartfelt note", a2: "Help with my projects", type: "WA-AS" },
  { q: "I feel loved when my partner...", a1: "Spends quality time with me", a2: "Gives me a meaningful gift", type: "QT-GT" },
  { q: "What speaks love to me is...", a1: "Physical closeness", a2: "Words of affirmation", type: "PT-WA" },
  { q: "I value when my partner...", a1: "Gives me presents", a2: "Serves me by doing tasks", type: "GT-AS" },
  { q: "I feel appreciated when...", a1: "My partner compliments me", a2: "We spend time together", type: "WA-QT" },
  { q: "I most enjoy when my partner...", a1: "Touches me lovingly", a2: "Helps me accomplish goals", type: "PT-AS" },
  { q: "I prefer when my partner...", a1: "Buys me something special", a2: "Spends focused time with me", type: "GT-QT" },
  { q: "I feel secure when my partner...", a1: "Verbally expresses love", a2: "Holds me close", type: "WA-PT" },
  { q: "I appreciate most when my partner...", a1: "Does acts of service", a2: "Gives me gifts", type: "AS-GT" },
  { q: "I feel loved when my partner...", a1: "Listens to me attentively", a2: "Praises me publicly", type: "QT-WA" },
  { q: "What matters to me is...", a1: "Physical affection", a2: "Helpful actions", type: "PT-AS" },
  { q: "I value when my partner...", a1: "Surprises me with presents", a2: "Encourages me with words", type: "GT-WA" },
  { q: "I feel cherished when...", a1: "We spend quality time together", a2: "My partner touches me", type: "QT-PT" },
  { q: "I prefer when my partner...", a1: "Helps me with chores", a2: "Gives me thoughtful gifts", type: "AS-GT" },
  { q: "I feel most loved when my partner...", a1: "Affirms me verbally", a2: "Plans quality time for us", type: "WA-QT" },
  { q: "What speaks love to me is...", a1: "Physical touch", a2: "Receiving gifts", type: "PT-GT" },
  { q: "I appreciate when my partner...", a1: "Does things to help me", a2: "Speaks encouraging words", type: "AS-WA" },
  { q: "I feel connected when...", a1: "My partner gives me presents", a2: "We have physical closeness", type: "GT-PT" },
  { q: "I value most when my partner...", a1: "Spends undivided time with me", a2: "Compliments me", type: "QT-WA" }
];

const loveLanguages = {
  WA: { name: "Words of Affirmation", icon: MessageCircle, description: "You value verbal expressions of love and appreciation" },
  QT: { name: "Quality Time", icon: Clock, description: "You feel loved through focused, uninterrupted time together" },
  GT: { name: "Receiving Gifts", icon: Gift, description: "You appreciate thoughtful gifts as symbols of love" },
  AS: { name: "Acts of Service", icon: HandHeart, description: "You feel loved when your partner helps you with tasks" },
  PT: { name: "Physical Touch", icon: Heart, description: "You value physical expressions of affection and closeness" }
};

const scriptureInsights = {
  WA: {
    verse: "Pleasant words are a honeycomb, sweet to the soul and healing to the bones.",
    reference: "Proverbs 16:24",
    guidance: "God speaks life through words. Encourage your partner with affirming, uplifting words daily. Speak truth, appreciation, and love."
  },
  QT: {
    verse: "Two are better than one, because they have a good return for their labor.",
    reference: "Ecclesiastes 4:9",
    guidance: "God values togetherness. Set aside intentional time to connect, free from distractions. Be fully present with your partner."
  },
  GT: {
    verse: "Every good and perfect gift is from above, coming down from the Father.",
    reference: "James 1:17",
    guidance: "Giving reflects God's generous nature. Choose thoughtful gifts that show you know and treasure your partner's heart."
  },
  AS: {
    verse: "Serve one another humbly in love.",
    reference: "Galatians 5:13",
    guidance: "Christ served others sacrificially. Look for practical ways to ease your partner's burdens and demonstrate Christ's love through action."
  },
  PT: {
    verse: "Greet one another with a holy kiss.",
    reference: "Romans 16:16",
    guidance: "Physical touch is a gift from God. Express affection appropriately and frequently. A hug, hand-hold, or gentle touch communicates care."
  }
};

export function LoveLanguagesQuiz({ existingResult, onComplete, onBack }: LoveLanguagesQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(!!existingResult);
  const [results, setResults] = useState(existingResult?.result);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (choice: string) => {
    const newAnswers = [...answers, choice];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  const calculateResults = (finalAnswers: string[]) => {
    const scores: any = { WA: 0, QT: 0, GT: 0, AS: 0, PT: 0 };

    finalAnswers.forEach((answer, index) => {
      const [lang1, lang2] = questions[index].type.split('-');
      if (answer === 'a1') {
        scores[lang1]++;
      } else {
        scores[lang2]++;
      }
    });

    const sortedLanguages = Object.entries(scores)
      .sort(([, a]: any, [, b]: any) => b - a)
      .map(([lang]) => lang);

    const resultData = {
      scores,
      primary: sortedLanguages[0],
      secondary: sortedLanguages[1],
      ranking: sortedLanguages,
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
    const PrimaryIcon = loveLanguages[results.primary as keyof typeof loveLanguages].icon;
    const SecondaryIcon = loveLanguages[results.secondary as keyof typeof loveLanguages].icon;
    const primaryInsight = scriptureInsights[results.primary as keyof typeof scriptureInsights];

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50/50 to-rose-50/50">
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Your Love Language</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
          {/* Primary Love Language */}
          <Card className="mb-6 overflow-hidden border-pink-200">
            <div className="h-2 bg-gradient-to-r from-pink-500 to-rose-500"></div>
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 mb-4 mx-auto">
                <PrimaryIcon className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl mb-2">Your Primary Love Language</CardTitle>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                {loveLanguages[results.primary as keyof typeof loveLanguages].name}
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                {loveLanguages[results.primary as keyof typeof loveLanguages].description}
              </p>

              {/* Scripture Insight */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 italic mb-1">"{primaryInsight.verse}"</p>
                    <p className="text-xs text-blue-700">— {primaryInsight.reference}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{primaryInsight.guidance}</p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-center">All Love Languages</h4>
                {Object.entries(results.scores)
                  .sort(([, a]: any, [, b]: any) => b - a)
                  .map(([lang, score]: [string, any]) => {
                    const LangIcon = loveLanguages[lang as keyof typeof loveLanguages].icon;
                    const percentage = (score / questions.length) * 100;
                    return (
                      <div key={lang} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <LangIcon className="w-4 h-4 text-pink-600" />
                            <span>{loveLanguages[lang as keyof typeof loveLanguages].name}</span>
                          </div>
                          <span className="font-medium">{score}/{questions.length}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Secondary Love Language */}
          <Card className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SecondaryIcon className="w-5 h-5 text-purple-600" />
                Your Secondary Love Language
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="font-semibold text-lg text-purple-900 mb-2">
                {loveLanguages[results.secondary as keyof typeof loveLanguages].name}
              </h4>
              <p className="text-sm text-gray-600">
                {loveLanguages[results.secondary as keyof typeof loveLanguages].description}
              </p>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600" />
                Growing Together
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-pink-50 rounded-lg">
                <p className="text-sm font-medium text-pink-900 mb-1">Share with your partner</p>
                <p className="text-sm text-gray-600">Help your partner understand how you feel most loved</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Learn their language</p>
                <p className="text-sm text-gray-600">Ask your partner to take this quiz and compare results</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900 mb-1">Practice intentionally</p>
                <p className="text-sm text-gray-600">Regularly express love in your partner's primary language</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleRetake} variant="outline" className="flex-1">
              Retake Quiz
            </Button>
            <Button onClick={onBack} className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const types = question.type.split('-');

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/50 to-rose-50/50">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Love Languages Quiz</h1>
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
        <Card className="border-pink-200">
          <CardHeader>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 mb-4 mx-auto">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-center text-xl">{question.q}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleAnswer('a1')}
              className="w-full h-auto py-6 text-left justify-start bg-white hover:bg-pink-50 text-gray-900 border-2 border-gray-200 hover:border-pink-300"
              variant="outline"
            >
              <div className="flex items-start gap-3 w-full">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-semibold text-pink-600">A</span>
                </div>
                <span className="flex-1 text-base">{question.a1}</span>
              </div>
            </Button>

            <Button
              onClick={() => handleAnswer('a2')}
              className="w-full h-auto py-6 text-left justify-start bg-white hover:bg-rose-50 text-gray-900 border-2 border-gray-200 hover:border-rose-300"
              variant="outline"
            >
              <div className="flex items-start gap-3 w-full">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-semibold text-rose-600">B</span>
                </div>
                <span className="flex-1 text-base">{question.a2}</span>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}