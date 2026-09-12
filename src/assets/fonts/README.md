# TwoBeOne self-hosted fonts

Retrieved on 2026-09-13 from the official Google Fonts CSS API and fonts.gstatic.com. Font binaries are unmodified Google-provided WOFF2 subsets.

| CSS family         | Normal variable weights | Included subsets      | Google delivery revision |
| ------------------ | ----------------------- | --------------------- | ------------------------ |
| Inter              | 100-900                 | Latin, Latin extended | v20                      |
| Playfair Display   | 400-900                 | Latin, Latin extended | v40                      |
| Noto Sans Ethiopic | 100-900                 | Ethiopic              | v50                      |

The delivery revisions above identify the downloaded URLs, not semantic releases. Inter source metadata identifies its 4.1 Google Fonts distribution (commit 66647c0bbbe41a850d79d9c76fb13add3378940f). Noto metadata identifies v2.102 (commit 1cc6933c58b7c42bbade15d6c7173897c24759e3). Playfair Display metadata identifies commit 80a334101928546b04fa9e709ad4b2f11f8a9e10; its published FONTLOG is included. Upstream metadata records provenance; the versioned binary URLs and hashes below identify the exact assets.

The downloaded binaries were also inspected directly after Brotli decompression. Their OpenType `name` tables report Inter `Version 4.001;git-66647c0bb`, Playfair Display `Version 1.203`, and Noto Sans Ethiopic `Version 2.102`. Each binary has only a `wght` variation axis with the range shown above and default 400. In particular, these Inter subsets have no `opsz` axis, and the Noto subset has no variable width axis.

## Loading and coverage

The existing src/styles/index.css imports fonts.css. Its local @font-face URLs are processed and hashed by Vite. Every face uses font-display: swap, its native variable weight range, and the Google-provided Unicode range. Fonts ship with the app; the existing service worker caches requested same-origin font assets after their first successful load. No Google Fonts stylesheet is needed at runtime.

Use "Inter", "Noto Sans Ethiopic", system-ui, sans-serif for UI text, and "Playfair Display", "Noto Sans Ethiopic", Georgia, serif for emotional accents. Native ranges include the requested Inter 300-600 and Playfair Display 400-600 weights. Only upright fonts are bundled; avoid requesting synthetic italic. Noto uses normal width (100%).

Latin and Latin-extended subsets support the English and Afaan Oromo UI. Noto provides Ethiopic glyphs for Amharic. Its Latin subsets are intentionally omitted: Latin text uses Inter or Playfair Display. Unicode-range lets browsers fetch only subsets required by current content; do not preload every subset.

## License and official sources

All families are licensed under SIL Open Font License 1.1. Keep the complete OFL notices with redistributed assets.

- Inter: [source](https://github.com/rsms/inter), [Google Fonts metadata](https://github.com/google/fonts/blob/main/ofl/inter/METADATA.pb), [license](./Inter-OFL.txt).
- Playfair Display: [source](https://github.com/clauseggers/Playfair), [Google Fonts metadata](https://github.com/google/fonts/blob/main/ofl/playfairdisplay/METADATA.pb), [license](./PlayfairDisplay-OFL.txt), [FONTLOG](./PlayfairDisplay-FONTLOG.txt).
- Noto Sans Ethiopic: [source](https://github.com/notofonts/ethiopic), [Google Fonts metadata](https://github.com/google/fonts/blob/main/ofl/notosansethiopic/METADATA.pb), [license](./NotoSansEthiopic-OFL.txt).

[Official CSS request](https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Noto+Sans+Ethiopic:wght@100..900&family=Playfair+Display:wght@400..900&display=swap), requested with a modern Chrome user agent for variable WOFF2 subsets.

## Binary manifest

### inter-latin-ext-wght.woff2

- Family/subset: Inter / latin-ext
- Bytes: 85068
- SHA-256: 34b9c504cab7a73e37b746343a449132e56cf7b5481af2cb81dc74dcff25c956
- [Download URL](https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7SUc.woff2)

### inter-latin-wght.woff2

- Family/subset: Inter / latin
- Bytes: 48256
- SHA-256: 3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62
- [Download URL](https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2)

### noto-sans-ethiopic-ethiopic-wght.woff2

- Family/subset: Noto Sans Ethiopic / ethiopic
- Bytes: 198324
- SHA-256: ca2b45a582e89f9bb2a96d955039db5c413eb439b0b73ee56a6c1fd26b15cbe1
- [Download URL](https://fonts.gstatic.com/s/notosansethiopic/v50/7cHAv50vjIepfJVOZZgcpQ5B9FBTH9KGNfhSTgtoow1KVnIv4gckut2Q.woff2)

### playfair-display-latin-ext-wght.woff2

- Family/subset: Playfair Display / latin-ext
- Bytes: 21140
- SHA-256: 42898ad49a6b23f32b109243e1df596edf831015ed685f429e4dafbb181d599d
- [Download URL](https://fonts.gstatic.com/s/playfairdisplay/v40/nuFiD-vYSZviVYUb_rj3ij__anPXDTLYgFE_.woff2)

### playfair-display-latin-wght.woff2

- Family/subset: Playfair Display / latin
- Bytes: 38404
- SHA-256: e0c764a8e9e1cce92163c55bac4b2ad6cd4cf8c696ce2289ab5c41565e65b7e2
- [Download URL](https://fonts.gstatic.com/s/playfairdisplay/v40/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgA.woff2)

Total WOFF2 bytes: 391192.
