import vm from 'node:vm';
import { ParsedEmailDto } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { GmailMessageContent } from '../utils/gmail-message.util';

/** ISO calendar-date shape a script may return; anything else is rejected. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Hard ceiling on how long a user script may run before the VM aborts it. */
const SCRIPT_TIMEOUT_MS = 1000;

/**
 * Runs a user-supplied parse script against one email inside a `node:vm` context.
 *
 * The script defines `function parse(email) { ... }` and returns a transaction
 * (`{ title, amount, date?, type }`) or `null`/`undefined` for "not a
 * transaction, skip". The context exposes only `{ email }` — no `require`,
 * `process`, `fetch`, timers or other globals — and the run is bounded by a ~1s
 * timeout. This is NOT a security boundary against a hostile author; it is
 * acceptable only because the user runs their own script (see the plan's notes).
 *
 * Return contract:
 *  - a validated `ParsedEmailDto` when the script returns a well-formed object;
 *  - `null` when the script returns null/undefined, throws, or times out (the
 *    webhook path treats all of these as "skip this message");
 *  - throws `AppError(…, 400)` when the script returns a non-null value whose
 *    shape is invalid — surfaced by the in-page test endpoint.
 */
export class GmailScriptRunnerService {
  run(script: string, email: GmailMessageContent): ParsedEmailDto | null {
    let raw: unknown;
    try {
      const context = vm.createContext(Object.freeze({ email }));
      raw = vm.runInContext(`${script}\n;parse(email);`, context, { timeout: SCRIPT_TIMEOUT_MS });
    } catch {
      // Runtime error, missing `parse`, or timeout — nothing to record, skip.
      return null;
    }

    if (raw === null || raw === undefined) return null;
    return this.validate(raw);
  }

  /** Validates and normalises the script's return value into a `ParsedEmailDto`. */
  private validate(raw: unknown): ParsedEmailDto {
    if (typeof raw !== 'object') throw new AppError('Script must return an object with { title, amount, type }', 400);

    const { title, amount, type, date } = raw as Record<string, unknown>;

    if (typeof title !== 'string' || title.trim().length === 0) throw new AppError('Parsed "title" must be a non-empty string', 400);
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) throw new AppError('Parsed "amount" must be a number greater than 0', 400);
    if (type !== 'income' && type !== 'expense') throw new AppError('Parsed "type" must be "income" or "expense"', 400);
    if (date !== undefined && (typeof date !== 'string' || !DATE_RE.test(date))) throw new AppError('Parsed "date" must be in yyyy-mm-dd format', 400);

    return {
      title: title.trim(),
      amount,
      type,
      date: (date as string | undefined) ?? new Date().toISOString().split('T')[0],
    };
  }
}
