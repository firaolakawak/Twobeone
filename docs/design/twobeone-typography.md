# TwoBeOne typography

The production type system uses Inter for UI and reading text, with Playfair Display reserved for selected devotional titles, the Prayer page heading, and the shared-story display title. Amharic uses the user-supplied **Tayitu Regular 400** face, with Noto Sans Ethiopic fallback for unsupported characters. Tayitu covers all 204 distinct Ethiopic characters currently used by the app's TS/TSX sources. Its CSS Unicode range limits it to Ethiopic text, preserving existing Latin fonts and digits. Explicit content language attributes also select the appropriate stack.

## Mobile reference scale

The CSS uses `rem`; these sizes are the reference at a 16px browser default. Larger browser text settings scale the type and line heights together.

| Role    | Size / line height | Weight | Use                                 |
| ------- | ------------------ | ------ | ----------------------------------- |
| Display | 32 / 40px          | 500    | Shared-story emotional heading      |
| H1      | 24 / 32px          | 500    | Page headings                      |
| H2      | 20 / 28px          | 500    | Check-in and section headings       |
| H3      | 18 / 26px          | 500    | Activity and content card titles    |
| Body L  | 16 / 24px          | 400    | Reading text, days together         |
| Body M  | 15 / 22px          | 400    | Secondary prose and mood options    |
| Body S  | 14 / 20px          | 400    | Activity descriptions               |
| Caption | 12 / 16px          | 500    | Dates, distance, status, navigation |

Primary buttons use Body L at weight 500. Navigation icons are 24px. Inter 300 is limited to larger supportive text with 24px or 28px leading; small captions and controls retain 500. Playfair’s supplied font supports 400–900, so Light 300 is never applied to that family. Existing brand wordmarks and semantic emphasis can retain heavier weights.

The dashboard's requested emphasis uses 24px/700 couple names, an 18px/700 rose day count, and a 16px/700 black Daily Verse. Tayitu supplies one static Regular 400 face. Browser-synthesized bold is preserved for heavier Amharic emphasis, including the Daily Verse; no native Tayitu bold face was supplied. The previously tried Sur Graphics files remain inactive source assets and are no longer registered or selected by the font stacks.

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

Fonts are local variable WOFF2 subsets plus the user-supplied static Tayitu Regular 400 TrueType face, all with `font-display: swap` and Unicode-based loading. This avoids runtime Google Fonts requests. Vite hashes the assets; the existing service worker can cache them after a successful load. No blanket preload is used. Font provenance, available licenses, binary versions, and checksums are in the [font manifest](../../src/assets/fonts/README.md).

The Google Fonts binaries have a weight axis and no optical-size axis; Tayitu has no variable axes. `font-optical-sizing: auto` is harmless for them and allows future optical-size fonts to work naturally; it does not create an optical-size axis. Only upright faces are bundled. Browser-generated bold is allowed to retain Tayitu emphasis, while synthetic italics remain disabled.

Text and line heights scale through relative units, with no viewport zoom restriction. Localized and enlarged-text web layouts are checked for wrapping, scroll reachability, and clipping.

This custom TwoBeOne scale draws on [Apple typography guidance](https://developer.apple.com/design/human-interface-guidelines/typography), [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility), and [MDN variable font documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Fonts/Variable_fonts).
