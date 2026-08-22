import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, Calendar, Heart, Star, Plus } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useState, useEffect } from 'react';
import { milestones as milestonesApi } from '../utils/api';
import { toast } from 'sonner';

interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  category: 'relationship' | 'faith' | 'achievement' | 'special';
  badge?: string;
}

interface MilestonesTrackerProps {
  onAddMilestone: () => void;
}

export function MilestonesTracker({ onAddMilestone }: MilestonesTrackerProps) {
  const { t } = useLanguage();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    setIsLoading(true);
    try {
      const { milestones: fetchedMilestones } = await milestonesApi.list();
      
      // Transform backend milestones to match UI format
      const transformedMilestones = fetchedMilestones.map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description || '',
        date: m.date || m.createdAt,
        category: m.category || 'relationship',
        badge: getCategoryEmoji(m.category || 'relationship'),
      }));
      
      setMilestones(transformedMilestones);
    } catch (error) {
      console.error('Error loading milestones:', error);
      toast.error(t.messages.errorOccurred);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryEmoji = (category: string): string => {
    const emojiMap: Record<string, string> = {
      relationship: '🎉',
      faith: '📖',
      achievement: '🎓',
      special: '✨',
    };
    return emojiMap[category] || '⭐';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      relationship: 'bg-primary-100 text-primary-700',
      faith: 'bg-primary-100 text-primary-700',
      achievement: 'bg-success-50 text-success-700',
      special: 'bg-warning-50 text-warning-700',
    };
    return colorMap[category] || colorMap.relationship;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">{t.milestones.title}</h1>
          <p className="text-muted-foreground">{t.dashboard.yourJourneyTogether}</p>
        </div>
        <Button onClick={onAddMilestone} className="rounded-full" size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Trophy className="w-8 h-8 text-warning-500 mx-auto mb-2" />
          <p className="text-2xl font-semibold">{milestones.length}</p>
          <p className="text-xs text-muted-foreground">{t.milestones.title}</p>
        </Card>
        <Card className="p-4 text-center">
          <Heart className="w-8 h-8 text-primary-500 mx-auto mb-2" />
          <p className="text-2xl font-semibold">2</p>
          <p className="text-xs text-muted-foreground">Relationship</p>
        </Card>
        <Card className="p-4 text-center">
          <Star className="w-8 h-8 text-primary-500 mx-auto mb-2" />
          <p className="text-2xl font-semibold">1</p>
          <p className="text-xs text-muted-foreground">Faith</p>
        </Card>
        <Card className="p-4 text-center">
          <Trophy className="w-8 h-8 text-success-500 mx-auto mb-2" />
          <p className="text-2xl font-semibold">2</p>
          <p className="text-xs text-muted-foreground">Achievements</p>
        </Card>
      </div>

      {/* {t.dashboard.yourJourneyTogether} */}
      <div className="space-y-6">
        <h2 className="font-semibold text-xl">{t.dashboard.yourJourneyTogether}</h2>
        
        <div className="relative">
          {/* {t.dashboard.yourJourneyTogether} Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-neutral-200" />
          
          {/* Milestones */}
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative pl-20">
                {/* Badge */}
                <div className="absolute left-0 w-16 h-16 rounded-full bg-card border-4 border-border flex items-center justify-center text-3xl shadow-sm">
                  {milestone.badge}
                </div>
                
                {/* Content */}
                <Card className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{milestone.date}</span>
                      </div>
                    </div>
                    <Badge className={getCategoryColor(milestone.category)}>
                      {milestone.category}
                    </Badge>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}