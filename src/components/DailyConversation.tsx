import { Card } from './ui/card';
import { Button } from './ui/button';
import { Mic, ChevronRight, Flame, Clock } from 'lucide-react';
import { User, UserPlus } from 'lucide-react';

interface DailyConversationProps {
  question: string;
  timeUntilNext?: string;
  streak?: number;
  onViewResults?: () => void;
  userName?: string;
  partnerName?: string;
}

export function DailyConversation({ 
  question, 
  timeUntilNext = '12:04:23',
  streak = 4,
  onViewResults,
  userName,
  partnerName
}: DailyConversationProps) {
  return (
    <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-orange-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Daily Conversation</h3>
        <div className="flex items-center gap-1 bg-pink-100 px-3 py-1 rounded-full">
          <span className="text-sm font-medium text-pink-600">{streak}</span>
          <Flame className="w-4 h-4 text-pink-600 fill-pink-600" />
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-orange-600" />
        <span className="text-xs text-orange-600 uppercase tracking-wide">
          Next in {timeUntilNext}
        </span>
      </div>

      {/* Question */}
      <div className="bg-white/60 rounded-lg p-4 mb-4 relative">
        <p className="text-sm pr-12">{question}</p>
        <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
          <Mic className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Avatars */}
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center border-2 border-white shadow-sm">
            <User className="w-4 h-4 text-rose-600" />
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-200 to-indigo-300 flex items-center justify-center border-2 border-white shadow-sm">
            {partnerName ? (
              <span className="text-xs font-bold text-indigo-600">
                {partnerName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <UserPlus className="w-4 h-4 text-indigo-600" />
            )}
          </div>
        </div>

        {/* Results Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
          onClick={onViewResults}
        >
          <span className="uppercase tracking-wide">Results</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}
