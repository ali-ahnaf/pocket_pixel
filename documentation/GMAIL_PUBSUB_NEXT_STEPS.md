# Gmail Pub/Sub phase — agent instructions

Goal: bank alert email arrives in user's Gmail → push notification (Pub/Sub) → pull new messages via History API → parse → create transaction. No polling.

## Existing foundation (DO NOT rebuild)

Per-user Gmail OAuth is merged. Users bring their own Google OAuth client; all secrets/tokens stored AES-256-GCM encrypted.

- Entity: [UserOAuthCredential.entity.ts](../packages/api/src/entities/UserOAuthCredential.entity.ts) — `google{ClientId,ClientSecret,AccessToken,RefreshToken}Encrypted`, `googleTokenExpiry`, `googleEmail`.
- Service: [user-oauth-credential.service.ts](../packages/api/src/services/user-oauth-credential.service.ts) — sole owner of encrypt/decrypt. Key methods:
  - `authorizedGoogleFetch(userId, url, init?)` — **use for every Gmail API call**; attaches bearer, refresh-on-401 once, throws `AppError('Gmail not connected', 400)` if no token.
  - `refreshAccessToken(userId)` — rarely needed directly.
- Utils: [google-oauth.util.ts](../packages/api/src/utils/google-oauth.util.ts), [oauth-credentials-encryption.util.ts](../packages/api/src/utils/oauth-credentials-encryption.util.ts) (needs `OAUTH_CREDENTIALS_ENCRYPTION_KEY`).
- Public callback route: [oauth.routes.ts](../packages/api/src/routes/oauth.routes.ts) → [google-callback.route.ts](../packages/api/src/routes/oauth/google-callback.route.ts).
- Scope: `gmail.readonly` only. Test pattern: [user-oauth-credential.service.test.ts](../packages/api/src/tests/user-oauth-credential.service.test.ts) (mocked fetch).

## Rules (repo conventions)

Route → service → repository → entity. Thin routes, `asyncHandler`, no try/catch, reply via `utilService`, `Router({ mergeParams: true })`. `AppError` in services. Shared DTOs in `packages/shared/src/contracts/` + `npm run build:shared`. New entity → register in `data-source.ts`, `npm run migration:generate` then `migration:run`, trim migration to your table only. No raw payload persistence; soft delete; no `any`; `npx prettier --write <file>` after edits.

## Decisions (RESOLVED)

1. **Pub/Sub ownership**: single app-owned topic + one subscription. Watch targets `GMAIL_PUBSUB_TOPIC`; webhook routes to a user by `emailAddress` → `googleEmail`.
2. **Label strategy**: user-created label(s). The user makes a Gmail filter routing bank alerts to a label; the settings page has a label picker; the watch + history diff filter on the chosen `gmailLabelIds`.
3. **Webhook processing**: inline. The service swallows processing errors so the endpoint always acks 2xx; the `processed_gmail_messages` ledger keeps replays idempotent.

## Status — all tasks implemented (branch `feat/242`)

Tasks 1–7 are built and unit-tested (`npm run test:api -- gmail`). Remaining human action is the one-time GCP setup below plus setting `GMAIL_PUBSUB_TOPIC` / `GMAIL_PUBSUB_AUDIENCE` in `API_ENV`. Message fetching uses a bounded parallel fan-out of `format=full` GETs rather than the multipart `/batch` endpoint (bank-alert pushes carry ~1 message) — see the note in `services/gmail.service.ts` `fetchMessages`.

## GCP setup (one-time, manual — document for whoever owns the topic)

1. Create Pub/Sub topic `projects/<proj>/topics/pp-gmail-incoming`.
2. Grant `gmail-api-push@system.gserviceaccount.com` the **Pub/Sub Publisher** role on it.
3. Create push subscription → endpoint `${APP_BASE_URL}/api/oauth/gmail/webhook`, with OIDC auth.

## Numbered build tasks (each = one small, testable PR; split FE/BE issues, link "blocked by")

### Task 1 — schema

