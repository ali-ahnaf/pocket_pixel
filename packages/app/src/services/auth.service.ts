import bcrypt from 'bcryptjs';
import type { ChangePasswordPayload, SignInPayload, SignUpPayload } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { sessionStore, type SessionStore } from '../lib/auth/session-store';
import { UsersRepository } from '../repositories/users.repository';
import { usersRepository } from '../repositories';
import { logger } from '.';

// The API uses 12. bcryptjs is pure JS, so 12 can take seconds on a phone.
const SALT_ROUNDS = 10;

/**
 * Local accounts: sign-up and sign-in against the on-device users table. There is no
 * server, so no JWT: the session is just the signed-in user id in the secure store.
 * Mirrors packages/api auth.service.ts. Dependencies are injected so it can be unit-tested.
 */
export class AuthService {
  constructor(
    private readonly users: UsersRepository = usersRepository,
    private readonly session: SessionStore = sessionStore,
  ) {}

  /** Creates the account and its default vault, starts the session, and returns the new user id. */
  async signUp(payload: SignUpPayload): Promise<string> {
    const email = this.normalizeEmail(payload.email);
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new AppError('Email already in use', 409);
    }

    const saved = await this.users.createWithMainStash({
      name: payload.name,
      email,
      password: await bcrypt.hash(payload.password, SALT_ROUNDS),
      avatar: payload.avatar ?? '',
    });

    await this.session.set(saved.id);
    logger.info('User signed up', { userId: saved.id });
    return saved.id;
  }

  /** Checks the credentials, starts the session, and returns the user id. */
  async signIn(payload: SignInPayload): Promise<string> {
    const user = await this.users.findByEmail(this.normalizeEmail(payload.email));
    // Same message for every failure so the response does not reveal which emails exist.
    if (!user?.password || !(await bcrypt.compare(payload.password, user.password))) {
      throw new AppError('Invalid credentials', 401);
    }

    await this.session.set(user.id);
    logger.info('User signed in', { userId: user.id });
    return user.id;
  }

  /** The user id of the stored session, or null if there is none or its user no longer exists. */
  async restoreSession(): Promise<string | null> {
    const userId = await this.session.get();
    if (!userId) return null;

    if (!(await this.users.findById(userId))) {
      await this.session.clear();
      return null;
    }
    return userId;
  }

  /** Replaces the password after checking the current one. Mirrors packages/api auth.service.ts. */
  async changePassword(userId: string, payload: ChangePasswordPayload): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (!user.password) {
      throw new AppError('This account has no password set. Sign in with Google.', 400);
    }
    if (!(await bcrypt.compare(payload.currentPassword, user.password))) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = await bcrypt.hash(payload.newPassword, SALT_ROUNDS);
    await this.users.save(user);
    logger.info('User changed password', { userId });
  }

  /**
   * Sets a new password for the account with this email, without verifying the caller.
   * Offline there is no email to send a reset link to, so this is a deliberate trade-off.
   */
  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.users.findByEmail(this.normalizeEmail(email));
    if (!user) {
      throw new AppError('No account found for that email', 404);
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.users.save(user);
    logger.info('User reset password', { userId: user.id });
  }

  signOut(): Promise<void> {
    return this.session.clear();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
