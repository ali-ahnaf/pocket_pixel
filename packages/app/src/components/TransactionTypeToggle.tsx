import { Pressable, StyleSheet, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, shadow, space } from '../theme';
import { PixelIcon } from './PixelIcon';

export interface TransactionTypeToggleProps {
  isExpense: boolean;
  onChange: (isExpense: boolean) => void;
  /** Shows a third Transfer option. When set, `isTransfer` overrides the Expense / Income selection. */
  onSelectTransfer?: () => void;
  isTransfer?: boolean;
}

export function TransactionTypeToggle({ isExpense, onChange, onSelectTransfer, isTransfer = false }: TransactionTypeToggleProps) {
  const expense = isExpense && !isTransfer;
  const income = !isExpense && !isTransfer;
  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel="Expense"
        accessibilityState={{ checked: expense }}
        onPress={() => onChange(true)}
        style={[styles.option, expense ? styles.expenseActive : styles.inactive]}
      >
        <PixelIcon name="ArrowDownRight" size={ms(18)} />
      </Pressable>
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel="Income"
        accessibilityState={{ checked: income }}
        onPress={() => onChange(false)}
        style={[styles.option, income ? styles.incomeActive : styles.inactive]}
      >
        <PixelIcon name="ArrowUpRight" size={ms(18)} />
      </Pressable>
      {onSelectTransfer && (
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel="Transfer"
          accessibilityState={{ checked: isTransfer }}
          onPress={onSelectTransfer}
          style={[styles.option, isTransfer ? styles.transferActive : styles.inactive]}
        >
          <PixelIcon name="ArrowLeftRight" size={ms(18)} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: ms(space[1]), padding: ms(space[1]), backgroundColor: color.border, borderWidth: ms(4), borderColor: color.border },
  option: { flex: 1, minHeight: ms(48), flexDirection: 'row', gap: ms(space[1]), alignItems: 'center', justifyContent: 'center', paddingHorizontal: ms(space[4]) },
  expenseActive: { backgroundColor: color.errorContainer, borderWidth: ms(4), borderColor: color.border, boxShadow: shadow.toggleActive },
  incomeActive: { backgroundColor: color.primaryContainer, borderWidth: ms(4), borderColor: color.border, boxShadow: shadow.toggleActive },
  transferActive: { backgroundColor: color.tertiaryContainer, borderWidth: ms(4), borderColor: color.border, boxShadow: shadow.toggleActive },
  inactive: { backgroundColor: color.surfaceLow },
});
