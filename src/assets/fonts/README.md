# TwoBeOne self-hosted fonts

Inter, Playfair Display, and Noto Sans Ethiopic were retrieved on 2026-09-13 from the official Google Fonts CSS API and fonts.gstatic.com as unmodified WOFF2 subsets. Sur Graphics, Tayitu, and the previously tried Nokia Pure Headline files were supplied separately by the user and copied without modification.

## Active Amharic font: Tayitu

The supplied `Tayitu.ttf` is registered under the CSS family `Tayitu` as a static Regular 400 face. It renders Ethiopic text in the Amharic UI, independently selected Amharic verses, and Ethiopic text in English or Afaan Oromo screens. Its CSS range is restricted to U+1200-1399, preserving existing Latin fonts and digits. Noto Sans Ethiopic covers missing characters and broader Ethiopic extensions.

- Family: Tayitu; PostScript name: Tayitu-Regular.
- One static upright Regular face, weight 400; no variable axes.
- 347 Ethiopic mappings, covering all 204 distinct Ethiopic characters in the current app TS/TSX sources.
- Bytes: 139088.
- SHA-256: 35f4e51fa6794e01a81a7547179f67e0777186761ab8a28b91ceba8032272ea4.
- Source: user-supplied `Tayitu.ttf`.

Only the Regular Tayitu face was supplied. Browser-synthesized bold is allowed to preserve existing emphasis, including the bold Daily Verse; it is not a separate native bold font. Synthetic italics remain disabled. Vite processes the local TrueType asset, and `font-display: swap` keeps text visible while it loads.

## Previous Sur Graphics fonts

The three user-supplied Sur Graphics TrueType faces are retained as inactive source files for comparison. They are no longer registered in `fonts.css` or selected by the active font stacks; the user selected Tayitu as the final Amharic font.

| File | Internal face / weight | Bytes | SHA-256 |
| --- | --- | --- | --- |
| Sur_Graphics_Regular_5752140c8e.ttf | SurGraphics Regular / 400 | 248396 | a30037c1d006b1ee2ad99ed61fea91bcc3070ffc2f773ee7f5994019be6e047e |
| Sur_Graphics_Bold_bb647da03d.ttf | SurGraphics Bold / 700 | 230188 | 6f7b8e3d645d9a83cf4ee7429898bcdd28ba90f3a77563aa97971285c2a0478a |
| Sur_Graphics_Extra_Bold_400099f08e.ttf | SurGraphics Black / 900 | 291268 | d33d8e2375ec3dfbbd16e996e81ae56f3c23e996d1b95f744b141646be80cb86 |

All three are static upright faces with identical character coverage: 339 Ethiopic mappings, including all 204 distinct Ethiopic characters in the current app TS/TSX sources. They have no variable axes. Table checksums, mapped glyph IDs, and outline offsets were verified. The file named Extra_Bold identifies itself internally as Black, weight 900.

## Previous Nokia Pure Headline files

These previously selected WOFF files contain **no Ethiopic glyphs**. They are retained as source files for reference but are no longer registered in `fonts.css` or selected by the active font stacks. Their original provenance and hashes are retained below.

| File | Static weight | Bytes | SHA-256 |
| --- | --- | --- | --- |
| nokiapureheadline_light.woff | 300 | 79736 | 0a47758a6be54cd8e397edb6064496e3e69442af5dee5cbee1f9b3b65b11a3c1 |
| nokiapureheadline_regular.woff | 400 | 83756 | f2c73d169a8de9dfb0a26b99a8a478aeda89b474a5c74e5ae67988d622529496 |
| nokiapureheadline_bold.woff | 700 | 85456 | 6404bd9ac6c1477756c6905bad19d8d031ed8ec8ce4a3bd0efb9fdea98ae6bf8 |

These are static upright faces, not variable fonts. CSS requests for intermediate weights use the browser's nearest available face. Their source is the user-provided `nokia-pure-headline-font` package; the Google Fonts sources and OFL notices below describe only the three Google Fonts families.

## Google Fonts families

| CSS family         | Normal variable weights | Included subsets      | Google delivery revision |
| ------------------ | ----------------------- | --------------------- | ------------------------ |
| Inter              | 100-900                 | Latin, Latin extended | v20                      |
| Playfair Display   | 400-900                 | Latin, Latin extended | v40                      |
| Noto Sans Ethiopic | 100-900                 | Ethiopic              | v50                      |

The delivery revisions above identify the downloaded URLs, not semantic releases. Inter source metadata identifies its 4.1 Google Fonts distribution (commit 66647c0bbbe41a850d79d9c76fb13add3378940f). Noto metadata identifies v2.102 (commit 1cc6933c58b7c42bbade15d6c7173897c24759e3). Playfair Display metadata identifies commit 80a334101928546b04fa9e709ad4b2f11f8a9e10; its published FONTLOG is included. Upstream metadata records provenance; the versioned binary URLs and hashes below identify the exact assets.

The downloaded binaries were also inspected directly after Brotli decompression. Their OpenType `name` tables report Inter `Version 4.001;git-66647c0bb`, Playfair Display `Version 1.203`, and Noto Sans Ethiopic `Version 2.102`. Each binary has only a `wght` variation axis with the range shown above and default 400. In particular, these Inter subsets have no `opsz` axis, and the Noto subset has no variable width axis.

## Loading and coverage

The existing src/styles/index.css imports fonts.css. Its local @font-face URLs are processed and hashed by Vite. Every active face uses font-display: swap; the Google-provided faces use native variable weights and Unicode ranges, while Tayitu uses a static Regular 400 face. Fonts ship with the app; the existing service worker caches requested same-origin font assets after their first successful load. No Google Fonts stylesheet is needed at runtime.

Use the shared font tokens from typography.css: Inter for Latin UI text, Playfair Display for selected Latin emotional accents, and Tayitu followed by Noto Sans Ethiopic for Ethiopic text. Native ranges include the requested Inter 300-600 and Playfair Display 400-600 weights. Only upright fonts are bundled; avoid requesting synthetic italic. Noto uses normal width (100%).

Latin and Latin-extended subsets support the English and Afaan Oromo UI. Tayitu supplies Amharic glyphs and Noto provides extended Ethiopic fallback. Both are restricted to Ethiopic Unicode ranges in CSS: Latin text uses its existing font. Unicode-range lets browsers fetch only fonts required by current content; do not preload every subset.

## License and official sources

Inter, Playfair Display, and Noto Sans Ethiopic are licensed under SIL Open Font License 1.1. Keep their complete OFL notices with redistributed assets.

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
