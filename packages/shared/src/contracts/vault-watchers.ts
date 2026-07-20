/**
 * Per-vault Gmail bank-alert watcher. Each vault may attach exactly one Gmail
 * label plus an optional subject filter and guidance hint; a matching email is
 * turned into a transaction by an AI extractor (not a user-supplied script).
 * Replaces the old hardcoded bank parsers and, later, the `node:vm` script path.
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
  /** Optional free-text nudge appended to the AI extraction prompt. `null` = none. */
  guidanceHint: string | null;
}

/** Upsert payload for a vault's watcher. The vault id rides in the route path. */
export interface SetVaultGmailWatcherInput {
  gmailLabelId: string;
  gmailLabelName?: string;
  /** Optional case-insensitive subject substring; omit/empty for a catch-all. */
  subjectFilter?: string;
  /** Optional free-text nudge appended to the AI extraction prompt. */
  guidanceHint?: string;
}

/** The shape a matching email resolves to once the AI extractor accepts it. */
export interface ParsedEmailDto {
  title: string;
  amount: number;
  /** `yyyy-mm-dd`; defaults to today when the model omits it. */
  date: string;
  type: 'income' | 'expense';
  /** Resolved, validated tag ids the model judged relevant. */
  tagIds: string[];
}

/** Raw shape the AI extractor's structured output is parsed into before validation. */
export interface AiExtractResultDto {
  matched: boolean;
  title?: string;
  amount?: number;
  type?: 'income' | 'expense';
  tagIds?: string[];
}

/** Dry-run payload: preview what the AI would extract from a pasted sample email. */
export interface TestExtractInput {
  sample: {
    from: string;
    subject: string;
    bodyText: string;
  };
  /** Optional free-text nudge appended to the AI extraction prompt. */
  guidanceHint?: string;
}
