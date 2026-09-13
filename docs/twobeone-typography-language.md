# TwoBeOne Typography Language

Version 1.1 - Amharic font updated at the user's request, 13 September 2026

This is the canonical typography standard for TwoBeOne's active web application. It applies to public pages, authentication, onboarding, couple features, shared controls, notifications, and administration. Use the same text role for the same purpose across screens. The original audit is a historical baseline, not the current specification.

Page return controls also follow the companion [TwoBeOne Navigation Language](twobeone-navigation-language.md).

## Font families

Use `var(--font-ui)` for application text and controls. [fonts.css](../src/styles/fonts.css) defines the stack:

```css
--font-ethiopic-faces: 'Shiromeda Serif', 'Noto Sans Ethiopic';
--font-ui: var(--font-ethiopic-faces), ui-sans-serif, system-ui, -apple-system,
  BlinkMacSystemFont, 'Segoe UI', sans-serif, 'Apple Color Emoji',
  'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
--font-ethiopic: var(--font-ui);
```

Shiromeda Serif by Abraham Abebe is the Amharic font, using the user's unmodified regular (400) and bold (700) TTF files. Both are self-hosted with `font-display: swap` and `unicode-range: U+1200-137F`. The browser uses regular for 400/500 roles and bold for 600/700 roles. Keep the accepted sizes and role weights below; do not invent intermediate font files or increase text sizes to compensate for the new family.

Ethiopic characters use Shiromeda even in mixed-language content when English is selected. Noto Sans Ethiopic remains a fallback for additional Ethiopic glyphs missing from the supplied faces. Latin text, including Afaan Oromo, uses the existing platform sans-serif fallback. Reading and code exceptions prepend `var(--font-ethiopic-faces)` to their existing serif or monospace stacks so Amharic remains consistent while Latin retains the intended reading/code font. The runtime does not need Google Fonts. Keep each font's original source notices with its asset; see the [font provenance](../src/assets/fonts/README.md).

This standard defines the family strategy, sizes, weights, and spacing. It does not promise identical glyph shapes on every operating system or claim testing on platforms that have not been exercised. Set the correct language metadata. Use normal tracking for Amharic; do not force uppercase or tight Latin display tracking onto translated text.

## Accepted scale

Sizes below assume a 16px root. The implementation uses `rem` so typography can scale. Page titles change from 28px to 32px at the `40rem` breakpoint; other ordinary text roles keep their size.

| Role | Size | Weight | Line height | Class | Token stem |
| --- | --- | --- | --- | --- | --- |
| Page title | 28px / 32px | 700 | 1.2 | `tbo-page-title` | `--type-page` |
| Section title | 20px | 700 | 1.3 | `tbo-section-title` | `--type-section` |
| Card title | 18px | 600 | 1.35 | `tbo-card-title` | `--type-card` |
| Dialog title | 20px | 600 | 1.3 | `tbo-dialog-title` | `--type-dialog` |
| Body | 16px | 400 | 1.5 | `tbo-body` | `--type-body` |
| Field text | 16px | 400 | 1.5 | `tbo-field` | `--type-field` |
| Supporting copy | 14px | 400 | 1.5 | `tbo-supporting` | `--type-supporting` |
| Label | 14px | 600 | 1.4 | `tbo-label` | `--type-label` |
| Action | 14px | 600 | 1.4 | `tbo-action` | `--type-action` |
| Caption | 12px | 500 | 1.4 | `tbo-caption` | `--type-caption` |
| Eyebrow | 12px | 600 | 1.4 | `tbo-eyebrow` | `--type-eyebrow` |

Each token stem has `-size`, `-weight`, and `-leading` properties. For example, a custom stylesheet uses `--type-card-size`, `--type-card-weight`, and `--type-card-leading` together. [typography.css](../src/styles/typography.css) is the executable source for these values.

Page titles use slight Latin tracking of `-.02em`. Other ordinary roles use normal tracking. Eyebrows use `.06em` tracking without automatically uppercasing text; use them sparingly. Shared page and eyebrow classes remove tracking and uppercase transformations for Amharic.

## Applying roles

Use semantic elements for document structure, and use typography classes for appearance. An `h2` can be a card title or a section title according to its purpose. Do not change semantic heading levels to obtain a font size.

```tsx
<h1 className="tbo-page-title">Prayer</h1>
<h2 className="tbo-section-title">Prayer Requests</h2>
<h3 className="tbo-card-title">Growing together in faith</h3>
<p className="tbo-supporting text-muted-foreground">Start a shared request.</p>
<label className="tbo-label" htmlFor="title">Prayer title</label>
<input className="tbo-field" id="title" />
<button className="tbo-action">Save request</button>
```

Choose roles before adding layout or color classes. Keep typography definitions out of repeated screen-specific inline styles where a role class can express the purpose. If a custom CSS layout needs direct declarations, use the role's three tokens rather than inventing a neighboring size or weight.

Role classes are unlayered and authoritative over ordinary Tailwind utilities. Remove conflicting `text-*`, `font-*`, tracking, and leading utilities instead of relying on source order. Colors such as `text-muted-foreground` remain appropriate. Do not add `!important` or inline typography just to defeat a role. Shared base selectors must not depend on unrelated descendant classes.

## Shared primitive defaults

The following defaults are defined with low-specificity `:where(...)` selectors. A screen can select a more appropriate explicit `tbo-*` role without fighting the primitive's default.

