export interface UserPreferenceDto {
  showIncome: boolean;
  showExpense: boolean;
  pushEnabled: boolean;
  aiTransactionEntryEnabled: boolean;
}

export interface UpdateUserPreferenceInput {
  showIncome?: boolean;
  showExpense?: boolean;
  pushEnabled?: boolean;
  aiTransactionEntryEnabled?: boolean;
  /** Day of the month (1-28) the wizard's monthly recap arrives, or null to turn it off. */
  monthlyRecapDay?: number | null;
  /** When on, an AI-parsed Gmail email opens the add-transaction form for review instead of being logged straight away. */
  requireAiParseApproval?: boolean;
}
