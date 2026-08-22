import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BookOpen, Check } from 'lucide-react';
import { DailyDevotional as DevotionalType } from '../types';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DailyDevotionalProps {
  devotional: DevotionalType;
  onComplete?: () => void;
  isCompleted?: boolean;
}

export function DailyDevotional({ devotional, onComplete, isCompleted }: DailyDevotionalProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1667110884862-317a400bdc05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwYmlibGUlMjBzdW5yaXNlfGVufDF8fHx8MTc2MjU1NzA0M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Bible"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 text-white mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm">Today's Devotional</span>
          </div>
          <h2 className="text-white text-2xl">{devotional.title}</h2>
        </div>
      </div>
      
      <CardHeader>
        <CardTitle className="text-xl">{devotional.reference}</CardTitle>
        <CardDescription className="text-base italic leading-relaxed">
          "{devotional.verse}"
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          {devotional.reflection}
        </p>
        
        {onComplete && (
          <Button
            onClick={onComplete}
            disabled={isCompleted}
            className="w-full"
            variant={isCompleted ? "outline" : "default"}
          >
            {isCompleted ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Completed Today
              </>
            ) : (
              'Mark as Read'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
