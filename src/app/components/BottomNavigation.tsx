import { memo } from 'react';
import { BookOpen, HandHeart, Home, MessageCircleHeart, User, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNavigation = memo(function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();

  const tabs = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'devotions', label: t.nav.devotions, icon: BookOpen },
    { id: 'prayer', label: t.nav.prayer, icon: HandHeart },
    { id: 'chat', label: t.nav.chat, icon: MessageCircleHeart },
    { id: 'community', label: t.nav.community, icon: Users },
    { id: 'profile', label: t.nav.profile, icon: User },
  ];

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-white via-white/95 to-transparent px-3 pt-5"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
    >
      <nav
        aria-label={t.nav.primaryNavigation}
        className="pointer-events-auto mx-auto max-w-lg rounded-[1.75rem] border border-white/90 bg-white/88 px-1.5 shadow-[0_-2px_10px_rgba(83,45,67,0.03),0_16px_45px_rgba(83,45,67,0.18)] ring-1 ring-neutral-950/[0.04] backdrop-blur-2xl"
      >
        <div className="flex h-[4.5rem] items-center justify-around px-0.5 py-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                type="button"
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                transition={{ duration: 0.16 }}
                className={`group relative flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${isActive ? 'text-primary-700' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                <span className="relative flex h-9 w-12 items-center justify-center sm:w-14">
                  {isActive && (
                    <motion.span
                      layoutId="bottom-navigation-active"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/80 shadow-[inset_0_0_0_1px_rgba(190,68,112,0.10)]"
                      transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 430, damping: 34 }}
                    />
                  )}
                  <Icon
                    aria-hidden="true"
                    className={`relative h-[1.625rem] w-[1.625rem] transition-transform duration-200 ${isActive ? 'scale-105 fill-primary-100' : 'group-hover:-translate-y-0.5'}`}
                    strokeWidth={isActive ? 2.4 : 1.9}
                  />
                </span>
                <span className={`relative max-w-full truncate text-[11px] font-bold leading-none ${isActive ? 'text-primary-700' : 'text-neutral-600'}`}>
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
});
