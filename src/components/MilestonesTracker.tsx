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
      toast.error('Failed to load milestones');
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
      relationship: 'bg-rose-100 text-rose-700',
      faith: 'bg-purple-100 text-purple-700',
      achievement: 'bg-green-100 text-green-700',
      special: 'bg-amber-100 text-amber-700',
    };
    return colorMap[category] || colorMap.relationship;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Milestones</h1>
          <p className="text-gray-600">Your journey together</p>
        </div>
        <Button onClick={onAddMilestone} className="rounded-full" size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-semibold">{milestones.length}</p>
          <p className="text-xs text-gray-600">Total Milestones</p>
        </Card>
        <Card className="p-4 text-center">
          <Heart className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-2xl font-semibold">2</p>
          <p className="text-xs text-gray-600">Relationship</p>
        </Card>
        <Card className="p-4 text-center">
          <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-semibold">1</p>
          <p className="text-xs text-gray-600">Faith</p>
        </Card>
        <Card className="p-4 text-center">
          <Trophy className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-semibold">2</p>
          <p className="text-xs text-gray-600">Achievements</p>
        </Card>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        <h2 className="font-semibold text-xl">Timeline</h2>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          {/* Milestones */}
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative pl-20">
                {/* Badge */}
                <div className="absolute left-0 w-16 h-16 rounded-full bg-white border-4 border-gray-100 flex items-center justify-center text-3xl shadow-sm">
                  {milestone.badge}
                </div>
                
                {/* Content */}
                <Card className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{milestone.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{milestone.date}</span>
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