# Plan: Multiple Gmail watchers per vault (fire-all)

## Goal

Today a vault owns **at most one** Gmail watcher, enforced by a unique DB index. This
plan lifts that to **many watchers per vault**. When an incoming email matches more
than one watcher on the same vault, **every** matching watcher runs its `parse` script
and creates its own transaction in that vault (**fire-all** semantics).

### Done when

- A vault can hold N watchers (N ≥ 0); each is an independent `(label + optional subjectFilter + parseScript + tagIds)`.
- One email that matches K watchers on a vault produces K transactions in that vault, one per matching watcher.
- Pub/Sub replay of the same message never double-inserts (idempotency preserved).
- `npm run build:shared`, `npm run test:api`, and a fresh `npm run migration:run` all pass.

## Key design decisions

1. **Watchers become id-addressable.** The DTO and API move from being keyed by
   `vaultId` (one per vault) to being keyed by the watcher's own `id`. `vaultId` stays
   a foreign column but is no longer unique.
2. **Fire-all at match time.** `matchWatcher` (returns one) → `matchWatchers` (returns
   an array). `handleMessage` loops the array, runs each script, creates each txn.
3. **Idempotency stays per-message, not per-watcher.** `processedMessages.exists/record`
   still gates on `messageId`. All matching watchers fire inside a single
   `handleMessage` call *before* `record`, so a replay is skipped wholesale — no
   per-transaction dedup key needed. **Trade-off (documented intent):** a watcher added
   *after* a message was processed will not backfill that message. This matches current
   behaviour and is acceptable.
4. **Subject routing rule relaxes.** Current `matchWatcher` picks a single winner
   (specific-subject beats catch-all, earliest-created breaks ties). Fire-all drops the
   "pick one" step: **all** candidates whose `subjectFilter` matches (or is null) fire.

## Files to touch — in dependency order

Per the repo's architecture rule: shared contracts → entity → migration → repository →
service → routes → UI client → tests.

### 1. Shared contracts — `packages/shared/src/contracts/vault-watchers.ts`

- Add `id: string` to `VaultGmailWatcherDto`.
- Update the doc comment: a vault may now attach **multiple** watchers.
- `SetVaultGmailWatcherInput` body shape is unchanged (still the mutable fields); the
  watcher identity now rides in the route path as `:watcherId` for update/delete.
- **After editing:** `npm run build:shared` so API + UI pick up the new type.

### 2. Entity — `packages/api/src/entities/VaultGmailWatcher.entity.ts`

- Change `@Index('IDX_vault_gmail_watcher_user_vault', ['userId', 'vaultId'], { unique: true })`
  → drop `{ unique: true }` (keep the index, now just a lookup accelerator).
- Keep the `(userId, gmailLabelId)` index as-is.
- Update the class doc comment ("at most one watcher per vault" → "many per vault").

### 3. Migration — `packages/api/src/migrations/`

- `npm run migration:generate` after the entity change (do **not** hand-write).
- Expect: drop unique index `IDX_vault_gmail_watcher_user_vault`, recreate it non-unique.
- `npm run migration:run` from the repo root to apply; confirm it succeeds against
  `packages/api/pocket_pixel.sqlite`.
- Verify the seed migration `Z-seed-data.ts` still sorts last.

### 4. Repository — `packages/api/src/repositories/vault-gmail-watchers.repository.ts`

- `findByVault(userId, vaultId): Promise<VaultGmailWatcher | null>`
  → `findManyByVault(userId, vaultId): Promise<VaultGmailWatcher[]>` (order by `createdAt ASC`).
- Add `findOneById(userId, id): Promise<VaultGmailWatcher | null>` (`findOneBy({ userId, id })`)
  for update/delete ownership checks.
- `softDelete(userId, vaultId)` → `softDelete(userId, id)` — delete a single watcher by id.
- `findManyForUser` unchanged (still the source for match + label union).

### 5. Service — `packages/api/src/services/vault-watchers.service.ts`

- `listForUser`: add `id: watcher.id` to the mapped DTO. Otherwise unchanged.
- Split `upsert` into two explicit methods (no more "one row per vault" assumption):
  - `create(userId, vaultId, input): Promise<VaultGmailWatcherDto>` — verify vault
    ownership (404 if not), `createEntity({ userId, vaultId })`, set mutable fields,
    save, `gmail.resyncWatch`, return DTO (include `id`).
  - `update(userId, vaultId, watcherId, input): Promise<VaultGmailWatcherDto>` —
    `findOneById`; 404 if missing or `watcher.vaultId !== vaultId`; set mutable fields,
    save, `resyncWatch`, return DTO.
