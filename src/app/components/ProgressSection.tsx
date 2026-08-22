import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { Progress } from './ui/progress';
import { TrendingUp, BookOpen, HandHeart, MessageCircle, Calendar } from 'lucide-react';
import { Progress as ProgressType } from '../types';

interface ProgressSectionProps {
  progress: ProgressType;
}

export function ProgressSection({ progress }: ProgressSectionProps) {
  const { t } = useLanguage();
  const goals = {
    completedDays: 30,
    journalEntries: 20,
    prayerRequests: 10,
    questionsAnswered: 30
  };

  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const stats = [
    {
      icon: Calendar,
      label: 'Days Active',
      current: progress.completedDays,
      goal: goals.completedDays,
      color: 'text-sky-600'
    },
    {
      icon: BookOpen,
      label: 'Journal Entries',
      current: progress.journalEntries,
      goal: goals.journalEntries,
      color: 'text-primary-600'
    },
    {
      icon: HandHeart,
      label: 'Prayers',
      current: progress.prayerRequests,
      goal: goals.prayerRequests,
      color: 'text-primary-600'
    },
    {
      icon: MessageCircle,
      label: 'Questions Answered',
      current: progress.questionsAnswered,
      goal: goals.questionsAnswered,
      color: 'text-success-700'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-success-500" />
        <h2 className="text-2xl">Your Progress</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const progressValue = calculateProgress(stat.current, stat.goal);
          
          return (
            <Card key={stat.label}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                    {stat.label}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {stat.current} / {stat.goal}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={progressValue} className="h-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-br from-sky-50 to-primary-50 border-sky-200">
        <CardHeader>
          <CardTitle className="text-lg">Keep Growing Together</CardTitle>
          <CardDescription>
            Consistency is key to building a strong spiritual foundation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You're making great progress! Continue to engage daily with devotionals, 
            share your thoughts in the journal, pray together, and answer questions 
            to deepen your understanding of each other.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
