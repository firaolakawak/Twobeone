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

  return (
    <ContentLanguageProvider>
      <div className="min-h-screen bg-muted">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary-600 to-sky-600 text-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() =>
                    setIsMobileMenuOpen(!isMobileMenuOpen)
                  }
                  className="lg:hidden p-2 hover:bg-primary-700 rounded-lg transition-colors"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
                <Shield className="w-7 h-7 sm:w-8 sm:h-8" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">
                    TwoBeOne Admin
                  </h1>
                  <p className="text-sm text-primary-100 hidden sm:block">
                    Content Management System
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={onSignOut}
                size="sm"
                className="text-sm px-4 text-[#6d0d3a] text-[#a1044e]"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto mx-[100px] my-[0px] p-[0px]">
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
              <Card className="p-5 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
                <h3 className="font-semibold mb-5 text-sm text-muted-foreground uppercase tracking-wide">
                  Navigation
                </h3>
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive =
                      activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        onClick={() =>
                          handleNavigate(section.id)
                        }
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg transition-all ${
                          isActive
                            ? "bg-primary-600 text-white shadow-md"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium text-base">
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
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-lg transition-all text-foreground hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Home className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-base">
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
                <AdminDashboard
                  accessToken={accessToken}
                  onNavigate={setActiveSection}
                />
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