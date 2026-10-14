import type { RecurringDto } from '@expense-tracker/shared';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { formatCurrency } from '../../lib/formatters';
import { color, font, shadow, space, text } from '../../theme';
import { Card } from '../Card';
import { IconButton } from './IconButton';
import { PixelIcon } from '../PixelIcon';
import { IconText } from '../IconText';

export interface QuestRowProps {
  quest: RecurringDto;
  onEdit: (quest: RecurringDto) => void;
  onDelete: (quest: RecurringDto) => void;
}

// One recurring quest card of the profile list.
export const QuestRow = memo(function QuestRow({ quest, onEdit, onDelete }: QuestRowProps) {
  const isExpense = quest.type === 'expense';
  const tagNames = quest.tags.map((tag) => tag.name);
  const title = quest.title || '';

  return (
    <Card style={[styles.card, isExpense ? styles.cardExpense : styles.cardIncome]}>
      <View style={[styles.corner, isExpense ? styles.cornerExpense : styles.cornerIncome]}>
        <PixelIcon name={isExpense ? 'ArrowDownRight' : 'ArrowUpRight'} size={ms(18)} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{tagNames.join(', ')}</Text>
      <View style={styles.amountBox}>
        <Text style={[styles.amount, isExpense ? styles.expense : styles.income]}>
          {isExpense ? '-' : '+'} {formatCurrency(Number(quest.amount))}
        </Text>
        <View style={styles.frequency}>
          <IconText icon="Calendar" iconSize={14} style={styles.frequencyText}>
            {quest.interval.charAt(0).toUpperCase() + quest.interval.slice(1)}
          </IconText>
        </View>
      </View>
      <View style={styles.bottom}>
        <View style={[styles.category, isExpense ? styles.categoryExpense : styles.categoryIncome]}>
          <Text style={[styles.categoryText, isExpense ? styles.onTertiary : styles.onSecondary]} numberOfLines={1}>
            #{tagNames[0] || 'Uncategorized'}
          </Text>
        </View>
        <View style={styles.buttons}>
          <IconButton icon="Pencil" label={`Edit ${title}`} onPress={() => onEdit(quest)} />
          <IconButton icon="Trash" label={`Delete ${title}`} variant="danger" onPress={() => onDelete(quest)} />
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { padding: ms(space[4]), overflow: 'hidden' },
  cardExpense: { borderColor: color.errorContainer },
  cardIncome: { borderColor: color.primaryContainer },
  corner: { position: 'absolute', top: 0, right: 0, padding: ms(6), borderLeftWidth: ms(4), borderBottomWidth: ms(4), borderColor: color.border },
  cornerExpense: { backgroundColor: color.error },
  cornerIncome: { backgroundColor: color.primary },
  title: { fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight), color: color.onSurface, marginTop: ms(space[2]), marginRight: ms(space[8]) },
  description: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant, marginBottom: ms(space[4]) },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(space[2]),
    backgroundColor: color.bg,
    borderWidth: ms(4),
    borderColor: color.border,
    padding: ms(space[2]),
    marginBottom: ms(space[4]),
    boxShadow: shadow.card,
  },
  amount: { flexShrink: 1, fontFamily: font.bodyBold, fontSize: ms(text.bodyLg.fontSize) },
  expense: { color: color.error },
  income: { color: color.primary },
  frequency: { backgroundColor: color.surfaceHigh, borderWidth: ms(4), borderColor: color.border, paddingHorizontal: ms(space[2]), paddingVertical: ms(space[1]) },
  frequencyText: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.onSurfaceVariant },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ms(space[2]) },
  category: { flexShrink: 1, borderWidth: ms(4), borderColor: color.border, paddingHorizontal: ms(space[2]), paddingVertical: ms(space[1]) },
  categoryExpense: { backgroundColor: color.tertiaryContainer },
  categoryIncome: { backgroundColor: color.secondaryContainer },
  categoryText: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize) },
  onTertiary: { color: color.onTertiaryContainer },
  onSecondary: { color: color.onSecondaryContainer },
  buttons: { flexDirection: 'row', gap: ms(space[2]) },
});
