import type { DebtDto } from '@expense-tracker/shared';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { formatCurrency } from '../../lib/formatters';
import { color, font, space, text } from '../../theme';
import { Button } from '../Button';
import { Card } from '../Card';
import { PixelIcon } from '../PixelIcon';
import { IconText } from '../IconText';

/** YYYY-MM-DD to DD/MM/YYYY, as the web debts page shows due dates. */
export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
}

export interface DebtRowProps {
  debt: DebtDto;
  onEdit: (debt: DebtDto) => void;
  onApply: (debt: DebtDto) => void;
  onDiscard: (debt: DebtDto) => void;
}

export const DebtRow = memo(function DebtRow({ debt, onEdit, onApply, onDiscard }: DebtRowProps) {
  const isIncome = debt.type === 'income';

  return (
    <Card style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${debt.title}`} onPress={() => onEdit(debt)} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <View style={[styles.iconBox, isIncome ? styles.iconIncome : styles.iconExpense]}>
          <PixelIcon name={isIncome ? 'ArrowUpRight' : 'ArrowDownRight'} size={ms(28)} />
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.title}>
              {debt.title}
            </Text>
            {debt.completed ? (
              <View style={[styles.mark, styles.markDone]}>
                <PixelIcon name="Check" size={ms(14)} />
              </View>
            ) : null}
            {debt.discarded ? (
              <View style={[styles.mark, styles.markDiscarded]}>
                <PixelIcon name="X" size={ms(14)} />
              </View>
            ) : null}
          </View>
          <Text style={[styles.caps, isIncome ? styles.amountIncome : styles.amountExpense]}>
            {formatCurrency(debt.amount)} · {debt.type}
          </Text>
          {debt.dueDate ? (
            <IconText icon="Calendar" iconSize={14} style={[styles.caps, styles.due]}>
              Due {formatDueDate(debt.dueDate)}
            </IconText>
          ) : null}
          {debt.notes ? (
            <Text numberOfLines={1} style={styles.notes}>
              {debt.notes}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {!debt.completed && !debt.discarded ? (
        <View style={styles.actions}>
          <Button label="Apply" icon="Check" size="sm" onPress={() => onApply(debt)} />
          <Button label="Discard" variant="danger" size="sm" onPress={() => onDiscard(debt)} />
        </View>
      ) : null}
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { padding: ms(space[3]), gap: ms(space[3]) },
  main: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]) },
  pressed: { opacity: 0.7 },
  iconBox: { width: ms(48), height: ms(48), alignItems: 'center', justifyContent: 'center', borderWidth: ms(4), borderColor: color.border },
  iconIncome: { backgroundColor: color.primaryContainer },
  iconExpense: { backgroundColor: color.errorContainer },
  info: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]) },
  title: { flexShrink: 1, fontFamily: font.heading, fontSize: ms(20), lineHeight: ms(26), color: color.onSurface },
  mark: { borderWidth: ms(2), paddingHorizontal: ms(space[1]), paddingVertical: ms(2) },
  markDone: { borderColor: color.primary },
  markDiscarded: { borderColor: color.error },
  caps: { fontFamily: font.mono, fontSize: ms(11), lineHeight: ms(16), textTransform: 'uppercase' },
  amountIncome: { color: color.primary },
  amountExpense: { color: color.error },
  due: { color: color.onSurfaceVariant, marginTop: ms(2) },
  notes: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant, marginTop: ms(2) },
  actions: { flexDirection: 'row', gap: ms(space[2]) },
});
