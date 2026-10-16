import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'debt-nudges';
/** `data.kind` on debt nudges, so a tap can be told apart from other notifications. */
export const DEBT_NUDGE_KIND = 'debt-nudge';

/** What DebtsService needs from the OS; lets tests swap in a mock. */
export interface DebtNotifier {
  /** Replaces any nudge already scheduled for this debt. Throws when notifications are not allowed. */
  schedule(debtId: string, at: Date, title: string, body: string, draft: string | null): Promise<void>;
  cancel(debtId: string): Promise<void>;
}

const identifierFor = (debtId: string): string => `debt-nudge-${debtId}`;

export const debtNotifier: DebtNotifier = {
  async schedule(debtId, at, title, body, draft) {
    // Android 13+ only shows the permission prompt once a channel exists. No-op on iOS.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: 'Debt reminders', importance: Notifications.AndroidImportance.DEFAULT });
    const granted = (await Notifications.getPermissionsAsync()).granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) throw new Error('Notifications are not allowed');

    await Notifications.cancelScheduledNotificationAsync(identifierFor(debtId));
    await Notifications.scheduleNotificationAsync({
      identifier: identifierFor(debtId),
      content: { title, body, data: { kind: DEBT_NUDGE_KIND, draft } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL_ID },
    });
  },

  cancel: (debtId) => Notifications.cancelScheduledNotificationAsync(identifierFor(debtId)),
};
