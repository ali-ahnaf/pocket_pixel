import type { ParsedEmailDto, PendingGmailExpenseDto, TagDto, VaultDto } from '@expense-tracker/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { gmailService, logger, pendingGmailExpenseService } from '../../services';
import { color, font, space, text } from '../../theme';
import { formatDate, formatTime, toIsoDate } from '../../lib/formatters';
import { Badge } from '../Badge';
import { showToast } from '../Toast';
import { Card } from '../Card';
import { GmailReconnectBanner } from './GmailReconnectBanner';
import { LogResourceSheet } from './LogResourceSheet';
import { PendingExpenseDetailSheet } from './PendingExpenseDetailSheet';
import { PixelIcon } from '../PixelIcon';
import { IconText } from '../IconText';
import { TagChips } from './TagChips';
import { toPixelIcon } from '../../lib/iconMapper';
import { LoadingBar } from '../LoadingBar';

export interface PendingExpensesPanelProps {
  /** Feed the log form opened to review an AI-parsed email. */
  vaults: VaultDto[];
  tags: TagDto[];
  selectedMonth: number;
  selectedYear: number;
  /** Called after a pending email was parsed into a transaction, so the dashboard can reload. */
  onTransactionCreated: () => void;
  /** Bumped by the dashboard's pull to refresh to re-sync Gmail. */
  refreshKey: number;
}

// Port of packages/ui/src/components/pending-expenses/PendingExpensesPanel.tsx. Hidden while the queue is empty.
// The phone gets no Gmail push, so this panel also polls Gmail: on focus, whenever the app returns to the foreground, and on the dashboard's pull to refresh.
// While a sync runs it shows a loading bar as its last element, which the dashboard places right above the status card.
export function PendingExpensesPanel({ vaults, tags, selectedMonth, selectedYear, onTransactionCreated, refreshKey }: PendingExpensesPanelProps) {
  const userId = useLocalUserId();
  const [items, setItems] = useState<PendingGmailExpenseDto[]>([]);
  const [reconnectRequired, setReconnectRequired] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState<PendingGmailExpenseDto | null>(null);
  const [reviewing, setReviewing] = useState<{ item: PendingGmailExpenseDto; parsed: ParsedEmailDto } | null>(null);

  // Shows the local queue at once, then syncs in the background and shows anything new. A failed sync keeps the app usable.
  // `announce` (pull to refresh) toasts the result: emails fetched and the saved sync time.
  const refresh = useCallback(
    (announce = false) => {
      let active = true;
      const show = () =>
        Promise.all([pendingGmailExpenseService.list(userId), gmailService.getStatus(userId)]).then(([list, status]) => {
          if (!active) return;
          setItems(list);
          setReconnectRequired(status.reconnectRequired);
        });

      show()
        .then(() => {
          setSyncing(true);
          return gmailService.sync(userId);
        })
        .then(
          ({ enqueued, syncedAt }) => {
            if (announce && syncedAt !== null) showToast(`Fetched ${enqueued} email${enqueued === 1 ? '' : 's'}. Last fetch ${formatTime(new Date(syncedAt).toISOString())}`);
          },
          (err) => {
            logger.warn('Gmail sync failed', { err });
            if (announce) showToast('Gmail fetch failed');
          },
        )
        .then(show)
        .catch((err) => logger.error('Load pending expenses failed', { err }))
        .finally(() => setSyncing(false));
      return () => {
        active = false;
      };
    },
    [userId],
  );

  useFocusEffect(useCallback(() => refresh(), [refresh]));

  // 0 is the initial value; the focus effect already covers the first load.
  useEffect(() => {
    if (refreshKey > 0) return refresh(true);
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

  // The user approved the parsed email in the log form, which already created the transaction; take the item off the queue.
  const handleReviewLogged = (id: string): void => {
    pendingGmailExpenseService.resolve(userId, id).then(
      () => handleResolved(id, true),
      (err) => logger.error('Resolve pending expense failed', { err }),
    );
  };

  // Same soft delete as the detail sheet's Dismiss button, without opening the sheet.
  const handleDismiss = (id: string): void => {
    pendingGmailExpenseService.resolve(userId, id).then(
      () => handleResolved(id, false),
      (err) => {
        logger.error('Dismiss pending expense failed', { err });
        showToast('Dismiss failed');
      },
    );
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
          {items.map((item) => {
            const vault = vaults.find((v) => v.id === item.vaultId);
            return (
              <Pressable key={item.id} accessibilityRole="button" onPress={() => setSelected(item)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                <View style={styles.itemBody}>
                  <Text style={styles.subject} numberOfLines={1}>
                    {item.subject ?? 'No subject'}
                  </Text>
                  <View style={styles.badges}>
                    <Badge label={item.vaultName} variant="secondary" icon={toPixelIcon(vault?.icon || 'Briefcase')} style={vaultTint(vault?.backgroundColor)} />
                    {item.receivedAt ? <Badge label={formatDate(toIsoDate(new Date(item.receivedAt)))} icon="Calendar" /> : null}
                  </View>
                  <TagChips tags={tags.filter((tag) => item.tagIds?.includes(tag.id))} />
                  {item.guidanceHint ? (
                    <Text style={styles.hint} numberOfLines={1}>
                      {item.guidanceHint}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss"
                  hitSlop={8}
                  onPress={() => handleDismiss(item.id)}
                  style={({ pressed }) => [styles.dismiss, pressed && styles.dismissPressed]}
                >
                  <PixelIcon name="X" size={ms(16)} />
                </Pressable>
                <PixelIcon name="ChevronRight" size={ms(20)} />
              </Pressable>
            );
          })}
        </Card>
      )}

      {selected ? (
        <PendingExpenseDetailSheet item={selected} onResolved={handleResolved} onParsedForReview={(item, parsed) => setReviewing({ item, parsed })} onClose={() => setSelected(null)} />
      ) : null}

      {/* Waits for the detail sheet to finish closing: iOS cannot present a modal while another is dismissing. */}
      {reviewing && !selected ? (
        <LogResourceSheet
          vaults={vaults}
          tags={tags}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          prefill={{ ...reviewing.parsed, vaultId: reviewing.item.vaultId }}
          onSuccess={() => handleReviewLogged(reviewing.item.id)}
          onClose={() => setReviewing(null)}
        />
      ) : null}

      {syncing && <LoadingBar accessibilityLabel="Fetching emails" />}
    </>
  );
}

// Same tint treatment as TagPicker suggestions, so each vault reads in its own color.
const vaultTint = (hex: string | null | undefined) => (hex ? { backgroundColor: `${hex}33`, borderColor: hex } : undefined);

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
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(space[1]) },
  subject: { fontFamily: font.bodyBold, fontSize: ms(text.bodySm.fontSize), color: color.onSurface },
  dismiss: { width: ms(36), height: ms(36), alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceHighest, borderWidth: ms(4), borderColor: color.border },
  dismissPressed: { backgroundColor: color.errorContainer, transform: [{ translateY: 2 }] },
  hint: { fontFamily: font.body, fontSize: ms(11), color: color.onSurfaceVariant },
});
