import { useId } from 'react';
import type { HomeType } from '../data/legacyCharacterHouse';
import { safeHouseBlocks } from '../data/characterHouseJourney';

interface CharacterHouseIllustrationProps {
  homeType: HomeType;
  bedrooms: number;
  completedDays: number;
  className?: string;
}

/** Decorative elevation: the accessible progress and milestone live beside the artwork. */
export function CharacterHouseIllustration({ homeType, bedrooms, completedDays, className = '' }: CharacterHouseIllustrationProps) {
  const id = useId().replace(/:/g, '');
  const blocks = safeHouseBlocks(completedDays);
  const flat = homeType === 'apartment' || homeType === 'penthouse';
  const tall = homeType === 'townhouse' || homeType === 'apartment';
  const wide = homeType === 'villa' || homeType === 'duplex';
  const x = tall ? 120 : wide ? 66 : 91;
  const width = tall ? 120 : wide ? 228 : 178;
  const roofY = tall ? 73 : 105;
  const groundY = 237;
  const wallHeight = groundY - roofY;
  const wallReveal = Math.max(0, Math.min(1, (blocks - 60) / 90));
  const roofReveal = Math.max(0, Math.min(1, (blocks - 220) / 80));
  const windowCount = Math.min(7, Math.max(1, bedrooms));
  const windows = Array.from({ length: windowCount }, (_, index) => {
    const columns = tall ? (windowCount > 4 ? 3 : 2) : windowCount > 4 ? 4 : Math.max(2, windowCount);
    const rows = Math.ceil(windowCount / columns);
    const row = Math.floor(index / columns);
    const col = index % columns;
    const rowGap = rows > 1 ? (185 - roofY - 23 - 27) / (rows - 1) : 0;
    return { x: x + 16 + col * ((width - 52) / Math.max(1, columns - 1)), y: roofY + 23 + row * rowGap, built: blocks >= 150 + (index + 1) * (70 / windowCount) };
  });
  const roof = flat ? `M${x - 10} ${roofY} H${x + width + 10} V${roofY - 13} H${x - 10} Z` : `M${x - 17} ${roofY + 1} L180 ${roofY - 65} L${x + width + 17} ${roofY + 1} Z`;

  return <svg viewBox="0 0 360 280" className={`character-house-illustration ${className}`} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--house-wall-light, #fff5fb)" /><stop offset="1" stopColor="var(--house-wall, #d9c4f2)" /></linearGradient>
      <linearGradient id={`${id}-roof`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--glass-accent)" /><stop offset="1" stopColor="var(--glass-rose)" /></linearGradient>
      <linearGradient id={`${id}-window`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffefd0" /><stop offset="1" stopColor="#ffc4cd" /></linearGradient>
      <pattern id={`${id}-brick`} width="36" height="20" patternUnits="userSpaceOnUse"><path d="M0 0H36M0 20H36M18 0V10M0 10H36M0 10V20M36 10V20" fill="none" stroke="var(--glass-accent)" strokeOpacity=".17" /></pattern>
      <clipPath id={`${id}-walls`}><rect x={x} y={groundY - wallHeight * wallReveal} width={width} height={wallHeight * wallReveal} /></clipPath>
      <clipPath id={`${id}-roof-reveal`}><rect x="30" y={roofY - 80} width={300 * roofReveal} height="100" /></clipPath>
    </defs>
    <ellipse cx="180" cy="243" rx="145" ry="18" fill="var(--glass-accent)" opacity=".08" />
    <circle cx="282" cy="46" r="23" fill="var(--glass-rose)" opacity=".09" />
    <path d="M58 82h19m-9-9v18M297 132h13m-6-6v12" fill="none" stroke="var(--glass-accent)" opacity=".25" strokeWidth="2" strokeLinecap="round" />
    <g fill="none" stroke="var(--glass-muted)" strokeOpacity=".38" strokeWidth="1.7" strokeDasharray="5 6">
      <rect x={x} y={roofY} width={width} height={wallHeight} rx="3" />
      <path d={roof} />
      <path d={`M${x - 8} 237H${x + width + 8}V246H${x - 8}Z`} />
    </g>
    {blocks > 0 && <g>
      <rect x={x - 8} y="237" width={Math.max(12, (width + 16) * Math.min(1, blocks / 60))} height="9" rx="3" fill="var(--glass-accent)" />
      <path d={`M${x - 6} 238H${x - 6 + Math.max(8, (width + 12) * Math.min(1, blocks / 60))}`} stroke="var(--glass-border)" strokeWidth="2" />
    </g>}
    <g clipPath={`url(#${id}-walls)`}>
      <rect x={x} y={roofY} width={width} height={wallHeight} rx="3" fill={`url(#${id}-wall)`} stroke="var(--glass-accent)" strokeWidth="1.5" />
      <rect x={x} y={roofY} width={width} height={wallHeight} fill={`url(#${id}-brick)`} />
    </g>
    {windows.map((window, index) => <g key={index} opacity={window.built ? 1 : .32}>
      <rect x={window.x} y={window.y} width="22" height="27" rx="4" fill={window.built ? `url(#${id}-window)` : 'none'} stroke="var(--glass-accent)" strokeWidth={window.built ? 2 : 1} strokeDasharray={window.built ? undefined : '3 4'} />
      {window.built && <path d={`M${window.x + 11} ${window.y + 1}V${window.y + 26}M${window.x + 1} ${window.y + 13}H${window.x + 21}`} stroke="var(--glass-border)" strokeWidth="2" />}
    </g>)}
    <path d={`M167 237V201a13 13 0 0 1 26 0v36`} fill={blocks >= 220 ? 'var(--glass-accent)' : 'none'} stroke="var(--glass-accent)" strokeOpacity={blocks >= 220 ? 1 : .3} strokeWidth="1.5" strokeDasharray={blocks >= 220 ? undefined : '3 4'} />
    {blocks >= 220 && <circle cx="186" cy="217" r="2" fill="var(--glass-border)" />}
    <path d={roof} fill={`url(#${id}-roof)`} stroke="var(--glass-accent)" strokeWidth="2" clipPath={`url(#${id}-roof-reveal)`} />
    {blocks >= 300 && <g><path d="M173 248l-10 22h34l-10-22" fill="var(--glass-rose)" opacity=".17" /><path d="M47 238v-34m0 19c-15-1-19-10-17-17 13-2 18 5 17 17m0-11c13-1 18-9 16-15-12-1-16 5-16 15" fill="var(--glass-accent)" opacity=".55" /><path d="M312 239v-25m0 11c-12 0-15-7-13-13 10-1 13 4 13 13m0-9c10-1 13-7 11-12-9 0-12 4-11 12" fill="var(--glass-accent)" opacity=".55" /></g>}
    {blocks >= 365 && <path d="M180 49c-13-15-29 3-16 14l16 13 16-13c13-11-3-29-16-14" fill="var(--glass-rose)" />}
  </svg>;
}
