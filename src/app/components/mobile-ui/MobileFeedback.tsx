import { ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * MobileAlert Component
 * 
 * Alert/notification banner
 */
interface MobileAlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function MobileAlert({
  type = 'info',
  title,
  message,
  onClose,
  className = ''
}: MobileAlertProps) {
  const typeConfig = {
    success: {
      bg: 'bg-success-50 dark:bg-success-900/20',
      border: 'border-success-500',
      text: 'text-success-700-700 dark:text-success-700-400',
      icon: <CheckCircle className="w-5 h-5" />
    },
    error: {
      bg: 'bg-error-50 dark:bg-error-900/20',
      border: 'border-error-500',
      text: 'text-error-700 dark:text-error-400',
      icon: <AlertCircle className="w-5 h-5" />
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-900/20',
      border: 'border-warning-500',
      text: 'text-warning-700-700 dark:text-warning-700-400',
      icon: <AlertTriangle className="w-5 h-5" />
    },
    info: {
      bg: 'bg-secondary-50 dark:bg-secondary-900/20',
      border: 'border-secondary-500',
      text: 'text-sky-600-700 dark:text-sky-600-400',
      icon: <Info className="w-5 h-5" />
    }
  };
  
  const config = typeConfig[type];
  
  return (
    <div className={`
      ${config.bg}
      ${config.text}
      border-l-4 ${config.border}
      p-4 rounded-lg
      ${className}
    `}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold mb-1">{title}</h4>
          )}
          <p className="text-sm">{message}</p>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * MobileBadge Component
 * 
 * Status badge/tag
 */
interface MobileBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export function MobileBadge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = ''
}: MobileBadgeProps) {
  const variantClasses = {
    default: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    success: 'bg-success-50 text-success-700-700 dark:bg-success-900/20 dark:text-success-700-400',
    error: 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-400',
    warning: 'bg-warning-50 text-warning-700-700 dark:bg-warning-900/20 dark:text-warning-700-400',
    info: 'bg-secondary-50 text-sky-600-700 dark:bg-secondary-900/20 dark:text-sky-600-400'
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1.5
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      rounded-full
      font-medium
      ${className}
    `}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}

/**
 * MobileLoader Component
 * 
 * Loading spinner
 */
interface MobileLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'current';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function MobileLoader({
  size = 'md',
  color = 'primary',
  text,
  fullScreen = false,
  className = ''
}: MobileLoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };
  
  const colorClasses = {
    primary: 'border-primary-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    current: 'border-current border-t-transparent'
  };
  
  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`
        ${sizeClasses[size]}
        ${colorClasses[color]}
        rounded-full
        animate-spin
      `} />
      {text && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{text}</p>
      )}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-card/80 dark:bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }
  
  return spinner;
}

/**
 * MobileSkeleton Component
 * 
 * Loading skeleton placeholder
 */
interface MobileSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  className?: string;
}

export function MobileSkeleton({
  variant = 'text',
  width,
  height,
  className = ''
}: MobileSkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };
  
  return (
    <div
      className={`
        ${variantClasses[variant]}
        bg-neutral-200 dark:bg-neutral-800
        animate-pulse
        ${className}
      `}
      style={{
        width: width,
        height: height || (variant === 'text' ? '1rem' : undefined)
      }}
    />
  );
}

/**
 * MobileEmptyState Component
 * 
 * Empty state placeholder
 */
interface MobileEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function MobileEmptyState({
  icon,
  title,
  description,
  action,
  className = ''
}: MobileEmptyStateProps) {
  return (
    <div className={`
      flex flex-col items-center justify-center
      text-center
      py-12 px-6
      ${className}
    `}>
      {icon && (
        <div className="w-16 h-16 mb-4 text-neutral-400 dark:text-neutral-600">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action && action}
    </div>
  );
}
