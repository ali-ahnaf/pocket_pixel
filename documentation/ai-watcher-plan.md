# Plan: AI-powered Gmail watchers (replace parse scripts with an LLM extractor)

## Goal

Replace the user-authored `parseScript` (`node:vm`) path with an **AI extractor**. A user
attaches a watcher to a vault by picking a Gmail **label** (+ optional subject filter). No
script. When a matching email arrives, its snippet is sent to the LLM **together with the
user's tag list**, and the model resolves:

- `amount` (positive number, transaction amount — never the balance)
- `title` (merchant/payee)
- `type` (`income` | `expense`)
- `tagIds` (subset of the user's existing tags the model judges relevant)

The resolved transaction is created in the watcher's vault. Nothing about regex/scripts
remains in the watcher config.

### Done when

- A watcher is `(vault + gmailLabelId + optional subjectFilter + optional guidanceHint)` — **no `parseScript`**.
- A matching email produces one transaction whose amount/title/type/tags come from the LLM.
- Model output is shape-guaranteed (Structured Outputs), validated, and hallucinated tag ids are dropped.
- Non-transaction emails (OTP, promo, statement) resolve to "skip" (`matched=false`) → no transaction.
- Replays never re-call the model or double-insert (idempotency preserved).
- `npm run build:shared`, `npm run test:api`, fresh `npm run migration:run` all pass.

## Key design decisions

1. **Extractor swaps in at the same seam.** `GmailScriptRunnerService.run(script, email)` →
   `GmailAiExtractorService.extract(email, tags, guidanceHint?)`. `handleMessage` calls the new
   service instead of the VM runner. Everything upstream (label/subject match, idempotency,
   `transactions.create`) is unchanged in shape — only the "email → parsed fields" step changes.
2. **`handleMessage` becomes async network-bound.** The extractor makes one OpenAI call per
   matching email. Cost/latency lands here. **Gate stays before the call:** `processedMessages.exists`
   is checked first, so a Pub/Sub replay short-circuits without paying for a second model call.
3. **Reuse the wizard's OpenAI wiring.** Same lazy client, same `OPENAI_API_KEY` env, same
   `responses.create` API as `WizardService`. New service, **not** folded into wizard (wizard = NPC
   chat, extractor = structured extraction — different concerns).
4. **Structured Outputs, not prose.** Call with `text.format = { type: 'json_schema', strict: true, ... }`
   so the model must return `{ matched, title, amount, type, tagIds }`. Parse `response.output_text`,
   then validate. Prose/refusal → treat as skip (`null`).
5. **AI auto-categorises via tags.** The user's full tag list `[{id, name}]` is sent as context; the
   model returns the subset of `id`s it deems relevant. This is why tags are sent. The watcher no
   longer needs a static `tagIds` config — categorisation is per-email. **Decision to confirm with
   user:** drop the static `tagIds` field entirely, or keep it as an always-applied floor unioned
   with the AI-picked ids. Plan assumes **drop static, AI decides** (simpler); easy to switch.
6. **Validate hard, fail safe.** Returned tag ids not in the user's set are dropped. `amount<=0`,
   empty title, or bad `type` → skip the email (`return null`), same "skip" semantics the VM path had.
7. **Optional per-watcher guidance.** Replace the `parseScript` text column with an optional
   `guidanceHint` (nullable) — a free-text nudge appended to the prompt (e.g. "these are always
   groceries", "ignore reward-point emails"). Not required.

## Files to touch — dependency order

Per repo rule: shared contracts → entity → migration → repository → service → routes → UI → tests.

### 1. Shared contracts — `packages/shared/src/contracts/vault-watchers.ts`

- `SetVaultGmailWatcherInput`: **remove** `parseScript`; **remove** `tagIds` (per decision 5);
  **add** optional `guidanceHint?: string`.
- `VaultGmailWatcherDto`: same swap — drop `parseScript` / `tagIds`, add `guidanceHint: string | null`.
- `ParsedEmailDto`: **add** `tagIds: string[]` (the resolved, validated tag ids). Keep `title/amount/type/date`.
- Add an extractor result contract for the dry-run route (see §7), e.g.
  `AiExtractResultDto { matched: boolean; title?: string; amount?: number; type?: 'income'|'expense'; tagIds?: string[] }`.
- **After editing:** `npm run build:shared`.

### 2. Entity — `packages/api/src/entities/VaultGmailWatcher.entity.ts`

- Drop the `parseScript` column; drop `tagIds` column (per decision 5).
- Add `@Column({ type: 'text', nullable: true }) guidanceHint: string | null`.
- Update the class doc comment (no more "user-supplied JS script"; now "AI-extracted").
- Leave the `(userId, vaultId)` unique index and label index as-is (unless the multi-watcher plan
  lands first — coordinate with `multi-watcher-plan.md`; the two plans overlap on this entity/routes).

### 3. Migration — `packages/api/src/migrations/`

- `npm run migration:generate` after the entity change (do **not** hand-write). Expect: drop
  `parseScript` + `tagIds` columns, add `guidanceHint`.
- `npm run migration:run` from repo root; confirm clean against `packages/api/pocket_pixel.sqlite`.
- Confirm `Z-seed-data.ts` still sorts last.
- **Data note:** dropping `parseScript` discards existing scripts. Fine pre-launch; if watchers exist
  in prod, they silently switch to AI extraction on next matching email.

### 4. Repository — `packages/api/src/repositories/vault-gmail-watchers.repository.ts`

- No structural change beyond the dropped columns. `createEntity` / `save` / `findManyForUser` /
  `findByVault` all carry through. (`findManyForUser` still feeds the label union + match.)

### 5a. New service — `packages/api/src/services/gmail-ai-extractor.service.ts`

- Class `GmailAiExtractorService` modelled on `WizardService`:
  - Lazy `OpenAI()` client; guard `if (!process.env.OPENAI_API_KEY) throw AppError(..., 500)`.
  - `async extract(email: GmailMessageContent, tags: {id: string; name: string}[], guidanceHint?: string | null): Promise<ParsedEmailDto | null>`.
  - Build `instructions` = extractor system prompt (see below). `input` = JSON of
    `{ email: {from, subject, bodyText, emailDate}, availableTags: tags, guidance: guidanceHint ?? null }`.
  - Call `responses.create({ model: 'gpt-4o-mini', instructions, input, text: { format: <json_schema> } })`.
  - `JSON.parse(response.output_text)`; if parse fails or `matched === false` → `return null`.
  - **Validate** (mirror `GmailScriptRunnerService.validate`): title non-empty, amount finite `>0`,
    type in set; **filter** returned `tagIds` to ids present in `tags`. Bad shape → `return null`
    (skip). Default `date` to today.
- **System prompt seed** (store as a const in the service):
  > You are a bank/card transaction email parser. You receive one alert email plus the user's tag
  > list. Extract exactly one transaction. `amount` = the transaction amount only — never the account
  > balance, available limit, reward points, or any phone/reference number; strip thousands
  > separators; positive and finite. `type` = "expense" when money leaves (spent, debited, purchase,
  > withdrawn, card transaction, paid), "income" when money enters (credited, received, deposit,
  > refund, salary). `title` = merchant/payee, stripped of trailing numeric terminal codes; fall back
  > to "Bank transaction". `tagIds` = the subset of the provided tag ids whose names best fit this
  > spend; [] if none fit. If the email is not a transaction (OTP, promo, statement, balance-only),
  > set matched=false. Invent nothing not present in the email.
- **JSON schema** (strict): object, `required: [matched, title, amount, type, tagIds]`,
  `matched:boolean`, `title:string`, `amount:number`, `type:{enum:[income,expense]}`,
  `tagIds:{type:array, items:{type:string}}`, `additionalProperties:false`.
- Instantiate + export from `services/index.ts` (`gmailAiExtractorService`).

### 5b. Gmail fire path — `packages/api/src/services/gmail.service.ts`

- Constructor: inject `TagsRepository` and `GmailAiExtractorService` (default shared singletons),
  alongside the existing deps. **Remove** the `GmailScriptRunnerService` dep.
- `handleMessage` (`gmail.service.ts:307`):
  - Keep `processedMessages.exists` gate **first** (protects cost).
  - After `matchWatcher` returns a watcher: load `tags = await this.tags.findManyForUser(userId)`,
    map to `{id, name}`.
  - `const parsed = await this.aiExtractor.extract(content, tags, watcher.guidanceHint);` (wrap in the
    existing try/catch → log + skip on throw).
  - On `parsed`: `transactions.create(userId, { amount, type, title: title.toLowerCase(), date,
vaultId: watcher.vaultId, tagIds: parsed.tagIds.length ? parsed.tagIds : undefined,
isCommitted: false })`.
  - `record` once after, unchanged.
- `matchWatcher` return type drops `parseScript`/`tagIds`, keeps `{ vaultId, guidanceHint }`.

### 5c. Delete — `packages/api/src/services/gmail-script-runner.service.ts` + its test

- Remove the VM runner service and `gmail-script-runner.service.test.ts` (no longer a code path).
  Drop it from `services/index.ts`.

### 6. Routes — `packages/api/src/routes/vault-watchers/`

- `put-vault-watcher.route.ts`: update the Joi schema — remove `parseScript` (was required) and
  `tagIds`; add optional `guidanceHint` (string, allow empty/null). Body now `{ gmailLabelId,
gmailLabelName?, subjectFilter?, guidanceHint? }`.
- Keep routes thin, `asyncHandler`, no try/catch.

### 7. Dry-run test route (rebuild, AI version) — `packages/api/src/routes/vault-watchers/test-extract.route.ts`

- The old `test-parse-script.route.ts` was deleted (git status). Re-add an **AI** dry-run so users can
  preview extraction before saving: body `{ sample: { from, subject, bodyText }, guidanceHint? }`,
  loads the user's tags, calls `gmailAiExtractorService.extract`, returns `AiExtractResultDto`.
  Mount it in `vault-watchers.routes.ts`. Add matching contract + `ProfileApi` method.

### 8. UI — `packages/ui`

- `ProfileApi.ts`: `setVaultWatcher` payload drops `parseScript`/`tagIds`, adds `guidanceHint`;
  add `testExtract(userId, { sample, guidanceHint })` for the dry-run.
- `VaultWatcherCard.tsx`: remove the script editor + tag picker; keep label + subject picker; add an
  optional "guidance" textarea and a "Test on a pasted email" preview showing the AI's resolved
  amount/title/type/tags. Copy update: "AI reads the email and fills in the transaction."

### 9. Tests

- **New** `packages/api/src/tests/gmail-ai-extractor.service.test.ts`: mock the OpenAI client
  (`responses.create`), assert: valid JSON → `ParsedEmailDto`; `matched:false` → `null`; hallucinated
  tag id filtered out; `amount<=0`/empty title → `null`; missing `OPENAI_API_KEY` → `AppError`.
  Follow `write-service-test` conventions (mock/factory/AppError).
- **Update** `vault-watchers.service.test.ts`: drop `parseScript`/`tagIds` assertions; assert
  `guidanceHint` round-trips.
- **Update** `gmail.service.test.ts`: replace script-runner expectations with a mocked extractor;
  assert `extract` called with the email + tag list, transaction created with AI fields, `record`
  once, replay short-circuits before `extract` is called.
- `npm run test:api` (and `-- --runInBand`).

## Verification checklist

- [ ] `npm run build:shared` clean.
- [ ] `npm run migration:run` applies the drop-columns / add-`guidanceHint` migration cleanly.
- [ ] `npm run test:api` green (new extractor suite + updated gmail/service suites).
- [ ] Manual dry-run: paste the FRESH TODAY sample → `{ amount:1456, title:'FRESH TODAY', type:'expense', tagIds:[...] }`.
- [ ] Manual: matching email creates the txn; replay creates nothing and makes no second model call.
- [ ] `npx prettier --write` on every touched file.
- [ ] `documentation/DEPLOY.md` / `API_ENV` secret already carries `OPENAI_API_KEY` (wizard uses it) — confirm, no new secret needed.

## Notes

1. **Model** — instead of `gpt-4o-mini` use stronger model for extraction accuracy
2. Remove the regex parser code path
