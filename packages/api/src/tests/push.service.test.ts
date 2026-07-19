import webpush from 'web-push';
import type { PushSubscriptionRepository } from '../repositories/push-subscription.repository';
import type { PreferencesService } from '../services/preferences.service';
import type { PushSubscription } from '../entities/PushSubscription.entity';
import type { UserPreference } from '../entities/UserPreference.entity';
import { PushService } from '../services/push.service';

jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('web-push');

type SubscriptionsMock = jest.Mocked<Pick<PushSubscriptionRepository, 'findManyForUser' | 'findByEndpoint' | 'createEntity' | 'save' | 'softDeleteByEndpoint' | 'softDelete'>>;
type PreferencesMock = jest.Mocked<Pick<PreferencesService, 'getOrCreate' | 'update'>>;

const buildSubscription = (overrides: Partial<PushSubscription> = {}): PushSubscription =>
  ({ id: 'sub-1', userId: 'user-1', endpoint: 'https://push.example/1', p256dh: 'p256dh-1', auth: 'auth-1', deletedAt: null, ...overrides }) as PushSubscription;

const buildPreference = (overrides: Partial<UserPreference> = {}): UserPreference => ({ id: 'pref-1', userId: 'user-1', pushEnabled: true, ...overrides }) as UserPreference;

