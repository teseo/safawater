# SA Water Dashboard

A TypeScript monorepo that ingests South Africa Department of Water and Sanitation (DWS) dam data, persists it to SQLite, and serves a modern React dashboard for exploration. The API is Fastify-based with a lightweight scraper pipeline (no headless browsers), and the UI is built with Vite, Tailwind, shadcn-style components, TanStack Query, and Recharts.

## Features

- Fastify API with structured routes, config validation, logging, and CORS
- SQLite persistence + migrations + DAO layer
- DWS scrapers for Gauteng weekly, Vaal weekly (IVRS), and Vaal realtime feeds
- TTL-aware refresh endpoint with fetch run tracking
- React dashboard with KPI cards, chart, and data table
- Dark mode + responsive layout + polished loading/empty/error states

## Monorepo layout

```
apps/api        Fastify API + scrapers + SQLite
apps/web        React dashboard (Vite + TS)
packages/shared Shared types/utilities
```

## Requirements

- Node.js 20 (recommended) or 18+
- pnpm 9+

## Setup

```bash
pnpm install
pnpm dev
```

- API: http://localhost:3000
- Web: http://localhost:5173

## Configuration

Environment variables (API):

- `PORT` (default `3000`)
- `NODE_ENV` (default `development`)
- `CORS_ORIGIN` (default `http://localhost:5173`)
- `DB_PATH` (default `apps/api/data/app.db`)
- `DB_MIGRATIONS_PATH` (default `apps/api/migrations`)
- `CACHE_TTL_SECONDS` (default `21600`)

## Migrations

```bash
pnpm -C apps/api migrate
```

On API boot, pending migrations are applied automatically.

## Scraping & refresh

Trigger a manual refresh to pull DWS data and persist to SQLite:

```bash
curl -X POST http://localhost:3000/refresh \
  -H 'content-type: application/json' \
  -d '{"force":true}'
```

The API tracks each run in `fetch_runs` and respects `CACHE_TTL_SECONDS` unless `force` is true.

## API endpoints

- `GET /health`
- `GET /meta`
- `GET /sources`
- `GET /dams`
- `GET /dams/:damName/latest`
- `GET /dams/:damName/history?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=500`
- `POST /refresh` (trigger scrapers)
- `POST /__dev/seed` (dev-only sample insert)

## Web dashboard

The dashboard lets you:

- select a dam (searchable)
- set date ranges for history
- view latest KPI cards (level %, deltas)
- view a line chart of historical levels
- explore a table of observations
- trigger refresh from DWS with toasts and status feedback

## Development tips

- API uses `DB_PATH` (default: `apps/api/data/app.db`).
- Migrations live in `apps/api/migrations`.
- Frontend proxies API calls via `/api` in Vite.

## Scripts

```bash
pnpm dev        # run api + web
pnpm build      # build all packages
pnpm typecheck  # typecheck all packages
```

## Contributing

Issues and PRs are welcome. Keep changes focused, add tests for new parsers, and prefer small, well-named modules.

## License

MIT
