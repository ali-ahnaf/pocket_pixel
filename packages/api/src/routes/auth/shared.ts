import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const AUTH_TOKEN_KEY = 'auth_token';
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-prod';

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  avatar: string;
}

export function createAuthToken(payload: TokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}
