# API Service

## Environment

- `PORT` (default: 3000)
- `NODE_ENV` (default: development)
- `CORS_ORIGIN` (default: http://localhost:5173)
- `DB_PATH` (default: data/app.db)
- `DB_MIGRATIONS_PATH` (default: migrations)
- `CACHE_TTL_SECONDS` (default: 21600)

## Run

```bash
pnpm dev
```

## Migrations

```bash
pnpm migrate
```

## Endpoints

- `GET /health`
- `GET /meta`
- `GET /sources`
- `GET /dams`
- `GET /dams/:damName/latest`
- `GET /dams/:damName/history?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=500`
- `POST /refresh`
- `POST /backfill`
- `POST /__dev/seed` (dev only)

## Examples

```bash
curl http://localhost:3000/health
curl http://localhost:3000/meta
curl http://localhost:3000/sources
curl -X POST http://localhost:3000/refresh -H 'content-type: application/json' -d '{"force":true}'
curl -X POST http://localhost:3000/backfill -H 'content-type: application/json' -d '{"preset":"year"}'
curl -X POST http://localhost:3000/__dev/seed
curl http://localhost:3000/dams/Vaal%20Dam/latest
curl "http://localhost:3000/dams/Vaal%20Dam/history?limit=10"
```
