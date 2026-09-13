# TwoBeOne fonts

## Shiromeda Serif — primary Amharic face

The user supplied these regular and bold faces on 2026-09-13 and requested them
for Amharic. Designer: Abraham Abebe; manufacturer metadata: Anbassa Design.
The original download bundle identifies Font.et as its source. The TTF bytes
are copied unchanged; only the local filenames are shortened.

| Local file | Original filename | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `ShiromedaSerif-Regular.ttf` | `Shiromeda_Serif_Regular_8d192170e3.ttf` | 206708 | `3d2e73738872c407869ea831e1aec47d8cc74017f0294eb181e5f9c766d2c899` |
| `ShiromedaSerif-Bold.ttf` | `Shiromeda_Serif_Bold_953cc9ae1e.ttf` | 210016 | `2360c8c0bd7a4e682eaafeb08ef25eafd1b05f58dc3f66e9f5cad4163ec60312` |

The supplied bundle's notice says "Unknown License" and provides no specific
license terms. Its unmodified notice is retained at
`src/app/public/fonts/NOTICE-ShiromedaSerif.txt`, served as
`/fonts/NOTICE-ShiromedaSerif.txt`. The Noto OFL notice below applies only to Noto.

CSS declares regular at weight 400 and bold at 700, restricted to
`U+1200-137F`; their Latin glyphs do not replace the existing Latin/Oromo fonts.
The normal browser weight matching chooses regular for 500 and bold for 600.

## Noto Sans Ethiopic — additional Ethiopic glyph fallback

`NotoSansEthiopic-ethiopic-wght.woff2` is the unmodified Ethiopic subset served
by Google Fonts, with variable weights 100–900 and normal width. Downloaded on
2026-09-13 from the official Google Fonts CDN:

https://fonts.gstatic.com/s/notosansethiopic/v50/7cHAv50vjIepfJVOZZgcpQ5B9FBTH9KGNfhSTgtoow1KVnIv4gckut2Q.woff2

The source stylesheet was requested with a current Chromium user agent:

https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wdth,wght@100,100..900&display=swap

- Size: 198,324 bytes.
- SHA-256: `ca2b45a582e89f9bb2a96d955039db5c413eb439b0b73ee56a6c1fd26b15cbe1`.
- Project: https://github.com/notofonts/ethiopic
- Distribution metadata: https://github.com/google/fonts/tree/main/ofl/notosansethiopic
- Copyright 2022 The Noto Project Authors.
- License: SIL Open Font License 1.1. The complete, unmodified notice is in
  `src/app/public/fonts/OFL-NotoSansEthiopic.txt` and is served with production
  builds at `/fonts/OFL-NotoSansEthiopic.txt`.

The `@font-face` in `src/styles/fonts.css` retains the official Ethiopic Unicode
range. It follows Shiromeda in the Ethiopic face stack, supplying additional
glyphs when needed. No external font request is needed at runtime.
