import type { PendingGmailExpenseDto } from '@expense-tracker/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { gmailService, logger, pendingGmailExpenseService } from '../../services';
import { color, font, space, text } from '../../theme';
import { Badge } from '../Badge';
import { Card } from '../Card';
import { GmailReconnectBanner } from './GmailReconnectBanner';
import { PendingExpenseDetailSheet } from './PendingExpenseDetailSheet';
import { PixelIcon } from '../PixelIcon';
import { IconText } from '../IconText';

export interface PendingExpensesPanelProps {
  /** Called after a pending email was parsed into a transaction, so the dashboard can reload. */
  onTransactionCreated: () => void;
  /** Bumped by the dashboard's pull to refresh to re-sync Gmail. */
  refreshKey: number;
}

// Port of packages/ui/src/components/pending-expenses/PendingExpensesPanel.tsx. Hidden while the queue is empty.
// The phone gets no Gmail push, so this panel also polls Gmail: on focus, whenever the app returns to the foreground, and on the dashboard's pull to refresh.
export function PendingExpensesPanel({ onTransactionCreated, refreshKey }: PendingExpensesPanelProps) {
  const userId = useLocalUserId();
  const [items, setItems] = useState<PendingGmailExpenseDto[]>([]);
  const [reconnectRequired, setReconnectRequired] = useState(false);
  const [selected, setSelected] = useState<PendingGmailExpenseDto | null>(null);

  // Shows the local queue at once, then syncs in the background and shows anything new. A failed sync keeps the app usable.
  const refresh = useCallback(() => {
    let active = true;
    const show = () =>
      Promise.all([pendingGmailExpenseService.list(userId), gmailService.getStatus(userId)]).then(([list, status]) => {
        if (!active) return;
        setItems(list);
        setReconnectRequired(status.reconnectRequired);
      });

    show()
      .then(() => gmailService.sync(userId))
      .catch((err) => logger.warn('Gmail sync failed', { err }))
      .then(show)
      .catch((err) => logger.error('Load pending expenses failed', { err }));
    return () => {
      active = false;
    };
  }, [userId]);

  useFocusEffect(refresh);

  // 0 is the initial value; the focus effect already covers the first load.
  useEffect(() => {
    if (refreshKey > 0) return refresh();
  }, [refresh, refreshKey]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const handleResolved = (id: string, transactionCreated: boolean): void => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (transactionCreated) onTransactionCreated();
  };

  return (
    <>
      {reconnectRequired && <GmailReconnectBanner />}

      {items.length > 0 && (
        <Card style={styles.card}>
          <View style={styles.header}>
            <IconText icon="Mail" iconSize={20} style={styles.title} accessibilityRole="header">
              Pending Expenses
            </IconText>
            <Badge label={String(items.length)} variant="secondary" />
          </View>
          {items.map((item) => (
            <Pressable key={item.id} accessibilityRole="button" onPress={() => setSelected(item)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <View style={styles.itemBody}>
                <Text style={styles.subject} numberOfLines={1}>
                  {item.subject ?? 'No subject'}
                </Text>
                <Badge label={item.vaultName} variant="secondary" />
                {item.guidanceHint ? (
                  <Text style={styles.hint} numberOfLines={1}>
                    {item.guidanceHint}
                  </Text>
                ) : null}
              </View>
              <PixelIcon name="ChevronRight" size={ms(20)} />
            </Pressable>
          ))}
        </Card>
      )}

      {selected ? <PendingExpenseDetailSheet item={selected} onResolved={handleResolved} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: { padding: ms(space[4]), gap: ms(space[2]), backgroundColor: color.surface, borderColor: color.secondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: ms(4), borderColor: color.border, paddingBottom: ms(space[2]), marginBottom: ms(space[1]) },
  title: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.outline, textTransform: 'uppercase' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(space[2]),
    padding: ms(space[3]),
    backgroundColor: color.bg,
    borderWidth: ms(4),
    borderStyle: 'dashed',
    borderColor: color.secondary,
  },
  pressed: { transform: [{ translateY: 2 }] },
  itemBody: { flex: 1, gap: ms(space[1]) },
  subject: { fontFamily: font.bodyBold, fontSize: ms(text.bodySm.fontSize), color: color.onSurface },
  hint: { fontFamily: font.body, fontSize: ms(11), color: color.onSurfaceVariant },
});
