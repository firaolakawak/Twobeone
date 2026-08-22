import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Label } from './ui/label';
import { 
  ChevronLeft, 
  BookOpen, 
  Heart,
  Users,
  Sparkles,
  TrendingUp,
  Crown
} from 'lucide-react';

interface FaithJourneyQuizProps {
  existingResult?: any;
  onComplete: (result: any) => void;
  onBack: () => void;
}

const questions = [
  { q: "How often do you read the Bible?", options: ["Daily", "Several times a week", "Weekly", "Occasionally", "Rarely"], category: "scripture" },
  { q: "How would you describe your prayer life?", options: ["Very strong and consistent", "Growing stronger", "Inconsistent but trying", "Needs improvement", "Just starting"], category: "prayer" },
  { q: "Do you actively serve in your church or community?", options: ["Very actively", "Regularly", "Sometimes", "Rarely", "Not currently"], category: "service" },
  { q: "How comfortable are you sharing your faith with others?", options: ["Very comfortable", "Somewhat comfortable", "Neutral", "Uncomfortable", "Very uncomfortable"], category: "witness" },
  { q: "How often do you attend worship services?", options: ["Weekly or more", "2-3 times a month", "Monthly", "Occasionally", "Rarely"], category: "fellowship" },
  { q: "How well do you understand core biblical doctrines?", options: ["Very well", "Fairly well", "Somewhat", "Not much", "Just learning"], category: "knowledge" },
  { q: "Do you practice regular spiritual disciplines (fasting, meditation, etc.)?", options: ["Very regularly", "Often", "Sometimes", "Rarely", "Not yet"], category: "discipline" },
  { q: "How actively do you seek to grow in your faith?", options: ["Very actively", "Actively", "Moderately", "Somewhat", "Just beginning"], category: "growth" },
  { q: "Do you have a mentor or spiritual accountability partner?", options: ["Yes, actively meeting", "Yes, occasionally", "Seeking one", "No, but interested", "No"], category: "fellowship" },
  { q: "How do you handle spiritual doubts or questions?", options: ["Seek answers actively", "Discuss with others", "Pray about it", "Struggle alone", "Avoid thinking about it"], category: "growth" },
  { q: "Do you give financially to support God's work?", options: ["Regularly tithing", "Give regularly", "Give sometimes", "Give rarely", "Not currently"], category: "stewardship" },
  { q: "How often do you study the Bible in depth (not just reading)?", options: ["Daily", "Several times a week", "Weekly", "Monthly", "Rarely"], category: "scripture" },
  { q: "Do you pray with your partner regularly?", options: ["Daily", "Several times a week", "Weekly", "Occasionally", "Rarely"], category: "prayer" },
  { q: "How well do you apply biblical principles in daily life?", options: ["Very consistently", "Often", "Sometimes", "Struggling", "Just learning"], category: "application" },
  { q: "Are you involved in a small group or Bible study?", options: ["Very involved", "Regularly attend", "Occasionally attend", "Interested but not involved", "No"], category: "fellowship" },
  { q: "How do you respond when God's will differs from yours?", options: ["Submit willingly", "Submit after prayer", "Struggle but submit", "Find it difficult", "Still learning"], category: "surrender" },
  { q: "Do you seek God's guidance in major decisions?", options: ["Always", "Usually", "Sometimes", "Rarely", "Not consistently"], category: "prayer" },
  { q: "How would you rate your spiritual fruit (love, joy, peace, etc.)?", options: ["Very evident", "Growing", "Developing", "Inconsistent", "Just beginning"], category: "fruit" },
  { q: "Do you actively share your resources with those in need?", options: ["Very actively", "Often", "Sometimes", "Rarely", "Not currently"], category: "service" },
  { q: "How do you handle spiritual warfare and temptation?", options: ["Strong in the Lord", "Growing stronger", "Fighting actively", "Struggling", "Need help"], category: "discipline" },
  { q: "Are you intentional about memorizing Scripture?", options: ["Very intentional", "Regularly try", "Sometimes", "Rarely", "Not currently"], category: "scripture" },
  { q: "How well do you practice forgiveness?", options: ["Very well", "Working on it", "It's a struggle", "Find it difficult", "Need growth"], category: "fruit" },
  { q: "Do you worship God outside of church services?", options: ["Daily", "Often", "Sometimes", "Rarely", "Not regularly"], category: "worship" },
  { q: "How consistent is your spiritual life with your public testimony?", options: ["Very consistent", "Mostly consistent", "Working on it", "Inconsistent", "Struggling"], category: "integrity" },
  { q: "Are you open to God's correction and conviction?", options: ["Very open", "Usually", "Sometimes", "Resistant", "Struggle with it"], category: "surrender" }
];

