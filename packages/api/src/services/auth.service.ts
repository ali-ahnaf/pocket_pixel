import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client, type TokenPayload as GoogleTokenPayload } from 'google-auth-library';
import { AVATARS, type ChangePasswordPayload, type SignInPayload, type SignUpPayload, type TokenPayload, type AuthResult } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { UsersRepository } from '../repositories/users.repository';
import { VaultsRepository } from '../repositories/vaults.repository';
import { usersRepository, vaultsRepository } from '../repositories';
import { logger } from './logger.service';

export type { TokenPayload, AuthResult };

export const AUTH_TOKEN_KEY = 'auth_token';
const SALT_ROUNDS = 12;

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-prod';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

// OAuth scopes requested during the authorization-code flow: identity only.
const GOOGLE_SCOPES = ['openid', 'email', 'profile'];

/**
 * Authentication: password hashing, JWT issuing/verification and the sign-up /
 * sign-in flows. Repositories are injected (default to the shared singletons)
 * so the service can be unit-tested against mocks.
 */
export class AuthService {
  private readonly googleClient = new OAuth2Client({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
  });

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

    // Google-only accounts have no password set; they must use Google sign-in.
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

  /**
   * Step 1 of the authorization-code flow. Build the Google consent-screen URL
   * the browser is redirected to. `state` is an opaque anti-CSRF value the route
   * also stores in a cookie and re-checks on the callback.
   */
  getGoogleAuthUrl(state: string): string {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      throw new AppError('Google sign-in is not configured', 500);
    }

    return this.googleClient.generateAuthUrl({
      access_type: 'online',
      scope: GOOGLE_SCOPES,
      state,
      prompt: 'select_account',
    });
  }

  /**
   * Step 2 of the authorization-code flow. Exchange the one-time `code` Google
   * appended to the callback for tokens, verify the returned ID token, then sign
   * the user in — creating the account on first use. Existing password accounts
   * with a matching, verified email are linked to the Google identity rather
   * than duplicated.
   */
  async googleSignInWithCode(code: string): Promise<AuthResult> {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      throw new AppError('Google sign-in is not configured', 500);
    }

    let idToken: string | undefined;
    try {
      const { tokens } = await this.googleClient.getToken(code);
      idToken = tokens.id_token ?? undefined;
    } catch {
      throw new AppError('Invalid Google authorization code', 401);
    }
    if (!idToken) {
      throw new AppError('Invalid Google authorization code', 401);
    }

    let profile: GoogleTokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
      profile = ticket.getPayload();
    } catch {
      throw new AppError('Invalid Google credential', 401);
    }

    if (!profile || !profile.sub) {
      throw new AppError('Invalid Google credential', 401);
    }
    if (!profile.email || !profile.email_verified) {
      throw new AppError('Google account email is not verified', 401);
    }

    const googleId = profile.sub;
    const email = this.normalizeEmail(profile.email);

    // 1. Already linked to this Google identity.
    let user = await this.users.findByGoogleId(googleId);

    // 2. Existing password/email account — link it to the Google identity.
    if (!user) {
      user = await this.users.findByEmail(email);
      if (user) {
        user.googleId = googleId;
        if (!user.avatar && profile.picture) user.avatar = profile.picture;
        user = await this.users.save(user);
        logger.info('Linked Google identity to existing user', { userId: user.id });
      }
    }

    // 3. Brand-new user — create the account and a default vault.
    if (!user) {
      const created = this.users.createEntity({
        name: profile.name || email.split('@')[0],
        email,
        password: null,
        googleId,
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      });
      user = await this.users.save(created);

      await this.vaults.save(
        this.vaults.createEntity({
          userId: user.id,
          name: 'Main Stash',
          description: '',
          isDefault: true,
        }),
      );
    }

    logger.info('User signed in via Google', { userId: user.id });
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
