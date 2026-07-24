# OpenRouter AI Migration Plan

> Supersedes issue [#266](https://github.com/ali-ahnaf/pocket_pixel/issues/266) (Puter.js). Same goal — stop the app owner paying for every user's AI — but via **OpenRouter with a user-supplied, end-to-end-encrypted API key** instead of Puter's browser SDK.

## Goal

Each user brings their own OpenRouter API key. AI calls run **from the browser** with that key. The key is stored **encrypted** in our DB such that **only the user's browser can decrypt it** (server never sees plaintext = true E2E). Users pick which OpenRouter model to use. All three server-side AI services are migrated off `openai`.

Definition of done:

- No `openai` dependency or `OPENAI_*` env vars in app code.
- User can save an OpenRouter API key (E2E encrypted) and select a model in Settings.
- Expense parser + Wizard chat run client-side via OpenRouter.
- Gmail bank-alert flow becomes a **pending-expense queue**: webhook stores the raw email; the user parses it client-side (with their key) on demand.
- API boots, `npm run test:api` green, no `any`, Prettier-clean.

---

## Architecture decisions

### E2E encryption of the OpenRouter key

Server stores only ciphertext; it cannot decrypt. WebCrypto (AES-GCM) in the browser does encrypt/decrypt.

**Recommended scheme (envelope, password-derived KEK):**

1. On first setup the browser generates a random **DEK** (data encryption key, AES-256).
2. The OpenRouter key is encrypted with the DEK → `keyCiphertext` + `keyIv`.
3. A **KEK** is derived from the user's **login password** via PBKDF2 (or Argon2) with a per-user random `salt` and high iteration count.
4. The DEK is wrapped (encrypted) with the KEK → `wrappedDek` + `dekIv`.
5. Server stores: `salt`, `dekIv`, `wrappedDek`, `keyIv`, `keyCiphertext`, `kdfIterations`. **Never the password, DEK, KEK, or plaintext key.**

Unwrap flow (per session): at login the browser has the password → derive KEK → unwrap DEK → keep DEK **in memory** (React context / module singleton, not localStorage) for the session → decrypt OpenRouter key on demand for each AI call.

Why envelope (DEK+KEK) over encrypting the key directly with the password: **password change only re-wraps the DEK** (cheap, no re-encryption of the key, and the ciphertext blob stays stable). Direct password-derived encryption would force re-encrypting the key on every password change and couples the blob to the password.

**Consequences to handle:**

- Password is only available at login. Capture the derived KEK/DEK **at login time** and hold it in memory. On hard refresh the DEK is gone → user must re-authenticate (or we persist the unwrapped DEK in `sessionStorage`, weaker but survives refresh — a decision below).
- **Password change** must re-derive KEK from the new password and re-wrap the DEK. Hook into the existing `changePassword` flow (client-side re-wrap, then PUT the new `wrappedDek`/`salt`).
- **Password reset / forgotten password** = the key is unrecoverable by design. User must re-enter their OpenRouter key. Document this.
- The **Gmail pending-expense** flow (item 6) is the reason the key must be decryptable client-side on demand and why AI parsing cannot happen at webhook time (no browser, no DEK server-side).

### Where AI runs

All OpenRouter calls (`POST https://openrouter.ai/api/v1/chat/completions`) run **in the browser**. OpenRouter allows browser-origin calls; send `HTTP-Referer` and `X-Title` headers per their docs. Structured output uses `response_format: { type: 'json_schema', json_schema: {...} }` (same schemas we already build server-side).

Model list comes from the **public** `GET https://openrouter.ai/api/v1/models` (no auth) — fetched client-side to populate the model picker. The selected model id is **not secret**, stored plaintext.

---

## Open questions (confirm before building)

1. **DEK persistence across refresh:** use `sessionStorage` for the unwrapped DEK, cleared on logout.
2. **KDF:** Use PBKDF2 (WebCrypto native, no dep) (≥310k iterations, SHA-256).
3. **Model picker scope:** Show only curated list of models like openai gpt-4o, gpt-5-mini etc
4. **Gmail pending storage:** store only `gmailMessageId` and re-fetch from Gmail at parse time so we never store user's data in our servers
5. **Auto-parse vs manual:** Keep manual per-item parse and Optional "parse all pending" button.
6. **Token usage report:** Recommend: remove for now.

---

## New / changed data model

### New entity: `UserAiCredential` (E2E key + model)

`packages/api/src/entities/UserAiCredential.entity.ts`, extends `BaseEntity`, one row per user.

| column          | type                                | notes                                |
| --------------- | ----------------------------------- | ------------------------------------ |
| `id`            | uuid PK                             |                                      |
| `userId`        | varchar, unique, FK→users (CASCADE) |                                      |
| `salt`          | varchar                             | PBKDF2 salt (base64)                 |
| `kdfIterations` | int                                 | PBKDF2 iterations                    |
| `dekIv`         | varchar                             | IV for wrapped DEK                   |
| `wrappedDek`    | text                                | DEK encrypted under KEK              |
| `keyIv`         | varchar                             | IV for the OpenRouter key ciphertext |
| `keyCiphertext` | text                                | OpenRouter key encrypted under DEK   |
| `selectedModel` | varchar, nullable                   | OpenRouter model id (plaintext)      |

All crypto fields are **opaque blobs to the server**. Register in `data-source.ts`; generate migration (`npm run migration:generate` → `npm run migration:run`).

### New entity: `PendingGmailExpense` (Gmail queue)

`packages/api/src/entities/PendingGmailExpense.entity.ts`, extends `BaseEntity`.

| column           | type                        | notes                               |
| ---------------- | --------------------------- | ----------------------------------- |
| `id`             | uuid PK                     |                                     |
| `userId`         | varchar, FK→users (CASCADE) |                                     |
| `gmailMessageId` | varchar                     | re-fetched from Gmail at parse time |
| `vaultId`        | varchar                     | matched watcher's vault             |
| `guidanceHint`   | varchar, nullable           | captured from watcher at match time |

**Decision #4: we store no email content.** Only the pointer (`gmailMessageId` + `vaultId` + `guidanceHint`) is persisted; the email body is re-fetched from Gmail (via the user's OAuth token) at parse time and never lands in our DB. No `status` column — the row is soft-deleted on resolve/dismiss.

Index `['userId', 'gmailMessageId']` unique (idempotency alongside the existing `ProcessedGmailMessage` ledger). Soft-delete on resolve, per repo convention. Register in `data-source.ts`.

---

## Shared contracts (`packages/shared/src/contracts`)

- **New `ai-credentials.ts`:**
  - `AiCredentialStatusDto` — `{ hasKey: boolean; selectedModel: string | null }` plus the crypto blobs the browser needs to unwrap (`salt`, `kdfIterations`, `dekIv`, `wrappedDek`, `keyIv`, `keyCiphertext`) — returned only to the owner.
  - `SetAiCredentialInput` — all the ciphertext/crypto fields + `selectedModel`. **Never** a plaintext key field.
  - `SetAiModelInput` — `{ selectedModel: string }`.
- **New `pending-expenses.ts`:**
  - `PendingGmailExpenseDto` — `{ id, gmailMessageId, vaultId, vaultName, guidanceHint }` (no email content).
  - `PendingExpenseEmailDto` — `{ from, subject, bodyText, emailDate }` (returned only by the on-demand re-fetch endpoint, never persisted).
- **`ai.ts`:** drop `ModelUsage` / `UsageReport` (usage card removed). Keep `ParsedTransaction` (UI still needs the parser result shape).
- **`wizard.ts`:** keep `WIZARD_PROMPT_KEYS` / `WizardPromptKey` (UI reuses them); drop `WizardChatRequest`/`WizardChatResponse` if the UI no longer round-trips the server.
- **`vault-watchers.ts`:** keep `ParsedEmailDto` / `AiExtractResultDto` / `TestExtractInput` — reused client-side for parse + dry-run.
- Re-export new files from `contracts/index.ts`; run `npm run build:shared` after.

---

## Backend changes (`packages/api`)

### Add (thin, no AI)

- **Repository + service + routes for `UserAiCredential`:**
  - `GET /api/users/:userId/ai-credentials` → status + blobs (owner only).
  - `PUT /api/users/:userId/ai-credentials` → upsert the encrypted blobs + `selectedModel` (**selectively save fields**, never the request as-is).
  - `PUT /api/users/:userId/ai-credentials/model` → update model only.
  - Follow route→service→repository layering, Joi validation typed to the shared DTOs, `asyncHandler`, `utilService` replies, `requireAuth`. **No try/catch in routes.**
- **Repository + service + routes for `PendingGmailExpense`:**
  - `GET /api/users/:userId/pending-expenses` → list pending pointers (owner).
  - `GET /api/users/:userId/pending-expenses/:id/email` → server re-fetches the message from Gmail via OAuth and returns `PendingExpenseEmailDto`. Nothing is stored; this is the only place the body is exposed, to the owner's browser, for the client-side parse.
  - `DELETE /api/users/:userId/pending-expenses/:id` → soft-delete after the client parses + creates the transaction (or on dismiss).
- Wire new services/repositories into `services/index.ts` / `repositories/index.ts`.

### Change: `gmail.service.ts` — `handleMessage`

Currently (lines ~315-352): match watcher → `aiExtractor.extract` (OpenAI) → `transactions.create` → push.

New behavior: match watcher → **insert a `PendingGmailExpense`** pointer (`gmailMessageId` + `vaultId` + `guidanceHint` only — **no email body stored**) → push notify _"Pending expense to review"_ (url `/pending` or `/transactions`) → still `processedMessages.record(...)` for idempotency. **No AI call server-side.** Remove the `aiExtractor` dependency from the constructor and the `try/extract` block.

### Delete (server-side AI)

- `services/prompt.service.ts`, `services/wizard.service.ts`, `services/gmail-ai-extractor.service.ts` (+ remove from `services/index.ts`).
- Routes: `routes/prompt/` (`post-prompt.route.ts`, `get-usage.route.ts`) + `prompt.routes.ts` mount; `routes/wizard/` + `wizard.routes.ts` mount.
- The **server dry-run** `POST /users/:userId/vault-watchers/test` (uses `gmailAiExtractorService`) → migrate to client-side (see UI) and delete the server route, or keep a stub-free path. Confirm which watcher routes call the extractor and drop those.
- Remove `openai` from `packages/api/package.json`.
- Remove `OPENAI_API_KEY` / `OPENAI_ADMIN_KEY` from `env.ts`, `.env`, and the `API_ENV` deploy secret (`documentation/deployment.md`).
- Delete tests `src/tests/prompt.service.test.ts`, `wizard.service.test.ts`, and any `gmail-ai-extractor` test. Update `gmail.service` tests to assert a pending row is written instead of a transaction created.

---

## Frontend changes (`packages/ui`)

### New: crypto util + key/session management

- `src/lib/crypto/ai-key.ts` — WebCrypto helpers: `deriveKek(password, salt, iterations)`, `generateDek()`, `wrapDek`/`unwrapDek`, `encryptKey`/`decryptKey` (AES-GCM). No `any`.
- Session holder for the unwrapped DEK (context/singleton, backed by `sessionStorage` per decision #1). Populate at **login** (the sign-in flow has the password) and on setup.
- Hook `changePassword` to re-derive KEK and re-wrap the DEK, then PUT updated blobs.

### New: OpenRouter client util

- `src/lib/ai/openrouter.ts` — `chat({ apiKey, model, messages, responseFormat? })` calling `POST https://openrouter.ai/api/v1/chat/completions` with `HTTP-Referer`/`X-Title` headers; `listModels()` → `GET /api/v1/models`. Typed responses, no `any`.

### Settings — AI section (item 1 & 3)

- New Settings section/page: input for the OpenRouter API key (encrypt client-side → PUT blobs), model picker populated from `listModels()` (searchable), shows "key saved / not saved" status. Never sends the plaintext key to our API.

### Expense parser (item 4)

- Replace `ProfileApi.sendPrompt()` usage: build the seed prompt + JSON schema client-side (port `prompt.service.ts:50-92`, tags/vaults already in UI), decrypt key, call OpenRouter with structured output, map tag/vault **names → ids** client-side (port `prompt.service.ts:104-115`).
- Remove `sendPrompt` / `getTokenUsage` from `ProfileApi.ts` and their imports.

### Wizard chat (item 5)

- Port `WIZARD_PERSONA`, `TASKS`, and the per-prompt-key aggregation (`spendingBreakdown`/`budgetAdherence`/`savingOpportunities`/`spendingPatterns`) from `wizard.service.ts` into a UI hook/util (stats page already has transactions + vaults). Call OpenRouter with the persona as the system message.
- Delete `WizardApi.ts` + its export.

### Gmail pending expenses (item 6)

- `ProfileApi` (or new `PendingExpensesApi`): `getPendingExpenses()`, `getPendingExpenseEmail(id)`, `deletePendingExpense(id)`.
- On app load / login, fetch pending expense pointers → show a badge/list (e.g. `/pending` page or a panel on `/transactions`).
- Pressing a pending item: `getPendingExpenseEmail(id)` (server re-fetches from Gmail), build the extractor prompt + schema client-side (port `gmail-ai-extractor.service.ts` `EXTRACTOR_INSTRUCTIONS` + `RESPONSE_SCHEMA` + `validate`), decrypt key, call OpenRouter, then `createTransaction(...)` (vaultId from the row, `isCommitted: false` as today) and `deletePendingExpense(id)`. Handle `matched:false`/invalid → let the user dismiss.
- Migrate the watcher **dry-run** (`TestExtractModal.tsx`, `testExtract`) to the same client-side extractor call; drop `ProfileApi.testExtract`.

### Stats page

- Remove the "AI Token Usage" card + `tokenUsage` state + `getTokenUsage` effect (`stats/page.tsx` ~131-143, ~723-791).

---

## Suggested order (prove the OpenRouter parser first, do the Gmail pending queue last)

> The **Task breakdown** section below turns these steps into numbered, independently-filable tasks (T1–T20) with explicit `Blocked by` edges; this list is the high-level sequencing.
>
> **Sequencing decision:** the client-side OpenRouter expense parser is the highest-risk piece (browser crypto + user key + structured output). Build and **manually verify it end-to-end first** — that is the gate for everything else. All **`PendingGmailExpense` work is deferred to the very end** (entity, repo/service/routes, the `gmail.service` switch, the pending UI, and its tests), so nothing depends on the Gmail queue until the parser is proven.

1. **Shared:** add `ai-credentials.ts` + `pending-expenses.ts`, adjust `ai.ts`/`wizard.ts`; `npm run build:shared`.
2. **Backend additive (key only):** `UserAiCredential` entity → migration → repository → service → routes. Register entity, run migration. No deletions yet. **Skip `PendingGmailExpense` for now** (deferred to the end).
3. **Frontend:** crypto util, OpenRouter util, Settings AI section (save key + pick model).
4. **Frontend + manual gate:** migrate the expense parser to OpenRouter, then **manually verify parsing works end-to-end** (save a key, pick a model, parse a real prompt → correct `ParsedTransaction`). Do not proceed until this passes. Then migrate Wizard.
5. **Cleanup (safe now):** delete the `prompt`/`wizard` services + routes + tests, drop the Stats usage card + `UsageReport` contracts.
6. **Backend additive (deferred):** `PendingGmailExpense` entity → migration → repository → service → routes.
7. **Backend switch:** `gmail.service.handleMessage` writes a `PendingGmailExpense` pointer (stop calling the extractor). Update gmail tests.
8. **Frontend:** pending-expenses list + client-side parse-on-click; migrate watcher dry-run.
9. **Cleanup:** delete `gmail-ai-extractor` service + watcher test route + tests, remove `openai` dep + `OPENAI_*` env/secrets.
10. **Verify:** `npm run test:api`, `grep -riE "openai|OPENAI_" packages` returns nothing in app code, Prettier on touched files, API boots.

## Task breakdown

Discrete, GitHub-issue-sized tasks. They realize the **Suggested order** above; the `Blocked by` edges encode the hard dependencies. Groups: **Shared contracts → Backend (additive) → Frontend → Backend (switch) → Cleanup → Unit tests**. Each task is labelled `frontend`, `backend`, or `unit-tests` (only these labels).

> **Sequencing overlay (not a dependency change):** T9 (expense parser → OpenRouter) is the **manual-verify gate** — prove it end-to-end before starting anything downstream. All `PendingGmailExpense` tasks — **T3, T5, T11, T12, T16, T19, T20** — are scheduled **last**, after the parser + Wizard migration and their cleanup have shipped. Their `Blocked by` edges are unchanged; they are simply picked up at the end.

### Shared contracts

#### T1 — Add AI-credentials + pending-expenses contracts

- **Label:** `backend`
- **Blocked by:** —
- **Goal:** Add the new shared DTOs and prune the removed ones so both API and UI compile against the finalized shapes.
- **Touches:** `packages/shared/src/contracts/ai-credentials.ts` (new), `packages/shared/src/contracts/pending-expenses.ts` (new), `packages/shared/src/contracts/ai.ts`, `packages/shared/src/contracts/wizard.ts`, `packages/shared/src/contracts/index.ts`.
- **Steps:**
  1. Add `ai-credentials.ts` with `AiCredentialStatusDto`, `SetAiCredentialInput` (crypto blobs + `selectedModel`, **no plaintext key field**), `SetAiModelInput`.
  2. Add `pending-expenses.ts` with `PendingGmailExpenseDto` and `PendingExpenseEmailDto` (no email content persisted).
  3. In `ai.ts` drop `ModelUsage` / `UsageReport`; keep `ParsedTransaction`.
  4. In `wizard.ts` keep `WIZARD_PROMPT_KEYS` / `WizardPromptKey`; drop `WizardChatRequest` / `WizardChatResponse`.
  5. Re-export both new files from `contracts/index.ts`; run `npm run build:shared`.
- **Acceptance:**
  - [ ] New contracts exported from `@expense-tracker/shared`.
  - [ ] `ModelUsage`/`UsageReport`/`WizardChat*` no longer exported.
  - [ ] `npm run build:shared` compiles, no `any`.

### Backend (additive — no deletions)

#### T2 — Add `UserAiCredential` entity + migration

- **Label:** `backend`
- **Blocked by:** T1
- **Goal:** Persist the per-user E2E-encrypted key blobs and selected model.
- **Touches:** `packages/api/src/entities/UserAiCredential.entity.ts` (new), `packages/api/src/data-source.ts`, `packages/api/src/migrations/` (generated).
- **Steps:**
  1. Create the entity extending `BaseEntity` with columns per the data-model table (`userId` unique FK CASCADE, `salt`, `kdfIterations`, `dekIv`, `wrappedDek`, `keyIv`, `keyCiphertext`, `selectedModel` nullable). All crypto fields are opaque blobs.
  2. Register in `data-source.ts`.
  3. `npm run migration:generate` then `npm run migration:run`.
- **Acceptance:**
  - [ ] Migration applies cleanly and API boots.
  - [ ] Table has exactly the documented columns; no plaintext-key column.

#### T3 — Add `PendingGmailExpense` entity + migration

- **Label:** `backend`
- **Blocked by:** T1
- **Goal:** Store only a pointer to the Gmail message (no email body) as the review queue.
- **Touches:** `packages/api/src/entities/PendingGmailExpense.entity.ts` (new), `packages/api/src/data-source.ts`, `packages/api/src/migrations/` (generated).
- **Steps:**
  1. Create the entity extending `BaseEntity` with `userId` (FK CASCADE), `gmailMessageId`, `vaultId`, `guidanceHint` nullable. No `status`/body columns (soft-delete on resolve).
  2. Add unique index `['userId', 'gmailMessageId']` for idempotency.
  3. Register in `data-source.ts`; `npm run migration:generate` then `npm run migration:run`.
- **Acceptance:**
  - [ ] Migration applies cleanly; unique index present.
  - [ ] No email-content column exists.

#### T4 — `UserAiCredential` repository + service + routes

- **Label:** `backend`
- **Blocked by:** T2
- **Goal:** Owner-only CRUD for the encrypted key blobs + model, storing fields selectively.
- **Touches:** `packages/api/src/repositories/user-ai-credential.repository.ts` (new), `packages/api/src/services/user-ai-credential.service.ts` (new), `packages/api/src/routes/ai-credentials.routes.ts` + `routes/ai-credentials/*.route.ts` (new), `repositories/index.ts`, `services/index.ts`, route mount in `index.ts`.
- **Steps:**
  1. Repository wrapping TypeORM (lazy `getRepository`), upsert by `userId`.
  2. Service with business logic, throwing `AppError`; selectively map only whitelisted fields on write (never the raw request).
  3. Routes: `GET /api/users/:userId/ai-credentials` (status + blobs, owner only), `PUT /api/users/:userId/ai-credentials` (upsert blobs + model), `PUT /api/users/:userId/ai-credentials/model` (model only). Joi schemas typed to the shared DTOs, `asyncHandler`, `utilService` replies, `requireAuth`, no try/catch.
  4. Wire into `repositories/index.ts` / `services/index.ts` and mount.
- **Acceptance:**
  - [ ] Endpoints reachable, owner-guarded (401/403 for others).
  - [ ] Write persists only whitelisted fields; no plaintext key ever accepted/stored.
  - [ ] `npm run test:api` green.

#### T5 — `PendingGmailExpense` repository + service + routes (with on-demand email re-fetch)

- **Label:** `backend`
- **Blocked by:** T3
- **Goal:** List pending pointers, re-fetch the email body from Gmail at parse time (never stored), and soft-delete on resolve/dismiss.
- **Touches:** `packages/api/src/repositories/pending-gmail-expense.repository.ts` (new), `packages/api/src/services/pending-gmail-expense.service.ts` (new), `packages/api/src/routes/pending-expenses.routes.ts` + `routes/pending-expenses/*.route.ts` (new), `repositories/index.ts`, `services/index.ts`, route mount in `index.ts` (reuse existing Gmail OAuth client).
- **Steps:**
  1. Repository with soft-delete, list-by-user, idempotent insert (respect the unique index).
  2. Service: list → `PendingGmailExpenseDto`; email re-fetch → call Gmail via the user's OAuth token, return `PendingExpenseEmailDto`, persist nothing; resolve/dismiss → `softDelete` scoped to `userId`.
  3. Routes: `GET /pending-expenses` (list), `GET /pending-expenses/:id/email` (re-fetch, owner only), `DELETE /pending-expenses/:id` (soft-delete). Layering/guards/validation as above.
  4. Wire into indexes and mount.
- **Acceptance:**
  - [ ] Email body is returned only by the re-fetch endpoint and never written to the DB.
  - [ ] Soft-delete scoped to `userId`.
  - [ ] `npm run test:api` green.

### Frontend

#### T6 — Client crypto util + DEK session management

- **Label:** `frontend`
- **Blocked by:** T1
- **Goal:** WebCrypto helpers plus a session-held DEK captured at login and re-wrapped on password change.
- **Touches:** `packages/ui/src/lib/crypto/ai-key.ts` (new), DEK session holder (context/singleton, new), sign-in flow, `changePassword` flow.
- **Steps:**
  1. Implement `deriveKek(password, salt, iterations)` (PBKDF2, SHA-256, ≥310k), `generateDek`, `wrapDek`/`unwrapDek`, `encryptKey`/`decryptKey` (AES-GCM). No `any`.
  2. DEK session holder backed by `sessionStorage` (decision #1), cleared on logout.
  3. Populate the DEK at login (password available); on setup.
  4. Hook `changePassword`: re-derive KEK from new password, re-wrap DEK, PUT updated `wrappedDek`/`salt`.
- **Acceptance:**
  - [ ] Round-trip: encrypt→decrypt returns original key.
  - [ ] DEK survives refresh via `sessionStorage`; gone after logout.
  - [ ] Password change re-wraps DEK without re-encrypting the key.

#### T7 — OpenRouter client util

- **Label:** `frontend`
- **Blocked by:** T1
- **Goal:** Typed browser client for OpenRouter chat + model list.
- **Touches:** `packages/ui/src/lib/ai/openrouter.ts` (new).
- **Steps:**
  1. `chat({ apiKey, model, messages, responseFormat? })` → `POST https://openrouter.ai/api/v1/chat/completions` with `HTTP-Referer` / `X-Title` headers, supporting `response_format: json_schema`.
  2. `listModels()` → `GET https://openrouter.ai/api/v1/models` (no auth).
  3. Typed responses; graceful surfacing of OpenRouter error messages. No `any`.
- **Acceptance:**
  - [ ] `chat` returns structured JSON per schema.
  - [ ] `listModels` populates a picker; errors surfaced, not swallowed.

#### T8 — Settings AI section (save key + curated model picker)

- **Label:** `frontend`
- **Blocked by:** T4, T6, T7
- **Goal:** Let the user save an E2E-encrypted OpenRouter key and pick a model from a curated list.
- **Touches:** new Settings AI section/page (`packages/ui/src/...`), AI-credentials API client (new/added to `ProfileApi`).
- **Steps:**
  1. Key input → encrypt client-side (T6) → PUT blobs (T4). Never send plaintext to our API.
  2. Model picker from `listModels()` filtered to the curated list (gpt-4o, gpt-5-mini, etc. — decision #3), searchable; PUT model.
  3. Show "key saved / not saved" status; document that password reset loses the key.
- **Acceptance:**
  - [ ] Saving a key stores only ciphertext blobs (verify request payload).
  - [ ] Model selection persists and reloads.
  - [ ] Reset-loses-key note surfaced in UI.

#### T9 — Migrate expense parser to OpenRouter

- **Label:** `frontend`
- **Blocked by:** T7, T8
- **Goal:** Run the manual expense parse client-side via OpenRouter and remove the server round-trip.
- **Touches:** expense-parser component/hook (`packages/ui/src/...`), `packages/ui/src/lib/api/ProfileApi.ts`.
- **Steps:**
  1. Build seed prompt + JSON schema client-side (port `prompt.service.ts:50-92`); tags/vaults already in UI.
  2. Decrypt key (T6), call OpenRouter with structured output (T7), map tag/vault **names → ids** client-side (port `prompt.service.ts:104-115`).
  3. Remove `sendPrompt` / `getTokenUsage` from `ProfileApi.ts` and their imports.
- **Acceptance:**
  - [ ] Manual parse produces a `ParsedTransaction` end-to-end with no server AI call.
  - [ ] `ProfileApi` no longer references `sendPrompt` / `getTokenUsage`.
  - [ ] **Manual-verify gate:** with a real saved key + selected model, parsing a real prompt returns a correct `ParsedTransaction` (tags/vault resolved to ids). This must pass before any downstream / `PendingGmailExpense` task starts.

#### T10 — Migrate Wizard chat to OpenRouter

- **Label:** `frontend`
- **Blocked by:** T7, T8
- **Goal:** Run wizard chat client-side; drop the wizard API client.
- **Touches:** wizard UI hook/util (`packages/ui/src/...`), `packages/ui/src/lib/api/WizardApi.ts` (delete) + its export.
- **Steps:**
  1. Port `WIZARD_PERSONA`, `TASKS`, and per-prompt-key aggregation (`spendingBreakdown`/`budgetAdherence`/`savingOpportunities`/`spendingPatterns`) from `wizard.service.ts` into a UI hook (stats page has transactions + vaults).
  2. Call OpenRouter with the persona as the system message (T7).
  3. Delete `WizardApi.ts` and its export.
- **Acceptance:**
  - [ ] Each `WizardPromptKey` returns a response client-side.
  - [ ] `WizardApi` removed; no imports remain.

#### T12 — Pending-expenses list + client-side parse + watcher dry-run migration

- **Label:** `frontend`
- **Blocked by:** T5, T6, T7, T8
- **Goal:** Show pending Gmail expenses, parse them client-side on click, and migrate the watcher dry-run to the same client extractor.
- **Touches:** pending-expenses API client (`PendingExpensesApi` or `ProfileApi`), pending list/badge UI (`/pending` page or `/transactions` panel), `TestExtractModal.tsx`.
- **Steps:**
  1. Add `getPendingExpenses()`, `getPendingExpenseEmail(id)`, `deletePendingExpense(id)` clients.
  2. On load/login fetch pointers → badge/list.
  3. On item click: `getPendingExpenseEmail(id)`, build extractor prompt + schema client-side (port `gmail-ai-extractor.service.ts` `EXTRACTOR_INSTRUCTIONS` + `RESPONSE_SCHEMA` + `validate`), decrypt key, call OpenRouter, `createTransaction(...)` (`vaultId` from row, `isCommitted: false`), then `deletePendingExpense(id)`. Handle `matched:false`/invalid → dismiss.
  4. Migrate watcher dry-run to the same client extractor; drop `ProfileApi.testExtract`.
- **Acceptance:**
  - [ ] Clicking a pending item creates a transaction and removes the row.
  - [ ] Dry-run modal runs client-side; `testExtract` removed from `ProfileApi`.

#### T13 — Remove AI Token Usage card from Stats page

- **Label:** `frontend`
- **Blocked by:** —
- **Goal:** Remove the usage card + its state/effect so the removed backend usage route has no UI caller.
- **Touches:** `packages/ui/src/app/stats/page.tsx` (~131-143, ~723-791).
- **Steps:**
  1. Remove the "AI Token Usage" card JSX, `tokenUsage` state, and the `getTokenUsage` effect.
- **Acceptance:**
  - [ ] Stats page renders with no usage card and no `getTokenUsage` calls.

### Backend (switch — feeds the pending queue)

#### T11 — Switch `gmail.service.handleMessage` to write a pending pointer

- **Label:** `backend`
- **Blocked by:** T5
- **Goal:** On a matched watcher, enqueue a `PendingGmailExpense` (no email body, no server AI) instead of extracting + creating a transaction.
- **Touches:** `packages/api/src/services/gmail.service.ts` (~315-352 / constructor).
- **Steps:**
  1. Replace `aiExtractor.extract` + `transactions.create` with an insert of `PendingGmailExpense` (`gmailMessageId` + `vaultId` + `guidanceHint` only).
  2. Push-notify "Pending expense to review" (url `/pending` or `/transactions`); still `processedMessages.record(...)` for idempotency.
  3. Remove the `aiExtractor` dependency from the constructor and the `try/extract` block.
- **Acceptance:**
  - [ ] A matched message writes exactly one pending row (replay writes none extra) and no transaction.
  - [ ] No server-side AI call remains in `handleMessage`.
  - [ ] `npm run test:api` green (see T20).

### Cleanup (backend deletions — after frontend has shipped)

#### T14 — Delete prompt service + routes + tests

- **Label:** `backend`
- **Blocked by:** T9, T13
- **Goal:** Remove server-side expense-prompt and usage endpoints now unused by the UI.
- **Touches:** `packages/api/src/services/prompt.service.ts`, `routes/prompt/post-prompt.route.ts`, `routes/prompt/get-usage.route.ts`, `routes/prompt.routes.ts` + mount, `services/index.ts`, `src/tests/prompt.service.test.ts`.
- **Steps:** Delete the service, routes, mount, index export, and test.
- **Acceptance:**
  - [ ] Prompt/usage routes gone; API boots; `npm run test:api` green.

#### T15 — Delete wizard service + routes + tests

- **Label:** `backend`
- **Blocked by:** T10
- **Goal:** Remove the server wizard chat now that it runs client-side.
- **Touches:** `packages/api/src/services/wizard.service.ts`, `routes/wizard/*`, `routes/wizard.routes.ts` + mount, `services/index.ts`, `src/tests/wizard.service.test.ts`.
- **Steps:** Delete the service, routes, mount, index export, and test.
- **Acceptance:**
  - [ ] Wizard routes gone; API boots; `npm run test:api` green.

#### T16 — Delete gmail-ai-extractor service + watcher test route + tests

- **Label:** `backend`
- **Blocked by:** T11, T12
- **Goal:** Remove the server extractor and the server-side watcher dry-run route (now client-side).
- **Touches:** `packages/api/src/services/gmail-ai-extractor.service.ts`, the `POST /users/:userId/vault-watchers/test` route + any watcher routes calling the extractor, `services/index.ts`, any `gmail-ai-extractor` test.
- **Steps:** Confirm which watcher routes call the extractor, delete them and the service, remove index export and tests.
- **Acceptance:**
  - [ ] No route references `gmailAiExtractorService`; API boots; `npm run test:api` green.

#### T17 — Remove `openai` dependency + `OPENAI_*` env/secrets

- **Label:** `backend`
- **Blocked by:** T14, T15, T16
- **Goal:** Fully drop the OpenAI dependency and env/secret surface.
- **Touches:** `packages/api/package.json`, `packages/api/src/env.ts`, `.env`, `documentation/deployment.md` (and the `API_ENV` deploy secret).
- **Steps:**
  1. Remove `openai` from `package.json`.
  2. Remove `OPENAI_API_KEY` / `OPENAI_ADMIN_KEY` from `env.ts`, `.env`, and update `API_ENV` doc/secret.
  3. `grep -riE "openai|OPENAI_" packages` returns nothing in app code.
- **Acceptance:**
  - [ ] No `openai` dep, no `OPENAI_*` references in app code; API boots; `npm run test:api` green.

### Unit tests

#### T18 — Service tests for `UserAiCredential`

- **Label:** `unit-tests`
- **Blocked by:** T4
- **Goal:** Cover upsert/status/model-update, owner-scoping, and selective-field persistence.
- **Touches:** `packages/api/src/tests/user-ai-credential.service.test.ts` (new).
- **Steps:** Follow repo mock/factory/`AppError` conventions; assert only whitelisted fields are written and no plaintext key is accepted.
- **Acceptance:**
  - [ ] New suite green under `npm run test:api`.

#### T19 — Service tests for `PendingGmailExpense`

- **Label:** `unit-tests`
- **Blocked by:** T5
- **Goal:** Cover list, on-demand email re-fetch (nothing persisted), idempotent insert, and userId-scoped soft-delete.
- **Touches:** `packages/api/src/tests/pending-gmail-expense.service.test.ts` (new).
- **Steps:** Mock the Gmail client; assert the body is never written and soft-delete is scoped to `userId`.
- **Acceptance:**
  - [ ] New suite green under `npm run test:api`.

#### T20 — Update `gmail.service` test for the pending-queue behavior

- **Label:** `unit-tests`
- **Blocked by:** T11
- **Goal:** Assert a matched message writes a pending row (not a transaction) and stays idempotent on replay.
- **Touches:** `packages/api/src/tests/gmail.service.test.ts`.
- **Steps:** Replace transaction-creation assertions with pending-row assertions; assert no extractor call; assert replay writes no extra row.
- **Acceptance:**
  - [ ] Updated suite green; no assertion on server-side AI extraction remains.

## Verification per step

- Shared change → `npm run build:shared` compiles.
- Entity change → `npm run migration:generate` + `npm run migration:run` succeed.
- Service/route change → `npm run test:api` (scoped where possible).
- Gmail flow → unit test asserts a pending row written, not a transaction; manual: a matched push creates a pending row; clicking it in the UI parses + creates the transaction.
- Final → acceptance-criteria grep + full `npm run test:api`.

## Risks / notes

- **Lost key on password reset** is by design (E2E). Surface this clearly in the UI.
- **DEK lifetime:** decide refresh behavior (open question #1) before wiring login.
- **OpenRouter browser CORS + rate limits** are the user's own account's concern; handle errors gracefully in the UI (show OpenRouter's error message).
- **Idempotency:** keep `ProcessedGmailMessage` as the dedupe ledger; `PendingGmailExpense` is the review queue. A replayed message must not create a second pending row.
