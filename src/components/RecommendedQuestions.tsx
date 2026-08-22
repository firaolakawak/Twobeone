import { Card } from './ui/card';
import { Button } from './ui/button';
import { ChevronRight, User, UserPlus } from 'lucide-react';

interface QuestionCard {
  id: string;
  category: string;
  title: string;
  emoji: string;
  bgColor: string;
  buttonColor: string;
}

interface RecommendedQuestionsProps {
  onAnswerClick: (questionId: string) => void;
  userName?: string;
  partnerName?: string;
}

export function RecommendedQuestions({ onAnswerClick, userName, partnerName }: RecommendedQuestionsProps) {
  const questions: QuestionCard[] = [
    {
      id: '1',
      category: 'NEVER HAVE I EVER',
      title: 'Daily Life',
      emoji: '👀',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
      buttonColor: 'text-pink-600 hover:bg-pink-100'
    },
    {
      id: '2',
      category: "WHO'S MORE LIKELY TO?",
      title: 'Holiday Habits',
      emoji: '🌴',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      buttonColor: 'text-blue-600 hover:bg-blue-100'
    },
    {
      id: '3',
      category: 'THIS OR THAT',
      title: 'Dream Wedding',
      emoji: '🎪',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      buttonColor: 'text-purple-600 hover:bg-purple-100'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Recommended for you</h3>
      
      {questions.map((question) => (
        <Card 
          key={question.id}
          className={`p-4 ${question.bgColor} border-transparent cursor-pointer hover:shadow-md transition-shadow`}
          onClick={() => onAnswerClick(question.id)}
        >
          <div className="space-y-3">
            {/* Category and Emoji */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">
                  {question.category}
                </p>
                <h4 className="font-medium">{question.title}</h4>
              </div>
              <div className="text-2xl">{question.emoji}</div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              {/* Avatars */}
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center border-2 border-white shadow-sm">
                  <User className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-200 to-indigo-300 flex items-center justify-center border-2 border-white shadow-sm">
                  {partnerName ? (
                    <span className="text-xs font-bold text-indigo-600">
                      {partnerName.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                </div>
              </div>

              {/* Answer Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${question.buttonColor} uppercase tracking-wide`}
              >
                Answer
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
