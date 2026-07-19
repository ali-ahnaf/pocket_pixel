import cron, { ScheduledTask } from 'node-cron';
import { LessThan } from 'typeorm';
import { AppDataSource } from '../data-source';
import { UserOAuthCredential } from '../entities/UserOAuthCredential.entity';
import { gmailService } from '../services';
import { logger } from '../services/logger.service';

/**
 * Keeps Gmail push watches alive. A Gmail `users.watch` registration lapses after
 * ~7 days, so a daily cron re-`watch`es any credential whose stored expiry falls
 * inside the renewal window. Mirrors the recurring scheduler: a single job plus a
 * boot-time pass (`renewExpiringGmailWatches`) that re-establishes watches which
 * expired while the server was down. All work is driven off `gmailWatchExpiry`.
 */

let task: ScheduledTask | null = null;

/** Renew a watch when it is within two days of lapsing (watches last ~7 days). */
const RENEWAL_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Re-registers the watch for every credential whose `gmailWatchExpiry` is within
 * the renewal window (rows with a null expiry aren't watching and are skipped by
 * the `LessThan` comparison). One user's failure — e.g. a revoked token — is
 * logged and never blocks the others.
 */
export async function renewExpiringGmailWatches(): Promise<void> {
  const repo = AppDataSource.getRepository(UserOAuthCredential);
  const threshold = new Date(Date.now() + RENEWAL_WINDOW_MS);

  const due = await repo.find({ where: { gmailWatchExpiry: LessThan(threshold) } });

  let renewed = 0;
  for (const credential of due) {
    if (!credential.gmailLabelIds || credential.gmailLabelIds.length === 0) continue;
    try {
      await gmailService.startWatch(credential.userId);
      renewed++;
    } catch (err) {
      logger.error('Failed to renew Gmail watch', { userId: credential.userId, err });
    }
  }

  logger.info(`Renewed ${renewed} Gmail watch(es)`);
}

/** Starts the daily renewal cron (03:15). Idempotent — a second call is a no-op. */
export function startGmailWatchScheduler(): void {
  if (task) return;

  task = cron.schedule('15 3 * * *', () => {
    renewExpiringGmailWatches().catch((err) => logger.error('Gmail watch renewal run failed:', err));
  });

  logger.info('Gmail watch renewal scheduler started');
}
