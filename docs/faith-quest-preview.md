# Together in Faith — playable preview

17 September 2026. A local playtest of the user's selected cooperative Christian couples game concept.

Open **http://localhost:5173/?preview=faith-quest** while Vite is running to try the original practice journey. The dashboard card has since become the [daily challenge popup](daily-faith-challenge.md); its real partner syncing requires the new backend migration and function. The existing Character House and its saved blueprint remain available through their original card.

## Emoji interface

All 30 missions now use a short scene and three large emoji choices with brief labels. The original full choice descriptions remain available to assistive technology and as tooltips. Selected cards show a check, and the Confirm button stays disabled until a choice is selected.

The dialog uses emoji step indicators and a compact sample-partner badge. Instructions, suggested Grace responses, and shared reflections expand on request. Reveal cards show the chosen emoji and short label. This removes repeated instructions and the incorrect “You’s choice” heading while retaining the same gameplay, private handoff, and completion rules.

The short copy is translated into English, Amharic, and Afaan Oromo. Enlarged-text layouts reflow the choices vertically when needed.

Screenshots: [emoji choices](faith-quest-emoji-choice.png) · [reveal with optional guidance expanded](faith-quest-emoji-reveal.png).

### Emoji refresh verification

- **19 tests in five files passed:** all three play modes, private handoff, saved progress, confirmed exit/reset, storage rejection, mid-mission language switching, all 30 visual scenes, and translation coverage/placeholders.
- The production build passed after the final changes. Output went to a temporary directory; the existing large-chunk advisory remains.
- Windows Edge checked **61 layout states and 76 accessibility/gameplay assertions** in the actual preview. Representative coverage includes English, Amharic, and Afaan Oromo at 320/390/1280px, both themes, an additional 538px choice view, and 200% root text (English at 390px/dark, Amharic at 320px/light, Oromo at 320px/dark).
- Checked selected emoji cards, accessible radio names/full descriptions, disabled Confirm before selection, step labels, practice identification, keyboard-operated Grace guidance, heart guesses/private handoff/reveal, and kindness activity gating/completion. The enlarged-text header overflow found at 390px was fixed and the four affected states passed rechecks. Final checks found no horizontal overflow, clipped functional text, functional text below 12px, runtime errors, or failed local assets.
- Root text scaling was used instead of native browser zoom. Physical devices and native-speaker editorial review were not covered. Browser checks blocked external requests and made no live account writes.

Evidence: [emoji layouts and interactions](faith-quest-emoji-evidence.json).

## What to try

The dashboard's **Playable preview** invitation now gives the description and launch button their own rows on constrained layouts. The heading sits beside the icon; enlarged text can stack them. Its responsive rules use the existing dashboard container to preserve the other cards' padding. [View the corrected mobile card](faith-quest-dashboard-card.png).

Card validation: 23 existing dashboard tests and the final production build passed. Windows Edge exercised 48 language/theme/width/text-size combinations (English, Amharic, Oromo; light/dark; 320/390/550/1280px; normal/200% root text), followed by 32 targeted rechecks of padding, enlarged text, and wide layouts. Click and keyboard activation retained the game destination. The final checks found no clipping, overlap, or page overflow. At the narrowest enlarged-text width, long translated words can wrap; native browser zoom and physical devices were not tested.

- **Practice:** explore authored sample partner responses. The partner is explicitly identified as a practice partner throughout play.
- **Pass & play:** enter two names and take turns on one device. A handoff screen hides the first person's choices until the reveal.
- **Know My Heart:** answer privately, guess the other person's preference, reveal both cards, and try a caring action.
- **Choose with Grace:** select a response to a relationship situation. Tap **Try saying** on a revealed card for suggested words, then try the shared activity and optional reflection.
- **Secret Kindness:** choose an act, try it before handing over the device, and reveal the surprises after both turns. Practice uses an explicit activity-exploration acknowledgement.

There are 30 original missions across Love, Patience, Kindness, Peace, Faithfulness, and Joy. Each chapter has five missions and all three modes. Completing a mission unlocks the next; completed missions can be replayed without duplicate rewards. Browse future chapters, collect completed mission cards, and reset only the current preview mode after confirmation. There is no daily lock, lost streak, relationship score, or spiritual ranking.

## Preview boundaries

This version works locally on one device. It does not send invitations, contact a partner, synchronize progress between accounts/devices, or write to the backend. Practice and pass-and-play completions are stored separately, scoped to the current account/partner when entered through the app. Only mission IDs and completion timestamps persist; answer and guess selections live in component memory and are discarded when the mission closes. A reset affects the selected mode only. Storage failures preserve play for the current visit and show a message explaining the limitation.

The separate preview URL works without an account. English, Amharic, and Afaan Oromo use the shared language store, including changes during a mission. Scripture references are reading prompts; no Bible quotations are synthesized. Translations have not received native-speaker editorial review.

## Initial preview screenshots

[Light journey](faith-quest-preview-light.png) · [Dark journey](faith-quest-preview-dark.png) · [Heart reveal](faith-quest-preview-reveal.png) · [Grace response](faith-quest-preview-grace.png)

## Initial preview verification (before emoji refresh)

- All **370 tests in 88 files passed**, including gameplay, privacy during handoff, unlock/replay rules, reload persistence, separate account/mode storage, confirmed reset/exit, storage rejection, mid-mission language changes, and complete content translations.
- The production build passed. Its existing large-chunk advisory remains. Build output was written to a temporary directory, leaving tracked deployment output unchanged.
- Windows Edge 153 checked **33 layout states and 11 play-flow checks**, plus **three final Grace reveal layouts and three localized follow-up checks**. Coverage includes 320/390/1280px, both themes, and Amharic/Oromo at 320px with 200% root text. No functional horizontal overflow, clipped visible text, visible functional text below 12px, application exceptions, or failed local assets were found. A narrow-layout sizing issue and mobile map alignment were corrected during verification.
- Browser checks exercised the real preview entry and components. External manifest attempts were blocked; no live account writes or messages were made. Enlarged text used CSS root scaling, not native browser zoom. Physical devices were not tested.

Evidence: [preview layouts and interactions](faith-quest-preview-evidence.json), [final Grace checks](faith-quest-grace-evidence.json).
