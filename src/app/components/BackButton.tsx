import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from './ui/utils';

export interface BackButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'aria-label' | 'type'> {
  /** Localized action or destination, also used when the visible label is hidden. */
  label: string;
  /** Use for footer and contextual return actions; page headers use the icon alone. */
  showLabel?: boolean;
}

export const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ label, showLabel = false, className, title, ...props }, ref) => (
    <button
      {...props}
      ref={ref}
      type="button"
      data-slot="back-button"
      data-labelled={showLabel ? 'true' : undefined}
      className={cn('tbo-back-button tbo-action', className)}
      aria-label={label}
      title={title ?? label}
    >
      <ArrowLeft aria-hidden="true" focusable="false" />
      {showLabel && <span>{label}</span>}
    </button>
  ),
);

BackButton.displayName = 'BackButton';
