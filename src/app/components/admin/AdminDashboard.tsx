import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  BookOpen,
  MessageCircle,
  GraduationCap,
  Heart,
  RefreshCw,
} from "lucide-react";
import '../../styles/dashboard.css';
import { KPICard } from './dashboard/KPICard';
import { Timeline } from './dashboard/Timeline';
import { Kanban } from './dashboard/Kanban';
import { QuickActions } from './dashboard/QuickActions';
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { projectId } from "../../utils/supabase/info";
import { toast } from "sonner";

interface AdminDashboardProps {
  accessToken?: string;
  onNavigate?: (section: string) => void;
}

export function AdminDashboard({
  accessToken,
  onNavigate,
}: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCouples: 0,
    totalDevotionals: 0,
    totalQuestions: 0,
    totalJournalEntries: 0,
    totalPrayers: 0,
    completionRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Guard: only fetch once a real user token is available.
    // Using the anon key on admin routes causes the edge function to crash
    // before sending response headers → browser throws TypeError: Failed to fetch.
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    loadDashboardData();
  }, [accessToken]); // re-run when token becomes available after async auth

  const loadDashboardData = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };
      const base = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee`;

      const [statsRes, activityRes] = await Promise.all([
        fetch(`${base}/admin/stats`, { headers }),
        fetch(`${base}/admin/recent-activity`, { headers }),
      ]);

      if (statsRes.ok) {
        const { stats: apiStats } = await statsRes.json();
        setStats({
          totalUsers: apiStats.totalUsers || 0,
          activeCouples: apiStats.activeCouples || 0,
          totalDevotionals: apiStats.totalDevotionals || 0,
          totalQuestions: apiStats.totalQuestions || 0,
          totalJournalEntries:
            apiStats.totalJournalEntries || 0,
          totalPrayers: apiStats.totalPrayers || 0,
          completionRate: apiStats.completionRate || 0,
        });
      } else {
        console.warn(
          "Admin stats:",
          statsRes.status,
          await statsRes.text(),
        );
      }

      if (activityRes.ok) {
        const { activities } = await activityRes.json();
        setRecentActivity(activities || []);
      } else {
        console.warn(
          "Admin activity:",
          activityRes.status,
          await activityRes.text(),
        );
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error(
        "Failed to load dashboard data. Please refresh.",
      );
    } finally {
      setIsLoading(false);
    }
  }; // Sample statistics - will be replaced with real data

  const displayStats = [
    {
      label: "Total Users",
      value: stats.totalUsers.toString(),
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "text-sky-600",
      bgColor: "bg-sky-100",
      link: "users",
    },
    {
      label: "Active Couples",
      value: stats.activeCouples.toString(),
      change: "+8%",
      trend: "up",
      icon: Heart,
      color: "text-primary-600",
      bgColor: "bg-primary-100",
      link: "users",
    },
    {
      label: "Devotionals",
      value: stats.totalDevotionals.toString(),
      change: "+2",
      trend: "up",
      icon: BookOpen,
      color: "text-primary-600",
      bgColor: "bg-primary-100",
      link: "devotionals",
    },
    {
      label: "Q&A Questions",
      value: stats.totalQuestions.toString(),
      change: "+8",
      trend: "up",
      icon: MessageCircle,
      color: "text-success-700",
      bgColor: "bg-success-50",
      link: "questions",
    },
    {
      label: "Journal Entries",
      value: stats.totalJournalEntries.toString(),
      change: "+15",
      trend: "up",
      icon: GraduationCap,
      color: "text-sky-600",
      bgColor: "bg-sky-100",
      link: "modules",
    },
    {
      label: "Completion Rate",
      value: `${stats.completionRate}%`,
      change: "+5%",
      trend: "up",
      icon: TrendingUp,
      color: "text-warning-500",
      bgColor: "bg-warning-50",
      link: "dashboard",
    },
  ];

  const contentNeeded = [
    {
      type: "Devotional",
      date: "November 15, 2025",
      status: "needed",
    },
    {
      type: "Devotional",
      date: "November 16, 2025",
      status: "needed",
    },
    {
      type: "Module",
      title: "Financial Planning",
      status: "in-progress",
    },
    {
      type: "Q&A Questions",
      category: "Spiritual Growth",
      status: "needed",
    },
  ];

  return (
    <div className="tb-dashboard space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <div className="rounded-[32px] bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Overview
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Calm admin review
              </h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                A premium dashboard for content, growth, and user health.
                Monitor core metrics, see recent activity, and keep the admin
                experience clean and understated.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Live users
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Active couples
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {stats.activeCouples}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                Admin insights
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Platform pulse
              </h3>
            </div>
            <Badge variant="secondary">Updated just now</Badge>
          </div>
          <div className="mt-6 grid gap-4">
            <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-sm text-slate-600">Completion rate</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {stats.completionRate}%
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-sm text-slate-600">Recent activity items</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {recentActivity.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {displayStats.map((stat, i) => (
            <KPICard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              change={stat.change}
              icon={<span style={{ opacity: 0.08, fontSize: 56 }}>★</span>}
              delay={i * 90}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Recent activity
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Latest platform events and content changes.
                </p>
              </div>
              <Button variant="outline" size="sm">
                Refresh
              </Button>
            </div>
            <div className="mt-6">
              <Timeline items={recentActivity.slice(0, 6)} />
            </div>
          </div>

          <div className="rounded-[32px] bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Content pipeline
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Track what needs attention this week.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Kanban
                columns={[
                  { title: 'Needed', cards: contentNeeded },
                  { title: 'In Progress', cards: [] },
                  { title: 'Completed', cards: [] },
                ]}
              />
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[32px] bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">
              Quick actions
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Create new content and manage workflows with one tap.
            </p>
            <div className="mt-6">
              <QuickActions onAction={(a) => onNavigate?.(a)} />
            </div>
          </div>

          <div className="rounded-[32px] bg-slate-50 border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Health summary
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Couple Health Score: <strong>82%</strong>
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
