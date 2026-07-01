export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  avatar: string;
}

export interface AuthResult {
  id: string;
  name: string;
  email: string;
  avatar: string;
  token: string;
}
