import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AVATARS, type ChangePasswordPayload, type SignInPayload, type SignUpPayload, type TokenPayload, type AuthResult } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { UsersRepository } from '../repositories/users.repository';
import { VaultsRepository } from '../repositories/vaults.repository';
import { usersRepository, vaultsRepository } from '../repositories';
import { logger } from './logger.service';

export type { AuthResult };

export const AUTH_TOKEN_KEY = 'auth_token';
const SALT_ROUNDS = 12;

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-prod';

/**
 * Authentication: password hashing, JWT issuing/verification and the sign-up /
 * sign-in flows. Repositories are injected (default to the shared singletons)
 * so the service can be unit-tested against mocks.
 */
export class AuthService {
  constructor(
    private readonly users: UsersRepository = usersRepository,
    private readonly vaults: VaultsRepository = vaultsRepository,
  ) {}

  createToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async signUp(payload: SignUpPayload): Promise<AuthResult> {
    const email = this.normalizeEmail(payload.email);
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new AppError('Email already in use', 409);
    }

    const user = this.users.createEntity({
      name: payload.name,
      email,
      password: await this.hashPassword(payload.password),
      avatar: payload.avatar ?? '',
    });
    const saved = await this.users.save(user);

    await this.vaults.save(
      this.vaults.createEntity({
        userId: saved.id,
        name: 'Main Stash',
        description: '',
        isDefault: true,
      }),
    );

    logger.info('User signed up', { userId: saved.id });
    return this.toAuthResult(saved.id, saved.name, saved.email, saved.avatar);
  }

  async signIn(payload: SignInPayload): Promise<AuthResult> {
    const user = await this.users.findByEmail(this.normalizeEmail(payload.email));
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.password) {
      throw new AppError('Invalid credentials', 401);
    }

    const passwordMatches = await bcrypt.compare(payload.password, user.password);
    if (!passwordMatches) {
      throw new AppError('Invalid credentials', 401);
    }

    logger.info('User signed in', { userId: user.id });
    return this.toAuthResult(user.id, user.name, user.email, user.avatar);
  }

  async changePassword(userId: string, payload: ChangePasswordPayload): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.password) {
      throw new AppError('This account has no password set. Sign in with Google.', 400);
    }

    const passwordMatches = await bcrypt.compare(payload.currentPassword, user.password);
    if (!passwordMatches) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = await this.hashPassword(payload.newPassword);
    await this.users.save(user);

    logger.info('User changed password', { userId: user.id });
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toAuthResult(id: string, name: string, email: string, avatar: string): AuthResult {
    const token = this.createToken({ userId: id, name, email, avatar });
    return { id, name, email, avatar, token };
  }
}
