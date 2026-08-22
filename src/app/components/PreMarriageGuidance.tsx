import { GraduationCap } from 'lucide-react';
import { Card } from './ui/card';

interface Module {
  id: string;
  title: string;
  subtitle: string;
  progress: number;
}

interface PreMarriageGuidanceProps {
  modules: Module[];
}

export function PreMarriageGuidance({ modules }: PreMarriageGuidanceProps) {
  return (
    <Card className="bg-card rounded-2xl p-6">
      <div className="flex items-center gap-2 text-warning-700 mb-6">
        <GraduationCap className="w-5 h-5" />
        <h3 className="font-medium">Pre-Marriage Guidance</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {modules.map((module) => (
          <div key={module.id} className="text-center">
            {/* Circular Progress */}
            <div className="relative w-16 h-16 mx-auto mb-3">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#f3f4f6"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#fb923c"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - module.progress / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium">{module.progress}%</span>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-foreground mb-1">
              {module.title}
            </h4>
            <p className="text-xs text-muted-foreground leading-tight">
              {module.subtitle}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
