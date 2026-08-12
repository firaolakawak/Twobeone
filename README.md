# TwoBeOne

TwoBeOne is a Vite + React application. The admin console in `src/app/components/admin` uses an accessible, responsive 12-column dashboard and a 24px base layout rhythm.

## Run locally

```bash
pnpm install
pnpm dev
```

Run the dashboard tests and production build with:

```bash
pnpm test
pnpm build
```

## Admin dashboard integration

1. Render `AdminPanel` with the signed-in administrator's Supabase access token.
2. Pass route changes through its existing navigation callbacks. The shared `Sidebar` maintains the active state with `aria-current`.
3. Import `admin-tokens.css` before local overrides if a screen is rendered outside `AdminPanel`. `dashboard.css` already imports it for the complete admin shell.
4. Supply each `KPICard` with `label`, `value`, `trend`, `sparklineData`, and `icon`.
5. Supply `Timeline` with `events[]` containing `id`, `type`, `title`, `time`, and `details`.
6. Supply `MiniKanban` with the three columns and an async `onPersist` callback. The component updates optimistically and restores the previous order if persistence fails.

The keyboard Kanban workflow is: focus a card, press Space to pick it up, use arrow keys to choose a position or column, and press Space again to drop. Escape cancels the operation.

## Kanban API

The Supabase Edge Function routes are rooted at:

`/functions/v1/make-server-6d579fee`

- `GET /admin/kanban` returns `{ columns, updatedAt?, updatedBy? }`.
- `PUT /admin/kanban` accepts `{ columns }` and atomically persists the full ordered board.
- `GET /admin/stats` supplies KPI totals.
- `GET /admin/recent-activity` supplies timeline events.

All endpoints require `Authorization: Bearer <access-token>`. Kanban columns use IDs `needed`, `in-progress`, and `completed`; every card contains `id`, `title`, `category`, `dueDate` (`YYYY-MM-DD`), and `priority` (`Low`, `Medium`, or `High`).

## Dashboard files

```text
src/app/
├── components/
│   ├── AdminPanel.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       └── dashboard/
│           ├── ActionBar.tsx
│           ├── KPICard.tsx
│           ├── MiniKanban.tsx
│           ├── Sidebar.tsx
│           ├── Sparkline.tsx
│           ├── Timeline.tsx
│           └── __tests__/
│               ├── KPICard.test.tsx
│               └── MiniKanban.test.tsx
└── styles/
    ├── admin-tokens.css
    └── dashboard.css
```
