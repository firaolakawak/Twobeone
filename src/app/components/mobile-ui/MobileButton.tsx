import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface MobileButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'text' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * MobileButton Component
 * 
 * Mobile-optimized button following platform guidelines:
 * - Height: 48-56dp (min touch target)
 * - Radius: 12-16dp
 * - Active states for touch feedback
 * - Icon + text variations
 * - AA+ contrast compliance
 */
export function MobileButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  type = 'button'
}: MobileButtonProps) {
  // Size classes (touch target compliant)
  const sizeClasses = {
    sm: 'h-10 px-4 text-sm',           // 40px height
    md: 'h-12 px-6 text-base',         // 48px height (min touch)
    lg: 'h-14 px-8 text-lg'            // 56px height (comfortable)
  };
  
  // Variant classes with AA+ contrast
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-md disabled:bg-neutral-300 disabled:text-neutral-500',
    secondary: 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white disabled:opacity-50',
    ghost: 'bg-transparent hover:bg-neutral-100 active:bg-neutral-200 text-neutral-900 dark:hover:bg-neutral-800 dark:text-white disabled:opacity-50',
    text: 'bg-transparent hover:underline text-primary-600 dark:text-primary-400 disabled:opacity-50',
    destructive: 'bg-error-500 hover:bg-error-600 active:bg-error-700 text-white shadow-md disabled:bg-neutral-300 disabled:text-neutral-500'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : 'w-auto'}
        inline-flex items-center justify-center gap-2
        rounded-xl
        font-medium
        transition-all duration-150
        active:scale-[0.98]
        disabled:cursor-not-allowed
        disabled:active:scale-100
        ${className}
      `}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
}
