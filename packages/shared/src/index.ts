export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
}

export type ExpenseCategory =
  | "food"
  | "transport"
  | "housing"
  | "entertainment"
  | "health"
  | "other";

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
