# TwoBeOne Navigation Language

Version 1 - 13 September 2026

Use a single shared return control throughout the active web app: [BackButton](../src/app/components/BackButton.tsx), styled by [navigation.css](../src/styles/navigation.css). This extends the [TwoBeOne Typography Language](twobeone-typography-language.md).

## Back buttons

- **Shape and target:** a circular button with a 44px minimum target at the default root size. Dimensions use `rem` and grow with text scaling.
- **Icon:** one 20px `ArrowLeft`, stroke width 2, in brand rose (`--primary-600` in light mode, `--primary-300` in dark mode). Do not substitute chevrons or a typed arrow for page returns.
- **Surface:** theme card background, subtle border, no shadow. Hover/pressed states use a soft rose tint; keyboard focus has a visible rose outline. The same tokens support dark mode.
- **Placement:** the leading control in a page's heading row. Keep it outside the title and allow the title to wrap. Use consistent spacing in that row rather than changing the button's size.
- **Labels:** header returns are icon-only and always have a localized, meaningful accessible name. Contextual and footer returns use `showLabel`; this keeps the same height, icon, colors, and rounded shape while allowing translated labels to wrap.
- **Behavior:** preserve each screen's existing parent/destination callback. The shared component does not infer history navigation and never submits a form. Preserve disabled states while work is pending.

```tsx
<BackButton label={t.common.back} onClick={onBack} />
<BackButton label={copy.returnToApp} onClick={onComplete} showLabel />
```

`label` is required and supplies the accessible name and tooltip. The component does not require a language provider; callers supply the correct translated string. Visible labels use the shared 14px / 600 action role. Use `className` for placement, flex growth, or margins only; do not redefine the border, color, shadow, icon, or target size in a screen. Footer rows must wrap when their actions no longer fit; do not compress a translated label into the icon's space.

## Distinct navigation actions

Previous/next calendar periods, chapters, quiz questions, pagination, image galleries, and sidebar expansion retain their directional controls. They do not leave the current page. Close and cancel actions retain their own meaning. Do not relabel them as Back merely because they dismiss something. A fullscreen reading view's existing return to its list does use `BackButton`.

## Verification

Check icon-only and labelled controls at narrow widths, with translated/long labels, at enlarged text sizes, and in both themes. Confirm keyboard focus, accessible names, disabled behavior, and the original destination. Verify the page title can wrap beside the control and that footer actions remain reachable.

## Implementation record

On 13 September 2026, 41 return placements across 27 active source files were migrated to this component, including public/legal page headers, account flows, quiz results, reading views, community details, chat, and admin returns. Loading and error states in lesson/readiness views also expose a return action.

The production build and all 276 tests in 72 test files passed. Shared component tests cover keyboard activation without form submission, disabled behavior, and translated visible labels. The build retains the existing Vite large-chunk advisory.

Windows Edge browser checks used local mock data and covered:

- 36 shared-control combinations: 320/390/1280px, English/Amharic/Oromo, light/dark themes, normal/200% root text size. Checked target and icon sizes, focus outline, colors, text wrapping, and overflow.
- 56 quiz/result/comparison/lesson/readiness combinations at 320/390px, English/Amharic, and normal/200% text, plus loading/error return callbacks.
- 12 chat/community/reading combinations at 320/390px and normal/200% text, including actual return callbacks.
- 16 public/account/onboarding combinations, including narrow layouts, 200% text, and Amharic/Oromo onboarding.

Issues found in neighboring titles and footer actions were corrected with wrapping and automatic heights. These checks are representative browser coverage; physical iOS/Android behavior and every application state were not tested.
