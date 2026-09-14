# Dashboard pastel reference

14 September 2026. The user confirmed that the original pastel phone artwork is the target; the intervening dark-purple hero was not the target. This composition supersedes those earlier hero treatments.

Implemented previews: [light](glass-dashboard-reference.png) and [dark](glass-dashboard-reference-dark.png). Hero-only previews: [light](couple-hero-reference.png) and [dark](couple-hero-reference-dark.png). They use local sample data and initials in place of personal photos.

## Final composition

The hero defaults to the same pale lavender/white gradient and navy text as the Growth Stage card, sharing the `--glass-journey-*` colors. An Our Journey badge and soft bottom fade retain the glass treatment. At wider widths the overlapping profile photos and their translucent lavender frames sit beside the names and duration. The left-aligned duration card has a glossy pink heart, 28px live day count, compact pink clock, white rim, and pale glass surface. Its preferred width is 16rem; the distance pill and faith tagline form a wider group directly below it, wrapping as space requires.

The clock display role is documented in [Typography Language](twobeone-typography-language.md); names, day counts, other text roles, and localized font families retain their shared scale. The distance pill now uses a location pin and opens Location Settings directly, with a 44px minimum touch target and explicit keyboard focus. When distance is unavailable it offers Share Location in the same position. The separate hero gear and cover controls are removed. Daily mood check-in and location settings retain their existing behavior, including focus restoration on dismissal.

The growth panel preserves **Seed, Growth, Unity, Commitment, Covenant**, real relationship-date progression, current-stage percentage, and days remaining. All five stage date-range captions remain removed. The four feature tiles use milky white interiors, subtle pink/blue tint, soft highlights, 8px gaps, and white vector artwork. Bible Study, Couple Journal, Prayer Tracker, Dates & Plans, and the Scripture banner retain their destinations. The other dashboard sections remain further down the page.

The fixed garden has been removed. An Edit cover button at the top-right of the Profile cover opens a thumbnail preview with Choose photo, Save, Cancel, and Remove cover actions. It edits the existing personal profile cover, also displayed on the dashboard. The Profile header retains its pink/peach default gradient. Accepted formats are JPEG, PNG, WebP, and GIF up to 10 MB. Removing the cover restores each screen's default gradient; an image that fails to load also falls back to the gradient. Real profile photos remain in the avatars. No sample names, durations, distances, presence values, or profile photos are hardcoded. Narrow layouts and enlarged text reflow without reducing functional captions below 12px. The shared return controls and six navigation destinations remain intact.

## Artwork

The mountain scenery is a recreation, not the original source photograph. The earlier generated garden is retained as an unused asset for reference. The UI remains implemented in React/CSS/SVG rather than flattened into a screenshot.

Garden: [WebP](../src/assets/couple-garden-reference.webp), 1200 x 800, approximately 57 kB; [original generated PNG](../src/assets/couple-garden-reference.png), 1536 x 1024. Created with the built-in image_gen tool; Sharp only resized and compressed the result.

Exact garden prompt:

> Use case: photorealistic-natural. Asset type: softly defocused background scenery behind a premium pastel lavender glass mobile-app hero. Create a landscape 3:2 photographic sunset garden with luminous visible pastel scenery: medium-toned periwinkle and blue-lavender sky and soft distant foliage on the upper left, peach-pink glowing golden-hour light on the upper right, soft distant olive and cypress tree silhouettes in the middle-right, abundant very out-of-focus lilac and pink flowers filling the lower half, and an indistinct garden path near the center. Photographic cinematic bokeh and soft atmospheric depth; the entire scene is deliberately defocused, elegant and dreamy, but recognizable as a real sunset flower garden. Keep the left side medium-toned blue-lavender so later white UI lettering can remain readable; right-side peach light is gentle and luminous, not blown-out. Use lavender, periwinkle, powder blue, soft peach, blush pink and muted olive. Preserve clear color variation and pleasant warm/cool balance. No people, no mountains, no text, no letters, no logos, no UI, no borders, no frame, no heart shapes, no dark purple wash, no muddy colors.

The Scripture banner continues to use the previously generated [mountain WebP](../src/assets/glass-scripture-landscape.webp), 1200 x 402, approximately 69 kB. Its built-in image_gen prompt was:

