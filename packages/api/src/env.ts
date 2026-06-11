import dotenv from 'dotenv';
import path from 'path';

// Load .env relative to this module, not process.cwd().
// In production the compiled file lives in dist/, so this reads dist/.env.
// Under ts-node (dev) __dirname is src/, so we step up to the package root.
const isProd = process.env.NODE_ENV === 'production';
const envPath = isProd
  ? path.join(__dirname, '.env')
  : path.join(__dirname, '..', '.env');

dotenv.config({ path: envPath });
