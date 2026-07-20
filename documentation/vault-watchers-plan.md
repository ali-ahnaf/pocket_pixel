# Plan — Per-Vault Gmail Watchers with Custom Parse Scripts

Redesign the **Bank Alert Watch** section (Settings → Google OAuth) so bank-alert
email parsing is configured **per vault** with a **user-supplied JS script**,
replacing the hardcoded bank parsers.

## Goal (definition of done)

A connected user can, from the settings page:

1. See a list of their existing vaults.
2. Attach **one Gmail label** to a vault (e.g. vault `MAIN STASH` ← label `BANK/EBL`).
3. Write a custom JS script that parses a matching email into a transaction.
4. Test that script in-page against a pasted sample email.
5. On save, the Gmail push watch is (re)started over the union of all attached
   labels; when a matching email arrives, the vault's script runs and a
   transaction is created **in that vault**.

The old hardcoded parsers under `packages/api/src/parsers/gmail` are deleted and
no longer imported anywhere. `npm run test:api` and the relevant e2e specs pass.

---

## Current state (verified)

| Fact | Location |
| --- | --- |
| Watch state (single mailbox watch per user): `gmailHistoryId`, `gmailWatchExpiry`, `gmailLabelIds` (flat `string[]`) | `entities/UserOAuthCredential.entity.ts:51-58` |
| Watch label(s) set via `setWatchedLabels` → `startWatch` POSTs `users.watch` with `{topicName, labelIds, labelFilterBehavior:'INCLUDE'}` | `services/gmail.service.ts:94-147` |
| Push → user resolved by `findByGoogleEmail(notification.emailAddress)` | `services/gmail.service.ts:176` |
| History diff collects message ids across all labels, **losing which label matched** | `services/gmail.service.ts:228-257` |
| Parse + create: `parseBankMessage(extractMessageContent(message))` → `transactions.create(userId, {amount,type,title,date})` — **no `vaultId`** | `services/gmail.service.ts:297-303` |
| Idempotency ledger `ProcessedGmailMessage (userId, gmailMessageId)` | `entities/ProcessedGmailMessage.entity.ts` |
| Parser contract: `BankParser{ bank, matches(content), parse(content) }`; input `BankMessageContent{from,subject,bodyText,emailDate}`; output `ParsedBankTransaction{amount,type,title,date?,accountTail?}` | `parsers/gmail/{types,index}.ts` |
| `CreateTransactionInput` already supports `vaultId` | `shared/src/contracts/transactions.ts:11-18` |
| `extractMessageContent(message): BankMessageContent` | `utils/gmail-message.util.ts` (imported `gmail.service.ts:11`) |
| Watch UI section (renders when `connected`) uses `profileApi.getGmailLabels/getGmailWatchStatus/setGmailWatch/stopGmailWatch` | `ui/src/app/settings/google-oauth/page.tsx:282-327` |
| Watch UI api client fns | `ui/src/lib/api/ProfileApi.ts:63-77` |
| OAuth/watch endpoints mounted under **users** tree: `/users/:userId/oauth-credentials/gmail/{labels,watch}` | `routes/oauth-credentials.routes.ts` + `routes/oauth-credentials/*` |
| `GmailMessage` fetched with `format=full` — its JSON carries `labelIds` (used for watcher matching) | `services/gmail.service.ts:280-285` |

---

## Design decisions (confirmed)

- **Script execution:** Node built-in `node:vm` in a frozen context with a
  ~1s `timeout`, no `require`/`process`/`fetch`/globals exposed. No new deps.
  (Threat model: self-hosted, user runs only their own script.)
- **Script contract:** the user defines `function parse(email) { ... }` and
  returns `{ title, amount, date, type }`. Input `email = { from, subject,
  bodyText, emailDate }`. Output validated: `title:string`, `amount:number>0`,
  `type:'income'|'expense'`, `date?:'yyyy-mm-dd'` (defaults today when absent).
  Returning `null`/`undefined` = "not a transaction, skip."

### New data model

New entity `VaultGmailWatcher` (`@Entity('vault_gmail_watchers')`), extends `BaseEntity`:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `userId` | varchar | owner |
| `vaultId` | varchar | **unique per user** — 1 watcher per vault |
| `gmailLabelId` | varchar | Gmail label id; **unique per user** — a label maps to one vault |
| `gmailLabelName` | varchar, nullable | display only |
| `parseScript` | text | user JS (`function parse(email){...}`) |

