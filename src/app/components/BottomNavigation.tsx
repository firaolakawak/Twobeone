import { useUiCopy } from '../utils/uiTranslation';
import { memo } from 'react';
import { BookOpen, Globe2, HandHeart, Home, MessageCircleHeart, User } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/bottom-navigation.css';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  chatUnreadCount?: number;
}

export const BottomNavigation = memo(function BottomNavigation({ activeTab, onTabChange, chatUnreadCount = 0 }: BottomNavigationProps) {
  const { t } = useLanguage();
  const tr = useUiCopy();
  const prefersReducedMotion = useReducedMotion();

  const tabs = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'devotions', label: t.nav.devotions, icon: BookOpen },
    { id: 'prayer', label: t.nav.prayer, icon: HandHeart },
    { id: 'chat', label: t.nav.chat, icon: MessageCircleHeart },
    { id: 'community', label: t.nav.community, icon: Globe2 },
    { id: 'profile', label: t.nav.profile, icon: User },
  ];

  return (
    <div
      className="tbo-bottom-navigation pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pt-5"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
    >
      <nav
        aria-label={t.nav.primaryNavigation}
        className="tbo-glass-raised tbo-bottom-navigation__surface pointer-events-auto mx-auto max-w-lg rounded-[1.75rem] border px-2"
      >
        <div className="tbo-bottom-navigation__items flex min-h-16 items-stretch justify-between gap-0.5 py-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const unreadCount = tab.id === 'chat' ? chatUnreadCount : 0;
            const actionLabel = unreadCount > 0 ? tr(unreadCount === 1 ? '{label}, {count} unread message' : '{label}, {count} unread messages', { label: tab.label, count: unreadCount }) : tab.label;

            return (
              <motion.button
                type="button"
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-label={actionLabel}
                aria-current={isActive ? 'page' : undefined}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                transition={{ duration: 0.16 }}
                title={tab.label}
                className="tbo-bottom-navigation__tab group relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5"
              >
                <span className="tbo-bottom-navigation__icon relative flex h-8 w-9 shrink-0 items-center justify-center">
                  <Icon
                    aria-hidden="true"
                    className="h-6 w-6"
                    strokeWidth={isActive ? 2.4 : 1.9}
                  />
                  {unreadCount > 0 && (
                    <span className="tbo-bottom-navigation__badge tbo-caption absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-white shadow-sm" aria-hidden="true">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
                {isActive && (
                  <span className="tbo-bottom-navigation__label tbo-caption relative w-full text-center">
                    {tab.label}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
});
