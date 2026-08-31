import { lazy, Suspense, useState } from "react";
import {
  BookOpen,
  BellRing,
  Blocks,
  ClipboardList,
  GraduationCap,
  Home,
  LayoutDashboard,
  Mail,
  Menu,
  MessageCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { AdminDashboard } from "./admin/AdminDashboard";
import { AccountRecovery } from "./admin/AccountRecovery";
import { AuditLog } from "./admin/AuditLog";
import { DevotionalsManager } from "./admin/DevotionalsManager";
import { GroupsManager } from "./admin/GroupsManager";
import { LandingPageManager } from "./admin/LandingPageManager";
import { ModulesManager } from "./admin/ModulesManager";
import { PrivilegeManager } from "./admin/PrivilegeManager";
import { PushNotificationsManager } from "./admin/PushNotificationsManager";
import { QuestionsManager } from "./admin/QuestionsManager";
import { ShabbatShalomConsole } from "./admin/ShabbatShalomConsole";
import { UsersManager } from "./admin/UsersManager";
import { Sidebar, type SidebarItem } from "./admin/dashboard/Sidebar";
import { ContentLanguageProvider } from "../contexts/ContentLanguageContext";
import "../styles/dashboard.css";

const CharacterHouseAdminPreview = lazy(() => import("./admin/CharacterHouseAdminPreview").then((module) => ({ default: module.CharacterHouseAdminPreview })));

interface AdminPanelProps {
  onSignOut: () => void;
  accessToken?: string;
  onBackToHome?: () => void;
}

const sections: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "devotionals", label: "Daily Devotionals", icon: BookOpen },
  { id: "questions", label: "Q&A Questions", icon: MessageCircle },
  { id: "modules", label: "Learning Modules", icon: GraduationCap },
  { id: "groups", label: "Community Groups", icon: Users },
  { id: "users", label: "User Management", icon: TrendingUp },
  { id: "pushNotifications", label: "Push Notifications", icon: BellRing },
  { id: "shabbatShalom", label: "Shabbat Shalom", icon: Mail },
  { id: "landingPage", label: "Landing Page", icon: Home },
  { id: "characterHouse", label: "Character House", icon: Blocks },
  { id: "privileges", label: "Privileges", icon: ShieldCheck },
  { id: "auditLog", label: "Audit Log", icon: ClipboardList },
  { id: "accountRecovery", label: "Account Recovery", icon: ShieldAlert },
];

export function AdminPanel({ onSignOut, accessToken, onBackToHome }: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLabel = sections.find((section) => section.id === activeSection)?.label ?? activeSection;

  return (
    <ContentLanguageProvider>
      <div className="admin-shell">
        <button className="admin-mobile-menu" type="button" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close admin navigation" : "Open admin navigation"} aria-expanded={mobileOpen}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
        {mobileOpen && <button className="admin-sidebar-scrim" type="button" onClick={() => setMobileOpen(false)} aria-label="Close admin navigation" />}
        <Sidebar items={sections} active={activeSection} onNavigate={setActiveSection} onHome={onBackToHome} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

        <div className="admin-shell__body">
          <header className="admin-topbar">
            <div className="admin-topbar__title"><Shield aria-hidden="true" /><div><span>Admin console</span><strong>{activeLabel}</strong></div></div>
            <button type="button" className="admin-secondary-button" onClick={onSignOut} aria-label="Sign out of admin console">Sign out</button>
          </header>
          <div className="admin-shell__content">
            {activeSection === "dashboard" && <AdminDashboard accessToken={accessToken} onNavigate={setActiveSection} />}
            {activeSection === "devotionals" && <DevotionalsManager accessToken={accessToken} />}
            {activeSection === "questions" && <QuestionsManager accessToken={accessToken} />}
            {activeSection === "modules" && <ModulesManager accessToken={accessToken} />}
            {activeSection === "groups" && <GroupsManager accessToken={accessToken} />}
            {activeSection === "users" && <UsersManager accessToken={accessToken} />}
            {activeSection === "pushNotifications" && <PushNotificationsManager accessToken={accessToken} />}
            {activeSection === "shabbatShalom" && <ShabbatShalomConsole accessToken={accessToken} />}
            {activeSection === "landingPage" && <LandingPageManager accessToken={accessToken} />}
            {activeSection === "characterHouse" && <Suspense fallback={<div className="admin-panel">Loading 3D game studio…</div>}><CharacterHouseAdminPreview /></Suspense>}
            {activeSection === "privileges" && <PrivilegeManager accessToken={accessToken} />}
            {activeSection === "auditLog" && <AuditLog accessToken={accessToken || ""} />}
            {activeSection === "accountRecovery" && <AccountRecovery accessToken={accessToken} />}
          </div>
        </div>
      </div>
    </ContentLanguageProvider>
  );
}