> Use case: stylized-concept. Asset type: full-bleed landscape background for a narrow scripture banner in a premium lavender glass app. Create ONLY a wide panoramic pastel mountain sunset landscape, ideally 6:1 aspect ratio. Dreamy realistic layered alpine peaks with detailed but softly atmospheric mauve, lavender and periwinkle foreground ridges; peach and pale pink glowing sunset low near center-right, pale pink and powder-blue clouds, and atmospheric depth. Overall pale lavender palette, luminous and peaceful. Composition: mountain ridges occupy the lower half, with quiet bright sky and gentle distant mountain shapes in the middle-left for a later navy scripture text overlay. No text, no typography, no cross, no people, no UI, no border, no frame, no watermark; edge-to-edge scenery.

## Previous pastel-reference verification

All 43 relevant tests in seven files passed, covering relationship timing, stage progression, dashboard integration, mood behavior, location settings, presence updates, and localization catalogs. The production build passed with its existing large-chunk advisory.

Windows Edge 153 compared the actual components at 576/676/840px with normal and 125% root text, and exercised 24 narrow combinations at 320/390px across English, Amharic, and Afaan Oromo, both themes, and normal/200% text. Long names, enlarged counts, missing-location and unpaired actions, settings language changes with unsaved input, keyboard opening/dismissal/focus return, reduced transparency, reduced motion, and forced colors were checked. Final evidence is saved separately from the superseded hero reports.

The [final browser evidence](dashboard-pastel-validation-evidence.json) records 12 reference cases, 24 narrow cases, six alternate states, and the targeted control rechecks. The compiled public App and linked assets also loaded in English and Amharic without runtime errors or failed local assets.

These checks use local API fixtures. Physical mobile devices, live account APIs, and native-speaker editorial review were not exercised.


## Annotated compact hero refinement

The latest marked screenshot requests a shorter counter card placed lower, lower couple names, smaller profile photos, and richer photo/overlay blending. The names move down 35px and the card moves down 45px at 676px with 125% root text. Card height reduces from 123px to 75.5px while preserving its width. Profile-photo diameter reduces by 15%. The day number now uses the 28px shared hero token, with captions still at 12px minimum. The panel gains tighter 14px corners, 6px vertical padding, and stronger glass highlights. Garden saturation rises to 1.25 with a richer peach/lavender overlay and a broader bottom fade.

The 23 existing relationship/dashboard/location tests and production build passed for this CSS refinement. Windows Edge checked the marked-width light/dark comparison and 24 narrow combinations across 320/390px, English/Amharic/Afaan Oromo, both themes, and normal/200% text. No functional overflow, clipped labels, undersized text, unloaded images, or runtime errors were found. Geometry and scope are recorded in the [compact hero evidence](dashboard-compact-hero-validation-evidence.json).

## Optional personal cover refinement

The user subsequently requested removal of the garden and selected a gradient with optional cover upload. The compact hero geometry and stage labels stay in place. The [cover editor preview](couple-cover-editor-reference.png) shows the selected photo locally and uploads only when Save is pressed. Cancel discards the draft, and Remove cover restores the gradient. Invalid formats, oversized files, and unreadable images are rejected with localized feedback. The existing personal cover also appears in Profile settings. Location settings retain their own control.

The photo overlay adds a stronger blue/lavender veil behind white text so very bright personal photos remain readable. This white-text treatment applies only when a personal photo is shown; the current default uses the Growth Stage palette and no image request. Cover updates reuse the existing authenticated profile-cover endpoints; their storage ordering now saves the profile change before cleaning up the previous image, preserving existing images when persistence fails.

All 32 tests in five relevant files passed, including the new cover editor, dashboard integration, relationship timing, location behavior, and localization catalogs. The production build passed with the existing large-chunk advisory. Sixteen mocked storage-route scenarios cover success, failure, authorization, and cleanup ordering; see the [storage evidence](dashboard-cover-storage-validation-evidence.json).

