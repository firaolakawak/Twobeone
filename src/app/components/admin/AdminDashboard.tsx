import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, GraduationCap, Heart, MessageCircle, RefreshCw, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { projectId } from "../../utils/supabase/info";
import { admin as adminApi } from "../../utils/api";
import { ActionBar } from "./dashboard/ActionBar";
import { KPICard } from "./dashboard/KPICard";
import { Timeline, type TimelineEvent } from "./dashboard/Timeline";
import type { KanbanColumn, KanbanStatePayload } from "./dashboard/MiniKanban";
import "../../styles/dashboard.css";

const MiniKanban = lazy(() =>
  import("./dashboard/MiniKanban").then((module) => ({ default: module.MiniKanban })),
);

interface AdminDashboardProps {
  accessToken?: string;
  onNavigate?: (section: string) => void;
}

interface DashboardStats {
  totalUsers: number;
  activeCouples: number;
  totalDevotionals: number;
  totalQuestions: number;
  totalJournalEntries: number;
  totalPrayers: number;
  completionRate: number;
}

interface ActivityLogEntry {
  id: string;
  event: string;
  category: string;
  userId: string;
  userName: string;
  userEmail: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

const emptyStats: DashboardStats = {
  totalUsers: 0,
  activeCouples: 0,
  totalDevotionals: 0,
  totalQuestions: 0,
  totalJournalEntries: 0,
  totalPrayers: 0,
  completionRate: 0,
};

const initialColumns: KanbanColumn[] = [
  {
    id: "needed",
    title: "Needed",
    cards: [
      { id: "devotional-15", title: "Hope in waiting", category: "Devotional", dueDate: "2026-08-15", priority: "High" },
      { id: "questions-growth", title: "Spiritual growth prompts", category: "Q&A", dueDate: "2026-08-18", priority: "Medium" },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    cards: [
      { id: "module-finance", title: "Financial planning", category: "Module", dueDate: "2026-08-20", priority: "High" },
    ],
  },
  { id: "completed", title: "Completed", cards: [] },
];

export function AdminDashboard({ accessToken, onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee`;

  const loadDashboardData = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const [statsResult, activityResult] = await Promise.allSettled([
      adminApi.getStats(),
      adminApi.getActivityLog(20),
    ]);

    if (statsResult.status === "fulfilled") {
      const nextStats = statsResult.value.stats;
      if (nextStats?._error) {
        console.error("Admin stats query failed:", nextStats._error);
        toast.error(`Could not load KPI data: ${nextStats._error}`);
      } else {
        setStats({ ...emptyStats, ...(nextStats ?? {}) });
      }
    } else {
      console.error("Failed to load KPI data:", statsResult.reason);
      toast.error(`Could not load KPI data: ${statsResult.reason?.message ?? "Unknown error"}`);
    }

    if (activityResult.status === "fulfilled") {
      const entries = activityResult.value.entries;
      setActivityLog(Array.isArray(entries) ? entries : []);
    } else {
      console.error("Failed to load recent activity:", activityResult.reason);
    }
    setIsLoading(false);
  }, [accessToken]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const kpis = useMemo(() => [
    { label: "Total users", value: stats.totalUsers, trend: { direction: "up" as const, value: "12%" }, sparklineData: [24, 29, 27, 35, 38, 42, 48], icon: <Users /> },
    { label: "Active couples", value: stats.activeCouples, trend: { direction: "up" as const, value: "8%" }, sparklineData: [18, 21, 24, 23, 30, 34, 37], icon: <Heart /> },
    { label: "Devotionals", value: stats.totalDevotionals, trend: { direction: "up" as const, value: "+2" }, sparklineData: [12, 12, 14, 15, 15, 16, 18], icon: <BookOpen /> },
    { label: "Q&A questions", value: stats.totalQuestions, trend: { direction: "up" as const, value: "+8" }, sparklineData: [31, 34, 33, 38, 41, 47, 51], icon: <MessageCircle /> },
    { label: "Journal entries", value: stats.totalJournalEntries, trend: { direction: "up" as const, value: "+15" }, sparklineData: [40, 46, 43, 51, 58, 62, 70], icon: <GraduationCap /> },
    { label: "Completion rate", value: `${stats.completionRate}%`, trend: { direction: "up" as const, value: "5%" }, sparklineData: [62, 64, 67, 65, 73, 78, 82], icon: <TrendingUp /> },
  ], [stats]);

  const events = useMemo<TimelineEvent[]>(() => {
    const formatEventName = (event: string) => {
      const words = event.replace(/[._-]+/g, " ").trim();
      return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Activity recorded";
    };
    const formatDetails = (entry: ActivityLogEntry) => {
      const metadata = Object.entries(entry.metadata ?? {})
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => `${key.replace(/([A-Z])/g, " $1").toLowerCase()}: ${String(value)}`)
        .join(" · ");
      const actor = entry.userName || entry.userEmail || entry.userId || "Unknown user";
      return metadata ? `${actor} · ${metadata}` : actor;
    };

    return activityLog.slice(0, 6).map((entry) => ({
      id: entry.id,
      type: entry.category || entry.event.split(".")[0] || "system",
      title: formatEventName(entry.event),
      time: entry.timestamp,
      details: formatDetails(entry),
    }));
  }, [activityLog]);

  const persistKanban = useCallback(async (payload: KanbanStatePayload) => {
    if (!accessToken) throw new Error("An admin session is required");
    const response = await fetch(`${apiBase}/admin/kanban`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Could not persist Kanban state");
  }, [accessToken, apiBase]);

  return (
    <main className="admin-dashboard" aria-busy={isLoading}>
      <header className="admin-dashboard__hero">
        <div>
          <p className="admin-eyebrow">Overview</p>
          <h1>Good morning, Admin</h1>
          <p>Here’s what’s happening across TwoBeOne today.</p>
        </div>
        <button className="admin-secondary-button" type="button" onClick={() => void loadDashboardData()} aria-label="Refresh dashboard data" disabled={isLoading}>
          <RefreshCw aria-hidden="true" /> {isLoading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <section className="admin-grid admin-kpi-grid" aria-label="Platform metrics">
        {kpis.map((kpi) => <KPICard key={kpi.label} {...kpi} />)}
      </section>

      <section className="admin-grid admin-dashboard__content">
        <div className="admin-panel admin-dashboard__timeline">
          <div className="admin-panel__heading">
            <div><p className="admin-eyebrow">Live feed</p><h2>Recent activity</h2></div>
            <span className="admin-live-chip">Live</span>
          </div>
          <Timeline events={events} />
        </div>

        <div className="admin-panel admin-dashboard__health">
          <p className="admin-eyebrow">Platform health</p>
          <h2>Strong momentum</h2>
          <div className="admin-health-score"><span>{stats.completionRate}%</span><small>completion rate</small></div>
          <p>Couples are consistently returning to complete weekly content.</p>
        </div>

        <div className="admin-panel admin-dashboard__kanban">
          <div className="admin-panel__heading">
            <div><p className="admin-eyebrow">Editorial workflow</p><h2>Content pipeline</h2></div>
            <p>Use Space, then arrow keys, to move cards.</p>
          </div>
          <Suspense fallback={<div className="admin-kanban-skeleton" aria-label="Loading content pipeline" />}>
            <MiniKanban columns={initialColumns} onPersist={persistKanban} />
          </Suspense>
        </div>
      </section>

      <ActionBar onAction={onNavigate} />
    </main>
  );
}