- Add unique indexes: `(userId, vaultId)` and `(userId, gmailLabelId)`.
- **Remove** `gmailLabelIds` from `UserOAuthCredential`; the watched-label set is
  now **derived** as the union of `gmailLabelId` across the user's watchers.
- Keep `gmailHistoryId` + `gmailWatchExpiry` on the credential (still one mailbox
  watch per user).

### Webhook flow change

- Expose `labelIds` on the fetched message (thread it out of `fetchMessage`).
- In `handleMessage`: look up the user's watchers, find the one(s) whose
  `gmailLabelId` ∈ `message.labelIds`. For the first match, run its
  `parseScript`; on a valid result create a transaction with
  `vaultId = watcher.vaultId`. No match / invalid / null → record processed, skip.
- `startWatch` reads the derived label union instead of `gmailLabelIds`; empty
  union → stop/skip the watch. Saving/removing a watcher re-syncs the watch.

---

## Task breakdown

Ordered by dependency: **shared → entity → migration → repository → service →
routes → UI client → UI → tests → cleanup**. Tasks tagged for splitting into
issues (`backend` / `frontend` / `unit-tests`).

### T1 — Shared contracts `[backend]`
Add to a new `shared/src/contracts/vault-watchers.ts`, re-export from `contracts/index.ts`:
- `VaultGmailWatcherDto { vaultId; vaultName; gmailLabelId; gmailLabelName: string|null; parseScript: string }`
- `SetVaultGmailWatcherInput { gmailLabelId; gmailLabelName?: string; parseScript: string }`
- `ParsedEmailDto { title: string; amount: number; date: string; type: 'income'|'expense' }`
- `TestParseScriptInput { script: string; sample: { from: string; subject: string; bodyText: string } }`
- `TestParseScriptResultDto { ok: boolean; result?: ParsedEmailDto; error?: string }`
- Remove `SetGmailWatchInput` usage if the label-based watch endpoint is dropped (see T7).
- **Verify:** `npm run build:shared` succeeds; types import from `@expense-tracker/shared`.

### T2 — Entity + relocate message-content type `[backend]`
- Add `entities/VaultGmailWatcher.entity.ts` (schema above); register in `data-source.ts`.
- Remove `gmailLabelIds` column + doc from `UserOAuthCredential.entity.ts`.
- Move the `BankMessageContent` interface out of `parsers/gmail/types.ts` into
  `utils/gmail-message.util.ts` (rename to e.g. `GmailMessageContent`) so deleting
  the parsers dir (T10) doesn't break `extractMessageContent`.
- **Verify:** `npx tsc --noEmit` in api; entity discovered by data-source.

### T3 — Migration `[backend]` — depends on T2
- `npm run migration:generate` → creates `vault_gmail_watchers` + drops `gmailLabelIds`.
- Confirm the seed migration `Z-seed-data.ts` still sorts last.
- `npm run migration:run`.
- **Verify:** migration applies clean; `sqlite` shows the new table + unique indexes.

### T4 — Repository `[backend]` — depends on T2
- `repositories/vault-gmail-watchers.repository.ts` wrapping TypeORM (lazy
  `dataSource.getRepository`, injectable DataSource), export from `repositories/index.ts`.
- Methods: `findManyForUser(userId)`, `findByVault(userId, vaultId)`,
  `findByLabel(userId, labelId)`, `upsert(...)`, `softDelete(userId, vaultId)`.
- Follow soft-delete pattern scoped to `userId`.
- **Verify:** compiles; unit-test-ready with injected DataSource.

### T5 — Script runner service `[backend]`
- `services/gmail-script-runner.service.ts`: `run(script, email): ParsedEmailDto | null`.
  - `vm.createContext` with only `{ email }`; `vm.runInContext(script + '\nparse(email);', ctx, { timeout: 1000 })`.
  - Validate the returned object; throw `AppError(msg, 400)` on invalid shape
    (used by the test endpoint); the webhook path catches and treats as skip.
- Export from `services/index.ts`.
- **Verify:** covered by T11 unit tests.

### T6 — Wire watchers into gmail.service `[backend]` — depends on T4, T5
- Replace `import { parseBankMessage }` with the watchers repo + script runner.
- `startWatch`/`setWatchedLabels`: derive the label union from watchers (remove
  the `gmailLabelIds` reads/writes). Add a `resyncWatch(userId)` used after
  watcher create/delete; empty union → stop watch.
- Thread `labelIds` out of `fetchMessage`; in `handleMessage`, match a watcher by
  `gmailLabelId ∈ message.labelIds`, run its script, `transactions.create(userId,
  { ...parsed, vaultId })`. No match/invalid/null → still `processedMessages.record`.
