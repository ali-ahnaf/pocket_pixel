# Database Changes

Verified against the actual tree. When this doc and the code disagree, trust the code and fix this doc.

## Entities

1. Entities live in `packages/api/src/entities/`, one file per entity, named `<Feature>.entity.ts` (PascalCase file, e.g. `Tag.entity.ts`, `UserPreference.entity.ts`).
2. The class is named **without** an `Entity` suffix: `export class Tag extends BaseEntity`. The table name is set explicitly in the decorator: `@Entity('tags')` (plural, snake/lower case).
3. All entities extend `BaseEntity` (`entities/BaseEntity.ts`), which provides `createdAt` / `updatedAt` / `deletedAt` columns.
4. **Register every new entity** in the `entities: [...]` array of `src/data-source.ts` — entities are not auto-discovered.
5. Enums used by an entity: keep them where existing ones live — inline in the entity file (e.g. `RecurrenceInterval` in `Expense.entity.ts`) or in the shared contract when the UI needs them. There is no `shared/constants/` directory.

## Migrations

See the `migration` skill for the full generate → run → revert flow, seed-ordering rules, and troubleshooting. Whenever an entity change here requires a schema migration, invoke that skill rather than duplicating the steps.

## Deleting data

Prefer `softDelete` (BaseEntity has `deletedAt`) — transactions, debts, and recurring do this. Some repositories (tags) currently hard-`remove`; follow the existing pattern of the repository you're editing and never mix both for one entity.

## Shared contracts

If the change affects request/response shapes, update `packages/shared/src/contracts/` first, re-export from `contracts/index.ts`, run `npm run build:shared`, then consume the type from the API.
