// STUB: Gmail pending expenses queue (hardcoded items; dismiss only removes them from screen state). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import type { PendingGmailExpenseDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { Badge } from '../Badge';
import { Card } from '../Card';
import { PendingExpenseDetailSheet } from './PendingExpenseDetailSheet';
import { PixelIcon } from '../PixelIcon';
import { IconText } from '../IconText';

const STUB_ITEMS: PendingGmailExpenseDto[] = [
  { id: 'stub-pending-1', gmailMessageId: 'stub-msg-1', vaultId: 'stub-vault', vaultName: 'Main Vault', subject: 'Card purchase alert', guidanceHint: 'Amount after "BDT", merchant after "at"' },
  { id: 'stub-pending-2', gmailMessageId: 'stub-msg-2', vaultId: 'stub-vault', vaultName: 'Main Vault', subject: null, guidanceHint: null },
];

// Port of packages/ui/src/components/pending-expenses/PendingExpensesPanel.tsx. Hidden when the queue is empty.
export function PendingExpensesPanel() {
  const [items, setItems] = useState(STUB_ITEMS);
  const [selected, setSelected] = useState<PendingGmailExpenseDto | null>(null);

  if (items.length === 0) return null;

  return (
    <>
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

      {selected ? <PendingExpenseDetailSheet item={selected} onResolved={(id) => setItems((prev) => prev.filter((item) => item.id !== id))} onClose={() => setSelected(null)} /> : null}
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
