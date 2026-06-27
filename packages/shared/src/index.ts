export * from "./contracts";

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
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
