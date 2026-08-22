import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * MobileList Component
 * 
 * Container for list items
 */
interface MobileListProps {
  children: ReactNode;
  dividers?: boolean;
  className?: string;
}

export function MobileList({
  children,
  dividers = true,
  className = ''
}: MobileListProps) {
  return (
    <div className={`
      ${dividers ? 'divide-y divide-neutral-200 dark:divide-neutral-800' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

/**
 * MobileListItem Component
 * 
 * List item with one, two, or three lines
 * - Min 48dp touch target
 * - Avatar + icon support
 * - Action support
 */
interface MobileListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: ReactNode;
  icon?: ReactNode;
  iconColor?: string;
  trailing?: ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MobileListItem({
  title,
  subtitle,
  description,
  avatar,
  icon,
  iconColor = 'text-neutral-600 dark:text-neutral-400',
  trailing,
  showChevron = false,
  onClick,
  className = ''
}: MobileListItemProps) {
  const isClickable = !!onClick;
  const hasMultipleLines = !!(subtitle || description);
  
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3
        ${hasMultipleLines ? 'py-3' : 'py-2'}
        px-4
        min-h-[48px]
        ${isClickable ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/50 active:bg-neutral-100 dark:active:bg-neutral-900' : ''}
        transition-colors
        ${className}
      `}
    >
      {/* Leading avatar or icon */}
      {avatar && (
        <div className="flex-shrink-0">
          {avatar}
        </div>
      )}
      
      {icon && !avatar && (
        <div className={`flex-shrink-0 ${iconColor}`}>
          {icon}
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-neutral-900 dark:text-white truncate">
          {title}
        </p>
        
        {subtitle && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
            {subtitle}
          </p>
        )}
        
        {description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-500 line-clamp-2 mt-0.5">
            {description}
          </p>
        )}
      </div>
      
      {/* Trailing action or chevron */}
      {trailing && (
        <div className="flex-shrink-0">
          {trailing}
        </div>
      )}
      
      {showChevron && !trailing && (
        <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
      )}
    </div>
  );
}

/**
 * MobileAvatar Component
 * 
 * User avatar with fallback
 */
interface MobileAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away';
  className?: string;
}

export function MobileAvatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  status,
  className = ''
}: MobileAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };
  
  const statusColors = {
    online: 'bg-success-500',
    offline: 'bg-neutral-400',
    away: 'bg-warning-500'
  };
  
  const statusSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };
  
  return (
    <div className={`relative ${className}`}>
      <div className={`
        ${sizeClasses[size]}
        rounded-full
        overflow-hidden
        bg-neutral-200 dark:bg-neutral-700
        flex items-center justify-center
        font-medium
        text-neutral-600 dark:text-neutral-300
      `}>
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span>{fallback || alt.charAt(0).toUpperCase()}</span>
        )}
      </div>
      
      {/* Status indicator */}
      {status && (
        <div className={`
          absolute bottom-0 right-0
          ${statusSizes[size]}
          ${statusColors[status]}
          border-2 border-white dark:border-neutral-900
          rounded-full
        `} />
      )}
    </div>
  );
}

/**
 * MobileDivider Component
 * 
 * Visual separator with optional label
 */
interface MobileDividerProps {
  label?: string;
  className?: string;
}

export function MobileDivider({
  label,
  className = ''
}: MobileDividerProps) {
  if (label) {
    return (
      <div className={`flex items-center gap-3 my-4 ${className}`}>
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
          {label}
        </span>
        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
      </div>
    );
  }
  
  return (
    <div className={`h-px bg-neutral-200 dark:bg-neutral-800 my-4 ${className}`} />
  );
}
