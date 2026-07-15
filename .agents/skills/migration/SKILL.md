---
name: migration
description: Safely create, apply, and revert TypeORM migrations in packages/api. Use for any database schema change, entity field change, or when a migration fails locally or in deploy.
---

# Database migrations

SQLite via TypeORM (`better-sqlite3`). Migrations live in `packages/api/src/migrations/` and are discovered by glob: `src/migrations/*.ts` under ts-node (dev), `dist/migrations/*.js` in production.

## Standard flow (after any entity change)

All from the repo root:

```bash
npm run migration:generate   # diffs entities vs DB → src/migrations/<timestamp>-Migration.ts
npm run migration:run        # apply immediately — ALWAYS run right after generating
```

Rules:

1. **Never hand-write schema migrations** — always `migration:generate` from entity changes.
2. New entities must be registered in the `entities: [...]` array of `src/data-source.ts` **before** generating, or the diff misses them.
3. Optionally rename the generated file and class to something descriptive (`<timestamp>-AddDebts.ts` / class `AddDebts<timestamp>`), matching existing named migrations.
4. **`Z-seed-data.ts` must always sort last.** It is a hand-authored idempotent seed with fixed UUIDs. Never name a migration so it sorts after `Z-` (alphabetical ordering decides run order for equal-format names; keep timestamp prefixes).
5. Generated SQLite migrations often rebuild whole tables (`CREATE TABLE temporary_...` + copy). That is normal — review that no column data is dropped, then commit as-is.

## Reverting

```bash
npm run migration:revert     # undoes the most recent applied migration
```

## Troubleshooting

- "No changes in database schema" — entity not registered in `data-source.ts`, or the local DB is already ahead; check `migrations` table in `packages/api/pocket_pixel.sqlite` (the `pocket-pixel-sqlite` MCP server can read it).
- Local DB corrupted/diverged — delete `packages/api/pocket_pixel.sqlite` and `npm run migration:run` to rebuild from scratch (seed migration repopulates demo data). Local dev DB only; never do this in prod.
