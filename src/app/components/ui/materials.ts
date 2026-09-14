import type { CSSProperties } from 'react';

const fallbackClasses = {
  card: 'bg-card text-card-foreground',
  raised: 'bg-popover text-popover-foreground',
  inset: 'bg-card text-card-foreground',
  field: 'bg-input-background border-input',
  tabs: 'bg-muted text-muted-foreground',
  overlay: 'bg-black/50',
  primary: '',
  secondary: '',
} as const;

/** Explicit page artwork, semantic fills, and existing glass compositions retain their paint. */
export function glassMaterial(kind: keyof typeof fallbackClasses, className?: string, style?: CSSProperties) {
  const customPaint = className?.split(/\s+/).some(token => {
    if (token === 'tbo-surface-plain' || /^tbo-glass(?:$|-)/.test(token)) return true;
    if (['card', 'raised', 'inset'].includes(kind) && /^(?:dark:)?bg-(?:card|popover|background)$/.test(token)) return false;
    // Hover/focus and descendant styling do not replace the control's resting material.
    const stateOnly = /(?:^|:)(?:hover|focus(?:-visible|-within)?|active|disabled|enabled|visited|checked|indeterminate|aria-[^:]+|data-[^:]+|group-[^:]+|peer-[^:]+):/.test(token) || token.startsWith('[&');
    return !stateOnly && /(?:^|:)(?:!?bg-|!?from-|!?via-|!?to-)/.test(token);
  });
  if (customPaint || style?.background !== undefined || style?.backgroundColor !== undefined || style?.backgroundImage !== undefined) {
    return fallbackClasses[kind];
  }
  return `tbo-ui-${kind}`;
}
