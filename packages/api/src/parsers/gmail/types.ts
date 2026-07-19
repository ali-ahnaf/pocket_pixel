/** Normalised, decoded view of a Gmail message the bank parsers read from. */
export interface BankMessageContent {
  from: string;
  subject: string;
  bodyText: string;
  /** The message `Date` header (or internalDate ISO), used as a date fallback. */
  emailDate: string | null;
}

/** A transaction a bank parser extracted from an alert email. */
export interface ParsedBankTransaction {
  amount: number;
  type: 'expense' | 'income';
  title: string;
  /** `yyyy-mm-dd`; when absent the transactions service defaults to today. */
  date?: string;
  /** Last few digits of the account/card the alert referenced, if present. */
  accountTail?: string;
}

/**
 * One bank's alert-email parser. `matches` is the strategy key (sender/subject);
 * `parse` returns null when the email matched the bank but isn't a transaction
 * alert we can read (e.g. an OTP or statement notice).
 */
export interface BankParser {
  readonly bank: string;
  matches(content: BankMessageContent): boolean;
  parse(content: BankMessageContent): ParsedBankTransaction | null;
}
