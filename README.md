# Doodh Wala Admin Web (`doodh-khata-web`)

React + Vite + TypeScript console for **Doodh Wala** — farms, customers, deliveries, billing, payments, and audit logs.
Repository name remains `doodh-khata-web` for deployment continuity.

## Stack

- React 19, Vite 8, TypeScript
- Material UI (teal/slate dairy-admin theme)
- React Router, TanStack Query & Table
- Axios API client with bearer auth + refresh
- React Hook Form + Zod
- Vitest + Testing Library
- Recharts, date-fns

## Getting started

```bash
cp .env.example .env
NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm install
NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm run dev
```

App runs at `http://localhost:5173` and expects the API at `VITE_API_BASE_URL` (default `http://localhost:3000/api/v1`).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Oxlint |
| `npm test` | Vitest (jsdom) |
| `npm run test:coverage` | Vitest with coverage |

## Environment

Copy `.env.example`. Only public Vite vars — **never put secrets in frontend env**.

```
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ENABLE_API_LOGS=true
```

Production builds (`npm run build` / Vercel) use `.env.production`:

```
VITE_APP_ENV=production
VITE_API_BASE_URL=https://dudh-wala-backend.onrender.com/api/v1
VITE_ENABLE_API_LOGS=false
```

After the Vercel URL is live, add it to Render `CORS_ORIGINS` (comma-separated with any other web origins).

## Auth & tokens

- Access and refresh tokens live **in memory** (`tokenStore`).
- Refresh token is optionally mirrored to **sessionStorage** so a tab reload can silently re-auth. sessionStorage is still XSS-readable; prefer httpOnly cookies from the API for production long-lived sessions.
- **Do not** store long-lived tokens in plain `localStorage` without documenting XSS risk.
- Axios attaches `Authorization: Bearer <access>`, retries once on 401 after `POST /auth/refresh`, then routes to `/session-expired`. 403 routes to `/unauthorized`.

## API contract

Success:

```json
{ "data": {}, "meta": { "requestId": "...", "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

Error:

```json
{
  "errors": {
    "statusCode": 400,
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": {},
    "requestId": "...",
    "timestamp": "..."
  }
}
```

### Endpoints used by this admin UI

| Area | Methods / paths |
|------|-----------------|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/profile`, `POST /auth/logout` |
| Dashboard | `GET /dashboard/admin/summary`, `/growth`, `/revenue`, `/recent-registrations`, `/failed-syncs` |
| Suppliers | `GET /suppliers`, `GET /suppliers/:id`, `PATCH /suppliers/:id/activate`, `PATCH /suppliers/:id/block` |
| Customers | `GET /customers`, `GET /customers/:id` |
| Deliveries | `GET /deliveries/report` |
| Billing | `GET /bills`, `GET /bills/:id`, `GET /bills/outstanding` |
| Payments | `GET /payments` |
| Audit | `GET /audit-logs` |

All paths are relative to `VITE_API_BASE_URL` (includes `/api/v1`).

## Pages

- `/login` — platform owner login (mobile + password)
- `/` — dashboard KPIs + growth/revenue charts
- `/suppliers`, `/suppliers/:id` — list/filter, activate/block, customers & billing summary
- `/customers`, `/customers/:id` — list/filter, delivery/bill/payment history
- `/deliveries` — report filters (URL query params), pagination, CSV export
- `/billing`, `/billing/:id` — bills + detail
- `/payments` — payment list
- `/reports/outstanding` — outstanding balances
- `/audit` — read-only audit table
- `/settings` — placeholder
- `/session-expired`, `/unauthorized`

Nav is role-gated to `PLATFORM_OWNER`. Seed login: mobile `9999999999` / `Admin@12345`.

## Deployment (Vercel)

`vercel.json` rewrites all routes to `index.html` for SPA routing. Set Vite env vars in the Vercel project settings.

## Project structure

```
src/
  app/           # App shell, router, providers, theme
  components/    # shared UI (layout, forms, tables, feedback)
  features/      # auth, dashboard, suppliers, customers, …
  lib/           # api, auth, query, validation
  config/ hooks/ types/ utils/
```

## Limitations

- UI is mock-friendly against documented REST shapes; backend may still be evolving.
- Settings page is a placeholder.
- Charts depend on growth/revenue endpoints returning arrays; empty arrays render blank charts.
- CSV export uses the currently loaded page of deliveries (not a full server export).
- No offline support; network failures surface as error states with retry.
