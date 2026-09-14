# Glass design validation — 14 September 2026

Scope: the first application of the [TwoBeOne Glass Language](twobeone-glass-language.md) to the active Vite web application. Shared materials, authenticated shell/header controls, bottom navigation, couple dashboard, learning preview, and Champions summary were changed. Public/auth/admin and other feature interiors were not comprehensively restyled.

## Automated checks

- `npm run build` passed. Vite retains its existing warning about chunks larger than 500 kB.
- `npm test` passed: **331 tests in 82 files**. This includes existing dashboard, relationship, navigation, language switching, notification, localization, and other application tests.
- `git diff --check` passed.

## Browser checks

Windows Microsoft Edge was exercised using actual active React components and local API fixtures. The dashboard harness mirrors the authenticated shell but does not use a live account. Remote account writes were blocked/mocked.

- **36 layout combinations:** 320, 390, and 1280px; English, Amharic, and Afaan Oromo; light and dark; normal text with ordinary names and 200% root text with long names.
- All 36 measured page widths fit the viewport after corrections. Functional text remained inside the viewport and was not smaller than 12px. These are text-scaling checks, not a claim of testing every browser zoom implementation.
- Reflow fixes cover couple names/avatars, the relationship counter and stages, spotlight controls, calendar and house cards, learning rows, Champions summary, and six-tab navigation. The Oromo calendar eyebrow wraps at 320px.
- Dashboard statistic and navigation callbacks were exercised (10 callbacks). Calendar Enter activation and its visible focus outline were checked. Spotlight shuffle/action and Bible-reader open/Escape behavior were exercised.
- A mounted language change to Amharic preserved the unsaved location field. Shiromeda Serif Bold was confirmed as the rendered Amharic heading font. This is not native-speaker editorial review.
- Reduced-transparency and forced-colors emulation produced solid material surfaces with no backdrop blur. Reduced-motion emulation stopped the relationship animations and new navigation motion.
- Header blur lives on a decorative pseudo-element so the notification drawer and backdrop retain viewport bounds. Their 390×844 geometry was verified. Header icons use light lavender ink in dark mode.
- Fixed navigation clearance was measured at 320px with 200% text. The final card remained reachable above the enlarged navigation.
- Final targeted rechecks confirmed that the learning percentage stays on one line, all three language menu items remain unobstructed at 320px/200% text, and the notification drawer paints above the navigation. The navigation sits below the header and dialog layers.

Production preview smoke tests loaded the compiled public App in English and Amharic at 390px. The current build's linked JavaScript, CSS, and both Shiromeda font files loaded without local asset failures or runtime errors. Compiled glass styles were also verified. This smoke test does not establish authenticated production-flow coverage.

Saved artifacts: [light dashboard](glass-dashboard-light.png), [dark dashboard](glass-dashboard-dark.png), and [compact layout/production evidence](glass-validation-evidence.json). Dashboard screenshots contain local sample data.

The independent code review caught the fixed-overlay containment issue before completion; the browser checks caught text reflow and header-control contrast issues. Those were corrected during this pass.

## Limits

Physical iOS/Android devices, Safari, assistive-technology navigation, live backend behavior, every feature screen, and every browser zoom level were not tested. Existing location-dialog Escape focus restoration was observed to be incomplete; that dialog behavior was not changed by the glass styling work. The glass design is a local implementation, not a production deployment.