- `remove(userId, vaultId)` → `remove(userId, watcherId)`: `softDelete(userId, watcherId)`,
  then `resyncWatch`. (Keep `vaultId` in the route path for scoping/consistency even if
  the delete keys on id.)
- Update the class doc comment (drop "at most one watcher").

### 6. Routes — `packages/api/src/routes/vault-watchers/`

Mount is `/api/users/:userId/vault-watchers` (see `index.ts:62`). New verb/path shape:

- **GET `/`** — unchanged (lists all watchers for the user, already flat).
- **`put-vault-watcher.route.ts`** currently `PUT /:vaultId` (upsert). Split:
  - **POST `/:vaultId`** → `service.create(userId, vaultId, body)` → `replyCreated`.
  - **PUT `/:vaultId/:watcherId`** → `service.update(userId, vaultId, watcherId, body)` → `replyOk`.
  - Rename the file(s) accordingly (e.g. `post-vault-watcher.route.ts` + `put-vault-watcher.route.ts`),
    reuse the existing Joi `setVaultWatcherSchema` for both bodies.
- **`delete-vault-watcher.route.ts`** `DELETE /:vaultId` → **`DELETE /:vaultId/:watcherId`**
  → `service.remove(userId, watcherId)` → `replyNoContent`.
- Wire any new sub-route file into `vault-watchers.routes.ts`.
- Keep routes thin: validate → service → `utilService`, `asyncHandler`, no try/catch.

### 7. Gmail match/fire — `packages/api/src/services/gmail.service.ts`

- **`matchWatcher` → `matchWatchers`** (`gmail.service.ts:338`): return
  `Array<{ vaultId; parseScript; tagIds }>` instead of one. Keep the label filter; then
  return **all** candidates where `subjectFilter` is null **or** the subject contains it
  (case-insensitive). Drop the specific-beats-catchall "pick one" collapse.
- **`handleMessage`** (`gmail.service.ts:307`): loop the returned array — for each,
  run `scriptRunner.run` in its own try/catch (one bad script must not block the others),
  and on a valid parse `transactions.create` into `watcher.vaultId`. Then `record` **once**
  after the loop.
- `labelUnion` / `resyncWatch` unchanged (already de-dupe labels via `Set`).

### 8. UI — api client + card

- `packages/ui/src/lib/api/ProfileApi.ts`:
  - `setVaultWatcher(userId, vaultId, input)` → split into
    `createVaultWatcher(userId, vaultId, input)` (POST) and
    `updateVaultWatcher(userId, vaultId, watcherId, input)` (PUT `/${vaultId}/${watcherId}`).
  - `deleteVaultWatcher(userId, vaultId)` → `deleteVaultWatcher(userId, vaultId, watcherId)`
    (DELETE `/${vaultId}/${watcherId}`).
- `packages/ui/src/app/settings/google-oauth/VaultWatcherCard.tsx`:
  render a **list** of watchers per vault (each with its own label/subject/script/tags
  editor) with "add watcher" and per-row "remove". Key rows by `watcher.id`.

### 9. Tests

- `packages/api/src/tests/vault-watchers.service.test.ts`:
  - Update `upsert` describe → `create` / `update` describes; assert `id` in returned DTO.
  - Keep the "same label on a different vault" case; add "**two watchers on the same
    vault**" create case.
  - `remove` now keys on `watcherId`.
- Add a gmail-service test (or extend existing) for **fire-all**: an email matching two
  watchers on one vault creates two transactions; one throwing script does not stop the
  other; `record` called once.
- Run `npm run test:api` (and `-- --runInBand` as CI does).

## Verification checklist

- [ ] `npm run build:shared` clean.
- [ ] `npm run migration:run` applies the drop-unique migration cleanly.
- [ ] `npm run test:api` green (service + gmail fire-all).
- [ ] Manual: two watchers on one vault, send/replay one matching email → two txns, replay → still two.
- [ ] `npx prettier --write` on every touched file.

## Risks / open points

- **Duplicate transactions by design.** Two overlapping watchers on a vault will both
  fire for an ambiguous email. That is the chosen behaviour (fire-all). If users find it
  noisy later, revisit with a per-watcher dedup key — out of scope here.
- **Route shape is breaking.** Existing `PUT /:vaultId` / `DELETE /:vaultId` callers must
  migrate to the id-based paths; the UI client is the only known caller.
