import { Lightbulb, Heart } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface TodaysReflectionProps {
  prompt: string;
  onReflect: () => void;
}

export function TodaysReflection({ prompt, onReflect }: TodaysReflectionProps) {
  return (
    <Card className="bg-gradient-to-br from-warning-50 to-warning-50 rounded-2xl p-6">
      <div className="flex items-center gap-2 text-warning-700 mb-4">
        <Lightbulb className="w-5 h-5" />
        <h3 className="font-medium">Today's Reflection</h3>
      </div>
      
      <p className="text-foreground mb-4">
        {prompt}
      </p>
      
      <Button 
        onClick={onReflect}
        className="w-full bg-warning-500/30 hover:bg-warning-500 text-foreground rounded-xl"
      >
        <Heart className="w-4 h-4 mr-2" />
        Reflect Together
      </Button>
    </Card>
  );
}
