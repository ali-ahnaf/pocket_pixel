import type { UserPreference } from '../entities/UserPreference.entity';
import type { RecapNotifier } from '../lib/notifications/recap-notifier';
import type { AiService } from '../services/ai.service';
import { MonthlyRecapService } from '../services/monthly-recap.service';
import type { PreferencesService } from '../services/preferences.service';

// The default notifier loads expo-notifications, a native module; the service gets a mock below.
jest.mock('../lib/notifications/recap-notifier', () => ({ recapNotifier: {} }));
jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const today = new Date(2026, 9, 16);

describe('MonthlyRecapService', () => {
  let preferences: jest.Mocked<Pick<PreferencesService, 'getOrCreate' | 'markRecapDelivered'>>;
  let ai: jest.Mocked<Pick<AiService, 'monthlyRecap'>>;
  let notifier: jest.Mocked<RecapNotifier>;
  let service: MonthlyRecapService;

  const givenPreference = (monthlyRecapDay: number | null, lastRecapMonth: string | null = null): void => {
    preferences.getOrCreate.mockResolvedValue({ userId: 'user-1', monthlyRecapDay, lastRecapMonth } as UserPreference);
  };

  beforeEach(() => {
    preferences = { getOrCreate: jest.fn(), markRecapDelivered: jest.fn() };
    ai = { monthlyRecap: jest.fn() };
    notifier = { requestPermission: jest.fn(), notify: jest.fn() };
    service = new MonthlyRecapService(preferences as unknown as PreferencesService, ai as unknown as AiService, notifier);
  });

  it('posts the recap for last month and marks it delivered', async () => {
    givenPreference(1, '2026-08');
    ai.monthlyRecap.mockResolvedValue({ status: 'success', answer: 'Thy gold went to FOOD.' });

    expect(await service.deliverIfDue('user-1', today)).toBe(true);

    expect(ai.monthlyRecap).toHaveBeenCalledWith('user-1', '2026-09');
    expect(notifier.notify).toHaveBeenCalledWith('Your September 2026 recap', 'Thy gold went to FOOD.');
    expect(preferences.markRecapDelivered).toHaveBeenCalledWith('user-1', '2026-09');
  });

  it('does nothing when no recap is due', async () => {
    givenPreference(20);

    expect(await service.deliverIfDue('user-1', today)).toBe(false);
    expect(ai.monthlyRecap).not.toHaveBeenCalled();
  });

  it('leaves the month unmarked when the AI is not set up', async () => {
    givenPreference(1);
    ai.monthlyRecap.mockResolvedValue({ status: 'needs-ai-setup', message: 'Set up AI' });

    expect(await service.deliverIfDue('user-1', today)).toBe(false);
    expect(notifier.notify).not.toHaveBeenCalled();
    expect(preferences.markRecapDelivered).not.toHaveBeenCalled();
  });

  it('leaves the month unmarked when the notification fails', async () => {
    givenPreference(1);
    ai.monthlyRecap.mockResolvedValue({ status: 'success', answer: 'Recap' });
    notifier.notify.mockRejectedValue(new Error('Notifications are not allowed'));

    await expect(service.deliverIfDue('user-1', today)).rejects.toThrow('Notifications are not allowed');
    expect(preferences.markRecapDelivered).not.toHaveBeenCalled();
  });
});