const stages = {
  seeking: {
    name: "Seeking Seeker",
    range: [0, 50],
    icon: Heart,
    color: "from-warning-500 to-warning-500",
    description: "You're exploring faith and discovering God's love. This is a beautiful beginning!",
    scripture: {
      verse: "Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.",
      reference: "Matthew 7:7"
    },
    guidance: [
      "Start with reading the Gospel of John to learn about Jesus",
      "Find a Bible-teaching church where you feel welcomed",
      "Don't be afraid to ask questions - God welcomes seekers",
      "Consider starting with simple, daily prayers"
    ]
  },
  growing: {
    name: "Growing Believer",
    range: [51, 70],
    icon: TrendingUp,
    color: "from-success-500 to-success-700",
    description: "Your faith is taking root and growing stronger each day. Keep pursuing God!",
    scripture: {
      verse: "But grow in the grace and knowledge of our Lord and Savior Jesus Christ.",
      reference: "2 Peter 3:18"
    },
    guidance: [
      "Establish daily Bible reading and prayer habits",
      "Join a small group or Bible study for deeper learning",
      "Find a mentor who can guide your spiritual growth",
      "Begin serving in your church or community",
      "Practice sharing your faith story with others"
    ]
  },
  maturing: {
    name: "Maturing Disciple",
    range: [71, 85],
    icon: BookOpen,
    color: "from-sky-500 to-sky-500",
    description: "You're developing deep spiritual maturity and consistency. Your faith is bearing fruit!",
    scripture: {
      verse: "Therefore let us move beyond the elementary teachings about Christ and be taken forward to maturity.",
      reference: "Hebrews 6:1"
    },
    guidance: [
      "Mentor others who are earlier in their faith journey",
      "Deepen your theological understanding through study",
      "Take on greater leadership in ministry",
      "Practice advanced spiritual disciplines",
      "Pray for and pursue God's specific calling on your life"
    ]
  },
  leading: {
    name: "Spiritual Leader",
    range: [86, 100],
    icon: Crown,
    color: "from-primary-500 to-primary-600",
    description: "You demonstrate mature faith and actively disciple others. You're a spiritual leader!",
    scripture: {
      verse: "And the things you have heard me say in the presence of many witnesses entrust to reliable people who will also be qualified to teach others.",
      reference: "2 Timothy 2:2"
    },
    guidance: [
      "Continue pouring into others through mentorship",
      "Remain humble and keep growing - we never 'arrive'",
      "Pursue deeper intimacy with God through prayer",
      "Use your influence to multiply disciples",
      "Stay accountable and connected in community"
    ]
  }
};

