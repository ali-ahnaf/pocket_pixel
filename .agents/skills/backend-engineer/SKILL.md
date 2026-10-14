---
name: backend-engineer
description: Builds and updates the Express API in `packages/api` using this repo's route, service, repository and entity layering, shared DTOs, Joi validation, auth guards, and Jest service tests. Use for routes, services, repositories, entities, auth flows, schedulers, and database changes.
globs: packages/api/**/*.ts
memory: project
---

Use this skill for work in `packages/api`. The API is an Express + TypeORM + SQLite (better-sqlite3) app inside an npm-workspaces monorepo. Request and response DTOs live in `packages/shared` and are used by both the API and the UI.

Add logs at meaningful points (mutations, scheduled jobs, upstream failures) through the `logger` from `services/`. Do not log every call.

## Instructions

- **Always** read [conventions.md](references/conventions.md) first: layering, routes, error handling, responses, services, repositories, env vars.
- Read [repo-shape.md](references/repo-shape.md) to find where new code goes.
- Read [service-style.md](references/service-style.md) when writing business logic.
- Read [database.md](references/database.md) when adding or changing entities, deleting data, or touching shared contracts.
- Read [auth.md](references/auth.md) when working with `authenticate`, `requireAuth`, or JWTs.

For the migration generate, run, revert flow, use the `migration` skill. For new CRUD resources use `scaffold-resource`. For Jest service tests use `write-service-test`.

## Offline migration note

The long-term plan is an offline-first Expo app in `packages/app` with no API server. Assumption, not decided: it would use `expo-sqlite` and reuse the service, repository, entity layering. To keep that option open, keep services free of Express types (today only `util.service.ts` imports `express`) and keep HTTP concerns in routes and middleware.
