# Plan: TwoBeOne — Clean Tailwind v4 Landing Page

## Context

The build is broken by two issues: a `figma:asset/` import in `LandingPage.tsx` that only resolves inside Figma Make, and a Tailwind v4 plugin crash caused by duplicate `@theme inline` blocks, a duplicate `@custom-variant dark` declaration, and a direct `globals.css` import outside the Tailwind entry point.

Rather than patch the existing fragile CSS chain, the user wants a clean rebuild: a single `@theme` block in Tailwind v4 syntax, hex/HSL color tokens for the six semantic variables, and a fresh responsive mobile landing page written with clean React + Tailwind classes — no `figma:asset`, no `@custom-variant`, no duplicated theme blocks.

All generated UI must consume CSS variables from the theme file so the user can restyle the entire page by editing one CSS file.

---

## Changes

### 1. `src/styles/theme.css` — replace with a single clean `@theme` block

Wipe the existing content and write one `@theme` block. All semantic tokens use hex/HSL. The design-system palette variables from `globals.css` are preserved as plain `:root` custom properties (no Tailwind at-rules) so components can still reference `var(--primary-500)`, `var(--spacing-4)`, etc.

```css
/* ── Tailwind v4 theme ───────────────────────────── */
@theme {
  /* Semantic color tokens */
  --color-background:        #ffffff;
  --color-foreground:        #111827;
  --color-card:              #ffffff;
  --color-card-foreground:   #111827;
  --color-border:            #e5e7eb;
  --color-primary:           #e11d48;
  --color-primary-foreground:#ffffff;
  --color-muted:             #f3f4f6;
  --color-muted-foreground:  #6b7280;

  /* Radius */
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-xl:  20px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* Font */
  --font-sans: ui-sans-serif, system-ui, sans-serif;
}

/* ── Design-system palette (referenced via var(), not Tailwind utilities) ── */
:root {
  --primary-50:  #fef1f4;
  --primary-100: #ffe0e8;
  --primary-200: #ffc7d7;
  --primary-300: #ff9db7;
  --primary-400: #ff6391;
  --primary-500: #f43f5e;
  --primary-600: #e11d48;
  --primary-700: #be123c;

  --secondary-100: #e0f2fe;
  --secondary-200: #bae6fd;
  --secondary-400: #38bdf8;
  --secondary-500: #0ea5e9;
  --secondary-600: #0284c7;
  --secondary-700: #0369a1;

  --neutral-50:  #f9fafb;
  --neutral-100: #f3f4f6;
  --neutral-200: #e5e7eb;
  --neutral-400: #9ca3af;
  --neutral-500: #6b7280;
  --neutral-600: #4b5563;
  --neutral-700: #374151;
  --neutral-800: #1f2937;
  --neutral-900: #111827;
  --neutral-950: #030712;

  --success-500: #22c55e;
  --warning-500: #f59e0b;

  /* Spacing (8dp scale) */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;

  /* Typography scale */
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 15px;
  --text-lg:   17px;
  --text-xl:   20px;
  --text-2xl:  24px;
  --text-3xl:  30px;
  --text-4xl:  36px;
}
```

### 2. `src/styles/index.css` — clean entry point, no legacy rules

```css
@import 'tailwindcss';
@import './fonts.css';
@import './theme.css';

@layer base {
  * { box-sizing: border-box; }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
}
```

No `@custom-variant`, no `source(none)`, no `default_theme.css`, no `globals.css` import here.

### 3. `src/app/App.tsx` — responsive mobile-first TwoBeOne landing page

Replace the existing complex app shell with a self-contained landing page component. Key sections:

- **Sticky nav** — logo + "Sign In" CTA, blurred glass background
- **Hero** — headline, subtitle, two CTAs, social proof row, scripture quote card, right-side inline phone mockup (`AppScreenMockup` — no external image)
- **Features grid** — 6 cards (Devotionals, Journaling, Prayer, Questions, Modules, Analytics), icons from `lucide-react`
- **Stats band** — 4 metric tiles
- **Testimonial** — quote card + author
- **FAQ accordion** — 6 items, CSS-only height transition
- **CTA banner** — dark section, email input, join button
- **Footer** — links, social icons, legal

All class names use Tailwind v4 utilities (`bg-background`, `text-foreground`, `border-border`, `rounded-lg`, etc.). Colour overrides use inline `style={{ color: 'var(--primary-600)' }}` only where a utility class for the palette shade is not available.

`AppScreenMockup` is a plain `<div>` tree — no `<img>`, no external asset dependency — replacing the broken `figma:asset` import.

Typography uses `font-sans` (system font stack from `--font-sans`). No hardcoded font family strings.

---

## Files changed

| File | Action |
|------|--------|
| `src/styles/theme.css` | Rewrite — single clean `@theme` + `:root` palette |
| `src/styles/index.css` | Rewrite — minimal Tailwind v4 entry, no legacy rules |
| `src/app/App.tsx` | Rewrite — TwoBeOne landing page, no `figma:asset` |

`globals.css`, `default_theme.css`, `demo-entry.tsx` are **not touched** — they are outside the main build entry and the new `index.css` simply doesn't import them.

---

## Verification

1. `vite build` exits 0, no unresolved-import or `@theme` warnings.
2. Landing page renders: nav, hero with phone mockup, feature grid, stats, FAQ, CTA, footer.
3. Changing `--color-primary` in `theme.css` recolours all primary-coloured elements.
4. `grep -r "figma:asset" src/` — no results.
5. `grep -r "@custom-variant" src/styles/index.css src/styles/theme.css` — no results.