- **Verify:** `npm run test:api -- gmail.service` green after T11 updates.

### T7 — Vault-watcher routes `[backend]` — depends on T1, T4, T5, T6
New feature route tree `routes/vault-watchers.routes.ts` + `routes/vault-watchers/*`,
mounted under `/api/users/:userId/...` (thin routes, `asyncHandler`, Joi typed to DTOs, `requireAuth`):
- `GET  /vault-watchers` → list `VaultGmailWatcherDto[]` (join vault name).
- `PUT  /vault-watchers/:vaultId` → upsert (`SetVaultGmailWatcherInput`), then `resyncWatch`.
- `DELETE /vault-watchers/:vaultId` → soft-delete, then `resyncWatch`.
- `POST /vault-watchers/test` → run `TestParseScriptInput` → `TestParseScriptResultDto`.
- Keep `GET /oauth-credentials/gmail/labels` and `GET .../gmail/watch` (status badge).
  Drop `PUT/DELETE .../gmail/watch` (label-based) — watch now driven by watchers.
- Mount the aggregator in the users route tree.
- **Verify:** manual curl / e2e; routes return the shared DTO shapes.

### T8 — UI api client `[frontend]` — depends on T1, T7
- Add functions (in `ProfileApi.ts` or a new `VaultWatchersApi.ts`, exported from `lib/api/index.ts`):
  `getVaultWatchers`, `setVaultWatcher(userId, vaultId, input)`, `deleteVaultWatcher(userId, vaultId)`, `testParseScript(userId, input)`.
- Remove the now-dropped `setGmailWatch`/`stopGmailWatch` client fns.
- **Verify:** `npm run build:ui` / tsc passes.

### T9 — UI redesign of Bank Alert Watch section `[frontend]` — depends on T8
In `ui/src/app/settings/google-oauth/page.tsx` (still gated on `connected`):
- Fetch vaults (`profileApi.getVaults` — reuse existing), labels, watchers, watch status.
- Render a card per vault showing its attached watcher (label + script) or an
  "Attach listener" affordance.
- Per vault editor: **label dropdown** (from `getGmailLabels`), **script textarea**
  (monospace), **sample-email textarea + Test button** → calls `testParseScript`,
  shows parsed `{title,amount,date,type}` or the error.
- **Save** (PUT) / **Remove** (DELETE) per vault; refresh watch-status badge.
- Consider extracting a `VaultWatcherCard` component.
- **Verify:** manual click-through; existing google-oauth e2e still green (update if needed).

### T10 — Delete old parsers `[backend]` — depends on T6
- Delete `packages/api/src/parsers/gmail/{brac-bank.parser,ebl.parser,helpers,index,types}.ts`
  (and the `parsers/gmail` dir if empty).
- Ensure no remaining imports (`grep -rn "parsers/gmail" packages/api/src`).
- **Verify:** `npx tsc --noEmit` + `npm run test:api` green.

### T11 — Tests `[unit-tests]` — depends on T5, T6, T7
- New `tests/gmail-script-runner.service.test.ts`: valid parse, invalid shape →
  `AppError`, timeout/throw → null, missing `parse` fn.
- New `tests/vault-watchers.service.test.ts`: upsert/list/delete, unique-per-vault,
  resync label union (mock repos, `AppError` conventions per `write-service-test`).
- Update `tests/gmail.service.test.ts`: drop `parseBankMessage` expectations;
  assert label→watcher match, script run, `create` called with `vaultId`, skip paths.
- **Verify:** `npm run test:api -- --runInBand` all green.

---

## Verification checklist (stop condition)

- [ ] `npm run build:shared` after T1.
- [ ] `npm run migration:run` applied (T3).
- [ ] `npm run test:api -- --runInBand` green (T11).
- [ ] `grep -rn "parsers/gmail" packages/api/src` → no hits (T10).
- [ ] Manual: attach a label + script to a vault, Test button parses a sample,
      a matching email creates a transaction **in that vault**.
- [ ] google-oauth e2e spec green (T9).

## Notes / risks

- **Label→vault ambiguity:** enforce unique `(userId, gmailLabelId)` so a message
  never matches two vaults. If a message carries multiple watched labels, match
  the first watcher deterministically (document the order).
- **`node:vm` is not a security boundary** against a hostile script author; it is
  acceptable here only because the user authors their own script. Revisit with
  `isolated-vm` if watchers ever become shareable/multi-tenant.
- **Data migration:** dropping `gmailLabelIds` discards any existing flat watch
  config; users re-attach labels per vault (acceptable for the redesign).
