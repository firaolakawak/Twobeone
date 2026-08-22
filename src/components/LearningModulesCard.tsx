import { useState, useEffect } from 'react';
import { GraduationCap, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { projectId, publicAnonKey } from '../utils/supabase/info';

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
  progress?: number;
}

interface LearningModulesCardProps {
  onViewAll?: () => void;
  accessToken?: string;
}

export function LearningModulesCard({ onViewAll, accessToken }: LearningModulesCardProps) {
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
          // Load progress for first 3 modules for card preview
          const modulesWithProgress = await Promise.all(
            apiModules.slice(0, 3).map(async (m: any) => {
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
                progress
              };
            })
          );
          
          setModules(modulesWithProgress);
        }
      }
    } catch (error) {
      console.error('Failed to load modules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const overallProgress = modules.length > 0
    ? Math.round(
        modules.reduce((acc, module) => acc + (module.progress || 0), 0) / modules.length
      )
    : 0;

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-orange-600" />
            Learning Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-orange-200 rounded w-3/4"></div>
            <div className="h-4 bg-orange-200 rounded w-full"></div>
            <div className="h-4 bg-orange-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (modules.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-orange-600" />
            Learning Modules
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <GraduationCap className="w-12 h-12 text-orange-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-4">No modules available yet</p>
          <p className="text-xs text-gray-500">
            Check back soon for learning content
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-orange-600" />
            Learning Modules
          </CardTitle>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            {modules.length}+ modules
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Your Progress</span>
            <span className="font-semibold text-orange-700">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Module Preview List */}
        <div className="space-y-2">
          {modules.map((module) => (
            <div
              key={module.id}
              className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onViewAll?.();
              }}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                module.color || 'bg-orange-100'
              }`}>
                {module.icon ? (
                  <span className="text-xl">{module.icon}</span>
                ) : (
                  <BookOpen className="w-5 h-5 text-orange-600" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {module.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {module.lessons.length} lessons
                  </span>
                  {(module.progress || 0) > 0 && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-orange-600 font-medium">
                        {module.progress}% complete
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Indicator */}
              {(module.progress || 0) > 0 ? (
                <div className="flex-shrink-0">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 transform -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="#fed7aa"
                        strokeWidth="3"
                        fill="none"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="#fb923c"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 16}`}
                        strokeDashoffset={`${2 * Math.PI * 16 * (1 - (module.progress || 0) / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-orange-600">
                        {module.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* View All Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onViewAll?.();
          }}
          variant="outline"
          className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
        >
          View All Modules
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}