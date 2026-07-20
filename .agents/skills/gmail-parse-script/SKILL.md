---
name: gmail-parse-script
description: Write a vault watcher `parse(email)` JS script from a sample bank/alert email, for the Gmail-to-transaction pipeline. Use when the user gives a sample email (or describes one) and wants a parseScript for a Vault Gmail Watcher.
---

# Gmail watcher parse script

Vault watchers turn matching Gmail messages into transactions. Each watcher stores a user-authored `parseScript` string that `GmailScriptRunnerService` (`packages/api/src/services/gmail-script-runner.service.ts`) runs in a locked-down `node:vm` context — no `require`, `process`, `fetch`, timers; 1s timeout.

## Input contract — `email`

Script sees one global, `email: GmailMessageContent` (`packages/api/src/utils/gmail-message.util.ts`):

```ts
interface GmailMessageContent {
  from: string; // raw From header, e.g. "Bank Alerts <alerts@bank.com>"
  subject: string; // raw Subject header
  bodyText: string; // decoded body, HTML already stripped to plain text, whitespace collapsed
  emailDate: string | null; // Date header or internalDate, ISO-ish string
}
```

`bodyText` is already de-HTML'd — never write `<[^>]+>` stripping in the script, it's done upstream.

## Output contract — return of `parse(email)`

Must be `function parse(email) { ... }` (exact name, top-level). Return either:

- `null` / `undefined` — not a matching transaction, skip silently (also the result of a thrown error or timeout).
- an object validated by `GmailScriptRunnerService.validate` against `ParsedEmailDto`:

```ts
{
  title: string; // non-empty after trim
  amount: number; // finite, > 0 — never negative, sign comes from `type` not the number
  type: 'income' | 'expense'; // exactly one of these two strings
}
```

Any other shape throws `AppError(..., 400)` — surfaced to the user via the dry-run test endpoint, not silently skipped like a runtime error.

## Process

1. **Get the sample.** Ask the user to paste the raw email (or at least subject + body text) if not already given. Prefer real sample over a guess — bank alert formats vary a lot (currency placement, comma vs period decimals, HTML tables collapsed to text, debit/credit wording).
2. **Identify the signal for `type`.** Look for wording like "debited"/"spent"/"purchase" → `expense`; "credited"/"received"/"deposit" → `income`. Pick the exact keyword(s) present in the sample body and match on those — don't guess a keyword that isn't in the sample.
3. **Identify the amount.** Write a regex against `email.bodyText` (or `subject` if the amount lives there) that captures the numeric amount, handling thousands separators (`1,500.00` → strip commas) and currency prefix/suffix as it appears in the sample. Use `Number(...)` and confirm `> 0`.
4. **Identify the title.** Usually the merchant/payee name near the amount, or a fixed label plus a merchant field extracted from the body. Keep it non-empty in every real-match case — if extraction can fail, fall back to a static string like `'Bank transaction'` rather than letting a bad match slip an empty string through (which throws).
5. **Date (optional).** Only extract when the sample has a clean date field; otherwise omit `date` and let the default (today) apply. If extracting, coerce to strict `yyyy-mm-dd` — anything else throws.
6. **Guard against false matches.** If the regex might not find the amount (e.g. email doesn't match this format), `return null` rather than throwing — a thrown error and a `null` return behave identically (skip), but a _found-but-malformed_ result should still throw so the user's dry-run test surfaces the bug instead of silently skipping. Concretely: guard the regex match and `return null` if it's absent; don't guard the object shape once you've decided to return one.
7. **Keep it self-contained.** No helper functions defined outside `parse`; inline everything inside the function body (the whole script is executed as `<script>\n;parse(email);`, so a top-level `function parse` plus optional top-level `const`/`function` helpers above it are fine, but nothing after it and no I/O).

## Example (from this repo's test fixture)

Sample: `from: 'alerts@bank.com'`, `subject: 'Transaction Alert'`, `bodyText: 'You spent BDT 1,500.00 at DARAZ'`.

```js
function parse(email) {
  const m = email.bodyText.match(/BDT ([\d,]+(?:\.\d+)?)/);
  if (!m) return null;
  return {
    title: email.subject,
    amount: Number(m[1].replace(/,/g, '')),
    type: 'expense',
    date: undefined, // omit -> defaults to today; set 'yyyy-mm-dd' if the email has a reliable date
  };
}
```

## Verifying the script

- Unit-test style check: `packages/api/src/tests/gmail-script-runner.service.test.ts` shows the exact validation rules — reuse its `email(...)` factory shape when reasoning about edge cases.
- The product has a live dry-run: `PUT`-adjacent route `packages/api/src/routes/vault-watchers/test-parse-script.route.ts` takes `TestParseScriptInput { script, sample: { from, subject, bodyText } }` and returns `TestParseScriptResultDto { ok, result?, error? }` — mention this to the user as the way to try the script against a pasted sample before saving it to a watcher.
- Never claim a script "works" without either running it through that dry-run contract mentally against the exact sample text, or asking the user to paste dry-run output.

## Delivering the result

Hand back just the script body (the `function parse(email) {...}` block) plus one line noting what regex/keyword it keys off of, so the user can paste it straight into the watcher's `parseScript` field. Don't wrap it in extra scaffolding — the VM only expects `parse` defined.
