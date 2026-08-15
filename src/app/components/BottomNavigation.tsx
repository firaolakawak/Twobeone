import { memo } from 'react';
import { BookOpen, HandHeart, Home, User, Users } from 'lucide-react';
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
    { id: 'community', label: t.nav.community, icon: Users },
    { id: 'profile', label: t.nav.profile, icon: User },
  ];

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-white via-white/95 to-transparent px-3 pt-5"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
    >
      <nav
        aria-label="Primary navigation"
        className="pointer-events-auto mx-auto max-w-lg rounded-[1.75rem] border border-white/90 bg-white/88 px-1.5 shadow-[0_-2px_10px_rgba(83,45,67,0.03),0_16px_45px_rgba(83,45,67,0.18)] ring-1 ring-neutral-950/[0.04] backdrop-blur-2xl"
      >
        <div className="flex h-14 items-center justify-around px-1 py-1">
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
                className={`group relative flex h-12 min-w-0 flex-1 items-center justify-center rounded-2xl px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${isActive ? 'text-primary-700' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                <span className="relative flex h-10 w-14 items-center justify-center">
                  {isActive && (
                    <motion.span
                      layoutId="bottom-navigation-active"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/80 shadow-[inset_0_0_0_1px_rgba(190,68,112,0.10)]"
                      transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 430, damping: 34 }}
                    />
                  )}
                  <Icon
                    aria-hidden="true"
                    className={`relative h-6 w-6 transition-transform duration-200 ${isActive ? 'scale-105 fill-primary-100' : 'group-hover:-translate-y-0.5'}`}
                    strokeWidth={isActive ? 2.4 : 1.9}
                  />
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
});
