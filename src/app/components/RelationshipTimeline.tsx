import { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Plus, 
  Heart,
  Calendar,
  TrendingUp,
  Award,
  Edit2,
  Trash2,
  Sparkles,
  Clock,
  ChevronRight,
  Trophy,
  Star,
  Gift,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Milestone {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: string;
  category: string;
  emotionLevel: number;
  icon: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  isPartner?: boolean;
}

interface RelationshipTimelineProps {
  milestones: Milestone[];
  onAddMilestone: (milestone: any) => Promise<void>;
  onUpdateMilestone: (id: string, updates: any) => Promise<void>;
  onDeleteMilestone: (id: string) => Promise<void>;
  userName?: string;
  partnerName?: string;
}

const CATEGORIES = [
  { value: 'First Meeting', icon: '👋', color: 'from-sky-500 to-sky-600', emoji: '👋' },
  { value: 'First Date', icon: '🌹', color: 'from-primary-500 to-primary-500', emoji: '🌹' },
  { value: 'Commitment', icon: '💑', color: 'from-primary-500 to-primary-600', emoji: '💑' },
  { value: 'Engagement', icon: '💍', color: 'from-warning-500 to-warning-500', emoji: '💍' },
  { value: 'Wedding', icon: '👰', color: 'from-warning-500 to-error-500', emoji: '👰' },
  { value: 'Anniversary', icon: '🎂', color: 'from-success-500 to-success-700', emoji: '🎂' },
  { value: 'Travel', icon: '✈️', color: 'from-sky-500 to-sky-500', emoji: '✈️' },
  { value: 'Achievement', icon: '🏆', color: 'from-primary-600 to-sky-600', emoji: '🏆' },
  { value: 'Challenge', icon: '💪', color: 'from-error-500 to-primary-500', emoji: '💪' },
  { value: 'Celebration', icon: '🎉', color: 'from-warning-500 to-warning-500', emoji: '🎉' },
  { value: 'Spiritual', icon: '✨', color: 'from-sky-500 to-primary-500', emoji: '✨' },
  { value: 'General', icon: '❤️', color: 'from-primary-400 to-error-500', emoji: '❤️' }
];

const ACHIEVEMENT_BADGES = [
  { id: 'first-year', title: 'First Year Together', description: 'Completed 1 year', icon: '🎊', requirement: 365 },
  { id: 'three-years', title: 'Three Years Strong', description: 'Completed 3 years', icon: '💪', requirement: 1095 },
  { id: 'five-years', title: 'Five Year Milestone', description: 'Completed 5 years', icon: '🏅', requirement: 1825 },
  { id: 'ten-years', title: 'Decade of Love', description: 'Completed 10 years', icon: '👑', requirement: 3650 },
  { id: 'milestone-master', title: 'Memory Keeper', description: 'Added 10+ milestones', icon: '📖', requirement: 10 },
  { id: 'engaged', title: 'Engaged', description: 'Got engaged!', icon: '💍', requirement: 0 },
  { id: 'married', title: 'Married', description: 'Got married!', icon: '💒', requirement: 0 },
  { id: 'traveler', title: 'Adventure Seekers', description: '5+ travel milestones', icon: '🌍', requirement: 5 }
];

export function RelationshipTimeline({
  milestones,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  userName = 'You',
  partnerName = 'Partner'
}: RelationshipTimelineProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [activeView, setActiveView] = useState<'timeline' | 'graph' | 'badges'>('timeline');

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('General');
  const [emotionLevel, setEmotionLevel] = useState(5);
  const [icon, setIcon] = useState('❤️');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setCategory('General');
    setEmotionLevel(5);
    setIcon('❤️');
    setEditingMilestone(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const milestoneData = {
        title,
        description,
        date,
        category,
        emotionLevel,
        icon,
        isShared: true
      };

      if (editingMilestone) {
        await onUpdateMilestone(editingMilestone.id, milestoneData);
        toast.success('Milestone updated!');
      } else {
        await onAddMilestone(milestoneData);
        toast.success('Milestone added to your journey!');
      }

      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save milestone:', error);
      toast.error('Failed to save milestone');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setTitle(milestone.title);
    setDescription(milestone.description);
    setDate(milestone.date);
    setCategory(milestone.category);
    setEmotionLevel(milestone.emotionLevel);
    setIcon(milestone.icon);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this milestone?')) {
      try {
        await onDeleteMilestone(id);
        toast.success('Milestone deleted');
      } catch (error) {
        toast.error('Failed to delete milestone');
      }
    }
  };

  // Calculate achievements
  const achievements = useMemo(() => {
    const earned: typeof ACHIEVEMENT_BADGES = [];
    
    if (milestones.length === 0) return earned;

    // Find first meeting date
    const firstMeeting = milestones.find(m => m.category === 'First Meeting');
    if (firstMeeting) {
      const daysTogether = Math.floor((Date.now() - new Date(firstMeeting.date).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysTogether >= 365) earned.push(ACHIEVEMENT_BADGES[0]);
      if (daysTogether >= 1095) earned.push(ACHIEVEMENT_BADGES[1]);
      if (daysTogether >= 1825) earned.push(ACHIEVEMENT_BADGES[2]);
      if (daysTogether >= 3650) earned.push(ACHIEVEMENT_BADGES[3]);
    }

    // Milestone count
    if (milestones.length >= 10) earned.push(ACHIEVEMENT_BADGES[4]);

    // Special events
    if (milestones.some(m => m.category === 'Engagement')) earned.push(ACHIEVEMENT_BADGES[5]);
    if (milestones.some(m => m.category === 'Wedding')) earned.push(ACHIEVEMENT_BADGES[6]);

    // Travel count
    const travelCount = milestones.filter(m => m.category === 'Travel').length;
    if (travelCount >= 5) earned.push(ACHIEVEMENT_BADGES[7]);

    return earned;
  }, [milestones]);

  // Calculate relationship stats
  const stats = useMemo(() => {
    if (milestones.length === 0) return null;

    const firstMeeting = milestones.find(m => m.category === 'First Meeting');
    const daysTogether = firstMeeting 
      ? Math.floor((Date.now() - new Date(firstMeeting.date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const avgEmotion = milestones.reduce((acc, m) => acc + m.emotionLevel, 0) / milestones.length;

    return {
      daysTogether,
      totalMilestones: milestones.length,
      avgEmotion: avgEmotion.toFixed(1),
      achievements: achievements.length
    };
  }, [milestones, achievements]);

  const getCategoryData = (categoryName: string) => {
    return CATEGORIES.find(c => c.value === categoryName) || CATEGORIES[CATEGORIES.length - 1];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTimeAgo = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const getEmotionColor = (level: number) => {
    if (level >= 8) return 'from-success-500 to-success-700';
    if (level >= 6) return 'from-sky-500 to-sky-600';
    if (level >= 4) return 'from-warning-500 to-warning-500';
    return 'from-error-500 to-primary-500';
  };

  const getEmotionIcon = (level: number) => {
    if (level >= 7) return <Smile className="w-5 h-5" />;
    if (level >= 4) return <Meh className="w-5 h-5" />;
    return <Frown className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 to-primary-50/30">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Our Journey</h1>
                {stats && (
                  <p className="text-sm text-muted-foreground">{stats.daysTogether} days together</p>
                )}
              </div>
            </div>
            <Button 
              onClick={() => setIsOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary-700">{stats.totalMilestones}</div>
                <div className="text-xs text-primary-600">{t.milestones.title}</div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary-700">{stats.daysTogether}</div>
                <div className="text-xs text-primary-600">Days</div>
              </div>
              <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-sky-700">{stats.avgEmotion}</div>
                <div className="text-xs text-sky-600">Avg Joy</div>
              </div>
              <div className="bg-gradient-to-br from-warning-50 to-warning-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-warning-700">{stats.achievements}</div>
                <div className="text-xs text-warning-500">Badges</div>
              </div>
            </div>
          )}

          {/* View Tabs */}
          <div className="flex items-center gap-2">
            <Button
              variant={activeView === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('timeline')}
              className={activeView === 'timeline' ? 'bg-gradient-to-r from-primary-600 to-primary-700' : ''}
            >
              <Clock className="w-4 h-4 mr-2" />
              Timeline
            </Button>
            <Button
              variant={activeView === 'graph' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('graph')}
              className={activeView === 'graph' ? 'bg-gradient-to-r from-primary-600 to-primary-700' : ''}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Emotions
            </Button>
            <Button
              variant={activeView === 'badges' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('badges')}
              className={activeView === 'badges' ? 'bg-gradient-to-r from-primary-600 to-primary-700' : ''}
            >
              <Award className="w-4 h-4 mr-2" />
              Badges
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pb-6">
        {/* Timeline View */}
        {activeView === 'timeline' && (
          <div className="space-y-6 mt-6">
            {milestones.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <Heart className="w-12 h-12 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{t.milestones.noMilestones}</h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  {t.dashboard.celebrateJourney}
                </p>
                <Button
                  onClick={() => setIsOpen(true)}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {t.milestones.addFirstMilestone}
                </Button>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-200 to-primary-200"></div>

                {milestones.map((milestone, index) => {
                  const catData = getCategoryData(milestone.category);
                  const isOwn = !milestone.isPartner;

                  return (
                    <div key={milestone.id} className="relative pl-20 pb-8">
                      {/* Timeline Dot */}
                      <div className={`absolute left-5 top-0 w-6 h-6 rounded-full bg-gradient-to-br ${catData.color} flex items-center justify-center ring-4 ring-white shadow-lg`}>
                        <span className="text-xs">{milestone.icon}</span>
                      </div>

                      {/* Content Card */}
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0">
                        <div className={`h-2 bg-gradient-to-r ${catData.color}`}></div>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {milestone.category}
                                </Badge>
                                {milestone.isPartner && (
                                  <Badge className="bg-gradient-to-r from-primary-100 to-error-50 text-primary-800 text-xs">
                                    💕 {partnerName}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold text-foreground mb-1">
                                {milestone.title}
                              </h3>
                            </div>
                            
                            {/* Emotion Level */}
                            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r ${getEmotionColor(milestone.emotionLevel)} text-white text-sm font-medium`}>
                              {getEmotionIcon(milestone.emotionLevel)}
                              <span>{milestone.emotionLevel}/10</span>
                            </div>
                          </div>

                          {milestone.description && (
                            <p className="text-foreground text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                              {milestone.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(milestone.date)}
                              </span>
                              <span className="text-xs text-muted-foreground">{getTimeAgo(milestone.date)}</span>
                            </div>

                            {isOwn && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(milestone)}
                                  className="h-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(milestone.id)}
                                  className="h-8 text-error-500 hover:text-error-700 hover:bg-error-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Emotion Graph View */}
        {activeView === 'graph' && (
          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Emotional Journey</CardTitle>
              </CardHeader>
              <CardContent>
                {milestones.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Add milestones to see your emotional journey</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Simple Bar Graph */}
                    <div className="h-64 flex items-end justify-between gap-2">
                      {milestones.slice(-10).map((milestone, index) => {
                        const height = (milestone.emotionLevel / 10) * 100;
                        const catData = getCategoryData(milestone.category);
                        
                        return (
                          <div key={milestone.id} className="flex-1 flex flex-col items-center gap-2">
                            <div 
                              className={`w-full rounded-t-lg bg-gradient-to-t ${getEmotionColor(milestone.emotionLevel)} transition-all hover:opacity-80 cursor-pointer`}
                              style={{ height: `${height}%` }}
                              title={`${milestone.title}: ${milestone.emotionLevel}/10`}
                            ></div>
                            <span className="text-2xl">{milestone.icon}</span>
                            <span className="text-xs text-muted-foreground text-center line-clamp-1">
                              {milestone.category}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-r from-success-500 to-success-700"></div>
                        <span className="text-xs text-muted-foreground">High (8-10)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-r from-sky-500 to-sky-600"></div>
                        <span className="text-xs text-muted-foreground">Good (6-7)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-r from-warning-500 to-warning-500"></div>
                        <span className="text-xs text-muted-foreground">Medium (4-5)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gradient-to-r from-error-500 to-primary-500"></div>
                        <span className="text-xs text-muted-foreground">Low (1-3)</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Badges View */}
        {activeView === 'badges' && (
          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-warning-500" />
                  Achievement Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {ACHIEVEMENT_BADGES.map((badge) => {
                    const isEarned = achievements.some(a => a.id === badge.id);
                    
                    return (
                      <div 
                        key={badge.id}
                        className={`relative overflow-hidden rounded-xl p-4 transition-all ${
                          isEarned 
                            ? 'bg-gradient-to-br from-warning-50 to-warning-50 border-2 border-warning-500/50 shadow-md' 
                            : 'bg-muted border-2 border-border opacity-50 grayscale'
                        }`}
                      >
                        {isEarned && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center">
                              <Star className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>
                        )}
                        
                        <div className="text-4xl mb-3">{badge.icon}</div>
                        <h4 className="font-semibold text-foreground mb-1">{badge.title}</h4>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add/Edit Milestone Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? t.milestones.editMilestone : t.milestones.addMilestone}</DialogTitle>
            <DialogDescription>
              Add a special moment to your relationship timeline
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      setCategory(cat.value);
                      setIcon(cat.emoji);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      category === cat.value
                        ? `border-primary-500 bg-primary-50 scale-105`
                        : 'border-border hover:border-primary-300'
                    }`}
                  >
                    <span className="text-2xl mb-1">{cat.emoji}</span>
                    <span className="text-xs text-center leading-tight">{cat.value}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., First Met at Coffee Shop"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Share the story behind this moment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Emotion Level */}
            <div className="space-y-2">
              <Label htmlFor="emotion">
                How did you feel? (1-10)
              </Label>
              <div className="flex items-center gap-4">
                <input
                  id="emotion"
                  type="range"
                  min="1"
                  max="10"
                  value={emotionLevel}
                  onChange={(e) => setEmotionLevel(Number(e.target.value))}
                  className="flex-1"
                />
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getEmotionColor(emotionLevel)} text-white font-medium min-w-[80px] justify-center`}>
                  {getEmotionIcon(emotionLevel)}
                  <span>{emotionLevel}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
              >
                {isLoading ? t.common.loading : editingMilestone ? t.common.save : t.milestones.addMilestone}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
