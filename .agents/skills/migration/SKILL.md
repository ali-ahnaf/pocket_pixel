---
name: migration
description: Create, apply, and revert TypeORM migrations in packages/api (SQLite). Use for any entity or schema change, or when a migration fails locally or in deploy. Also covers the extra risks of on-device migrations for the planned offline app.
---

# Database migrations

The API uses TypeORM 0.3 with SQLite (`better-sqlite3`). Migrations live in `packages/api/src/migrations/`. The glob is set in `packages/api/src/data-source.ts`: `src/migrations/*.ts` under ts-node (dev), `dist/migrations/*.js` otherwise. `synchronize` is `false`, so the schema only changes through migrations.

## Standard flow (after any entity change)

Run from the repo root:

```bash
npm run migration:generate   # diffs entities vs the local DB, writes src/migrations/<timestamp>-Migration.ts
npm run migration:run        # apply it right away
```

Rules:

1. Prefer `migration:generate` over hand-writing schema migrations. Hand-write only data migrations or cases the diff cannot express, and say why in the class comment.
2. Register new entities in the `entities` array of `data-source.ts` before generating, or the diff misses them.
3. Run `migration:run` right after creating any migration file (project rule in CLAUDE.md).
4. Optionally rename the generated file and class to something descriptive, as in `1784625468225-AddPushSubscriptions.ts` (class `AddPushSubscriptions1784625468225`). Keep the timestamp prefix and keep `name` in sync with the class.
5. SQLite cannot drop or alter most columns in place, so generated migrations often rebuild the table (`CREATE TABLE "temporary_x"`, copy, `DROP`, `RENAME`). This is normal. Before committing, check the `INSERT ... SELECT` copies every column you want to keep, and that `down` restores the old shape.
6. A new `NOT NULL` column needs a `DEFAULT`, or the copy step fails on tables that already have rows.
7. Do not edit a migration that has been merged to `main`. Add a new one.
8. After changing entities that the UI uses, rebuild shared types if DTOs changed (`npm run build:shared`).

## The seed migration

`Z-seed-data.ts` (class `SeedDummyData1782463500000`) is a hand-written, idempotent seed with fixed UUIDs. It is not a schema migration. Leave the file name alone and do not add migrations whose names sort after `Z-`.

Note: its header comment says it runs last, but TypeORM orders migrations by the timestamp in the class name, and `1782463500000` is lower than many later migrations. In practice it runs mid-sequence on a fresh DB, and later table rebuilds carry its rows along. This is based on TypeORM's documented ordering; I have not run a fresh DB to confirm. Its inserts name explicit columns, so later added columns need defaults (rule 6).

## Reverting

```bash
npm run migration:revert     # undoes the most recent applied migration
```

Only the latest one is reverted per call. Revert is for local dev. Never run it against production data.

## Tests

No Jest test covers migrations. Services are tested with mocks (`packages/api/src/tests`), so a bad migration is not caught by `npm run test:api`. Verify by running `migration:run` on a local DB, and for risky changes on a copy of a real backup.

## Production

On push to `main`, CI runs `npm run migration:run-prod --workspace=packages/api` on the VPS before restarting PM2 (`.github/workflows/ci-cd.yml`). It applies `dist/migrations/*.js` to `/var/www/pocket_pixel/pocket_pixel.sqlite` (`DB_PATH` in `data-source.ts`). There is no automatic rollback. If it fails, run the same command on the VPS to see the error (`documentation/deployment.md`).

Production changes need explicit confirmation from the user. Test the migration locally first. The backup scheduler pushes copies to R2, but check a recent backup exists before a destructive change (dropping a column or table).

## Troubleshooting

- "No changes in database schema": the entity is not registered in `data-source.ts`, or the local DB is already ahead. Check the `migrations` table in `packages/api/pocket_pixel.sqlite`. The `pocket-pixel-sqlite` MCP server (`.mcp.json`) can read it.
- Local DB corrupted or diverged: delete `packages/api/pocket_pixel.sqlite` and run `npm run migration:run` to rebuild. Local dev DB only, never in prod. The seed migration repopulates demo data.
- Migration works with ts-node but not in prod: the production glob reads `dist/migrations/*.js`, so build first (`npm run build:prod`).

## Planned offline app (packages/app)

Long-term plan: a React Native (Expo) app with no API server and data in on-device SQLite. `packages/app` does not exist yet. Assumption: `expo-sqlite` is the storage layer. Nothing below is a settled design.

The main change is risk. Today a bad migration is fixed by the developer on the VPS, with R2 backups behind it. On a phone, the migration runs once on each user's device, there is no server to patch it, and the device may be the only copy of the data. So:

- Make migrations additive: add tables and nullable or defaulted columns. Avoid drops, type changes, and destructive table rebuilds unless the copy is verified.
- Never lose user data. Wrap each migration in a transaction so a failure leaves the old schema intact, and keep the app usable (or show a clear error) if it fails.
- Test every migration against a copy of real data (a production backup export, with PII handled per Sharebox's process), including from the oldest supported schema version.
- Users may skip app versions, so migrations must run in order from any older version.
- Do not rely on `down` migrations in the field. Plan forward fixes instead.

How the app tracks schema versions (for example `PRAGMA user_version` or a migrations table) is an open decision. Do not write that flow until the app exists.
