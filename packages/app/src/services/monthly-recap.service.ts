import { monthLabel, recapMonthDue } from '../lib/ai/wizard';
import { recapNotifier, type RecapNotifier } from '../lib/notifications/recap-notifier';
import type { AiService } from './ai.service';
import type { PreferencesService } from './preferences.service';
import { aiService, logger, preferencesService } from '.';

/**
 * Delivers the wizard's monthly recap as a local notification. Runs from the background
 * task (app closed) and on foreground, whichever reaches a due month first.
 */
export class MonthlyRecapService {
  constructor(
    private readonly preferences: PreferencesService = preferencesService,
    private readonly ai: AiService = aiService,
    private readonly notifier: RecapNotifier = recapNotifier,
  ) {}

  /**
   * Generates and posts the recap when one is due. Returns false when nothing is due or the
   * AI is not set up; nothing is marked then, so a later run tries again. Throws on network
   * or notification failures for the same reason.
   */
  async deliverIfDue(userId: string, today: Date = new Date()): Promise<boolean> {
    const preference = await this.preferences.getOrCreate(userId);
    const month = recapMonthDue(preference.monthlyRecapDay, preference.lastRecapMonth, today);
    if (!month) return false;

    const outcome = await this.ai.monthlyRecap(userId, month);
    if (outcome.status !== 'success') return false;

    // Posted before marking: a failed save repeats the notification instead of losing it.
    await this.notifier.notify(`Your ${monthLabel(month)} recap`, outcome.answer);
    await this.preferences.markRecapDelivered(userId, month);
    logger.info('Delivered monthly recap', { userId, month });
    return true;
  }
}