1. Add to `UserOAuthCredential`: `gmailHistoryId` (varchar, nullable), `gmailWatchExpiry` (datetime, nullable), `gmailLabelIds` (text/json, nullable).
2. Add dedupe: `gmailMessageId` column on transactions OR `processed_gmail_messages` table.
3. `npm run migration:generate`, trim to these tables, `npm run migration:run`.

### Task 2 — GmailService watch

1. New `GmailService` with `startWatch(userId)` / `stopWatch(userId)` via `authorizedGoogleFetch`:
   ```
   POST https://gmail.googleapis.com/gmail/v1/users/me/watch
   { "topicName": "projects/<proj>/topics/pp-gmail-incoming", "labelIds": ["<LABEL_ID>"], "labelFilterBehavior": "INCLUDE" }
   ```
2. Persist response `historyId` (baseline for first diff) + `expiration`.
3. Unit-test with mocked fetch (follow existing test pattern).

### Task 3 — webhook route

1. New **public** route `POST /api/oauth/gmail/webhook` next to OAuth callback in `oauth.routes.ts` — **no `requireAuth`** (Google calls it).
2. Body: `{ "message": { "data": "<base64>", "messageId", "publishTime" }, "subscription" }`; `data` decodes to `{ "emailAddress", "historyId" }`.
3. Handler, in order:
   1. Verify OIDC bearer token (Google-signed, audience = `GMAIL_PUBSUB_AUDIENCE`). Reject otherwise; never trust body alone.
   2. Look up user by `emailAddress` vs `googleEmail`. Unknown → `200` and drop.
   3. Incoming `historyId` not newer than stored → `200`, stop.
   4. Else run history diff (Task 4), then store new `historyId`.
   5. **Always return `200` fast** — non-2xx makes Pub/Sub retry; keep idempotent (`messageId` dedupes). Errors must not 500 into retry storm.
4. Unit-test.

### Task 4 — history diff

1. `GET /gmail/v1/users/me/history?startHistoryId=<stored>&historyTypes=messageAdded&labelId=<LABEL_ID>` (repeat per watched label).
2. Collect `history[].messagesAdded[].message.id`, dedupe.
3. Fetch each: `GET /gmail/v1/users/me/messages/{id}?format=full` — **batched** (https://developers.google.com/workspace/gmail/api/guides/batch) to avoid rate limits.
4. On 404/"historyId too old": fall back to bounded `messages.list` by label, re-baseline `historyId`.
5. All via `authorizedGoogleFetch`. Unit-test with fixture history payloads.

### Task 5 — parsers → transactions

1. Bank parsers (BRAC first, then EBL, …): extract amount, debit/credit, merchant, date, account tail. Strategy map keyed by sender/subject; parsers isolated.
2. Create transactions ONLY through existing [transactions.service.ts](../packages/api/src/services/transactions.service.ts).
3. Idempotency: store Gmail `message.id` (Task 1 dedupe) so replays never double-insert.
4. Unit-test parsers against real sample email bodies.

### Task 6 — watch renewal cron

1. Watch expires ~7 days; re-`watch` daily via node-cron. Follow [recurring-scheduler.ts](../packages/api/src/scheduler/recurring-scheduler.ts) pattern incl. `restoreAllRecurringJobs()`-style boot re-register, driven by `gmailWatchExpiry`.

### Task 7 — UI

1. Label picker on Gmail settings page + "watching / last synced" status.

## Env to add (also update `API_ENV` secret — see [DEPLOY.md](./DEPLOY.md))

- `GMAIL_PUBSUB_TOPIC` — full topic name.
- `GMAIL_PUBSUB_AUDIENCE` — expected OIDC audience for webhook verification.
- (`APP_BASE_URL` already exists.)

## Reference

- Push: https://developers.google.com/workspace/gmail/api/guides/push
- History: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.history/list
- Batch: https://developers.google.com/workspace/gmail/api/guides/batch
- Web-server OAuth: https://developers.google.com/workspace/gmail/api/auth/web-server
