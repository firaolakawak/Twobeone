import { memo } from 'react';
import { BookOpen, Globe2, HandHeart, Home, MessageCircleHeart, User } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  chatUnreadCount?: number;
}

export const BottomNavigation = memo(function BottomNavigation({ activeTab, onTabChange, chatUnreadCount = 0 }: BottomNavigationProps) {
  const { t } = useLanguage();
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-white via-white/95 to-transparent px-3 pt-5"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
    >
      <nav
        aria-label={t.nav.primaryNavigation}
        className="pointer-events-auto mx-auto max-w-lg rounded-[1.75rem] border border-white/90 bg-white/90 px-2 shadow-[0_-2px_10px_rgba(83,45,67,0.03),0_16px_45px_rgba(83,45,67,0.18)] ring-1 ring-neutral-950/[0.04] backdrop-blur-2xl"
      >
        <div className="flex h-16 items-center justify-between gap-0.5 py-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const unreadCount = tab.id === 'chat' ? chatUnreadCount : 0;
            const actionLabel = unreadCount > 0 ? `${tab.label}, ${unreadCount} unread ${unreadCount === 1 ? 'message' : 'messages'}` : tab.label;

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
                className={`group relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${isActive ? 'text-primary-600' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                <span className="relative flex h-7 w-9 shrink-0 items-center justify-center">
                  <Icon
                    aria-hidden="true"
                    className={`h-6 w-6 transition-transform duration-200 ${isActive ? 'scale-105 text-primary-600' : 'group-hover:scale-105'}`}
                    strokeWidth={isActive ? 2.4 : 1.9}
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-black leading-none text-white shadow-sm ring-2 ring-white" aria-hidden="true">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
                {isActive && (
                  <span className="relative w-full break-words text-center text-[9px] font-extrabold leading-[1.05] text-primary-600">
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
