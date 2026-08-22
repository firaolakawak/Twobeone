import { useState, useEffect } from 'react';
import { GraduationCap, CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string;
}

interface Module {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  lessons: Lesson[];
  icon?: string;
  color?: string;
  duration?: string;
  progress?: number;
  isLocked?: boolean;
}

interface PreMarriageHubProps {
  onModuleClick: (moduleId: string) => void;
  accessToken?: string;
}

export function PreMarriageHub({ onModuleClick, accessToken }: PreMarriageHubProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const { modules: apiModules } = await response.json();
        
        if (apiModules && apiModules.length > 0) {
          // Load progress for each module
          const modulesWithProgress = await Promise.all(
            apiModules.map(async (m: any, index: number) => {
              let progress = 0;
              
              try {
                const progressResponse = await fetch(
                  `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules/${m.id}/progress`,
                  {
                    headers: {
                      'Authorization': `Bearer ${accessToken || publicAnonKey}`
                    }
                  }
                );
                
                if (progressResponse.ok) {
                  const { progress: moduleProgress } = await progressResponse.json();
                  progress = moduleProgress || 0;
                }
              } catch (error) {
                console.error(`Failed to load progress for module ${m.id}:`, error);
              }
              
              return {
                id: m.id,
                title: m.title,
                subtitle: m.subtitle || '',
                description: m.description || '',
                lessons: m.lessons || [],
                icon: m.icon,
                color: m.color,
                duration: calculateDuration(m.lessons || []),
                progress,
                isLocked: false // All published modules are unlocked
              };
            })
          );
          
          setModules(modulesWithProgress);
        } else {
          // Fallback default modules
          setModules(getDefaultModules());
        }
      } else {
        setModules(getDefaultModules());
      }
    } catch (error) {
      console.error('Failed to load modules:', error);
      toast.error('Failed to load modules');
      setModules(getDefaultModules());
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDuration = (lessons: Lesson[]) => {
    const totalMinutes = lessons.reduce((acc, lesson) => {
      const match = lesson.duration?.match(/(\d+)/);
      return acc + (match ? parseInt(match[1]) : 0);
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const getDefaultModules = (): Module[] => [
    {
      id: '1',
      title: "God's Design for Marriage",
      subtitle: 'Biblical Foundations',
      lessons: [],
      duration: '2 hours',
      progress: 85,
    },
    {
      id: '2',
      title: 'Communication & Conflict',
      subtitle: 'Active Listening & Resolution',
      lessons: [],
      duration: '2.5 hours',
      progress: 60,
    },
    {
      id: '3',
      title: 'Roles & Responsibilities',
      subtitle: 'Partnership in Christ',
      lessons: [],
      duration: '1.5 hours',
      progress: 25,
    },
    {
      id: '4',
      title: 'Finances & Stewardship',
      subtitle: 'Managing Money Together',
      lessons: [],
      duration: '2 hours',
      progress: 0,
    },
    {
      id: '5',
      title: 'Intimacy & Sexuality',
      subtitle: 'Biblical Perspective',
      lessons: [],
      duration: '1.5 hours',
      progress: 0,
      isLocked: true,
    },
    {
      id: '6',
      title: 'In-Laws & Extended Family',
      subtitle: 'Healthy Boundaries',
      lessons: [],
      duration: '1 hour',
      progress: 0,
      isLocked: true,
    },
  ];

  const overallProgress = modules.length > 0
    ? Math.round(
        modules.reduce((acc, module) => acc + (module.progress || 0), 0) / modules.length
      )
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl">Pre-Marriage Guidance</h1>
          </div>
          <p className="text-gray-600">Prepare for a Christ-centered marriage</p>
        </div>
        <Card className="p-8 text-center">
          <p className="text-gray-600">Loading modules...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl">Pre-Marriage Guidance</h1>
        </div>
        <p className="text-gray-600">Prepare for a Christ-centered marriage</p>
      </div>

      {/* Overall Progress */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Your Progress</h3>
            <p className="text-sm text-gray-600">Keep going! You're doing great</p>
          </div>
          <div className="text-3xl font-semibold text-orange-600">
            {overallProgress}%
          </div>
        </div>
        <Progress value={overallProgress} className="h-3" />
        <p className="text-xs text-gray-600 mt-2">
          Complete all modules to receive your Pre-Marriage Certificate
        </p>
      </Card>

      {/* Modules */}
      <div className="space-y-4">
        {modules.map((module, index) => (
          <Card
            key={module.id}
            className={`p-5 transition-all ${
              module.isLocked
                ? 'opacity-60'
                : 'cursor-pointer hover:shadow-lg'
            }`}
            onClick={() => !module.isLocked && onModuleClick(module.id)}
          >
            <div className="flex items-start gap-4">
              {/* Module Icon/Number */}
              <div className="relative flex-shrink-0">
                {module.icon ? (
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    module.color || 'bg-orange-100'
                  }`}>
                    <span className="text-2xl">{module.icon}</span>
                  </div>
                ) : (
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    (module.progress || 0) === 100
                      ? 'bg-green-100'
                      : module.isLocked
                      ? 'bg-gray-100'
                      : 'bg-orange-100'
                  }`}>
                    {(module.progress || 0) === 100 ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : module.isLocked ? (
                      <Lock className="w-6 h-6 text-gray-400" />
                    ) : (
                      <span className="text-lg font-semibold text-orange-600">
                        {index + 1}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{module.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{module.subtitle}</p>
                  </div>
                  {module.isLocked && (
                    <Badge variant="secondary" className="text-xs">
                      Locked
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span>{module.lessons.length} lessons</span>
                  <span>•</span>
                  <span>{module.duration || 'N/A'}</span>
                </div>

                {!module.isLocked && (
                  <div className="space-y-2">
                    <Progress value={module.progress || 0} className="h-2" />
                    <p className="text-xs text-gray-600">
                      {(module.progress || 0) === 100
                        ? 'Completed!'
                        : (module.progress || 0) === 0
                        ? 'Not started'
                        : `${module.progress}% complete`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {modules.length === 0 && (
        <Card className="p-8 text-center">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No modules available yet</p>
          <p className="text-sm text-gray-500">
            Check back soon for new learning content
          </p>
        </Card>
      )}
    </div>
  );
}