import { clearLastNotificationResponse, useLastNotificationResponse } from 'expo-notifications';
import { useEffect } from 'react';
import { Share } from 'react-native';
import { DEBT_NUDGE_KIND } from '../lib/notifications/debt-notifier';
import { logger } from '../services';

/** Opens the share sheet with the drafted reminder after the user taps a debt nudge. */
export function useDebtNudgeShare(): void {
  const response = useLastNotificationResponse();
  const data = response?.notification.request.content.data;
  const draft = data?.kind === DEBT_NUDGE_KIND && typeof data.draft === 'string' ? data.draft : null;

  useEffect(() => {
    if (!draft) return;
    // Otherwise the same tap reopens the share sheet on the next launch.
    clearLastNotificationResponse();
    Share.share({ message: draft }).catch((err) => logger.error('Share debt nudge failed', { err }));
  }, [draft]);
}
