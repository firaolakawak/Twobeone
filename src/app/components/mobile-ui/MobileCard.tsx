import { ReactNode } from 'react';

interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled';
}

/**
 * MobileCard Component
 * 
 * Card component following mobile guidelines:
 * - 12dp border radius
 * - 16dp internal padding
 * - Never touches edges (12-16dp margins)
 * - Elevation/shadow support
 * - Touch feedback
 */
export function MobileCard({
  children,
  onClick,
  className = '',
  padding = 'md',
  shadow = 'sm',
  variant = 'default'
}: MobileCardProps) {
  // Padding classes (16dp internal standard)
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',   // 12dp
    md: 'p-4',   // 16dp (standard)
    lg: 'p-6'    // 24dp
  };
  
  // Shadow classes
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };
  
  // Variant classes
  const variantClasses = {
    default: 'bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800',
    outlined: 'bg-transparent border-2 border-neutral-300 dark:border-neutral-700',
    filled: 'bg-neutral-50 dark:bg-neutral-800 border-0'
  };
  
  return (
    <div
      onClick={onClick}
      className={`
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${variantClasses[variant]}
        rounded-xl
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * MobileCardHeader Component
 */
interface MobileCardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function MobileCardHeader({
  title,
  subtitle,
  action,
  icon
}: MobileCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 text-neutral-600 dark:text-neutral-400">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * MobileCardContent Component
 */
interface MobileCardContentProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardContent({
  children,
  className = ''
}: MobileCardContentProps) {
  return (
    <div className={`text-neutral-700 dark:text-neutral-300 ${className}`}>
      {children}
    </div>
  );
}

/**
 * MobileCardFooter Component
 */
interface MobileCardFooterProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardFooter({
  children,
  className = ''
}: MobileCardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 ${className}`}>
      {children}
    </div>
  );
}
