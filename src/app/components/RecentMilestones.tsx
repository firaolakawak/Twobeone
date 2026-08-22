import { TrendingUp } from 'lucide-react';
import { Card } from './ui/card';

interface Milestone {
  id: string;
  title: string;
  date: string;
}

interface RecentMilestonesProps {
  milestones: Milestone[];
  onViewAll?: () => void;
}

export function RecentMilestones({ milestones, onViewAll }: RecentMilestonesProps) {
  const displayMilestones = milestones.slice(0, 3);

  return (
    <Card className="bg-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-success-700">
          <TrendingUp className="w-5 h-5" />
          <h3 className="font-medium">Recent Milestones</h3>
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View All
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {displayMilestones.map((milestone) => (
          <div key={milestone.id} className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-success-500 mt-2 flex-shrink-0" />
            <div>
              <p className="text-foreground">{milestone.title}</p>
              <p className="text-sm text-muted-foreground">{milestone.date}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
