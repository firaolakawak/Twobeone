# TwoBeOne UI work

Follow the canonical [TwoBeOne Typography Language](docs/twobeone-typography-language.md) for UI changes in this repository.

Follow [TwoBeOne Glass Language](docs/twobeone-glass-language.md) for shared app-wide colors, materials, controls, and their accessible theme fallbacks.

Use the shared `BackButton` for page returns, following [TwoBeOne Navigation Language](docs/twobeone-navigation-language.md).

Follow [TwoBeOne Localization Language](docs/twobeone-localization-language.md) for English, Amharic, and Afaan Oromo copy, language switching, and branded loading states.

- Use the shared `tbo-*` text roles and `--type-*` tokens in `src/styles/typography.css`, with the family stack in `src/styles/fonts.css`.
- Keep equivalent text roles consistent across public, auth, couple, and admin screens. Remove conflicting typography overrides; keep functional captions at least 12px.
- Preserve the documented couple hero, wordmark, reading, code, and illustration exceptions and the user's approved layouts.
- Verify changed text in narrow layouts, translated content, and zoom conditions appropriate to the change. Report only checks actually performed.
