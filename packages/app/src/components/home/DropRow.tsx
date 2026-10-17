import type { OccurrenceDto, TransactionDto } from '@expense-tracker/shared';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { formatCurrency, formatDate, formatTime } from '../../lib/formatters';
import { toPixelIcon } from '../../lib/iconMapper';
import { color, font, shadow, space, text } from '../../theme';
import { Badge } from '../Badge';
import { PixelIcon } from '../PixelIcon';
import { TagChips, VaultChip } from './TagChips';

type Drop = Pick<TransactionDto, 'type' | 'tags' | 'vault' | 'title'>;

const iconName = (d: Drop): string => (d.type === 'expense' ? d.tags[0]?.icon || d.vault?.icon || 'ShoppingCart' : d.vault?.icon || 'Coins');
const category = (d: Drop): string => d.tags[0]?.name || (d.type === 'income' ? 'Income' : 'Expense');
const title = (d: Drop): string => d.title || (d.type === 'income' ? 'Unnamed Income' : 'Unnamed Expense');

function DropIcon({ drop, ghost }: { drop: Drop; ghost?: boolean }) {
  const tagBg = drop.tags[0]?.backgroundColor;
  const fallback = drop.type === 'income' ? styles.iconIncome : styles.iconExpense;
  return (
    <View style={[styles.icon, ghost && styles.iconGhost, tagBg ? { backgroundColor: tagBg } : fallback]}>
      <PixelIcon name={toPixelIcon(iconName(drop))} size={ms(22)} />
    </View>
  );
}

function DropBody({ drop, ghost }: { drop: Drop; ghost?: boolean }) {
  return (
    <View style={styles.body}>
      <Text style={[styles.title, ghost && styles.ghostText]} numberOfLines={1}>
        {title(drop)}
      </Text>
      {drop.tags.length ? (
        <TagChips tags={drop.tags} muted={ghost} />
      ) : (
        <Text style={[styles.category, ghost && styles.ghostText]} numberOfLines={1}>
          {category(drop)}
        </Text>
      )}
      {drop.vault?.name ? <VaultChip name={drop.vault.name} dashed={ghost} /> : null}
    </View>
  );
}

const amountText = (d: Pick<TransactionDto, 'type' | 'amount'>): string => `${d.type === 'income' ? '+' : '-'}${formatCurrency(d.amount)}`;

export const TransactionRow = memo(function TransactionRow({ tx, onPress }: { tx: TransactionDto; onPress: (tx: TransactionDto) => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${title(tx)}`} onPress={() => onPress(tx)} style={({ pressed }) => [styles.row, styles.committed, pressed && styles.pressed]}>
      <DropIcon drop={tx} />
      <DropBody drop={tx} />
      <View style={styles.side}>
        <Text style={[styles.amount, tx.type === 'income' ? styles.income : styles.expense]}>{amountText(tx)}</Text>
        {tx.isTransfer ? <Badge label="Transfer" variant="tertiary" style={styles.badge} /> : null}
        <Text style={styles.meta}>{formatDate(tx.date)}</Text>
        <Text style={styles.meta}>{formatTime(tx.updatedAt)}</Text>
      </View>
    </Pressable>
  );
});

interface OccurrenceRowProps {
  occ: OccurrenceDto;
  isApplying: boolean;
  onApply: (occ: OccurrenceDto) => void;
  onSkip: (occ: OccurrenceDto) => void;
}

// Ghost entry for a recurring quest occurrence that is not applied or skipped yet.
export const OccurrenceRow = memo(function OccurrenceRow({ occ, isApplying, onApply, onSkip }: OccurrenceRowProps) {
  return (
    <View style={[styles.row, styles.ghost]}>
      <DropIcon drop={occ} ghost />
      <DropBody drop={occ} ghost />
      <View style={styles.side}>
        <Text style={[styles.amount, styles.ghostText, occ.type === 'income' ? styles.income : styles.expense]}>{amountText(occ)}</Text>
        <Text style={styles.meta}>{formatDate(occ.date)}</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isApplying }}
            disabled={isApplying}
            hitSlop={10}
            onPress={() => onApply(occ)}
            style={({ pressed }) => [styles.applyButton, pressed && styles.pressed, isApplying && styles.disabled]}
          >
            <Text style={styles.applyLabel}>{isApplying ? 'Applying…' : 'Apply'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Discard ghost entry"
            accessibilityState={{ disabled: isApplying }}
            disabled={isApplying}
            hitSlop={10}
            onPress={() => onSkip(occ)}
            style={({ pressed }) => [styles.skipButton, pressed && styles.pressed, isApplying && styles.disabled]}
          >
            <PixelIcon name="X" size={ms(14)} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: ms(space[4]), padding: ms(space[3]), borderWidth: ms(4) },
  committed: { backgroundColor: color.bg, borderColor: color.border, boxShadow: shadow.card },
  ghost: { backgroundColor: color.bg, borderStyle: 'dashed', borderColor: color.outlineVariant },
  pressed: { transform: [{ translateY: 1 }] },
  disabled: { opacity: 0.5 },
  icon: { width: ms(40), height: ms(40), alignItems: 'center', justifyContent: 'center', borderWidth: ms(2), borderColor: color.border },
  iconGhost: { borderStyle: 'dashed', borderColor: color.outline, opacity: 0.5 },
  iconIncome: { backgroundColor: color.primaryContainer },
  iconExpense: { backgroundColor: color.errorContainer },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: font.bodyBold, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurface },
  category: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant },
  ghostText: { opacity: 0.7 },
  side: { alignItems: 'flex-end', gap: ms(space[1]) },
  badge: { alignSelf: 'flex-end', paddingVertical: 0 },
  amount: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16) },
  income: { color: color.primary },
  expense: { color: color.error },
  meta: { fontFamily: font.body, fontSize: ms(10), lineHeight: ms(14), color: color.outline },
  actions: { flexDirection: 'row', alignItems: 'center', gap: ms(space[1]) },
  applyButton: { backgroundColor: color.primary, borderWidth: ms(2), borderColor: color.border, paddingHorizontal: ms(space[2]), height: ms(26), justifyContent: 'center' },
  applyLabel: { fontFamily: font.mono, fontSize: ms(10), color: color.onPrimary, textTransform: 'uppercase' },
  skipButton: { width: ms(26), height: ms(26), alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg, borderWidth: ms(2), borderColor: color.border },
});
