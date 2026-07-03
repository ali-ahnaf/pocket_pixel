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

export interface RefreshResponse {
  token: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

