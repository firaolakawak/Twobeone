import { useState } from 'react';
import { BookOpen, HandHeart, Save, CheckCircle2, User } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner';

interface Question {
  id: string;
  category: string;
  title: string;
  verse: string;
  verseReference: string;
  prompts: string[];
  userAnswer?: string;
  partnerAnswer?: string;
}

interface QuestionCardProps {
  question: Question;
  onSaveAnswer: (answer: string) => void;
  onPrayTogether: () => void;
  userName?: string;
  partnerName?: string;
  onNextQuestion?: () => void; // Add callback for moving to next question
}

export function QuestionCard({ 
  question, 
  onSaveAnswer, 
  onPrayTogether,
  userName,
  partnerName,
  onNextQuestion
}: QuestionCardProps) {
  const [answer, setAnswer] = useState(question.userAnswer || '');
  const [isEditing, setIsEditing] = useState(!question.userAnswer);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSaveAnswer(answer);
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handlePromptClick = (prompt: string) => {
    // Set the prompt as the answer
    setAnswer(prompt);
    
    // Save the answer
    onSaveAnswer(prompt);
    setIsEditing(false);
    setIsSaved(true);
    
    // Show success toast
    toast.success('Answer saved! Moving to next question...', {
      duration: 800
    });
    
    // Show success feedback and move to next question
    setTimeout(() => {
      setIsSaved(false);
      // Move to next question after a short delay
      if (onNextQuestion) {
        onNextQuestion();
      }
    }, 800);
  };

  const categoryEmojis: Record<string, string> = {
    'daily-life': '☀️',
    'intimacy': '💕',
    'love-balance': '⚖️',
    'dream-wedding': '💒',
    'travel': '✈️',
    'boundaries': '🛡️',
    'trust': '🤝',
    'kids-future': '👶',
    'finance': '💰',
    'family': '👨‍👩‍👧‍👦',
    'bible': '📖',
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Badge variant="secondary" className="mb-3">
          <span className="mr-1">{categoryEmojis[question.category]}</span>
          {question.category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}
        </Badge>
        <h2 className="text-2xl font-semibold mb-2">{question.title}</h2>
      </div>

      {/* Bible Verse */}
      <div className="bg-gradient-to-br from-primary-50 to-sky-50 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-primary-600 flex-shrink-0 mt-1" />
          <div>
            <p className="text-foreground italic leading-relaxed mb-2">
              "{question.verse}"
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              — {question.verseReference}
            </p>
          </div>
        </div>
      </div>

      {/* Reflection Prompts */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span>💭</span>
          Reflection Prompts
          <Badge variant="outline" className="text-xs ml-2">Click to select</Badge>
        </h3>
        <div className="space-y-2">
          {question.prompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              className="w-full flex items-start gap-3 p-4 bg-gradient-to-r from-muted to-primary-50 hover:from-primary-100 hover:to-sky-100 rounded-lg border border-border hover:border-primary-300 transition-all cursor-pointer text-left group"
            >
              <span className="text-primary-600 font-semibold flex-shrink-0 group-hover:scale-110 transition-transform">
                {index + 1}.
              </span>
              <p className="text-foreground group-hover:text-primary-900 flex-1">{prompt}</p>
              <CheckCircle2 className="w-5 h-5 text-muted-foreground group-hover:text-primary-600 flex-shrink-0 transition-colors" />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          💡 Tip: Click any prompt to use it as your answer and move to the next question
        </p>
      </div>

      <Separator />

      {/* Your Answer */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">
                {userName?.charAt(0) || 'Y'}
              </AvatarFallback>
            </Avatar>
            Your Answer
          </h3>
          {question.userAnswer && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts and reflections..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="min-h-32"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!answer.trim()}
                className="flex-1"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Answer
                  </>
                )}
              </Button>
              {question.userAnswer && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnswer(question.userAnswer || '');
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-foreground whitespace-pre-line">{answer}</p>
          </div>
        )}
      </div>

      {/* Partner's Answer */}
      {question.partnerAnswer && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">
                  {partnerName?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
              {partnerName ? `${partnerName}'s Answer` : "Partner's Answer"}
            </h3>
            <div className="bg-primary-50 rounded-lg p-4">
              <p className="text-foreground whitespace-pre-line">{question.partnerAnswer}</p>
            </div>
          </div>
        </>
      )}

      {/* Pray Together Button */}
      <Button
        onClick={onPrayTogether}
        className="w-full bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700"
        size="lg"
      >
        <HandHeart className="w-5 h-5 mr-2" />
        Pray Together About This
      </Button>

      {/* Status */}
      {question.userAnswer && question.partnerAnswer && (
        <div className="flex items-center justify-center gap-2 text-success-700 bg-success-50 py-2 px-4 rounded-lg">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Both partners have answered!</span>
        </div>
      )}
    </Card>
  );
}