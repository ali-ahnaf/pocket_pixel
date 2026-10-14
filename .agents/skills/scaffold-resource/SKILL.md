---
name: scaffold-resource
description: Scaffold a complete new CRUD resource across shared contracts, API entity/repository/service/routes, migration, UI api client method, and Jest service test. Use when adding a new domain resource (e.g. budgets, goals) to the expense tracker in packages/api, packages/shared and packages/ui.
---

# Scaffold a new resource

Adding one resource touches about 15 files across three packages. Follow this order. Work in small steps and verify each one (see Verify at the end).

Reference implementations to read before writing anything: `tags` (simplest) and `debts` (soft delete, DTO mapping in the service). Paths below use `<feature>` for the kebab-case plural (e.g. `budgets`) and `<Feature>` for the PascalCase singular (e.g. `Budget`). Naming is not uniform in this repo, so copy it exactly as shown.

For API layering and error-handling details, see `.agents/skills/backend-engineer/references/conventions.md`.

Rules that apply throughout (from `CLAUDE.md` and `.agents/rules/`):

- No try/catch in routes. Errors go to the global `errorHandler`.
- Never save the request payload as sent. Assign fields one by one in the service.
- Do not add private `toDto()` methods in services. Inline the mapping in `.map()` or before the `return`.
- Prefer soft delete scoped to `userId`. Avoid `any`.
- Run `npx prettier --write <file>` after each file you change.

## 1. Shared contract

1. Create `packages/shared/src/contracts/<feature>.ts` with `Create<Feature>Input`, `Update<Feature>Input`, `<Feature>Dto` (see `tags.ts`).
2. Add `export * from './<feature>';` to `packages/shared/src/contracts/index.ts`.
3. Run `npm run build:shared` from the root. Skipping it leaves the API and UI on stale types.

## 2. Entity and migration

4. Create `packages/api/src/entities/<Feature>.entity.ts` (PascalCase file, class `<Feature>` with no suffix). Use `@Entity('<feature>')` with a snake_case plural table name (`tags`, `debts`), extend `BaseEntity` (gives `createdAt`, `updatedAt`, `deletedAt`), add a `userId` varchar column and a `@ManyToOne(() => User, { onDelete: 'CASCADE' })` with `@JoinColumn({ name: 'userId' })`.
5. Import the class and add it to the `entities: [...]` array in `packages/api/src/data-source.ts`. Entities are listed by hand, not discovered.
6. Run `npm run migration:generate`, review the file, then `npm run migration:run` from the root. Follow the `migration` skill for rules (never hand-write schema, keep `Z-seed-data.ts` last).

## 3. Repository

7. Create `packages/api/src/repositories/<feature>.repository.ts`. Pattern from `tags.repository.ts` and `debts.repository.ts`:
   - `constructor(private readonly dataSource: DataSource = AppDataSource) {}`
   - `private get repo(): Repository<<Feature>>` returning `this.dataSource.getRepository(<Feature>)`, so it resolves lazily per call.
   - Methods: `findManyForUser(userId)`, `findOneForUser(userId, id)`, `createEntity(data)`, `save(entity)`, `remove(entity)`.
   - Make `remove` call `this.repo.softRemove(entity)` (as debts does). Tags currently hard-remove with `repo.remove`; do not copy that for new resources.
8. Register in `packages/api/src/repositories/index.ts` with three edits: the import, `export const <feature>Repository = new <Feature>Repository();`, and the class name in the `export { ... }` list.

## 4. Service

9. Create `packages/api/src/services/<feature>.service.ts`:
   - Import the DTO types from `@expense-tracker/shared` and re-export the input types with `export type { Create<Feature>Input, Update<Feature>Input };` (routes import them from the service).
   - Constructor injects the repository, defaulting to the singleton from `../repositories`.
   - Throw `AppError('<Feature> not found', 404)` when `findOneForUser` returns null in update and remove.
   - Call `logger.info(...)` on create, update and delete. `logger` is imported from `'.'`.
   - Map entity to DTO inline (see `DebtsService.list`).
10. Register in `packages/api/src/services/index.ts` with the same three edits as the repository barrel. Put the line after any service your service depends on at construction time.

## 5. Routes

11. Create `packages/api/src/routes/<feature>/` with one file per action, named `get-<feature>s.route.ts`, `post-<feature>.route.ts`, `put-<feature>.route.ts`, `delete-<feature>.route.ts`. Each file:
    - `const router = Router({ mergeParams: true });`
    - Joi schema typed with the input type (`Joi.object<Create<Feature>Input>({...})`). Update schemas end with `.min(1)`.
    - Inline `const { error, value } = schema.validate(req.body); if (error) return utilService.replyError(res, error.message);`
    - Handler wrapped in `asyncHandler` (from `../../middleware/error-handler`), user id from `req.user!.userId`.
    - Reply with `return utilService.replyOk | replyCreated | replyNoContent`. Success payloads are raw, not wrapped.
12. Create the aggregator `packages/api/src/routes/<feature>.routes.ts` (copy `tags.routes.ts`): `Router({ mergeParams: true })` and `router.use(...)` for each sub-route.
13. In `packages/api/src/index.ts` add the import and mount it with the other resources: `app.use('/api/users/:userId/<feature>', requireAuth, <feature>Router);`

## 6. UI api client

14. There is no per-resource client file. Add methods to `packages/ui/src/lib/api/ProfileApi.ts` (which already holds tags, debts and vaults) under a `// <Feature>` comment, using `this.get/post/put/delete` as the neighbours do. Type the data params and return values with the shared types (`Create<Feature>Input`, `<Feature>Dto`), imported with `import type` from `@expense-tracker/shared`. Some older methods use inline object literals; do not copy that. `index.ts` already exports `profileApi`, so nothing else to register.

## 7. Test

15. Create `packages/api/src/tests/<feature>.service.test.ts` following the `write-service-test` skill. Copy the structure of `tags.service.test.ts`: `jest.mock('../services', ...)` for `logger`, a typed repository mock, a `build<Feature>` factory, and `AppError` assertions for the 404 paths.
16. Run `npm run test:api -- <feature>.service`. Before finishing, run `npm run test:api` to check nothing else broke.

## Verify

- `npm run build:shared` succeeds and the API compiles when started.
- `npm run dev:api` boots. A request to `/api/users/<id>/<feature>` without a token returns 401, which proves the mount and the `requireAuth` guard.
- Test against a local database first. Do not run anything against production without the owner's explicit confirmation.
- Report which commands you ran and what they returned.

## Future: offline-first app (assumption)

The long-term plan is an offline-first Expo React Native app at `packages/app` with no API server and data in on-device SQLite. `packages/app` does not exist yet, and `expo-sqlite` is an assumption, not a decision.

Once it exists, this scaffold will drop the route layer (steps 11 to 13) and the axios client layer (step 14), and add a local data-access layer in their place. The shared contract and the service and repository layering are expected to carry over. Update this skill when `packages/app` is created; until then, do not scaffold into it.
