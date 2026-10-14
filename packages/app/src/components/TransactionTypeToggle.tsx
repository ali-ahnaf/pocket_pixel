import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space, text } from '../theme';

export interface TransactionTypeToggleProps {
  isExpense: boolean;
  onChange: (isExpense: boolean) => void;
}

export function TransactionTypeToggle({ isExpense, onChange }: TransactionTypeToggleProps) {
  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      <Pressable accessibilityRole="radio" accessibilityState={{ checked: isExpense }} onPress={() => onChange(true)} style={[styles.option, isExpense ? styles.expenseActive : styles.inactive]}>
        <Text style={[styles.label, isExpense ? styles.expenseLabel : styles.inactiveLabel]}>↘ Expense</Text>
      </Pressable>
      <Pressable accessibilityRole="radio" accessibilityState={{ checked: !isExpense }} onPress={() => onChange(false)} style={[styles.option, !isExpense ? styles.incomeActive : styles.inactive]}>
        <Text style={[styles.label, !isExpense ? styles.incomeLabel : styles.inactiveLabel]}>↗ Income</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: ms(space[1]), padding: ms(space[1]), backgroundColor: color.border, borderWidth: ms(4), borderColor: color.border },
  option: { flex: 1, minHeight: ms(48), alignItems: 'center', justifyContent: 'center', paddingHorizontal: ms(space[4]) },
  expenseActive: { backgroundColor: color.errorContainer, borderWidth: ms(4), borderColor: color.border, boxShadow: shadow.toggleActive },
  incomeActive: { backgroundColor: color.primaryContainer, borderWidth: ms(4), borderColor: color.border, boxShadow: shadow.toggleActive },
  inactive: { backgroundColor: color.surfaceLow },
  label: { fontFamily: font.bodyBold, fontSize: ms(text.bodyLg.fontSize) },
  expenseLabel: { color: color.onErrorContainer },
  incomeLabel: { color: color.onPrimaryContainer },
  inactiveLabel: { color: color.outline },
});