Browser validation uses actual React components with local fixtures. English, Amharic, and Afaan Oromo were checked at 320/390px in both themes with normal/200% text: 24 narrow hero layouts and 24 cover-dialog layouts, plus six larger default/white/photo cover views. Checks exercised preview-before-save, cancellation, language switching with a draft, focus return, pending controls, save/remove failures, successful save/removal, and image-load fallback. The [browser evidence](dashboard-cover-validation-evidence.json) records the scope and results. Live account storage and physical mobile devices were not tested, and no deployment was performed.

## Matching the stage palette and responsive alignment

The preceding annotation requests the Growth Stage card's pale gradient on the hero, a narrower left-aligned counter, a closer distance/tagline group, and smaller control icons that clear the portraits. Hero and Growth now use the same shared surface and text colors in each theme. The live counter panel prefers 16rem (256px at normal text size), while its context row can use up to 22rem. The clock sizes itself against the compact panel; narrow or enlarged-text layouts stack the metrics without truncating captions. That iteration placed smaller settings and cover controls below the content; the subsequent change below relocates their actions.

All 36 relevant tests in six files and the production build passed. Windows Edge checked 48 combinations of 320/390/510/676px, English/Amharic/Afaan Oromo, both themes, and normal/200% text. The default hero and Growth card share identical computed gradient and text colors. No functional overflow, clipped text, undersized captions, control/portrait intersections, or touch targets below 44px were found. Location settings, cover upload/removal, focus return, and bright uploaded-photo readability also passed with local API fixtures. See the [510px preview](couple-hero-responsive-reference.png) and [browser evidence](dashboard-stage-palette-validation-evidence.json). No live account writes or deployment were performed.

## Location pill and Profile cover editing

The latest request moves location settings onto the distance pill, replaces its globe with a location pin, and moves cover editing to Profile. Clicking the icon or distance text opens the existing Location Settings dialog; closing it returns focus to the same button. Without a known distance, Share Location remains available. No separate settings or image button remains on the hero.

Profile now has a visible top-right cover button and keeps its badge, avatar menu, and pink/peach gradient. The existing thumbnail editor replaces the old click-anywhere cover dropdown and duplicate upload handlers. Saved and removed covers update Profile immediately and refresh the persisted profile used by the dashboard. Its stylesheet loads directly with Profile, without depending on opening the dashboard first.

All 42 tests in seven relevant files and the production build passed, including distance-pin opening/focus return, missing-location access, Profile cover preview/save/removal, and localization catalogs. The build retains its existing large-chunk advisory.

Windows Edge checked 36 dashboard layouts and 36 Profile header layouts at 320/390/510px across English, Amharic, and Afaan Oromo, both themes, and normal/200% root text. Twelve additional editor layouts checked translated copy and scrollable access to the footer. The location and cover controls retain at least 44px touch targets; no functional overflow, clipped labels, or Profile control overlaps were found. Eight dashboard interaction checks and 22 Profile checks passed, including keyboard opening, focus restoration, location updates, direct-load Profile styles, draft cancellation, upload/removal failures, and saved/removed covers appearing on the dashboard.

See the [dashboard preview](couple-hero-responsive-reference.png), [Profile preview](profile-cover-reference.png), [cover editor preview](couple-cover-editor-reference.png), [location evidence](dashboard-location-validation-evidence.json), and [Profile evidence](profile-cover-validation-evidence.json). These checks used actual components with local API fixtures. No live account writes, physical-device checks, or deployment were performed; root text scaling does not establish native browser zoom equivalence.

## Smaller location pill and faith caption

The location pill now uses a 14px pin, narrower horizontal padding, and a shorter visible surface inside its existing 44px minimum touch target. Both the distance text and “Growing together in faith” use the shared 12px/500 caption role; the tagline previously used 14px/700. The row retains wrapping, keyboard focus, and the existing Location Settings action. Sizes continue to scale with root text settings.

The production build passed. Windows Edge checked 30 layouts: 320/390px with normal/200% root text and 446px with 125% root text, across all three languages and both themes. Eight location/focus interactions and four forced-colors/reduced-transparency checks passed using local fixtures. The visible pill measures 30px high at normal text while the button remains 44px; the English reference row fits on one line. See the [updated preview](couple-hero-responsive-reference.png) and [compact context evidence](dashboard-compact-context-validation-evidence.json).
