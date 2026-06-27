export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  disableAiPrompt?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  avatar?: string;
  disableAiPrompt?: boolean;
}
