---
name: gmail-parse-script
description: Write the `guidanceHint` for a vault Gmail watcher from a sample bank or alert email, so the AI extractor turns that email into a transaction correctly. Use when the user gives a sample email (or describes one) and wants it parsed, or asks for a parse script for a Gmail watcher.
---

# Gmail watcher guidance hint

This repo has no parse-script mechanism. An earlier `parseScript` (user-authored JS run in `node:vm`) was removed by migration `ReplaceParseScriptWithGuidanceHint`. Do not write a `parse(email)` function.

Today a matching email is turned into a transaction by an AI extractor. The only thing a user authors per watcher is an optional free-text `guidanceHint` (max 2000 characters). This skill writes that hint, plus the watcher's `subjectFilter` when useful.

## How it works

1. A Gmail push reaches `GmailService` (`packages/api/src/services/gmail.service.ts`). `matchWatcher` picks a vault watcher by label and `subjectFilter` (case-insensitive substring; no filter means catch-all for the label).
2. The API stores only a pointer in `PendingGmailExpense`: `gmailMessageId`, `vaultId`, `subject`, `guidanceHint`. No email body is stored and no AI runs on the server.
3. When the user reviews the pending item, the UI re-fetches the email through the `GET /:id/email` pending-expenses route (`routes/pending-expenses/get-pending-expense-email.route.ts`, returns `PendingExpenseEmailDto`: `from`, `subject`, `bodyText`, `emailDate`). `bodyText` is already decoded and HTML-stripped by `packages/api/src/utils/gmail-message.util.ts`.
4. The browser runs `extractTransactionFromEmail` in `packages/ui/src/lib/ai/gmail-extractor.ts` with the user's own OpenRouter key and model. It sends `{ referenceDate, email, availableTags, guidance }` to the model and validates the reply.

Contracts live in `packages/shared/src/contracts/vault-watchers.ts` and `pending-expenses.ts`: `VaultGmailWatcherDto`, `SetVaultGmailWatcherInput`, `AiExtractResultDto`, `ParsedEmailDto`, `TestExtractInput`.

## What the extractor already does

Read `EXTRACTOR_INSTRUCTIONS` in `gmail-extractor.ts` before writing a hint. Do not repeat these in the hint:

- amount is the transaction amount only, not balance, limit, points or reference numbers; thousands separators stripped
- type: spent, debited, purchase, withdrawn, paid mean `expense`; credited, received, deposit, refund, salary mean `income`
- title is the merchant or payee, falling back to "Bank transaction"
- tagIds are picked from the user's tags, `[]` if none fit
- non-transactions (OTP, promo, statement, balance-only) return `matched: false` and are skipped

Output is validated into `ParsedEmailDto`: non-empty `title`, finite `amount > 0`, `type` of `income` or `expense`, `tagIds` filtered to real tag ids, `date` as `yyyy-mm-dd`.

## Dates

- `referenceDate` is the email's date (RFC 2822 `Date` header or ISO), converted to a local `yyyy-mm-dd` by `toReferenceDate`, falling back to today if missing or unparsable.
- The model returns `date` as `yyyy-mm-dd`. If it is not a real calendar date (for example `2026-02-30` or `10/01/2026`), validation falls back to `referenceDate`.
- Guidance may shift the date, for example "book on the 1st of next month" for a billing cycle. Relative dates are computed from `referenceDate`, never from today. Phrase date hints that way.

## Process

1. Get the sample. Ask for the raw email (from, subject, body text, date) if not given. Never invent wording that is not in the sample. If it contains real account numbers or personal data, flag that pasting it into chat is an exposure and ask for a redacted version.
2. Decide whether a hint is needed at all. If the defaults above already handle the email, say so and return an empty hint. Do not pad.
3. Write a short hint only for what the defaults miss. Typical cases:
   - the wrong number sits near the amount (for example a fee or foreign-currency figure next to the billed amount)
   - the title should be a specific field (for example "use the text after 'at'")
   - type is ambiguous (for example a card refund that should count as income)
   - the date should follow a rule (billing cycle, value date instead of send date)
   - a fixed tag preference
4. Quote the exact words from the sample the hint relies on, and keep it under 2000 characters. Plain sentences, no markup.
5. If several vaults share one label, suggest a `subjectFilter` (case-insensitive substring of the subject, max 500 characters) so each watcher fires on its own emails.

## Verifying

- Dry run: the settings UI `TestExtractModal` (`packages/ui/src/app/settings/google-oauth/TestExtractModal.tsx`) takes a pasted sample plus the hint and shows an `AiExtractResultDto`. It runs in the browser with the user's own key, so only the user can run it. Ask them to paste the result.
- Unit tests: `packages/ui/src/lib/ai/gmail-extractor.test.ts` (Vitest, mocks `chat`). It covers `toReferenceDate`, guidance passthrough and date fallback. Run `npm run test:ui:unit` from the repo root. Extend it only if you change extractor code, which this skill does not do.
- The model output is not deterministic, so never claim a hint "works". Say what it is meant to do and ask for the dry-run result.

## Delivering

Hand back the hint text, the suggested `subjectFilter` if any, and one line saying which phrase in the sample each part of the hint relies on. The user pastes the hint into the watcher form (`VaultWatcherCard`). Do not change extractor code, the prompt or the shared contracts as part of this skill.

## Offline note (open decision)

The long-term plan is an offline-first Expo app in `packages/app` with no API server and local SQLite. Gmail watching depends on the server today (OAuth tokens, Pub/Sub push, history diff, the pending queue), and the extractor needs network for OpenRouter. How, or whether, email extraction works offline is undecided. Until the user decides, this skill describes the current web and API behaviour only.
