import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

// Load .env relative to this module, not process.cwd().
// In production the compiled file lives in dist/, so this reads dist/.env.
// Under ts-node (dev) __dirname is src/, so we step up to the package root.
const isProd = process.env.NODE_ENV === 'production';
const envPath = isProd ? path.join(__dirname, '.env') : path.join(__dirname, '..', '.env');

dotenv.config({ path: envPath });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-prod',
  JWT_ACCESS_EXPIRY: (process.env.JWT_ACCESS_EXPIRY || '15m') as jwt.SignOptions['expiresIn'],
  JWT_REFRESH_EXPIRY: (process.env.JWT_REFRESH_EXPIRY || '30d') as jwt.SignOptions['expiresIn'],
};
