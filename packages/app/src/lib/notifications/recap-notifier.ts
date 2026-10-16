import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'monthly-recap';
/** `data.kind` on recap notifications, so a tap can be told apart from other notifications. */
export const RECAP_NOTIFICATION_KIND = 'monthly-recap';

// Show the banner even while the app is open, since the foreground check can deliver a recap too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** What MonthlyRecapService needs from the OS; lets tests swap in a mock. */
export interface RecapNotifier {
  /** Asks for notification permission if needed. Resolves false when the user refuses. */
  requestPermission(): Promise<boolean>;
  /** Posts the recap now. Throws when notifications are not allowed, so the caller does not mark it delivered. */
  notify(title: string, body: string): Promise<void>;
}

export const recapNotifier: RecapNotifier = {
  async requestPermission() {
    // Android 13+ only shows the permission prompt once a channel exists. No-op on iOS.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: 'Monthly recap', importance: Notifications.AndroidImportance.DEFAULT });
    if ((await Notifications.getPermissionsAsync()).granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  },

  async notify(title, body) {
    if (!(await Notifications.getPermissionsAsync()).granted) throw new Error('Notifications are not allowed');
    await Notifications.scheduleNotificationAsync({ content: { title, body, data: { kind: RECAP_NOTIFICATION_KIND } }, trigger: { channelId: CHANNEL_ID } });
  },
};
