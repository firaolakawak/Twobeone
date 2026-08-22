/**
 * OGImageSVG — exports the branded 1200×630 social sharing image as an SVG.
 * Used to generate og-image.png at /public/og-image.svg which can be
 * referenced in social sharing meta tags.
 *
 * All colors use the design system tokens from globals.css:
 * - Background: var(--primary-700) → #be123c  (deep rose)
 * - Accent:     var(--primary-500) → #f43f5e
 * - Text:       white
 */
export function OGImageSVG() {
  return (
    <svg
      width="1200"
      height="630"
      viewBox="0 0 1200 630"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="TwoBeOne — Grow Together in Faith"
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9f1239" />
          <stop offset="50%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="1200" height="630" fill="url(#bg)" />

      {/* Decorative circles */}
      <circle cx="1100" cy="80" r="180" fill="rgba(255,255,255,0.05)" />
      <circle cx="80"   cy="550" r="220" fill="rgba(255,255,255,0.04)" />
      <circle cx="600"  cy="-60"  r="200" fill="rgba(255,255,255,0.03)" />

      {/* Center card */}
      <rect x="80" y="80" width="1040" height="470" rx="32" fill="url(#cardBg)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

      {/* Two hearts — couple icon */}
      <g transform="translate(440, 140)">
        {/* Left heart */}
        <path
          d="M 60 90 C 60 90 10 60 10 25 C 10 5 25 -5 40 0 C 50 3 58 12 60 20 C 62 12 70 3 80 0 C 95 -5 110 5 110 25 C 110 60 60 90 60 90 Z"
          fill="rgba(255,255,255,0.9)"
        />
        {/* Right heart (slightly offset) */}
        <path
          d="M 220 90 C 220 90 170 60 170 25 C 170 5 185 -5 200 0 C 210 3 218 12 220 20 C 222 12 230 3 240 0 C 255 -5 270 5 270 25 C 270 60 220 90 220 90 Z"
          fill="rgba(255,255,255,0.9)"
        />
        {/* Small connecting heart */}
        <path
          d="M 140 75 C 140 75 115 58 115 42 C 115 30 123 24 132 27 C 136 28 139 33 140 37 C 141 33 144 28 148 27 C 157 24 165 30 165 42 C 165 58 140 75 140 75 Z"
          fill="rgba(255,255,255,0.7)"
        />
      </g>

      {/* App name */}
      <text
        x="600"
        y="320"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="96"
        fontWeight="800"
        fill="white"
        letterSpacing="-2"
      >
        TwoBeOne
      </text>

      {/* Tagline */}
      <text
        x="600"
        y="390"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="36"
        fontWeight="400"
        fill="rgba(255,255,255,0.85)"
        letterSpacing="1"
      >
        Grow Together in Faith
      </text>

      {/* Feature pills */}
      <g transform="translate(600, 460)" textAnchor="middle">
        {/* Pill 1 */}
        <rect x="-340" y="-20" width="180" height="40" rx="20" fill="rgba(255,255,255,0.15)" />
        <text x="-250" y="5" fontFamily="sans-serif" fontSize="22" fill="white" textAnchor="middle">📖 Devotionals</text>
        {/* Pill 2 */}
        <rect x="-140" y="-20" width="160" height="40" rx="20" fill="rgba(255,255,255,0.15)" />
        <text x="-60" y="5" fontFamily="sans-serif" fontSize="22" fill="white" textAnchor="middle">🙏 Prayer</text>
        {/* Pill 3 */}
        <rect x="40" y="-20" width="155" height="40" rx="20" fill="rgba(255,255,255,0.15)" />
        <text x="118" y="5" fontFamily="sans-serif" fontSize="22" fill="white" textAnchor="middle">📝 Journal</text>
        {/* Pill 4 */}
        <rect x="215" y="-20" width="135" height="40" rx="20" fill="rgba(255,255,255,0.15)" />
        <text x="283" y="5" fontFamily="sans-serif" fontSize="22" fill="white" textAnchor="middle">💬 Q&amp;A</text>
      </g>

      {/* URL watermark */}
      <text
        x="600"
        y="590"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="22"
        fill="rgba(255,255,255,0.5)"
        letterSpacing="1"
      >
        twobeone.app · Free · English · አማርኛ · Oromiffa
      </text>
    </svg>
  );
}