describe('PushService', () => {
  let subscriptions: SubscriptionsMock;
  let preferences: PreferencesMock;
  let service: PushService;

  beforeEach(() => {
    subscriptions = {
      findManyForUser: jest.fn(),
      findByEndpoint: jest.fn(),
      createEntity: jest.fn((data) => ({ ...data }) as PushSubscription),
      save: jest.fn((s) => Promise.resolve(s as PushSubscription)),
      softDeleteByEndpoint: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
    };
    preferences = {
      getOrCreate: jest.fn(),
      update: jest.fn(),
    };
    service = new PushService(subscriptions as unknown as PushSubscriptionRepository, preferences as unknown as PreferencesService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('subscribe', () => {
    it('creates a new subscription, enables the preference, and returns the DTO', async () => {
      subscriptions.findByEndpoint.mockResolvedValue(null);

      const result = await service.subscribe('user-1', { endpoint: 'https://push.example/1', keys: { p256dh: 'p256dh-1', auth: 'auth-1' } });

      expect(subscriptions.createEntity).toHaveBeenCalledWith({ userId: 'user-1', endpoint: 'https://push.example/1' });
      expect(subscriptions.save).toHaveBeenCalledWith(expect.objectContaining({ p256dh: 'p256dh-1', auth: 'auth-1', deletedAt: null }));
      expect(preferences.update).toHaveBeenCalledWith('user-1', { pushEnabled: true });
      expect(result).toEqual({ id: undefined, endpoint: 'https://push.example/1' });
    });

    it('revives a soft-deleted subscription instead of inserting a duplicate', async () => {
      const softDeleted = buildSubscription({ p256dh: 'old', auth: 'old', deletedAt: new Date() });
      subscriptions.findByEndpoint.mockResolvedValue(softDeleted);

      const result = await service.subscribe('user-1', { endpoint: softDeleted.endpoint, keys: { p256dh: 'new-p256dh', auth: 'new-auth' } });

      expect(subscriptions.createEntity).not.toHaveBeenCalled();
      expect(softDeleted.deletedAt).toBeNull();
      expect(softDeleted.p256dh).toBe('new-p256dh');
      expect(softDeleted.auth).toBe('new-auth');
      expect(subscriptions.save).toHaveBeenCalledWith(softDeleted);
      expect(result).toEqual({ id: 'sub-1', endpoint: softDeleted.endpoint });
    });
  });

  describe('unsubscribe', () => {
    it('soft-deletes the subscription and disables the preference', async () => {
      await service.unsubscribe('user-1', 'https://push.example/1');

      expect(subscriptions.softDeleteByEndpoint).toHaveBeenCalledWith('user-1', 'https://push.example/1');
      expect(preferences.update).toHaveBeenCalledWith('user-1', { pushEnabled: false });
    });
  });

  describe('notify', () => {
    it('does nothing when the user has push disabled', async () => {
      preferences.getOrCreate.mockResolvedValue(buildPreference({ pushEnabled: false }));

      await service.notify('user-1', { title: 'New transaction', body: 'Expense 42.00' });

      expect(subscriptions.findManyForUser).not.toHaveBeenCalled();
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('does nothing when the user has no subscriptions', async () => {
      preferences.getOrCreate.mockResolvedValue(buildPreference({ pushEnabled: true }));
      subscriptions.findManyForUser.mockResolvedValue([]);

      await service.notify('user-1', { title: 'New transaction', body: 'Expense 42.00' });

      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('sends to every subscription for the user', async () => {
      preferences.getOrCreate.mockResolvedValue(buildPreference({ pushEnabled: true }));
      const subs = [buildSubscription({ id: 'sub-1', endpoint: 'https://push.example/1' }), buildSubscription({ id: 'sub-2', endpoint: 'https://push.example/2' })];
      subscriptions.findManyForUser.mockResolvedValue(subs);
      (webpush.sendNotification as jest.Mock).mockResolvedValue(undefined);

      await service.notify('user-1', { title: 'New transaction', body: 'Expense 42.00' });

      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
      expect(webpush.sendNotification).toHaveBeenCalledWith(
        { endpoint: 'https://push.example/1', keys: { p256dh: 'p256dh-1', auth: 'auth-1' } },
        JSON.stringify({ title: 'New transaction', body: 'Expense 42.00' }),
      );
    });

    it('prunes a subscription that returns 410 Gone, without throwing', async () => {
      preferences.getOrCreate.mockResolvedValue(buildPreference({ pushEnabled: true }));
      const sub = buildSubscription({ id: 'sub-1', endpoint: 'https://push.example/1' });
      subscriptions.findManyForUser.mockResolvedValue([sub]);
      (webpush.sendNotification as jest.Mock).mockRejectedValue(Object.assign(new Error('Gone'), { statusCode: 410 }));

      await expect(service.notify('user-1', { title: 'New transaction', body: 'Expense 42.00' })).resolves.toBeUndefined();

      expect(subscriptions.softDelete).toHaveBeenCalledWith('sub-1');
    });

    it('prunes a subscription that returns 404 Not Found, without throwing', async () => {
      preferences.getOrCreate.mockResolvedValue(buildPreference({ pushEnabled: true }));
      const sub = buildSubscription({ id: 'sub-1', endpoint: 'https://push.example/1' });
      subscriptions.findManyForUser.mockResolvedValue([sub]);
      (webpush.sendNotification as jest.Mock).mockRejectedValue(Object.assign(new Error('Not found'), { statusCode: 404 }));

      await expect(service.notify('user-1', { title: 'New transaction', body: 'Expense 42.00' })).resolves.toBeUndefined();

      expect(subscriptions.softDelete).toHaveBeenCalledWith('sub-1');
    });

    it('does not prune on a non-404/410 failure, and never throws', async () => {
      preferences.getOrCreate.mockResolvedValue(buildPreference({ pushEnabled: true }));
      const sub = buildSubscription({ id: 'sub-1', endpoint: 'https://push.example/1' });
      subscriptions.findManyForUser.mockResolvedValue([sub]);
      (webpush.sendNotification as jest.Mock).mockRejectedValue(Object.assign(new Error('Server error'), { statusCode: 500 }));

      await expect(service.notify('user-1', { title: 'New transaction', body: 'Expense 42.00' })).resolves.toBeUndefined();

      expect(subscriptions.softDelete).not.toHaveBeenCalled();
    });

    it('never throws even when loading preferences fails', async () => {
      preferences.getOrCreate.mockRejectedValue(new Error('db down'));

      await expect(service.notify('user-1', { title: 'New transaction', body: 'Expense 42.00' })).resolves.toBeUndefined();
    });
  });
});
