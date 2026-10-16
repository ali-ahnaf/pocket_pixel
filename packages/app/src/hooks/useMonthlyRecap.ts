import { clearLastNotificationResponse, useLastNotificationResponse } from 'expo-notifications';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { RECAP_NOTIFICATION_KIND } from '../lib/notifications/recap-notifier';
import { logger, monthlyRecapService } from '../services';
import { useLocalUserId } from './DatabaseProvider';

/**
 * The background task posts the recap while the app is closed. This hook also checks on
 * mount and on every foreground, so an open app does not wait for the OS to run the task,
 * and returns the recap text after the user taps its notification.
 */
export function useMonthlyRecap(): { recap: string | null; dismiss: () => void } {
  const userId = useLocalUserId();
  const response = useLastNotificationResponse();
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    let running = false;
    const check = (): void => {
      if (running) return;
      running = true;
      monthlyRecapService
        .deliverIfDue(userId)
        .catch((err) => logger.error('Monthly recap failed', { err }))
        .finally(() => (running = false));
    };

    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, [userId]);

  const request = response?.notification.request;
  const recap = request?.content.data?.kind === RECAP_NOTIFICATION_KIND && request.identifier !== dismissedId ? request.content.body : null;

  return {
    recap,
    dismiss: () => {
      setDismissedId(request?.identifier ?? null);
      // Otherwise the same tap reopens the sheet on the next launch.
      clearLastNotificationResponse();
    },
  };
}
