import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { ChangePasswordPayload, SignInPayload, SignUpPayload, TokenPayload, AuthResult } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { UsersRepository } from '../repositories/users.repository';
import { VaultsRepository } from '../repositories/vaults.repository';
import { RefreshTokensRepository } from '../repositories/refresh-token.repository';
import { usersRepository, vaultsRepository, refreshTokensRepository } from '../repositories';
import { logger } from '.';
import { env } from '../env';

export type { TokenPayload, AuthResult };

export const AUTH_TOKEN_KEY = 'auth_token';
const SALT_ROUNDS = 12;
const JWT_SECRET = env.JWT_SECRET;

export interface AuthResultWithRefresh extends AuthResult {
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

/**
 * Authentication: password hashing, JWT issuing/verification and the sign-up /
 * sign-in flows. Repositories are injected (default to the shared singletons)
 * so the service can be unit-tested against mocks.
 */
export class AuthService {
  constructor(
    private readonly users: UsersRepository = usersRepository,
    private readonly vaults: VaultsRepository = vaultsRepository,
    private readonly refreshTokens: RefreshTokensRepository = refreshTokensRepository,
  ) {}

  createToken(payload: TokenPayload, expiresIn: jwt.SignOptions['expiresIn'] = env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn']): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async signUp(payload: SignUpPayload): Promise<AuthResultWithRefresh> {
    const existing = await this.users.findByEmail(payload.email);
    if (existing) {
      throw new AppError('Email already in use', 409);
    }

    const user = this.users.createEntity({
      name: payload.name,
      email: payload.email,
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
    return this.generateAuthSession(saved.id, saved.name, saved.email, saved.avatar);
  }

  async signIn(payload: SignInPayload): Promise<AuthResultWithRefresh> {
    const user = await this.users.findByEmail(payload.email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const passwordMatches = await bcrypt.compare(payload.password, user.password);
    if (!passwordMatches) {
      throw new AppError('Invalid credentials', 401);
    }

    logger.info('User signed in', { userId: user.id });
    return this.generateAuthSession(user.id, user.name, user.email, user.avatar);
  }

  async refresh(refreshToken: string): Promise<AuthResultWithRefresh> {
    let payload: TokenPayload;
    try {
      payload = this.verifyToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const hashed = this.hashToken(refreshToken);
    const tokenEntity = await this.refreshTokens.findByToken(hashed);

    if (!tokenEntity || (tokenEntity.expiresAt && tokenEntity.expiresAt < new Date())) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Revoke the used refresh token (rotation)
    await this.refreshTokens.revoke(tokenEntity.id);

    // Fetch user profile to issue fresh session
    const user = await this.users.findById(payload.userId);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    logger.info('Rotated refresh token', { userId: user.id });
    return this.generateAuthSession(user.id, user.name, user.email, user.avatar);
  }

async signOut(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    try {
      this.verifyToken(refreshToken);
      const hashed = this.hashToken(refreshToken);
      const tokenEntity = await this.refreshTokens.findByToken(hashed);
      if (tokenEntity) {
        await this.refreshTokens.revoke(tokenEntity.id);
        logger.info('Revoked refresh token on sign out', { tokenId: tokenEntity.id });
      }
    } catch (err) {
      // Best effort sign-out: ignore verification errors
    }
  }

  async changePassword(userId: string, payload: ChangePasswordPayload): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const passwordMatches = await bcrypt.compare(payload.currentPassword, user.password);
    if (!passwordMatches) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = await this.hashPassword(payload.newPassword);
    await this.users.save(user);

    logger.info('User changed password', { userId: user.id });
  }

  private async generateAuthSession(id: string, name: string, email: string, avatar: string): Promise<AuthResultWithRefresh> {
    const accessToken = this.createToken({ userId: id, name, email, avatar }, env.JWT_ACCESS_EXPIRY);
    const refreshToken = this.createToken({ userId: id, name, email, avatar }, env.JWT_REFRESH_EXPIRY);

    // Parse refresh expiry (default to 30 days)
    const expiresMs = 30 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiresMs);

    const tokenEntity = this.refreshTokens.createEntity({
      token: this.hashToken(refreshToken),
      userId: id,
      expiresAt,
    });
    await this.refreshTokens.save(tokenEntity);

    return { id, name, email, avatar, token: accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
  }
  }
}
