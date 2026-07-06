import dotenv from 'dotenv';
import path from 'path';

// Load .env relative to this module, not process.cwd().
// __dirname is dist/ in production and src/ under ts-node (dev); in both cases
// the package-root .env is one level up. Deploy writes .env to packages/api/.env.
const envPath = path.join(__dirname, '..', '.env');

dotenv.config({ path: envPath });
