import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Play, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
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
  description: string;
  lessons: Lesson[];
  icon?: string;
  color?: string;
}

interface LessonScreenProps {
  moduleId: string;
  lessonId?: string;
  onBack: () => void;
  accessToken?: string;
}

export function LessonScreen({ moduleId, lessonId, onBack, accessToken }: LessonScreenProps) {
  const [notes, setNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [module, setModule] = useState<Module | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [moduleProgress, setModuleProgress] = useState(0);

  useEffect(() => {
    loadModule();
  }, [moduleId]);

  useEffect(() => {
    if (module && lessonId) {
      const index = module.lessons.findIndex(l => l.id === lessonId);
      if (index >= 0) {
        setCurrentLessonIndex(index);
      }
    }
  }, [module, lessonId]);

  // Load notes and completion status when lesson changes
  useEffect(() => {
    if (module && module.lessons[currentLessonIndex]) {
      loadLessonData(module.lessons[currentLessonIndex].id);
    }
  }, [currentLessonIndex, module]);

  const loadModule = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules/${moduleId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const { module: apiModule } = await response.json();
        setModule(apiModule);
        
        // Load progress for this module
        await loadModuleProgress();
      } else {
        toast.error('Failed to load module');
        onBack();
      }
    } catch (error) {
      console.error('Failed to load module:', error);
      toast.error('Failed to load module');
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadModuleProgress = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules/${moduleId}/progress`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const { progress, completions } = await response.json();
        setModuleProgress(progress);
        
        // Store completed lesson IDs
        const completedIds = new Set(completions.map((c: any) => c.lessonId));
        setCompletedLessonIds(completedIds);
      }
    } catch (error) {
      console.error('Failed to load module progress:', error);
    }
  };

  const loadLessonData = async (lessonId: string) => {
    try {
      // Load saved notes
      const notesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules/${moduleId}/lessons/${lessonId}/notes`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (notesResponse.ok) {
        const { note } = await notesResponse.json();
        if (note && note.notes) {
          setNotes(note.notes);
        } else {
          setNotes('');
        }
      }

      // Check if lesson is completed
      setIsCompleted(completedLessonIds.has(lessonId));
    } catch (error) {
      console.error('Failed to load lesson data:', error);
      setNotes('');
      setIsCompleted(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl">Loading...</h1>
          </div>
        </div>
        <Card className="p-8 text-center">
          <p className="text-gray-600">Loading lesson content...</p>
        </Card>
      </div>
    );
  }

  if (!module || !module.lessons || module.lessons.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl">No Lessons Available</h1>
          </div>
        </div>
        <Card className="p-8 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">This module doesn't have any lessons yet</p>
          <Button onClick={onBack} variant="outline">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const currentLesson = module.lessons[currentLessonIndex];
  const progress = Math.round(((currentLessonIndex + 1) / module.lessons.length) * 100);

  const goToNextLesson = () => {
    if (currentLessonIndex < module.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setIsCompleted(false);
      setNotes('');
    }
  };

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setIsCompleted(false);
      setNotes('');
    }
  };

  const handleMarkComplete = async () => {
    // Save notes only if they're not empty
    if (notes.trim()) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules/${moduleId}/lessons/${currentLesson.id}/notes`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken || publicAnonKey}`
            },
            body: JSON.stringify({ notes: notes.trim() })
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Save notes error response:', errorData);
          throw new Error(errorData.error || 'Failed to save notes');
        }
        
        const result = await response.json();
        console.log('Notes saved successfully:', result);
        toast.success('Notes saved!');
      } catch (error: any) {
        console.error('Failed to save notes:', error);
        toast.error(error.message || 'Failed to save notes');
        return; // Don't proceed if saving fails
      }
    }

    // Mark lesson as completed on backend
    try {
      const completeResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/modules/${moduleId}/lessons/${currentLesson.id}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json().catch(() => ({}));
        console.error('Mark complete error response:', errorData);
        throw new Error(errorData.error || 'Failed to mark lesson complete');
      }

      const result = await completeResponse.json();
      console.log('Lesson marked complete:', result);

      // Update local state
      setIsCompleted(true);
      setCompletedLessonIds(prev => new Set([...prev, currentLesson.id]));
      
      // Reload progress
      await loadModuleProgress();

    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
      toast.error('Failed to mark lesson complete');
      return;
    }
    
    // Auto-advance to next lesson after a brief delay
    setTimeout(() => {
      if (currentLessonIndex < module.lessons.length - 1) {
        goToNextLesson();
        toast.success('Moving to next lesson!');
      } else {
        toast.success('Module completed! 🎉');
      }
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <p className="text-sm text-gray-600">{module.title}</p>
          <h1 className="text-2xl">{currentLesson.title}</h1>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Your Progress
          </span>
          <span className="text-sm font-medium">{moduleProgress}%</span>
        </div>
        <Progress value={moduleProgress} className="h-2" />
        <p className="text-xs text-gray-500 mt-2">
          {completedLessonIds.size} of {module.lessons.length} lessons completed
        </p>
      </Card>

      {/* Lesson Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousLesson}
            disabled={currentLessonIndex === 0}
          >
            Previous Lesson
          </Button>
          <span className="text-sm text-gray-600">
            {currentLesson.duration}
          </span>
          <Button
            variant="outline"
            onClick={goToNextLesson}
            disabled={currentLessonIndex === module.lessons.length - 1}
          >
            Next Lesson
          </Button>
        </div>
      </Card>

      {/* Content */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-rose-600" />
          <h3 className="font-semibold">Lesson Content</h3>
        </div>
        <ScrollArea className="h-96">
          <div className="prose prose-sm max-w-none whitespace-pre-line">
            {currentLesson.content}
          </div>
        </ScrollArea>
      </Card>

      {/* Notes Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Your Notes</h3>
        </div>
        <Textarea
          placeholder="Take notes about what you've learned and how you'll apply it..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-32"
        />
      </Card>

      {/* Complete Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleMarkComplete}
          disabled={isCompleted}
          className="flex-1 h-12"
          size="lg"
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Lesson Completed
            </>
          ) : (
            'Mark as Complete'
          )}
        </Button>
        {isCompleted && currentLessonIndex < module.lessons.length - 1 && (
          <Button
            onClick={goToNextLesson}
            variant="outline"
            className="h-12"
            size="lg"
          >
            Next Lesson
          </Button>
        )}
      </div>

      {/* All Lessons List */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">All Lessons in This Module</h3>
        <div className="space-y-2">
          {module.lessons.map((lesson, index) => {
            const isLessonCompleted = completedLessonIds.has(lesson.id);
            return (
              <div
                key={lesson.id}
                onClick={() => {
                  setCurrentLessonIndex(index);
                }}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  index === currentLessonIndex
                    ? 'bg-purple-100 border-2 border-purple-600'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isLessonCompleted
                        ? 'bg-green-600 text-white'
                        : index === currentLessonIndex
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border-2 border-gray-300'
                    }`}>
                      {isLessonCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{lesson.title}</p>
                      <p className="text-xs text-gray-600">{lesson.duration}</p>
                    </div>
                  </div>
                  {isLessonCompleted && (
                    <span className="text-xs text-green-600 font-medium">Completed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}