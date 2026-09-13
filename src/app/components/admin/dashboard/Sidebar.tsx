import { useUiCopy } from "../../../utils/uiTranslation";
import { adminCommonMessages } from "../../../locales/adminCommon";
import { useState, type ComponentType } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BackButton } from "../../BackButton";

export interface SidebarItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface SidebarProps {
  items?: SidebarItem[];
  active: string;
  onNavigate: (id: string) => void;
  onHome?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ items = [], active, onNavigate, onHome, mobileOpen = false, onMobileClose }: SidebarProps) {
  const tr = useUiCopy(adminCommonMessages);
  const [collapsed, setCollapsed] = useState(false);
  const go = (id: string) => {
    onNavigate(id);
    onMobileClose?.();
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? "admin-sidebar--collapsed" : ""} ${mobileOpen ? "admin-sidebar--mobile-open" : ""}`} aria-label={tr("Admin sidebar")}>
      <div className="admin-sidebar__brand">
        <span className="admin-sidebar__mark" aria-hidden="true">2·1</span>
        {!collapsed && <span>TwoBeOne</span>}
      </div>
      <button
        className="admin-sidebar__collapse"
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? tr("Expand sidebar") : tr("Collapse sidebar")}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </button>
      <nav className="admin-sidebar__nav" aria-label={tr("Admin navigation")}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className="admin-sidebar__item"
              data-active={isActive || undefined}
              onClick={() => go(item.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={tr(item.label)}
              title={collapsed ? tr(item.label) : undefined}
            >
              <Icon className="admin-sidebar__icon" />
              {!collapsed && <span>{tr(item.label)}</span>}
            </button>
          );
        })}
        {onHome && (
          <BackButton onClick={onHome} label={tr("Back to app")} showLabel={!collapsed} className="mt-2" />
        )}
      </nav>
    </aside>
  );
}
