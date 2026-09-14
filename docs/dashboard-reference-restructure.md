# Dashboard reference restructure

14 September 2026. This supersedes the initial dashboard glass composition in [Glass Language](twobeone-glass-language.md).

Implemented preview: [light](glass-dashboard-reference.png) · [dark](glass-dashboard-reference-dark.png). Screenshots use sample relationship data.

Saved [browser validation evidence](dashboard-reference-validation-evidence.json) records the layout, interaction, and final stage-label checks.

The user's supplied reference now defines the arrangement immediately below the couple hero:

1. A standalone Growth Stage panel with a purple sprig, stage heading, relationship subtitle, pink circular percentage indicator, days remaining, and five labeled glass milestones.
2. Four equal feature tiles: **Bible Study**, **Couple Journal**, **Prayer Tracker**, and **Dates & Plans**. Each has a colored circular icon, supporting copy, and a small circular arrow.
3. A mountain-sunset Scripture banner with the existing Ecclesiastes 4:9 quotation and a **Read More** action.

The subsequent user correction preserves the canonical stage names: **Seed, Growth, Unity, Commitment, Covenant**. Stage selection, current-stage percentage, and days remaining continue to use the original relationship date calculations. The small captions identify the actual day ranges, rather than introducing the reference artwork's different percentage bands.

The standalone calendar promotion and number-first statistic tile grid are replaced by the four reference shortcuts. The existing spotlight, daily reading, journey details, house builder, learning modules, Scripture memory, and Champions summary remain further down the dashboard. Both Bible entry points open the real reader at Ecclesiastes 4; other shortcuts retain their existing destinations.

Implementation: [DashboardFeatureSection](../src/app/components/DashboardFeatureSection.tsx), [DashboardGrowthCard](../src/app/components/DashboardGrowthCard.tsx), [reference styles](../src/app/styles/dashboard-reference.css), and [growth styles](../src/app/styles/dashboard-growth.css). New interface labels have Amharic and Afaan Oromo catalogs. The banner reuses the existing public-page quotation translations.

At the supplied 570px reference width, all four feature tiles occupy one row. Narrow or enlarged-text layouts reflow instead of shrinking functional labels below the shared typography minimum.

## Banner artwork

The landscape was created with the built-in image-generation tool. Source: [glass-scripture-landscape.png](../src/assets/glass-scripture-landscape.png), 2167×726. The application loads an optimized [WebP](../src/assets/glass-scripture-landscape.webp), 1200px wide and approximately 69 kB. CSS crops the panorama to the banner. The mountain art is a recreation; it is not the original image asset from the reference.

Exact generation prompt:

> Use case: stylized-concept. Asset type: full-bleed landscape background for a narrow scripture banner in a premium lavender glass app. Create ONLY a wide panoramic pastel mountain sunset landscape, ideally 6:1 aspect ratio. Dreamy realistic layered alpine peaks with detailed but softly atmospheric mauve, lavender and periwinkle foreground ridges; peach and pale pink glowing sunset low near center-right, pale pink and powder-blue clouds, and atmospheric depth. Overall pale lavender palette, luminous and peaceful. Composition: mountain ridges occupy the lower half, with quiet bright sky and gentle distant mountain shapes in the middle-left for a later navy scripture text overlay. No text, no typography, no cross, no people, no UI, no border, no frame, no watermark; edge-to-edge scenery.

## Verification

The production build and 36 relevant existing/new tests passed after the stage-name correction. Tests cover relationship behavior, the standalone growth card, dashboard integration, and translation catalogs.

Windows Edge 153 checked 36 layout combinations using the actual components and local API fixtures: 320/390/1280px, English/Amharic/Afaan Oromo, light/dark, normal/200% root text. No functional or page overflow, offscreen labels, text below 12px, or application errors remained. Reference comparisons also used 570px captures. Keyboard focus, feature destinations, the Ecclesiastes reader, reduced transparency, reduced motion, and forced colors were exercised. These checks use sample data; physical mobile devices and a live account were not exercised.

After restoring the original stage names, eight targeted checks covered 570/390px English and 320px enlarged Amharic/Oromo in both themes. They confirmed the labels, date captions, and active Growth stage. A further 390px check kept Commitment on one line without colliding with its neighbors. The compiled public App and linked assets also loaded in English/Amharic without local asset failures or runtime errors; this is not a test of the authenticated production flow.
