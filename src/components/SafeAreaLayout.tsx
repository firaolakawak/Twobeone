import { ReactNode } from 'react';

interface SafeAreaLayoutProps {
  children: ReactNode;
  className?: string;
  hasBottomNav?: boolean;
  hasTopBar?: boolean;
}

/**
 * SafeAreaLayout Component
 * 
 * Implements mobile-first safe area guidelines:
 * - iOS: Top 44pt, Bottom 34pt
 * - Android: Top 24-32dp, Bottom 16-24dp
 * - 16dp horizontal padding
 * - Handles notches, rounded corners, gesture bars
 */
export function SafeAreaLayout({ 
  children, 
  className = '',
  hasBottomNav = false,
  hasTopBar = true
}: SafeAreaLayoutProps) {
  return (
    <div className={`
      min-h-screen flex flex-col
      ${hasTopBar ? 'pt-11' : 'pt-8'} 
      ${hasBottomNav ? 'pb-20' : 'pb-9'}
      ${className}
    `}>
      {/* Safe area container */}
      <div className="flex-1 flex flex-col w-full max-w-[90%] mx-auto">
        {children}
      </div>
    </div>
  );
}

/**
 * ContentContainer Component
 * 
 * Main content area with proper spacing:
 * - 16dp horizontal padding
 * - 8dp vertical rhythm
 * - Max 90% screen width
 * - Grid alignment ready
 */
export function ContentContainer({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={`
      px-4 
      w-full 
      ${className}
    `}>
      {children}
    </div>
  );
}

/**
 * BottomCTA Component
 * 
 * Bottom call-to-action with safe area:
 * - 16-24dp above gesture area
 * - 80-90% width
 * - 48-56dp height
 * - Elevated positioning
 */
export function BottomCTA({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={`
      fixed bottom-0 left-0 right-0
      pb-9
      px-4
      bg-gradient-to-t from-white via-white to-transparent
      dark:from-gray-950 dark:via-gray-950
      pt-6
      ${className}
    `}>
      <div className="w-full max-w-md mx-auto">
        {children}
      </div>
    </div>
  );
}

/**
 * AppBar Component
 * 
 * Navigation/App bar with platform standards:
 * - Height: 44-56dp
 * - Centered titles (iOS style for now)
 * - Safe area aware
 * - Min 48dp touch targets
 */
export function AppBar({ 
  title,
  leftAction,
  rightAction,
  className = ''
}: { 
  title: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`
      h-14
      flex items-center justify-between
      px-4
      border-b border-gray-200 dark:border-gray-800
      bg-white dark:bg-gray-950
      ${className}
    `}>
      {/* Left action - min 48dp touch target */}
      <div className="min-w-[48px] min-h-[48px] flex items-center justify-start">
        {leftAction}
      </div>
      
      {/* Title - centered */}
      <h1 className="flex-1 text-center font-semibold text-lg dark:text-white">
        {title}
      </h1>
      
      {/* Right action - min 48dp touch target */}
      <div className="min-w-[48px] min-h-[48px] flex items-center justify-end">
        {rightAction}
      </div>
    </header>
  );
}

/**
 * Card Component
 * 
 * Content cards with standards:
 * - 16dp internal padding
 * - 12dp border radius
 * - Proper touch targets
 * - 12-16dp margins from edges
 */
export function Card({ 
  children, 
  className = '',
  onClick
}: { 
  children: ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={`
        p-4
        rounded-xl
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-800
        shadow-sm
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * TouchableButton Component
 * 
 * Standard button with proper touch targets:
 * - Min 48dp height
 * - 80-90% max width
 * - 8-12dp spacing between elements
 * - Active states
 */
export function TouchableButton({ 
  children, 
  onClick,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  className = ''
}: { 
  children: ReactNode; 
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const baseStyles = 'min-h-[48px] px-6 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white',
    outline: 'border-2 border-rose-600 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : 'w-auto'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/**
 * FormField Component
 * 
 * Form inputs with standards:
 * - Labels above fields
 * - 16dp spacing between inputs
 * - Min 48dp touch targets
 * - Proper focus states
 */
export function FormField({ 
  label,
  children,
  error,
  helperText,
  required = false
}: { 
  label: string;
  children: ReactNode;
  error?: string;
  helperText?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-rose-600 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

/**
 * Spacing utilities following 4/8/16/24 scale
 */
export const spacing = {
  xs: 'space-y-1',      // 4dp
  sm: 'space-y-2',      // 8dp
  md: 'space-y-4',      // 16dp
  lg: 'space-y-6',      // 24dp
  xl: 'space-y-8',      // 32dp
} as const;
