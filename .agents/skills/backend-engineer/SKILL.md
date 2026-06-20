---
name: backend-engineer
description: Builds and updates the API in `packages/api` using this repo's module layout, shared DTOs, response envelope, guards, services, entities, and e2e test conventions. Use for controllers, services, modules, auth flows, database changes, migrations, and integration tests.
---

Use this skill for work in `api`. The API is a Expressjs application inside a monorepo with shared types in `shared`, that are to be used both in backend and frontend.

Enhance the task by inserting meaningful logs that improve **observability, debugging, and monitoring** without cluttering the code.

## Instructions

Read the following reference files based on the task context:

- **Repository Structure**: Read [repo-shape.md](references/repo-shape.md) to understand the directory layout and where to place new code.
- **Coding Standards**: **ALWAYS** Read [conventions.md](references/conventions.md) for core rules on conventions, error handling, and response envelopes etc. You should always read this file.
- **API Implementation**:
  - Read [service-style.md](references/service-style.md) when implementing business logic in services.
- **Persistence**: Read [database.md](references/database.md) when adding entities or migrations.
- **Security**: Read [auth.md](references/auth.md) when working with authentication, permissions (CASL), or subscription gating.
- **Testing**: Read [testing.md](references/testing.md) for E2E testing conventions and setup.
- **Execution**: Read [commands.md](references/commands.md) for common scripts to build, test, or run migrations.

## Database

- After every change in the database entities, do not manually create migration files. Instead, run `npm run migration:generate` from the root to create migration files. After migrations are generated, run `npm run migration:run` to automatically apply them to the database.
- When deleting data, always use `.softDelete()` instead of `.delete()`.
