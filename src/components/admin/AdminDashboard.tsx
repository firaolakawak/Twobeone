import { useState, useEffect } from 'react';
import { TrendingUp, Users, BookOpen, MessageCircle, GraduationCap, Heart, RefreshCw } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';

interface AdminDashboardProps {
  accessToken?: string;
  onNavigate?: (section: string) => void;
}

export function AdminDashboard({ accessToken, onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCouples: 0,
    totalDevotionals: 0,
    totalQuestions: 0,
    totalJournalEntries: 0,
    totalPrayers: 0,
    completionRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch comprehensive stats from new admin/stats endpoint
      const statsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (statsResponse.ok) {
        const { stats: apiStats } = await statsResponse.json();
        setStats({
          totalUsers: apiStats.totalUsers || 0,
          activeCouples: apiStats.activeCouples || 0,
          totalDevotionals: apiStats.totalDevotionals || 0,
          totalQuestions: apiStats.totalQuestions || 0,
          totalJournalEntries: apiStats.totalJournalEntries || 0,
          totalPrayers: apiStats.totalPrayers || 0,
          completionRate: apiStats.completionRate || 0
        });
      }

      // Fetch recent activity
      const activityResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/admin/recent-activity`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (activityResponse.ok) {
        const { activities } = await activityResponse.json();
        setRecentActivity(activities || []);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Sample statistics - will be replaced with real data
  const displayStats = [
    { 
      label: 'Total Users', 
      value: stats.totalUsers.toString(), 
      change: '+12%', 
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      label: 'Active Couples', 
      value: stats.activeCouples.toString(), 
      change: '+8%', 
      trend: 'up',
      icon: Heart,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100'
    },
    { 
      label: 'Devotionals', 
      value: stats.totalDevotionals.toString(), 
      change: '+2', 
      trend: 'up',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    { 
      label: 'Q&A Questions', 
      value: stats.totalQuestions.toString(), 
      change: '+8', 
      trend: 'up',
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      label: 'Journal Entries', 
      value: stats.totalJournalEntries.toString(), 
      change: '+15', 
      trend: 'up',
      icon: GraduationCap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    { 
      label: 'Completion Rate', 
      value: `${stats.completionRate}%`, 
      change: '+5%', 
      trend: 'up',
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
  ];

  const contentNeeded = [
    { type: 'Devotional', date: 'November 15, 2025', status: 'needed' },
    { type: 'Devotional', date: 'November 16, 2025', status: 'needed' },
    { type: 'Module', title: 'Financial Planning', status: 'in-progress' },
    { type: 'Q&A Questions', category: 'Spiritual Growth', status: 'needed' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl mb-2">Dashboard</h2>
          <p className="text-gray-600">Overview of your content management system</p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadDashboardData}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {displayStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <Badge variant={stat.trend === 'up' ? 'default' : 'secondary'} className="bg-green-100 text-green-700">
                  {stat.change}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </Card>

        {/* Content Needed */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Content Needed</h3>
          <div className="space-y-3">
            {contentNeeded.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{item.type}</p>
                  <p className="text-xs text-gray-600">
                    {item.date || item.title || item.category}
                  </p>
                </div>
                <Badge 
                  variant={item.status === 'needed' ? 'destructive' : 'secondary'}
                  className={item.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' : ''}
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          <button 
            onClick={() => onNavigate?.('devotionals')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-center"
          >
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm font-medium">Add Devotional</p>
          </button>
          <button 
            onClick={() => onNavigate?.('questions')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-center"
          >
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm font-medium">Add Question</p>
          </button>
          <button 
            onClick={() => onNavigate?.('modules')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-center"
          >
            <GraduationCap className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm font-medium">Create Module</p>
          </button>
          <button 
            onClick={() => onNavigate?.('groups')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-center"
          >
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm font-medium">Add Group</p>
          </button>
        </div>
      </Card>
    </div>
  );
}