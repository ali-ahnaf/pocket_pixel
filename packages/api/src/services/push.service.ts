import webpush from 'web-push';
import { PushSubscriptionInput, PushSubscriptionDto, PushNotificationPayload } from '@expense-tracker/shared';
import { PushSubscription } from '../entities/PushSubscription.entity';
import { PushSubscriptionRepository } from '../repositories/push-subscription.repository';
import { pushSubscriptionRepository } from '../repositories';
import { PreferencesService } from './preferences.service';
import { preferencesService, logger } from '.';

/**
 * Web Push subscription lifecycle and delivery. `pushEnabled` on `UserPreference`
 * is the on/off signal a user controls from Settings — `subscribe` turns it on,
 * `unsubscribe` turns it off — independent of how many device subscriptions
 * exist. `notify` gates on that flag first, then fans out to every subscription
 * row for the user. It never throws: a Gmail-watcher transaction must still be
 * created even if push delivery fails entirely.
 */
export class PushService {
  constructor(
    private readonly subscriptions: PushSubscriptionRepository = pushSubscriptionRepository,
    private readonly preferences: PreferencesService = preferencesService,
  ) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:support@example.com', process.env.VAPID_PUBLIC_KEY ?? '', process.env.VAPID_PRIVATE_KEY ?? '');
  }

  async subscribe(userId: string, input: PushSubscriptionInput): Promise<PushSubscriptionDto> {
    const existing = await this.subscriptions.findByEndpoint(userId, input.endpoint);
    const subscription = existing ?? this.subscriptions.createEntity({ userId, endpoint: input.endpoint });
    // Revive a previously soft-deleted subscription: the (userId, endpoint) unique
    // index still counts deleted rows, so re-subscribing must reuse and un-delete
    // the existing row instead of inserting a duplicate.
    subscription.deletedAt = null as unknown as Date;
    subscription.p256dh = input.keys.p256dh;
    subscription.auth = input.keys.auth;

    await this.subscriptions.save(subscription);
    await this.preferences.update(userId, { pushEnabled: true });
    logger.info('Registered push subscription', { userId });

    return { id: subscription.id, endpoint: subscription.endpoint };
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.subscriptions.softDeleteByEndpoint(userId, endpoint);
    await this.preferences.update(userId, { pushEnabled: false });
    logger.info('Removed push subscription', { userId });
  }

  /** Sends a push to every subscription the user has; never throws. */
  async notify(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      const preference = await this.preferences.getOrCreate(userId);
      if (!preference.pushEnabled) return;

      const subscriptions = await this.subscriptions.findManyForUser(userId);
      if (subscriptions.length === 0) return;

      const message = JSON.stringify(payload);
      const results = await Promise.allSettled(subscriptions.map((subscription) => this.sendToSubscription(subscription, message)));
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          logger.warn('Push delivery failed', { userId, endpoint: subscriptions[index].endpoint, err: result.reason });
        }
      });
    } catch (err) {
      logger.error('Push notify failed unexpectedly', { userId, err });
    }
  }

  /** Sends to one subscription; prunes it on a 404/410 (expired/revoked). */
  private async sendToSubscription(subscription: PushSubscription, message: string): Promise<void> {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, message);
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await this.subscriptions.softDelete(subscription.id);
      }
      throw err;
    }
  }
}
