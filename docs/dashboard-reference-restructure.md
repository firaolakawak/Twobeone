# Dashboard pastel reference

14 September 2026. The user confirmed that the original pastel phone artwork is the target; the intervening dark-purple hero was not the target. This composition supersedes those earlier hero treatments.

Implemented previews: [light](glass-dashboard-reference.png) and [dark](glass-dashboard-reference-dark.png). Hero-only previews: [light](couple-hero-reference.png) and [dark](couple-hero-reference-dark.png). They use local sample data and initials in place of personal photos.

## Final composition

The hero uses a visible sunset garden, a periwinkle veil behind the white names, an Our Journey badge, and a soft fade into the pale application canvas. At wider widths the proportionally sized, overlapping profile photos and their translucent lavender frames sit beside both the name and duration rows. The compact rectangular duration card has a glossy pink heart, 28px live day count, pink clock, luminous white/lavender rim, and brighter blue glass surface. A distance pill and wrapped faith tagline sit below it.

The new clock display role is documented in [Typography Language](twobeone-typography-language.md); names, day counts, other text roles, and localized font families retain their shared scale. Settings has a readable violet icon and explicit keyboard focus. Missing-location and unpaired actions use white labels on their blue glass surfaces. Daily mood check-in and location settings retain their existing behavior, including focus restoration on dismissal.

The growth panel preserves **Seed, Growth, Unity, Commitment, Covenant**, real relationship-date progression, current-stage percentage, and days remaining. All five stage date-range captions remain removed. The four feature tiles use milky white interiors, subtle pink/blue tint, soft highlights, 8px gaps, and white vector artwork. Bible Study, Couple Journal, Prayer Tracker, Dates & Plans, and the Scripture banner retain their destinations. The other dashboard sections remain further down the page.

The garden is fixed decorative reference artwork; real profile photos remain in the avatars. No sample names, durations, distances, presence values, or profile photos are hardcoded. Narrow layouts and enlarged text reflow without reducing functional captions below 12px. The shared return controls and six navigation destinations remain intact.

## Artwork

The garden and mountain scenery are recreations, not the original source photographs. The UI remains implemented in React/CSS/SVG rather than flattened into a screenshot.

Garden: [WebP](../src/assets/couple-garden-reference.webp), 1200 x 800, approximately 57 kB; [original generated PNG](../src/assets/couple-garden-reference.png), 1536 x 1024. Created with the built-in image_gen tool; Sharp only resized and compressed the result.

Exact garden prompt:

> Use case: photorealistic-natural. Asset type: softly defocused background scenery behind a premium pastel lavender glass mobile-app hero. Create a landscape 3:2 photographic sunset garden with luminous visible pastel scenery: medium-toned periwinkle and blue-lavender sky and soft distant foliage on the upper left, peach-pink glowing golden-hour light on the upper right, soft distant olive and cypress tree silhouettes in the middle-right, abundant very out-of-focus lilac and pink flowers filling the lower half, and an indistinct garden path near the center. Photographic cinematic bokeh and soft atmospheric depth; the entire scene is deliberately defocused, elegant and dreamy, but recognizable as a real sunset flower garden. Keep the left side medium-toned blue-lavender so later white UI lettering can remain readable; right-side peach light is gentle and luminous, not blown-out. Use lavender, periwinkle, powder blue, soft peach, blush pink and muted olive. Preserve clear color variation and pleasant warm/cool balance. No people, no mountains, no text, no letters, no logos, no UI, no borders, no frame, no heart shapes, no dark purple wash, no muddy colors.

The Scripture banner continues to use the previously generated [mountain WebP](../src/assets/glass-scripture-landscape.webp), 1200 x 402, approximately 69 kB. Its built-in image_gen prompt was:

> Use case: stylized-concept. Asset type: full-bleed landscape background for a narrow scripture banner in a premium lavender glass app. Create ONLY a wide panoramic pastel mountain sunset landscape, ideally 6:1 aspect ratio. Dreamy realistic layered alpine peaks with detailed but softly atmospheric mauve, lavender and periwinkle foreground ridges; peach and pale pink glowing sunset low near center-right, pale pink and powder-blue clouds, and atmospheric depth. Overall pale lavender palette, luminous and peaceful. Composition: mountain ridges occupy the lower half, with quiet bright sky and gentle distant mountain shapes in the middle-left for a later navy scripture text overlay. No text, no typography, no cross, no people, no UI, no border, no frame, no watermark; edge-to-edge scenery.

## Verification

All 43 relevant tests in seven files passed, covering relationship timing, stage progression, dashboard integration, mood behavior, location settings, presence updates, and localization catalogs. The production build passed with its existing large-chunk advisory.

Windows Edge 153 compared the actual components at 576/676/840px with normal and 125% root text, and exercised 24 narrow combinations at 320/390px across English, Amharic, and Afaan Oromo, both themes, and normal/200% text. Long names, enlarged counts, missing-location and unpaired actions, settings language changes with unsaved input, keyboard opening/dismissal/focus return, reduced transparency, reduced motion, and forced colors were checked. Final evidence is saved separately from the superseded hero reports.

The [final browser evidence](dashboard-pastel-validation-evidence.json) records 12 reference cases, 24 narrow cases, six alternate states, and the targeted control rechecks. The compiled public App and linked assets also loaded in English and Amharic without runtime errors or failed local assets.

These checks use local API fixtures. Physical mobile devices, live account APIs, and native-speaker editorial review were not exercised.


## Annotated compact hero refinement

The latest marked screenshot requests a shorter counter card placed lower, lower couple names, smaller profile photos, and richer photo/overlay blending. The names move down 35px and the card moves down 45px at 676px with 125% root text. Card height reduces from 123px to 75.5px while preserving its width. Profile-photo diameter reduces by 15%. The day number now uses the 28px shared hero token, with captions still at 12px minimum. The panel gains tighter 14px corners, 6px vertical padding, and stronger glass highlights. Garden saturation rises to 1.25 with a richer peach/lavender overlay and a broader bottom fade.

The 23 existing relationship/dashboard/location tests and production build passed for this CSS refinement. Windows Edge checked the marked-width light/dark comparison and 24 narrow combinations across 320/390px, English/Amharic/Afaan Oromo, both themes, and normal/200% text. No functional overflow, clipped labels, undersized text, unloaded images, or runtime errors were found. Geometry and scope are recorded in the [compact hero evidence](dashboard-compact-hero-validation-evidence.json).
