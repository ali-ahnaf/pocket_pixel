import type { SignInPayload, SignUpPayload, User } from '@expense-tracker/shared';
import ApiClient, { ForwardResponse } from './ApiClient';

export interface AuthResponse extends User {
  token: string;
}

export default class AuthApi extends ApiClient {
  constructor(baseURL: string) {
    super(`${baseURL}/auth`);
  }

  signUp(payload: SignUpPayload): Promise<ForwardResponse<AuthResponse>> {
    return this.post<AuthResponse>('/sign-up', payload);
  }

  signIn(payload: SignInPayload): Promise<ForwardResponse<AuthResponse>> {
    return this.post<AuthResponse>('/sign-in', payload);
  }

  signOut(): Promise<ForwardResponse<{ message: string }>> {
    return this.post('/sign-out');
  }
}
