export interface UserPreferenceDto {
  showIncome: boolean;
  showExpense: boolean;
}

export interface UpdateUserPreferenceInput {
  showIncome?: boolean;
  showExpense?: boolean;
}
