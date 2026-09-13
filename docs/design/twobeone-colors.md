# TwoBeOne colors

One shared light palette applies throughout the app. Routes and dashboard sections do not select different color combinations.

| Role | Color |
| --- | --- |
| Full page background | White `#FFFFFF` |
| Cards and panels | Warm ivory `#FAF8F7` |
| Buttons and active icons | Rose `#E11D48` |
| Selected backgrounds | Soft blush `#FFF1F2` |
| Main text | Charcoal `#242126` |
| Secondary text | Warm gray `#6E6870` |
| Borders | Pale gray `#EAE4E6` |

The source of truth is [brand-theme.css](../../src/styles/brand-theme.css), loaded after the base theme and typography. Semantic variables and existing rose/neutral utility scales point to this palette. Shared card and dialog surfaces use ivory; document and app page wrappers use white. Inputs can remain white to distinguish editable fields from their card. Primary hover states use the darker rose `#BE123C`.

Decorative gradients are limited to the logo and couple photo rings. Other cards use flat surfaces without colored top strips. The shortcut tiles fill their panel, and selected navigation uses blush with rose icons. Error, success, warning, presence, chart/category meaning, photos, and 3D material previews retain their semantic or illustrative colors.

Typography remains Inter for Latin UI and Tayitu for Amharic, with intentional Playfair editorial accents. The Journey timer stays `HH:MM:SS`, the anniversary countdown remains bold, and its white hearts and enlarged distance connector remain. Connector motion respects reduced-motion preferences; no palette timers, storage, network requests, or route theme hooks are needed.
