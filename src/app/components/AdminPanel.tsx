import { useState } from "react";
import {
  Shield,
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  GraduationCap,
  Users,
  ChevronRight,
  TrendingUp,
  Home,
  ShieldCheck,
  Menu,
  X,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AdminDashboard } from "./admin/AdminDashboard";
import { DevotionalsManager } from "./admin/DevotionalsManager";
import { QuestionsManager } from "./admin/QuestionsManager";
import { ModulesManager } from "./admin/ModulesManager";
import { GroupsManager } from "./admin/GroupsManager";
import { UsersManager } from "./admin/UsersManager";
import { LandingPageManager } from "./admin/LandingPageManager";
import { PrivilegeManager } from "./admin/PrivilegeManager";
import { AuditLog } from "./admin/AuditLog";
import { AccountRecovery } from "./admin/AccountRecovery";
import { ContentLanguageProvider } from "../contexts/ContentLanguageContext";

interface AdminPanelProps {
  onSignOut: () => void;
  accessToken?: string;
  onBackToHome?: () => void;
}

export function AdminPanel({
  onSignOut,
  accessToken,
  onBackToHome,
}: AdminPanelProps) {
  const [activeSection, setActiveSection] =
    useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const sections = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "devotionals",
      label: "Daily Devotionals",
      icon: BookOpen,
    },
    {
      id: "questions",
      label: "Q&A Questions",
      icon: MessageCircle,
    },
    {
      id: "modules",
      label: "Learning Modules",
      icon: GraduationCap,
    },
    { id: "groups", label: "Community Groups", icon: Users },
    { id: "users", label: "User Management", icon: TrendingUp },
    { id: "landingPage", label: "Landing Page", icon: Home },
    {
      id: "privileges",
      label: "Privileges",
      icon: ShieldCheck,
    },
    {
      id: "auditLog",
      label: "Audit Log",
      icon: ClipboardList,
    },
    {
      id: "accountRecovery",
      label: "Account Recovery",
      icon: ShieldAlert,
    },
  ];

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  const activeSectionLabel =
    sections.find((section) => section.id === activeSection)
      ?.label ??
    activeSection;

  return (
    <ContentLanguageProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-50 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
                <div className="flex items-center gap-3 rounded-3xl bg-slate-100 px-4 py-3 shadow-sm">
                  <Shield className="w-5 h-5 text-slate-700" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      Admin Console
                    </p>
                    <h1 className="text-lg font-semibold">
                      TwoBeOne Dashboard
                    </h1>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-600 shadow-sm">
                  {activeSectionLabel}
                </div>
                <Button
                  variant="ghost"
                  onClick={onSignOut}
                  size="sm"
                  className="px-4"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
              <div
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}

            {/* Sidebar */}
            <div
              className={`
              lg:col-span-3
              fixed lg:relative
              inset-y-0 left-0
              z-50 lg:z-0
              w-72 lg:w-auto
              transform lg:transform-none
              transition-transform duration-300 ease-in-out
              ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
            >
              <Card className="p-5 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto bg-white/95 border border-slate-200 shadow-sm">
                <h3 className="font-semibold mb-5 text-sm text-slate-500 uppercase tracking-[0.18em]">
                  Navigation
                </h3>
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        onClick={() => handleNavigate(section.id)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-3xl text-left transition-all duration-200 ${
                          isActive
                            ? "bg-slate-900 text-white shadow-lg"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium text-sm">
                            {section.label}
                          </span>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-5 h-5 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                  {onBackToHome && (
                    <button
                      onClick={() => {
                        onBackToHome();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-3xl transition-all duration-200 text-slate-700 hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <Home className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">
                          Home
                        </span>
                      </div>
                    </button>
                  )}
                </nav>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9 mt-4 lg:mt-0">
              {activeSection === "dashboard" && (
                <div className="rounded-[28px] bg-white border border-slate-200 p-6 shadow-sm">
                  <AdminDashboard
                    accessToken={accessToken}
                    onNavigate={setActiveSection}
                  />
                </div>
              )}
              {activeSection === "devotionals" && (
                <DevotionalsManager accessToken={accessToken} />
              )}
              {activeSection === "questions" && (
                <QuestionsManager accessToken={accessToken} />
              )}
              {activeSection === "modules" && (
                <ModulesManager accessToken={accessToken} />
              )}
              {activeSection === "groups" && (
                <GroupsManager accessToken={accessToken} />
              )}
              {activeSection === "users" && (
                <UsersManager accessToken={accessToken} />
              )}
              {activeSection === "landingPage" && (
                <LandingPageManager accessToken={accessToken} />
              )}
              {activeSection === "privileges" && (
                <PrivilegeManager accessToken={accessToken} />
              )}
              {activeSection === "auditLog" && (
                <AuditLog accessToken={accessToken || ''} />
              )}
              {activeSection === "accountRecovery" && (
                <AccountRecovery accessToken={accessToken} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ContentLanguageProvider>
  );
}