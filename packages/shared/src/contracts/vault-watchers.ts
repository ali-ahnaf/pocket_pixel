/**
 * Per-vault Gmail bank-alert watcher. Each vault may attach exactly one Gmail
 * label plus a user-supplied JS script that turns a matching email into a
 * transaction created in that vault. Replaces the old hardcoded bank parsers.
 */
export interface VaultGmailWatcherDto {
  vaultId: string;
  vaultName: string;
  gmailLabelId: string;
  /** Display-only label name captured when the watcher was saved. */
  gmailLabelName: string | null;
  /**
   * Case-insensitive substring the email subject must contain for this watcher to
   * fire. `null` = catch-all: any email on the label matches. Lets several vaults
   * share one label and route by subject.
   */
  subjectFilter: string | null;
  /** User JS: `function parse(email) { ... }` returning a transaction or null. */
  parseScript: string;
  /** Tag ids applied to every transaction this watcher creates. */
  tagIds: string[];
}

/** Upsert payload for a vault's watcher. The vault id rides in the route path. */
export interface SetVaultGmailWatcherInput {
  gmailLabelId: string;
  gmailLabelName?: string;
  /** Optional case-insensitive subject substring; omit/empty for a catch-all. */
  subjectFilter?: string;
  parseScript: string;
  /** Tag ids to apply to every transaction this watcher creates; omit for none. */
  tagIds?: string[];
}

/** The shape a watcher's `parse(email)` must return for a matching email. */
export interface ParsedEmailDto {
  title: string;
  amount: number;
  /** `yyyy-mm-dd`; defaults to today when the script omits it. */
  date: string;
  type: 'income' | 'expense';
}

/** Request to dry-run a parse script against a pasted sample email in the UI. */
export interface TestParseScriptInput {
  script: string;
  sample: {
    from: string;
    subject: string;
    bodyText: string;
  };
}

/**
 * Result of a dry-run. `ok` is true when the script ran and returned a valid
 * transaction; `error` carries the validation/runtime message otherwise. A
 * script that returns null (not a transaction) is `ok: false` with no result.
 */
export interface TestParseScriptResultDto {
  ok: boolean;
  result?: ParsedEmailDto;
  error?: string;
}
