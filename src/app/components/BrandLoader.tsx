import type { CSSProperties } from 'react';
import logo from '../../assets/twobeone-header-logo.png';
import { useUiCopy } from '../utils/uiTranslation';

interface LoadingMarkProps {
  className?: string;
  size?: number;
}

/** Decorative mark for controls that already provide their own waiting label. */
export function LoadingMark({ className = '', size }: LoadingMarkProps) {
  return <span
    className={`tbo-loading-mark ${className}`}
    style={size ? { '--loading-mark-size': `${size}px` } as CSSProperties : undefined}
    aria-hidden="true"
  ><img src={logo} alt="" draggable={false} /></span>;
}

interface BrandLoaderProps {
  label?: string;
  className?: string;
  size?: number;
}

/** Shared waiting state. The label announces once and updates with language. */
export function BrandLoader({ label, className = '', size = 64 }: BrandLoaderProps) {
  const tr = useUiCopy();
  return <div className={`tbo-brand-loader ${className}`} role="status" aria-live="polite" aria-atomic="true">
    <LoadingMark size={size} />
    <span className="tbo-supporting">{label ?? tr('Loading...')}</span>
  </div>;
}