export function FaithJourneyQuiz({ existingResult, onComplete, onBack }: FaithJourneyQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(!!existingResult);
  const [results, setResults] = useState(existingResult?.result);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  const calculateResults = (finalAnswers: number[]) => {
    const totalScore = finalAnswers.reduce((sum, score) => sum + score, 0);
    const maxScore = questions.length * 4; // 4 points max per question
    const percentage = (totalScore / maxScore) * 100;

    let stage: keyof typeof stages = 'seeking';
    for (const [key, value] of Object.entries(stages)) {
      if (percentage >= value.range[0] && percentage <= value.range[1]) {
        stage = key as keyof typeof stages;
        break;
      }
    }

    // Category breakdown
    const categoryScores: any = {};
    questions.forEach((q, i) => {
      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { total: 0, count: 0 };
      }
      categoryScores[q.category].total += finalAnswers[i];
      categoryScores[q.category].count++;
    });

    const categoryAverages = Object.entries(categoryScores).map(([cat, data]: [string, any]) => ({
      category: cat,
      percentage: (data.total / (data.count * 4)) * 100
    }));

    const resultData = {
      totalScore,
      maxScore,
      percentage: Math.round(percentage),
      stage,
      categoryAverages,
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
    const stageInfo = stages[results.stage as keyof typeof stages];
    const StageIcon = stageInfo.icon;

    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50/50 to-sky-50/50">
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 py-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Your Faith Journey</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
          {/* Main Result */}
          <Card className="mb-6 overflow-hidden border-sky-200">
            <div className={`h-2 bg-gradient-to-r ${stageInfo.color}`}></div>
            <CardHeader className="text-center pb-4">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${stageInfo.color} mb-4 mx-auto`}>
                <StageIcon className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl mb-2">Your Faith Stage</CardTitle>
              <h3 className={`text-3xl font-bold bg-gradient-to-r ${stageInfo.color} bg-clip-text text-transparent`}>
                {stageInfo.name}
              </h3>
              <div className="mt-4">
                <div className="text-4xl font-bold text-sky-600 mb-1">{results.percentage}%</div>
                <p className="text-sm text-muted-foreground">Spiritual Maturity Score</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">{stageInfo.description}</p>

              {/* Scripture */}
              <div className="p-4 bg-gradient-to-br from-sky-50 to-sky-100 rounded-lg border border-sky-200">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sky-700 italic mb-1">"{stageInfo.scripture.verse}"</p>
                    <p className="text-xs text-sky-700">— {stageInfo.scripture.reference}</p>
                  </div>
                </div>
              </div>

              {/* Guidance */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  Next Steps for Growth
                </h4>
                <div className="space-y-2">
                  {stageInfo.guidance.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-primary-50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-primary-700">{i + 1}</span>
                      </div>
                      <p className="text-sm text-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h4 className="font-semibold mb-3">Growth Areas</h4>
                <div className="space-y-3">
                  {results.categoryAverages
                    .sort((a: any, b: any) => b.percentage - a.percentage)
                    .map((cat: any) => (
                      <div key={cat.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{cat.category}</span>
                          <span className="font-medium">{Math.round(cat.percentage)}%</span>
                        </div>
                        <Progress value={cat.percentage} className="h-2" />
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Couple Growth */}
          <Card className="mb-6 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                Growing Together
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-card rounded-lg border">
                <p className="text-sm font-medium text-primary-900 mb-1">Pray together daily</p>
                <p className="text-sm text-muted-foreground">Couples who pray together grow stronger spiritually and relationally</p>
              </div>
              <div className="p-3 bg-card rounded-lg border">
                <p className="text-sm font-medium text-primary-900 mb-1">Study Scripture together</p>
                <p className="text-sm text-muted-foreground">Read and discuss the Bible with your partner to deepen both your faith</p>
              </div>
              <div className="p-3 bg-card rounded-lg border">
                <p className="text-sm font-medium text-primary-900 mb-1">Serve side by side</p>
                <p className="text-sm text-muted-foreground">Find ways to serve together in your church or community</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleRetake} variant="outline" className="flex-1">
              Retake Quiz
            </Button>
            <Button onClick={onBack} className={`flex-1 bg-gradient-to-r ${stageInfo.color}`}>
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
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 to-sky-50/50">
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Faith Journey Quiz</h1>
          <div className="w-10" />
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-sky-200">
          <CardHeader>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-sky-500 mb-4 mx-auto">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-center text-xl">{question.q}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option, index) => {
              const score = 4 - index; // 4, 3, 2, 1, 0
              return (
                <Button
                  key={index}
                  onClick={() => handleAnswer(score)}
                  className="w-full h-auto py-4 text-left justify-start bg-card hover:bg-sky-50 text-foreground border-2 border-border hover:border-sky-200"
                  variant="outline"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="font-semibold text-sky-600 text-sm">{index + 1}</span>
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}