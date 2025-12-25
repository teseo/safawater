# South Africa Project Monorepo

## Requirements
- Node.js 18+
- pnpm 9+

## Install
```bash
pnpm install
```

## Dev
```bash
pnpm dev
```

## Verify
- API health: http://localhost:3000/health
- API meta: http://localhost:3000/meta
- Web: http://localhost:5173

## Notes
- Shared package is available as `@shared`.
- `apps/web` imports from `@shared` via Vite alias + TS paths.
- API uses Fastify with config validation, CORS, and structured routes.
