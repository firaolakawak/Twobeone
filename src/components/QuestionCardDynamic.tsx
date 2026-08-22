import { useState } from 'react';
import { BookOpen, HandHeart, Save, CheckCircle2, Edit2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DynamicQuestionPrompt } from './DynamicQuestionPrompt';
import { ScrollArea } from './ui/scroll-area';

type QuestionType = 'text' | 'multiple_choice' | 'multiple_select' | 'like_dislike' | 'love_hate' | 'scale' | 'yes_no';

interface QuestionPrompt {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  scaleMax?: number;
}

interface Question {
  id: string;
  category: string;
  title: string;
  verse: string;
  verseReference: string;
  prompts: QuestionPrompt[];
  userAnswers?: Record<string, string | string[] | number>;
  partnerAnswers?: Record<string, string | string[] | number>;
}

interface QuestionCardDynamicProps {
  question: Question;
  onSaveAnswers: (answers: Record<string, string | string[] | number>) => void;
  onPrayTogether: () => void;
  userName?: string;
  partnerName?: string;
}

export function QuestionCardDynamic({ 
  question, 
  onSaveAnswers, 
  onPrayTogether,
  userName,
  partnerName 
}: QuestionCardDynamicProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>(question.userAnswers || {});
  const [isEditing, setIsEditing] = useState(!question.userAnswers || Object.keys(question.userAnswers).length === 0);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    // Filter out empty answers
    const filteredAnswers: Record<string, string | string[] | number> = {};
    Object.entries(answers).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) filteredAnswers[key] = value;
      } else if (value !== '' && value !== null && value !== undefined) {
        filteredAnswers[key] = value;
      }
    });

    if (Object.keys(filteredAnswers).length === 0) {
      return; // Don't save if no answers provided
    }

    onSaveAnswers(filteredAnswers);
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAnswerChange = (promptId: string, value: string | string[] | number) => {
    setAnswers(prev => ({
      ...prev,
      [promptId]: value
    }));
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

  const formatAnswer = (value: string | string[] | number, type: QuestionType): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (type === 'scale') {
      return `${value}/10`;
    }
    if (type === 'like_dislike') {
      return value === 'like' ? '👍 Like' : '👎 Dislike';
    }
    if (type === 'love_hate') {
      return value === 'love' ? '❤️ Love' : '💔 Hate';
    }
    if (type === 'yes_no') {
      return value === 'yes' ? '✓ Yes' : '× No';
    }
    return String(value);
  };

  const answeredCount = question.userAnswers ? Object.keys(question.userAnswers).length : 0;
  const totalPrompts = question.prompts.length;

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
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
          <div>
            <p className="text-gray-800 italic leading-relaxed mb-2">
              "{question.verse}"
            </p>
            <p className="text-sm text-gray-600 font-medium">
              — {question.verseReference}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Questions & Answers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                {userName?.charAt(0) || 'Y'}
              </AvatarFallback>
            </Avatar>
            Your Responses
            {!isEditing && (
              <Badge variant="outline" className="ml-2">
                {answeredCount}/{totalPrompts} answered
              </Badge>
            )}
          </h3>
          {!isEditing && answeredCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-6 pr-4">
              {question.prompts.map((prompt, index) => (
                <Card key={prompt.id} className="p-4 bg-gray-50">
                  <div className="mb-2">
                    <Badge variant="secondary" className="text-xs">
                      Question {index + 1}
                    </Badge>
                  </div>
                  <DynamicQuestionPrompt
                    prompt={prompt}
                    value={answers[prompt.id] || null}
                    onChange={(value) => handleAnswerChange(prompt.id, value)}
                  />
                </Card>
              ))}
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={Object.keys(answers).length === 0}
                  className="flex-1"
                  size="lg"
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save All Responses
                    </>
                  )}
                </Button>
                {answeredCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAnswers(question.userAnswers || {});
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-4">
            {question.prompts.map((prompt, index) => {
              const answer = answers[prompt.id];
              const hasAnswer = answer !== undefined && answer !== null && answer !== '';
              
              return (
                <div key={prompt.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs mt-1">
                      Q{index + 1}
                    </Badge>
                    <p className="text-sm text-gray-600 flex-1">{prompt.text}</p>
                  </div>
                  {hasAnswer ? (
                    <div className="bg-purple-50 rounded-lg p-3 ml-10">
                      <p className="text-gray-800">{formatAnswer(answer, prompt.type)}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-3 ml-10 text-gray-400 text-sm italic">
                      Not answered yet
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Partner's Answers */}
      {question.partnerAnswers && Object.keys(question.partnerAnswers).length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-rose-100 text-rose-700 text-xs">
                  {partnerName?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
              {partnerName ? `${partnerName}'s Responses` : "Partner's Responses"}
              <Badge variant="outline" className="ml-2">
                {Object.keys(question.partnerAnswers).length}/{totalPrompts} answered
              </Badge>
            </h3>
            <div className="space-y-4">
              {question.prompts.map((prompt, index) => {
                const answer = question.partnerAnswers?.[prompt.id];
                const hasAnswer = answer !== undefined && answer !== null && answer !== '';
                
                return (
                  <div key={prompt.id} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs mt-1">
                        Q{index + 1}
                      </Badge>
                      <p className="text-sm text-gray-600 flex-1">{prompt.text}</p>
                    </div>
                    {hasAnswer ? (
                      <div className="bg-rose-50 rounded-lg p-3 ml-10">
                        <p className="text-gray-800">{formatAnswer(answer, prompt.type)}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-3 ml-10 text-gray-400 text-sm italic">
                        Not answered yet
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Pray Together Button */}
      <Button
        onClick={onPrayTogether}
        className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700"
        size="lg"
      >
        <HandHeart className="w-5 h-5 mr-2" />
        Pray Together About This
      </Button>

      {/* Status */}
      {answeredCount === totalPrompts && question.partnerAnswers && Object.keys(question.partnerAnswers).length === totalPrompts && (
        <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-2 px-4 rounded-lg">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Both partners have answered all questions!</span>
        </div>
      )}
    </Card>
  );
}
