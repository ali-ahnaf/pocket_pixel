---
name: scaffold-resource
description: Scaffold a complete new CRUD resource across shared contracts, API entity/repository/service/routes, migration, UI api client, and Jest test. Use when adding a new domain resource (e.g. budgets, goals) to the expense tracker.
---

# Scaffold a new resource

Adding one resource touches ~11 files across three packages. Follow this order exactly.
Read `.agents/skills/backend-engineer/references/conventions.md` first for the exact route/service/repository shapes.

## 1. Shared contract

1. Create `packages/shared/src/contracts/<feature>.ts` with `Create<Feature>Input`, `Update<Feature>Input`, `<Feature>Dto`.
2. Re-export from `packages/shared/src/contracts/index.ts`.
3. **Run `npm run build:shared` from the root.** Skipping this leaves API/UI on stale types with no error.

## 2. Entity + migration

4. Create `packages/api/src/entities/<Feature>.entity.ts` — class named without `Entity` suffix, `@Entity('<plural_table>')`, extends `BaseEntity`, `userId` column for ownership.
5. Register the class in the `entities: [...]` array in `packages/api/src/data-source.ts` (not auto-discovered).
6. Generate and apply the migration — see the `migration` skill for the flow and rules.

## 3. Repository

7. Create `packages/api/src/repositories/<feature>.repository.ts` — lazy `private get repo()`, injectable `DataSource`, methods `findManyForUser` / `findOneForUser` / `createEntity` / `save`, plus `softDelete` for deletion (preferred for user data).
8. Register in `packages/api/src/repositories/index.ts` — **two edits**: `export const <feature>Repository = new <Feature>Repository();` and add the class to the `export { ... }` list.

## 4. Service

9. Create `packages/api/src/services/<feature>.service.ts` — constructor-injected repository defaulting to the singleton, `AppError(message, statusCode)` for expected failures (404 when `findOneForUser` misses), `logger.info` on mutations.
10. Register in `packages/api/src/services/index.ts` — same two edits as the repository barrel.

## 5. Routes

11. Create `packages/api/src/routes/<feature>/` with one file per action: `get-<feature>s.route.ts`, `post-<feature>.route.ts`, `put-<feature>.route.ts`, `delete-<feature>.route.ts`. Each: `Router({ mergeParams: true })`, Joi schema typed to the shared DTO, inline `.validate(req.body)` with `replyError` on error, `asyncHandler` wrap, reply via `utilService`. No try/catch.
12. Create aggregator `packages/api/src/routes/<feature>.routes.ts` mounting the sub-routes.
13. Mount in `packages/api/src/index.ts`: `app.use('/api/users/:userId/<feature>s', requireAuth, <feature>Router);`

## 6. UI client

14. Add methods to the matching client in `packages/ui/src/lib/api/` — either an existing `<Feature>Api.ts` if one fits, or a new `<Feature>Api.ts` (PascalCase, e.g. `BudgetApi.ts`) following the existing clients (`AuthApi.ts`, `ProfileApi.ts`, `WizardApi.ts`). Re-export it from `packages/ui/src/lib/api/index.ts`. **Type params with the shared DTOs** (`Create<Feature>Input` from `@expense-tracker/shared`), not inline object literals.

## 7. Test

15. Create `packages/api/src/tests/<feature>.service.test.ts` following the `/write-service-test` skill (or copy `tags.service.test.ts`'s structure).
16. Run `npm run test:api -- <feature>.service` and confirm green.

## Finish

- Run `npx prettier --write` on every file touched.
- Smoke-check: `npm run dev:api` boots and the new endpoints respond (401 without token proves mounting + guard).
