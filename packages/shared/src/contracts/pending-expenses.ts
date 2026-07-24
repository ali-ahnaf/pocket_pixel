/**
 * Review queue for Gmail bank-alert matches. Only a pointer to the Gmail
 * message is persisted; the email body is re-fetched on demand and never
 * stored, since the AI parse now runs client-side with the user's own key.
 */
export interface PendingGmailExpenseDto {
  id: string;
  gmailMessageId: string;
  vaultId: string;
  vaultName: string;
  guidanceHint: string | null;
}

/** Returned only by the on-demand re-fetch endpoint; never persisted. */
export interface PendingExpenseEmailDto {
  from: string;
  subject: string;
  bodyText: string;
  emailDate: string;
}
