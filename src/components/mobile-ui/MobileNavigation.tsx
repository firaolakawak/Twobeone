import { ReactNode } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';

interface MobileAppBarProps {
  title: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  onBack?: () => void;
  className?: string;
  variant?: 'default' | 'transparent';
}

/**
 * MobileAppBar Component
 * 
 * Top navigation bar following platform standards:
 * - Height: 44-56dp
 * - iOS: Centered title
 * - Android: Left-aligned title
 * - Min 48dp touch targets
 * - Safe area aware
 */
export function MobileAppBar({
  title,
  leftAction,
  rightAction,
  onBack,
  className = '',
  variant = 'default'
}: MobileAppBarProps) {
  const variantClasses = {
    default: 'bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800',
    transparent: 'bg-transparent'
  };
  
  return (
    <header className={`
      h-14
      flex items-center justify-between
      px-4
      ${variantClasses[variant]}
      ${className}
    `}>
      {/* Left action - min 48dp touch target */}
      <div className="min-w-[48px] min-h-[48px] flex items-center justify-start -ml-2">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-neutral-900 dark:text-white" />
          </button>
        ) : leftAction}
      </div>
      
      {/* Title - centered iOS style */}
      <h1 className="flex-1 text-center font-semibold text-lg text-neutral-900 dark:text-white px-2 truncate">
        {title}
      </h1>
      
      {/* Right action - min 48dp touch target */}
      <div className="min-w-[48px] min-h-[48px] flex items-center justify-end -mr-2">
        {rightAction}
      </div>
    </header>
  );
}

interface MobileBottomNavProps {
  items: Array<{
    id: string;
    label: string;
    icon: ReactNode;
    badge?: number;
  }>;
  activeId: string;
  onItemClick: (id: string) => void;
  className?: string;
}

/**
 * MobileBottomNav Component
 * 
 * Bottom navigation bar:
 * - 64dp content height
 * - Safe area padding (34dp iOS)
 * - Min 48dp touch targets
 * - Active state indicators
 * - Badge support
 */
export function MobileBottomNav({
  items,
  activeId,
  onItemClick,
  className = ''
}: MobileBottomNavProps) {
  return (
    <nav className={`
      fixed bottom-0 left-0 right-0
      bg-white dark:bg-neutral-950
      border-t border-neutral-200 dark:border-neutral-800
      z-50
      ${className}
    `}>
      {/* Safe area padding: 34dp iOS bottom */}
      <div className="pb-9">
        {/* 64dp content height with 48dp touch targets */}
        <div className="flex justify-around items-center h-16 max-w-6xl mx-auto px-4">
          {items.map((item) => {
            const isActive = activeId === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  relative
                  flex flex-col items-center justify-center
                  flex-1 min-h-[48px] min-w-[48px]
                  gap-1
                  transition-colors
                  ${isActive
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }
                `}
              >
                {/* Icon - 24dp standard */}
                <div className="relative">
                  <div className="w-6 h-6 flex items-center justify-center">
                    {item.icon}
                  </div>
                  
                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <div className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-error-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                
                {/* Label */}
                <span className="text-xs truncate max-w-full">{item.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-rose-600 dark:bg-rose-400 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/**
 * MobileTabBar Component
 * 
 * Horizontal tab navigation
 */
interface MobileTabBarProps {
  tabs: Array<{
    id: string;
    label: string;
  }>;
  activeId: string;
  onTabClick: (id: string) => void;
  className?: string;
}

export function MobileTabBar({
  tabs,
  activeId,
  onTabClick,
  className = ''
}: MobileTabBarProps) {
  return (
    <div className={`
      flex items-center gap-2
      overflow-x-auto
      border-b border-neutral-200 dark:border-neutral-800
      ${className}
    `}>
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={`
              relative
              px-4 h-12
              font-medium text-sm
              whitespace-nowrap
              transition-colors
              ${isActive
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }
            `}
          >
            {tab.label}
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 dark:bg-rose-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * MobileFloatingActionButton (FAB) Component
 */
interface MobileFABProps {
  icon: ReactNode;
  onClick: () => void;
  label?: string;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  className?: string;
}

export function MobileFAB({
  icon,
  onClick,
  label,
  position = 'bottom-right',
  className = ''
}: MobileFABProps) {
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-20 left-4'
  };
  
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`
        fixed ${positionClasses[position]}
        w-14 h-14
        bg-rose-600 hover:bg-rose-700 active:bg-rose-800
        text-white
        rounded-full
        shadow-lg
        flex items-center justify-center
        transition-all
        active:scale-95
        z-40
        ${className}
      `}
    >
      <div className="w-6 h-6">
        {icon}
      </div>
    </button>
  );
}
