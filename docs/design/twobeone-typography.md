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

Shared buttons use Body S (14px/20px) at weight 500 and grow vertically when labels wrap. Their default minimum height is 44px, with 36px small and 48px large variants. Custom primary actions can use Body L (16px/24px). The dashboard spotlight action uses compact Body S, fits its label, and keeps a minimum 44px height. Navigation icons are 24px. Inter 300 is limited to larger supportive text with 24px or 28px leading; small captions and controls retain 500. Playfair’s supplied font supports 400–900, so Light 300 is never applied to that family. Existing brand wordmarks and semantic emphasis can retain heavier weights.

The dashboard's requested emphasis uses 24px/700 couple names, an 18px/700 rose day count, and a 16px/700 black Daily Verse. Tayitu supplies one static Regular 400 face. Browser-synthesized bold is preserved for heavier Amharic emphasis, including the Daily Verse; no native Tayitu bold face was supplied. The previously tried Sur Graphics files remain inactive source assets and are no longer registered or selected by the font stacks.

The Couples Dashboard follows the existing TwoBeOne rose, blush, and white visual language from the sign-in screen, Love Journey header, and navigation. Actions and progress values use the shared primary color tokens; white cards, blush activity surfaces, soft rose borders, and consistent spacing separate sections. Activity labels retain dark neutral text, and the Daily Verse stays bold black on a white-to-blush surface.

## Implementation

The source of truth is [typography.css](../../src/styles/typography.css). Named variables define font families, weights, sizes, line heights, and spacing. Reusable role classes let new components use the same system:

```tsx
<h1 className="tbo-h1">Your space together</h1>
<h3 className="tbo-h3 tbo-emotional">A love rooted in faith</h3>
<p className="tbo-body-l">Make room for each other today.</p>
<span className="tbo-caption">Next anniversary</span>
```

Visual roles do not change HTML heading semantics: keep the heading level appropriate to the page structure. Keep body paragraphs left-aligned, allow translated titles to wrap, and use tabular numerals for the ticking timer. Avoid reducing text to fit a narrow screen.

Spacing tokens use 4, 8, 16, 24, and 32px at the default root: small gaps within groups, 16px card padding, 24px section spacing, and 32px between major groups. Icon geometry and borders remain independent of text size. Controls use minimum heights rather than fixed heights wherever translated or enlarged labels need to wrap.

Page and section headings across the dashboard, devotions, journal, prayer, chat, questions, calendar, profile/settings, community, onboarding, and growth features use the shared roles. Shared card titles use H3; dialog, sheet, and drawer titles use H2. Text inputs and textareas use Body L at all breakpoints. Form labels and descriptions use Body S; metadata uses Caption. The compact year calendar keeps weekday initials at 10px/12px to preserve its miniature seven-column layout.

Marketing, download buttons, and administration styles also reference the central font stacks. Playfair remains an intentional editorial accent. Semantic status and category colors, code monospace, and native emoji fonts retain their distinct purposes. Amharic headings and tracked labels use normal letter spacing; language attributes on administration content previews choose the correct stack for the content being edited.

## Font delivery and accessibility

Fonts are local variable WOFF2 subsets plus the user-supplied static Tayitu Regular 400 TrueType face, all with `font-display: swap` and Unicode-based loading. This avoids runtime Google Fonts requests. Vite hashes the assets; the existing service worker can cache them after a successful load. No blanket preload is used. Font provenance, available licenses, binary versions, and checksums are in the [font manifest](../../src/assets/fonts/README.md).

The Google Fonts binaries have a weight axis and no optical-size axis; Tayitu has no variable axes. `font-optical-sizing: auto` is harmless for them and allows future optical-size fonts to work naturally; it does not create an optical-size axis. Only upright faces are bundled. Browser-generated bold is allowed to retain Tayitu emphasis, while synthetic italics remain disabled.

Text and line heights scale through relative units, with no viewport zoom restriction. Browser checks cover major app destinations in Amharic at 320px and English at 390px, plus shared controls, mixed-script input, and the public desktop layout. These checks verify loaded font faces, wrapping, scroll reachability, and clipping for the exercised states; they do not cover every possible content length or device.

This custom TwoBeOne scale draws on [Apple typography guidance](https://developer.apple.com/design/human-interface-guidelines/typography), [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility), and [MDN variable font documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Fonts/Variable_fonts).
