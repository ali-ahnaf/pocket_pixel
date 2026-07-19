# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) or any other agentic AI's such as Gemini/Codex/Copilot/etc when working with code in this repository.

## Instructions to follow

### API

- do not add any try catch in routes. Any errors thrown should be handled by global error handler middleware.
- whenever a new migration file is created, run `npm run migration:run` to run the migration from the root.

### Github secrets

Required deploy secrets and their meanings live in `documentation/deployment.md`. Adding a new API env var means updating the `API_ENV` secret too, or prod silently runs without it.

## Commands

All commands run from the repo root (npm workspaces).

```bash
# Dev
npm run dev:api          # API with ts-node-dev (respawn), port 4000
npm run dev:ui           # Next.js dev server

# Build
npm run build:shared     # rebuild shared package — REQUIRED after editing packages/shared/src
npm run build            # build all workspaces
npm run build:prod       # build shared -> ui -> api in dependency order

# Run (production-style)
npm run start            # node dist/index.js (also serves the UI static export)

# Migrations (TypeORM)
npm run migration:generate   # generate from entity changes
npm run migration:run        # apply pending migrations
npm run migration:revert

# Tests
npm run test:api                              # Jest (API unit tests)
npm run test:api -- auth.service              # run a single API test by name/path
npm run test:api -- --runInBand               # how CI runs them
npm run test:ui:e2e                           # Playwright e2e
npm run test:ui:e2e-ui                        # Playwright in UI mode
```

There is no lint script; formatting is enforced with Prettier (`npx prettier --write <file>` — `singleQuote`, `trailingComma: all`, `printWidth: 200`).

## Architecture

npm-workspaces monorepo with three packages:

- **`packages/api`** — Express + TypeORM + SQLite (better-sqlite3). REST API, also serves the UI static export in production.
- **`packages/ui`** — Next.js 14 (App Router), React 18, Tailwind. Talks to the API via `axios` clients in `src/lib/api`.
- **`packages/shared`** (`@expense-tracker/shared`) — request/response DTOs in `src/contracts/`, imported by both API and UI. Never redefine these DTOs locally; rebuild with `npm run build:shared` after changes.

### API request flow

Layered: **route → service → repository → entity**.

- **Routes** are thin. Each resource has an aggregator `routes/<feature>.routes.ts` that mounts one sub-route per action at `routes/<feature>/<verb>-<feature>.route.ts`. Sub-routes use `Router({ mergeParams: true })` because they are nested under `/api/users/:userId/...`. A route: validates the body with a Joi schema (typed to the shared DTO), calls a service, and replies via `utilService`. No business logic, no try/catch — wrap the handler in `asyncHandler` so thrown errors reach the global handler.
- **Services** (`services/*.service.ts`) hold business logic and throw `AppError(message, statusCode)` for expected failures. Repositories are constructor-injected and default to shared singletons, so services are unit-testable with mocks. All services/repositories are instantiated once and exported from `services/index.ts` and `repositories/index.ts`.
- **Repositories** (`repositories/*.repository.ts`) wrap TypeORM. They resolve `dataSource.getRepository(...)` lazily per call (so they can be built before the DataSource initializes and accept an injected DataSource in tests).

### Responses & errors

- Reply only through `utilService`: `replyOk` / `replyCreated` / `replyNoContent` / `replyError`. Always `return` the call. Success payloads are sent **raw** (not wrapped in an envelope); errors are `{ message }`.
- Throw `AppError` from the service layer; the global `errorHandler` (mounted last in `index.ts`) maps it to its status code. Anything non-`AppError` becomes a 500.

### Auth

- `authenticate` runs globally and is best-effort: it decodes a `Bearer` JWT into `req.user` and never rejects.
- `requireAuth` is the per-route guard that returns 401 when `req.user` is unset. It is applied to every `/api/users/...` mount. Tokens are JWT, 30-day expiry; passwords are bcrypt-hashed.

### Persistence

- Entities live in `entities/*.entity.ts` and extend `BaseEntity` (`createdAt`/`updatedAt`/`deletedAt`). Prefer **soft delete** (`softDelete`); follow the existing pattern of the repository you're editing (transactions/debts/recurring soft-delete, tags currently hard-remove). Register new entities in `data-source.ts`.
- `data-source.ts` configures TypeORM (SQLite at `packages/api/pocket_pixel.sqlite`); migrations are auto-discovered from `migrations/`. `env.ts` loads `.env` relative to the module (dev: package root; prod: `dist/`).
- Per the backend-engineer skill: prefer `npm run migration:generate` over hand-writing migrations after entity changes. The seed migration `Z-seed-data.ts` must always sort last in `migrations/`.

### Other

- **Recurring transactions**: `scheduler/recurring-scheduler.ts` uses node-cron; `restoreAllRecurringJobs()` re-registers jobs on boot.
- **MCP**: `.mcp.json` exposes a `pocket-pixel-sqlite` server pointing at the API's SQLite DB for read/write inspection.
- **Deploy**: `.github/workflows/ci-cd.yml` builds shared → runs API Jest + UI Playwright → stages a bundle → deploys to a Hostinger VPS via SSH/PM2 (`ecosystem.config.js`, port 4000) on push to `main`.
