import { Heart, MessageCircle, Sparkles, Star, Users, Brain } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface Quiz {
  id: string;
  title: string;
  description: string;
  icon: any;
  questions: number;
  duration: string;
  completed?: boolean;
  score?: number;
  color: string;
}

interface QuizHubProps {
  onQuizStart: (quizId: string) => void;
}

export function QuizHub({ onQuizStart }: QuizHubProps) {
  const quizzes: Quiz[] = [
    {
      id: 'love-languages',
      title: 'Love Languages',
      description: 'Discover how you and your partner give and receive love',
      icon: Heart,
      questions: 30,
      duration: '10 min',
      completed: true,
      score: 85,
      color: 'rose',
    },
    {
      id: 'communication-styles',
      title: 'Communication Styles',
      description: 'Learn how you both communicate and resolve conflicts',
      icon: MessageCircle,
      questions: 25,
      duration: '8 min',
      color: 'blue',
    },
    {
      id: 'faith-journey',
      title: 'Faith Journey',
      description: 'Explore your spiritual backgrounds and beliefs together',
      icon: Sparkles,
      questions: 20,
      duration: '7 min',
      completed: true,
      score: 92,
      color: 'purple',
    },
    {
      id: 'relationship-values',
      title: 'Relationship Values',
      description: 'Identify shared values and priorities in your relationship',
      icon: Star,
      questions: 28,
      duration: '9 min',
      color: 'amber',
    },
    {
      id: 'family-planning',
      title: 'Family Planning',
      description: 'Discuss expectations about children, parenting, and family',
      icon: Users,
      questions: 22,
      duration: '8 min',
      color: 'green',
    },
    {
      id: 'emotional-intelligence',
      title: 'Emotional Intelligence',
      description: 'Assess how you understand and manage emotions together',
      icon: Brain,
      questions: 24,
      duration: '9 min',
      color: 'indigo',
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
      rose: { bg: 'bg-rose-100', text: 'text-rose-700', icon: 'text-rose-600' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-600' },
      amber: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600' },
      green: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: 'text-indigo-600' },
    };
    return colorMap[color] || colorMap.rose;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl">Interactive Quizzes</h1>
        <p className="text-gray-600">Discover and grow together through insightful questions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-semibold text-rose-600">6</p>
          <p className="text-xs text-gray-600 mt-1">Total Quizzes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-semibold text-purple-600">2</p>
          <p className="text-xs text-gray-600 mt-1">Completed</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-semibold text-green-600">88%</p>
          <p className="text-xs text-gray-600 mt-1">Avg Score</p>
        </Card>
      </div>

      {/* Quizzes Grid */}
      <div className="space-y-4">
        {quizzes.map((quiz) => {
          const Icon = quiz.icon;
          const colors = getColorClasses(quiz.color);

          return (
            <Card
              key={quiz.id}
              className="p-5 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => onQuizStart(quiz.id)}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-7 h-7 ${colors.icon}`} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{quiz.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                    </div>
                    {quiz.completed && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        {quiz.score}%
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{quiz.questions} questions</span>
                    <span>•</span>
                    <span>{quiz.duration}</span>
                  </div>

                  {quiz.completed && quiz.score && (
                    <div className="mt-3">
                      <Progress value={quiz.score} className="h-2" />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
