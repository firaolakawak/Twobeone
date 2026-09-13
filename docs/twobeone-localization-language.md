# TwoBeOne Localization Language

TwoBeOne supports English (`en`), Amharic (`am`), and Afaan Oromo (`om`). Every application interface must follow the selected language, including loading states, open dialogs, labels, placeholders, validation, navigation, tooltips, accessible names, and empty states.

## Shared preference

`src/app/utils/languageStore.ts` owns the current UI language. `useCurrentLanguage()` works on public pages, loading boundaries, and authenticated screens. `LanguageProvider` uses the same store; `useLanguage()` provides the existing typed `t` catalog.

Use `setCurrentLanguage()` or the provider's `setLanguage()`. The store synchronizes mounted consumers, browser storage, other tabs, and document language metadata. Account settings and the header selector also save the preference to the profile. A profile refresh must not immediately restore the previous language after a local selection.

Hydrate an account's saved preference once with `useProfileLanguage`. Use `saveLanguagePreference` for both header and settings writes; it serializes requests for the same account and releases stalled requests after 15 seconds. A failed account save keeps the local selection and shows a translated retry message. Client cancellation cannot guarantee that an already-received server request will not commit later.

Do not introduce another component-specific language state or read local storage directly for rendered copy. Admin content-language filters choose which records to edit; they are separate from the interface language.

## Interface copy

Reuse an existing typed `t` key when it expresses the same meaning. Otherwise add a scoped catalog in `src/app/locales/` and use `useUiCopy(messages)`. English source text is the key; every value contains an Amharic and an Oromo translation:

```tsx
const messages = {
  'Hello {name}': ['ሰላም {name}', 'Akkam {name}'],
} satisfies UiMessages;

const tr = useUiCopy(messages);
return <p>{tr('Hello {name}', { name: profile.name })}</p>;
```

`common.ts` supplies shared actions. Keep catalogs at module scope so translator identity remains stable. Use complete sentences and named placeholders instead of joining translated fragments around a name, number, or date. Store source keys and values for persistent UI states so a visible error or result label can update when the language changes.

Use `UI_LOCALES[language]` with `createUiDateTimeFormat`, `formatUiDate`, `formatUiTime`, or `formatUiDateTime` from `utils/uiDateTime.ts` for dates and times. Some browsers lack Oromo `Intl` data and silently render English. These helpers use native formatting when supported and provide Oromo Gregorian month, weekday, and day-period labels otherwise, preserving the requested timezone and formatting options. Do not patch global `Intl` or use a fixed locale for application dates.

Translate the displayed label while preserving the stable value used in forms, filters, API requests, quiz scoring, and stored records. Native browser/operating-system dialogs and date-picker chrome follow their own language settings.

## Content boundaries

Names, email addresses, addresses, member-written messages, journal entries, uploaded content, identifiers, and code examples retain their source values. Language names may use their native names so readers can recognize the language picker.

Authored lessons, devotional content, and Scripture must use an available language edition. Request the selected content language and disregard stale responses from a previous selection. When an edition is unavailable, explain that in the selected interface language. Do not substitute Amharic for Oromo silently or invent a Scripture translation. Saved authored content and generated analysis are not automatically rewritten when the interface language changes.

Translate application-owned preview/demo descriptions and static learning metadata explicitly. Do not use a DOM observer, general text replacement, or a browser translation service to modify arbitrary content.

For notification history and feedback, use `getNotificationCopy` to translate recognized, type-qualified system templates. Preserve names and authored snippets. Unknown broadcasts retain their original content; changing UI language does not rewrite stored notification records.

## Branded loading

Use `BrandLoader` for screen and section waits. It displays the supplied TwoBeOne logo with a double heartbeat and a translated status label. Use `LoadingMark` inside a pending button that already has a visible label. The inline mark is decorative; avoid duplicate live announcements. The shared animation stops under `prefers-reduced-motion`.

Loading ends when the operation completes. Preserve retry, cancellation, and navigation behavior; do not add a fixed delay just to display the animation.

## Verification

- Catalog tests check both translated values and placeholder parity.
- Test language changes on the same mounted page, including an open dialog and unsaved input. Preserve user data and stored option codes.
- Check asynchronous language-dependent content for stale responses.
- Check translated text at narrow widths and increased text size. Use the typography roles and shared back controls from the other TwoBeOne language documents.
- Report tested interface coverage separately from authored content availability and native-speaker editorial review.