| Primitive `data-slot` or surface | Default role |
| --- | --- |
| `card-title` | Card title |
| `dialog-title`, `alert-dialog-title`, `sheet-title`, `drawer-title` | Dialog title |
| `input`, `textarea`, `select-trigger`, `select-item` | Field text |
| `card-description`, `dialog-description`, `alert-dialog-description`, `sheet-description`, `drawer-description` | Supporting copy |
| `label` | Label |
| `button`, `tabs-trigger` | Action |
| `badge`, `select-label` | Caption |
| Toast title / description | Action / supporting copy |

Raw HTML also receives predictable base typography. Shared components provide these defaults; individual screens should not redefine the same control with a different scale. Toast integration includes explicit Sonner selectors so library styles do not reintroduce a separate font system.

## Preserved exceptions

- **Couple hero:** first-name heading at 28px / 32px, weight 700; day counter at 40px / 44px, weight 700 with tabular numbers; the existing compact relationship labels, red clock, and strong 14px tagline remain deliberate hierarchy. Preserve the user's approved positioning and the relationship component's local line heights. Do not turn an ordinary card title into a hero-sized title.
- **Dashboard statistics:** the four activity cards use a number-first display role, requested on 13 September 2026: responsive 25.6–57.6px tabular numbers at weight 700, followed by the shared card-title and supporting-copy roles. The metric scale is reduced by 20% at the user's request, using `clamp(1.6rem, 22.4cqi, 3.6rem)`. Use the same metric scale for all four cards; allow the grid to reflow when text is enlarged. This exception does not change titles or numbers elsewhere.
- **Wordmark:** weight 800 is intentional. The shared `tbo-wordmark` is 16px, line height 1.4, tracking `-.025em`; existing public/auth brand compositions can retain their approved brand size. This does not authorize weight 800 or 900 for ordinary controls.
- **Reading:** scripture quotations and dedicated reading views may retain explicit serif typography, comfortable reading leading, or user-controlled text sizing. Application headings, navigation, and form controls still use the shared UI roles.
- **Code and structured data:** code samples, JSON editors, and similar machine-readable content can use a monospace face. Their surrounding labels and actions use normal UI roles.
- **Illustrations and icons:** lettering inside actual miniature phone/site illustrations, emoji, and icon dimensions are artwork. Do not resize them by mechanically replacing every font-size declaration. Functional actions and explanatory labels beside the illustration are ordinary UI and follow the scale.

The public landing page's main headline uses the same 28px / 32px page-title role. Marketing layout alone is not an exception to the agreed heading scale.

## Consistency and verification

Use 400 for body/field/supporting text, 500 for captions, 600 for labels/actions/card/dialog titles, and 700 for page/section titles. Avoid arbitrary intermediate weights such as 650, 750, 780, or 850 and ad hoc near-duplicate sizes. Normal functional text should not fall below the 12px caption role. Use wrapping, more space, or a different layout instead of shrinking essential text to fit.

For a UI change, inspect relevant screens and dialogs at narrow widths, including 320px and 390px, and at desktop width. Check English, Amharic, and Afaan Oromo where the surface is translated. Exercise long names, longer translated labels, field values, and representative populated content. Check browser zoom/text scaling, and verify text is readable without overlap, clipping, inaccessible controls, or unintended horizontal page scrolling. Verify both themes where supported. A miniature preview or an automated DOM test does not substitute for checking functional text in the actual screen.

Use existing behavior tests appropriate to the change. Inspect computed family, size, weight, and line height when diagnosing cascade issues, and inspect rendered fonts when verifying Ethiopic coverage. State which browser, widths, languages, and conditions were actually checked; leave untested platforms explicit rather than inferring results. Recheck the production build and its linked assets when delivering compiled output.

## Sources and history

- [Typography implementation](../src/styles/typography.css)
- [Font declarations](../src/styles/fonts.css) and [font source/license details](../src/assets/fonts/README.md)
- [Active stylesheet entry](../src/styles/index.css)
- [Language metadata](../src/app/contexts/LanguageContext.tsx)
- [Shared UI primitives](../src/app/components/ui)
- [Couple name hierarchy](../src/app/components/CoupleMoodHeading.tsx) and [relationship hierarchy](../src/app/components/RelationshipJourney.tsx)
- [Approved interactive preview](typography-proposal.html), including the historical baseline comparison
- [13 September 2026 audit](typography-audit-2026-09-13.md) and [baseline browser evidence](typography-audit-evidence.json)
- [Implementation verification](typography-validation-2026-09-13.md) and [implemented font evidence](typography-validation-evidence.json)

Update this versioned document and its executable tokens together when the product's typography standard changes. Preserve the audit as historical evidence rather than rewriting its original findings to describe later implementation.

### Version 1.1 font verification

Windows Edge confirmed the actual Shiromeda Regular and Bold webfonts for
Amharic, including regular at 400/500 and bold at 600/700. Latin/Oromo retained
Segoe UI; Latin reading and code samples retained Georgia and Consolas.
Checked public landing, authentication, onboarding, users/questions admin,
settings and Bible reading at 320px/390px with normal and 200% text. Long
Amharic CTA text and admin action labels received wrapping fixes, and the
affected cases passed rechecks. The production build loaded both supplied
font files and used Shiromeda in the real Amharic dashboard after switching
languages. Other operating systems were not exercised for this font change.
