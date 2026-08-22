import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Heart, HeartCrack, Check } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card } from './ui/card';

type QuestionType = 'text' | 'multiple_choice' | 'multiple_select' | 'like_dislike' | 'love_hate' | 'scale' | 'yes_no';

interface QuestionPrompt {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  scaleMax?: number;
}

interface DynamicQuestionPromptProps {
  prompt: QuestionPrompt;
  value: string | string[] | number | null;
  onChange: (value: string | string[] | number) => void;
  disabled?: boolean; // Add disabled prop
}

export function DynamicQuestionPrompt({ prompt, value, onChange, disabled = false }: DynamicQuestionPromptProps) {
  const handleChange = (newValue: string | string[] | number) => {
    if (!disabled) {
      onChange(newValue);
    }
  };

  // Multiple Choice
  if (prompt.type === 'multiple_choice' && prompt.options) {
    return (
      <div className="space-y-3">
        <label className="text-lg font-bold text-gray-900 block leading-snug">{prompt.text}</label>
        <div className="space-y-2">
          {prompt.options.map((option, index) => {
            const isSelected = value === option;
            return (
              <button
                key={`${prompt.id}-option-${index}`}
                onClick={() => handleChange(option)}
                disabled={disabled}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={isSelected ? 'text-gray-900 font-semibold text-base' : 'text-gray-700 text-base'}>{option}</span>
                  {isSelected && (
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const renderPromptInput = () => {
    switch (prompt.type) {
      case 'text':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            disabled={disabled}
            className="w-full"
          />
        );

      case 'multiple_select':
        const selectedOptions = (value as string[]) || [];
        return (
          <div className="space-y-2">
            {(prompt.options || []).map((option, index) => {
              const isSelected = selectedOptions.includes(option);
              return (
                <Card
                  key={`${prompt.id}-multi-${index}`}
                  onClick={() => {
                    if (disabled) return;
                    const newValue = isSelected
                      ? selectedOptions.filter(o => o !== option)
                      : [...selectedOptions, option];
                    onChange(newValue);
                  }}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-100 border-2 border-purple-600'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span>{option}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        );

      case 'like_dislike':
        return (
          <div className="flex gap-4 justify-center py-4">
            <Card
              onClick={() => !disabled && onChange('like')}
              className={`p-6 cursor-pointer transition-all ${
                value === 'like'
                  ? 'bg-green-100 border-2 border-green-600'
                  : 'hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col items-center gap-2">
                <ThumbsUp className={`w-12 h-12 ${value === 'like' ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium">Like</span>
              </div>
            </Card>
            <Card
              onClick={() => !disabled && onChange('dislike')}
              className={`p-6 cursor-pointer transition-all ${
                value === 'dislike'
                  ? 'bg-red-100 border-2 border-red-600'
                  : 'hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col items-center gap-2">
                <ThumbsDown className={`w-12 h-12 ${value === 'dislike' ? 'text-red-600' : 'text-gray-400'}`} />
                <span className="font-medium">Dislike</span>
              </div>
            </Card>
          </div>
        );

      case 'love_hate':
        return (
          <div className="flex gap-4 justify-center py-4">
            <Card
              onClick={() => !disabled && onChange('love')}
              className={`p-6 cursor-pointer transition-all ${
                value === 'love'
                  ? 'bg-pink-100 border-2 border-pink-600'
                  : 'hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col items-center gap-2">
                <Heart className={`w-12 h-12 ${value === 'love' ? 'text-pink-600 fill-pink-600' : 'text-gray-400'}`} />
                <span className="font-medium">Love</span>
              </div>
            </Card>
            <Card
              onClick={() => !disabled && onChange('hate')}
              className={`p-6 cursor-pointer transition-all ${
                value === 'hate'
                  ? 'bg-gray-100 border-2 border-gray-600'
                  : 'hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col items-center gap-2">
                <HeartCrack className={`w-12 h-12 ${value === 'hate' ? 'text-gray-600' : 'text-gray-400'}`} />
                <span className="font-medium">Hate</span>
              </div>
            </Card>
          </div>
        );

      case 'scale':
        const scaleMax = prompt.scaleMax || 5;
        const currentValue = (value as number) || 0;
        return (
          <div className="py-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">1</span>
              <span className="text-sm text-gray-600">{scaleMax}</span>
            </div>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: scaleMax }, (_, i) => i + 1).map((num) => (
                <Card
                  key={num}
                  onClick={() => !disabled && onChange(num)}
                  className={`w-14 h-14 flex items-center justify-center cursor-pointer transition-all ${
                    currentValue === num
                      ? 'bg-purple-600 text-white border-2 border-purple-600'
                      : 'hover:bg-gray-100'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-lg font-semibold">{num}</span>
                </Card>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">Low</span>
              <span className="text-xs text-gray-500">High</span>
            </div>
          </div>
        );

      case 'yes_no':
        return (
          <div className="flex gap-4 justify-center py-4">
            <Card
              onClick={() => !disabled && onChange('yes')}
              className={`p-6 cursor-pointer transition-all flex-1 max-w-xs ${
                value === 'yes'
                  ? 'bg-green-100 border-2 border-green-600'
                  : 'hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col items-center gap-2">
                <Check className={`w-10 h-10 ${value === 'yes' ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-lg">Yes</span>
              </div>
            </Card>
            <Card
              onClick={() => !disabled && onChange('no')}
              className={`p-6 cursor-pointer transition-all flex-1 max-w-xs ${
                value === 'no'
                  ? 'bg-red-100 border-2 border-red-600'
                  : 'hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${
                  value === 'no' ? 'text-red-600' : 'text-gray-400'
                }`}>
                  ×
                </div>
                <span className="font-medium text-lg">No</span>
              </div>
            </Card>
          </div>
        );

      default:
        return <p className="text-gray-500">Unsupported question type</p>;
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-lg font-bold text-gray-900 block leading-snug">{prompt.text}</Label>
      {renderPromptInput()}
    </div>
  );
}