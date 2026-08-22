import { ReactNode, InputHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';

interface MobileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * MobileInput Component
 * 
 * Form input with mobile-first design:
 * - Label above field (iOS/Android standard)
 * - 16dp spacing between inputs
 * - Min 48dp touch target
 * - Clear validation states
 * - AA+ contrast
 */
export function MobileInput({
  label,
  error,
  helperText,
  required = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}: MobileInputProps) {
  return (
    <div className="space-y-2 w-full">
      {/* Label above field */}
      {label && (
        <label 
          htmlFor={props.id}
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input wrapper */}
      <div className="relative">
        {/* Left icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        
        {/* Input field */}
        <input
          {...props}
          className={`
            w-full h-12
            px-4 ${icon && iconPosition === 'left' ? 'pl-10' : ''} ${icon && iconPosition === 'right' ? 'pr-10' : ''}
            bg-neutral-50 dark:bg-neutral-900
            border-2 ${error ? 'border-error-500' : 'border-neutral-200 dark:border-neutral-700'}
            rounded-xl
            text-base text-neutral-900 dark:text-white
            placeholder:text-neutral-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all
            ${className}
          `}
        />
        
        {/* Right icon */}
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        
        {/* Error icon */}
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
      </div>
      
      {/* Helper text or error */}
      {error && (
        <p className="text-sm text-error-500 dark:text-error-400 flex items-center gap-1">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

/**
 * MobileTextarea Component
 * 
 * Multiline text area for mobile
 */
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export function MobileTextarea({
  label,
  error,
  helperText,
  required = false,
  className = '',
  ...props
}: MobileTextareaProps) {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label 
          htmlFor={props.id}
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        {...props}
        className={`
          w-full min-h-[120px]
          px-4 py-3
          bg-neutral-50 dark:bg-neutral-900
          border-2 ${error ? 'border-error-500' : 'border-neutral-200 dark:border-neutral-700'}
          rounded-xl
          text-base text-neutral-900 dark:text-white
          placeholder:text-neutral-400
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-y
          transition-all
          ${className}
        `}
      />
      
      {error && (
        <p className="text-sm text-error-500 dark:text-error-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
