# App-wide pastel glass UI

14 September 2026. The user requested the approved couple-dashboard design throughout the active app. This migration applies to the web application loaded by `src/main.tsx` and `src/app/App.tsx`, including the installed PWA and URL wrapper. Duplicate legacy trees and independent Expo screens that are not loaded by this entry were not rewritten.

## Shared system

The [glass language](twobeone-glass-language.md) now defines default materials for shared cards, fields, actions, tabs, dialogs, sheets, menus, and other controls. The semantic palette also covers content mounted outside the app shell. Pages use lavender/rose canvases, luminous borders, navy text, and shared raised or inset panels. Dense form and reading surfaces remain opaque; nested cards do not add blur. Light/dark, reduced-transparency, and forced-colors values are provided by shared tokens.

Default materials preserve deliberate custom artwork, semantic fills, and existing glass compositions. `tbo-surface-plain` is available for an explicit opt-out. Error actions use a readable red fill/ink pair in each theme. The rose wordmark and BackButton accents retain their documented roles.

## Coverage

| Area | Updated surfaces |
| --- | --- |
| Public and account | Landing, onboarding, sign-in/sign-up, password reset, newsletter preferences, static and legal pages, consent |
| Couple features | Journal and entries, prayer and reflection chat, calendar, devotions and Bible reading, learning and readiness, quizzes/questions/results, community/groups/live-video controls, partner chat, progress, timeline, mood analytics |
| Profile | Header surroundings, tabs, forms, partner settings, and cover editor; the approved pink/peach cover default and avatar controls remain |
| Administration | Dashboard/sidebar and users, questions, devotionals, learning modules, groups, landing content, privileges, push, and security consoles |
| Shared system UI | Notifications, location settings, installation/update prompts, offline status, alarm dialog, common cards/inputs/actions/tabs/menus/dialogs/sheets |

The approved dashboard hero arrangement, compact counter, small location/faith row, brighter dividers, original stage names, and cover-upload placement remain. Photos, scripture artwork, phone illustrations, 3D rendering, video surfaces, and semantic chart/status colors retain their intended uses. Existing routes, API contracts, saved content, translations, and navigation behavior are preserved.

## Previews

[Journal](feature-journal-glass.png) · [Prayer in dark mode](feature-prayer-glass-dark.png) · [Questions](feature-questions-glass.png) · [Learning in dark mode](feature-learning-glass-dark.png)

[Sign in](app-glass-auth-reference.png) · [Public page](app-glass-public-reference.png) · [Profile](app-glass-profile-reference.png) · [Admin](app-glass-admin-reference.png)

[Shared controls](app-glass-controls-reference.png) · [Dark controls](app-glass-controls-reference-dark.png) · [Notifications](app-glass-notifications-reference.png) · [Location Settings](app-glass-location-reference.png) · [Install prompt](app-glass-install-reference.png)

## Verification

All **351 tests in 85 files** passed. The final Location Settings layout also passed its 11 relevant location/dashboard tests. The production build passed with the existing large-chunk advisory; the compiled public App and linked assets loaded in English and Amharic at 390px without application errors or failed local assets.

Windows Edge 153 checked:

| Scope | Actual checks | Evidence |
| --- | --- | --- |
| Shared controls | 124 layouts and 82 interaction/media checks; 320/390px, EN/AM/OM, both themes, normal/200% text, plus desktop controls/popovers | [Controls](app-glass-controls-evidence.json) |
| Public/Profile/admin | 35 representative layouts across 320/390/1280px, all three languages, both themes, normal/200% text | [Public and admin](app-glass-public-admin-evidence.json) |
| Couple features | 41 rendered cases across 320/390/446/1280px, including translated/enlarged text, both themes, empty states, and approved dashboard regression; three interaction checks | [Features](app-glass-features-evidence.json) |
| System surfaces | 18 notification/install/location layouts, plus five action, draft-preservation, dismissal, and focus checks | [System UI](app-glass-system-evidence.json) |
| Production output | Public App and its assets in English and Amharic | [Built smoke check](app-glass-built-smoke-evidence.json) |

The migration fixed long-label overflow in tabs/selects, dialog/sheet scrolling and close clearance, long Card content, translated landing/feature grids, and the install/location panels at enlarged text. Default and destructive button fill/ink pairs were checked in both themes. The shared radio control's utility import was corrected when its direct-load check exposed the broken path. Functional text stays at least 12px; close and location targets retain at least 44px at normal root text size.

Representative browser checks mount actual components with local API fixtures. They do not exercise live accounts, real delivery/installation, physical devices, or native-speaker translation review. Enlarged text uses CSS root scaling; it does not establish native browser zoom equivalence. No deployment or live data write was performed.
