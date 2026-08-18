import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "../../AdminDashboard";
import { admin as adminApi } from "../../../../utils/api";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("../../../../utils/api", () => ({
  admin: {
    getStats: vi.fn(),
    getActivityLog: vi.fn(),
  },
}));
describe("AdminDashboard", () => {
  it("renders its primary regions before API data is available", async () => {
    render(<AdminDashboard onNavigate={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Good morning, Admin" })).toBeInTheDocument();
    expect(screen.getByLabelText("Platform metrics")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent activity" })).toBeInTheDocument();
    expect(await screen.findByLabelText("Content workflow board")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Quick actions" })).toBeInTheDocument();
    expect(screen.queryByText("Shabbat Shalom")).not.toBeInTheDocument();
  });

  it("renders database KPI data even when recent activity fails", async () => {
    vi.mocked(adminApi.getStats).mockResolvedValueOnce({
      stats: {
        totalUsers: 42,
        activeCouples: 17,
        totalDevotionals: 9,
        totalQuestions: 30,
        totalModules: 4,
        totalJournalEntries: 81,
        totalPrayers: 12,
        completionRate: 76,
      },
    });
    vi.mocked(adminApi.getActivityLog).mockRejectedValueOnce(new Error("Activity unavailable"));

    render(<AdminDashboard accessToken="session-token" />);

    expect(await screen.findByLabelText("Total users: 42. Trend up, 12%"))
      .toBeInTheDocument();
    expect(screen.getByLabelText("Completion rate: 76%. Trend up, 5%"))
      .toBeInTheDocument();
  });

  it("renders the live feed from persisted activity-log entries", async () => {
    vi.mocked(adminApi.getStats).mockResolvedValueOnce({
      stats: {
        totalUsers: 1, activeCouples: 0, totalDevotionals: 0,
        totalQuestions: 0, totalModules: 0, totalJournalEntries: 0,
        totalPrayers: 0, completionRate: 0,
      },
    });
    vi.mocked(adminApi.getActivityLog).mockResolvedValueOnce({
      entries: [{
        id: "audit-123",
        event: "admin.module_updated",
        category: "admin",
        userId: "user-1",
        userName: "Marta",
        userEmail: "marta@example.com",
        metadata: { title: "Healthy conflict" },
        timestamp: new Date().toISOString(),
      }],
      total: 1,
      offset: 0,
      limit: 20,
    });

    render(<AdminDashboard accessToken="session-token" />);

    const activity = await screen.findByRole("button", {
      name: /Admin module updated.*Expand details/i,
    });
    expect(activity).toBeInTheDocument();
  });
});
