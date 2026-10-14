# Offline data layer

The target app has no API server. The phone's SQLite database is the only copy of the user's data. Everything below follows from that.

Assumptions: `expo-sqlite` is the database, and the layering from `packages/api` (service, then repository, then table) is reused without the route layer. Check the docs for the installed Expo SDK for the current `expo-sqlite` API (async vs sync calls, `SQLiteProvider`, transaction helpers); it has changed between SDK versions.

## Rules

1. All reads and writes go to local SQLite. No network call on the path of any core feature (transactions, vaults, tags, debts, stats).
2. The UI never blocks on the network. If an optional feature ever uses the network, it runs in the background and failure leaves the app fully usable.
3. Lists read in pages or windows, not whole tables. Use `LIMIT`/`OFFSET` or keyset paging (`WHERE date < ? ORDER BY date DESC LIMIT 50`) for the transaction list, and a month or year filter where the web app already uses `month` / `year` (see `ListTransactionsQuery` in `packages/shared/src/contracts/transactions.ts`). Keep the page in screen state; do not mirror the table in a global store.
4. Aggregates (month totals, vault spend vs `monthlyBudget`, tag breakdown for stats) are SQL queries, not JS loops over loaded rows.
5. Writes are local transactions. A multi-row change, such as a transfer between vaults (two transactions) or applying a debt, runs inside one SQLite transaction so it is all-or-nothing.
6. After a write, update the UI immediately. Either update the visible list in state (optimistic, then reconcile on the transaction result) or re-run the current page query. A local write is fast enough that no loading state is needed.
7. Save only chosen fields, never a payload as received (repo rule in `.agents/rules/typescript.md` still applies).
8. Follow the soft-delete pattern of the existing API: set `deletedAt` and filter it out in queries, scoped as the web app does.

## Where to put it

When creating the data layer, use:

- `src/db/client.ts`: opens the database once and exports it.
- `src/db/migrations/`: ordered on-device migrations (below).
- `src/repositories/<feature>.repository.ts`: the only code that writes SQL.
- `src/services/<feature>.service.ts`: business logic, calls repositories, throws typed errors for expected failures. Mirror the matching file in `packages/api/src/services/` so behavior stays the same.
- Hooks in `src/hooks/` (for example `useTransactions(month)`) wrap services for screens.

Screens import hooks or services only. Request and response types come from `@expense-tracker/shared`; do not redefine them. Rebuild shared with `npm run build:shared` after editing it. Mind that shared contracts have `userId` fields from the multi-user server; whether to keep them is an open decision.

## Schema changes: on-device migrations

There is no deploy step on a user's phone, so migrations run on app start, before any screen reads data.

- Keep an ordered list of migrations and a version counter stored in the database (`PRAGMA user_version` is one option). On start, run every migration above the stored version, each inside a transaction, then bump the version.
- Migrations only move forward. Never edit a migration that has shipped; add a new one.
- Test each migration against a database populated with data from the previous version, not only an empty one. A failed migration on a user's phone can lose their only copy of the data.
- Render a splash screen until migrations finish; do not mount screens that query the database before then.

## Backup and export

With no server there is no second copy. Losing or resetting the phone loses all data, so backup is a data-loss concern, not a feature to add later.

- Build an export (a SQLite file copy or JSON/CSV) early and reachable from settings. `packages/api/src/services/backup.service.ts` shows what the server version does today.
- Importing a backup must go through the same migration path, so an old backup restores into a newer schema.
- Tell the user clearly in the UI that data lives only on the device.
- The mechanism (OS-level backup, share sheet export, cloud folder) is an open decision.

## Open decisions

These features exist in the API and depend on a server. Do not decide or silently drop them; ask the user.

- Gmail email import and pending expenses (`gmail.service.ts`, `pending-gmail-expense.service.ts`, vault watchers, OAuth and AI credentials). They need Gmail access and a server-side poller. Options include dropping them, a manual paste or share-sheet import, or keeping a small optional backend.
- Auth and JWT. A single-user local app may not need accounts. Decide whether to keep a local app lock (biometric or PIN) and what to do with `userId` columns.
- Recurring transactions. The server runs `node-cron`. A phone app cannot run jobs while closed. A common approach is to generate due occurrences on app start and on foreground, but the catch-up rules (missed days, duplicates) need your decision.
- Push notifications (`push.service.ts`). Local scheduled notifications are possible, but whether they are wanted is open.
- Existing data. Whether current users import data from the server database, and how, is open.
- Money representation. Shared DTOs use `number` for `amount`; decide whether local storage uses integer minor units to avoid float errors.
