# TwoBeOne Glass Language

Version 1 — 14 September 2026

The glass material system translates the lavender, rose, luminous edges, and frosted panels of the supplied reference into the existing TwoBeOne interface. Its initial application covers the authenticated web shell, header controls, bottom navigation, and couple dashboard. Other public, authentication, administration, and feature interiors retain their existing surfaces until intentionally migrated.

Review the implemented [light dashboard](glass-dashboard-light.png) and [dark dashboard](glass-dashboard-dark.png), captured with sample data.

## Materials and colors

The executable source is [glass.css](../src/styles/glass.css), imported by the active [stylesheet entry](../src/styles/index.css). All material colors have light and dark definitions. Use the shared tokens instead of adding screen-specific white overlays or hardcoded dark text.

| Purpose | Class / token |
| --- | --- |
| Lavender and rose ambient canvas | `tbo-glass-app` |
| Main frosted panel | `tbo-glass` |
| Stronger floating navigation or menu | `tbo-glass-raised` |
| Inner reading block, progress row, or small surface | `tbo-glass-inset` |
| Secondary action | `Button variant="glass"` / `tbo-glass-action` |
| Primary violet-to-rose action | `Button variant="glass-primary"` / `tbo-glass-primary` |
| Decorative circular icon | `tbo-glass-orb` |
| Interactive panel with focus and hover feedback | `tbo-glass-interactive` |
| Main / supporting ink | `--glass-foreground` / `--glass-muted` |
| Violet / rose emphasis | `--glass-accent` / `--glass-rose` |
| Border / radius / blur | `--glass-border` / `--glass-radius` / `--glass-blur` |
| Standard / raised elevation | `--glass-shadow` / `--glass-shadow-raised` |

Use glass classes explicitly on selected surfaces. Do not apply a translucent background to every `Card`, button, or dialog automatically. Reading and form content need a sufficiently opaque background; use the inset or raised material when needed. Preserve semantic success, error, and warning meaning.

```tsx
<Card className="tbo-glass">
  <CardHeader>
    <CardTitle className="tbo-card-title">{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
  <CardContent>
    <Button variant="glass-primary" onClick={onContinue}>{actionLabel}</Button>
  </CardContent>
</Card>
```

## Composition and accessibility

- Keep the [Typography Language](twobeone-typography-language.md), including approved hero names, counters, statistic numbers, and wordmark. Glass changes the material, not the type scale.
- Keep the shared [BackButton](twobeone-navigation-language.md) on its specified solid card surface, with rose arrow and no shadow. Never add glass action classes to page returns.
- Keep all existing [language behavior](twobeone-localization-language.md). The initial glass pass adds no interface copy or Scripture translations.
- Blur only bounded exterior panels. The application canvas has no backdrop filter, and inset materials do not add another blur layer.
- Materials have solid defaults when backdrop filters are unsupported. Reduced transparency selects solid panels; forced colors use system backgrounds, borders, text, and progress fills. Reduced motion removes the new hover/menu effects.
- Use opaque foreground colors rather than reducing text or whole-component opacity. Decorative icon gradients do not replace functional labels.
- Let translated labels wrap. Container queries expressed in `rem` reflow constrained hero, calendar, learning, and navigation content when text is enlarged. Keep enough page-bottom space for the expanded fixed navigation and device safe area.

## Initial implementation

The dashboard retains its existing sections, destinations, couple photos, stage calculations, counters, and data sources. The first pass replaces mixed flat color treatments with shared glass panels, tinted activity cards, inset reading/progress surfaces, and theme-aware action colors. The header and navigation use the stronger raised material.

Component-specific arrangement lives in `src/app/styles/dashboard-glass.css`, `dashboard-stats.css`, `dashboard-support.css`, `bottom-navigation.css`, and `header-controls.css`. Keep ordinary layout rules in those files and shared material rules in `src/styles/glass.css`.

See [validation notes](glass-validation-2026-09-14.md) for the checks actually performed and their limits.
