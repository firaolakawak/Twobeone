import { Home, BookOpen, HandHeart, Users, User } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'devotions', label: 'Devotions', icon: BookOpen },
    { id: 'prayer', label: 'Prayer', icon: HandHeart },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
      {/* Safe area compliance: 34dp iOS bottom + 16dp content padding */}
      {/* Total height: 64dp content + 34dp safe area = 98dp (~25rem) */}
      <div className="pb-9">
        {/* 16dp horizontal padding, 64dp height (48dp min touch target + spacing) */}
        <div className="flex justify-around items-center h-16 max-w-6xl mx-auto px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex flex-col items-center justify-center flex-1 
                  min-h-[48px] min-w-[48px]
                  gap-1 transition-colors
                  ${isActive
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
              >
                {/* 24dp icon size (standard mobile) */}
                <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs truncate max-w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}