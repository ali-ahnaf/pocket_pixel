import fs from 'fs';
import os from 'os';
import path from 'path';
import cron, { ScheduledTask } from 'node-cron';
import Database from 'better-sqlite3';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DB_PATH } from '../data-source';
import { logger } from '../services/logger.service';

// Every 12 hours, on the hour (00:00 and 12:00 server time).
const BACKUP_CRON = '0 */12 * * *';

interface R2Config {
  readonly accountId: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
}

let backupTask: ScheduledTask | null = null;

const readR2Config = (): R2Config | null => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket };
};

const createR2Client = (config: R2Config): S3Client =>
  new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

// Use SQLite's online backup API so the snapshot is consistent even if the
// server is writing to the database mid-backup. Returns the temp file path.
const snapshotDatabase = async (): Promise<string> => {
  const tmpFile = path.join(os.tmpdir(), `pocket_pixel-backup-${Date.now()}.sqlite`);
  const source = new Database(DB_PATH, { readonly: true });

  try {
    await source.backup(tmpFile);
  } finally {
    source.close();
  }

  return tmpFile;
};

const performBackup = async (config: R2Config): Promise<void> => {
  const client = createR2Client(config);
  const snapshotPath = await snapshotDatabase();

  try {
    const body = fs.readFileSync(snapshotPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `pocket_pixel/pocket_pixel-${timestamp}.sqlite`;

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: 'application/x-sqlite3',
      }),
    );

    logger.info(`Database backup uploaded to R2: ${key}`);
  } finally {
    fs.rmSync(snapshotPath, { force: true });
    client.destroy();
  }
};

/**
 * Schedules a 12-hourly SQLite -> Cloudflare R2 backup.
 * No-op unless ENABLE_BACKUP=true (default off). If enabled but R2 credentials
 * are incomplete, it logs a warning and skips scheduling instead of crashing.
 */
export const startBackupScheduler = (): void => {
  if (process.env.ENABLE_BACKUP !== 'true') {
    logger.info('Database backup disabled (set ENABLE_BACKUP=true to enable)');
    return;
  }

  const config = readR2Config();
  if (!config) {
    logger.warn('ENABLE_BACKUP=true but R2 credentials are incomplete; backup not scheduled');
    return;
  }

  if (backupTask) {
    backupTask.stop();
    backupTask = null;
  }

  backupTask = cron.schedule(BACKUP_CRON, () => {
    performBackup(config).catch((err) => logger.error('Database backup failed:', err));
  });

  logger.info('Database backup scheduled every 12 hours to R2');
};
