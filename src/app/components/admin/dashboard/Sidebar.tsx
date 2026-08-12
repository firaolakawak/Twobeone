import { useState, type ComponentType } from "react";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

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
  const [collapsed, setCollapsed] = useState(false);
  const go = (id: string) => {
    onNavigate(id);
    onMobileClose?.();
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? "admin-sidebar--collapsed" : ""} ${mobileOpen ? "admin-sidebar--mobile-open" : ""}`} aria-label="Admin sidebar">
      <div className="admin-sidebar__brand">
        <span className="admin-sidebar__mark" aria-hidden="true">2·1</span>
        {!collapsed && <span>TwoBeOne</span>}
      </div>
      <button
        className="admin-sidebar__collapse"
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </button>
      <nav className="admin-sidebar__nav" aria-label="Admin navigation">
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
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="admin-sidebar__icon" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
        {onHome && (
          <button type="button" className="admin-sidebar__item" onClick={onHome} aria-label="Back to app" title={collapsed ? "Back to app" : undefined}>
            <Home className="admin-sidebar__icon" />
            {!collapsed && <span>Back to app</span>}
          </button>
        )}
      </nav>
    </aside>
  );
}
