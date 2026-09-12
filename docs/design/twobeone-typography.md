# TwoBeOne typography

The production type system uses Inter for UI and reading text, with Playfair Display reserved for selected devotional titles, the Prayer page heading, and the shared-story display title. Amharic uses Noto Sans Ethiopic instead of simulating a Latin serif. English and Afaan Oromo use the Latin font subsets.

## Mobile reference scale

The CSS uses `rem`; these sizes are the reference at a 16px browser default. Larger browser text settings scale the type and line heights together.

| Role    | Size / line height | Weight | Use                                 |
| ------- | ------------------ | ------ | ----------------------------------- |
| Display | 32 / 40px          | 500    | Shared-story emotional heading      |
| H1      | 24 / 32px          | 500    | Couple names, page headings         |
| H2      | 20 / 28px          | 500    | Check-in and section headings       |
| H3      | 18 / 26px          | 500    | Activity and content card titles    |
| Body L  | 16 / 24px          | 400    | Reading text, days together         |
| Body M  | 15 / 22px          | 400    | Secondary prose and mood options    |
| Body S  | 14 / 20px          | 400    | Activity descriptions               |
| Caption | 12 / 16px          | 500    | Dates, distance, status, navigation |

Primary buttons use Body L at weight 500. Navigation icons are 24px. Inter 300 is limited to larger supportive text with 24px or 28px leading; small captions and controls retain 500. Playfair’s supplied font supports 400–900, so Light 300 is never applied to that family. Existing brand wordmarks and semantic emphasis can retain heavier weights.

## Implementation

The source of truth is [typography.css](../../src/styles/typography.css). Named variables define font families, weights, sizes, line heights, and spacing. Reusable role classes let new components use the same system:

```tsx
<h1 className="tbo-h1">Your space together</h1>
<h3 className="tbo-h3 tbo-emotional">A love rooted in faith</h3>
<p className="tbo-body-l">Make room for each other today.</p>
<span className="tbo-caption">Next anniversary</span>
```

Visual roles do not change HTML heading semantics: keep the heading level appropriate to the page structure. Keep body paragraphs left-aligned, allow translated titles to wrap, and use tabular numerals for the ticking timer. Avoid reducing text to fit a narrow screen.

Spacing tokens use 4, 8, 16, 24, and 32px at the default root: small gaps within groups, 16px card padding, 24px section spacing, and 32px between major groups. Icon geometry, borders, and minimum 44px touch targets remain physical pixels so text enlargement does not make controls unnecessarily wide.

The dashboard, shared-story dialog, bottom navigation, and principal devotional/prayer headings use these roles. Existing app screens inherit the Inter family; legacy components with explicit type sizes can migrate to named roles incrementally.

## Font delivery and accessibility

Fonts are local variable WOFF2 subsets with `font-display: swap`, native weight ranges, and Unicode-based loading. This avoids runtime Google Fonts requests. Vite hashes the assets; the existing service worker can cache them after a successful load. No blanket preload is used. Full licenses, binary versions, checksums, and official sources are in the [font manifest](../../src/assets/fonts/README.md).

The supplied binaries have a weight axis and no optical-size axis. `font-optical-sizing: auto` is harmless for them and allows future optical-size fonts to work naturally; it does not create an optical-size axis. Only upright faces are bundled. The new accent styles do not request synthetic italic or bold.

Text and line heights scale through relative units, with no viewport zoom restriction. Localized and enlarged-text web layouts are checked for wrapping, scroll reachability, and clipping.

This custom TwoBeOne scale draws on [Apple typography guidance](https://developer.apple.com/design/human-interface-guidelines/typography), [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility), and [MDN variable font documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Fonts/Variable_fonts).
